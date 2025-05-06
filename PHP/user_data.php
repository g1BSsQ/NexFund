<?php
// Tắt hiển thị lỗi trực tiếp trên trang
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// Đảm bảo đầu ra là JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function logError($message) {
    $logFile = 'C:/xampp/htdocs/danofund/api/api_error.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

// Kết nối đến cơ sở dữ liệu MySQL
$host = "localhost";
$dbname = "danofund";
$user = "root";
$password = "";

try {
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    $errorMsg = "Kết nối cơ sở dữ liệu thất bại: " . $e->getMessage();
    logError($errorMsg);
    http_response_code(500);
    echo json_encode(["error" => $errorMsg]);
    exit;
}

// Nhận dữ liệu từ yêu cầu POST
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['user_address'])) {
    $errorMsg = "Dữ liệu đầu vào không hợp lệ hoặc thiếu user_address";
    logError($errorMsg);
    http_response_code(400);
    echo json_encode(["error" => $errorMsg]);
    exit;
}

$user_address = trim($input['user_address']);
if (empty($user_address)) {
    $errorMsg = "user_address không hợp lệ";
    logError($errorMsg);
    http_response_code(400);
    echo json_encode(["error" => $errorMsg]);
    exit;
}

try {
    $result = [];

    // 1. Thông tin hồ sơ (profile)
    // Ngày tham gia (lấy từ bản ghi sớm nhất trong Members)
    $stmt = $db->prepare(
        "SELECT MIN(joinDate) as join_date
         FROM Members
         WHERE address = ?"
    );
    $stmt->execute([$user_address]);
    $joinDateResult = $stmt->fetch(PDO::FETCH_ASSOC);
    $join_date = $joinDateResult['join_date'] ? date('d/m/Y', strtotime($joinDateResult['join_date'])) : "Chưa tham gia";

    // Quỹ quản lý (đếm số quỹ mà user là creator)
    $stmt = $db->prepare(
        "SELECT COUNT(*) as count
         FROM Funds
         WHERE creator = ?"
    );
    $stmt->execute([$user_address]);
    $fund_count = (int) ($stmt->fetchColumn() ?: 0);

    // Đề xuất đã tạo
    $stmt = $db->prepare(
        "SELECT COUNT(*) as count
         FROM Proposals
         WHERE creator = ?"
    );
    $stmt->execute([$user_address]);
    $proposal_count = (int) ($stmt->fetchColumn() ?: 0);

    // Vai trò
    $stmt = $db->prepare(
        "SELECT COUNT(*) as creator_count
         FROM Funds
         WHERE creator = ?"
    );
    $stmt->execute([$user_address]);
    $is_creator = $stmt->fetchColumn() > 0;

    $stmt = $db->prepare(
        "SELECT COUNT(*) as member_count
         FROM Members
         WHERE address = ?"
    );
    $stmt->execute([$user_address]);
    $is_member = $stmt->fetchColumn() > 0;

    $roles = [];
    if ($is_creator) $roles[] = "Quản trị viên";
    if ($is_member) $roles[] = "Thành viên";
    $role_string = !empty($roles) ? implode(", ", $roles) : "Không có vai trò";

    $result['profile'] = [
        "join_date" => $join_date,
        "fund_count" => $fund_count,
        "proposal_count" => $proposal_count,
        "roles" => $role_string
    ];

    // 2. Danh sách quỹ (funds) - đã loại bỏ current và total
    $stmt = $db->prepare(
        "SELECT id, name, description, category
         FROM Funds
         WHERE creator = ?"
    );
    $stmt->execute([$user_address]);
    $funds = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $funds_list = array_map(function ($fund) {
        return [
            "id" => $fund['id'],
            "name" => $fund['name'],
            "description" => $fund['description'] ?? "Không có mô tả",
            "category" => $fund['category'] ?? "Không xác định",
            "role" => "Quản trị viên"
        ];
    }, $funds);

    $result['funds'] = $funds_list;

    // 3. Danh sách lời mời (invitations)
    $stmt = $db->prepare(
        "SELECT id, fundId, senderAddress, message, date 
         FROM Invitations 
         WHERE receiverAddress = ?"
    );
    $stmt->execute([$user_address]);
    $invitations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $invitationsData = array_map(function ($inv) use ($db) {
        $stmt = $db->prepare("SELECT name FROM Funds WHERE id = :fundId");
        $stmt->bindParam(':fundId', $inv['fundId'], PDO::PARAM_STR);
        $stmt->execute();
        $fund = $stmt->fetch(PDO::FETCH_ASSOC);
        $fundName = $fund ? $fund['name'] : "Quỹ không xác định";

        return [
            "id" => $inv['id'],
            "fundId" => $inv['fundId'],
            "fundName" => $fundName,
            "senderAddress" => $inv['senderAddress'],
            "message" => $inv['message'] ?? "Không có thông điệp",
            "date" => $inv['date'] ?? date('Y-m-d H:i:s')
        ];
    }, $invitations);

    $result['invitations'] = $invitationsData;

    // 4. Danh sách đề xuất (proposals)
    $stmt = $db->prepare(
        "SELECT p.id, p.fundId, p.title, p.description, p.amount, p.votes, p.status, p.deadline, f.id as fundId, f.name as fundName
         FROM Proposals p
         JOIN Funds f ON p.fundId = f.id
         WHERE p.creator = ?"
    );
    $stmt->execute([$user_address]);
    $proposals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $proposalsData = array_map(function ($proposal) {
        return [
            "id" => $proposal['id'],
            "title" => $proposal['title'] ?? "Không có tiêu đề",
            "description" => $proposal['description'] ?? "Không có mô tả",
            "fund" => [
                "id" => $proposal['fundId'],
                "name" => $proposal['fundName'] ?? "Quỹ không xác định"
            ],
            "amount" => (float) ($proposal['amount'] ?: 0),
            "votes" => (int) ($proposal['votes'] ?: 0),
            "status" => $proposal['status'] ?? "pending",
            "date" => date('Y-m-d', strtotime($proposal['deadline'] ?? 'now')) // Sử dụng deadline làm thời gian tham chiếu
        ];
    }, $proposals);

    $result['proposals'] = $proposalsData;

    // 5. Dữ liệu hoạt động (activity) - 6 tháng gần nhất
    $activityData = [];
    $currentMonth = (int) date('m');
    $currentYear = (int) date('Y');

    for ($i = 5; $i >= 0; $i--) {
        $month = $currentMonth - $i;
        $year = $currentYear;
        if ($month <= 0) {
            $month += 12;
            $year--;
        }

        $startDate = sprintf("%d-%02d-01 00:00:00", $year, $month);
        $endDate = sprintf("%d-%02d-31 23:59:59", $year, $month);

        // Đếm số đề xuất trong tháng (dựa trên deadline)
        $stmt = $db->prepare(
            "SELECT COUNT(*) as count
             FROM Proposals
             WHERE creator = ? AND deadline BETWEEN ? AND ?"
        );
        $stmt->execute([$user_address, $startDate, $endDate]);
        $proposals_count = (int) ($stmt->fetchColumn() ?: 0);

        // Đếm số đóng góp (giả sử bảng Contributions không tồn tại)


        $activityData[] = [
            "name" => "T" . $month,
            "proposals" => $proposals_count,
        ];
    }

    $result['activity'] = $activityData;

    // Trả về tất cả dữ liệu
    http_response_code(200);
    echo json_encode($result);

} catch (Exception $e) {
    $errorMsg = "Không thể lấy dữ liệu: " . $e->getMessage();
    logError($errorMsg);
    http_response_code(500);
    echo json_encode(["error" => $errorMsg]);
    exit;
}
?>