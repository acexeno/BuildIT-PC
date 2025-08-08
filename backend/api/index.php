<?php
require_once __DIR__ . '/../config/cors.php';
// main API router for SIMS

// all other requests will continue from here

// basic error reporting and exception handling
error_reporting(E_ALL);
ini_set('display_errors', 1); // turn this off in production
set_exception_handler(function($exception) {
    http_response_code(500);
    // The cors.php file already set the Content-Type to json
    error_log($exception->getMessage() . ' in ' . $exception->getFile() . ' on line ' . $exception->getLine());
    echo json_encode([
        'error' => 'An internal server error occurred.',
        'message' => $exception->getMessage()
    ]);
    exit;
});

// include all the files we need
require_once __DIR__ . '/../config/database.php';
$pdo = get_db_connection();
require_once __DIR__ . '/../utils/jwt_helper.php';
require_once __DIR__ . '/auth.php'; // has all the auth functions
require_once __DIR__ . '/builds.php'; // has all the build functions
require_once __DIR__ . '/notifications.php'; // has all the notification functions
require_once __DIR__ . '/dashboard.php'; // has all the dashboard data functions

// debug: check if builds functions are loaded
// error_log("API Router: Checking if builds functions are loaded...");
// error_log("handleCreateBuild exists: " . (function_exists('handleCreateBuild') ? 'YES' : 'NO'));
// error_log("handleGetBuilds exists: " . (function_exists('handleGetBuilds') ? 'YES' : 'NO'));
// error_log("handlePing exists: " . (function_exists('handlePing') ? 'YES' : 'NO'));

// helper to normalize and figure out brand and socket for CPUs and motherboards
function normalizeComponent(&$component) {
    // Normalize brand
    $brand = '';
    if (!empty($component['brand'])) $brand = strtolower($component['brand']);
    else if (!empty($component['name'])) $brand = strtolower($component['name']);
    else if (!empty($component['model'])) $brand = strtolower($component['model']);
    else if (!empty($component['type'])) $brand = strtolower($component['type']);
    if (strpos($brand, 'amd') !== false) $component['brand'] = 'AMD';
    else if (strpos($brand, 'intel') !== false) $component['brand'] = 'Intel';
    // Normalize socket
    $socket = '';
    if (!empty($component['socket'])) $socket = strtolower($component['socket']);
    else if (!empty($component['type'])) $socket = strtolower($component['type']);
    else if (!empty($component['model'])) $socket = strtolower($component['model']);
    else if (!empty($component['name'])) $socket = strtolower($component['name']);
    if (strpos($socket, 'am4') !== false) $component['socket'] = 'AM4';
    else if (strpos($socket, 'am5') !== false) $component['socket'] = 'AM5';
    else if (strpos($socket, 'lga1200') !== false) $component['socket'] = 'LGA1200';
    else if (strpos($socket, 'lga1700') !== false) $component['socket'] = 'LGA1700';
    // Also check specs if present
    if (isset($component['specs']) && is_object($component['specs'])) {
        if (empty($component['brand']) && !empty($component['specs']->brand)) {
            $component['brand'] = $component['specs']->brand;
        }
        if (empty($component['socket']) && !empty($component['specs']->socket)) {
            $component['socket'] = $component['specs']->socket;
        }
    }
}

// --- component functions ---
function handleGetComponents($pdo) {
    $categoryName = $_GET['category'] ?? '';
    if (empty($categoryName)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Category not specified']);
        return;
    }

    // find the category ID from the name, case-insensitively
    $stmt = $pdo->prepare("SELECT id FROM component_categories WHERE UPPER(name) = UPPER(?)");
    $stmt->execute([$categoryName]);
    $category = $stmt->fetch();

    if (!$category) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Category not found']);
        return;
    }

    // grab all components for that category
    $stmt = $pdo->prepare("SELECT * FROM components WHERE category_id = ?");
    $stmt->execute([$category['id']]);
    $components = $stmt->fetchAll();

    // decode specs JSON string into an object for each component and normalize
    foreach ($components as &$component) {
        if (isset($component['specs']) && is_string($component['specs'])) {
            $component['specs'] = json_decode($component['specs']);
        }
        normalizeComponent($component);
    }

    echo json_encode(['success' => true, 'data' => $components]);
}

// --- Routing Logic ---
$method = $_SERVER['REQUEST_METHOD'];

// Route based on the 'endpoint' query parameter
$endpoint = strtolower($_GET['endpoint'] ?? '');

