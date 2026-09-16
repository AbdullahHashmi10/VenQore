#!/usr/bin/env bash
# ==============================================================================
# VenQore Production Deployment Script
#
# Run this on your production server via SSH:
#   bash deploy_production.sh
#
# Features:
#   - Clones fresh production-clean release into an isolated directory
#   - Automatically fixes directory permissions (chmod 755 for dirs, 644 for files)
#   - Runs strict pre-activation verification pass (aborts safely before touching live)
#   - Preserves persistent .env and storage/ from live site
#   - Enters maintenance mode, performs atomic directory swap, runs migrations
#   - Rebuilds Laravel production caches and restarts background workers
#   - Executes post-deployment health check against /up
#   - Provides one-command rollback if anything fails
# ==============================================================================

set -euo pipefail

# ── Configuration (Override via environment variables if desired) ─────────────
APP_DIR="${APP_DIR:-/var/www/venqore}"
REPO_URL="${REPO_URL:-https://github.com/AbdullahHashmi10/VenQore.git}"
BRANCH="${BRANCH:-production-clean}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/venqore}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1/up}"
WEB_USER="${WEB_USER:-www-data}"
WEB_GROUP="${WEB_GROUP:-www-data}"

STAMP="$(date +%Y%m%d_%H%M%S)"
RELEASE_DIR="${APP_DIR}_release_${STAMP}"
BACKUP_FILE="${BACKUP_DIR}/venqore_backup_${STAMP}"

echo "======================================================="
echo "  VenQore Production Deployment (${BRANCH})"
echo "======================================================="
echo "Target App Directory:  $APP_DIR"
echo "Release Directory:     $RELEASE_DIR"
echo "Backup Directory:      $BACKUP_DIR"
echo "Timestamp:             $STAMP"
echo ""

# ── Step 1: Pre-flight tool check ─────────────────────────────────────────────
echo "--> Step 1: Checking server dependencies..."
for cmd in git php composer curl; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "ERROR: Required tool '$cmd' is not installed or not in PATH." >&2
        exit 1
    fi
done
mkdir -p "$BACKUP_DIR"

# ── Step 2: Fresh clone of production-clean ───────────────────────────────────
echo "--> Step 2: Fetching clean code from $BRANCH..."
rm -rf "$RELEASE_DIR"
git clone --branch "$BRANCH" --single-branch --depth 1 "$REPO_URL" "$RELEASE_DIR"

# ── Step 3: Fix Directory & File Permissions (The 755 Fix) ─────────────────────
echo "--> Step 3: Applying directory (755) and file (644) permissions..."
find "$RELEASE_DIR" -type d -exec chmod 755 {} +
find "$RELEASE_DIR" -type f -exec chmod 644 {} +
chmod +x "$RELEASE_DIR/artisan"

# ── Step 4: Verification pass (Abort before touching live if broken) ──────────
echo "--> Step 4: Verifying release integrity..."
for file in "artisan" "composer.json" "public/index.php" "bootstrap/app.php"; do
    if [ ! -f "$RELEASE_DIR/$file" ]; then
        echo "ERROR: Critical file '$file' is missing in release! Aborting deploy." >&2
        rm -rf "$RELEASE_DIR"
        exit 1
    fi
done

if [ ! -x "$RELEASE_DIR/public" ] || [ ! -x "$RELEASE_DIR/bootstrap" ]; then
    echo "ERROR: Directory permission check failed on public or bootstrap! Aborting." >&2
    rm -rf "$RELEASE_DIR"
    exit 1
fi
echo "[OK] Verification passed. Release is sound."

