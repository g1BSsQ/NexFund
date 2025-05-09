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

$input       = json_decode(file_get_contents('php://input'), true);
$searchQuery = isset($input['search']) ? trim($input['search']) : '';

try {
    $stmt = $db->prepare(
        "SELECT id, name, description, category, members, status
         FROM Funds
         WHERE visibility = 'public'
           AND (name LIKE :search OR description LIKE :search)"
    );
    $pattern = '%' . $searchQuery . '%';
    $stmt->bindParam(':search', $pattern, PDO::PARAM_STR);
    $stmt->execute();

    $funds = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $result = [];

    foreach ($funds as $f) {
        $result[] = [
            'id'          => $f['id'],
            'name'        => $f['name'],
            'description' => $f['description'],
            'category'    => $f['category'],
            'members'     => (int)$f['members'],
            'status'      => $f['status'],
        ];
    }

    echo json_encode($result);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Unable to fetch public funds']);
    exit;
}
?>