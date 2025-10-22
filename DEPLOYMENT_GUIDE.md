# 🚀 HOSTINGER DEPLOYMENT GUIDE

## 📋 **What You Need to Do Right Now**

### **Step 1: Update Environment Configuration**

Open the file `hostinger-deployment/.env` and update these values:

```env
# Database Configuration - UPDATE THESE WITH YOUR ACTUAL VALUES
DB_HOST=localhost
DB_NAME=u709288172_builditpc_db
DB_USER=u709288172_sims
DB_PASS=Egiesims1@

# JWT Configuration - GENERATE STRONG SECRETS (IMPORTANT!)
JWT_SECRET=your_new_strong_jwt_secret_here_64_characters_long
REFRESH_JWT_SECRET=your_new_strong_refresh_secret_here_64_characters_long

# CORS Configuration - UPDATE WITH YOUR DOMAIN
CORS_ALLOWED_ORIGINS=https://egiesims.shop,https://www.egiesims.shop

# Mail Configuration
MAIL_FROM_ADDRESS=noreply@egiesims.shop
```

### **Step 2: Generate Strong JWT Secrets**

**IMPORTANT:** You need to generate new, strong JWT secrets for security.

**Option A: Use Online Generator**
- Go to: https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
- Generate 2 keys of 64 characters each
- Copy them to your .env file

**Option B: Use Command Line (if available)**
```bash
# Generate JWT secrets
openssl rand -base64 64
openssl rand -base64 64
```

### **Step 3: Create Deployment Zip**

**Windows (PowerShell):**
```powershell
Compress-Archive -Path hostinger-deployment\* -DestinationPath builditpc-deployment.zip
```

**Windows (Command Prompt):**
```cmd
powershell Compress-Archive -Path hostinger-deployment\* -DestinationPath builditpc-deployment.zip
```

### **Step 4: Upload to Hostinger**

1. **Go to Hostinger Control Panel**
   - Login to your Hostinger account
   - Go to "File Manager"

2. **Navigate to public_html**
   - Click on "public_html" folder

3. **Upload the zip file**
   - Click "Upload Files"
   - Select `builditpc-deployment.zip`
   - Wait for upload to complete

4. **Extract the files**
   - Right-click on `builditpc-deployment.zip`
   - Select "Extract"
   - Delete the zip file after extraction

### **Step 5: Set File Permissions**

In Hostinger File Manager:
1. Right-click on `logs` folder → Properties → Set to 755
2. Right-click on `uploads` folder → Properties → Set to 755
3. Right-click on `logs/app.log` → Properties → Set to 644

### **Step 6: Test Deployment**

Test these URLs in order:

1. **Health Check:** `https://egiesims.shop/health.php`
   - Should show: `{"status":"ok","database":"connected"}`

2. **Main Application:** `https://egiesims.shop/`
   - Should load your React application

3. **API Test:** `https://egiesims.shop/api/?endpoint=categories`
   - Should return component categories

## 🔧 **Troubleshooting**

### **If Health Check Fails:**
- Check database credentials in `.env`
- Verify database exists in Hostinger
- Check Hostinger error logs

### **If Main App Doesn't Load:**
- Check browser console for errors
- Verify all files were uploaded
- Check `.htaccess` file is present

### **If API Returns Errors:**
- Check JWT secrets in `.env`
- Verify CORS origins are correct
- Check Hostinger error logs

## 📞 **Quick Reference**

### **Files You Need to Update:**
- `hostinger-deployment/.env` - Environment configuration

### **URLs to Test:**
- `https://egiesims.shop/health.php` - Health check
- `https://egiesims.shop/` - Main app
- `https://egiesims.shop/api/?endpoint=categories` - API test

### **Important Values to Change:**
- JWT_SECRET (generate new 64-character string)
- REFRESH_JWT_SECRET (generate new 64-character string)
- CORS_ALLOWED_ORIGINS (your domain)

## ⚠️ **Security Reminders**

1. **Generate new JWT secrets** - Don't use the default ones
2. **Update CORS origins** - Only allow your domain
3. **Check database credentials** - Use your actual Hostinger DB details
4. **Test everything** - Make sure all features work

## 🎯 **Success Indicators**

✅ Health check returns `{"status":"ok","database":"connected"}`
✅ Main application loads without errors
✅ API endpoints respond correctly
✅ Login/registration works
✅ File uploads work
✅ All images load properly

---

**🚀 Follow these steps and your PC Building System will be live on Hostinger!**
