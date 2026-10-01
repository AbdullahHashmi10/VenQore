#!/usr/bin/env bash
# ==============================================================================
# VenQore Production Zero-Downtime Deployment Script (Atomic Symlink Architecture)
#
# Meets Section B.4 & D.5 of UPDATER_V6.0.5_AUDIT_AND_IDE_FIX_INSTRUCTIONS.md
# and RELEASE_AND_DEPLOYMENT_POLICY.md.
#
# Directory Layout:
#   $DEPLOY_BASE_DIR/
#     ├── current -> releases/YYYYMMDD_HHMMSS (Atomic Symlink)
#     ├── releases/
#     │   ├── YYYYMMDD_HHMMSS
#     │   └── ...
#     └── shared/
#         ├── .env
#         └── storage/
#             ├── app/public/
#             ├── framework/{cache/data, sessions, views}
#             └── logs/
#
# Features:
#   - Atomic symlink activation (mv -Tf) for true zero visible downtime.
#   - Shared persistent .env and storage links; customer uploads never duplicated.
#   - Pre-activation verification (isolated PHP autoloader, artisan discovery, critical files).
#   - Additive database migrations executed against new release code BEFORE symlink swap.
#   - Production cache pre-warming (config, view, event) before activation.
#   - Background queue worker graceful restart (queue:restart) post-activation.
#   - Post-activation health check against /up or /health.
#   - Automatic immediate rollback trap: instant symlink reversion if health check fails.
#   - Automatic release retention: keeps last 5 releases, safely prunes older ones.
# ==============================================================================

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
DEPLOY_BASE_DIR="${DEPLOY_BASE_DIR:-/var/www/venqore}"
RELEASES_DIR="${DEPLOY_BASE_DIR}/releases"
SHARED_DIR="${DEPLOY_BASE_DIR}/shared"
CURRENT_LINK="${DEPLOY_BASE_DIR}/current"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/venqore}"
BACKUP_DATABASE="${BACKUP_DATABASE:-venqore_pos}"
REPO_URL="${REPO_URL:-https://github.com/AbdullahHashmi10/VenQore.git}"
BRANCH="${BRANCH:-production-clean}"
PACKAGE_ZIP="${PACKAGE_ZIP:-}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1/up}"
WEB_USER="${WEB_USER:-www-data}"
WEB_GROUP="${WEB_GROUP:-www-data}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

STAMP="$(date +%Y%m%d_%H%M%S)"
RELEASE_DIR="${RELEASES_DIR}/${STAMP}"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_DATABASE}_pre_deploy_${STAMP}.sql.gz"

echo "======================================================="
echo "  VenQore Production Zero-Downtime Deployment"
echo "======================================================="
echo "Base Directory:     $DEPLOY_BASE_DIR"
echo "Releases Directory: $RELEASES_DIR"
echo "Shared Directory:   $SHARED_DIR"
echo "Active Symlink:     $CURRENT_LINK"
echo "New Release:        $RELEASE_DIR"
echo "Timestamp:          $STAMP"
echo ""

# ── Step 1: Pre-flight tool check ─────────────────────────────────────────────
echo "--> Step 1: Checking server dependencies..."
for cmd in php curl mysqldump; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "ERROR: Required tool '$cmd' is not installed or not in PATH." >&2
        exit 1
    fi
done

if [ -z "$PACKAGE_ZIP" ]; then
    for cmd in git composer; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            echo "ERROR: Required tool '$cmd' is not installed or not in PATH." >&2
            exit 1
        fi
    done
fi

# Ensure base directories exist
mkdir -p "$RELEASES_DIR" "$SHARED_DIR/storage" "$BACKUP_DIR"
mkdir -p "$SHARED_DIR/storage/app/public" \
         "$SHARED_DIR/storage/framework/cache/data" \
         "$SHARED_DIR/storage/framework/sessions" \
         "$SHARED_DIR/storage/framework/views" \
         "$SHARED_DIR/storage/logs"

# Verify shared .env exists
if [ ! -f "$SHARED_DIR/.env" ]; then
    if [ -f "$DEPLOY_BASE_DIR/.env" ]; then
        echo "Migrating $DEPLOY_BASE_DIR/.env to $SHARED_DIR/.env..."
        cp "$DEPLOY_BASE_DIR/.env" "$SHARED_DIR/.env"
        chmod 600 "$SHARED_DIR/.env"
    else
        echo "ERROR: Shared environment file missing at $SHARED_DIR/.env! Aborting." >&2
        exit 1
    fi
