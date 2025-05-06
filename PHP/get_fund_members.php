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

$fundId = trim($input['fundId']);
if (empty($fundId) || !preg_match('/^[a-zA-Z0-9-_]+$/', $fundId)) {
    $errorMsg = "fundId không hợp lệ: $fundId";
    logError($errorMsg);
    http_response_code(400);
    echo json_encode(["error" => "fundId không hợp lệ"]);
    exit;
}

try {
    // Lấy danh sách thành viên - đã loại bỏ cột contribution
    $stmt = $db->prepare(
        "SELECT id, fundId, address, role, joinDate 
         FROM Members 
         WHERE fundId = :fundId"
    );
    $stmt->bindParam(':fundId', $fundId, PDO::PARAM_STR);
    $stmt->execute();
    $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$members) {
        $errorMsg = "Không tìm thấy thành viên nào cho fundId: $fundId";
        logError($errorMsg);
        http_response_code(404);
        echo json_encode(["message" => "Không tìm thấy thành viên nào"]);
        exit;
    }

    // Chuẩn hóa dữ liệu thành viên - đã loại bỏ contribution
    $membersData = array_map(function ($member) {
        return [
            "id" => $member['id'],
            "address" => $member['address'],
            "role" => $member['role'], // Giữ nguyên role từ database
            "joinDate" => $member['joinDate']
        ];
    }, $members);

    http_response_code(200);
    echo json_encode($membersData);

} catch (Exception $e) {
    $errorMsg = "Lỗi khi lấy danh sách thành viên với fundId $fundId: " . $e->getMessage();
    logError($errorMsg);
    http_response_code(500);
    echo json_encode(["error" => "Không thể lấy danh sách thành viên: " . $e->getMessage()]);
    exit;
}
?>