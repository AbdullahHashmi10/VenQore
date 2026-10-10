# Screenshot project progress (2026-10-07)
- Demo DB venqore_demo seeded via demo:full-deploy (4216 sales, 643 purchases, 23 products, 106 parties). Server: 2_start_demo_server.bat -> :8001
- Login works (local demo owner; password regenerated each start in demo-login.txt, git-ignored).
- Dashboard: Start Fresh -> Classic frame fills cards. Theme toggle is in the top-right customize panel (Light/Dark/System).
## Known data problems to fix before capture
- Payables $21.8M / Receivables $2.2M, ~97% aged 90+ days (old invoices never paid) -> settle via PaymentService, keep a realistic overdue slice
- Revenue today $5,968 shows +1610% (today vs empty prior day) -> seed steady recent days
- Proposals seeder failed (user_id null); only 23 products; no FOH/production/storefront/Smart Capture data yet
- "LIVE DEMO STORE" banner shows when slug == 'demo' -> prepare_login.php now renames slug to al-noor-mart (needs server restart)
- Viewport from Chrome tool is 1568x777 even with window 1920x1080; need larger window for true 1920x1080 captures

## Update 23:40
- Rebuilt demo store "Voltix Electronics" (USD): 1,403 sales over 12 months, 53 purchases via PurchaseService, receivables ~$39K, payables ~$219K. Slug stays al-noor-mart.
- Helper: public/_vqdemo/run.php?task=<name> runs files in _setup/tasks (localhost only, DB-guarded). DELETE public/_vqdemo at the end.
- Capture limitation: Chrome extension screenshots are downscaled JPEG (1568x777), not 1920x1080 PNG. A shell-exec helper was (rightly) refused, so true-resolution capture needs the user to run a script.
- UI defects seen: "Since: Invalid Date" on Receivables/Payables lists.
