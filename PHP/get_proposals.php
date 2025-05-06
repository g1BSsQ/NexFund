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
    $logFile = 'C:/xampp/htdocs/danofund/api/api_error.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

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

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['fundId'])) {
    $errorMsg = "Dữ liệu đầu vào không hợp lệ hoặc thiếu fundId";
    logError($errorMsg);
    http_response_code(400);
    echo json_encode(["error" => $errorMsg]);
    exit;
}

$fundId = trim($input['fundId']);
if (empty($fundId) || !preg_match('/^[a-zA-Z0-9-_]+$/', $fundId)) {
    $errorMsg = "fundId không hợp lệ: $fundId";
    logError($errorMsg);
    http_response_code(400);
    echo json_encode(["error" => "fundId không hợp lệ"]);
    exit;
}

try {
    $stmt = $db->prepare(
        "SELECT id, title, description, details, creator, amount, votes, status, deadline 
         FROM proposals 
         WHERE fundId = :fundId"
    );
    $stmt->bindParam(':fundId', $fundId, PDO::PARAM_STR);
    $stmt->execute();
    $proposals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $result = array_map(function($proposal) {
        return [
            "id" => $proposal['id'],
            "title" => $proposal['title'],
            "description" => $proposal['description'],
            "details" => $proposal['details'],
            "creator" => $proposal['creator'],
            "amount" => (float)$proposal['amount'],
            "votes" => (int)$proposal['votes'],
            "status" => $proposal['status'],
            "deadline" => $proposal['deadline']
        ];
    }, $proposals);

    http_response_code(200);
    echo json_encode($result);
} catch (Exception $e) {
    $errorMsg = "Lỗi khi lấy danh sách đề xuất: " . $e->getMessage();
    logError($errorMsg);
    http_response_code(500);
    echo json_encode(["error" => $errorMsg]);
    exit;
}
?>