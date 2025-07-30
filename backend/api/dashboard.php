<?php
// api/dashboard.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt_helper.php';

function handleGetDashboardData($pdo) {
    try {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        if (!$authHeader) {
            http_response_code(401);
            echo json_encode(['error' => 'Authorization header missing']);
            return;
        }

        $token = str_replace('Bearer ', '', $authHeader);
        $decoded = verifyJWT($token);

        if (!$decoded || !isset($decoded['user_id'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid token']);
            return;
        }
        
        $roles = $decoded['roles'] ?? [];
        if (is_string($roles)) {
            $roles = explode(',', $roles);
        }

        // Initialize data structure
        $data = [];

        // Fetch data based on role
        if (in_array('Super Admin', $roles)) {
            // Fetch all users with their roles as a comma-separated string
            $stmt = $pdo->query("
                SELECT u.*, GROUP_CONCAT(r.name) as roles
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                GROUP BY u.id
            ");
            $data['users'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            try {
                $data['system_stats'] = get_system_stats($pdo);
            } catch (Exception $e) {
                throw $e;
            }
            $data['inventory'] = pdo_get_all($pdo, 'components');
            $data['orders'] = pdo_get_all($pdo, 'orders');
            $data['reports'] = get_reports_data($pdo);
        } elseif (in_array('Admin', $roles)) {
            $data['inventory'] = pdo_get_all($pdo, 'components');
            $data['orders'] = pdo_get_all($pdo, 'orders');
            $data['reports'] = get_reports_data($pdo);
        } elseif (in_array('Employee', $roles)) {
            $data['inventory'] = pdo_get_all($pdo, 'components');
            $data['orders'] = pdo_get_all($pdo, 'orders');
            $data['reports'] = get_reports_data($pdo);
        } else {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            return;
        }

        echo json_encode(['success' => true, 'data' => $data]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'An error occurred while fetching dashboard data.', 'message' => $e->getMessage()]);
    }
}

// --- Helper Functions ---

// A generic function to get all records from a table
function pdo_get_all($pdo, $table) {
    $stmt = $pdo->query("SELECT * FROM $table");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Function to get system-wide statistics
function get_system_stats($pdo) {
    $stats = [];
    $stats['total_users'] = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $stats['total_orders'] = (int)$pdo->query("SELECT COUNT(*) FROM orders")->fetchColumn();
    $stats['total_sales'] = (float)$pdo->query("SELECT SUM(total_price) FROM orders WHERE status = 'Completed'")->fetchColumn();
    // More stats can be added here
    return $stats;
}

// Function to get data for reports
function get_reports_data($pdo) {
    $reports = [];
    // Monthly sales (existing)
    $stmt = $pdo->query("SELECT 
        DATE_FORMAT(order_date, '%Y-%m') as month, 
        SUM(total_price) as total_sales 
        FROM orders 
        WHERE status = 'Completed' 
        GROUP BY month 
        ORDER BY month DESC 
        LIMIT 12");
    $reports['monthly_sales'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Daily sales (last 30 days)
    $stmt = $pdo->query("SELECT 
        DATE(order_date) as day, 
        SUM(total_price) as total_sales 
        FROM orders 
        WHERE status = 'Completed' AND order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY day 
        ORDER BY day DESC");
    $reports['daily_sales'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Top-selling products (by quantity and revenue)
    $stmt = $pdo->query("SELECT c.id, c.name, SUM(oi.quantity) as total_quantity, SUM(oi.price * oi.quantity) as total_revenue
        FROM order_items oi
        JOIN components c ON oi.component_id = c.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'Completed'
        GROUP BY c.id, c.name
        ORDER BY total_quantity DESC
        LIMIT 10");
    $reports['top_selling_products'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Revenue per category
    $stmt = $pdo->query("SELECT cat.name as category, SUM(oi.price * oi.quantity) as total_revenue
        FROM order_items oi
        JOIN components c ON oi.component_id = c.id
        JOIN component_categories cat ON c.category_id = cat.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'Completed'
        GROUP BY cat.id, cat.name
        ORDER BY total_revenue DESC");
    $reports['revenue_per_category'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Revenue per brand
    $stmt = $pdo->query("SELECT c.brand, SUM(oi.price * oi.quantity) as total_revenue
        FROM order_items oi
        JOIN components c ON oi.component_id = c.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'Completed' AND c.brand IS NOT NULL AND c.brand != ''
        GROUP BY c.brand
        ORDER BY total_revenue DESC");
    $reports['revenue_per_brand'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Deadstock detection (stock > 0, no sales in last X days)
    $period = isset($_GET['period']) && is_numeric($_GET['period']) ? intval($_GET['period']) : 90;
    if ($period < 1) $period = 90;
    $stmt = $pdo->query("SELECT c.id, c.name, c.stock_quantity, c.price, MAX(o.order_date) as last_sold_date
        FROM components c
        LEFT JOIN order_items oi ON c.id = oi.component_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'Completed'
        WHERE c.stock_quantity > 0
        GROUP BY c.id, c.name, c.stock_quantity, c.price
        HAVING (MAX(o.order_date) IS NULL OR MAX(o.order_date) < DATE_SUB(CURDATE(), INTERVAL $period DAY))");
    $reports['deadstock'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Stock movement (sales out per product, last 30 days)
    $stmt = $pdo->query("SELECT c.id, c.name, SUM(oi.quantity) as sold_last_30_days
        FROM order_items oi
        JOIN components c ON oi.component_id = c.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'Completed' AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY c.id, c.name
        ORDER BY sold_last_30_days DESC");
    $reports['stock_movement'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Order status breakdown
    $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM orders GROUP BY status");
    $reports['order_status_breakdown'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Average order value (completed orders)
    $stmt = $pdo->query("SELECT AVG(total_price) as avg_order_value FROM orders WHERE status = 'Completed'");
    $reports['average_order_value'] = $stmt->fetch(PDO::FETCH_ASSOC);

    return $reports;
} 