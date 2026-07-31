---
tags: [dev-workflow, commands]
---

# Key Commands

Part of [[VenQore POS - Home]]

## Development
```bash
php artisan serve       # Start Laravel dev server
npm run dev              # Start Vite (frontend)
npm run build             # Build frontend for production
```

## Database
```bash
php artisan migrate
php artisan migrate:fresh --seed
php artisan db:seed
php artisan migrate:rollback
```

## Cache / Config
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear   # clears all at once
```

## Queue
```bash
php artisan queue:work
php artisan horizon
```

## Testing
```bash
# Full suite (all 209 test files)
php artisan test Tester/tests/ --compact

# Tools suite only (all 28 tool test files)
php artisan test Tester/tests/Feature/Tools/ Tester/tests/Unit/Tools/ --compact

# Single test file
php artisan test Tester/tests/Feature/Tools/InvoiceToolTest.php

# See full test command center:
```
→ [[Test Suite Dashboard]]


## Tinker
```bash
php artisan tinker
```

## WooCommerce Sync
```bash
php artisan woocommerce:sync-stock   # syncs "dirty" products every 5 min via scheduler
```

## Ziggy (routes)
```bash
php artisan ziggy:generate   # MUST run after adding/renaming any route in routes/web.php
```

## Related
- [[Code Conventions]]
- [[Database Policy]]
