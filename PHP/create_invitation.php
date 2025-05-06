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

if (!$input || !isset($input['fundId']) || !isset($input['senderAddress']) || !isset($input['receiverAddress']) || !isset($input['message'])) {
    $errorMsg = "Dữ liệu đầu vào không hợp lệ hoặc thiếu trường bắt buộc";
    logError($errorMsg);
    http_response_code(400);
    echo json_encode(["error" => $errorMsg]);
    exit;
}

$fundId = trim($input['fundId']);
$senderAddress = trim($input['senderAddress']);
$receiverAddress = trim($input['receiverAddress']);
$message = trim($input['message']);

if (empty($fundId) || !preg_match('/^[a-zA-Z0-9-_]+$/', $fundId) || empty($senderAddress) || empty($receiverAddress)) {
    $errorMsg = "fundId, senderAddress hoặc receiverAddress không hợp lệ";
    logError($errorMsg);
    http_response_code(400);
    echo json_encode(["error" => $errorMsg]);
    exit;
}

// Kiểm tra quỹ có tồn tại và là private
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

if ($fund['visibility'] === "public" && $senderAddress !== $receiverAddress) {
    // Cho phép gửi lời mời cho quỹ công khai, nhưng không yêu cầu kiểm tra thành viên
} elseif ($fund['visibility'] === "private") {
    // Kiểm tra sender là thành viên của quỹ
    $stmt = $db->prepare("SELECT COUNT(*) FROM Members WHERE fundId = :fundId AND address = :senderAddress");
    $stmt->bindParam(':fundId', $fundId, PDO::PARAM_STR);
    $stmt->bindParam(':senderAddress', $senderAddress, PDO::PARAM_STR);
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $errorMsg = "Chỉ thành viên quỹ mới có thể gửi lời mời cho quỹ riêng tư";
        logError($errorMsg);
        http_response_code(403);
        echo json_encode(["error" => $errorMsg]);
        exit;
    }
}

try {
    $db->beginTransaction();

    $stmt = $db->prepare(
        "INSERT INTO Invitations (fundId, senderAddress, receiverAddress, message, date) 
         VALUES (:fundId, :senderAddress, :receiverAddress, :message, :date)"
    );
    $date = date('Y-m-d');
    $stmt->execute([
        ':fundId' => $fundId,
        ':senderAddress' => $senderAddress,
        ':receiverAddress' => $receiverAddress,
        ':message' => $message,
        ':date' => $date
    ]);

    $db->commit();

    http_response_code(200);
    echo json_encode(["message" => "Lời mời đã được gửi", "invitationId" => $db->lastInsertId()]);
} catch (Exception $e) {
    $db->rollBack();
    $errorMsg = "Không thể tạo lời mời: " . $e->getMessage();
    logError($errorMsg);
    http_response_code(500);
    echo json_encode(["error" => $errorMsg]);
    exit;
}
?>