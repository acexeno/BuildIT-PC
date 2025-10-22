<?php
// Direct Hostinger mail configuration
// This bypasses .env loading issues

function get_hostinger_mail_config() {
    return [
        'MAIL_AUTH' => 'gmail_password',
        'GMAIL_USER' => 'kenniellmart@gmail.com',
        'GMAIL_APP_PASSWORD' => 'rtwudoaenolfzjsr',
        'MAIL_HOST' => 'smtp.gmail.com',
        'MAIL_PORT' => '587',
        'MAIL_ENCRYPTION' => 'tls',
        'MAIL_FROM_ADDRESS' => 'kenniellmart@gmail.com',
        'MAIL_FROM_NAME' => 'SIMS',
    ];
}

// Override environment variables if not set
if (!function_exists('env')) {
    function env($key, $default = null) {
        $config = get_hostinger_mail_config();
        return $config[$key] ?? $default;
    }
} else {
    // Override specific mail variables
    $config = get_hostinger_mail_config();
    foreach ($config as $key => $value) {
        if (env($key, '') === '') {
            $_ENV[$key] = $value;
            putenv($key . '=' . $value);
        }
    }
}
?>
