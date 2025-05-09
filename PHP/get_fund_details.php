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
if (empty($input['fundId']) || !preg_match('/^[a-zA-Z0-9-_]+$/', trim($input['fundId']))) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing fundId']);
    exit;
}

$fundId = trim($input['fundId']);

try {
    // 1. Lấy thông tin quỹ
    $stmt = $db->prepare("
        SELECT 
          id, name, description, longDescription, category,
          members, proposals, transactions, startDate, creator, status,
          votingMechanism, proposalEligibility, approvalThreshold,
          minContribution, cooldownPeriod, visibility
        FROM Funds
        WHERE id = :fundId
    ");
    $stmt->execute([':fundId' => $fundId]);
    $fund = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$fund) {
        http_response_code(404);
        echo json_encode(['error' => 'Fund not found']);
        exit;
    }

    // 2. Đếm đề xuất đã duyệt
    $stmt = $db->prepare("
        SELECT COUNT(*) 
        FROM Proposals 
        WHERE fundId = :fundId AND status = 'approved'
    ");
    $stmt->execute([':fundId' => $fundId]);
    $approvedProposals = (int) $stmt->fetchColumn();

    // 3. Số thành viên tích cực (giả sử = total members)
    $activeMembers = (int) $fund['members'];

    // 4. Thời gian hoạt động
    $interval = (new DateTime($fund['startDate']))->diff(new DateTime());
    $daysActive = $interval->days;

    // 5. Đếm đề xuất đang hoạt động
    $stmt = $db->prepare("
        SELECT COUNT(*) 
        FROM Proposals 
        WHERE fundId = :fundId 
          AND status IN ('pending', 'active')
    ");
    $stmt->execute([':fundId' => $fundId]);
    $activeProposals = (int) $stmt->fetchColumn();

    // Chuẩn hóa dữ liệu trả về
    $fundData = [
        'id'                  => $fund['id'],
        'name'                => $fund['name'],
        'description'         => $fund['description'],
        'longDescription'     => $fund['longDescription'],
        'category'            => $fund['category'],
        'members'             => (int) $fund['members'],
        'proposals'           => (int) $fund['proposals'],
        'transactions'        => (int) $fund['transactions'],
        'startDate'           => $fund['startDate'],
        'creator'             => $fund['creator'],
        'address'             => $fund['id'],
        'status'              => $fund['status'],
        'approvedProposals'   => $approvedProposals,
        'activeMembers'       => $activeMembers,
        'daysActive'          => $daysActive,
        'votingMechanism'     => $fund['votingMechanism'],
        'proposalEligibility' => $fund['proposalEligibility'],
        'approvalThreshold'   => (int) $fund['approvalThreshold'],
        'minContribution'     => (float) $fund['minContribution'],
        'cooldownPeriod'      => (int) $fund['cooldownPeriod'],
        'visibility'          => $fund['visibility'],
        'activeProposals'     => $activeProposals
    ];

    echo json_encode($fundData);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Unable to retrieve fund details']);
    exit;
}
?>