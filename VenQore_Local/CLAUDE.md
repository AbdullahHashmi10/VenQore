# VenQore POS — CLAUDE.md

This is the authoritative context file for AI agents working in this codebase. Read this before doing anything.

## Project Overview

**VenQore POS** is a multi-tenant SaaS Point-of-Sale and ERP system built for small-to-medium retail and food businesses. It is a Laravel 12 + React 18 (Inertia.js) monolith with offline-capable POS, full accounting, inventory management, WooCommerce integration, and a platform/superadmin layer.

- **App name:** VenQore POS
- **Database:** `amd_pos` (MySQL, local: root / no password)
- **App URL:** http://127.0.0.1:8000
- **Domain:** venqore.com
- **Queue:** database driver (Laravel Horizon available)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | PHP 8.2, Laravel 12 |
| Frontend | React 18, Inertia.js v2, Tailwind CSS v3 |
| Build tool | Vite 7 |
| Database | MySQL |
| Auth | Laravel Sanctum + Breeze |
| PDF | barryvdh/laravel-dompdf |
| Excel | maatwebsite/excel |
| Offline DB | Dexie.js (IndexedDB) |
| Charts | Recharts |
| Icons | Lucide React |
| Barcodes | picqer/php-barcode-generator |
| Routing (JS) | Ziggy (tightenco/ziggy) |
| Queue UI | Laravel Horizon |
| Social Auth | Laravel Socialite |
| Storage | AWS S3 (configured via .env) |

---

## Key Commands

### Development
```bash
# Start Laravel dev server
php artisan serve

# Start Vite (frontend)
npm run dev

# Build frontend for production
npm run build
```

### Database
```bash
php artisan migrate
php artisan migrate:fresh --seed
php artisan db:seed
php artisan migrate:rollback
```

### Cache / Config
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear   # clears all at once
```

### Queue
```bash
php artisan queue:work
php artisan horizon
```

### Testing
```bash
php artisan test
./vendor/bin/phpunit
```

### Tinker
```bash
php artisan tinker
```

### WooCommerce Sync
```bash
php artisan woocommerce:sync-stock   # syncs "dirty" products every 5 min via scheduler
```

---

## Architecture

### Multi-Tenancy
- Each **Store** is a tenant (`Tenant` model). All data is scoped by `tenant_id`.
- A `User` can belong to multiple stores via `TenantUser` pivot.
- The active tenant is resolved per request (subdomain or session).
- A **Platform/SuperAdmin** layer exists above tenants at `app/Http/Controllers/SuperAdmin/`.

### Backend Structure
```
app/
  Console/          — Artisan commands
  Http/
    Controllers/    — One controller per feature area (Sale, Purchase, Inventory, etc.)
      Admin/        — Store-level admin controllers
      SuperAdmin/   — Platform-level controllers
      Api/          — API-only controllers
      Auth/         — Auth controllers
  Models/           — Eloquent models (all tenant-scoped via tenant_id)
  Services/         — Business logic (InventoryService, PurchaseService, SaleReversalService, etc.)
  Jobs/             — Queued jobs
  Mail/             — Mailable classes
  Exports/          — Excel exports (maatwebsite)
  Imports/          — Excel imports
  Helpers/          — Utility helpers
  Traits/           — Reusable model/controller traits
  Providers/        — Service providers
routes/
  web.php           — All web + Inertia routes (very large file)
  api.php           — API routes
  auth.php          — Auth routes
```

### Frontend Structure
```
resources/js/
  Pages/            — Inertia page components (maps 1:1 to routes)
    Auth/           — Login, Register, etc.
    Dashboard.jsx   — Main dashboard
    Pos.jsx         — POS terminal (offline-capable)
    Sales/          — Sale transactions
    Purchases/      — Purchase transactions
    Inventory/      — Stock management
    Parties/        — Customers & Suppliers
    Accounting/     — Journal entries, chart of accounts
    Finance/        — Funds, bank accounts
    Settings/       — Store settings
    SuperAdmin/     — Platform admin pages
    Admin/          — Store admin pages
    Marketing/      — Public marketing pages
    Hub/            — Multi-store hub
    ...
  Components/       — Shared React components
  Layouts/          — Layout wrappers
