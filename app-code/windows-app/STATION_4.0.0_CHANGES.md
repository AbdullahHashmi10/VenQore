# Station 4.0.0 — changes on top of 3.2.0

## 1. Silent auto-update
- Station checks 4 s after start and every 3 h; a new version downloads silently in the background.
- Installed automatically (silent, Station reopens by itself) when Station is **opened** (first 4 minutes, nothing printing) or **closed** normally. Sales, offline queue, printers, PIN and pairing live in the user profile and are kept.
- Safety: never during printing, max 2 attempts per version (no restart loop), OS shutdown never launches setup, owner can turn it off (Settings → Updates → "Install updates automatically").
- Portable build cannot self-update. Pre-3.2.0 installs still look at updates.venqore.com — see HOSTINGER_CLOUDFLARE_HANDOFF.md, or install 4.0.0 over them once.

## 2. Easy device switching (Windows reinstall / new PC) without losing the seat
- Server (already in the web code): Settings → Terminals → **Replace device / reinstall Windows** makes a 15-minute single-use code that re-binds the SAME terminal row to the new PC (no new seat, history kept); the old PC's secret stops working.
- Station 4.0.0: pairing screen explains the replace flow; success shows "This PC now takes over <counter>"; server validation errors are shown properly; heartbeat returns `replaced_terminal`.
- Web files touched: `HeartbeatController.php` (replaced_terminal), new test in `TerminalAppIntegrationTest.php` (not run — no PHP on the build machine; run `php artisan test --filter=replacing_a_device`). Needs the migration `2026_10_10_230000_add_terminal_replacement_pairing` and a normal web release.

## Build
Double-click `BUILD-STATION.bat` (runs tests, builds, stages `releases/station-4.0.0/`). Log: `build-4.0.0.log`.
Unsigned (no certificate): Windows SmartScreen will warn on first install.