fi

# ── Step 2: Database backup (Non-locking snapshot) ────────────────────────────
echo "--> Step 2: Creating pre-deployment database backup..."
mysqldump --single-transaction --quick --routines --events "$BACKUP_DATABASE" | gzip > "$BACKUP_FILE"
gzip -t "$BACKUP_FILE"
test -s "$BACKUP_FILE"
echo "[OK] Verified backup saved to $BACKUP_FILE"

# ── Step 3: Stage fresh release code ──────────────────────────────────────────
echo "--> Step 3: Staging release code into $RELEASE_DIR..."
mkdir -p "$RELEASE_DIR"

if [ -n "$PACKAGE_ZIP" ] && [ -f "$PACKAGE_ZIP" ]; then
    echo "Deploying from pre-built package: $PACKAGE_ZIP"
    unzip -q -o "$PACKAGE_ZIP" -d "$RELEASE_DIR"
else
    echo "Cloning clean branch $BRANCH from $REPO_URL..."
    git clone --branch "$BRANCH" --single-branch --depth 1 "$REPO_URL" "$RELEASE_DIR"
fi

# Apply safe permissions
find "$RELEASE_DIR" -type d -exec chmod 755 {} +
find "$RELEASE_DIR" -type f -exec chmod 644 {} +
chmod +x "$RELEASE_DIR/artisan"

# ── Step 4: Link persistent state (.env and shared storage) ───────────────────
echo "--> Step 4: Linking shared persistent storage and configuration..."
rm -f "$RELEASE_DIR/.env"
ln -sfn "$SHARED_DIR/.env" "$RELEASE_DIR/.env"

rm -rf "$RELEASE_DIR/storage"
ln -sfn "$SHARED_DIR/storage" "$RELEASE_DIR/storage"

mkdir -p "$RELEASE_DIR/bootstrap/cache"

if [ "$(id -u)" -eq 0 ]; then
    chown -R "$WEB_USER:$WEB_GROUP" "$SHARED_DIR/storage" "$RELEASE_DIR/bootstrap/cache"
fi
chmod -R 775 "$SHARED_DIR/storage" "$RELEASE_DIR/bootstrap/cache"

# If vendor is missing (e.g. git clone), install clean production composer dependencies
if [ ! -f "$RELEASE_DIR/vendor/autoload.php" ]; then
    echo "--> Installing production Composer dependencies..."
    (
        cd "$RELEASE_DIR"
        composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
    )
fi

# ── Step 5: Pre-activation integrity verification ─────────────────────────────
echo "--> Step 5: Running pre-activation release integrity checks..."
for file in "artisan" "composer.json" "public/index.php" "bootstrap/app.php"; do
    if [ ! -f "$RELEASE_DIR/$file" ]; then
        echo "ERROR: Critical file '$file' is missing in release staging! Aborting deploy." >&2
        rm -rf "$RELEASE_DIR"
        exit 1
    fi
done

# Verify PHP autoloader can boot cleanly in isolated process
php -r "require '${RELEASE_DIR}/vendor/autoload.php'; echo 'Autoload OK\n';"

# Verify package discovery works with release code
(
    cd "$RELEASE_DIR"
    php artisan package:discover --ansi
    php artisan storage:link 2>/dev/null || true
)

echo "[OK] Pre-activation checks passed cleanly."

# ── Step 6: Database migrations (Forward-compatible) ──────────────────────────
echo "--> Step 6: Executing database migrations..."
(
    cd "$RELEASE_DIR"
    php artisan migrate --force
)

# ── Step 7: Pre-warm production caches ────────────────────────────────────────
echo "--> Step 7: Pre-warming production caches..."
(
    cd "$RELEASE_DIR"
    php artisan route:clear
    php artisan config:cache
    php artisan view:cache
    php artisan event:cache
)

# ── Step 8: Atomic Symlink Activation ─────────────────────────────────────────
echo "--> Step 8: Activating release via atomic symlink swap..."
PREVIOUS_RELEASE=""
if [ -L "$CURRENT_LINK" ]; then
    PREVIOUS_RELEASE="$(readlink -f "$CURRENT_LINK")"
    echo "Current active release: $PREVIOUS_RELEASE"
