# VenQore — Production Database Backup & Disaster Recovery Guide

**Document Version:** 1.0  
**Date:** 2026-09-10  
**Authority:** Pre-Launch Checklist §15 / T-42  
**Target Database:** `venqore_pos` (MariaDB 10.5+)

---

## 1. Automated Daily Backup Policy

### Frequency and Retention Schedule
- **Daily Dumps:** Retained for 7 days (`/var/backups/venqore/daily/`)
- **Weekly Snapshots:** Retained for 4 weeks (`/var/backups/venqore/weekly/`)
- **Monthly Archives:** Retained for 12 months (`/var/backups/venqore/monthly/`)
- **Pre-deployment Dumps:** Created automatically by `deploy.sh` before any migration runs.

### Command Specification
Run via system cron (`/etc/cron.d/venqore-backup`) or Laravel scheduler at **02:00 UTC**:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/venqore"
DATE_STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET_FILE="$BACKUP_DIR/daily/venqore_pos-$DATE_STAMP.sql.gz"

mkdir -p "$BACKUP_DIR/daily"

# --single-transaction ensures consistent snapshot without table locking on InnoDB
# --routines and --events preserve stored procedures and triggers
mysqldump --single-transaction --quick --routines --events venqore_pos | gzip > "$TARGET_FILE"

# Verify gzip integrity and non-empty file
gzip -t "$TARGET_FILE"
test -s "$TARGET_FILE"

# Also archive user uploads directory (invoice scans, receipts, logo assets)
tar -czf "$BACKUP_DIR/daily/uploads-$DATE_STAMP.tar.gz" -C /var/www/venqore/app-code/main-app/storage/app public/

# Retention pruning: delete daily backups older than 7 days
find "$BACKUP_DIR/daily" -type f -name "*.gz" -mtime +7 -delete

echo "Backup complete: $TARGET_FILE"
```

---

## 2. Offsite Object Storage Sync (AWS S3)

Using standard AWS CLI or S3-compatible rsync:

```bash
# Push daily dump and uploads archive to encrypted offsite bucket
aws s3 cp "$TARGET_FILE" "s3://${AWS_BUCKET}/db-backups/daily/" --sse AES256
aws s3 cp "$BACKUP_DIR/daily/uploads-$DATE_STAMP.tar.gz" "s3://${AWS_BUCKET}/uploads-backups/daily/" --sse AES256
```

---

## 3. Verified Restore Procedure (Run to test RTO / RPO)

### Step 1: Prepare scratch database
```bash
mysql -e "DROP DATABASE IF EXISTS venqore_pos_restore_test; CREATE DATABASE venqore_pos_restore_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Step 2: Stream restore from compressed archive
```bash
gunzip -c /var/backups/venqore/daily/venqore_pos-<LATEST>.sql.gz | mysql venqore_pos_restore_test
```

### Step 3: Run schema and integrity verification
```bash
# Check migration status against the restored copy
DB_DATABASE=venqore_pos_restore_test php artisan migrate:status

# Verify financial trial balance integrity
DB_DATABASE=venqore_pos_restore_test php artisan test tests/tests/Routes/FullRouteSweepTest.php
```

### Step 4: Clean up scratch database
```bash
mysql -e "DROP DATABASE venqore_pos_restore_test;"
```

---

## 4. Emergency Production Rollback

In the event of an operational incident or failed schema migration, execute the documented rollback procedure in `deploy/ROLLBACK.md`:

```bash
# 1. Put application into maintenance mode
php artisan down --render="errors::503"

# 2. Restore pre-deployment database dump
gunzip -c /var/backups/venqore/venqore_pos-<TIMESTAMP>.sql.gz | mysql venqore_pos

# 3. Checkout previous stable Git commit and clear caches
git checkout <PREVIOUS_STABLE_COMMIT>
composer install --no-dev --optimize-autoloader
php artisan optimize:clear
php artisan config:cache
php artisan view:cache
php artisan event:cache

# 4. Bring application back online
php artisan up
```
