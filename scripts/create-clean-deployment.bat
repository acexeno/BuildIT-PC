@echo off
REM Clean Hostinger Deployment Script for Windows
REM This script creates a proper deployment structure for Hostinger

echo 🚀 Creating Clean Hostinger Deployment Package...

REM Clean up any existing deployment
if exist hostinger-deployment rmdir /s /q hostinger-deployment
mkdir hostinger-deployment

echo 📦 Building frontend...
call npm run build
if errorlevel 1 (
    echo ❌ Frontend build failed!
    pause
    exit /b 1
)

echo 📁 Creating clean deployment structure...

REM 1. Copy frontend files to root of deployment
echo   → Copying frontend files...
if exist backend\public\index.html (
    copy backend\public\index.html hostinger-deployment\
) else (
    echo ❌ Frontend build not found in backend\public\
    pause
    exit /b 1
)

if exist backend\public\assets (
    xcopy backend\public\assets hostinger-deployment\assets\ /E /I /Y
) else (
    echo ❌ Assets directory not found!
    pause
    exit /b 1
)

if exist backend\public\images (
    xcopy backend\public\images hostinger-deployment\images\ /E /I /Y
) else (
    echo ❌ Images directory not found!
    pause
    exit /b 1
)

REM 2. Create clean API structure
echo   → Creating API structure...
mkdir hostinger-deployment\api
copy backend\api\index.php hostinger-deployment\api\
copy backend\api\*.php hostinger-deployment\api\

REM 3. Copy backend configuration
echo   → Copying backend configuration...
mkdir hostinger-deployment\backend
xcopy backend\config hostinger-deployment\backend\config\ /E /I /Y
xcopy backend\utils hostinger-deployment\backend\utils\ /E /I /Y
xcopy backend\middleware hostinger-deployment\backend\middleware\ /E /I /Y

REM 4. Copy vendor dependencies
echo   → Copying vendor dependencies...
if exist vendor (
    xcopy vendor hostinger-deployment\vendor\ /E /I /Y
) else (
    echo ⚠️  Vendor directory not found - run composer install first
)

REM 5. Create production .htaccess
echo   → Creating production .htaccess...
(
echo # Enable rewrite engine
echo RewriteEngine On
echo.
echo # Security Headers
echo ^<IfModule mod_headers.c^>
echo     Header always set X-Frame-Options "DENY"
echo     Header always set X-Content-Type-Options "nosniff"
echo     Header always set X-XSS-Protection "1; mode=block"
echo     Header always set Referrer-Policy "strict-origin-when-cross-origin"
echo     Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
echo     
echo     # HSTS (only for HTTPS)
echo     Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" env=HTTPS
echo ^</IfModule^>
echo.
echo # Prevent access to sensitive files
echo ^<FilesMatch "\.(env|log|sql|bak|backup)$"^>
echo     Order Deny,Allow
echo     Deny from all
echo ^</FilesMatch^>
echo.
echo # Prevent access to configuration files
echo ^<FilesMatch "^(config|database|security)\.php$"^>
echo     Order Deny,Allow
echo     Deny from all
echo ^</FilesMatch^>
echo.
echo # Set proper MIME types
echo ^<IfModule mod_mime.c^>
echo     AddType application/javascript .js
echo     AddType text/css .css
echo     AddType application/json .json
echo     AddType image/png .png
echo     AddType image/jpeg .jpg .jpeg
echo     AddType image/svg+xml .svg
echo     AddType image/webp .webp
echo ^</IfModule^>
echo.
echo # Enable compression
echo ^<IfModule mod_deflate.c^>
echo     AddOutputFilterByType DEFLATE text/plain
echo     AddOutputFilterByType DEFLATE text/html
echo     AddOutputFilterByType DEFLATE text/xml
echo     AddOutputFilterByType DEFLATE text/css
echo     AddOutputFilterByType DEFLATE application/xml
echo     AddOutputFilterByType DEFLATE application/xhtml+xml
echo     AddOutputFilterByType DEFLATE application/rss+xml
echo     AddOutputFilterByType DEFLATE application/javascript
echo     AddOutputFilterByType DEFLATE application/x-javascript
echo ^</IfModule^>
echo.
echo # Set cache headers for static assets
echo ^<IfModule mod_expires.c^>
echo     ExpiresActive On
echo     ExpiresByType text/css "access plus 1 year"
echo     ExpiresByType application/javascript "access plus 1 year"
echo     ExpiresByType image/png "access plus 1 year"
echo     ExpiresByType image/jpg "access plus 1 year"
echo     ExpiresByType image/jpeg "access plus 1 year"
echo     ExpiresByType image/gif "access plus 1 year"
echo     ExpiresByType image/svg+xml "access plus 1 year"
echo ^</IfModule^>
echo.
echo # Single Page App routing
echo RewriteCond %%{REQUEST_FILENAME} !-f
echo RewriteCond %%{REQUEST_FILENAME} !-d
echo RewriteRule . /index.html [L]
) > hostinger-deployment\.htaccess

