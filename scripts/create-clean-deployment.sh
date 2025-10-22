#!/bin/bash
# Clean Hostinger Deployment Script
# This script creates a proper deployment structure for Hostinger

set -e

echo "🚀 Creating Clean Hostinger Deployment Package..."

# Clean up any existing deployment
rm -rf hostinger-deployment
mkdir -p hostinger-deployment

echo "📦 Building frontend..."
npm run build

echo "📁 Creating clean deployment structure..."

# 1. Copy frontend files to root of deployment
echo "  → Copying frontend files..."
cp backend/public/index.html hostinger-deployment/
cp -r backend/public/assets hostinger-deployment/
cp -r backend/public/images hostinger-deployment/

# 2. Create clean API structure
echo "  → Creating API structure..."
mkdir -p hostinger-deployment/api
cp backend/api/index.php hostinger-deployment/api/
cp -r backend/api/*.php hostinger-deployment/api/

# 3. Copy backend configuration
echo "  → Copying backend configuration..."
mkdir -p hostinger-deployment/backend
cp -r backend/config hostinger-deployment/backend/
cp -r backend/utils hostinger-deployment/backend/
cp -r backend/middleware hostinger-deployment/backend/

# 4. Copy vendor dependencies
echo "  → Copying vendor dependencies..."
if [ -d "vendor" ]; then
    cp -r vendor hostinger-deployment/
fi

# 5. Create production .htaccess
echo "  → Creating production .htaccess..."
cat > hostinger-deployment/.htaccess << 'EOF'
# Enable rewrite engine
RewriteEngine On

# Security Headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
    
    # HSTS (only for HTTPS)
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" env=HTTPS
</IfModule>

# Prevent access to sensitive files
<FilesMatch "\.(env|log|sql|bak|backup)$">
    Order Deny,Allow
    Deny from all
</FilesMatch>

# Prevent access to configuration files
<FilesMatch "^(config|database|security)\.php$">
    Order Deny,Allow
    Deny from all
</FilesMatch>

# Set proper MIME types
<IfModule mod_mime.c>
    AddType application/javascript .js
    AddType text/css .css
    AddType application/json .json
    AddType image/png .png
    AddType image/jpeg .jpg .jpeg
    AddType image/svg+xml .svg
    AddType image/webp .webp
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Set cache headers for static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Single Page App routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
EOF

# 6. Create production environment file
echo "  → Creating production environment file..."
cat > hostinger-deployment/.env << 'EOF'
# Production Environment Configuration
APP_ENV=production
APP_DEBUG=0
APP_TIMEZONE=Asia/Manila
APP_NAME=SIMS

# Database Configuration - UPDATE THESE VALUES
DB_HOST=localhost
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASS=your_strong_database_password
DB_PORT=3306
DB_CHARSET=utf8mb4

# JWT Configuration - GENERATE STRONG SECRETS
JWT_SECRET=your_64_character_random_jwt_secret_here
JWT_EXPIRY=3600
REFRESH_JWT_SECRET=your_64_character_random_refresh_secret_here
REFRESH_JWT_EXPIRY=1209600

# OTP Configuration
OTP_REQUEST_COOLDOWN=60
OTP_MAX_PER_HOUR=5
OTP_TTL_MINUTES=5

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_AUTH=1
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME=SIMS

# Security Configuration
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCKOUT_TIME=900
SESSION_TIMEOUT=3600
PASSWORD_MIN_LENGTH=12

# File Upload Security
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# CORS Configuration - UPDATE WITH YOUR DOMAIN
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Logging Configuration
LOG_LEVEL=error
LOG_FILE=logs/app.log

# Cache Configuration
CACHE_ENABLED=1
CACHE_TTL=3600
EOF

# 7. Create uploads directory with security
echo "  → Creating secure uploads directory..."
mkdir -p hostinger-deployment/uploads
cat > hostinger-deployment/uploads/.htaccess << 'EOF'
Options -Indexes
<Files "*.php">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.phtml">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.php3">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.php4">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.php5">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.pl">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.py">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.jsp">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.asp">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.sh">
    Order Deny,Allow
    Deny from all
</Files>
EOF

# 8. Create logs directory
echo "  → Creating logs directory..."
mkdir -p hostinger-deployment/logs
touch hostinger-deployment/logs/app.log
chmod 755 hostinger-deployment/logs/app.log

# 9. Create health check endpoint
echo "  → Creating health check endpoint..."
cat > hostinger-deployment/health.php << 'EOF'
<?php
header('Content-Type: application/json');

$health = [
    'status' => 'ok',
    'timestamp' => date('Y-m-d H:i:s'),
    'environment' => 'production',
    'php_version' => PHP_VERSION,
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
];

// Test database connection
try {
    require_once __DIR__ . '/backend/config/database.php';
    $pdo = get_db_connection();
    $health['database'] = 'connected';
} catch (Exception $e) {
    $health['database'] = 'error: ' . $e->getMessage();
    $health['status'] = 'error';
}

echo json_encode($health, JSON_PRETTY_PRINT);
?>
EOF

# 10. Create deployment instructions
echo "  → Creating deployment instructions..."
cat > hostinger-deployment/DEPLOYMENT_INSTRUCTIONS.md << 'EOF'
# 🚀 Hostinger Deployment Instructions

## 📋 Pre-Deployment Checklist

### 1. Update Environment Configuration
- Edit `.env` file with your actual values:
  - Database credentials
  - JWT secrets (generate with: `openssl rand -base64 64`)
  - Domain name for CORS
  - Mail configuration

### 2. Generate Strong Secrets
```bash
# Generate JWT secrets
openssl rand -base64 64
openssl rand -base64 64

# Generate encryption key
openssl rand -hex 32
```

## 📦 Deployment Steps

### 1. Upload Files
- Zip the entire `hostinger-deployment` folder
- Upload to Hostinger's `public_html` directory
- Extract the zip file

### 2. Set Permissions
```bash
chmod 755 logs/
chmod 644 logs/app.log
chmod 755 uploads/
```

### 3. Test Deployment
- Visit: `https://yourdomain.com/health.php`
- Should show: `{"status":"ok","database":"connected"}`
- Visit: `https://yourdomain.com/`
- Should load the React application

## 🔧 Post-Deployment Configuration

### 1. Database Setup
- Import your database schema
- Update `.env` with correct database credentials

### 2. SSL Certificate
- Enable HTTPS in Hostinger control panel
- Update CORS origins to use HTTPS only

### 3. Security
- Change all default passwords
- Update JWT secrets
- Configure firewall rules

## 🧪 Testing URLs

- **Main App**: `https://yourdomain.com/`
- **Health Check**: `https://yourdomain.com/health.php`
- **API Endpoint**: `https://yourdomain.com/api/?endpoint=ping`

## 🆘 Troubleshooting

### Common Issues:
1. **500 Error**: Check `.env` file configuration
2. **Database Error**: Verify database credentials
3. **CORS Error**: Update CORS origins in `.env`
4. **File Upload Error**: Check uploads directory permissions

### Debug Mode:
- Set `APP_DEBUG=1` in `.env` for detailed error messages
- Check `logs/app.log` for application logs
- Check Hostinger error logs in control panel

## 📞 Support

If you encounter issues:
1. Check the health endpoint first
2. Review the logs
3. Verify environment configuration
4. Test database connectivity

---

**🎉 Your PC Building System is now ready for production!**
EOF

echo ""
echo "✅ Clean deployment package created!"
echo ""
echo "📁 Deployment Structure:"
echo "hostinger-deployment/"
echo "├── index.html              ← Frontend entry point"
echo "├── assets/                 ← Built CSS/JS files"
echo "├── images/                 ← Component images"
echo "├── api/                    ← API endpoints"
echo "├── backend/                ← Backend configuration"
echo "├── vendor/                 ← PHP dependencies"
echo "├── uploads/                ← File uploads (secure)"
echo "├── logs/                   ← Application logs"
echo "├── .htaccess               ← Production configuration"
echo "├── .env                    ← Environment variables"
echo "├── health.php              ← Health check endpoint"
echo "└── DEPLOYMENT_INSTRUCTIONS.md"
echo ""
echo "📋 Next Steps:"
echo "1. Update .env file with your actual values"
echo "2. Generate strong JWT secrets"
echo "3. Zip the hostinger-deployment folder"
echo "4. Upload to Hostinger public_html/"
echo "5. Extract and test with /health.php"
echo ""
echo "🎯 Ready for clean Hostinger deployment!"
