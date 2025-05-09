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
if (empty($input['fundId']) || !preg_match('/^[a-zA-Z0-9-_]+$/', trim($input['fundId']))) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing fundId']);
    exit;
}

$fundId = trim($input['fundId']);

try {
    $stmt = $db->prepare(
        "SELECT id, title, description, details, creator, amount, votes, status, deadline 
         FROM proposals 
         WHERE fundId = :fundId"
    );
    $stmt->execute([':fundId' => $fundId]);
    $proposals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $result = array_map(function($p) {
        return [
            'id'          => $p['id'],
            'title'       => $p['title'],
            'description' => $p['description'],
            'details'     => $p['details'],
            'creator'     => $p['creator'],
            'amount'      => (float)$p['amount'],
            'votes'       => (int)$p['votes'],
            'status'      => $p['status'],
            'deadline'    => $p['deadline'],
        ];
    }, $proposals);

    echo json_encode($result);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Unable to fetch proposals']);
    exit;
}
?>