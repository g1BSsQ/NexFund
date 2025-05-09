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

// Kết nối đến cơ sở dữ liệu
try {
    $db = new PDO("mysql:host=localhost;dbname=danofund;charset=utf8", "root", "", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
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
    empty($input['senderAddress']) ||
    empty($input['receiverAddress']) ||
    !isset($input['message'])
) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid or missing fields"]);
    exit;
}

$fundId         = trim($input['fundId']);
$senderAddress  = trim($input['senderAddress']);
$receiverAddress= trim($input['receiverAddress']);
$message        = trim($input['message']);

if (
    !preg_match('/^[a-zA-Z0-9-_]+$/', $fundId) ||
    empty($senderAddress) ||
    empty($receiverAddress)
) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid fundId or addresses"]);
    exit;
}

// Kiểm tra quỹ tồn tại
$stmt = $db->prepare("SELECT visibility FROM Funds WHERE id = :fundId");
$stmt->bindParam(':fundId', $fundId, PDO::PARAM_STR);
$stmt->execute();
$fund = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$fund) {
    http_response_code(404);
    echo json_encode(["error" => "Fund not found"]);
    exit;
}

// Nếu quỹ riêng tư, kiểm tra sender là thành viên
if ($fund['visibility'] === "private") {
    $stmt = $db->prepare("
        SELECT COUNT(*) 
        FROM Members 
        WHERE fundId = :fundId 
          AND address = :senderAddress
    ");
    $stmt->bindParam(':fundId',        $fundId,         PDO::PARAM_STR);
    $stmt->bindParam(':senderAddress', $senderAddress,  PDO::PARAM_STR);
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        http_response_code(403);
        echo json_encode(["error" => "Only members can invite to this private fund"]);
        exit;
    }
}

// Tạo lời mời
try {
    $db->beginTransaction();
    $stmt = $db->prepare(
        "INSERT INTO Invitations 
         (fundId, senderAddress, receiverAddress, message, date) 
         VALUES (:fundId, :senderAddress, :receiverAddress, :message, :date)"
    );
    $today = date('Y-m-d');
    $stmt->execute([
        ':fundId'           => $fundId,
        ':senderAddress'    => $senderAddress,
        ':receiverAddress'  => $receiverAddress,
        ':message'          => $message,
        ':date'             => $today
    ]);
    $invitationId = $db->lastInsertId();
    $db->commit();

    http_response_code(200);
    echo json_encode([
        "message"       => "Invitation sent successfully",
        "invitationId"  => $invitationId
    ]);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(["error" => "Unable to create invitation"]);
    exit;
}
?>