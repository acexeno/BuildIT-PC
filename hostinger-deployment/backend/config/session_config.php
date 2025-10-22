<?php
/**
 * Session Security Configuration
 */

// Session security settings
ini_set("session.cookie_httponly", 1);
ini_set("session.cookie_secure", isset($_SERVER["HTTPS"]) ? 1 : 0);
ini_set("session.cookie_samesite", "Strict");
ini_set("session.use_strict_mode", 1);
ini_set("session.cookie_lifetime", 3600); // 1 hour
ini_set("session.gc_maxlifetime", 3600);

// Regenerate session ID periodically
if (!isset($_SESSION["last_regeneration"])) {
    $_SESSION["last_regeneration"] = time();
} elseif (time() - $_SESSION["last_regeneration"] > 1800) { // 30 minutes
    session_regenerate_id(true);
    $_SESSION["last_regeneration"] = time();
}

// Set secure session parameters
session_set_cookie_params([
    "lifetime" => 3600,
    "path" => "/",
    "domain" => "",
    "secure" => isset($_SERVER["HTTPS"]),
    "httponly" => true,
    "samesite" => "Strict"
]);
