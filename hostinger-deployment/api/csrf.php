<?php
require_once __DIR__ . "/../config/enhanced_security.php";
require_once __DIR__ . "/../config/database.php";

header("Content-Type: application/json");

$pdo = get_db_connection();
$security = new EnhancedSecurity($pdo);

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $token = $security->generateCSRFToken();
    echo json_encode(["csrf_token" => $token]);
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
