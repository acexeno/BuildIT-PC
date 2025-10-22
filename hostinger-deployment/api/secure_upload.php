<?php
require_once __DIR__ . "/../config/enhanced_security.php";
require_once __DIR__ . "/../middleware/auth_middleware.php";
require_once __DIR__ . "/../config/database.php";

header("Content-Type: application/json");

$pdo = get_db_connection();
$security = new EnhancedSecurity($pdo);

// Require authentication
$user = requireAuth();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

if (!isset($_FILES["file"])) {
    http_response_code(400);
    echo json_encode(["error" => "No file uploaded"]);
    exit;
}

// Check rate limiting for file uploads
if (!$security->checkRateLimit("file_upload", $user["username"])) {
    http_response_code(429);
    echo json_encode(["error" => "Too many file uploads"]);
    exit;
}

// Validate file upload
$errors = $security->validateFileUpload($_FILES["file"]);
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(["error" => "File validation failed", "details" => $errors]);
    exit;
}

// Generate secure filename
$file = $_FILES["file"];
$extension = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
$secureFilename = bin2hex(random_bytes(16)) . "." . $extension;
$uploadPath = __DIR__ . "/../uploads/" . $secureFilename;

// Create uploads directory if it doesn't exist
if (!is_dir(__DIR__ . "/../uploads")) {
    mkdir(__DIR__ . "/../uploads", 0755, true);
}

// Move uploaded file
if (move_uploaded_file($file["tmp_name"], $uploadPath)) {
    // Log successful upload
    $security->logSecurityEvent("file_upload_success", "File uploaded: " . $file["name"], $user["user_id"], "low");
    
    echo json_encode([
        "success" => true,
        "filename" => $secureFilename,
        "original_name" => $file["name"],
        "size" => $file["size"],
        "url" => "/uploads/" . $secureFilename
    ]);
} else {
    $security->logSecurityEvent("file_upload_failed", "File upload failed: " . $file["name"], $user["user_id"], "medium");
    http_response_code(500);
    echo json_encode(["error" => "File upload failed"]);
}
