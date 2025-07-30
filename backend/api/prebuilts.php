<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt_helper.php';
header('Content-Type: application/json');

$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

function get_authenticated_user($pdo) {
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) return null;
    $token = str_replace('Bearer ', '', $headers['Authorization']);
    $payload = verify_jwt_token($token);
    if (!$payload || !isset($payload['user_id'])) return null;
    $stmt = $pdo->prepare('SELECT u.*, GROUP_CONCAT(r.name) as roles FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE u.id = ? GROUP BY u.id');
    $stmt->execute([$payload['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user && $user['roles']) $user['roles'] = explode(',', $user['roles']);
    return $user;
}

function require_superadmin($user) {
    if (!$user || !in_array('Super Admin', $user['roles'] ?? [])) {
        http_response_code(403);
        echo json_encode(['error' => 'Super Admin access required']);
        exit();
    }
}

switch ($method) {
    case 'GET':
        $user = get_authenticated_user($pdo);
        $show_all = isset($_GET['all']) && $user && in_array('Super Admin', $user['roles'] ?? []);
        $sql = 'SELECT * FROM prebuilts';
        if (!$show_all) {
            $sql .= ' WHERE is_hidden = 0';
        }
        $stmt = $pdo->query($sql);
        $prebuilts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($prebuilts);
        break;
    case 'POST':
        $user = get_authenticated_user($pdo);
        require_superadmin($user);
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare('INSERT INTO prebuilts (name, category, description, image, price, performance, features, component_ids, in_stock, is_hidden) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['name'],
            $data['category'],
            $data['description'] ?? '',
            $data['image'] ?? '',
            is_numeric($data['price']) ? $data['price'] : 0,
            json_encode($data['performance'] ?? []),
            json_encode($data['features'] ?? []),
            json_encode($data['component_ids'] ?? []),
            !empty($data['in_stock']) ? 1 : 0,
            !empty($data['is_hidden']) ? 1 : 0
        ]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        break;
    case 'PUT':
        $user = get_authenticated_user($pdo);
        require_superadmin($user);
        parse_str($_SERVER['QUERY_STRING'], $params);
        $id = $params['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing prebuilt id']);
            exit();
        }
        $data = json_decode(file_get_contents('php://input'), true);
        $fields = [];
        $values = [];
        foreach (['name','category','description','image','price','performance','features','component_ids','in_stock','is_hidden'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = in_array($field, ['performance','features','component_ids']) ? json_encode($data[$field]) : $data[$field];
            }
        }
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit();
        }
        $values[] = $id;
        $sql = 'UPDATE prebuilts SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        echo json_encode(['success' => true]);
        break;
    case 'PATCH':
        $user = get_authenticated_user($pdo);
        require_superadmin($user);
        parse_str($_SERVER['QUERY_STRING'], $params);
        $id = $params['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing prebuilt id']);
            exit();
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['is_hidden'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing is_hidden field']);
            exit();
        }
        $stmt = $pdo->prepare('UPDATE prebuilts SET is_hidden = ? WHERE id = ?');
        $stmt->execute([(int)$data['is_hidden'], $id]);
        echo json_encode(['success' => true]);
        break;
    case 'DELETE':
        $user = get_authenticated_user($pdo);
        require_superadmin($user);
        parse_str($_SERVER['QUERY_STRING'], $params);
        $id = $params['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing prebuilt id']);
            exit();
        }
        $stmt = $pdo->prepare('DELETE FROM prebuilts WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
} 