# VenQore Platform Ops Runbook

This document details critical operations procedures for the VenQore Retail OS platform, including database restoration, credential rotation, and panic/maintenance switches.

---

## 1. Database Backup & Restore

### Automated Backups
- The platform uses the `vq:backup` Artisan command to perform a full raw SQL dump of the database.
- Backups are stored in `storage/app/private/backups/`.
- Cron Schedule: daily at 01:30 server time, via `routes/console.php` (`Schedule::command('vq:backup')`).
  **This was documented but not actually scheduled until 2026-07-07** — the command existed but nothing ever
  called it, so no backups were being produced in production. Verify `php artisan schedule:list` shows it
  and that a real cron entry runs `php artisan schedule:run` every minute on the server.
- **Known limitation:** `vq:backup` uses a pure-PHP dumper (`BackupService::dumpDatabase()`), not `mysqldump`
  — chosen for portability on shared/XAMPP hosting without a PATH-accessible `mysqldump` binary. It has no
  offsite/S3 copy yet (writes only to the local `storage/app/private/backups/` disk) — a single-server disk
  failure takes the backups down with it. Wiring an S3 disk + lifecycle policy (per the original plan) is
  still open work.

### Restore Verification (Restore Drills)
- `php artisan backup:verify` restores the *most recent* `vq:backup` dump into a throwaway database
  (`venqore_restore_check`) and sanity-checks row counts on core tables (`tenants`, `users`, `products`,
  `sales`, `journal_entries`) against production. It never touches `venqore_pos` itself.
- Scheduled weekly (Monday 02:30) alongside the nightly backup, so a broken backup is caught within a week
  instead of only being discovered during a real incident.
- Run it manually any time you want to prove the latest backup is actually restorable:
  ```bash
  php artisan backup:verify
  ```

### Manual Backup Command
To trigger a manual database backup:
```bash
php artisan vq:backup
```

### Database Restore Procedure
To restore the database from a generated SQL dump:

1. **Via Command Line (Standard)**:
   ```bash
   mysql -u [username] -p [database_name] < storage/app/private/backups/backup-YYYY-MM-DD-HH-II-SS.sql
   ```

2. **Via XAMPP / Local Environment (without global mysql in PATH)**:
   Navigate to your MySQL bin directory (e.g., `C:\xampp\mysql\bin`) and run:
   ```bash
   .\mysql.exe -u root -p venqore_pos < "E:\AMD POS\AMD POS\storage\app\private\backups\backup-YYYY-MM-DD-HH-II-SS.sql"
   ```

---

## 2. Environment Rotation & Secret Refresh

When secrets or credentials are compromised, use the following rotation procedures.

### 2.1 Laravel Application Key (APP_KEY)
> [!CAUTION]
> Rotating the `APP_KEY` will invalidate all active user sessions and break decryption of any database values encrypted via the `Crypt` facade (e.g., Google OAuth tokens). Backup those values first.
```bash
php artisan key:generate
```

### 2.2 Google API Credentials
Google OAuth tokens are used for Google Drive nightly backups.
1. Update Google Client ID and Secret in `.env`:
   ```env
   GOOGLE_CLIENT_ID="new-client-id"
   GOOGLE_CLIENT_SECRET="new-client-secret"
   ```
2. Re-authenticate tenants in the storage settings page to refresh access tokens.

### 2.3 Lemon Squeezy Webhook Secret
If Lemon Squeezy webhook secret is rotated:
1. Update `LEMON_SQUEEZY_SIGNATURE` in `.env`:
   ```env
   LEMON_SQUEEZY_SIGNATURE="new-signature"
   ```
2. Clear configuration cache:
   ```bash
   php artisan config:clear
   ```

---

## 3. Panic Switches & Maintenance Mode

### 3.1 Global Maintenance Mode
To temporarily put the entire application into maintenance mode:
```bash
php artisan down --secret="bypass-token-here"
```
To bring it back online:
```bash
php artisan up
```

### 3.2 Feature-Specific Switches
To disable platform features without bringing down the server, update `.env`:

*   **Disable VenSynQ Marketplace Sync**:
    Set `VENSYNQ_ENABLED=false` in `.env`. The scheduler will immediately ignore marketplace checks.
*   **Disable Chatbot Service**:
    Set `CHATBOT_ENABLED=false` or throttle keys in `.env` to reject incoming queries.

### 3.3 Force Logout / Clear Cache
If the server suffers from memory pressure or cache corruption:
```bash
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear
```
