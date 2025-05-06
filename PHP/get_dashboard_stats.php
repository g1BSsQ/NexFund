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

// Lấy user_address từ request
$user_address = $input['user_address'] ?? null;

if (!$user_address) {
    http_response_code(400);
    echo json_encode(["error" => "Thiếu user_address"]);
    exit;
}

try {
    // 1. Lấy danh sách quỹ mà user tham gia hoặc tạo
    $stmt = $db->prepare(
        "SELECT f.*
         FROM Funds f
         LEFT JOIN Members m ON f.id = m.fundId
         WHERE f.creator = ? OR m.address = ?
         GROUP BY f.id" // Thêm GROUP BY để tránh trùng lặp nếu user vừa là creator vừa là member
    );
    $stmt->execute([$user_address, $user_address]);
    $funds = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $fund_ids = array_column($funds, 'id');

    // Nếu không có quỹ nào, trả về số liệu bằng 0
    if (empty($fund_ids)) {
        echo json_encode([
            "total_funds" => 0,
            "fund_count" => 0,
            "pending_proposals" => 0,
            "total_members" => 0,
            "budget_allocation" => [],
            "funds_list" => [],
            "popular_proposals" => []
        ]);
        exit;
    }

    // 2. Tổng quỹ quản lý - Không còn lấy từ cột current nữa
    // Gửi về 0 hoặc giá trị mặc định
    $total_funds = 0;

    // 3. Số lượng quỹ
    $fund_count = count($fund_ids);

    // 4. Đề xuất đang chờ
    $stmt = $db->prepare(
        "SELECT COUNT(*) as count
         FROM Proposals
         WHERE fundId IN (" . implode(',', array_fill(0, count($fund_ids), '?')) . ")
         AND status = 'pending'"
    );
    $stmt->execute($fund_ids);
    $pending_proposals = (int) $stmt->fetchColumn();

    // 5. Tổng số thành viên
    $stmt = $db->prepare(
        "SELECT COUNT(*) as count
         FROM Members
         WHERE fundId IN (" . implode(',', array_fill(0, count($fund_ids), '?')) . ")"
    );
    $stmt->execute($fund_ids);
    $total_members = (int) $stmt->fetchColumn();

    // 6. Phân bổ ngân sách - Không còn sử dụng cột current
    // Thay vào đó, chỉ đếm số quỹ theo danh mục
    $stmt = $db->prepare(
        "SELECT category, COUNT(*) as count
         FROM Funds
         WHERE id IN (" . implode(',', array_fill(0, count($fund_ids), '?')) . ")
         GROUP BY category"
    );
    $stmt->execute($fund_ids);
    $budget_allocation = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Chuẩn hóa dữ liệu cho Pie Chart
    $budget_allocation = array_map(function ($item) {
        return [
            "name" => $item['category'],
            "value" => (float) $item['count'],  // Thay đổi từ sum(current) thành count(*)
            "color" => '#3B82F6' // Có thể tạo hàm để gán màu động
        ];
    }, $budget_allocation);

    // 7. Danh sách quỹ - Không còn trả về current và total
    $funds_list = array_map(function ($fund) {
        return [
            "id" => $fund['id'],
            "name" => $fund['name'],
            "description" => $fund['description'],
            "category" => $fund['category'],
            "members" => (int) $fund['members']
            // Đã loại bỏ current và total
        ];
    }, $funds);

    // 8. Đề xuất nổi bật
    $stmt = $db->prepare(
        "SELECT id, title, votes, status
         FROM Proposals
         WHERE fundId IN (" . implode(',', array_fill(0, count($fund_ids), '?')) . ")
         ORDER BY votes DESC
         LIMIT 4"
    );
    $stmt->execute($fund_ids);
    $popular_proposals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Trả về dữ liệu
    echo json_encode([
        "total_funds" => $total_funds,  // Giờ đây chỉ là 0 hoặc giá trị mặc định
        "fund_count" => $fund_count,
        "pending_proposals" => $pending_proposals,
        "total_members" => $total_members,
        "budget_allocation" => $budget_allocation,
        "funds_list" => $funds_list,
        "popular_proposals" => $popular_proposals
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Không thể lấy dữ liệu: " . $e->getMessage()]);
}
?>