elif [ -d "$CURRENT_LINK" ]; then
    echo "Notice: $CURRENT_LINK is currently a real directory. Moving to releases/legacy..."
    mkdir -p "$RELEASES_DIR/legacy_$(date +%Y%m%d_%H%M%S)"
    mv "$CURRENT_LINK" "$RELEASES_DIR/legacy_$(date +%Y%m%d_%H%M%S)/"
fi

# Atomic symlink replacement using ln -sfn and mv -Tf
ln -sfn "$RELEASE_DIR" "${DEPLOY_BASE_DIR}/current_tmp"
mv -Tf "${DEPLOY_BASE_DIR}/current_tmp" "$CURRENT_LINK"

echo "[OK] Symlink switched to $RELEASE_DIR atomically (zero visible downtime)."

# ── Step 9: Restart background workers ────────────────────────────────────────
echo "--> Step 9: Restarting background workers..."
(
    cd "$CURRENT_LINK"
    php artisan queue:restart 2>/dev/null || true
)

# ── Step 10: Post-Deployment Health Check & Rollback Trap ─────────────────────
echo "--> Step 10: Running post-deployment health check against $HEALTHCHECK_URL..."
sleep 2

HEALTH_PASSED=1
if command -v curl >/dev/null 2>&1; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTHCHECK_URL" || echo "000")
    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 400 ]; then
        echo "[OK] Health check passed (HTTP $HTTP_CODE)."
    else
        echo "CRITICAL: Health check returned HTTP $HTTP_CODE!"
        HEALTH_PASSED=0
    fi
fi

if [ "$HEALTH_PASSED" -eq 0 ]; then
    echo "======================================================="
    echo "  DEPLOYMENT FAILED POST-ACTIVATION HEALTH CHECK!      "
    echo "======================================================="
    if [ -n "$PREVIOUS_RELEASE" ] && [ -d "$PREVIOUS_RELEASE" ]; then
        echo "Executing APPLICATION CODE ROLLBACK to $PREVIOUS_RELEASE..."
        ln -sfn "$PREVIOUS_RELEASE" "${DEPLOY_BASE_DIR}/current_tmp"
        mv -Tf "${DEPLOY_BASE_DIR}/current_tmp" "$CURRENT_LINK"
        (cd "$CURRENT_LINK" && php artisan queue:restart 2>/dev/null || true)
        echo "[WARNING] Application code symlink restored to $PREVIOUS_RELEASE."
        echo ""
        echo "CRITICAL DATABASE NOTICE:"
        echo "Database migrations were executed on $BACKUP_DATABASE in Step 6"
        echo "and HAVE NOT BEEN ROLLED BACK automatically."
        echo "If the executed migrations are incompatible with $PREVIOUS_RELEASE,"
        echo "the application may experience database errors until the pre-deployment"
        echo "backup is manually restored:"
        echo "  gunzip -c \"$BACKUP_FILE\" | mysql \"$BACKUP_DATABASE\""
    fi
    mv "$RELEASE_DIR" "${RELEASE_DIR}_failed"
    echo "Failed release marked: ${RELEASE_DIR}_failed"
    echo "Database backup available at: $BACKUP_FILE"
    exit 1
fi

# ── Step 11: Release Retention Pruning ────────────────────────────────────────
echo "--> Step 11: Pruning old releases (keeping last $KEEP_RELEASES)..."
(
    cd "$RELEASES_DIR"
    # List releases sorted by modification time, skip the newest $KEEP_RELEASES
    ls -dt 20* 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) | while read -r old_release; do
        FULL_PATH="$RELEASES_DIR/$old_release"
        if [ "$FULL_PATH" != "$RELEASE_DIR" ] && [ "$FULL_PATH" != "$PREVIOUS_RELEASE" ]; then
            echo "Pruning old release: $old_release"
            rm -rf "$FULL_PATH"
        fi
    done
)

echo ""
echo "======================================================="
echo "  DEPLOYMENT SUCCESSFUL! Release is live."
echo "======================================================="
echo "Active Symlink:    $CURRENT_LINK -> $RELEASE_DIR"
echo "Previous Release:  ${PREVIOUS_RELEASE:-none}"
echo "Database Backup:   $BACKUP_FILE"
echo "Rollback Guide:    deploy/ROLLBACK.md"
