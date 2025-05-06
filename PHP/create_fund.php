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
    http_response_code(500);
    echo json_encode(["error" => "Kết nối cơ sở dữ liệu thất bại: " . $e->getMessage()]);
    exit;
}

// Nhận dữ liệu từ yêu cầu POST
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(["error" => "Dữ liệu đầu vào không hợp lệ"]);
    exit;
}

// Lấy dữ liệu từ request
$scriptAddr = $input['scriptAddr'] ?? null;
$name = $input['name'] ?? null;
$shortDescription = $input['shortDescription'] ?? null;
$description = $input['description'] ?? null;
$admin = $input['admin'] ?? null;
$governanceRules = $input['governanceRules'] ?? null;

if (!$scriptAddr || !$name || !$shortDescription || !$description || !$admin || !$governanceRules) {
    http_response_code(400);
    echo json_encode(["error" => "Thiếu các trường bắt buộc"]);
    exit;
}

// Kiểm tra nếu quỹ đã tồn tại dựa trên khóa chính (scriptAddr)
$stmt = $db->prepare("SELECT COUNT(*) FROM Funds WHERE id = ?");
$stmt->execute([$scriptAddr]);
if ($stmt->fetchColumn() > 0) {
    http_response_code(200);
    echo json_encode(["warning" => "Quỹ đã tồn tại. Bạn đã tạo quỹ giống nhau rồi, vui lòng kiểm tra lại."]);
    exit;
}

// Trích xuất governance rules
$votingMechanism = $governanceRules['votingMechanism'] ?? 'per-capita';
$proposalEligibility = $governanceRules['proposalEligibility'] ?? 'all-members';
$approvalThreshold = $governanceRules['approvalThreshold'] ?? 51;
$minContribution = $governanceRules['minContribution'] ?? 0;
$cooldownPeriod = $governanceRules['cooldownPeriod'] ?? 7;
$visibility = $governanceRules['visibility'] ?? 'private';

// Bắt đầu transaction để đảm bảo tính toàn vẹn dữ liệu
try {
    $db->beginTransaction();

    // 1. Lưu quỹ vào bảng Funds - đã loại bỏ các cột current và total
    $stmt = $db->prepare(
        "INSERT INTO Funds (id, name, description, longDescription, category, members, proposals, transactions, startDate, creator, status, votingMechanism, proposalEligibility, approvalThreshold, minContribution, cooldownPeriod, visibility)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        $scriptAddr,
        $name,
        $shortDescription,
        $description,
        "Thử nghiệm",
        1,
        0,
        0,
        date('Y-m-d'),
        $admin,
        "active",
        $votingMechanism,
        $proposalEligibility,
        $approvalThreshold,
        $minContribution,
        $cooldownPeriod,
        $visibility,
    ]);

    // 2. Thêm admin vào bảng Members (id sẽ tự động tăng)
    $stmt = $db->prepare(
        "INSERT INTO Members (fundId, address, role, joinDate)
         VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([
        $scriptAddr,
        $admin,
        "quản trị viên",
        date('Y-m-d'),
    ]);
    $memberId = $db->lastInsertId(); // Lấy ID tự động sinh

    // Commit transaction
    $db->commit();

    // Trả về phản hồi thành công
    http_response_code(200);
    echo json_encode([
        "message" => "Tạo quỹ thành công",
        "scriptAddr" => $scriptAddr,
        "memberId" => $memberId
    ]);
} catch (Exception $e) {
    // Rollback transaction nếu có lỗi
    $db->rollBack();
    http_response_code(500);
    echo json_encode(["error" => "Không thể tạo quỹ: " . $e->getMessage()]);
}
?>