# VenQore: The Retail Operating System

## Project Overview
VenQore is an Offline-First, "Father-Friendly" Retail OS designed for Hostinger Shared Hosting.
It combines a Laravel 11 backend, FilamentPHP v3 Admin Panel, and a React + Inertia.js POS Interface.

## Tech Stack
- **Backend**: Laravel 11
- **Admin**: FilamentPHP v3
- **POS**: React + Inertia.js
- **Database**: MySQL (Hostinger) / SQLite (Local)
- **Offline**: Dexie.js (IndexedDB)
- **Styling**: Tailwind CSS

## Installation (Local)
1. `composer install`
2. `npm install`
3. `cp .env.example .env` (Configure DB)
4. `php artisan key:generate`
5. `php artisan migrate`
6. `php artisan filament:install --panels`
7. `npm run dev`

## Production builds and deployment
Follow [`RELEASE_AND_DEPLOYMENT_POLICY.md`](RELEASE_AND_DEPLOYMENT_POLICY.md) before creating or uploading a release. Do not manually ZIP the project or assume an existing deployment script is safe. The 6.0.5 update artifact has a confirmed Composer startup failure and is blocked. The existing web updater and SSH deployment scripts also require repair and staging validation before production use.

## Key Features
- **Inventory**: Multi-barcode, Weighted items, Composite products (Recipes).
- **Manufacturing**: "Make Now" vs "Ready Made" logic.
- **Khata**: Deep party ledger integration.
- **POS**: Offline-capable, Senior-friendly UI.

## Directory Structure
- `app/Filament`: Admin Panel Resources.
- `resources/js/Pages/Pos`: POS Interface.
- `database/migrations`: Custom Schema.
