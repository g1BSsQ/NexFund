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

// Kết nối cơ sở dữ liệu
$host     = "localhost";
$dbname   = "danofund";
$user     = "root";
$password = "";

try {
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

// Nhận và kiểm tra dữ liệu đầu vào
$input = json_decode(file_get_contents('php://input'), true);
if (
    !$input ||
    empty($input['fundId']) ||
    empty($input['address']) ||
    !preg_match('/^[a-zA-Z0-9-_]+$/', $input['fundId'])
) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid fundId or address"]);
    exit;
}

$fundId  = $input['fundId'];
$address = $input['address'];

try {
    $stmt = $db->prepare("
        SELECT COUNT(*) 
        FROM Members 
        WHERE fundId = :fundId 
          AND address = :address
    ");
    $stmt->bindParam(':fundId',  $fundId,  PDO::PARAM_STR);
    $stmt->bindParam(':address', $address, PDO::PARAM_STR);
    $stmt->execute();

    $isMember = $stmt->fetchColumn() > 0;
    echo json_encode(["isMember" => $isMember]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to check membership"]);
    exit;
}
?>