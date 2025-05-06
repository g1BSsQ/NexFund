<?php
// Thiết lập header cho API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Max-Age: 86400');

// Xử lý yêu cầu OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Hàm ghi log để debug
function logError($message) {
    $logFile = 'C:/xampp1/htdocs/danofund/api/api_error.log';
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

if (!$input || !isset($input['fundId'])) {
    $errorMsg = "Dữ liệu đầu vào không hợp lệ hoặc thiếu fundId";
    logError($errorMsg);
    http_response_code(400);
    echo json_encode(["error" => $errorMsg]);
    exit;
}

// Kiểm tra và làm sạch fundId
$fundId = trim($input['fundId']);
if (empty($fundId) || !preg_match('/^[a-zA-Z0-9-_]+$/', $fundId)) {
    $errorMsg = "fundId không hợp lệ: $fundId";
    logError($errorMsg);
    http_response_code(400);
    echo json_encode(["error" => "fundId không hợp lệ"]);
    exit;
}

try {
    // 1. Lấy thông tin quỹ - loại bỏ current và total
    $stmt = $db->prepare(
        "SELECT id, name, description, longDescription, category, 
                members, proposals, transactions, startDate, creator, status,
                votingMechanism, proposalEligibility, approvalThreshold, 
                minContribution, cooldownPeriod, visibility
         FROM Funds
         WHERE id = :fundId"
    );
    $stmt->bindParam(':fundId', $fundId, PDO::PARAM_STR);
    $stmt->execute();
    $fund = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$fund) {
        $errorMsg = "Không tìm thấy quỹ với fundId: $fundId";
        logError($errorMsg);
        http_response_code(404);
        echo json_encode(["error" => "Không tìm thấy quỹ"]);
        exit;
    }

    // 2. Tính số đề xuất đã duyệt
    $stmt = $db->prepare(
        "SELECT COUNT(*) as count
         FROM Proposals
         WHERE fundId = :fundId AND status = 'approved'"
    );
    $stmt->bindParam(':fundId', $fundId, PDO::PARAM_STR);
    $stmt->execute();
    $approvedProposals = (int) $stmt->fetchColumn();

    // 3. Tính số thành viên tích cực - không còn dựa vào cột contribution
    // Giả sử tất cả thành viên đều tích cực
    $activeMembers = (int) $fund['members'];

    // 4. Tính thời gian hoạt động
    $startDate = new DateTime($fund['startDate']);
    $currentDate = new DateTime();
    $interval = $startDate->diff($currentDate);
    $daysActive = $interval->days;

    // 5. Tính số đề xuất đang hoạt động của quỹ
    $stmt = $db->prepare(
        "SELECT COUNT(*) as activeProposals
         FROM Proposals
         WHERE fundId = :fundId AND status IN ('pending', 'active')"
    );
    $stmt->bindParam(':fundId', $fundId, PDO::PARAM_STR);
    $stmt->execute();
    $activeProposals = (int) $stmt->fetchColumn();

    // Chuẩn hóa dữ liệu quỹ - loại bỏ current và total
    $fundData = [
        "id" => $fund['id'],
        "name" => $fund['name'],
        "description" => $fund['description'],
        "longDescription" => $fund['longDescription'],
        // Đã loại bỏ current và total
        "category" => $fund['category'],
        "members" => (int) $fund['members'],
        "proposals" => (int) $fund['proposals'],
        "transactions" => (int) $fund['transactions'],
        "startDate" => $fund['startDate'],
        "creator" => $fund['creator'],
        "address" => $fund['id'],  // address giữ nguyên vì cần cho việc truy vấn blockchain
        "status" => $fund['status'],
        "approvedProposals" => $approvedProposals,
        "activeMembers" => $activeMembers,
        "daysActive" => $daysActive,
        "votingMechanism" => $fund['votingMechanism'],
        "proposalEligibility" => $fund['proposalEligibility'],
        "approvalThreshold" => (int) $fund['approvalThreshold'],
        "minContribution" => (float) $fund['minContribution'],
        "cooldownPeriod" => (int) $fund['cooldownPeriod'],
        "visibility" => $fund['visibility'],
        "activeProposals" => $activeProposals
    ];

    // Trả về dữ liệu
    http_response_code(200);
    echo json_encode($fundData);

} catch (Exception $e) {
    $errorMsg = "Lỗi khi lấy dữ liệu quỹ với fundId $fundId: " . $e->getMessage();
    logError($errorMsg);
    http_response_code(500);
    echo json_encode(["error" => "Không thể lấy dữ liệu: " . $e->getMessage()]);
    exit;
}
?>