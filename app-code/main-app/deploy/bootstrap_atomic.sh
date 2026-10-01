#!/usr/bin/env bash
# ==============================================================================
# VenQore Atomic Deployment Architecture Bootstrap Script
#
# Migrates an existing single-folder Laravel deployment to the atomic
# releases structure (shared/.env, shared/storage, releases/, current symlink).
#
# Pre-requisite: Schedule a brief maintenance window before running.
#
# Usage:
#   bash bootstrap_atomic.sh [/var/www/venqore]
# ==============================================================================

set -euo pipefail

TARGET_DIR="${1:-/var/www/venqore}"
TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd || echo "$TARGET_DIR")"

echo "======================================================="
echo "  VenQore Atomic Architecture Bootstrap"
echo "======================================================="
echo "Target Directory: $TARGET_DIR"

if [ -L "$TARGET_DIR" ]; then
    echo "ERROR: $TARGET_DIR is already a symbolic link. Aborting." >&2
    exit 1
fi

if [ ! -f "$TARGET_DIR/artisan" ]; then
    echo "ERROR: No Laravel application (artisan) found at $TARGET_DIR. Aborting." >&2
    exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
PARENT_DIR="$(dirname "$TARGET_DIR")"
BASE_NAME="$(basename "$TARGET_DIR")"
TEMP_BASE="${PARENT_DIR}/${BASE_NAME}_atomic_bootstrap_${STAMP}"

echo "Step 1: Creating directory skeleton at $TEMP_BASE..."
mkdir -p "$TEMP_BASE/releases"
mkdir -p "$TEMP_BASE/shared/storage/app/public" \
         "$TEMP_BASE/shared/storage/framework/cache/data" \
         "$TEMP_BASE/shared/storage/framework/sessions" \
         "$TEMP_BASE/shared/storage/framework/views" \
         "$TEMP_BASE/shared/storage/logs"

echo "Step 2: Migrating persistent .env configuration..."
if [ -f "$TARGET_DIR/.env" ]; then
    cp -p "$TARGET_DIR/.env" "$TEMP_BASE/shared/.env"
    chmod 600 "$TEMP_BASE/shared/.env"
else
    echo "ERROR: No .env file found in $TARGET_DIR! Aborting." >&2
    exit 1
fi

echo "Step 3: Migrating user uploads and media from storage/app..."
if [ -d "$TARGET_DIR/storage/app" ]; then
    cp -rn "$TARGET_DIR/storage/app/"* "$TEMP_BASE/shared/storage/app/" 2>/dev/null || true
fi

echo "Step 4: Initializing baseline release directory..."
FIRST_RELEASE="$TEMP_BASE/releases/baseline_$STAMP"
cp -rp "$TARGET_DIR" "$FIRST_RELEASE"

# Link shared persistent state into baseline release
rm -f "$FIRST_RELEASE/.env"
ln -sfn "$TEMP_BASE/shared/.env" "$FIRST_RELEASE/.env"

rm -rf "$FIRST_RELEASE/storage"
ln -sfn "$TEMP_BASE/shared/storage" "$FIRST_RELEASE/storage"

mkdir -p "$FIRST_RELEASE/bootstrap/cache"
chmod -R 775 "$TEMP_BASE/shared/storage" "$FIRST_RELEASE/bootstrap/cache"

# Set initial symlinks
ln -sfn "$FIRST_RELEASE" "$TEMP_BASE/current"

# CRITICAL: Create compatibility symlink for webroot
# Existing web server (Nginx) configs point to $TARGET_DIR/public.
# Creating a relative symlink public -> current/public ensures Nginx continues
# serving requests immediately without 404s after the directory swap.
ln -sfn "current/public" "$TEMP_BASE/public"
ln -sfn "current/artisan" "$TEMP_BASE/artisan"

echo "Step 5: Entering brief maintenance mode on legacy site..."
(cd "$TARGET_DIR" && php artisan down --render="errors::503" --retry=60) 2>/dev/null || true

echo "Step 6: Swapping directory layout..."
# Preserve legacy backup
mv "$TARGET_DIR" "${TARGET_DIR}_legacy_backup_${STAMP}"

# Move new atomic base into place
mv "$TEMP_BASE" "$TARGET_DIR"

# Bring application back up
(cd "$TARGET_DIR/current" && php artisan up) 2>/dev/null || true

echo "======================================================="
echo "  BOOTSTRAP COMPLETE!"
echo "======================================================="
echo "The atomic deployment directory structure is now active at $TARGET_DIR."
echo "Structure:"
echo "  $TARGET_DIR/current -> $FIRST_RELEASE"
echo "  $TARGET_DIR/public  -> current/public (compatibility bridge)"
echo "  $TARGET_DIR/shared/.env"
echo "  $TARGET_DIR/shared/storage/"
echo "  $TARGET_DIR/releases/"
echo ""
echo "Recommended Next Step:"
echo "  Update Nginx 'root' directive to point directly to: $TARGET_DIR/current/public"
echo "  Test configuration: nginx -t"
echo "  Reload web server:  systemctl reload nginx"
