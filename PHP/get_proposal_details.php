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

if (!$input || !isset($input['proposalId'])) {
    $errorMsg = "Dữ liệu đầu vào không hợp lệ hoặc thiếu proposalId";
    logError($errorMsg);
    http_response_code(400);
    echo json_encode(["error" => $errorMsg]);
    exit;
}

// Kiểm tra và làm sạch proposalId
$proposalId = trim($input['proposalId']);
if (empty($proposalId) || !preg_match('/^[a-zA-Z0-9-_]+$/', $proposalId)) {
    $errorMsg = "proposalId không hợp lệ: $proposalId";
    logError($errorMsg);
    http_response_code(400);
    echo json_encode(["error" => "proposalId không hợp lệ"]);
    exit;
}

try {
    // Lấy thông tin đề xuất
    $stmt = $db->prepare(
        "SELECT id, fundId, title, description, creator, amount, votes, status, 
                deadline, createdAt, attachments, details
         FROM Proposals
         WHERE id = :proposalId"
    );
    $stmt->bindParam(':proposalId', $proposalId, PDO::PARAM_STR);
    $stmt->execute();
    $proposal = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$proposal) {
        $errorMsg = "Không tìm thấy đề xuất với proposalId: $proposalId";
        logError($errorMsg);
        http_response_code(404);
        echo json_encode(["error" => "Không tìm thấy đề xuất"]);
        exit;
    }

    // Chuẩn hóa dữ liệu đề xuất
    $proposalData = [
        "id" => $proposal['id'],
        "fundId" => $proposal['fundId'],
        "title" => $proposal['title'],
        "description" => $proposal['description'],
        "creator" => $proposal['creator'],
        "amount" => (float) $proposal['amount'],
        "votes" => (int) $proposal['votes'],
        "status" => $proposal['status'],
        "deadline" => $proposal['deadline'],
        "createdAt" => $proposal['createdAt'],
        "attachments" => $proposal['attachments'], // Đã ở dạng JSON trong DB
        "details" => $proposal['details']
    ];

    // Trả về dữ liệu
    http_response_code(200);
    echo json_encode($proposalData);

} catch (Exception $e) {
    $errorMsg = "Lỗi khi lấy dữ liệu đề xuất với proposalId $proposalId: " . $e->getMessage();
    logError($errorMsg);
    http_response_code(500);
    echo json_encode(["error" => "Không thể lấy dữ liệu: " . $e->getMessage()]);
    exit;
}
?>