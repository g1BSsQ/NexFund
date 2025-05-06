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

// Nhận dữ liệu từ yêu cầu POST (tìm kiếm)
$input = json_decode(file_get_contents('php://input'), true);
$searchQuery = isset($input['search']) ? trim($input['search']) : '';

try {
    $stmt = $db->prepare(
        "SELECT id, name, description, category, members, status 
         FROM Funds 
         WHERE visibility = 'public' 
         AND (name LIKE :search OR description LIKE :search)"
    );
    $searchPattern = "%" . $searchQuery . "%";
    $stmt->bindParam(':search', $searchPattern, PDO::PARAM_STR);
    $stmt->execute();
    $funds = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$funds) {
        http_response_code(200);
        echo json_encode([]);
        exit;
    }

    $fundsData = array_map(function ($fund) {
        return [
            "id" => $fund['id'],
            "name" => $fund['name'],
            "description" => $fund['description'],
            "category" => $fund['category'],
            "members" => (int) $fund['members'],
            "status" => $fund['status']
        ];
    }, $funds);

    http_response_code(200);
    echo json_encode($fundsData);

} catch (Exception $e) {
    $errorMsg = "Lỗi khi lấy danh sách quỹ: " . $e->getMessage();
    logError($errorMsg);
    http_response_code(500);
    echo json_encode(["error" => $errorMsg]);
    exit;
}
?>