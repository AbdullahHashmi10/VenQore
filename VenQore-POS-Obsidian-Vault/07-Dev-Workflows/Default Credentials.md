---
tags: [dev-workflow, credentials]
---

# Default Credentials (Local Dev)

Part of [[VenQore POS - Home]]

| Credential | Value |
|---|---|
| Admin | platform@venqore.com / admin1234 |
| Database | root / (no password) / venqore_pos |
| Testing Database | root / (no password) / amd_pos_test |
| PHP path (Windows/Local by WP) | `C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe` |
| Queue connection | database (run `php artisan queue:work`) |
| Mail | `log` driver locally — check `storage/logs/laravel.log` |
| Broadcasting | No Pusher/broadcasting configured locally |

## Related
- [[Key Commands]]
- [[Database Policy]]
