# VenQore Production Rollback & Recovery Guide

**Document Version:** 2.0  
**Authority:** Section B.4 & D.5 of `UPDATER_V6.0.5_AUDIT_AND_IDE_FIX_INSTRUCTIONS.md` and `RELEASE_AND_DEPLOYMENT_POLICY.md`  
**Target Environment:** Production Host (`/var/www/venqore`)

---

## 1. Instant Application Rollback (Sub-Second, Zero Downtime)

> [!WARNING]
> An application-only symlink rollback reverts PHP/frontend code to the prior release, but **does not reverse database migrations** that ran during deployment. This rollback is safe ONLY IF all migrations in the release are additive and backwards-compatible with the previous application code. If a migration broke backwards compatibility, you must execute an Emergency Database Restore (Section 2).

Use this procedure when a newly activated release exhibits regressions, but the database schema is confirmed backward-compatible:

```bash
#!/usr/bin/env bash
set -euo pipefail

DEPLOY_BASE="/var/www/venqore"
CURRENT_LINK="$DEPLOY_BASE/current"
RELEASES_DIR="$DEPLOY_BASE/releases"

# 1. Identify the previous known-good release directory
# (deploy_production.sh prints this at completion; or check ls -dt $RELEASES_DIR/20*)
PREVIOUS_RELEASE="${1:-}"

if [ -z "$PREVIOUS_RELEASE" ] || [ ! -d "$PREVIOUS_RELEASE" ]; then
    echo "Usage: ./rollback.sh /var/www/venqore/releases/YYYYMMDD_HHMMSS"
    echo "Available releases:"
    ls -dt "$RELEASES_DIR"/20* 2>/dev/null
    exit 1
fi

echo "--> Rolling back to $PREVIOUS_RELEASE..."

# 2. Atomic symlink switch
ln -sfn "$PREVIOUS_RELEASE" "$DEPLOY_BASE/current_tmp"
mv -Tf "$DEPLOY_BASE/current_tmp" "$CURRENT_LINK"

# 3. Restart queue workers so jobs execute using rolled-back release code
php "$CURRENT_LINK/artisan" queue:restart

# 4. Immediate health verification
curl -fsS "http://127.0.0.1/up" > /dev/null && echo "[OK] Rollback successful! App is healthy."
```

---

## 2. Emergency Database Restore (Destructive Disaster Recovery)

> [!CAUTION]
> Restoring a database snapshot replaces the live database. Any transactions, sales, or customer writes created after the snapshot was taken will be overwritten. Use this procedure ONLY if breaking schema changes or data corruption occurred that cannot be remediated with a forward migration.

### Prerequisites:
- Locate the pre-deployment database dump created by `deploy_production.sh`:
  `/var/backups/venqore/venqore_pos_pre_deploy_YYYYMMDD_HHMMSS.sql.gz`
- Verify backup integrity before doing anything:
  ```bash
  gzip -t "$BACKUP_FILE" && test -s "$BACKUP_FILE" && echo "Backup is valid."
  ```

### Disaster Recovery Steps:

1. **Enter Maintenance Mode** (Prevent customer writes during restore):
   ```bash
   php /var/www/venqore/current/artisan down --render="errors::503" --retry=60
   ```

2. **Capture an Incident Snapshot** of the corrupted state for post-mortem analysis:
   ```bash
   mysqldump --single-transaction --quick --routines --events venqore_pos \
       | gzip > "/var/backups/venqore/incident_snapshot_$(date +%Y%m%d_%H%M%S).sql.gz"
   ```

3. **Restore Database from Pre-Deployment Dump**:
   ```bash
   gunzip -c "$BACKUP_FILE" | mysql venqore_pos
   ```

4. **Point Symlink Back to Prior Release**:
   ```bash
   ln -sfn "$PREVIOUS_RELEASE" /var/www/venqore/current_tmp
   mv -Tf /var/www/venqore/current_tmp /var/www/venqore/current
   ```

5. **Re-warm Caches and Restart Workers**:
   ```bash
   cd /var/www/venqore/current
   php artisan route:clear
   php artisan config:cache
   php artisan view:cache
   php artisan event:cache
   php artisan queue:restart
   ```

6. **Exit Maintenance Mode & Verify**:
   ```bash
   php artisan up
   curl -fsS http://127.0.0.1/up
   ```

7. **Conduct Post-Rollback Audits**:
   - Verify user sign-in and tenant dashboard access.
   - Verify POS sales and cash register status.
   - Check queue consumption and failed jobs (`php artisan queue:failed`).
   - Review webhook delivery logs.
