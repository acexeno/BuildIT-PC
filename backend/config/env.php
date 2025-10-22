<?php
// Lightweight .env loader and helper for production and local
// Usage: require_once __DIR__ . '/env.php'; then env('KEY','default')

if (!defined('ENV_LOADED')) {
    define('ENV_LOADED', true);

    // Polyfills for PHP < 8
    if (!function_exists('str_starts_with')) {
        function str_starts_with($haystack, $needle) {
            if ($needle === '') return true;
            return strncmp($haystack, $needle, strlen($needle)) === 0;
        }
    }
    if (!function_exists('str_ends_with')) {
        function str_ends_with($haystack, $needle) {
            if ($needle === '') return true;
            return substr($haystack, -strlen($needle)) === $needle;
        }
    }

    if (!function_exists('env')) {
        function env($key, $default = null) {
            // Priority: $_ENV -> getenv -> $_SERVER -> default
            if (isset($_ENV[$key])) return $_ENV[$key];
            $val = getenv($key);
            if ($val !== false) return $val;
            if (isset($_SERVER[$key])) return $_SERVER[$key];
            return $default;
        }
    }

    // Helper to load env file
    $load_env_file = function($path, $override = false) {
        if (!is_readable($path)) return;
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') continue;
            $pos = strpos($line, '=');
            if ($pos === false) continue;
            $name = trim(substr($line, 0, $pos));
            $value = trim(substr($line, $pos + 1));
            if ((str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                $value = substr($value, 1, -1);
            }
            if ($override) {
                $_ENV[$name] = $value;
                @putenv($name . '=' . $value);
            } else {
                if (!isset($_ENV[$name]) && getenv($name) === false) {
                    $_ENV[$name] = $value;
                    @putenv($name . '=' . $value);
                }
            }
        }
    };

    // Load .env (base) and only load .env.local when running locally.
    // This prevents production from being accidentally overridden by a stray .env.local.
    $root = dirname(__DIR__, 2);
    $envPath = $root . DIRECTORY_SEPARATOR . '.env';
    $envLocalPath = $root . DIRECTORY_SEPARATOR . '.env.local';
    $load_env_file($envPath, false);

    // Determine if we are in a local/dev context
    $isLocal = false;
    $host = $_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? '');
    if ($host && (strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false)) {
        $isLocal = true;
    }
    $declaredEnv = $_ENV['APP_ENV'] ?? getenv('APP_ENV');
    if ($declaredEnv && strtolower($declaredEnv) === 'local') {
        $isLocal = true;
    }
    // Optional marker file to force local overrides when running built-in PHP server, etc.
    if (is_file($root . DIRECTORY_SEPARATOR . '.use_env_local')) {
        $isLocal = true;
    }
    // If APP_ENV explicitly says production, do NOT load .env.local
    if ($declaredEnv && strtolower($declaredEnv) === 'production') {
        $isLocal = false;
    }

    if ($isLocal) {
        $load_env_file($envLocalPath, true);
        
        // Always load mail_local.php configuration for local development
        $mailLocalPath = __DIR__ . '/mail_local.php';
        if (is_readable($mailLocalPath)) {
            require_once $mailLocalPath;
            if (function_exists('get_local_mail_config')) {
                $mailConfig = get_local_mail_config();
                foreach ($mailConfig as $key => $value) {
                    if (env($key, '') === '') {
                        $_ENV[$key] = $value;
                        putenv($key . '=' . $value);
                    }
                }
            }
        }
        
        // Set local environment variables if .env.local doesn't exist
        if (!is_readable($envLocalPath)) {
            $_ENV['APP_ENV'] = 'local';
            $_ENV['APP_DEBUG'] = '1';
            $_ENV['DB_HOST'] = 'localhost';
            $_ENV['DB_NAME'] = 'builditpc_db';
            $_ENV['DB_USER'] = 'root';
            $_ENV['DB_PASS'] = '';
            $_ENV['DB_PORT'] = '3306';
            $_ENV['MAIL_AUTH'] = 'gmail_password';
            $_ENV['GMAIL_USER'] = 'kenniellmart@gmail.com';
            $_ENV['GMAIL_APP_PASSWORD'] = 'rtwudoaenolfzjsr';
            $_ENV['MAIL_FAKE'] = '0';
            $_ENV['OTP_REQUEST_COOLDOWN'] = '60';
            $_ENV['OTP_TTL_MINUTES'] = '5';
        }
    }
}