// Debug logging
// error_log("API Router Debug - Method: $method, Endpoint: '$endpoint', GET params: " . json_encode($_GET));

if (empty($endpoint)) {
    http_response_code(400);
    echo json_encode(['error' => 'Endpoint not specified']);
    exit;
}

// Route based on the endpoint
switch ($endpoint) {
    case 'register':
        if ($method === 'POST') {
            handleRegister($pdo);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case 'login':
        if ($method === 'POST') {
            handleLogin($pdo);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case 'profile':
        if ($method === 'GET') {
            handleGetProfile($pdo);
        } elseif ($method === 'PUT') {
            handleUpdateProfile($pdo);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case 'password':
        if ($method === 'PUT') {
            handleChangePassword($pdo);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;
        
    case 'verify':
        if ($method === 'GET') {
            handleVerifyToken($pdo);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case 'logout':
        if ($method === 'POST') {
            handleLogout();
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case 'refresh':
        if ($method === 'POST') {
            handleRefreshToken($pdo);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case 'components':
        if ($method === 'GET') {
            handleGetComponents($pdo);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case 'notifications':
        // Route notifications requests to the notifications.php handlers
        switch ($method) {
            case 'GET':
                if (isset($_GET['count'])) {
                    handleGetUnreadCount($pdo);
                } else {
                    handleGetNotifications($pdo);
                }
                break;
            case 'POST':
                handleCreateNotification($pdo);
                break;
            case 'PUT':
                if (isset($_GET['action']) && $_GET['action'] === 'mark-all-read') {
                    handleMarkAllAsRead($pdo);
                } else {
                    handleMarkAsRead($pdo);
                }
                break;
            case 'DELETE':
                handleDeleteNotification($pdo);
                break;
            default:
                http_response_code(405);
                echo json_encode(['error' => 'Method Not Allowed']);
                break;
        }
        break;

    case 'builds':
        // Debug logging for builds endpoint
        // error_log("BUILDS ENDPOINT: Method=$method, GET params=" . json_encode($_GET));
        
        // Check if required functions are defined
        if (!function_exists('handleCreateBuild')) {
            // error_log("BUILDS ERROR: handleCreateBuild function not found!");
            http_response_code(500);
            echo json_encode(['error' => 'Server configuration error: builds functions not loaded']);
            break;
        }
        
        // Route builds requests to the builds.php handlers
        switch ($method) {
            case 'GET':
                // error_log("BUILDS: Handling GET request");
                if (isset($_GET['test'])) {
                    if ($_GET['test'] === 'auth') {
                        // error_log("BUILDS: Calling handleTestAuth");
                        handleTestAuth($pdo);
                    } else if ($_GET['test'] === 'ping') {
                        // error_log("BUILDS: Calling handlePing");
                        handlePing();
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Invalid test parameter']);
                    }
                } else if (isset($_GET['public'])) {
                    // error_log("BUILDS: Calling handleGetPublicBuilds");
                    handleGetPublicBuilds($pdo);
                } else {
                    // error_log("BUILDS: Calling handleGetBuilds");
                    handleGetBuilds($pdo);
                }
                break;
            case 'POST':
                // error_log("BUILDS: Calling handleCreateBuild");
                handleCreateBuild($pdo);
                break;
            case 'PUT':
                // error_log("BUILDS: Calling handleUpdateBuild");
                handleUpdateBuild($pdo);
                break;
            case 'DELETE':
                // error_log("BUILDS: Calling handleDeleteBuild");
                handleDeleteBuild($pdo);
                break;
            default:
                // error_log("BUILDS: Method not allowed: $method");
                http_response_code(405);
                echo json_encode(['error' => 'Method Not Allowed']);
                break;
        }
        break;

    case 'dashboard':
        if ($method === 'GET') {
            handleGetDashboardData($pdo);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case 'categories':
        if ($method === 'GET') {
            $stmt = $pdo->query('SELECT id, name FROM component_categories ORDER BY name ASC');
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $categories]);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case 'update_inventory_access':
        if ($method === 'PUT') {
            handleUpdateInventoryAccess($pdo);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case 'update_order_access':
        if ($method === 'PUT') {
            handleUpdateOrderAccess($pdo);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    case 'update_chat_support_access':
        if ($method === 'PUT') {
            handleUpdateChatSupportAccess($pdo);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
        }
        break;

    // Add component-related routes here if needed, or point to another file
    // e.g., case 'components': include 'components.php'; break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
} 