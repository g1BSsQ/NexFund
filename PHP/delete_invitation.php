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

try {
    $db = new PDO(
        "mysql:host=localhost;dbname=danofund;charset=utf8",
        "root",
        "",
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (empty($input['invitationId']) || !is_numeric($input['invitationId'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing invitationId']);
    exit;
}

$invitationId = (int) $input['invitationId'];

try {
    $stmt = $db->prepare("DELETE FROM Invitations WHERE id = :invitationId");
    $stmt->bindParam(':invitationId', $invitationId, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Invitation not found']);
    } else {
        echo json_encode(['message' => 'Invitation deleted successfully']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Unable to delete invitation']);
    exit;
}
?>