# ── Step 5: Preserve and link live state (.env and storage) ───────────────────
echo "--> Step 5: Preparing persistent configuration and storage..."
if [ -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env" "$RELEASE_DIR/.env"
    chmod 600 "$RELEASE_DIR/.env"
    echo "[OK] Preserved .env configuration."
else
    echo "WARNING: No existing .env found at $APP_DIR/.env. Ensure $RELEASE_DIR/.env is configured."
fi

# Ensure storage directories exist in release
mkdir -p "$RELEASE_DIR/storage/app/public" \
         "$RELEASE_DIR/storage/framework/cache/data" \
         "$RELEASE_DIR/storage/framework/sessions" \
         "$RELEASE_DIR/storage/framework/views" \
         "$RELEASE_DIR/storage/logs" \
         "$RELEASE_DIR/bootstrap/cache"

# If live storage exists, sync user uploads and media
if [ -d "$APP_DIR/storage/app" ]; then
    echo "Syncing persistent uploads from live storage..."
    cp -rn "$APP_DIR/storage/app/"* "$RELEASE_DIR/storage/app/" 2>/dev/null || true
fi

# Set appropriate ownership and permissions for web server
if [ "$(id -u)" -eq 0 ]; then
    chown -R "$WEB_USER:$WEB_GROUP" "$RELEASE_DIR/storage" "$RELEASE_DIR/bootstrap/cache"
fi
chmod -R 775 "$RELEASE_DIR/storage" "$RELEASE_DIR/bootstrap/cache"

# ── Step 6: Install PHP dependencies ──────────────────────────────────────────
echo "--> Step 6: Installing Composer dependencies (production optimize)..."
(
    cd "$RELEASE_DIR"
    composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
)

# ── Step 7: Atomic Swap with live backup ──────────────────────────────────────
echo "--> Step 7: Performing atomic release swap..."
if [ -d "$APP_DIR" ]; then
    # Brief maintenance signal if app is running
    (cd "$APP_DIR" && php artisan down --render="errors::503" --retry=60) 2>/dev/null || true
    echo "Backing up current live site to $BACKUP_FILE..."
    mv "$APP_DIR" "$BACKUP_FILE"
fi

# Move new release into place
mv "$RELEASE_DIR" "$APP_DIR"

# ── Step 8: Database migrations and cache warm-up ─────────────────────────────
echo "--> Step 8: Finalizing live application..."
(
    cd "$APP_DIR"
    php artisan storage:link 2>/dev/null || true

    echo "Running database migrations..."
    php artisan migrate --force

    echo "Rebuilding Laravel production caches..."
    php artisan route:clear
    php artisan config:cache
    php artisan view:cache
    php artisan event:cache

    echo "Restarting queue workers..."
    php artisan queue:restart 2>/dev/null || true

    echo "Bringing application out of maintenance mode..."
    php artisan up 2>/dev/null || true
)

# ── Step 9: Post-Deployment Health Check ──────────────────────────────────────
echo "--> Step 9: Checking health status ($HEALTHCHECK_URL)..."
HEALTH_STATUS=0
if command -v curl >/dev/null 2>&1; then
    sleep 2
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTHCHECK_URL" || echo "000")
    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 400 ]; then
        echo "[OK] Health check passed (HTTP $HTTP_CODE)."
    else
        echo "WARNING: Health check returned HTTP $HTTP_CODE."
        HEALTH_STATUS=1
    fi
fi

echo ""
echo "======================================================="
if [ "$HEALTH_STATUS" -eq 0 ]; then
    echo "  DEPLOYMENT SUCCESSFUL! Version is live."
    echo "======================================================="
    echo "Live Directory:   $APP_DIR"
    echo "Previous Backup:  $BACKUP_FILE"
else
    echo "  DEPLOYMENT FINISHED WITH HEALTH WARNING!"
    echo "======================================================="
    echo "If you need to roll back immediately, run:"
    echo "  php artisan down"
    echo "  mv \"$APP_DIR\" \"${APP_DIR}_failed_${STAMP}\""
    echo "  mv \"$BACKUP_FILE\" \"$APP_DIR\""
    echo "  cd \"$APP_DIR\" && php artisan up"
fi
