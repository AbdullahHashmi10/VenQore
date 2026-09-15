#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
APP_DIR="$REPO_ROOT/app-code/main-app"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/venqore}"
BACKUP_DATABASE="${BACKUP_DATABASE:-venqore_pos}"
BRANCH="${DEPLOY_BRANCH:-master}"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/$BACKUP_DATABASE-$STAMP.sql.gz"
MAINTENANCE_ENABLED=0

restore_app_availability() {
    if [ "$MAINTENANCE_ENABLED" -eq 1 ]; then
        (cd "$APP_DIR" && php artisan up) || true
    fi
}
trap restore_app_availability EXIT

echo "=== VenQore Deployment ==="
echo "Started: $(date)"

echo "--- Pre-flight config guard..."
(cd "$APP_DIR" && php artisan venqore:config-guard)

echo "--- Backing up database..."
mkdir -p "$BACKUP_DIR"
# Credentials must come from the production host's restricted MySQL option
# file (for example /root/.my.cnf); never put a password in this script.
mysqldump --single-transaction --quick --routines --events \
    "$BACKUP_DATABASE" | gzip > "$BACKUP_FILE"
gzip -t "$BACKUP_FILE"
test -s "$BACKUP_FILE"
echo "    Backup: $BACKUP_FILE"

echo "--- Pulling latest code..."
cd "$REPO_ROOT"
git pull origin "$BRANCH"
cd "$APP_DIR"

echo "--- Installing dependencies..."
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
npm ci
npm run build

echo "--- Regenerating Ziggy routes..."
php artisan ziggy:generate

echo "--- Entering maintenance mode..."
php artisan down --render="errors::503" --retry=60 || true
MAINTENANCE_ENABLED=1

echo "--- Running migrations..."
php artisan migrate --force

echo "--- Rebuilding caches..."
# Route serialization is deliberately omitted because routes/web.php contains
# closures. Clear any stale route cache left by an older deployment instead.
php artisan route:clear
php artisan config:cache
php artisan view:cache
php artisan event:cache

echo "--- Restarting database queue worker..."
php artisan queue:restart

php artisan up
MAINTENANCE_ENABLED=0

echo "--- Health check..."
sleep 3
curl -fsS "${HEALTHCHECK_URL:-https://venqore.com/health}" > /dev/null \
    || { echo "!! HEALTH CHECK FAILED"; exit 1; }

trap - EXIT
echo "=== Deployment complete: $(date) ==="
echo "Rollback instructions: deploy/ROLLBACK.md"
echo "Backup used for rollback: $BACKUP_FILE"