REM 6. Create production environment file
echo   → Creating production environment file...
(
echo # Production Environment Configuration
echo APP_ENV=production
echo APP_DEBUG=0
echo APP_TIMEZONE=Asia/Manila
echo APP_NAME=SIMS
echo.
echo # Database Configuration - UPDATE THESE VALUES
echo DB_HOST=localhost
echo DB_NAME=your_database_name
echo DB_USER=your_database_user
echo DB_PASS=your_strong_database_password
echo DB_PORT=3306
echo DB_CHARSET=utf8mb4
echo.
echo # JWT Configuration - GENERATE STRONG SECRETS
echo JWT_SECRET=your_64_character_random_jwt_secret_here
echo JWT_EXPIRY=3600
echo REFRESH_JWT_SECRET=your_64_character_random_refresh_secret_here
echo REFRESH_JWT_EXPIRY=1209600
echo.
echo # OTP Configuration
echo OTP_REQUEST_COOLDOWN=60
echo OTP_MAX_PER_HOUR=5
echo OTP_TTL_MINUTES=5
echo.
echo # Mail Configuration
echo MAIL_MAILER=smtp
echo MAIL_HOST=smtp.hostinger.com
echo MAIL_PORT=587
echo MAIL_ENCRYPTION=tls
echo MAIL_AUTH=1
echo MAIL_FROM_ADDRESS=noreply@yourdomain.com
echo MAIL_FROM_NAME=SIMS
echo.
echo # Security Configuration
echo LOGIN_MAX_ATTEMPTS=5
echo LOGIN_LOCKOUT_TIME=900
echo SESSION_TIMEOUT=3600
echo PASSWORD_MIN_LENGTH=12
echo.
echo # File Upload Security
echo MAX_FILE_SIZE=5242880
echo ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
echo.
echo # CORS Configuration - UPDATE WITH YOUR DOMAIN
echo CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
echo.
echo # Logging Configuration
echo LOG_LEVEL=error
echo LOG_FILE=logs/app.log
echo.
echo # Cache Configuration
echo CACHE_ENABLED=1
echo CACHE_TTL=3600
) > hostinger-deployment\.env

REM 7. Create uploads directory with security
echo   → Creating secure uploads directory...
mkdir hostinger-deployment\uploads
(
echo Options -Indexes
echo ^<Files "*.php"^>
echo     Order Deny,Allow
echo     Deny from all
echo ^</Files^>
echo ^<Files "*.phtml"^>
echo     Order Deny,Allow
echo     Deny from all
echo ^</Files^>
echo ^<Files "*.php3"^>
echo     Order Deny,Allow
echo     Deny from all
echo ^</Files^>
echo ^<Files "*.php4"^>
echo     Order Deny,Allow
echo     Deny from all
echo ^</Files^>
echo ^<Files "*.php5"^>
echo     Order Deny,Allow
echo     Deny from all
echo ^</Files^>
echo ^<Files "*.pl"^>
echo     Order Deny,Allow
echo     Deny from all
echo ^</Files^>
echo ^<Files "*.py"^>
echo     Order Deny,Allow
echo     Deny from all
echo ^</Files^>
echo ^<Files "*.jsp"^>
echo     Order Deny,Allow
echo     Deny from all
echo ^</Files^>
echo ^<Files "*.asp"^>
echo     Order Deny,Allow
echo     Deny from all
echo ^</Files^>
echo ^<Files "*.sh"^>
echo     Order Deny,Allow
echo     Deny from all
echo ^</Files^>
) > hostinger-deployment\uploads\.htaccess

REM 8. Create logs directory
echo   → Creating logs directory...
mkdir hostinger-deployment\logs
echo. > hostinger-deployment\logs\app.log

REM 9. Create health check endpoint
echo   → Creating health check endpoint...
(
echo ^<?php
echo header('Content-Type: application/json'^);
echo.
echo $health = [
echo     'status' =^> 'ok',
echo     'timestamp' =^> date('Y-m-d H:i:s'^),
echo     'environment' =^> 'production',
echo     'php_version' =^> PHP_VERSION,
echo     'server' =^> $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
echo ];
echo.
echo // Test database connection
echo try {
echo     require_once __DIR__ . '/backend/config/database.php';
echo     $pdo = get_db_connection(^);
echo     $health['database'] = 'connected';
echo } catch (Exception $e^) {
echo     $health['database'] = 'error: ' . $e-^>getMessage(^);
echo     $health['status'] = 'error';
echo }
echo.
echo echo json_encode($health, JSON_PRETTY_PRINT^);
echo ?^>
) > hostinger-deployment\health.php

echo.
echo ✅ Clean deployment package created!
echo.
echo 📁 Deployment Structure:
echo hostinger-deployment/
echo ├── index.html              ← Frontend entry point
echo ├── assets/                 ← Built CSS/JS files
echo ├── images/                 ← Component images
echo ├── api/                    ← API endpoints
echo ├── backend/                ← Backend configuration
echo ├── vendor/                 ← PHP dependencies
echo ├── uploads/                ← File uploads (secure)
echo ├── logs/                   ← Application logs
echo ├── .htaccess               ← Production configuration
echo ├── .env                    ← Environment variables
echo └── health.php              ← Health check endpoint
echo.
echo 📋 Next Steps:
echo 1. Update .env file with your actual values
echo 2. Generate strong JWT secrets
echo 3. Zip the hostinger-deployment folder
echo 4. Upload to Hostinger public_html/
echo 5. Extract and test with /health.php
echo.
echo 🎯 Ready for clean Hostinger deployment!
echo.
pause
