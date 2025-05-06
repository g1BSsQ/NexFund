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

if (!$input || !isset($input['invitationId'])) {
    $errorMsg = "Dữ liệu đầu vào không hợp lệ hoặc thiếu invitationId";
    logError($errorMsg);
    http_response_code(400);
    echo json_encode(["error" => $errorMsg]);
    exit;
}

$invitationId = trim($input['invitationId']);
if (empty($invitationId) || !is_numeric($invitationId)) {
    $errorMsg = "invitationId không hợp lệ";
    logError($errorMsg);
    http_response_code(400);
    echo json_encode(["error" => $errorMsg]);
    exit;
}

try {
    $stmt = $db->prepare("DELETE FROM Invitations WHERE id = :invitationId");
    $stmt->bindParam(':invitationId', $invitationId, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        $errorMsg = "Không tìm thấy lời mời với invitationId: $invitationId";
        logError($errorMsg);
        http_response_code(404);
        echo json_encode(["error" => $errorMsg]);
        exit;
    }

    http_response_code(200);
    echo json_encode(["message" => "Lời mời đã được xóa"]);
} catch (Exception $e) {
    $errorMsg = "Lỗi khi xóa lời mời: " . $e->getMessage();
    logError($errorMsg);
    http_response_code(500);
    echo json_encode(["error" => $errorMsg]);
    exit;
}
?>