# OTP System Guide

## Overview
The OTP (One-Time Password) system is now working correctly on your local server. It provides secure authentication using email-based verification codes.

## Features
- ✅ Email-based OTP generation
- ✅ Rate limiting and cooldown periods
- ✅ Purpose-specific OTPs (login, register, reset_password)
- ✅ Gmail integration with fake sending for local development
- ✅ Database schema auto-creation
- ✅ JWT token generation on successful verification

## Configuration

### Local Development
The system automatically detects local environment and uses:
- Local database: `builditpc_db`
- Fake email sending (enabled by default)
- Gmail credentials for actual sending when needed

### Environment Variables
Key variables for OTP system:
- `OTP_REQUEST_COOLDOWN=60` - Minimum seconds between requests
- `OTP_TTL_MINUTES=5` - OTP expiration time
- `OTP_MAX_PER_HOUR=5` - Maximum requests per hour per email
- `MAIL_FAKE=1` - Enable fake email sending for development

## API Endpoints

### 1. OTP Request
**POST** `/backend/api/index.php?action=otp_request`

```json
{
  "email": "user@gmail.com",
  "purpose": "login"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "ttl_minutes": 5,
  "cooldown_seconds": 60
}
```

### 2. OTP Verify
**POST** `/backend/api/index.php?action=otp_verify`

```json
{
  "email": "user@gmail.com",
  "purpose": "login",
  "code": "123456"
}
```

**Response (for existing users):**
```json
{
  "success": true,
  "message": "OTP verified",
  "token": "jwt_token_here",
  "refresh_token": "refresh_token_here",
  "user": {
    "id": 1,
    "username": "user",
    "email": "user@gmail.com",
    "roles": ["User"]
  }
}
```

## Testing

### Test Endpoint
Use the test endpoint for easy testing:
**GET** `http://localhost/capstone2/test_otp_endpoint.php` - Check system status

**POST** `http://localhost/capstone2/test_otp_endpoint.php` - Test OTP requests

### Example Test Request
```bash
curl -X POST http://localhost/capstone2/test_otp_endpoint.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "request",
    "email": "test@gmail.com",
    "purpose": "login"
  }'
```

## Security Features
- Rate limiting per email and IP
- Cooldown periods between requests
- Purpose-based validation
- Secure code generation
- Automatic expiration
- One-time use codes

## Database Schema
The system automatically creates the `otp_codes` table with:
- User linking
- Email and purpose tracking
- Expiration timestamps
- Attempt counting
- IP tracking for rate limiting

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure XAMPP MySQL is running
2. **Email Sending**: Check Gmail credentials in `backend/config/mail_local.php`
3. **Rate Limiting**: Wait for cooldown period or clear old OTP records

### Debug Mode
Set `APP_DEBUG=1` in environment to see detailed error messages.

## Production Deployment
For production:
1. Remove `.use_env_local` file
2. Set `MAIL_FAKE=0`
3. Configure proper Gmail credentials
4. Update CORS settings
5. Set `APP_ENV=production`

The OTP system is now fully functional and ready for use!
