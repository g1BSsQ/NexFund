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

if (!$input || !isset($input['fundId']) || !isset($input['address'])) {
    $errorMsg = "Dữ liệu đầu vào không hợp lệ hoặc thiếu trường bắt buộc";
    logError($errorMsg);
    http_response_code(400);
    echo json_encode(["error" => $errorMsg]);
    exit;
}

$fundId = trim($input['fundId']);
$address = trim($input['address']);

if (empty($fundId) || !preg_match('/^[a-zA-Z0-9-_]+$/', $fundId) || empty($address)) {
    $errorMsg = "fundId hoặc address không hợp lệ";
    logError($errorMsg);
    http_response_code(400);
    echo json_encode(["error" => $errorMsg]);
    exit;
}

// Kiểm tra quỹ có tồn tại không
$stmt = $db->prepare("SELECT visibility FROM Funds WHERE id = :fundId");
$stmt->bindParam(':fundId', $fundId, PDO::PARAM_STR);
$stmt->execute();
$fund = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$fund) {
    $errorMsg = "Không tìm thấy quỹ với fundId: $fundId";
    logError($errorMsg);
    http_response_code(404);
    echo json_encode(["error" => $errorMsg]);
    exit;
}

// Kiểm tra xem người dùng đã là thành viên chưa
$stmt = $db->prepare("SELECT COUNT(*) FROM Members WHERE fundId = :fundId AND address = :address");
$stmt->bindParam(':fundId', $fundId, PDO::PARAM_STR);
$stmt->bindParam(':address', $address, PDO::PARAM_STR);
$stmt->execute();
if ($stmt->fetchColumn() > 0) {
    $errorMsg = "Người dùng đã là thành viên của quỹ này";
    logError($errorMsg);
    http_response_code(400);
    echo json_encode(["error" => $errorMsg]);
    exit;
}

try {
    $db->beginTransaction();

    // Thêm thành viên vào quỹ với joinDate là thời gian hiện tại
    $stmt = $db->prepare("INSERT INTO Members (fundId, address, joinDate) VALUES (:fundId, :address, NOW())");
    $stmt->execute([
        ':fundId' => $fundId,
        ':address' => $address
    ]);

    // Cập nhật số lượng thành viên trong bảng Funds
    $stmt = $db->prepare("UPDATE Funds SET members = members + 1 WHERE id = :fundId");
    $stmt->bindParam(':fundId', $fundId, PDO::PARAM_STR);
    $stmt->execute();

    $db->commit();

    http_response_code(200);
    echo json_encode(["message" => "Đã tham gia quỹ thành công"]);
} catch (Exception $e) {
    $db->rollBack();
    $errorMsg = "Không thể tham gia quỹ: " . $e->getMessage();
    logError($errorMsg);
    http_response_code(500);
    echo json_encode(["error" => $errorMsg]);
    exit;
}
?>