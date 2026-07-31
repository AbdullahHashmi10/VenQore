---
tags: [architecture, tech-stack]
---

# Tech Stack

Part of [[VenQore POS - Home]]

| Layer | Technology |
|---|---|
| Backend | PHP 8.2, Laravel 12 |
| Frontend | React 18, Inertia.js v2, Tailwind CSS v3 |
| Build tool | Vite 7 |
| Database | MySQL only — see [[Database Policy]] |
| Auth | Laravel Sanctum + Breeze |
| PDF | barryvdh/laravel-dompdf |
| Excel | maatwebsite/excel |
| Offline DB | Dexie.js (IndexedDB) — see [[Offline Sync - Dexie & IndexedDB]] |
| Charts | Recharts |
| Icons | Lucide React |
| Barcodes | picqer/php-barcode-generator |
| Routing (JS) | Ziggy (tightenco/ziggy) |
| Queue UI | Laravel Horizon |
| Social Auth | Laravel Socialite |
| Storage | AWS S3 / Cloudflare R2 (via `StorageService`, env-swappable) |

## App Identity
- **App name:** VenQore POS
- **Database:** `venqore_pos` (MySQL, local: root / no password)
- **App URL:** http://127.0.0.1:8000
- **Domain:** venqore.com
- **Queue:** database driver (Laravel Horizon available)

## Related
- [[Project Overview]]
- [[Key Commands]]
- [[Frontend Architecture]]
