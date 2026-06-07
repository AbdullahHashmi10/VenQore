# 🚀 VenQore POS - Installation Guide
## "Piece of Cake" Installation for Shared Hosting

---

## 📋 Before You Begin

### Server Requirements
Ensure your hosting provider meets these requirements:

| Requirement | Details |
|-------------|---------|
| PHP Version | **8.2 or higher** |
| Database | MySQL 5.7+ or MariaDB 10.3+ |
| Web Server | Apache with mod_rewrite enabled |
| PHP Extensions | BCMath, Ctype, Fileinfo, JSON, Mbstring, OpenSSL, PDO, Tokenizer, XML |
| Disk Space | Minimum 500MB recommended |

---

## 📁 Step 1: Upload the Files

1. **Log in** to your cPanel or hosting File Manager
2. **Navigate** to your desired folder (e.g., `public_html` for main domain, or a subfolder for subdomain)
3. **Upload** the `AMD_POS.zip` file
4. **Extract/Unzip** the file

⚠️ **IMPORTANT**: Ensure all files are extracted directly into the target folder, NOT inside a sub-folder like `project/project/...`

---

## 🔒 Step 2: Set Folder Permissions (Critical!)

For the software to work properly, you **MUST** grant write permissions to these folders:

### Using cPanel File Manager:
1. Right-click on the `storage` folder
2. Select **"Change Permissions"** or **"Permissions"**
3. Set permissions to **775** (Check "Write" for Group and Owner)
4. Click **"Apply to subdirectories"** if available
5. Repeat the same for the `bootstrap/cache` folder

### Using SSH/Terminal:
```bash
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```

---

## ⚙️ Step 3: Configure the Environment (.env file)

1. **Find** the file named `.env.example` in your installation folder
2. **Rename** it to `.env` (remove the `.example` part)
3. **Edit** the file and update these values:

```ini
# Your actual website URL (no trailing slash)
APP_URL=https://your-domain.com

# Database credentials from your hosting provider
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password

# Keep this as 'cookie' for installation stability
SESSION_DRIVER=cookie
```

4. **Save** the file

### 🔐 Getting Your Database Credentials:
- In cPanel, go to **MySQL Databases** or **MySQL Database Wizard**
- Create a new database and note the database name
- Create a new user with a strong password
- Add the user to the database with **ALL PRIVILEGES**

---

## 🌐 Step 4: Run the Installer

1. **Open your browser** and navigate to:
   ```
   https://your-domain.com/installer
   ```

2. **Server Health Check**
   - The installer will verify your server requirements
   - All items should show ✅ Green status
   - If any items are red, contact your hosting provider to enable the required PHP extension
   - Click **"Next"** to continue

3. **Database Configuration**
   - Verify your database details are correct
   - Click **"Save & Continue"**
   - The installer will create all necessary tables

4. **Admin Account Setup**
   - Create your administrator account
   - Remember these credentials - you'll need them to log in!

5. **Complete!**
   - Once installation is complete, you'll be redirected to the login page
   - Log in with your admin credentials

---

## 🔧 Troubleshooting

### ❌ "500 Internal Server Error"
**Cause**: Usually means folder permissions are incorrect.

**Solution**:
1. Re-check Step 2 (Permissions)
2. Ensure `storage` and `bootstrap/cache` have 775 permissions
3. Check if your hosting has PHP error logs for more details

---

### ❌ "404 Not Found"
**Cause**: The `.htaccess` file is missing or not being read.

**Solution**:
1. Verify `.htaccess` file exists in both root folder AND `public` folder
2. Ensure Apache mod_rewrite is enabled
3. Check if your hosting allows `.htaccess` overrides

---

### ❌ "419 Page Expired"
**Cause**: Session/CSRF token issue.

**Solution**:
1. Clear your browser cache and cookies
2. Try opening the installer in **Incognito/Private** browsing mode
3. Ensure `SESSION_DRIVER=cookie` is set in your `.env` file

---

### ❌ "Database Connection Error"
**Cause**: Incorrect database credentials.

**Solution**:
1. Double-check your database name, username, and password in `.env`
2. Ensure the database exists and the user has proper privileges
3. On some hosts, the database username includes a prefix (e.g., `username_dbuser`)

---

### ❌ CSS/JS Not Loading (Broken Layout)
**Cause**: Assets path configuration issue.

**Solution**:
1. Ensure `APP_URL` in `.env` matches your actual website URL exactly
2. Include `https://` if your site uses SSL
3. Clear browser cache and refresh

---

## 💡 Pro Tips

1. **Keep SESSION_DRIVER=cookie** for the most stable experience on shared hosting

2. **Backup regularly** - Use the built-in backup feature in Admin Settings

3. **Enable HTTPS** - Most hosting providers offer free SSL certificates. Use them!

4. **Performance**: After installation is working, consider:
   - Enabling caching in Admin Settings
   - Setting up a cron job for scheduled tasks

---

## 📞 Need Help?

If you encounter issues not covered in this guide:

1. Check your hosting provider's documentation for PHP/MySQL requirements
2. Review your hosting error logs for specific error messages
3. Contact support with:
   - Your hosting provider name
   - PHP version
   - The exact error message
   - Screenshot of the error (if possible)

---

*VenQore POS Installation Guide v1.0*
