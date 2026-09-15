# VenQore production rollback

Use this procedure only after identifying the deployment commit, the last known
good commit, and the exact backup created by `deploy.sh`. Rehearse the complete
procedure against a staging copy before launch.

## Prerequisites

- Confirm the backup is non-empty and passes `gzip -t`.
- Record the current commit with `git rev-parse HEAD`.
- Set `BACKUP_FILE` to the exact absolute `.sql.gz` path printed by the failed
  deployment. Do not use a wildcard or "latest" lookup.
- Set `PREVIOUS_SHA` to a reviewed, known-good commit.
- Ensure MySQL credentials come from a restricted client option file such as
  `/root/.my.cnf`; do not place a password on the command line.

## Application-only rollback

Use this when no migration ran, or every migration in the release is known to
be backward-compatible with the previous application version.

```bash
cd /var/www/venqore
php app-code/main-app/artisan down --render="errors::503" --retry=60
git checkout "$PREVIOUS_SHA"
cd app-code/main-app
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
npm ci
npm run build
php artisan ziggy:generate
php artisan route:clear
php artisan config:cache
php artisan view:cache
php artisan event:cache
php artisan queue:restart
php artisan up
curl -fsS https://venqore.com/health
```

## Database restore rollback

This replaces the production database. It is destructive and requires an
authorised operator. Take a second incident snapshot before restoring, keep the
application in maintenance mode, and verify the target database name manually.

```bash
gzip -t "$BACKUP_FILE"
test -s "$BACKUP_FILE"
cd /var/www/venqore/app-code/main-app
php artisan down --render="errors::503" --retry=60
mysqldump --single-transaction --quick --routines --events venqore_pos \
  | gzip > "/var/backups/venqore/pre-restore-$(date +%Y%m%d-%H%M%S).sql.gz"
gunzip -c "$BACKUP_FILE" | mysql venqore_pos
cd /var/www/venqore
git checkout "$PREVIOUS_SHA"
cd app-code/main-app
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
npm ci
npm run build
php artisan ziggy:generate
php artisan route:clear
php artisan config:cache
php artisan view:cache
php artisan event:cache
php artisan queue:restart
php artisan up
curl -fsS https://venqore.com/health
```

After either path, verify sign-in, one read-only tenant page, queue consumption,
password-reset delivery, the Lemon Squeezy webhook log, and `/health`. Preserve
the failed release SHA, deploy output, database snapshots, and incident notes.
