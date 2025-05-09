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

// Kết nối DB
try {
    $db = new PDO(
        "mysql:host=localhost;dbname=danofund;charset=utf8",
        "root",
        "",
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Không thể kết nối DB']);
    exit;
}

// Kiểm tra form-data
$required = ['id', 'fundId', 'creator', 'title', 'description', 'amount', 'deadline'];
foreach ($required as $f) {
    if (empty($_POST[$f])) {
        http_response_code(400);
        echo json_encode(['error' => "Thiếu trường $f"]);
        exit;
    }
}

// Lấy dữ liệu
$id          = $_POST['id'];
$fundId      = $_POST['fundId'];
$creator     = $_POST['creator'];
$title       = $_POST['title'];
$description = $_POST['description'];
$details     = $_POST['details'] ?? '';
$amount      = $_POST['amount'];
$deadline    = $_POST['deadline'];

// Validate số tiền
if (!is_numeric($amount) || $amount <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Số tiền không hợp lệ']);
    exit;
}

// Xử lý file đính kèm
$attachments = [];
if (!empty($_FILES['attachments'])) {
    $uploadDir = __DIR__ . '/uploads/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    foreach ($_FILES['attachments']['tmp_name'] as $i => $tmp) {
        if (is_uploaded_file($tmp)) {
            $name = basename($_FILES['attachments']['name'][$i]);
            $dest = $uploadDir . uniqid() . "_" . $name;
            if (move_uploaded_file($tmp, $dest)) {
                $attachments[] = 'api/uploads/' . basename($dest);
            }
        }
    }
}

try {
    $db->beginTransaction();

    // Insert vào proposals
    $stmt = $db->prepare("
        INSERT INTO proposals
          (id, fundId, title, description, details, creator, amount, status, deadline, createdAt, attachments)
        VALUES
          (:id, :fundId, :title, :description, :details, :creator, :amount, 'pending', :deadline, NOW(), :attachments)
    ");
    $stmt->execute([
        ':id'          => $id,
        ':fundId'      => $fundId,
        ':title'       => $title,
        ':description' => $description,
        ':details'     => $details,
        ':creator'     => $creator,
        ':amount'      => $amount,
        ':deadline'    => $deadline,
        ':attachments' => json_encode($attachments),
    ]);

    // Cập nhật count đề xuất trong Funds
    $db->prepare("UPDATE Funds SET proposals = proposals + 1 WHERE id = :fundId")
       ->execute([':fundId' => $fundId]);

    $db->commit();

    echo json_encode(['id' => $id]);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => 'Không thể tạo đề xuất']);
    exit;
}
?>