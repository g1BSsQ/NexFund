<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $db = new PDO(
        "mysql:host=localhost;dbname=danofund;charset=utf8",
        "root",
        "",
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (empty($input['user_address'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing user_address']);
    exit;
}

$user_address = trim($input['user_address']);

try {
    $result = [];

    // 1. Profile
    $stmt = $db->prepare(
        "SELECT MIN(joinDate) AS join_date
         FROM Members
         WHERE address = ?"
    );
    $stmt->execute([$user_address]);
    $join = $stmt->fetch(PDO::FETCH_ASSOC);
    $join_date = $join['join_date']
        ? date('d/m/Y', strtotime($join['join_date']))
        : "Chưa tham gia";

    $stmt = $db->prepare("SELECT COUNT(*) FROM Funds WHERE creator = ?");
    $stmt->execute([$user_address]);
    $fund_count = (int) $stmt->fetchColumn();

    $stmt = $db->prepare("SELECT COUNT(*) FROM Proposals WHERE creator = ?");
    $stmt->execute([$user_address]);
    $proposal_count = (int) $stmt->fetchColumn();

    $roles = [];
    if ($fund_count > 0) $roles[] = "Quản trị viên";

    $stmt = $db->prepare("SELECT COUNT(*) FROM Members WHERE address = ?");
    $stmt->execute([$user_address]);
    if ((int)$stmt->fetchColumn() > 0) $roles[] = "Thành viên";

    $result['profile'] = [
        'join_date'      => $join_date,
        'fund_count'     => $fund_count,
        'proposal_count' => $proposal_count,
        'roles'          => $roles ? implode(', ', $roles) : "Không có vai trò"
    ];

    // 2. Managed funds
    $stmt = $db->prepare(
        "SELECT id, name, description, category
         FROM Funds
         WHERE creator = ?"
    );
    $stmt->execute([$user_address]);
    $funds = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $result['funds'] = array_map(function($f) {
        return [
            'id'          => $f['id'],
            'name'        => $f['name'],
            'description' => $f['description'] ?: "Không có mô tả",
            'category'    => $f['category']    ?: "Không xác định",
            'role'        => "Quản trị viên"
        ];
    }, $funds);

    // 3. Invitations
    $stmt = $db->prepare(
        "SELECT i.id, i.fundId, f.name AS fundName, i.senderAddress, i.message, i.date
         FROM Invitations i
         LEFT JOIN Funds f ON i.fundId = f.id
         WHERE i.receiverAddress = ?"
    );
    $stmt->execute([$user_address]);
    $invs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $result['invitations'] = array_map(function($inv) {
        return [
            'id'            => $inv['id'],
            'fundId'        => $inv['fundId'],
            'fundName'      => $inv['fundName'] ?: "Quỹ không xác định",
            'senderAddress' => $inv['senderAddress'],
            'message'       => $inv['message'] ?: "Không có thông điệp",
            'date'          => $inv['date']
        ];
    }, $invs);

    // 4. Proposals by user
    $stmt = $db->prepare(
        "SELECT p.id, p.title, p.description, p.amount, p.votes, p.status, p.deadline,
                f.id AS fundId, f.name AS fundName
         FROM Proposals p
         JOIN Funds f ON p.fundId = f.id
         WHERE p.creator = ?"
    );
    $stmt->execute([$user_address]);
    $props = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $result['proposals'] = array_map(function($p) {
        return [
            'id'      => $p['id'],
            'title'   => $p['title']       ?: "Không có tiêu đề",
            'description'=> $p['description'] ?: "Không có mô tả",
            'fund'    => ['id'=>$p['fundId'],'name'=>$p['fundName']?:"Quỹ không xác định"],
            'amount'  => (float)$p['amount'],
            'votes'   => (int)$p['votes'],
            'status'  => $p['status'],
            'date'    => date('Y-m-d', strtotime($p['deadline']))
        ];
    }, $props);

    // 5. Activity last 6 months
    $activity = [];
    $m = (int)date('m'); $y = (int)date('Y');
    for ($i=5; $i>=0; $i--) {
        $mo = $m - $i; $yr=$y;
        if ($mo<=0) { $mo+=12; $yr--; }
        $start = sprintf("%04d-%02d-01", $yr, $mo);
        $end   = sprintf("%04d-%02d-31", $yr, $mo);
        $stmt = $db->prepare(
            "SELECT COUNT(*) FROM Proposals
             WHERE creator=? AND deadline BETWEEN ? AND ?"
        );
        $stmt->execute([$user_address, "$start 00:00:00", "$end 23:59:59"]);
        $cnt = (int)$stmt->fetchColumn();
        $activity[] = ['name'=>"T$mo",'proposals'=>$cnt];
    }
    $result['activity'] = $activity;

    echo json_encode($result);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error'=>'Unable to retrieve user data']);
    exit;
}
?>