# VenQore Pre-Deployment Playbook

This playbook standardizes how the team ships updates to VenQore to prevent broken builds from reaching the live servers.

> [!CAUTION]
> No release or update `.zip` should ever be generated or deployed without passing the automated pre-flight system.

## 1. Automated Pre-Flight Gatekeeper

We have introduced the `php artisan system:preflight` command. This command is automatically executed inside `bundle_for_update.ps1` and `build_release.ps1`.

### What it Checks:
- **PHP Extensions**: Validates `zip`, `mbstring`, `pdo_mysql`, `gd`, `bcmath` are installed and loaded on the build environment. This prevents the `500` fatal Inertia errors we saw on production previously.
- **Database Migrations**: Runs `artisan migrate:status` to ensure no database schema changes have been forgotten locally.
- **Route & Config Caches**: Runs `artisan route:cache` to ensure no closure-based routes break the caching mechanism.
- **PHPUnit Tests**: Automatically runs the entire test suite `php artisan test --stop-on-failure`. 

### How to Fix Failures:
If the build script aborts with a pre-flight error, **do not bypass it**. 
Read the terminal output to identify the exact failing test or missing extension, fix the root cause locally, and re-run the build script.

## 2. Manual UI/UX QA Checklist

While automation handles the backend data and API integrity, the frontend must be manually verified for edge-case regressions before finalizing a major release.

### Critical Flows to Verify:
- [ ] **Multi-Tenant Setup**: Create a new store from scratch. Verify the onboarding wizard completes without 500 errors and routes to the dashboard correctly.
- [ ] **AppSumo Code Stacking**: Attempt to redeem an LTD code. Verify the plan upgrades and limits are applied properly in the Settings panel.
- [ ] **WooCommerce Sync**: If `woocommerce=true` in plan limits, toggle the sync and ensure webhook creation doesn't error.
- [ ] **POS Offline Mode**: Enter a transaction offline, reconnect to Wi-Fi, and verify the transaction posts to the central database successfully.

## 3. Deployment Steps

1. Run `npm run build` to compile the Vite/Vue/Inertia assets.
2. Run `.\bundle_for_update.ps1 -Version "x.x.x"` (or `build_release.ps1`).
3. Allow the pre-flight checks to run.
4. If successful, upload the resulting `.zip` file via the Super Admin updater page on production.
5. Notify customers of new features using the in-app announcement bell.
