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

## Deployment (Hostinger)
1. Run `npm run build` locally.
2. Zip the project (excluding `node_modules`).
3. Upload to Hostinger `public_html` (or subfolder).
4. Unzip.
5. Configure `.env` with Hostinger DB credentials.
6. Import database schema.
7. Set up Cron Job: `* * * * * php /path/to/artisan schedule:run >> /dev/null 2>&1`

## Key Features
- **Inventory**: Multi-barcode, Weighted items, Composite products (Recipes).
- **Manufacturing**: "Make Now" vs "Ready Made" logic.
- **Khata**: Deep party ledger integration.
- **POS**: Offline-capable, Senior-friendly UI.

## Directory Structure
- `app/Filament`: Admin Panel Resources.
- `resources/js/Pages/Pos`: POS Interface.
- `database/migrations`: Custom Schema.
