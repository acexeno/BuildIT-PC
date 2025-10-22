<?php
// Local development mail configuration
// This is used when running on localhost

function get_local_mail_config() {
    return [
        'MAIL_AUTH' => 'gmail_password',
        'GMAIL_USER' => 'kenniellmart@gmail.com',
        'GMAIL_APP_PASSWORD' => 'rtwudoaenolfzjsr',
        'MAIL_HOST' => 'smtp.gmail.com',
        'MAIL_PORT' => '465',
        'MAIL_ENCRYPTION' => 'ssl',
        'MAIL_FROM_ADDRESS' => 'kenniellmart@gmail.com',
        'MAIL_FROM_NAME' => 'SIMS Local',
        'OTP_REQUEST_COOLDOWN' => '1', // Reduced to 1 second for testing
        'OTP_MAX_PER_HOUR' => '100', // Increased to 100 requests per hour for testing
    ];
}

// Override environment variables for local development
if (!function_exists('env')) {
    function env($key, $default = null) {
        $config = get_local_mail_config();
        return $config[$key] ?? $default;
    }
} else {
    // Override specific mail variables for local development
    $config = get_local_mail_config();
    foreach ($config as $key => $value) {
        if (env($key, '') === '') {
            $_ENV[$key] = $value;
            putenv($key . '=' . $value);
        }
    }
}
?>
