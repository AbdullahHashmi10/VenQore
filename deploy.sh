#!/bin/bash
set -e  # Exit immediately on any error

echo "=== AMD ERP Deployment ==="
echo "Started: $(date)"

# 1. Pull latest code
echo "--- Pulling latest code..."
git pull origin master

# 2. Install PHP dependencies
echo "--- Installing Composer dependencies..."
composer install --no-dev --optimize-autoloader

# 3. Install and build frontend
echo "--- Building frontend assets..."
npm ci
npm run build

# 4. Run migrations
echo "--- Running migrations..."
php artisan migrate --force

# 5. Clear and rebuild caches
echo "--- Rebuilding caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 6. Restart queue workers
echo "--- Restarting queue workers..."
php artisan queue:restart

# 7. Run smoke tests
echo "--- Running smoke tests..."
php artisan test tests/Feature/V3/ --stop-on-failure

echo "=== Deployment complete: $(date) ==="
