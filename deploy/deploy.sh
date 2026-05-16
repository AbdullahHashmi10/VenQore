#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  VenQore — Zero-Downtime Deploy Script (Phase 8)             ║
# ║  Usage: bash deploy/deploy.sh [--branch=main]                ║
# ╚══════════════════════════════════════════════════════════════╝
#
# PREREQUISITES:
#   - This script runs on the production server as www-data
#   - APP_DIR must point to your deployment path
#   - GitHub Actions (or ssh deploy key) triggers this via SSH
#   - npm is installed (Node >= 20 LTS)
#   - php 8.3 is on PATH
#
# FIRST TIME SETUP (run manually once):
#   1. Clone repo: git clone git@github.com:AbdullahHashmi10/AMD-Project.git /var/www/venqore
#   2. cp .env.production.example .env && nano .env   ← fill in all values
#   3. php artisan key:generate
#   4. php artisan migrate --force
#   5. php artisan storage:link
#   6. npm ci && npm run build
#   7. Touch the installed flag: touch storage/installed
#   8. sudo chown -R www-data:www-data /var/www/venqore
#   9. bash deploy/deploy.sh                          ← initial warm-up run
#
# SUBSEQUENT DEPLOYS:
#   Just push to main — GitHub Actions will SSH in and run this script.

set -euo pipefail

APP_DIR="/var/www/venqore"
BRANCH="${1:-main}"
PHP="/usr/bin/php8.3"
NPM="/usr/bin/npm"
ARTISAN="$PHP $APP_DIR/artisan"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 VenQore Deploy — $(date '+%Y-%m-%d %H:%M:%S')"
echo "   Branch: $BRANCH | Dir: $APP_DIR"

cd "$APP_DIR"

# ── 1. Pull latest code ───────────────────────────────────────────
echo "📥 Pulling latest code..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# ── 2. Enable maintenance mode (Horizon keeps processing) ─────────
echo "🔧 Enabling maintenance mode..."
$ARTISAN down --secret="venqore-deploy-bypass-$(date +%s)" --render="errors::503" || true

# ── 3. Install PHP dependencies (production only) ─────────────────
echo "📦 Installing Composer dependencies..."
composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts 2>&1

# ── 4. Build frontend assets ──────────────────────────────────────
echo "⚡ Building frontend assets..."
$NPM ci --prefer-offline
$NPM run build

# ── 5. Run database migrations ────────────────────────────────────
echo "🗄️  Running migrations..."
$ARTISAN migrate --force

# ── 6. Clear and re-warm caches ───────────────────────────────────
echo "♻️  Clearing caches..."
$ARTISAN config:clear
$ARTISAN route:clear
$ARTISAN view:clear
$ARTISAN event:clear

echo "🔥 Warming caches..."
$ARTISAN config:cache
$ARTISAN route:cache
$ARTISAN view:cache
$ARTISAN event:cache

# ── 7. Restart queue workers (Horizon) ───────────────────────────
echo "🔄 Restarting Horizon..."
$ARTISAN horizon:terminate
sleep 3  # wait for graceful Horizon shutdown
sudo supervisorctl restart venqore-horizon:* 2>/dev/null || true

# ── 8. Clear OPcache ─────────────────────────────────────────────
echo "🧹 Clearing OPcache..."
# Works if php-cli and php-fpm share the same opcache config
$ARTISAN opcache:clear 2>/dev/null || true
# Alternative: touch the FPM reload trick
sudo systemctl reload php8.3-fpm 2>/dev/null || true

# ── 9. Disable maintenance mode ───────────────────────────────────
echo "✅ Taking app out of maintenance mode..."
$ARTISAN up

# ── 10. Health check ────────────────────────────────────────────
echo "🏥 Health check..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://venqore.com/up 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Deploy succeeded. App is live. (HTTP $HTTP_STATUS)"
else
    echo "⚠️  Health check returned HTTP $HTTP_STATUS — verify manually."
    echo "   URL: https://venqore.com/up"
fi

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  Deploy complete at $(date '+%H:%M:%S')"
echo "  Commit: $(git rev-parse --short HEAD)"
echo "══════════════════════════════════════════════════════════"