```

---

## Key Domain Concepts

### Inventory
- **FIFO stock deduction** on every sale.
- **Composite products** (e.g., Garam Masala): made from raw material recipes.
  - **Mode A (Make Now):** Auto-deducts raw materials when composite stock is zero.
  - **Mode B (Ready Made):** Sells from pre-manufactured stock.
- **Batch tracking** with expiry dates.
- **Serial tracking** for serialised items.
- **Multi-barcode** support per product.
- **Negative stock** allowed (tracked separately).
- **Multi-unit** support (base unit + secondary unit with conversion ratio).

### Transactions
- Core model: `Transaction` — covers Sales, Purchases, Returns, Expenses.
- `TransactionAllocation` — links payments to invoices (partial payment support).
- `JournalEntry` / `JournalItem` — double-entry accounting auto-generated on each transaction.

### POS Terminal
- `Pos.jsx` — offline-first, uses Dexie.js (IndexedDB) to cache products.
- Syncs back to server when online.
- Supports barcode scanning, cart, discounts, multiple payment modes.

### Multi-Store / SaaS
- `Tenant` model = one store/business.
- `Platform` model = the VenQore platform itself (SuperAdmin layer).
- Plans, plan limits, and plan features control feature access per tenant.
- `StoreLicense` tracks subscription status.
- `AppSumoCode` for AppSumo LTD redemption.
- `Coupon` / `CouponRedemption` for discount codes.

### WooCommerce Integration
- Webhook receiver auto-creates sales from WooCommerce orders.
- Stock sync command pushes inventory changes back to WooCommerce via API.
- SKU-based product matching.

---

## Important Models

| Model | Purpose |
|---|---|
| `Tenant` | A store / business (tenant) |
| `User` | Platform user (can belong to many tenants) |
| `TenantUser` | Pivot: user ↔ tenant with role & permissions |
| `Product` | Product catalogue |
| `Stock` | Stock batches (FIFO) |
| `Transaction` | Sales, purchases, returns, expenses |
| `TransactionAllocation` | Payment-to-invoice linking |
| `Party` | Customer or Supplier |
| `JournalEntry` / `JournalItem` | Double-entry accounting |
| `Warehouse` | Physical location for stock |
| `Terminal` | POS terminal registration |
| `Setting` | Per-tenant key-value settings |
| `StoreLicense` | Subscription/license status |
| `Plan` / `PlanLimit` / `PlanFeature` | SaaS plan definitions |

---

## Environment Notes

- `.env` is present and configured for local development.
- PHP path (Windows/Local by WP): `C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe`
- Queue connection: `database` (run `php artisan queue:work` for background jobs).
- Mail: `log` driver locally (check `storage/logs/laravel.log`).
- No Pusher/broadcasting configured locally.

---

## Code Conventions

- **Controllers** are thin — business logic lives in `app/Services/`.
- **Inertia responses** use `Inertia::render('PageName', [...data])`.
- **React components** use Tailwind utility classes (no separate CSS files).
- **All DB queries must include `tenant_id` scope** — never query cross-tenant.
- Route names follow `feature.action` convention (e.g., `sales.store`, `inventory.index`).
- Use `route()` Ziggy helper in React for named routes.
- Prefer `php artisan optimize:clear` after config or route changes.

---

## Default Credentials (Local Dev)

- **Admin:** admin@amd.com / password
- **Database:** root / (no password) / amd_pos

---

## Known Worktrees

Stale git worktrees may exist in `.claude/worktrees/`. They can be safely pruned with:
```bash
git worktree prune
```
