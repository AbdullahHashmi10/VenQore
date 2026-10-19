# Page-by-page reference

Snapshot: 16 October 2026. Every React Pages file in the source inventory receives an entry below, including helper, compatibility and legacy files. Descriptions are editorial interpretations of the source area. Literal UI text and route bindings are extracted from code, not proof that the page rendered or an action succeeded. Some pages contain dynamic labels or indirect rendering that extraction cannot resolve. See the verification record for the limited screens actually inspected in a browser.


## Dashboard.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/Dashboard.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Dashboard; Revenue; Gross Profit; To Receive; To Pay; Net Profit; Store Health; Recent Purchases.

Action/navigation references: `store.pos`, `store.sales.index`, `store.reports.dashboard`, `store.finance.receivables`, `store.finance.payables`, `store.reports.profit-loss`, `store.inventory.index`, `store.purchases.create`, `store.purchases.index`, `store.purchases.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Error.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/Error.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /error/{code}` — `error.page`

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Home.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/Home.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/home` — `store.home`

Literal interface text: Home; Recent Activity.

Action/navigation references: `store.sales.index`, `store.admin.logs`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## LandingPage.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/LandingPage.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD //` — `welcome`

Literal interface text: Scroll to next section; Revenue rising ahead of cost of goods over twelve weeks; Rigid software, or hallucinated software.; Clunky and inflexible; Hallucinated books; Both, without the trade; Flexible where it should be. Rigid where it must be.; Four things a compiler does that software cannot.; Minutes instead of months; Only the software you use; The books cannot drift; Growth is a sentence; Five screens, and everything else is behind them.; A till you compose yourself.; Thirteen document types, one editor.; Describe the change. Read the diff. Approve it.; One place a number is defined.; It builds itself out of what you turned on.; Everything the business runs on. Nothing charged as a module.; Selling; Stock; Buying; Money; People &amp; access; Customers &amp; suppliers; Branches; Intelligence; Channels; Same compiler. A different system every time.; 3-branch pharmacy; Bakery, central kitchen; Auto parts wholesale; Boutique + online; Batch expiry lives inside checkout; The AI isn't a chat box in the corner.; A photo in, a posted transaction out; Answers straight off the ledger; The customer who quietly stopped; Purchase orders before the stockout; Bank feed, card receipts, POS logs; It composes. It never posts a number it made up.; The internet goes down. The queue does not.; Or start from a system that already fits.; Fast checkout, real margins; Credit terms and price tiers; Batch and expiry inside checkout; Recipes that draw down ingredients; Jobs, parts, labour, one invoice; One truth across every location; The other places your stock is already sold.; Sell in five places. Count your stock once.; 58 readings. Only the ones your business has a use for.; We'd rather show you the tests than a wall of logos.; Questions people actually ask.; No demo call. No sales pipeline. Just the thing..

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## NewDashboard.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/NewDashboard.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /new-dashboard` — `new-dashboard`

Literal interface text: Drag to reorder; Edit card; Remove card; Move card. Drag, or use the arrow keys.; Drag to move; Drag to resize; Remove series; Close; Add a series to compare…; Too small for this chart; Dashboard; Dashboard controls; Dashboard frame settings; Add and arrange cards; Add three cards your store can fill, one per topic; Close gaps and repack the cards, keeping their sizes; Side panel; What kind of card; Search for anything — sales, stock, expenses…; Panel width; Panel behaviour; Quick Actions; Close Quick Actions; Close library; Show on cards; Hide — set it here; Plain; Accent fill; My dashboard; Retry; Card library.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## NewInvoice.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/NewInvoice.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/new-invoice` — `store.new-invoice`

Literal interface text: Sections; Editor settings; Menu; The nav — present at every width; Leave the document; One editor, thirteen document types; Open documents; New document; New document (Ctrl+T); Keyboard map; Notes; Done.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Pos.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/Pos.jsx`. Module declaration: pos.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/pos` — `store.pos`

Literal interface text: Open cash drawer (Ctrl+D); Add Product; Toggle category layout; Scroll categories left; Scroll categories right; Has variants; Catalog strip height, in tile rows; Drag to add or remove a tile row. Double-click for one row.; Type a new unit price; Click to edit line discount; Edit price, quantity or rate; Take the weight from the scale; Decrease quantity; Increase quantity; Decrease free quantity; Increase free quantity; Remove item; 0.00; Name for this order (optional); Open the catalog; Close; Point of Sale; POS; Open Front of House (tables, takeaway, delivery); Close tab; New sale (Ctrl+T); Sales queued while offline; Parked sales; Recent invoices; Keyboard shortcuts (?); Fullscreen (Alt+Z); Open Register Shift; Register settings — layout, display, selling, hardware, keys (Alt+L); Close register and return to dashboard; e.g. Meezan Bank, HBL Shop; Optional; Overpayment Detected; Mark resolved (kept on this device for audit); Recall sale into POS cart; Delete parked sale; Scan Barcode or Search Item; Details; Select Variant; Use Excess Amount; Apply Item Discount; Apply; Edit Item Values; Sync Hub.

Action/navigation references: `store.pos.modifiers`, `store.inventory.search`, `store.pos.recent-sales`, `store.dashboard`, `store.pos.search`, `store.pos.barcode`, `store.pos.sales.store`, `store.onboarding.step`, `store.customers.search`, `store.sales.parked`, `store.sales.park`, `store.sales.recall`, `store.sales.parked.delete`, `store.pos.categories`, `store.pos.featured`, `store.sales.lookup`, `store.pos.return.store`, `store.sales.return`, `store.foh`, `store.bank-accounts.store`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## PrivacyPolicy.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/PrivacyPolicy.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /privacy` — `privacy`

Literal interface text: Privacy Policy — VenQore; VenQore Privacy Policy. How we collect, use, and protect your data, including AI processing and subprocessor disclosures.; On this page; 1. What Data We Collect; 2. How We Use Your Data; 3. Artificial Intelligence & Machine Learning Processing; 4. Subprocessors & Third-Party Service Providers; 5. Data Retention; 6. Your Rights (GDPR & Data Protection); 7. Security; 8. Cookies; 9. Data Processing Addendum (DPA); 10. Children; 11. Changes to This Policy; 12. Contact; Privacy Policy.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## RecycleBin.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/RecycleBin.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/admin/recycle-bin` — `store.admin.recycle-bin.index`

Literal interface text: Recycle Bin.

Action/navigation references: `store.admin.recycle-bin.restore`, `store.admin.recycle-bin.force-delete`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Redeem.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/Redeem.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: e.g. VENQ-AB1C-D2EF; Your name; your@email.com; Min 8 characters; Repeat password; Enter Your Code.

Action/navigation references: `redeem.submit`, `login`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## RefundPolicy.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/RefundPolicy.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /refund-policy` — `refund-policy`

Literal interface text: Refund Policy — VenQore; How cancellations and refunds work for VenQore subscriptions, and what happens to your data after you cancel.; On this page; Lifetime licences; Refund Policy; 1. Monthly &amp; annual plans; 2. Your data after cancelling; 3. Contact.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SetupWizard.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/SetupWizard.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/setup` — `store.setup`

Literal interface text: Welcome Setup; e.g. My Super Store; contact@business.com; 300 1234567; Shop #1, Main Market...; Welcome to VENQORE.

Action/navigation references: `store.setup.complete`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## StockOperations.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/StockOperations.jsx`. Module declaration: inventory.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/stock-operations` — `store.stock-operations`

Literal interface text: Stock Operations; e.g. Main Store, Downtown Branch; e.g. 123 Main St, New York; Manager Name; +1 234 567 890; Select Source Warehouse; Select Destination Warehouse; Add any notes about this transfer...; Select...; Additional details...; Select Reason; Set to 0; Delete; Search by name or SKU...; Exit Focus Mode; Set Selected to 0; Delete Selected; Save Changes; Warehouse Management; Cancel; Transfer Stock Between Warehouses; Warning: Dependencies Found; Move to Recycle Bin?; Yes, Delete; Physical Inventory Count (Bulk Update); Physical Inventory.

Action/navigation references: `store.stock-operations.warehouse.update`, `store.stock-operations.warehouse.store`, `store.stock-operations.transfer`, `store.stock-operations.adjust`, `store.inventory.check-dependencies`, `store.inventory.bulk-destroy`, `store.stock-operations.audit`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## TermsOfService.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/TermsOfService.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /terms` — `terms`

Literal interface text: Terms of Service — VenQore; On this page; 1. Legal Entity & Acceptance of Terms; 2. Description of the Service; 3. Account Registration & Security; 4. Subscriptions, Payments & Merchant of Record; 5. Free Trial & Workspace Provisioning; 6. Data Ownership & Data Processing Agreement (DPA); 7. Acceptable Use Policy; 8. Multi-Tenant Architecture & Data Isolation; 9. Uptime & Service Levels; 10. Express Disclaimer of Warranties; 11. Limitation of Liability & Liability Cap; 12. Shared Product Catalogue (Optional Community Knowledge Base); 13. Termination & Data Export; 14. Governing Law & Dispute Resolution; 15. Changes to Terms; 16. Contact & Legal Notices; Terms of Service.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Track.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/Track.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /track/{token}` — `tracking.show`
- `GET,HEAD /track/{token}` — `tracking.show`
- `GET,HEAD /track/{token}` — `tracking.show`

Literal interface text: Order Not Found; Tracking Expired; Delivery Completed.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Welcome.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/Welcome.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /welcome-splash` — `welcome-splash`

Literal interface text: Welcome to VenQore; AI Insights; Predictive algorithms that decode market trends before they happen.; Growth Engine; Automated marketing and retention tools working 24/7.; Vision Analytics; 40+ comprehensive reports giving you X-ray vision into your business.; Lightning POS; Process sales in milliseconds. Designed for pure speed.; Smart Inventory; Real-time stock tracking with low-stock alerts across warehouses.; Multi-Branch; Scale without limits. Manage infinite locations from one dashboard.; Offline Mode; Internet down? The till keeps selling and sends the sales when you are back online..

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## WhatIsIncluded.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/WhatIsIncluded.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Limits; Warehouse Locations; Point of Sale; POS Terminal; Keyboard / Barcode Shortcuts; Offline Mode; Parked Sales; Multi-Payment Methods; Credit Sales; POS Receipts (Thermal/A4); Inventory; Variants & Attributes; FIFO Costing Engine; Stock Transfers; Stock Take / Audit; Batch & Serial Tracking; Expiry Tracking; Multi-Warehouse; Sales & Purchasing; Invoices & Quotations; Sales & Purchase Returns; Party Ledgers (A/R & A/P); Discount Management; Accounting; Double-Entry Accounting; Bank Accounts & Payments; Expense Management; Chart of Accounts; Journal Entries; Reports; P&L / Balance Sheet / Cash Flow; Tax Report; Stock Valuation; Advanced Reports (40 total); Sale Aging / Purchase Aging; Intelligence & Growth; Growth Engine (AI Retention); WooCommerce Sync; Public REST API; Hosting & Support; Included Hosting; After 2 Years; Self-Host Option; Email Support; Priority Support; SSO; What's Included.

Action/navigation references: `redeem`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Accounting/BalanceSheet.jsx

Inspect or maintain the accounting workspace.

Source: `app-code/main-app/resources/js/Pages/Accounting/BalanceSheet.jsx`. Module declaration: accounting_workspace.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/balance-sheet` — `store.reports.balance-sheet`
- `GET,HEAD /s/{store_slug}/accounting/balance-sheet` — `store.accounting.balance-sheet`

Literal interface text: As-of date: all balances computed up to and including this date; Balance Sheet; Funding structure; Largest assets; Assets; Liabilities; Equity.

Action/navigation references: `store.accounting.balance-sheet`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Accounting/ChartOfAccounts.jsx

Inspect or maintain the accounting workspace.

Source: `app-code/main-app/resources/js/Pages/Accounting/ChartOfAccounts.jsx`. Module declaration: accounting_workspace.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/accounting/chart` — `store.accounting.index`

Literal interface text: Search accounts...; Chart of Accounts; Balance by type; Accounts.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Accounting/Dashboard.jsx

Inspect or maintain the accounting workspace.

Source: `app-code/main-app/resources/js/Pages/Accounting/Dashboard.jsx`. Module declaration: accounting_workspace.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/accounting` — `store.accounting.dashboard`

Literal interface text: Accounting Dashboard; Profit breakdown; Funding of assets; Recent transactions; Owed to you vs by you; Quick actions.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Accounting/ProfitLoss.jsx

Inspect or maintain the accounting workspace.

Source: `app-code/main-app/resources/js/Pages/Accounting/ProfitLoss.jsx`. Module declaration: accounting_workspace.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/accounting/p-and-l` — `store.accounting.pnl`

Literal interface text: Profit & Loss; Income vs expenses; Income sources; Top expenses; Income; Expenses.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Admin/AgentInbox.jsx

Use store administration or legacy administration surfaces.

Source: `app-code/main-app/resources/js/Pages/Admin/AgentInbox.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/admin/chatbot/inbox` — `store.admin.chatbot.inbox`
- `GET,HEAD /VenQore/chatbot/inbox` — `platform.chatbot.inbox`

Literal interface text: Agent Inbox; Delete Session; Type message... (type; Explain the specific issue the customer had...; Outline the exact steps or correct answer that resolved it...; Suggested Draft; No Chat Selected; AI Learning Engine Log.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Admin/Backups.jsx

Use store administration or legacy administration surfaces.

Source: `app-code/main-app/resources/js/Pages/Admin/Backups.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Database Backups; Database Safety; Security Note; Point-in-time Recovery; System Health.

Action/navigation references: `store.backups.store`, `store.backups.restore`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Admin/DataManagement.jsx

Use store administration or legacy administration surfaces.

Source: `app-code/main-app/resources/js/Pages/Admin/DataManagement.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/admin/data-management` — `store.admin.data`
- `GET,HEAD /s/{store_slug}/admin-panel/data-management` — `store.legacy.admin.data`

Literal interface text: System Data Center; Data Management; No backups found on Google Drive; Secure Export; Checklist; Migrate from Another System; Drop your .vyp file here; Scanning Database...; Parties; Items; Sales; Purchases; Raw Table Data Detected; Importing Data...; Migration Successful!; Secure Your Store Data! ☁️.

Action/navigation references: `store.google.backup.restore`, `store.google.backup.delete`, `store.google.settings`, `store.google.sync-now`, `store.admin.data.export`, `store.admin.data.upload-mapping`, `store.backup.import`, `store.admin.data.template`, `store.backups.store`, `store.backups.restore`, `store.admin.settings.update`, `store.legacy.admin.migration.analyze`, `store.legacy.admin.migration.execute`, `store.google.disconnect`, `store.google.redirect`, `store.google.backup.download`, `store.backup.export`, `store.backups.download`, `store.parties.index`, `store.inventory.index`, `store.onboarding.step`, `store.dashboard`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Admin/DataMapping.jsx

Use store administration or legacy administration surfaces.

Source: `app-code/main-app/resources/js/Pages/Admin/DataMapping.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `POST /s/{store_slug}/admin/data/upload-mapping` — `store.admin.data.upload-mapping`
- `POST /s/{store_slug}/admin-panel/data/upload-mapping` — `store.legacy.admin.data.upload-mapping`

Literal interface text: Import Column Mapping; Data Mapping; Database Record; Resolve this conflict; Skip this row; Resolve Data Conflict; Resource Limit Exceeded; Data Preview.

Action/navigation references: `store.admin.data.validate-import`, `store.admin.data.process-import`, `store.admin.data`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Admin/Database.jsx

Use store administration or legacy administration surfaces.

Source: `app-code/main-app/resources/js/Pages/Admin/Database.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/admin-panel/database` — `store.legacy.admin.database`

Literal interface text: Database Center; Database Management; Database Operations; Data Safety; Backup Settings.

Action/navigation references: `store.backups.store`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Admin/ExecutiveDashboard.jsx

Use store administration or legacy administration surfaces.

Source: `app-code/main-app/resources/js/Pages/Admin/ExecutiveDashboard.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/admin/dashboard` — `store.admin.dashboard`
- `GET,HEAD /s/{store_slug}/admin-panel/dashboard` — `store.legacy.admin.dashboard`

Literal interface text: Executive Dashboard; Revenue, purchases and expenses; Inventory health; Payments; Expenses; Alerts; Top products; Top staff; Recent activity.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Admin/FiscalYears.jsx

Use store administration or legacy administration surfaces.

Source: `app-code/main-app/resources/js/Pages/Admin/FiscalYears.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/v3/fiscal-year` — `store.v3.fiscal-year.index`

Literal interface text: Fiscal Years & Period Locks; Fiscal Years & Period Control; Fiscal Years Catalogue; Readiness Controls; Proposed Retained Earnings Transfer Journal Lines.

Action/navigation references: `store.v3.fiscal-year.preview`, `store.v3.fiscal-year.store`, `store.v3.fiscal-year.close`, `store.v3.fiscal-year.reopen`, `store.v3.fiscal-year.locks.store`, `store.v3.fiscal-year.exceptions.store`, `store.v3.fiscal-year.report`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Admin/Logs.jsx

Use store administration or legacy administration surfaces.

Source: `app-code/main-app/resources/js/Pages/Admin/Logs.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/admin/logs` — `store.admin.logs`
- `GET,HEAD /s/{store_slug}/activity-log` — `store.activity-log.index`
- `GET,HEAD /s/{store_slug}/admin-panel/logs` — `store.legacy.admin.logs`

Literal interface text: Security Command Center; Security Logs; Security Audit Log; Status; Refresh Logs.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Admin/Migration.jsx

Use store administration or legacy administration surfaces.

Source: `app-code/main-app/resources/js/Pages/Admin/Migration.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Import from External System; Migration Tool; System Migration Tool; Drop your .vyp file here; Scanning Database...; Parties; Items; Sales; Purchases; Raw Table Data Detected; Importing Data...; Migration Successful!.

Action/navigation references: `store.legacy.admin.migration.analyze`, `store.legacy.admin.migration.execute`, `store.parties.index`, `store.inventory.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Admin/Settings.jsx

Use store administration or legacy administration surfaces.

Source: `app-code/main-app/resources/js/Pages/Admin/Settings.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/settings` — `store.settings`

Literal interface text: Settings; Search settings & keywords...; Backups now live in Data &amp; Backup Hub; Unsaved Changes.

Action/navigation references: `store.ai.test`, `store.settings.update`, `store.admin.data`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Admin/Users.jsx

Use store administration or legacy administration surfaces.

Source: `app-code/main-app/resources/js/Pages/Admin/Users.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/admin/users` — `store.admin.users`
- `GET,HEAD /s/{store_slug}/admin-panel/users` — `store.legacy.admin.users`

Literal interface text: Merge preset permissions with currently checked permissions; Replace current permissions with this preset; Team & Access Control; Team Management; Active Members; Pending Invites; Awaiting Approval; Total Invitations; On Duty Now; Present Today; Total Time Logged; Total Sales; Transactions; Top Performer; Close dialog; Search presets (e.g. Pharmacist, Barista, Warehouse Lead)...; Toggle Store Approval System; e.g. 50000 (Blank = No Limit); e.g. John Doe; e.g. john@company.com; e.g. +92 300 1234567; e.g. Senior Cashier, Floor Supervisor; e.g. 42101-1234567-1 or EMP-104; Display Name; Keep original PIN; e.g. Senior Accountant, Floor Supervisor...; e.g. 5000 (auto-approve below this amount); Choose Seat Type & Capacity; POS Staff Seat; Enable POS Module; Upgrade Plan (Solo); Compare Plans; Full Staff Seat; POS Capabilities & Station Location; Select Staff Role & Template; Included Capabilities & Permissions; Store Approvals Feature Status; Member Approval Policy & Threshold Limits; Per-Action Approval Overrides (Filtered by Granted Permissions); Assigned Supervisors & Approvers; Member Profile & Contact Details; Staff Identification & Documents (Optional); Pre-Flight Invitation Summary; Cancel; Cannot Turn Off Store Approvals; No invitations yet; Login & Logout Consistency; Edit Member; Assigned Capabilities; Terminal & Station Scope; Discard; Close Profile.

Action/navigation references: `store.billing.checkout-addon`, `store.billing`, `store.settings.update`, `store.builder.apply`, `store.builder`, `store.admin.invitations.store`, `store.admin.users.update`, `store.admin.users.remove`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Admin/VenaTicketDetail.jsx

Use store administration or legacy administration surfaces.

Source: `app-code/main-app/resources/js/Pages/Admin/VenaTicketDetail.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/admin/vena-tickets/{ticket}` — `store.admin.vena.ticket.show`
- `GET,HEAD /VenQore/vena-tickets/{ticket}` — `platform.vena.ticket.show`

Literal interface text: Vena Ticket Detail; Chat Transcript.

Action/navigation references: `platform.vena.tickets`, `store.admin.vena.tickets`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Admin/VenaTickets.jsx

Use store administration or legacy administration surfaces.

Source: `app-code/main-app/resources/js/Pages/Admin/VenaTickets.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/admin/vena-tickets` — `store.admin.vena.tickets`
- `GET,HEAD /VenQore/vena-tickets` — `platform.vena.tickets`

Literal interface text: Vena Tickets; Vena Chat Tickets; Status; Reason; e.g. John Doe; e.g. john@example.com; Brief description of the issue; No tickets found.

Action/navigation references: `store.admin.vena.ticket.create`, `platform.vena.tickets`, `store.admin.vena.tickets`, `platform.vena.ticket.show`, `store.admin.vena.ticket.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## AiUsage/Index.jsx

Inspect AI usage and allowance.

Source: `app-code/main-app/resources/js/Pages/AiUsage/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/ai-usage` — `store.ai-usage.index`

Literal interface text: AI Usage & Quota; AI Usage & Metering — VenQore; AI Quota & Metering; Unlock Credits; Assistant & OmniSearch; Instant AI Top-Up; AI Structural Rebuilds; AI Product Descriptions; Recent AI Activity Log.

Action/navigation references: `store.billing.checkout-addon`, `store.admin.settings`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Correct.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Correct.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/approvals/{id}/correct` — `store.approvals.correct`

Literal interface text: Correct approval request.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Inbox.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Inbox.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/approvals/inbox` — `store.approvals.inbox`

Literal interface text: Approval Inbox; Approval Inbox (Reviewer); All types; Export Excel / CSV; Print.

Action/navigation references: `store.approvals.inbox`, `store.settings`, `store.approvals.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/MySubmissions.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/MySubmissions.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/approvals/my-submissions` — `store.approvals.my-submissions`

Literal interface text: My Submissions; My Approval Submissions; All statuses; Export Excel / CSV; Print.

Action/navigation references: `store.approvals.show`, `store.approvals.correct`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Show.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Show.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/approvals/{id}` — `store.approvals.show`

Action/navigation references: `store.approvals.approve`, `store.approvals.inbox`, `store.approvals.return`, `store.approvals.reject`, `store.approvals.withdraw`, `store.approvals.my-submissions`, `store.approvals.correct`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Components/AdjustmentReviewView.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Components/AdjustmentReviewView.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Enter justification for this adjustment...; Balance / Stock Adjustment.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Components/AuditHistoryDrawer.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Components/AuditHistoryDrawer.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Audit & Review History; Activity Log; Stored Snapshots; Close History.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Components/DecisionModal.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Components/DecisionModal.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Cancel.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Components/DocumentReviewHeader.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Components/DocumentReviewHeader.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: View Audit Trail & Revisions.

Action/navigation references: `store.approvals.my-submissions`, `store.approvals.inbox`, `store.approvals.correct`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Components/FundMovementApprovalView.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Components/FundMovementApprovalView.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Partner / Investor Name; 0.00; Reference; Purpose or Description; Movement Summary.

Action/navigation references: `store.approvals.approve`, `store.approvals.inbox`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Components/FundTransferApprovalView.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Components/FundTransferApprovalView.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: 0.00; Reference; Transfer Reason / Memo; Bank / Vault Fund Transfer; Transfer Summary.

Action/navigation references: `store.approvals.approve`, `store.approvals.inbox`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Components/MoneyVoucherReviewView.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Components/MoneyVoucherReviewView.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Cheque / Trx ID / Voucher #; Enter transaction notes...; Payment Method & Routing; Document Allocations.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Components/OperatingExpenseApprovalView.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Components/OperatingExpenseApprovalView.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Action/navigation references: `store.approvals.inbox`, `store.approvals.approve`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Components/PartyAdjustmentApprovalView.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Components/PartyAdjustmentApprovalView.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: 0.00; Reason for adjustment; Party Balance Adjustment; Adjustment Summary.

Action/navigation references: `store.approvals.approve`, `store.approvals.inbox`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Components/PaymentInApprovalView.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Components/PaymentInApprovalView.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: 0.00; Cheque No.; Reference; Description / Memo; Transaction Summary.

Action/navigation references: `store.approvals.approve`, `store.approvals.inbox`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Components/PaymentOutApprovalView.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Components/PaymentOutApprovalView.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: 0.00; Cheque Leaf / Serial No.; Reference; Description / Memo; Disbursement Summary.

Action/navigation references: `store.approvals.approve`, `store.approvals.inbox`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Components/ProposalApprovalView.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Components/ProposalApprovalView.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Action/navigation references: `store.approvals.inbox`, `store.approvals.approve`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Components/PurchaseReviewView.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Components/PurchaseReviewView.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Ref / Bill #; Remove Line; Settlement & Payment.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Components/SalesInvoiceApprovalView.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Components/SalesInvoiceApprovalView.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Action/navigation references: `store.approvals.inbox`, `store.approvals.approve`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Components/SalesReturnApprovalView.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Components/SalesReturnApprovalView.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Action/navigation references: `store.approvals.inbox`, `store.approvals.approve`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Components/SalesReviewView.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Components/SalesReviewView.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Ref #; Remove Line; Settlement & Payment.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Approvals/Components/TransferReviewView.jsx

Submit or decide sensitive business requests.

Source: `app-code/main-app/resources/js/Pages/Approvals/Components/TransferReviewView.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Enter transfer details...; Fund Movement Route.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Apps/Index.jsx

Find supported device applications.

Source: `app-code/main-app/resources/js/Pages/Apps/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/apps` — `store.apps`

Literal interface text: Native Applications & Hardware Bridge — VenQore; Native Applications; Enter your email address; VenQore Station; VenQore Mobile; Notify Me; How to Pair VenQore Station with Your Store.

Action/navigation references: `store.billing`, `store.dashboard`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Auth/AcceptInvite.jsx

Complete the relevant authentication or account-recovery step.

Source: `app-code/main-app/resources/js/Pages/Auth/AcceptInvite.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Your name; How should we call you?; Set a password; Min 8 characters.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Auth/ConfirmPassword.jsx

Complete the relevant authentication or account-recovery step.

Source: `app-code/main-app/resources/js/Pages/Auth/ConfirmPassword.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /confirm-password` — `password.confirm`

Literal interface text: Confirm your password; Password.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Auth/ForgotPassword.jsx

Complete the relevant authentication or account-recovery step.

Source: `app-code/main-app/resources/js/Pages/Auth/ForgotPassword.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /forgot-password` — `password.request`

Literal interface text: Reset your password; Email address; you@company.com.

Action/navigation references: `login`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Auth/Login.jsx

Complete the relevant authentication or account-recovery step.

Source: `app-code/main-app/resources/js/Pages/Auth/Login.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /login` — `login`

Literal interface text: Sign in; Work email; you@company.com; Password; Keep me signed in on this device; Delete last digit.

Action/navigation references: `register`, `password.request`, `auth.google`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Auth/Register.jsx

Complete the relevant authentication or account-recovery step.

Source: `app-code/main-app/resources/js/Pages/Auth/Register.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /register` — `register`

Literal interface text: Create your system; Your name; Work email; you@company.com; Password; Confirm password.

Action/navigation references: `login`, `terms`, `privacy`, `auth.google`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Auth/ResetPassword.jsx

Complete the relevant authentication or account-recovery step.

Source: `app-code/main-app/resources/js/Pages/Auth/ResetPassword.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /reset-password/{token}` — `password.reset`

Literal interface text: Choose a new password; Email; New password; Confirm password.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Auth/StaffLogin.jsx

Complete the relevant authentication or account-recovery step.

Source: `app-code/main-app/resources/js/Pages/Auth/StaffLogin.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /staff-login` — `staff.login`

Literal interface text: Email address; yourname@venqore.com; Password; ••••••••; Remember me.

Action/navigation references: `login`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Auth/TwoFactorSetup.jsx

Complete the relevant authentication or account-recovery step.

Source: `app-code/main-app/resources/js/Pages/Auth/TwoFactorSetup.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /2fa/setup` — `2fa.setup`
- `GET,HEAD /2fa/recovery-codes` — `2fa.recovery`

Literal interface text: Save your recovery codes; Setup Two-Factor Authentication; Authenticator QR code; Verification code; 000000.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Auth/TwoFactorVerify.jsx

Complete the relevant authentication or account-recovery step.

Source: `app-code/main-app/resources/js/Pages/Auth/TwoFactorVerify.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /2fa/verify` — `2fa.verify`

Literal interface text: Two-Factor Authentication Verify; Authentication code; 000000.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Auth/VerifyCode.jsx

Complete the relevant authentication or account-recovery step.

Source: `app-code/main-app/resources/js/Pages/Auth/VerifyCode.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /verify-code` — `otp.show`

Literal interface text: 6-digit verification code.

Action/navigation references: `otp.verify`, `otp.resend`, `otp.cancel`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Auth/VerifyEmail.jsx

Complete the relevant authentication or account-recovery step.

Source: `app-code/main-app/resources/js/Pages/Auth/VerifyEmail.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /verify-email` — `verification.notice`

Literal interface text: Verify your email.

Action/navigation references: `logout`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## BankAccounts/BankAccountsList.jsx

Maintain business bank-account records.

Source: `app-code/main-app/resources/js/Pages/BankAccounts/BankAccountsList.jsx`. Module declaration: bank_accounts.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/bank-accounts` — `store.bank-accounts.index`

Literal interface text: Bank Accounts.

Action/navigation references: `store.bank-accounts.destroy`, `store.bank-accounts.update`, `store.bank-accounts.store`, `store.bank-accounts.transactions`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## BankAccounts/Transactions.jsx

Maintain business bank-account records.

Source: `app-code/main-app/resources/js/Pages/BankAccounts/Transactions.jsx`. Module declaration: bank_accounts.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/bank-accounts/{bankAccount}/transactions` — `store.bank-accounts.transactions`

Literal interface text: Bank Transactions.

Action/navigation references: `store.bank-accounts.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## BankReconciliation/BankReconciliation.jsx

Compare bank records with the books.

Source: `app-code/main-app/resources/js/Pages/BankReconciliation/BankReconciliation.jsx`. Module declaration: bank_reconciliation.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/bank-reconciliation` — `store.bank-reconciliation.index`

Literal interface text: Bank Reconciliation; Import Statement; Export Report.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## BatchTracking/BatchTracking.jsx

Follow batches and expiry information.

Source: `app-code/main-app/resources/js/Pages/BatchTracking/BatchTracking.jsx`. Module declaration: batches_expiry.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/batches` — `store.batches.index`

Literal interface text: Batch Tracking; Search batches...; Export; Print.

Action/navigation references: `store.batches.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Billing/Index.jsx

Inspect account charges, plans, allowances and subscription actions.

Source: `app-code/main-app/resources/js/Pages/Billing/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/billing` — `store.billing`

Literal interface text: Billing & Subscription — VenQore; Re-check status with Lemon Squeezy; Products (SKUs); Staff Members (Full Seats); Cashier Till PINs; Locations & Warehouses; POS Registers (Devices); Monthly Transactions; Monthly Service Jobs; AI SmartCapture Credits; AI Document Scans; History Retention Window; e.g. 500; First 5 variants included (e.g. 6); Billing & Subscription; e.g. 42101-1234567-1; e.g. +92 300 1234567; View-Only Mode Active; Need Raw Hardware Receipt Printing &amp; Peripherals?; Nothing Important is Withheld.; Live Store Resource Usage; AI Engine &amp; SmartCapture Add-ons; Lifetime BYOK License; 1,000 AI Credits Top-Up; Managed AI Subscriptions; Platform Channel Sync; WooCommerce Channel Sync; Amazon SP-API Channel Sync; Professional Catalog Onboarding Service; Confirm Change; Cancel Subscription?; Regional Pricing Unlocked; Verification Request Pending; Verify Identity for Regional Pricing.

Action/navigation references: `store.billing.payment-history`, `store.billing.sync-subscription`, `store.billing.upgrade`, `store.billing.change-plan`, `store.billing.cancel-subscription`, `store.billing.resume-subscription`, `store.apps`, `platform.pk-verifications.submit`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Builder/Index.jsx

Describe, review or change a workspace setup.

Source: `app-code/main-app/resources/js/Pages/Builder/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/builder` — `store.builder`

Literal interface text: Builder; Modules; Or just say it:; Your modules; Discard; Turn Off Module.

Action/navigation references: `store.builder.preview`, `store.builder.data-at-stake`, `store.builder.apply`, `store.builder.modify`, `store.onboarding.v2`, `store.dashboard`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## ChequeBooks/Create.jsx

Track cheque books, leaves and their lifecycle.

Source: `app-code/main-app/resources/js/Pages/ChequeBooks/Create.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/banking/cheque-books/create` — `store.banking.cheque-books.create`

Literal interface text: Register Chequebook; -- Select Bank Account --; E.G. CHK, HBL; Select digit length; e.g. 1001; e.g. 1050; e.g. Operational expense chequebook issued Sept 2026.

Action/navigation references: `store.banking.cheque-books.store`, `store.banking.cheque-books.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## ChequeBooks/Index.jsx

Track cheque books, leaves and their lifecycle.

Source: `app-code/main-app/resources/js/Pages/ChequeBooks/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/banking/cheque-books` — `store.banking.cheque-books.index`

Literal interface text: Chequebooks Management; Chequebooks; All Bank Accounts; All Statuses; Close Book; Delete Chequebook.

Action/navigation references: `store.banking.cheque-books.index`, `store.banking.cheque-books.close`, `store.banking.cheque-books.destroy`, `store.banking.reports.outgoing-cheques`, `store.banking.cheque-books.create`, `store.banking.cheque-books.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## ChequeBooks/ReceivedCheques.jsx

Track cheque books, leaves and their lifecycle.

Source: `app-code/main-app/resources/js/Pages/ChequeBooks/ReceivedCheques.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/banking/received-cheques` — `store.banking.received-cheques.index`

Literal interface text: Received Customer Cheques; Received Cheques; All Statuses; All Customers; e.g. HBL, Meezan; -- Walk-in / General Customer --; e.g. Main Branch, Gulberg; -- Select Bank Account --; Record Received Customer Cheque.

Action/navigation references: `store.banking.received-cheques.index`, `store.banking.received-cheques.store`, `store.banking.received-cheques.deposit`, `store.banking.received-cheques.clear`, `store.banking.received-cheques.bounce`, `store.banking.received-cheques.return`, `store.banking.reports.incoming-cheques`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## ChequeBooks/Show.jsx

Track cheque books, leaves and their lifecycle.

Source: `app-code/main-app/resources/js/Pages/ChequeBooks/Show.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/banking/cheque-books/{id}` — `store.banking.cheque-books.show`

Literal interface text: Search leaf #, payee...; All Leaf Statuses.

Action/navigation references: `store.banking.cheque-books.show`, `store.banking.cheque-leaves.void`, `store.banking.cheque-leaves.stop`, `store.banking.cheque-leaves.clear`, `store.banking.cheque-leaves.bounce`, `store.banking.cheque-books.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## ChequeBooks/Reports/IncomingRegister.jsx

Track cheque books, leaves and their lifecycle.

Source: `app-code/main-app/resources/js/Pages/ChequeBooks/Reports/IncomingRegister.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/banking/reports/incoming-cheques` — `store.banking.reports.incoming-cheques`

Literal interface text: Incoming Cheque Register; All Statuses; All Customers; From; To; Incoming Cheques.

Action/navigation references: `store.banking.reports.incoming-cheques`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## ChequeBooks/Reports/OutgoingRegister.jsx

Track cheque books, leaves and their lifecycle.

Source: `app-code/main-app/resources/js/Pages/ChequeBooks/Reports/OutgoingRegister.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/banking/reports/outgoing-cheques` — `store.banking.reports.outgoing-cheques`

Literal interface text: Outgoing Cheque Register; All Bank Accounts; All Statuses; From; To; Outgoing Cheques.

Action/navigation references: `store.banking.reports.outgoing-cheques`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## ChequeBooks/Reports/PostDated.jsx

Track cheque books, leaves and their lifecycle.

Source: `app-code/main-app/resources/js/Pages/ChequeBooks/Reports/PostDated.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/banking/reports/post-dated-cheques` — `store.banking.reports.post-dated-cheques`

Literal interface text: Post-Dated Cheques; All Upcoming.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## ChequeBooks/Reports/Utilization.jsx

Track cheque books, leaves and their lifecycle.

Source: `app-code/main-app/resources/js/Pages/ChequeBooks/Reports/Utilization.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/banking/reports/cheque-utilization` — `store.banking.reports.cheque-utilization`

Literal interface text: Chequebook Utilization.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Commerce/Book.jsx

Give shoppers a catalogue, cart, checkout or order-follow-up experience.

Source: `app-code/main-app/resources/js/Pages/Commerce/Book.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /book/{slug}` — `commerce.book`

Literal interface text: Service; Preferred date; Preferred time; Your name; Phone number; Address (if we come to you); Anything we should know?.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Commerce/Directory.jsx

Give shoppers a catalogue, cart, checkout or order-follow-up experience.

Source: `app-code/main-app/resources/js/Pages/Commerce/Directory.jsx`. Module declaration: online_store.

Direct render route(s):
- `GET,HEAD /shop` — `commerce.directory`

Literal interface text: Find shops near you; Search shops, food and products; Pizza, groceries, a phone charger…; Main photos; Deals and offers; Deals tile; Free delivery; Delivery tile; How it works; Shop by category; Scroll left; Scroll right; Closest to you; Best sellers; View; Filters; Banner photo; Search.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Commerce/OnsiteMenu.jsx

Give shoppers a catalogue, cart, checkout or order-follow-up experience.

Source: `app-code/main-app/resources/js/Pages/Commerce/OnsiteMenu.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Commerce/OrderLookup.jsx

Give shoppers a catalogue, cart, checkout or order-follow-up experience.

Source: `app-code/main-app/resources/js/Pages/Commerce/OrderLookup.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /order-lookup` — `commerce.order-lookup`

Literal interface text: Find my order; Order number; Phone number.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Commerce/OrderStatus.jsx

Give shoppers a catalogue, cart, checkout or order-follow-up experience.

Source: `app-code/main-app/resources/js/Pages/Commerce/OrderStatus.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /order-status/{token}` — `commerce.order-status`

Literal interface text: Order progress; Transaction reference / ID; e.g. TRX-9823412 or bank ref; Items; Your other orders here; Bank transfer payment; History.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Commerce/RiderDeliveries.jsx

Give shoppers a catalogue, cart, checkout or order-follow-up experience.

Source: `app-code/main-app/resources/js/Pages/Commerce/RiderDeliveries.jsx`. Module declaration: online_store.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: My rides; Cash collected; Rides now.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Commerce/Store.jsx

Give shoppers a catalogue, cart, checkout or order-follow-up experience.

Source: `app-code/main-app/resources/js/Pages/Commerce/Store.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Choose an option; Catalogue; Search this store; Categories; Your cart; Close cart; Delivery area; Coupon code (optional); Enter code; Phone number; Email (optional); Delivery address; About this business; Cart summary; Close; Curated Catalogue Ledger; Quick order; Your order.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Cookbook/Create.jsx

Define and inspect recipes and their material costs.

Source: `app-code/main-app/resources/js/Pages/Cookbook/Create.jsx`. Module declaration: cookbook.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/cookbook/create` — `store.cookbook.create`
- `GET,HEAD /s/{store_slug}/cookbook/{id}/edit` — `store.cookbook.edit`

Literal interface text: e.g., Garam Masala Mix; Brief steps...; Search Ingredient...; Title e.g. How-to Video; URL....

Action/navigation references: `store.cookbook.update`, `store.cookbook.store`, `store.cookbook.index`, `store.inventory.store`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Cookbook/RecipesList.jsx

Define and inspect recipes and their material costs.

Source: `app-code/main-app/resources/js/Pages/Cookbook/RecipesList.jsx`. Module declaration: cookbook.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/cookbook` — `store.cookbook.index`

Literal interface text: Cookbook; Simulate Production; View Training; Your Cookbook is Empty.

Action/navigation references: `store.cookbook.destroy`, `store.cookbook.simulate`, `store.cookbook.create`, `store.cookbook.edit`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Dashboards/AccountantDashboard.jsx

Inspect or arrange a relevant view of the business.

Source: `app-code/main-app/resources/js/Pages/Dashboards/AccountantDashboard.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Finance Dashboard; Income vs expense; Cash vs bank; Receivables aging; Payables due soon; Bank & cash accounts; Recent journal entries; View all.

Action/navigation references: `store.finance.accounts`, `store.finance.receivables`, `store.finance.payables`, `store.reports.profit-loss`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Dashboards/CashierDashboard.jsx

Inspect or arrange a relevant view of the business.

Source: `app-code/main-app/resources/js/Pages/Dashboards/CashierDashboard.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: My Dashboard; Transactions Today; Time on Shift.

Action/navigation references: `store.pos`, `store.returns.create`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Dashboards/ClassicDashboardView.jsx

Inspect or arrange a relevant view of the business.

Source: `app-code/main-app/resources/js/Pages/Dashboards/ClassicDashboardView.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Revenue; Gross Profit; To Receive; To Pay; Net Profit; Store Health; Recent Purchases.

Action/navigation references: `store.sales.index`, `store.reports.dashboard`, `store.finance.receivables`, `store.finance.payables`, `store.reports.profit-loss`, `store.inventory.index`, `store.purchases.create`, `store.purchases.index`, `store.purchases.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Dashboards/ModuleDashboard.jsx

Inspect or arrange a relevant view of the business.

Source: `app-code/main-app/resources/js/Pages/Dashboards/ModuleDashboard.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/restaurant/overview` — `store.restaurant.overview`
- `GET,HEAD /s/{store_slug}/contacts-overview` — `store.parties.dashboard`
- `GET,HEAD /s/{store_slug}/purchases-overview` — `store.purchases.dashboard`
- `GET,HEAD /s/{store_slug}/money-overview` — `store.money.dashboard`
- `GET,HEAD /s/{store_slug}/online-store/dashboard` — `store.commerce.dashboard`

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Dashboards/PurchasingDashboard.jsx

Inspect or arrange a relevant view of the business.

Source: `app-code/main-app/resources/js/Pages/Dashboards/PurchasingDashboard.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Purchasing Dashboard; Pending Deliveries; Reorder Alerts; Supplier Payables; 📦 Purchasing &amp; Procurement.

Action/navigation references: `store.purchases.create`, `store.purchases.index`, `store.inventory.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Dashboards/ViewerDashboard.jsx

Inspect or arrange a relevant view of the business.

Source: `app-code/main-app/resources/js/Pages/Dashboards/ViewerDashboard.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Reports — Read Only; Profit &amp; Loss Statement; Balance Sheet; Inventory Valuation; Trial Balance; Read-Only Reports.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## DebitNotes/Create.jsx

Record supplier-side adjustments.

Source: `app-code/main-app/resources/js/Pages/DebitNotes/Create.jsx`. Module declaration: purchase_returns.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/debit-notes/create` — `store.debit-notes.create`

Literal interface text: Against purchase; Goods; Goods leave from; Stage; Note no.; Auto; Date; Reason; Short delivery, damaged in transit, price differs from the quote…; Note; Who agreed it, when they were told…; A debit note reduces what you owe this supplier; Which bill is this about?.

Action/navigation references: `store.api.purchases.for-party`, `store.debit-notes.update`, `store.debit-notes.store`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## DebitNotes/DebitNotes.jsx

Record supplier-side adjustments.

Source: `app-code/main-app/resources/js/Pages/DebitNotes/DebitNotes.jsx`. Module declaration: purchase_returns.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/debit-notes` — `store.debit-notes.index`

Literal interface text: Debit Notes; All notes; Search note...; Export; Print; Filter; Search; New Debit Note; Search note reference...; View.

Action/navigation references: `store.debit-notes.index`, `store.debit-notes.create`, `store.debit-notes.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## DebitNotes/Show.jsx

Record supplier-side adjustments.

Source: `app-code/main-app/resources/js/Pages/DebitNotes/Show.jsx`. Module declaration: purchase_returns.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/debit-notes/{id}` — `store.debit-notes.show`
- `GET,HEAD /s/{store_slug}/debit-notes/{id}/print` — `store.debit-notes.print`

Literal interface text: Items.

Action/navigation references: `store.debit-notes.refund`, `store.purchase-orders.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Demo/Landing.jsx

Explore sample workflows.

Source: `app-code/main-app/resources/js/Pages/Demo/Landing.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /demo` — `demo.landing`

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## EInvoicing/EInvoicing.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/EInvoicing/EInvoicing.jsx`. Module declaration: tax_compliance.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/e-invoicing` — `store.e-invoicing.index`

Literal interface text: E-Invoicing & E-Way Bill; E-Invoicing; E-Invoices; e.g. DHL, FedEx, Fast Logistics; e.g. ABC-1234, LH-5544; FBR E-Invoicing Integration Disabled.

Action/navigation references: `store.e-invoicing.generate`, `store.e-invoicing.waybill`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Errors/StoreSuspended.jsx

Explain an unavailable, failed or refused operation.

Source: `app-code/main-app/resources/js/Pages/Errors/StoreSuspended.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Store Suspended — VenQore; Store Suspended.

Action/navigation references: `hub`, `logout`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Errors/TrialExpired.jsx

Explain an unavailable, failed or refused operation.

Source: `app-code/main-app/resources/js/Pages/Errors/TrialExpired.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/trial-expired` — `store.trial.expired`

Literal interface text: Trial Expired — VenQore; Your Trial Has Ended.

Action/navigation references: `store.billing`, `redeem`, `hub`, `logout`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Expenses/Create.jsx

Record and inspect operating spending.

Source: `app-code/main-app/resources/js/Pages/Expenses/Create.jsx`. Module declaration: expenses.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/expenses/create` — `store.expenses.create`

Literal interface text: Settlement; Money comes from; Drawn on Bank; Select bank account...; Cheque leaf; Cheque date; Voucher no.; Their bill number, or your own; Date; Attachment; New category; Note; Who was paid, what period it covers…; Money leaving the business; New expense category; Name; Shop rent, electricity, staff tea….

Action/navigation references: `store.expenses.category.store`, `store.expenses.store`, `store.approvals.show`, `store.expenses.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Expenses/ExpensesList.jsx

Record and inspect operating spending.

Source: `app-code/main-app/resources/js/Pages/Expenses/ExpensesList.jsx`. Module declaration: expenses.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/expenses` — `store.expenses.index`

Literal interface text: Search party name or phone...; Expenses; Category name; Save Category; Cancel; New category name; Add category; Category Name; Save Category (Enter); Cancel (Esc); Add Category; Search expenses...; Edit; Delete; New Category Name...; — Select Category —; 0.00; Choose Bank Account; Receipt # or Bill Code; Specify the operational purpose...; Delete Expense; Please correct the following:; Basic Details; Payment & Tax; Context & Proof.

Action/navigation references: `store.parties.search`, `store.expenses.index`, `store.expenses.destroy`, `store.expenses.category.store`, `store.expenses.update`, `store.expenses.store`, `store.onboarding.step`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Finance/FinanceDashboard.jsx

Inspect business money and supported finance actions.

Source: `app-code/main-app/resources/js/Pages/Finance/FinanceDashboard.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/finance` — `store.finance`

Literal interface text: Finance Dashboard; Cash in vs out; Where the money sits; Top receivables; Top payables; Recent transactions.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Finance/Payables.jsx

Inspect business money and supported finance actions.

Source: `app-code/main-app/resources/js/Pages/Finance/Payables.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/finance/payables` — `store.finance.payables`
- `GET,HEAD /s/{store_slug}/finance/payables` — `store.finance.payables`

Literal interface text: Accounts Payable; Payables; Export; Print; Record Payment; View Ledger.

Action/navigation references: `store.payments.out`, `store.parties.ledger`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Finance/Receivables.jsx

Inspect business money and supported finance actions.

Source: `app-code/main-app/resources/js/Pages/Finance/Receivables.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/finance/receivables` — `store.finance.receivables`
- `GET,HEAD /s/{store_slug}/finance/receivables` — `store.finance.receivables`

Literal interface text: Accounts Receivable; Receivables; Export; Print; Send Payment Reminder via WhatsApp; Call; Record Payment; View Ledger.

Action/navigation references: `store.payments.in`, `store.parties.ledger`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Foh/Index.jsx

Run table, takeaway and delivery service.

Source: `app-code/main-app/resources/js/Pages/Foh/Index.jsx`. Module declaration: table_service.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/foh/{tab?}` — `store.foh`

Literal interface text: Open cash drawer (Ctrl+D); Add Product; Toggle category layout; Scroll categories left; Scroll categories right; Has variants; Catalog strip height, in tile rows; Drag to add or remove a tile row. Double-click for one row.; Type a new unit price; Click to edit line discount; Edit price, quantity or rate; Take the weight from the scale; Decrease quantity; Increase quantity; Decrease free quantity; Increase free quantity; Remove item; 0.00; Name for this order (optional); Open the catalog; Close; Front of House; Tables; Where payment opens; e.g. Meezan Bank, HBL Shop; Optional; Overpayment Detected; Recall sale into POS cart; Delete parked sale; Details; Done; Select Variant; Use Excess Amount; Apply Item Discount; Apply; Edit Item Values; Sync Hub; Recent invoices; Parked sales.

Action/navigation references: `store.tables.plan.map`, `store.tables.service-charge`, `store.tables.service-mode`, `store.tables.prepares-orders`, `store.tables.plan`, `store.tables.guest-call.clear`, `store.pos.modifiers`, `store.inventory.search`, `store.pos.recent-sales`, `store.pos`, `store.pos.search`, `store.pos.barcode`, `store.tables.guest-line-reason`, `store.pos.sales.store`, `store.onboarding.step`, `store.customers.search`, `store.sales.parked`, `store.sales.park`, `store.sales.parked.delete`, `store.pos.categories`, `store.pos.featured`, `store.sales.lookup`, `store.pos.return.store`, `store.sales.return`, `store.foh`, `store.bank-accounts.store`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Foh/Settings.jsx

Run table, takeaway and delivery service.

Source: `app-code/main-app/resources/js/Pages/Foh/Settings.jsx`. Module declaration: table_service.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/foh-settings` — `store.foh.settings`

Literal interface text: FOH Settings; Tables; Takeaway; Delivery; Ask for a customer name on takeaway; Keep paid orders until collected; Close automatically when collected; Send orders to the kitchen; Print kitchen tickets; Show prices on kitchen tickets; Print automatically on the kitchen screen; Sound alert for new orders; Front of house settings; What you serve; Stock; Takeaway and delivery; Charges and kitchen.

Action/navigation references: `store.foh.settings.save`, `store.foh.settings.untrack`, `store.restaurant.riders`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Funds/CashHistory.jsx

Inspect account balances and supported cash movements.

Source: `app-code/main-app/resources/js/Pages/Funds/CashHistory.jsx`. Module declaration: cash_register.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/funds/cash-history` — `store.funds.history.ledger`

Literal interface text: Cash Ledger; Cash In Hand; All transactions; Print.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Funds/FundManagement.jsx

Inspect account balances and supported cash movements.

Source: `app-code/main-app/resources/js/Pages/Funds/FundManagement.jsx`. Module declaration: cash_register.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/funds` — `store.funds.index`

Literal interface text: Search...; Fund Management; Fund flow; Balance by account; Largest movements; Recent activity; Transactions; Add Funds; Enter amount; e.g., Owner capital investment; Remove Funds; e.g., Owner personal withdrawal; Transfer Funds; Adjust Balance; Enter actual balance; e.g., Physical cash count correction.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Gift/Invalid.jsx

Use the supported gift or redemption experience.

Source: `app-code/main-app/resources/js/Pages/Gift/Invalid.jsx`. Module declaration: loyalty_gift.

Direct render route(s):
- `GET,HEAD /gift/{token}` — `gift.show`
- `GET,HEAD /gift/{token}` — `gift.show`

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Gift/Show.jsx

Use the supported gift or redemption experience.

Source: `app-code/main-app/resources/js/Pages/Gift/Show.jsx`. Module declaration: loyalty_gift.

Direct render route(s):
- `GET,HEAD /gift/{token}` — `gift.show`

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## GrowthEngine/GrowthDashboard.jsx

Review business insights with their supporting data.

Source: `app-code/main-app/resources/js/Pages/GrowthEngine/GrowthDashboard.jsx`. Module declaration: ai_insights.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/growth-engine` — `store.growth-engine.index`

Literal interface text: Category; Priority; Growth Engine; New; Close; Insights given; Checked; Correct; Clear; Nothing matches that filter; Show everything; Not analysed yet; The analysis ran into a problem; Nothing needs your attention; How accurate is the Growth Engine?.

Action/navigation references: `store.growth-engine.index`, `store.growth-engine.show`, `store.growth-engine.refresh`, `store.growth-engine.whatsapp`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## GrowthEngine/Settings.jsx

Review business insights with their supporting data.

Source: `app-code/main-app/resources/js/Pages/GrowthEngine/Settings.jsx`. Module declaration: ai_insights.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/growth-engine/settings` — `store.growth-engine.settings`

Literal interface text: Growth Engine Settings; Minimum orders before a customer is analysed; History window (days); Stock forecasting; How far ahead to warn (days); Your typical order; Typical reorder gap; Your payment terms; Loyalty points; Points earned per block; Nothing is muted.

Action/navigation references: `store.growth-engine.update-settings`, `store.growth-engine.unmute`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Help/Index.jsx

Find product guidance or assistance.

Source: `app-code/main-app/resources/js/Pages/Help/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /help` — `help.index`

Literal interface text: Help Centre — VenQore POS; Search knowledge base articles for setup, POS hardware, inventory, accounting and plan limits.; Search articles (e.g. barcode printer, stock transfer, plan limits)...; VenQore Help Centre; Search; No articles match that search.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Help/Show.jsx

Find product guidance or assistance.

Source: `app-code/main-app/resources/js/Pages/Help/Show.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /help/articles/{slug}` — `help.show`

Literal interface text: Still stuck?.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Hub/Index.jsx

Select or organise the businesses the user can access.

Source: `app-code/main-app/resources/js/Pages/Hub/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /hub` — `hub`

Literal interface text: Your Stores — VenQore; e.g. VQ-A3X9; Ignore; Pending Invitations; Have a short code?.

Action/navigation references: `invite.validate-code`, `invite.accept`, `logout`, `store.create`, `store.join`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Installer/Index.jsx

Set up an installation; deployment checks still apply.

Source: `app-code/main-app/resources/js/Pages/Installer/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /installer` — `installer.index`

Literal interface text: System Installer | VenQore; XXXX-XXXX-XXXX-XXXX; 127.0.0.1 or localhost; 3306; venqore; root; ••••••••; Abdullah Hashmi; admin@venqore.com; 1234; Preparing High-Performance Installer; License Verification; Restore Backup / Vyapar; Start Fresh; Administrator Profile; Create Profile & Launch; ONLINE.

Action/navigation references: `store.create-or-join`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Inventory/AddOns.jsx

Maintain the product catalogue and inspect recorded stock.

Source: `app-code/main-app/resources/js/Pages/Inventory/AddOns.jsx`. Module declaration: table_service.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/addons` — `store.addons.index`

Literal interface text: Add-ons; Edit group; Delete group; Close; Pizza toppings; Extra cheese; Price change; Move up; Move down; Remove add-on; Search items; Delete this add-on group?.

Action/navigation references: `store.addons.update`, `store.addons.store`, `store.addons.destroy`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Inventory/Categories.jsx

Maintain the product catalogue and inspect recorded stock.

Source: `app-code/main-app/resources/js/Pages/Inventory/Categories.jsx`. Module declaration: products.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/inventory/categories` — `store.categories.index`

Literal interface text: Categories; Category Name; e.g., Electronics, Clothing; Parent Category; Description; Optional description for this category.

Action/navigation references: `store.categories.index`, `store.categories.destroy`, `store.categories.update`, `store.categories.store`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Inventory/Dashboard.jsx

Maintain the product catalogue and inspect recorded stock.

Source: `app-code/main-app/resources/js/Pages/Inventory/Dashboard.jsx`. Module declaration: inventory.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/inventory` — `store.inventory.dashboard`

Literal interface text: Inventory Dashboard; Stock value by category; Top moving items; Recent stock received; Quick actions; Batch expiry alerts.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Inventory/InventoryList.jsx

Maintain the product catalogue and inspect recorded stock.

Source: `app-code/main-app/resources/js/Pages/Inventory/InventoryList.jsx`. Module declaration: products.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/inventory/list` — `store.inventory.index`
- `GET,HEAD /s/{store_slug}/services/catalogue` — `store.services.catalogue`

Literal interface text: Inventory Management; Inventory & Services; Category and type filter; Find a category…; Search; Add product or service; Clear search; Clear all column filters; Edit; Delete; Clear; Apply.

Action/navigation references: `store.inventory.index`, `store.inventory.destroy`, `store.inventory.bulk-destroy`, `store.admin.data`, `store.admin.settings`, `store.products.variants.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Inventory/StockLevels.jsx

Maintain the product catalogue and inspect recorded stock.

Source: `app-code/main-app/resources/js/Pages/Inventory/StockLevels.jsx`. Module declaration: inventory.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/inventory/stock-levels` — `store.inventory.stock-levels`
- `GET,HEAD /s/{store_slug}/inventory/stock` — `store.inventory.stock`

Literal interface text: Stock Levels.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Inventory/Attributes/AttributesList.jsx

Maintain the product catalogue and inspect recorded stock.

Source: `app-code/main-app/resources/js/Pages/Inventory/Attributes/AttributesList.jsx`. Module declaration: variants.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/attributes` — `store.attributes.index`

Literal interface text: Attributes; e.g. Size, Color; Type option and press Enter; Cancel.

Action/navigation references: `store.attributes.update`, `store.attributes.store`, `store.attributes.destroy`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Inventory/Production/Create.jsx

Maintain the product catalogue and inspect recorded stock.

Source: `app-code/main-app/resources/js/Pages/Inventory/Production/Create.jsx`. Module declaration: production_runs.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/inventory/production/create` — `store.production.create`

Literal interface text: New Production Run; Search product...; Bill of Materials; Quantity to Produce; Warehouse; Select warehouse; Run Date.

Action/navigation references: `store.production.store`, `store.production.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Inventory/Production/ProductionRuns.jsx

Maintain the product catalogue and inspect recorded stock.

Source: `app-code/main-app/resources/js/Pages/Inventory/Production/ProductionRuns.jsx`. Module declaration: production_runs.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/inventory/production` — `store.production.index`

Literal interface text: Production Runs; Production; Search run or product....

Action/navigation references: `store.production.index`, `store.production.create`, `store.production.show`, `store.production.edit`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Inventory/Production/Show.jsx

Maintain the product catalogue and inspect recorded stock.

Source: `app-code/main-app/resources/js/Pages/Inventory/Production/Show.jsx`. Module declaration: production_runs.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/inventory/production/{run}` — `store.production.show`

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Inventory/Variants/VariantsList.jsx

Maintain the product catalogue and inspect recorded stock.

Source: `app-code/main-app/resources/js/Pages/Inventory/Variants/VariantsList.jsx`. Module declaration: variants.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/products/{product}/variants` — `store.products.variants.index`

Literal interface text: Variants; Name (e.g. Size); Value (e.g. XL); Cancel.

Action/navigation references: `store.variants.update`, `store.products.variants.store`, `store.variants.destroy`, `store.inventory.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Invite/Accept.jsx

Accept or inspect a supported invitation.

Source: `app-code/main-app/resources/js/Pages/Invite/Accept.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /invite/accept` — `invite.accept`

Literal interface text: Accept Invitation — VenQore; Store; Invited as; Your role(s).

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Invite/Invalid.jsx

Accept or inspect a supported invitation.

Source: `app-code/main-app/resources/js/Pages/Invite/Invalid.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /invite/accept` — `invite.accept`

Literal interface text: Invalid Invitation — VenQore.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Labels/LabelPrinter.jsx

Prepare product and barcode print output.

Source: `app-code/main-app/resources/js/Pages/Labels/LabelPrinter.jsx`. Module declaration: barcodes_labels.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/labels` — `store.labels.index`

Literal interface text: Label Printing; Barcode Labels.

Action/navigation references: `store.labels.print`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Loyalty/Index.jsx

Inspect or manage supported repeat-customer points.

Source: `app-code/main-app/resources/js/Pages/Loyalty/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/loyalty` — `store.loyalty.index`

Literal interface text: Search customer or phone...; Loyalty Points; Customer balances; How points work; Recent activity.

Action/navigation references: `store.growth-engine.settings`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Manufacturing/Rules.jsx

Record production inputs, output and history.

Source: `app-code/main-app/resources/js/Pages/Manufacturing/Rules.jsx`. Module declaration: production_runs, composite_items.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/manufacturing/rules` — `store.manufacturing.rules`

Literal interface text: Manufacturing Rules; Auto-Manufacturing; e.g., Garam Masala Production; Optional description...; Qty; No Manufacturing Rules Yet; Create Manufacturing Rule; Production Feasibility Simulator.

Action/navigation references: `store.inventory.search`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/About.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/About.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /about` — `marketing.about`

Literal interface text: The three disconnected worlds.; The consulting racket that solved nothing.; The architectural breakthrough.; What we do, and how we do it.; Four opinions, held on purpose.; 1. Software should fit the business, not the reverse.; 2. Money is not a place to be clever.; 3. Publish the proof, don't ask for trust.; 4. Institutional clarity priced for real commerce.; Deep native capabilities across industries.; Built by operators. Supported with conviction.; What we built; The correctness argument; What ships next; How we think about retail.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Blueprint.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Blueprint.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /blueprint` — `marketing.blueprint`

Literal interface text: Product navigation (illustration); Trend, last 14 periods; Comparison by period; Pharmacy; Wholesale; Café; Hardware store; Multi-branch; Six things, and you can edit all six.; Modules; Your vocabulary; Roles &amp; approvals; Tax &amp; compliance; Reports; The ledger mapping; What the AI cannot do.; A change request is a sentence.; You approve, and the system exists.; Today; Once it is built; See a build end to end; The six industry starting points; What it costs to run.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Campaigns.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Campaigns.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/marketing/campaigns` — `store.marketing-campaigns.index`

Literal interface text: Marketing & Campaigns; Marketing Campaigns; Campaigns; No Campaigns Yet.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Contact.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Contact.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /contact` — `marketing.contact`

Literal interface text: John Doe; Acme Retail; you@company.com; What you sell, how you buy, how many people, how many locations — and the thing that is currently painful.; Trying VenQore; More than 10 branches, or something specific; Partnerships &amp; integrations; Tell us what you need; Send it; Answers you may not need to ask for; The help centre; Documentation; Plans and limits.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/DashboardPreview.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/DashboardPreview.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /dashboard-preview` — `marketing.dashboard-preview`

Literal interface text: Everything a trading business is judged by.; Sales; Finance; Inventory; Purchasing; Operations; And the multiplier; No card can clip its own content.; 18 fits, all verified; A card widens before it degrades; Numbers step down, never clip; Exactly one filled card; A cashier is never offered the P&amp;L.; Behind the cards; One place a number can be defined; How your card set was chosen; Everything that ships today.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/DigitalProducts.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/DigitalProducts.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /digital-products` — `marketing.digital-products`

Literal interface text: VenQore Digital Products catalog; Explore our premium collection of offline POS modules, standalone platforms, and custom accounting extensions.; Digital Products & Registry Catalog; Close; Digital registry; Fully operational; Ledger integrity; Component expansion; Acquisition portals; Under construction; Conceptual roadmap; Pre-order / testing portals.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Documents.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Documents.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /documents` — `marketing.documents`

Literal interface text: Everything a trading business actually issues.; Copy-pasted screens are where the money leaks.; A debit note that never restored stock; A sale return that zeroed tax and discount; One tax source, then five; The same cart, totalled differently; Three densities, because a receipt is not a bill.; Shared by all thirteen.; One numbering scheme; One tax source; One round-off rule; One ledger path; One keymap; One layout law; One set of actions; One audit trail; Where documents come from; The register that issues them; What each one posts; Free document generators.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Features.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Features.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /features` — `marketing.features`

Literal interface text: Jump to a group; Six live demos, not six screenshots.; The register; Documents; The dashboard; SmartCapture; The Reckoner; VenSynQ; Selling; Stock; Buying; Money; Customers &amp; suppliers; Reports; People &amp; access; Channels; AI &amp; intelligence; Platform; What isn't here yet.; Go deeper; Your trade, specifically; How this compares; Guides and how-tos.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/KnownIssues.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/KnownIssues.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /known-issues` — `known-issues.show`

Literal interface text: Known issues & status; Live list of known VenQore issues — what is affected, the workaround, and when it was last updated.; Search by title or ID; Open; Mitigated — workaround in place; Resolved; Known issues.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Ledger.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Ledger.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /ledger` — `marketing.ledger`

Literal interface text: One engine, every module; Auditable by design; We'd rather publish the check than ask you to trust it.; What that actually means on a Tuesday.; Your P&amp;L is not a report someone generated.; Month-end isn't a reconstruction. It's a date range.; Your accountant gets a trial balance that ties, first time.; The rest of the argument; Where a number is defined; Who can reach your books; Double-entry accounting in detail.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Newsletter.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Newsletter.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /subscribe` — `marketing.newsletter`

Literal interface text: Newsletter Subscription — VenQore; John Doe; john@example.com; Check your inbox.

Action/navigation references: `marketing.newsletter.submit`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/NewsletterConfirm.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/NewsletterConfirm.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /subscribe/confirm/{token}` — `marketing.newsletter.confirm`

Literal interface text: Confirm newsletter subscription — VenQore; Confirm your VenQore newsletter subscription.; Subscription confirmed; Link not found.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/NewsletterUnsubscribe.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/NewsletterUnsubscribe.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /subscribe/unsubscribe/{token}` — `marketing.newsletter.unsubscribe`

Literal interface text: Unsubscribe from the newsletter — VenQore; Stop receiving VenQore newsletter emails.; Unsubscribe from VenQore.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Onboarding.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Onboarding.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /onboarding` — `marketing.onboarding`

Literal interface text: Al-Madina Pharmacy; you@company.com; Product navigation (illustration); Trend, last 14 periods; Comparison by period; What kind of business?; Now tell us how it actually works.; Pharmacy; Wholesale; Café; Back; Four things that change the build.; Reading your business…; Your Blueprint; Pick a plan, or don't.; Last thing.; Your system is live.; Today; After the build; Pick a plan when you are ready; The dashboard you will land on; Or start from your industry.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/PartnerSupport.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/PartnerSupport.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /partner-support` — `marketing.partner-support`

Literal interface text: VIP Partner Support Desk — VenQore; Verification & licensing support desk for operators using offline digital package solutions.; Type support reply message...; Send reply; Exact name used during check-out; Email used during check-out; e.g. Etsy, VIP Partner Marketplace; Any comments, requests or license numbers you want to include...; Partner &amp; owner support desk; Thank you for your purchase!; Submit another verification; Submit license details.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Partners.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Partners.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /partners` — `marketing.partners`

Literal interface text: B2B Partnership & Licensing Programs — VenQore; e.g. Alexander Wright; e.g. alex@distributor.com; e.g. Wright Retail Group; Detail your target market, operating region, and why you are interested in licensing VenQore...; The licensing ladder program; IP &amp; technical moat integrity; Partnership inquiry; Inquiry submitted.

Action/navigation references: `marketing.partners.store`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/PosShowcase.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/PosShowcase.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /pos` — `marketing.pos`

Literal interface text: Nobody else in this category ships resizable panes.; A preset is a starting point, not a cage; The engine measures, it does not guess; Proven, not eyeballed; Seven controls on the surface. No more.; Seventeen things that matter at 5pm on a Saturday.; Every sale posts to the ledger. All of it.; Around the counter; Thirteen document types, one editor; A high-speed grocery till; How this compares to Square.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Pricing.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Pricing.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /pricing` — `marketing.pricing`

Literal interface text: Billing period; Solo; Starter; Core; Scale; Nothing important is withheld.; Compare the plans.; Models cost money to run. We'd rather show you the meter.; Included Monthly; Top up anytime; Bring your own key; Buy only the shape you need.; Pricing questions.; Before you decide; What you are comparing against; Who can reach your data; See it built first.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Reckoner.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Reckoner.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /reckoner` — `marketing.reckoner`

Literal interface text: Six places computed "revenue". They disagreed.; Every figure, over any period, against the right comparison.; Your history outlives every change you make.; A key is permanent; History groups by identity, not by text; Business type is a label layer; Closed periods are sealed, not frozen; Six things we do differently, on purpose.; We do not show zero when we mean "we do not know"; A loss is called a loss; Growth against nothing is not +100%; What you bought and what you paid are two numbers; "Do my books balance" is a status, not a trend; Thresholds are yours, and they say so; Nobody waits at the till so a dashboard can stay warm.; We audited ourselves and found twelve cards lying.; Where the numbers surface; The dashboard that assembles itself; The engine underneath; All 140+ modules and what each does.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Roadmap.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Roadmap.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /roadmap` — `marketing.roadmap`

Literal interface text: Be Part of the Future of Business Software.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Security.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Security.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /security` — `marketing.security`

Literal interface text: A query cannot forget which business it belongs to.; Scoped at the model, not the query; Assigned on write, too; Proved, not asserted; Modules you switched off are actually off; Nothing is edited in place.; A correction is a reversal plus a new entry; Every posting traces to a document, a user and a timestamp; A closed period is closed; Export is a right, not a retention lever; Who can do what, and who did it.; Straight answers.; Related; How the ledger proves itself; What each plan includes; Setting up roles and access.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/SmartCapture.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/SmartCapture.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /smartcapture` — `marketing.smartcapture`

Literal interface text: Read it; Where the day actually goes.; Whatever the day hands you.; A photograph of a bill; A PDF or a screenshot; A voice note; A packing list; A price list; A stack of business cards; It matches. It does not guess.; Matched against your catalogue, not a dictionary; A line it cannot match is flagged, never invented; It checks the rate against what you last paid; Nothing posts until you approve it; One page in, one credit out. Visible before you spend it.; The questions people ask.; What it feeds; The documents it creates; Where the posting lands; Try it on your own bill.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/VenSynQ.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/VenSynQ.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /vensynq` — `marketing.vensynq`

Literal interface text: Trend, last 12 periods; Overselling is a refund, a bad review and a customer you do not get back.; Five channels, one catalogue.; Your counter; Your web store; WooCommerce; Amazon; eBay; TikTok Shop; Your marketplace margin is not your shop margin.; Commission is isolated, per channel; Fees follow the order that caused them; Just-in-time purchase orders; One place to look; Three clicks, then it runs.; Connect; Map once; Sell; Selling in more than one place; What channel sync costs; Running more than one branch; Orders become documents.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Blog/Index.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Blog/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /blog` — `blog.index`
- `GET,HEAD /blog` — `blog.index`

Literal interface text: Blog & Field Guides — VenQore; Blog pages; No articles yet; More from the Signal.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Blog/Show.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Blog/Show.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /blog/{slug}` — `blog.show`
- `GET,HEAD /blog/{slug}` — `blog.show`

Literal interface text: Run real money through an immutable Core Ledger.; Related field guides.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Compare/Index.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Compare/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /compare` — `marketing.compare.index`

Literal interface text: Before you decide; How VenQore compares to legacy POS &amp; billing systems; The four VenQore guarantees; Ready to take control of your margins?.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Compare/Show.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Compare/Show.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /compare/{slug}` — `marketing.compare.show`

Literal interface text: Related reading; VenQore; Detailed feature-by-feature matrix; Which should you choose?; When to choose VenQore; Switch to VenQore today.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Docs/Show.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Docs/Show.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /docs/{slug}` — `marketing.docs.show`

Literal interface text: Search Q&amp;A / docs…; Documentation; Clear; Matching questions; No Q&amp;A matches found; Related Questions &amp; Answers.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Features/Show.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Features/Show.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /features/{slug}` — `marketing.features.show`

Literal interface text: Related reading; Where generic software falls short; Every capability, shipped; Frequently asked questions; Explore related pages; Ready to see it for yourself?.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Shared/FeatureDemos.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Shared/FeatureDemos.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Profit & Loss; POS; Smart Capture; VenSynQ; Intelligence Engine; Cookbook.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Shared/MarketingLayout.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Shared/MarketingLayout.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Solutions/Index.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Solutions/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /solutions` — `marketing.solutions.index`

Literal interface text: Explore the platform; One ledger core. Every industry capability..

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Solutions/Show.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Solutions/Show.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /solutions/{slug}` — `marketing.solutions.show`

Literal interface text: Related reading; Compare competitors; Platform capabilities.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/Barcode.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/Barcode.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/barcode-generator` — `tools.barcode`
- `GET,HEAD /tools/barcode-generator/{format}` — `tools.barcode.format`

Literal interface text: Free Barcode Generator — Code128, EAN-13, UPC-A | VenQore; Extra line under the barcode, e.g. product name; Print a sheet of labels; Supported formats; Generate a specific format.

Action/navigation references: `tools.barcode.render`, `tools.barcode.validate`, `tools.barcode.sheet`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/BarcodeLabelSheet.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/BarcodeLabelSheet.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/barcode-label` — `tools.barcode-label`

Literal interface text: Free Barcode Label Sheet Generator | VenQore; Product name; Barcode value / SKU; Price.

Action/navigation references: `tools.barcode-label.parse`, `tools.barcode-label.sheet`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/BarcodeValidator.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/BarcodeValidator.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/barcode-validator` — `tools.barcode-validator`

Literal interface text: UPC/EAN Barcode Check Digit Validator — Free | VenQore; e.g. 012345678905.

Action/navigation references: `tools.barcode-validator.check`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/CashDrawer.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/CashDrawer.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/cash-drawer-count-sheet` — `tools.cash-drawer`

Literal interface text: Free Cash Drawer Count Sheet & Till Reconciliation | VenQore; e.g. Downtown Retail Store; e.g. Till #1; e.g. John Doe; e.g. Jane Smith; Count; Enter any notes regarding drawer overage/shortage or shift audit details...; Store & Register Shift Info; Till Summary & Variance.

Action/navigation references: `tools.cash-drawer.render`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/CashDrawerCountSheet.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/CashDrawerCountSheet.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Free Cash Drawer Count Sheet Generator — PDF, No Watermark | VenQore; Your store name; Shift; Counted by; Verified by; Add a note (optional — the printed sheet always includes blank lines here too); Register 1; Morning; Cashier name; Manager name.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/CreditNote.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/CreditNote.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/credit-note-generator` — `tools.credit-note`

Literal interface text: Free Credit Note Generator — PDF, No Watermark | VenQore; Your business name; Business address; email@business.com; Phone number; optional; e.g. INV-2026-0042; Describe the reason for credit; Client name; Client address; Client email (optional); Item description / reason detail; Add a note (optional); e.g. Credit applied on approval.

Action/navigation references: `tools.credit-note.render`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/FoodCostCalculator.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/FoodCostCalculator.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/food-cost-calculator` — `tools.food-cost`

Literal interface text: Free Recipe Costing Calculator (Food Cost %) | VenQore; e.g. Chicken Alfredo; e.g. Flour; Recipe Ingredients & Unit Costs.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/Index.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools` — `tools.index`

Literal interface text: Free Retail Tools — Barcode Generator & More | VenQore.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/InventoryHealth.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/InventoryHealth.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/inventory-health` — `tools.inventory-health`

Literal interface text: Free Inventory Health Toolkit | Reorder Point, Safety Stock, EOQ, GMROI, Turnover | VenQore; 35; 10; 20; 30; 5000; 50; 45000; 18000; 100000; 55000; 120000; 20000; Safety Stock; Reorder Point; Economic Order Quantity (EOQ); GMROI; Inventory Turnover; How these five numbers fit together.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/Invoice.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/Invoice.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/invoice-generator` — `tools.invoice`

Literal interface text: Free Invoice Generator — PDF, No Watermark | VenQore; Your business name; Business address; email@business.com; Phone number; optional; Client name; Client address; Client email (optional); Item description; Add a note (optional); e.g. Net 14.

Action/navigation references: `tools.invoice.render`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/LabelSheet.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/LabelSheet.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/label-sheet-generator` — `tools.label-sheet`

Literal interface text: Free Label Sheet Generator — Printable Text Labels PDF | VenQore; Remove label; Line 1; Line 2 (optional); Line 3 (optional); Left align; Center align; Bold first line; Repeat this label N times.

Action/navigation references: `tools.label-sheet.parse`, `tools.label-sheet.sheet`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/LeadConfirm.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/LeadConfirm.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/lead/confirm/{token}` — `tools.lead.confirm`

Literal interface text: Confirm subscription — VenQore; Confirm your email address to receive the file you generated.; You're confirmed; Link not found.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/LeadUnsubscribe.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/LeadUnsubscribe.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/lead/unsubscribe/{token}` — `tools.lead.unsubscribe`

Literal interface text: Unsubscribe — VenQore; Unsubscribe from VenQore tool emails.; You're unsubscribed; Unsubscribe from VenQore emails.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/MarginCalculator.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/MarginCalculator.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/margin-calculator` — `tools.margin-calculator`

Literal interface text: Free Profit Margin & Markup Calculator | VenQore; 0.00; Product name; Solve any two; Price to hit a target; Bulk mode; Margin vs. markup — what's the difference?.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/PackingSlip.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/PackingSlip.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/packing-slip-generator` — `tools.packing-slip`

Literal interface text: Free Packing Slip Generator — PDF, No Prices | VenQore; Your business name; Ship from address; email@business.com; Phone number; e.g. FedEx, UPS, DHL; Tracking number; Recipient name; Delivery address; Phone (optional); Email (optional); Billing contact / company; Billing address; SKU; Item description; Note (optional); Box 1; Add a gift message (optional); e.g. Leave at back door, Handle with extreme care....

Action/navigation references: `tools.packing-slip.render`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/PaymentFeeCalculator.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/PaymentFeeCalculator.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/payment-fee-calculator` — `tools.payment-fee`

Literal interface text: Free Payment Processing Fee Calculator | VenQore; 0.00; Processor rates; Why comparing "just the percentage" is misleading; Card-present vs. card-not-present rates; Monthly and plan fees can shift the winner too.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/PosRoiCalculator.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/PosRoiCalculator.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/pos-roi-calculator` — `tools.pos-roi`

Literal interface text: POS ROI & Payback Period Calculator; 45000; 25; 16; 18; 1200; 79; POS ROI & Payback Calculator; Understanding Your POS Return on Investment.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/PriceTag.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/PriceTag.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/price-tag-generator` — `tools.price-tag`

Literal interface text: Free Price Tag Generator — Shelf Edge Labels PDF | VenQore; Cotton Crew T-Shirt,19.99,29.99,TSH-001,SALE&#10;Slim Fit Denim Jeans,49.99,,JNS-002,NEW; badge; Remove tag; Product name; SKU; 0.00.

Action/navigation references: `tools.price-tag.parse`, `tools.price-tag.sheet`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/ProductCsvCleaner.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/ProductCsvCleaner.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/product-csv-cleaner` — `tools.csv-cleaner`

Literal interface text: Free Product CSV Cleaner — Fix Messy Product Exports | VenQore; 1. Upload or paste your CSV; 2. Confirm column mapping; 3. Cleanup report.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/PurchaseOrder.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/PurchaseOrder.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/purchase-order-generator` — `tools.purchase-order`

Literal interface text: Free Purchase Order Generator — PDF, No Watermark | VenQore; Your business name; Business address; email@business.com; Phone number; optional; Net 30; Vendor / supplier name; Attn: contact person; Vendor address; Vendor email; Vendor phone; Ship-to address (optional, defaults to business address); SKU-101; Item description; Add a note (optional); Name (Purchasing Manager) — printed on the signature line.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/QrCode.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/QrCode.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/qr-code-generator` — `tools.qr`

Literal interface text: Free QR Code Generator — URL, WiFi, vCard | VenQore; URL; e.g. venqore.com; Any text to encode; Network name (SSID); Password; Full name; Phone; Email; Company; Email address; Subject (optional); Phone number; e.g. +1 555 123 4567.

Action/navigation references: `tools.qr.render`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/QrMenu.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/QrMenu.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/qr-menu-generator` — `tools.qr-menu`

Literal interface text: Free QR Menu & Table Card Generator — Restaurant & Café | VenQore; e.g. The Artisan Bistro; e.g. https://myrestaurant.com/menu; e.g. Scan for Digital Menu; e.g. 12 or A-4; e.g. Point your camera at the QR code to open menu; Dish Name; Price; Short description / ingredients (optional).

Action/navigation references: `tools.qr-menu.render`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/QrMenuPublic.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/QrMenuPublic.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/Quote.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/Quote.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/quote-generator` — `tools.quote`

Literal interface text: Free Quotation Generator — PDF Quotes & Estimates, No Watermark | VenQore; Your business name; Business address; email@business.com; Phone number; optional; Client name; Client address; Client email (optional); Item description; Add scope of work (optional); Add exclusions (optional); Add a note (optional).

Action/navigation references: `tools.quote.render`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/Receipt.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/Receipt.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/receipt-generator` — `tools.receipt`

Literal interface text: Free Receipt Generator — POS & Thermal PDF | VenQore; Your store name; Store address; Phone number; optional; Product name; Thank you for shopping with us!.

Action/navigation references: `tools.receipt.render`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/SkuGenerator.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/SkuGenerator.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/sku-generator` — `tools.sku-generator`

Literal interface text: Free Bulk SKU Generator | VenQore; Shoes; SH; Black; BLK; SHOE; Product name; Category & variant codes; SKU scheme; Generate in bulk; What makes a good SKU scheme?; SKU vs. barcode vs. UPC.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/SmartCapture.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/SmartCapture.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/smart-capture` — `tools.smart-capture`
- `GET,HEAD /tools/invoice-scanner` — `public.invoice-scanner`

Literal interface text: Smart Capture AI — Extract Invoice & Receipt Data with AI | VenQore; you@company.com; Your business name; Business address; email@business.com; Phone number; optional; Client name; Client address; Client email (optional); Item description; Add a note (optional); e.g. Net 14; AI Scanning Document…; Unlock Your Scan Results; ↺ Scan Another; Why use Smart Capture inside VenQore ERP?; Standalone (This Tool); VenQore ERP Integrated; Need more than 5 pages a month?.

Action/navigation references: `tools.invoice.render`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/StockCountSheet.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/StockCountSheet.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /tools/stock-count-sheet` — `tools.stock-count`

Literal interface text: Free Stock Count Sheet Generator — Printable PDF | VenQore; Store / business name; e.g. Aisle 4 - Dry Goods; Auditor name; SKU-100; Product name; Uncategorized; pcs; Add a note for the audit team (optional); Bulk paste items; Import Items.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/Shared/EditableText.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/Shared/EditableText.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/Shared/EmailGate.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/Shared/EmailGate.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Close; you@company.com; Your name; Check your email.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/Shared/HousePromo.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/Shared/HousePromo.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: About VenQore; You just built one document. VenQore builds the system that issues them..

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/Shared/Select.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/Shared/Select.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/Shared/SmartCaptureNudge.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/Shared/SmartCaptureNudge.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/Shared/ToolShell.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/Shared/ToolShell.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Dismiss; Frequently asked questions; Related tools.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Marketing/Tools/Shared/ToolsSidebar.jsx

Explain the product, business fit, commercial offer or public resources.

Source: `app-code/main-app/resources/js/Pages/Marketing/Tools/Shared/ToolsSidebar.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Coming soon; Free tools.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Next/Dashboard.jsx

Support the shared application or the workflow named by this source page; determine exact entry and active status before demonstrating it.

Source: `app-code/main-app/resources/js/Pages/Next/Dashboard.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /next-dashboard` — `public.next-dashboard`
- `GET,HEAD /s/{store_slug}/next-dashboard` — `store.next-dashboard`

Literal interface text: Overview — VenQore OS; Add Card / Customise; To receive; To pay; Stock value; Net profit; Recent activity; 0.00; e.g. Daily cash deposit / Petty expense; Save Transaction; Add a card.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Notifications/NotificationCenter.jsx

Review messages or events directed to the user.

Source: `app-code/main-app/resources/js/Pages/Notifications/NotificationCenter.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/notifications` — `store.notifications.index`

Literal interface text: Notifications; Delete; All caught up!.

Action/navigation references: `store.notifications.mark-all-read`, `store.notifications.mark-read`, `store.notifications.destroy`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Onboarding/Wizard.jsx

Complete business setup and learn the initial workflow.

Source: `app-code/main-app/resources/js/Pages/Onboarding/Wizard.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/onboarding/v2` — `store.onboarding.v2`

Literal interface text: Set up your workspace; Describe your business; Start from a template; We…; Building your workspace; What does your business do?; Closest to what you do?; Setting things up.

Action/navigation references: `store.onboarding.v2.ai-discovery`, `store.onboarding.v2.apply-preset`, `store.onboarding.v2.complete`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Onboarding/Components/HistoryUnlockedModal.jsx

Complete business setup and learn the initial workflow.

Source: `app-code/main-app/resources/js/Pages/Onboarding/Components/HistoryUnlockedModal.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## OnlineStore/Deliveries.jsx

Manage public-store settings, goods, promotions and incoming orders.

Source: `app-code/main-app/resources/js/Pages/OnlineStore/Deliveries.jsx`. Module declaration: marketplace_sync, online_store.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/online-store/deliveries` — `store.commerce.deliveries`

Literal interface text: Customer can call this number; e.g. Red Honda 125 · LEB-1234; Online Store; Deliveries; Riders; No deliveries waiting; Choose rider; Change rider.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## OnlineStore/Home.jsx

Manage public-store settings, goods, promotions and incoming orders.

Source: `app-code/main-app/resources/js/Pages/OnlineStore/Home.jsx`. Module declaration: marketplace_sync, online_store.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/online-store` — `store.commerce.home`

Literal interface text: Online Store; Waiting; In progress; Completed; Live items; No orders yet; Share your store; Grow sales; Latest orders.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## OnlineStore/OnlineStore.jsx

Manage public-store settings, goods, promotions and incoming orders.

Source: `app-code/main-app/resources/js/Pages/OnlineStore/OnlineStore.jsx`. Module declaration: marketplace_sync.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Online Store; Online Store Management; Toggle store status; Store Settings; Configure; My Public Store; More Features Coming Soon.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## OnlineStore/OrderShow.jsx

Manage public-store settings, goods, promotions and incoming orders.

Source: `app-code/main-app/resources/js/Pages/OnlineStore/OrderShow.jsx`. Module declaration: marketplace_sync.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/online-store/orders/{id}` — `store.commerce.orders.show`

Literal interface text: Order progress; Online Store; Items; Next step; Reason (to decline); Decline reason; New quantity; Substitute item; Note to the customer (optional); Note to the customer; Reason to cancel; Cancel reason; Payment; History; Close modal; Receipt PDF; Enter customer name; Enter phone number; Customer address; Type name or phone number...; Payment Screenshot Proof.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## OnlineStore/Orders.jsx

Manage public-store settings, goods, promotions and incoming orders.

Source: `app-code/main-app/resources/js/Pages/OnlineStore/Orders.jsx`. Module declaration: marketplace_sync.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/online-store/orders` — `store.commerce.orders`

Literal interface text: Online Store; Online orders; All orders; Order status; Search orders, phone, ref…; Clear search.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## OnlineStore/Products.jsx

Manage public-store settings, goods, promotions and incoming orders.

Source: `app-code/main-app/resources/js/Pages/OnlineStore/Products.jsx`. Module declaration: marketplace_sync, onsite_catalogue.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/online-store/products` — `store.commerce.products`

Literal interface text: Products page settings; Settings; Online Store; Online products; All products; Products; Products settings; Close; Select all products on page; Featured in your store catalogue; Made to order: always available; Below cost. Approve in Edit or raise price.; Edit; e.g. 5; Upload online photo; No limit; Allergen note, e.g. made with sesame; e.g. Cotton T-shirt; e.g. Large / Red; Leave empty to use store default; I approve selling this product online below cost; Keep selling online even when out of stock (I will source it for the customer); Reserve Offline Stock.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## OnlineStore/Promotions.jsx

Manage public-store settings, goods, promotions and incoming orders.

Source: `app-code/main-app/resources/js/Pages/OnlineStore/Promotions.jsx`. Module declaration: marketplace_sync.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/online-store/promotions` — `store.commerce.promotions`

Literal interface text: Online Store; Offers and coupons; No offers yet; Edit; Delete; Offer; Name customers see; Type; Percent off; Coupon code (optional); Applies to; Category; Ends; Minimum order (0 = none); Max uses (optional).

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## OnlineStore/Settings.jsx

Manage public-store settings, goods, promotions and incoming orders.

Source: `app-code/main-app/resources/js/Pages/OnlineStore/Settings.jsx`. Module declaration: marketplace_sync.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/online-store/settings` — `store.commerce.settings`

Literal interface text: Pick a custom colour; Online Store; Online Store Settings; Public profile; Business name shown to customers; Store link; Short description; Logo; Banner; Announcement (shown above your catalogue); Catalogue style; Customer experience; Primary colour; Secondary colour (optional); What kind of business is this?; Location & contact; Country; Select country…; City; Select city…; Address; Map link (optional); https://maps.google.com/…; Shop latitude; 31.5204; Shop longitude; 74.3587; Phone; Email (optional); Payment & orders; Bank transfer instructions; Fulfilment warehouse; Select warehouse…; Minutes to accept an order before it expires; Pickup & delivery; Flat delivery charge; Minimum order (0 = none); Usual preparation time in minutes (optional); Area name; Fee; Min order; Minimum order; Delivery instructions shown to customers; e.g. We deliver within 5 km; Online pricing; Default online price; Percentage; Opening hours; Select timezone…; Opens at…; Closes at…; Break starts…; Break ends….

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## OnsiteCatalogue/Setup.jsx

Configure browsing or supported QR ordering at the business.

Source: `app-code/main-app/resources/js/Pages/OnsiteCatalogue/Setup.jsx`. Module declaration: onsite_catalogue.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/online-store/catalogue` — `store.commerce.catalogue`

Literal interface text: Online Store; QR Menu & Catalogue; Availability; Enable onsite catalogue; Local server address; http://192.168.1.100:8000; Pause QR ordering; Only when staff have seated the table; Close outside opening hours; Catalogue identity; Catalogue name; Tagline; Fresh food, ordered from your table; Logo; Cover image; Menu template; Second menu language (optional); Show product photographs; QR code; Onsite Catalogue.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Parties/Ledger.jsx

Maintain trading relationships and inspect balances.

Source: `app-code/main-app/resources/js/Pages/Parties/Ledger.jsx`. Module declaration: khata_credit.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/parties/{party}/ledger` — `store.parties.ledger`

Literal interface text: All Types; Export; Print; Share Statement on WhatsApp.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Parties/PartiesList.jsx

Maintain trading relationships and inspect balances.

Source: `app-code/main-app/resources/js/Pages/Parties/PartiesList.jsx`. Module declaration: customers.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/parties` — `store.parties.index`
- `GET,HEAD /s/{store_slug}/parties/ledgers` — `store.parties.ledgers`

Literal interface text: Contacts; All types; Export; Print; View Ledger; Edit; Delete; Party Name; Enter party name; Type; Category; e.g. Retailer, Wholesaler; Sub-Category; e.g. Area A, Area B; Phone; e.g., 0300-1234567; Email; email@example.com; Opening Balance; Balance Type; Credit Limit; No limit; Payment Terms; e.g., Net 30; Address; Enter full address; Notes; Additional notes about this party; Passcode Required; Enter Passcode; Enter PIN.

Action/navigation references: `store.parties.ledger`, `store.parties.destroy`, `store.parties.bulk-destroy`, `store.parties.update`, `store.parties.store`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Payments/In.jsx

Record and inspect incoming or outgoing settlements.

Source: `app-code/main-app/resources/js/Pages/Payments/In.jsx`. Module declaration: payments.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/payments/in` — `store.payments.in`

Literal interface text: Click or type name / phone...; e.g. 100452; e.g. HBL, Meezan; Cheque / TxID; Notes....

Action/navigation references: `store.parties.search`, `store.approvals.show`, `store.payments.store`, `store.payments.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Payments/Out.jsx

Record and inspect incoming or outgoing settlements.

Source: `app-code/main-app/resources/js/Pages/Payments/Out.jsx`. Module declaration: payments.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/payments/out` — `store.payments.out`

Literal interface text: Click or type name / phone...; Cheque / TxID; Notes....

Action/navigation references: `store.parties.search`, `store.approvals.show`, `store.payments.store`, `store.payments.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Payments/PaymentsList.jsx

Record and inspect incoming or outgoing settlements.

Source: `app-code/main-app/resources/js/Pages/Payments/PaymentsList.jsx`. Module declaration: payments.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/payments` — `store.payments.index`

Literal interface text: Date; Party / Contact; Amount; Payments; Payments — In & Out.

Action/navigation references: `store.payments.in`, `store.payments.out`, `store.payments.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Payments/Show.jsx

Record and inspect incoming or outgoing settlements.

Source: `app-code/main-app/resources/js/Pages/Payments/Show.jsx`. Module declaration: payments.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/payments/{payment}` — `store.payments.show`

Action/navigation references: `store.sales.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Platform/Overview.jsx

Operate platform-wide controls with privileged access.

Source: `app-code/main-app/resources/js/Pages/Platform/Overview.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Real paid subscriptions only — excludes internal & demo stores.; Total Stores; Platform Users; New This Month; Suspended; No active plans yet; Create a Plan; New Coupon; Manage Stores; Run Health Check; No recent activity; No trials expiring; Platform Overview.

Action/navigation references: `platform.dashboard`, `platform.plans.index`, `platform.coupons.index`, `platform.stores`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Platform/Views.jsx

Operate platform-wide controls with privileged access.

Source: `app-code/main-app/resources/js/Pages/Platform/Views.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Revenue & Dividends; MRR; ARR; Net Revenue; Paid Subscribers; No paid subscriptions yet; No partners registered; Delete partner; Full Name; Role; e.g. VP Marketing; Equity Share (%); Equity Share Percentage; Select Partner; Draw Amount (PKR); Draw Amount; Description; e.g. Q1 Dividend; Merchant GMV; Total GMV; Active Stores; Avg per Store; Testing Center; Support Inbox; Send Response; Write your response to the customer...; Impersonation; PK Verifications; Pending Review; Approved; Rejected; Rejection Reason; e.g. Blurry front card image; Platform Settings; USD → PKR Exchange Rate; Gateway Fee Rate (%); Default Grace Period (Days); VenSynQ Multichannel Sync; SmartCapture AI Scan; Public Signups; AppSumo codes module; Maintenance Mode; Gemini free-tier key; Free model (optional); gemini-2.5-flash-lite; Use the paid key when no free key is set; Active paid provider; Paid model (optional); e.g. claude-sonnet-4-5; Gemini paid key; Anthropic (Claude) key; OpenAI key; DeepSeek key; Jobs & Queues; Pending Jobs; Failed Jobs; Workers; No failed jobs; Storage; Storage Usage & Cleanup; See uploads, backups and demo snapshots per tenant and platform-wide, with reclaim actions for orphaned files.; Total Used; Uploads; Backups; Feature Flags; Feature Flag Hub; The per-store feature-flag route exists; this gives it a real management hub to flip capabilities per tenant or globally.; AppSumo / LTD Codes; AppSumo Lifetime Deals; Total Codes; Redeemed; Available; Clear History; Reject Verification Request.

Action/navigation references: `platform.dashboard`, `platform.partners.store`, `platform.partners.destroy`, `platform.drawings.store`, `platform.drawings.clear-history`, `platform.ticket.show`, `platform.ticket.reply`, `platform.pk-verifications.approve`, `platform.pk-verifications.reject`, `platform.pk-verifications.download`, `platform.settings.save`, `platform.vensynq.toggle`, `platform.jobs.metrics`, `platform.jobs.flush-failed`, `platform.jobs.retry`, `platform.jobs.delete-failed`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Platform/BlogPosts/Index.jsx

Operate platform-wide controls with privileged access.

Source: `app-code/main-app/resources/js/Pages/Platform/BlogPosts/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore/blog-posts` — `platform.blog-posts.index`

Literal interface text: SuperAdmin — Blog Engine; auto-generated from title; Edit; Delete.

Action/navigation references: `platform.blog-posts.update`, `platform.blog-posts.store`, `platform.blog-posts.destroy`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## PlatformOwner/Login.jsx

Operate owner-only platform tools.

Source: `app-code/main-app/resources/js/Pages/PlatformOwner/Login.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore-login` — `platform.login`
- `GET,HEAD /venqore-login` — `None`

Literal interface text: VenQore — Secure Access; Email Address; your@email.com; Password; ••••••••••••; Enter your PIN; Delete last digit; Sign in.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Profile/Edit.jsx

Maintain the signed-in person’s details, access and preferences.

Source: `app-code/main-app/resources/js/Pages/Profile/Edit.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /account` — `account.edit`
- `GET,HEAD /s/{store_slug}/profile` — `store.profile.edit`

Literal interface text: Profile Settings; Your name; your@email.com; ••••••; Enter your password; Profile Information; Are you sure?.

Action/navigation references: `store.profile.update`, `account.update`, `password.update`, `store.profile.passcode`, `account.passcode`, `store.profile.security-pin`, `account.security-pin`, `store.profile.destroy`, `account.destroy`, `store.settings.update`, `store.home`, `verification.send`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Proposals/Create.jsx

Prepare and follow a business proposal.

Source: `app-code/main-app/resources/js/Pages/Proposals/Create.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/proposals/create` — `store.proposals.create`
- `GET,HEAD /s/{store_slug}/proposals/{proposal}/edit` — `store.proposals.edit`

Literal interface text: Quotation no.; Auto; Date; Valid until; Stage; Payment terms; Note on the quotation; Anything the customer should read with the prices; Sell it now — stock leaves the shelf; Take it as an order — stock is reserved, not sold; Saved quotation.

Action/navigation references: `store.proposals.update`, `store.proposals.store`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Proposals/ProposalsList.jsx

Prepare and follow a business proposal.

Source: `app-code/main-app/resources/js/Pages/Proposals/ProposalsList.jsx`. Module declaration: b2b_proposals.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/proposals` — `store.proposals.index`

Literal interface text: Proposals; Status; Search...; Export; Print.

Action/navigation references: `store.proposals.show`, `store.proposals.index`, `store.proposals.convert`, `store.proposals.destroy`, `store.proposals.create`, `store.proposals.print`, `store.service-jobs.create`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Proposals/Show.jsx

Prepare and follow a business proposal.

Source: `app-code/main-app/resources/js/Pages/Proposals/Show.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/proposals/{proposal}` — `store.proposals.show`

Literal interface text: VENQORE; PROPOSAL; Prepared For; Proposal Details; Notes.

Action/navigation references: `store.proposals.print`, `store.proposals.convert-to-sale`, `store.proposals.convert-to-presale`, `store.proposals.index`, `store.service-jobs.create`, `store.proposals.edit`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## PurchaseOrders/Create.jsx

Manage intended purchases and receiving.

Source: `app-code/main-app/resources/js/Pages/PurchaseOrders/Create.jsx`. Module declaration: purchase_orders.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/purchase-orders/create` — `store.purchase-orders.create`
- `GET,HEAD /s/{store_slug}/purchase-orders/{purchase_order}/edit` — `store.purchase-orders.edit`

Literal interface text: Goods; Advance; Money comes from; Order no.; Auto; Order date; Expected on; Payment terms; Goods land in; Costs include tax; Note on the order; Delivery window, gate instructions, packing requirements…; Print this order; Set Goods to.

Action/navigation references: `store.purchase-orders.update`, `store.purchase-orders.store`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## PurchaseOrders/PurchaseOrdersList.jsx

Manage intended purchases and receiving.

Source: `app-code/main-app/resources/js/Pages/PurchaseOrders/PurchaseOrdersList.jsx`. Module declaration: purchase_orders.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/purchase-orders` — `store.purchase-orders.index`

Literal interface text: Pre-Purchases; All statuses; Export; Print; Edit; View.

Action/navigation references: `store.purchase-orders.show`, `store.purchase-orders.index`, `store.purchase-orders.create`, `store.purchase-orders.edit`, `store.purchase-orders.receive`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## PurchaseOrders/Show.jsx

Manage intended purchases and receiving.

Source: `app-code/main-app/resources/js/Pages/PurchaseOrders/Show.jsx`. Module declaration: purchase_orders.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/purchase-orders/{purchase_order}` — `store.purchase-orders.show`
- `GET,HEAD /s/{store_slug}/purchase-orders/{purchaseOrder}/print` — `store.purchase-orders.print`

Action/navigation references: `store.purchase-orders.receive`, `store.purchase-orders.index`, `store.purchase-orders.edit`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Purchases/PurchasesList.jsx

Record and inspect supplier buying.

Source: `app-code/main-app/resources/js/Pages/Purchases/PurchasesList.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/purchases` — `store.purchases.index`
- `GET,HEAD /s/{store_slug}/v3/purchases` — `store.v3.purchases.index`

Literal interface text: Purchases History; Purchases; All dates; Export; Print; Approve JIT Auto-Draft; Delete Purchase.

Action/navigation references: `store.purchases.index`, `store.purchases.edit`, `store.purchases.destroy`, `store.purchases.create`, `store.vensynq.jit.approve`, `store.purchases.show`, `store.purchases.receive`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## RecurringInvoices/Create.jsx

Configure and inspect repeat billing.

Source: `app-code/main-app/resources/js/Pages/RecurringInvoices/Create.jsx`. Module declaration: recurring_invoices.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/recurring-invoices/create` — `store.recurring-invoices.create`

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## RecurringInvoices/Edit.jsx

Configure and inspect repeat billing.

Source: `app-code/main-app/resources/js/Pages/RecurringInvoices/Edit.jsx`. Module declaration: recurring_invoices.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/recurring-invoices/{id}/edit` — `store.recurring-invoices.edit`

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## RecurringInvoices/RecurringForm.jsx

Configure and inspect repeat billing.

Source: `app-code/main-app/resources/js/Pages/RecurringInvoices/RecurringForm.jsx`. Module declaration: recurring_invoices.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Template name; Repeats; Next one on; Status; Stock comes from; Payment terms; Note that prints on every invoice.

Action/navigation references: `store.recurring-invoices.update`, `store.recurring-invoices.store`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## RecurringInvoices/RecurringInvoices.jsx

Configure and inspect repeat billing.

Source: `app-code/main-app/resources/js/Pages/RecurringInvoices/RecurringInvoices.jsx`. Module declaration: recurring_invoices.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/recurring-invoices` — `store.recurring-invoices.index`

Literal interface text: Recurring Invoices; Status; Print; Filter; Search; New Recurring.

Action/navigation references: `store.recurring-invoices.toggle`, `store.recurring-invoices.destroy`, `store.recurring-invoices.create`, `store.recurring-invoices.edit`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reminders/Create.jsx

Configure or inspect supported follow-up reminders.

Source: `app-code/main-app/resources/js/Pages/Reminders/Create.jsx`. Module declaration: recurring_invoices.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/invoice-reminders/create` — `store.invoice-reminders.create`

Literal interface text: Schedule Reminder; Schedule Payment Reminder.

Action/navigation references: `store.invoice-reminders.store`, `store.invoice-reminders.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reminders/InvoiceReminders.jsx

Configure or inspect supported follow-up reminders.

Source: `app-code/main-app/resources/js/Pages/Reminders/InvoiceReminders.jsx`. Module declaration: recurring_invoices.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/invoice-reminders` — `store.invoice-reminders.index`

Literal interface text: Invoice Reminders; Status; Print; Filter; Search; New Reminder; Mark Sent Manually (Staff self-report); Dismiss Reminder; Mark Sent Manually; Dismiss.

Action/navigation references: `store.invoice-reminders.index`, `store.invoice-reminders.send`, `store.invoice-reminders.mark-sent-manually`, `store.invoice-reminders.dismiss`, `store.invoice-reminders.create`, `store.sales.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/AccountLedger.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/AccountLedger.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/account-ledger` — `store.reports.account-ledger`

Literal interface text: Account; Running balance; Balance; Ledger entries; Select an account.

Action/navigation references: `store.reports.account-ledger`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/AllParties.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/AllParties.jsx`. Module declaration: reports.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: All Parties Report; Customers vs suppliers; Largest balances; Parties.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/BankStatement.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/BankStatement.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/bank-statement` — `store.reports.bank-statement`

Literal interface text: Bank account; Bank Statement; Deposits vs withdrawals; Transactions.

Action/navigation references: `store.reports.bank-statement`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/BillWiseProfit.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/BillWiseProfit.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/bill-wise-profit` — `store.reports.bill-wise-profit`

Literal interface text: Search invoice #...; Profit by Bill; Margin distribution; Most profitable bills; Least profitable bills; Invoices; Apply.

Action/navigation references: `store.reports.bill-wise-profit`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/CashFlow.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/CashFlow.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/cash-flow` — `store.reports.cash-flow`

Literal interface text: Cash Flow Statement; Cash in vs cash out; Totals; Summary breakdown.

Action/navigation references: `store.reports.cash-flow`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/CategoryProfitability.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/CategoryProfitability.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/item-category-wise-profit-loss` — `store.reports.item-category-wise-profit-loss`

Literal interface text: Category Profitability; Profit by category; Revenue vs profit; Profit contribution; Margin distribution; Categories; Category breakdown; Search categories...; Profit & Loss statement; Apply; Category Intelligence.

Action/navigation references: `store.reports.item-category-wise-profit-loss`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/CustomerInsights.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/CustomerInsights.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/customer-insights` — `store.reports.customer-insights`

Literal interface text: Period; Revenue by favourite category; Cohort intelligence; Invoice Purchase History.

Action/navigation references: `store.reports.customer-insights`, `store.reports.customer-insights.details`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/DayBook.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/DayBook.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/day-book` — `store.reports.day-book`

Literal interface text: Search transactions...; From date; To date; Day Book; Inflow vs outflow; Transaction volume; Growth Engine; Transaction log; Go.

Action/navigation references: `store.reports.day-book`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/DiscountReport.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/DiscountReport.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/discount` — `store.reports.discount`

Literal interface text: Discount Report; Discounts Given; Discount; Discount Range; Discount Details.

Action/navigation references: `store.reports.discount-report`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/ExpenseByCategory.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/ExpenseByCategory.jsx`. Module declaration: reports.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Expense by Category; Share by category; Category breakdown; Categories.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/ExpenseByItem.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/ExpenseByItem.jsx`. Module declaration: reports.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Expense by Item; Share by category; Largest expenses; Expenses.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/Expenses.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/Expenses.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/expenses` — `store.reports.expenses`

Literal interface text: Search expenses...; Expense Report; Spend trend; Category breakdown; Top categories; Insights; Expense history.

Action/navigation references: `store.reports.expenses`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/ExpiryReport.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/ExpiryReport.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/expiry` — `store.reports.expiry`

Literal interface text: Expiry Report; Expires within; Expiry timeline; Units; Expiring first; Batches.

Action/navigation references: `store.reports.expiry`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/GenericReport.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/GenericReport.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/daily-sales` — `store.reports.daily-sales`
- `GET,HEAD /s/{store_slug}/reports/all-parties` — `store.reports.all-parties`
- `GET,HEAD /s/{store_slug}/reports/party-wise-profit-loss` — `store.reports.party-wise-profit-loss`
- `GET,HEAD /s/{store_slug}/reports/expense-by-category` — `store.reports.expense-by-category`
- `GET,HEAD /s/{store_slug}/reports/expense-by-item` — `store.reports.expense-by-item`
- `GET,HEAD /s/{store_slug}/reports/stock-summary-by-category` — `store.reports.stock-summary-by-category`
- `GET,HEAD /s/{store_slug}/reports/tax-rate` — `store.reports.tax-rate`
- `GET,HEAD /s/{store_slug}/reports/sale-purchase-by-party` — `store.reports.sale-purchase-by-party`
- `GET,HEAD /s/{store_slug}/reports/sale-purchase-by-item-category` — `store.reports.sale-purchase-by-item-category`
- `GET,HEAD /s/{store_slug}/reports/item-wise-discount` — `store.reports.item-wise-discount`
- `GET,HEAD /s/{store_slug}/reports/stock-aging` — `store.reports.stock-aging`
- `GET,HEAD /s/{store_slug}/reports/sale-purchase-by-party-group` — `store.reports.sale-purchase-by-party-group`

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/GraphAnalytics.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/GraphAnalytics.jsx`. Module declaration: reports.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Revenue Trend; Revenue; Payment Recovery; Transactions; Revenue by Day of Week; Period Breakdown; Apply.

Action/navigation references: `store.reports.analytics`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/ItemCategoryWiseProfitLoss.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/ItemCategoryWiseProfitLoss.jsx`. Module declaration: reports.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Category-wise Profit & Loss; Revenue, cost and profit; Most profitable categories; Categories.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/ItemDetail.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/ItemDetail.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/item-detail` — `store.reports.item-detail`

Literal interface text: Item Detail Report; Stock value by category.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/ItemReportByParty.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/ItemReportByParty.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/item-report-by-party` — `store.reports.item-report-by-party`

Literal interface text: Net revenue by customer; Details.

Action/navigation references: `store.reports.item-report-by-party`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/ItemWiseDiscount.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/ItemWiseDiscount.jsx`. Module declaration: reports.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Item-wise Discount Report.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/ItemWiseProfit.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/ItemWiseProfit.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/item-wise-profit` — `store.reports.item-wise-profit`

Literal interface text: Profit by Item; Top items by profit; Bottom items by profit; Margin distribution; Items; Profit contribution; Item breakdown; Search items...; Profit & Loss statement; Apply; Catalog Intelligence.

Action/navigation references: `store.reports.item-wise-profit`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/LoanStatement.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/LoanStatement.jsx`. Module declaration: reports.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Loan Statement; Loans.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/LowStock.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/LowStock.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/low-stock` — `store.reports.low-stock`

Literal interface text: Low Stock Report; Category; Warehouse; Severity; Most depleted; Products to reorder.

Action/navigation references: `store.reports.low-stock`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/MovementHistory.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/MovementHistory.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/movement-history` — `store.reports.movement-history`

Literal interface text: Stock Movement; Warehouse; Type; Inbound vs outbound; By movement type; Movements.

Action/navigation references: `store.reports.movement-history`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/OwnersDailyPulse.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/OwnersDailyPulse.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/owner-daily-pulse` — `store.reports.owner-daily-pulse`
- `GET,HEAD /s/{store_slug}/reports/owner-daily-pulse` — `store.reports.owner-daily-pulse`
- `GET,HEAD /s/{store_slug}/reports/owner-daily-pulse` — `store.reports.owner-daily-pulse`

Literal interface text: Secure Vault Locked; Configure Vault Security; ••••••••; Secure Vault Lock; Secure Vault Authorization; Write daily notes, events, exceptions...; Owner; Select Date; Force Refresh Data; 30-Day Financial Trends; Asset Mix; Figures Ranked; Highlights; Historical Pulse Logs; Vault Unconfigured; Vault Security Setup; Enter New Passcode; Confirm Passcode; No Financial Snapshots Yet.

Action/navigation references: `store.reports.owner-daily-pulse.verify`, `store.reports.owner-daily-pulse.setup`, `store.reports.owner-daily-pulse.lock`, `store.reports.owner-daily-pulse.note`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/PartyReportByItem.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/PartyReportByItem.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/party-report-by-item` — `store.reports.party-report-by-item`

Literal interface text: Net revenue by product; Details.

Action/navigation references: `store.reports.party-report-by-item`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/PartyStatement.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/PartyStatement.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/party-statement` — `store.reports.party-statement`

Literal interface text: Party; Balance over time; Balance; Statement; Select a party.

Action/navigation references: `store.reports.party-statement`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/PartyWiseProfitLoss.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/PartyWiseProfitLoss.jsx`. Module declaration: reports.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Party-wise Profit & Loss; Most profitable parties; Sales share by party; Parties.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/PointInTimeInventory.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/PointInTimeInventory.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/point-in-time-inventory` — `store.reports.point-in-time-inventory`

Literal interface text: Point-In-Time Inventory; As of date; As of time; Stock; Search snapshot...; Value by category; Top value items; Stock intelligence; Inventory snapshot; Close; Reconstruct.

Action/navigation references: `store.reports.point-in-time-inventory.details`, `store.reports.point-in-time-inventory`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/ProfitLoss.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/ProfitLoss.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/profit-loss` — `store.reports.profit-loss`

Literal interface text: Profit & Loss; Income vs costs; Amount; Revenue distribution; Income statement; Apply; Analysis Report.

Action/navigation references: `store.reports.profit-loss`, `store.reports.account-ledger`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/PurchaseReturns.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/PurchaseReturns.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/purchase-returns` — `store.reports.purchase-returns`

Literal interface text: Period; Purchase Returns Report; Returns trend; By status; Purchase returns.

Action/navigation references: `store.reports.purchase-returns`, `store.debit-notes.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/Purchases.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/Purchases.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/purchases` — `store.reports.purchases`

Literal interface text: Purchases Report; Spend trend; Payment status; Insights; Recent transactions.

Action/navigation references: `store.reports.purchases`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/RefundReasons.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/RefundReasons.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/refund-reasons` — `store.reports.refund-reasons`

Literal interface text: Refund Reasons; Refunded by reason; Top reasons; All reasons; Refund Reasons Report.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/ReportsHub.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/ReportsHub.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports` — `store.reports.index`

Literal interface text: Search reports; Category; Reports.

Action/navigation references: `store.billing`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/SaleAging.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/SaleAging.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/sale-aging` — `store.reports.sale-aging`

Literal interface text: Search Debtor...; Receivables Aging; Aging Buckets; Outstanding; Aging Breakdown; Top Debtors; Aging Details.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/SaleOrderItems.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/SaleOrderItems.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/sale-order-items` — `store.reports.sale-order-items`

Literal interface text: Item Revenue Trend; Item revenue; Top Revenue Generators; Most Ordered Items; Top Items by Revenue; Item Details.

Action/navigation references: `store.reports.sale-order-items`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/SaleOrders.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/SaleOrders.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/sale-orders` — `store.reports.sale-orders`

Literal interface text: Sales Orders Report; Order Value Trend; Order value; Daily Volume; Orders.

Action/navigation references: `store.reports.sale-orders`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/SalePurchaseByItemCategory.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/SalePurchaseByItemCategory.jsx`. Module declaration: reports.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Sale & Purchase by Category; Sales vs purchases; Top categories by sales; Categories.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/SalePurchaseByParty.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/SalePurchaseByParty.jsx`. Module declaration: reports.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Sale & Purchase by Party; Sales vs purchases; Top parties by sales; Parties.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/SalePurchaseByPartyGroup.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/SalePurchaseByPartyGroup.jsx`. Module declaration: reports.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Sale & Purchase by Party Group; Sales vs purchases; Sales share by group; Party groups.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/Sales.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/Sales.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/sales` — `store.reports.sales`

Literal interface text: Sales Report; Revenue Trend; Net sales; Collected vs Outstanding; Sales by Day of Week; Sales; Recent Transactions; Sales Intelligence.

Action/navigation references: `store.reports.sales`, `store.sales.edit`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/StockAging.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/StockAging.jsx`. Module declaration: reports.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Stock Aging; Age group; Value by age; Stock value; Age mix; Batches.

Action/navigation references: `store.reports.stock-aging`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/StockSummaryByCategory.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/StockSummaryByCategory.jsx`. Module declaration: reports.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Stock Summary by Category; Value share by category; Top categories by value; Categories.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/StockValuation.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/StockValuation.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/stock-valuation` — `store.reports.stock-valuation`

Literal interface text: Stock Valuation; Category; Warehouse; Value by category; Top value items; Valuation detail.

Action/navigation references: `store.reports.stock-valuation`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/SupplierInsights.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/SupplierInsights.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/supplier-insights` — `store.reports.supplier-insights`

Literal interface text: Period; Peak pricing variances; Sourcing risk audit; Sourcing price variance matrix; Sourcing Purchase History; Other Sourced Catalog.

Action/navigation references: `store.reports.supplier-insights`, `store.reports.supplier-insights.details`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/Tax.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/Tax.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/tax` — `store.reports.tax`

Literal interface text: Tax Report; Output vs input tax; Tax split; Tax records.

Action/navigation references: `store.reports.tax`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/TaxRateReport.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/TaxRateReport.jsx`. Module declaration: reports.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Tax Rate Report; Share of tax by rate; Tax collected by rate; Tax rates.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/Transactions.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/Transactions.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/transactions` — `store.reports.transactions`

Literal interface text: All Transactions; In vs out; By type; Transactions.

Action/navigation references: `store.reports.transactions`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/TrialBalance.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/TrialBalance.jsx`. Module declaration: reports.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/reports/trial-balance` — `store.reports.trial-balance`

Literal interface text: Trial Balance; Debit vs credit by account type; Biggest accounts; Accounts.

Action/navigation references: `store.reports.trial-balance`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Reports/Components/ReportPage.jsx

Answer a business question using a filtered view; verify definitions and source totals.

Source: `app-code/main-app/resources/js/Pages/Reports/Components/ReportPage.jsx`. Module declaration: reports.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Restaurant/CustomerQueue.jsx

Coordinate restaurant preparation and fulfilment.

Source: `app-code/main-app/resources/js/Pages/Restaurant/CustomerQueue.jsx`. Module declaration: table_service.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/restaurant/queue` — `store.restaurant.queue`

Literal interface text: Order TV Screen — Disabled; Go back to previous page or Restaurant Settings; Order TV Screen Is Currently Disabled; Turn this setting on to activate the live order status queue and show preparing/ready pickup numbers to customers.; Toggle TV Fullscreen (F11); Order TV Screen; Preparing.

Action/navigation references: `store.restaurant.queue.state`, `store.restaurant.settings`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Restaurant/Dashboard.jsx

Coordinate restaurant preparation and fulfilment.

Source: `app-code/main-app/resources/js/Pages/Restaurant/Dashboard.jsx`. Module declaration: table_service.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/restaurant/dashboard` — `store.restaurant.dashboard`

Literal interface text: Restaurant Floor & Tables; Restaurant Floor Management.

Action/navigation references: `store.restaurant.kitchen`, `store.restaurant.queue`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Restaurant/Dispatch.jsx

Coordinate restaurant preparation and fulfilment.

Source: `app-code/main-app/resources/js/Pages/Restaurant/Dispatch.jsx`. Module declaration: table_service.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/restaurant/dispatch` — `store.restaurant.dispatch`

Literal interface text: Copy tracking link; Move back a step; Delivery Dispatch — Disabled; Go back to previous page or Restaurant Settings; Delivery Orders Are Currently Disabled; Delivery Dispatch.

Action/navigation references: `store.restaurant.settings`, `store.restaurant.riders`, `store.tables.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Restaurant/Kitchen.jsx

Coordinate restaurant preparation and fulfilment.

Source: `app-code/main-app/resources/js/Pages/Restaurant/Kitchen.jsx`. Module declaration: table_service.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/restaurant/kitchen` — `store.restaurant.kitchen`

Literal interface text: Reprint Cancellation docket; Acknowledge this cancellation to clear it from the screen; Put this ticket back a step; Reprint KOT docket; Search menu items to 86...; Kitchen Display — Disabled; Go back to previous page or Restaurant Settings; Kitchen Order Preparation is Disabled; Kitchen; Which tickets; Station; Items currently 86; View Kitchen Performance Analytics; Manage 86 list (unavailable items); Mark all active tickets as complete/served; Tickets over ten minutes old; Open Customer Order Status Display on TV or Counter Tablet; Kitchen Performance Analytics; Performance by Station.

Action/navigation references: `store.api.sync.products`, `store.restaurant.reports.kitchen-performance`, `store.restaurant.settings`, `store.restaurant.queue`, `store.pos`, `store.tables.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Restaurant/Riders.jsx

Coordinate restaurant preparation and fulfilment.

Source: `app-code/main-app/resources/js/Pages/Restaurant/Riders.jsx`. Module declaration: table_service.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/restaurant/riders` — `store.restaurant.riders`

Literal interface text: Delivery Riders — Feature Disabled; Delivery Orders & Riders Are Currently Disabled; Delivery Riders — Restaurant; Delivery Riders; All Riders; Click to toggle status; Rider Daily Cash-Up; Edit Rider; Remove Rider; e.g. John Doe, Alex; e.g. +1 555-0199; 0.00; e.g. Red Motorbike #24, Electric Bike; Remove Rider?; Add Delivery Rider; Edit Rider Details.

Action/navigation references: `store.restaurant.riders.store`, `store.restaurant.riders.update`, `store.restaurant.riders.destroy`, `store.restaurant.dispatch`, `store.restaurant.dispatch.rider-cashup`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Restaurant/Settings.jsx

Coordinate restaurant preparation and fulfilment.

Source: `app-code/main-app/resources/js/Pages/Restaurant/Settings.jsx`. Module declaration: table_service.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/restaurant/settings` — `store.restaurant.settings`

Literal interface text: Restaurant Settings — VenQore; Restaurant Settings; Kitchen Display & KOT Routing; Fire orders to the KDS and print kitchen tickets before settlement. Required for kitchen-side preparation.; Kitchen & TV Chime Alerts; Play an audible chime when new orders arrive at the kitchen, and a ding-dong when orders are ready on the TV screen.; Table Floor & Service Mode; Choose how orders are handled. Table mode unlocks visual dining rooms, guest covers, and bill splitting.; Delivery Lane & Dispatch; Allow orders to be dispatched for home delivery, assign riders, and monitor live statuses and rider cash-up.; Takeaway Lane; Allow counter takeaway orders without seating guests. Orders display on the TV pickup queue for self-collection.; House Service Charge; Automatic service percentage added to dine-in guest bills. Set to 0% to disable the service charge for all tables.; Restaurant Operations.

Action/navigation references: `store.restaurant.settings.update`, `store.restaurant.kitchen`, `store.restaurant.queue`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Returns/Create.jsx

Correct a sale or purchase through the supported return process.

Source: `app-code/main-app/resources/js/Pages/Returns/Create.jsx`. Module declaration: sales_returns.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/returns/create` — `store.returns.create`

Literal interface text: Against invoice; Refund; Refund from; Drawn on Bank; Select bank account...; Cheque leaf; Cheque date; Return no.; Auto; Date; Reason; Damaged, wrong size, changed their mind…; Note; Condition the goods came back in, who authorised it…; Which sale is coming back?; Search.

Action/navigation references: `store.api.sales.returnable`, `store.api.sales.returnable.show`, `store.returns.store`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Returns/ReturnsHistory.jsx

Correct a sale or purchase through the supported return process.

Source: `app-code/main-app/resources/js/Pages/Returns/ReturnsHistory.jsx`. Module declaration: sales_returns.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/returns-history` — `store.returns-history.index`

Literal interface text: Returns History; Returns; Period; Print; Filter; Search; New Return; Search returns...; Returned Items.

Action/navigation references: `store.returns-history.index`, `store.returns.create`, `store.sales.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Returns/Show.jsx

Correct a sale or purchase through the supported return process.

Source: `app-code/main-app/resources/js/Pages/Returns/Show.jsx`. Module declaration: sales_returns.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/returns-history/{id}` — `store.returns-history.show`

Literal interface text: Share Return on WhatsApp; Items Returned.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Sales/Analytics.jsx

Find, create or inspect customer sales and their settlement.

Source: `app-code/main-app/resources/js/Pages/Sales/Analytics.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Sales Analytics; Revenue & profit trend; Sales by payment method; Sales by weekday; Sales by hour; Sales by category; Top customers; Daily detail; Revenue Trend (Last 7 Days).

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Sales/CreateInvoice.jsx

Find, create or inspect customer sales and their settlement.

Source: `app-code/main-app/resources/js/Pages/Sales/CreateInvoice.jsx`. Module declaration: invoicing.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/sales/{sale}/edit` — `store.sales.edit`
- `GET,HEAD /s/{store_slug}/sales/invoice/create` — `store.sales.invoice.create`

Literal interface text: Settlement; Stock goes out; Stock leaves the shelf when this invoice is saved; Stock and its cost leave when you dispatch it in Goods Out; Money goes to; Cheque no.; Cheque date; Date; Payment terms; Due date; Note on the invoice; Anything that should print on the customer; What this sale is making; Save and print the customer; Throw this bill away; Sale completed.

Action/navigation references: `store.sales.show`, `store.sales.update`, `store.sales.store`, `store.approvals.show`, `store.sales.index`, `store.onboarding.step`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Sales/CreatePreSale.jsx

Find, create or inspect customer sales and their settlement.

Source: `app-code/main-app/resources/js/Pages/Sales/CreatePreSale.jsx`. Module declaration: pre_sales.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/sales/presale/create` — `store.presales.create`

Literal interface text: New Tab; Toggle Quick Add (Alt+Q); Scanning Mode; Search Party (Name/Phone)...; Change Text Size; Quick Settings; Search item...; INV-000001; XXXXXX; Extra; Sale Completed!; Scan Barcode Now...; Transaction Successful; Add to Invoice; Profit Analysis; Display; Permanent Defaults; Show/Hide Fields; Invoice Logic; Overpayment Detected.

Action/navigation references: `store.api.categories`, `store.api.warehouses`, `store.accounting.accounts.api`, `store.api.bank-accounts`, `store.inventory.store`, `store.inventory.update`, `store.inventory.search`, `store.sales.orders.update`, `store.pre-sales.store`, `store.pre-sales.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Sales/Dashboard.jsx

Find, create or inspect customer sales and their settlement.

Source: `app-code/main-app/resources/js/Pages/Sales/Dashboard.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/sales` — `store.sales.dashboard`

Literal interface text: Sell Command Center; Sales Dashboard; Revenue trend; Sales by payment method; Top selling items; Top customers; Recent transactions; Sales Hub; Revenue Today; Monthly Revenue; Performance Pulse; Top Selling Today; Payment Breakdown; Live Sales Feed.

Action/navigation references: `store.sales.index`, `store.sales.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Sales/MasterSales.jsx

Find, create or inspect customer sales and their settlement.

Source: `app-code/main-app/resources/js/Pages/Sales/MasterSales.jsx`. Module declaration: invoicing.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/sales/master` — `store.sales.master`

Literal interface text: Master Sales Console; Search Client (Alt+C)...; 0.00; SCAN BARCODE...; Search products... (Alt+P); View Full Ledger.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Sales/ParkedSales.jsx

Find, create or inspect customer sales and their settlement.

Source: `app-code/main-app/resources/js/Pages/Sales/ParkedSales.jsx`. Module declaration: park_recall.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/sales/parked-items` — `store.parked-sales.index`

Literal interface text: Parked Sales.

Action/navigation references: `store.pos`, `store.parked-sales.destroy`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Sales/SalesHistory.jsx

Find, create or inspect customer sales and their settlement.

Source: `app-code/main-app/resources/js/Pages/Sales/SalesHistory.jsx`. Module declaration: invoicing.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/sales/list` — `store.sales.index`

Literal interface text: Sales History; Channel; Period; Export; Analytics; Print; Overpaid Amount; Share.

Action/navigation references: `store.sales.index`, `store.sales.bulk-destroy`, `store.sales.edit`, `store.sales.export`, `store.reports.analytics`, `store.sales.invoice.create`, `store.commerce.orders.show`, `store.pos`, `store.sales.show`, `store.sales.goods-out`, `store.sales.challan`, `store.sales.cancel`, `store.sales.destroy`, `store.sales.print`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Sales/Show.jsx

Find, create or inspect customer sales and their settlement.

Source: `app-code/main-app/resources/js/Pages/Sales/Show.jsx`. Module declaration: invoicing.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Share on WhatsApp; Send via Email; Print Invoice; VENQORE; INVOICE; Bill To; Payment Details; Select Items to Return; Where should the refund go?; Refund From.

Action/navigation references: `store.sales.return`, `store.sales.send-email`, `store.sales.send-whatsapp`, `store.sales.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Sales/Customers/CustomersList.jsx

Find, create or inspect customer sales and their settlement.

Source: `app-code/main-app/resources/js/Pages/Sales/Customers/CustomersList.jsx`. Module declaration: customers.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/customers` — `store.customers.index`
- `GET,HEAD /s/{store_slug}/customers/create` — `store.customers.create`

Literal interface text: Label (e.g. Shipping); City; Full Address; Cancel.

Action/navigation references: `store.customers.update`, `store.customers.store`, `store.customers.destroy`, `store.customers.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SalesOrders/CreatePreSale.jsx

Manage customer orders before fulfilment.

Source: `app-code/main-app/resources/js/Pages/SalesOrders/CreatePreSale.jsx`. Module declaration: sales_orders.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/sales-orders/create` — `store.sales-orders.create`
- `GET,HEAD /s/{store_slug}/sales-orders/{order}` — `store.sales-orders.show`
- `GET,HEAD /s/{store_slug}/sales/pre-sales/create` — `store.pre-sales.create`
- `GET,HEAD /s/{store_slug}/sales/orders/{order}` — `store.sales.orders.show`

Literal interface text: Deposit; Money goes to; Auto; Wanted by; Payment terms; Delivery instructions, who to call on arrival….

Action/navigation references: `store.sales.index`, `store.sales.orders.update`, `store.pre-sales.store`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SalesOrders/PreSales.jsx

Manage customer orders before fulfilment.

Source: `app-code/main-app/resources/js/Pages/SalesOrders/PreSales.jsx`. Module declaration: sales_orders, pre_sales.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/sales-orders` — `store.sales-orders.index`
- `GET,HEAD /s/{store_slug}/sales/pre-sales` — `store.pre-sales.index`

Literal interface text: Filter; Search; Overpaid Amount; Conversion Successful.

Action/navigation references: `store.sales.orders.show`, `store.pre-sales.index`, `store.pre-sales.create`, `store.sales.print`, `store.inventory.search`, `store.pre-sales.convert`, `store.service-jobs.create`, `store.sales-orders.cancel`, `store.pre-sales.destroy`, `store.sales-orders.print`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SerialTracking/SerialTracking.jsx

Follow individual goods by serial or IMEI.

Source: `app-code/main-app/resources/js/Pages/SerialTracking/SerialTracking.jsx`. Module declaration: serials.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/serials` — `store.serials.index`

Literal interface text: Serial Tracking; Search serials...; Export; Print.

Action/navigation references: `store.serials.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SerialTracking/Show.jsx

Follow individual goods by serial or IMEI.

Source: `app-code/main-app/resources/js/Pages/SerialTracking/Show.jsx`. Module declaration: serials.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/serials/{id}` — `store.serials.show`

Action/navigation references: `store.sales.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Services/CreateServiceJob.jsx

Follow service requests, appointments, people, tools and billing.

Source: `app-code/main-app/resources/js/Pages/Services/CreateServiceJob.jsx`. Module declaration: services.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/service-jobs/create` — `store.service-jobs.create`

Literal interface text: e.g. Master Bedroom AC Installation & Duct Inspection; Street address for on-site visit....

Action/navigation references: `store.service-jobs.store`, `store.service-jobs.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Services/ServiceCalendar.jsx

Follow service requests, appointments, people, tools and billing.

Source: `app-code/main-app/resources/js/Pages/Services/ServiceCalendar.jsx`. Module declaration: services.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/service-jobs/calendar` — `store.service-jobs.calendar`

Literal interface text: Dispatch Calendar; Services Dispatch Calendar; Book appointment for this tech; e.g. AC Gas Refill & Cleaning; 0.00; e.g. House 44, Block B, DHA Phase 5; Dispatch & Scheduling; Today.

Action/navigation references: `store.service-jobs.quick-book`, `store.service-jobs.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Services/ServiceJobDetail.jsx

Follow service requests, appointments, people, tools and billing.

Source: `app-code/main-app/resources/js/Pages/Services/ServiceJobDetail.jsx`. Module declaration: services.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/service-jobs/{serviceJob}` — `store.service-jobs.show`

Literal interface text: Unassign; Status Lifecycle; Assign; Check Out; Save Schedule.

Action/navigation references: `store.service-jobs.status`, `store.service-jobs.convert-invoice`, `store.service-jobs.assign`, `store.service-jobs.unassign`, `store.service-jobs.checkout-tool`, `store.service-jobs.return-tool`, `store.service-jobs.update-schedule`, `store.service-jobs.index`, `store.expenses.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Services/ServiceJobs.jsx

Follow service requests, appointments, people, tools and billing.

Source: `app-code/main-app/resources/js/Pages/Services/ServiceJobs.jsx`. Module declaration: services.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/service-jobs` — `store.service-jobs.index`

Literal interface text: All Statuses.

Action/navigation references: `store.service-jobs.index`, `store.service-jobs.create`, `store.service-jobs.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Services/ServiceNavTabs.jsx

Follow service requests, appointments, people, tools and billing.

Source: `app-code/main-app/resources/js/Pages/Services/ServiceNavTabs.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Action/navigation references: `store.service-jobs.index`, `store.service-jobs.calendar`, `store.tools.index`, `store.services.catalogue`, `store.service-jobs.create`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Services/Tools.jsx

Follow service requests, appointments, people, tools and billing.

Source: `app-code/main-app/resources/js/Pages/Services/Tools.jsx`. Module declaration: services.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/tools` — `store.tools.index`

Literal interface text: Tools & Equipment; Tools & Equipment Management; All Equipment; Maintenance due soon; Return tool to shop; Check out to employee/job; Log maintenance; Edit; Delete; e.g. Cordless Hammer Drill, Vacuum Pump; Power Tools, Diagnostics, HVAC; Shop shelf A3, Van #2; e.g. 90 (every 3 months); 0.00; Serial #, battery specs, warranty details...; Oil changed, blades sharpened, safety test passed...; No tools found; + Register Tool; Confirm Check Out; Record Maintenance.

Action/navigation references: `store.tools.update`, `store.tools.store`, `store.tools.checkout`, `store.tools.checkin`, `store.tools.maintenance`, `store.tools.destroy`, `store.tools.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Settings/Appearance.jsx

Configure business behavior and connected tools.

Source: `app-code/main-app/resources/js/Pages/Settings/Appearance.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/appearance` — `store.appearance`

Literal interface text: Appearance; Experience; Theme; Applies everywhere — the dashboard, POS, reports, every screen.; Light or dark; System follows your device setting.; Your colours; Optional. Leave these alone to use the colours the theme was designed with.; Primary; Accent; Store default; New team members start with these settings. It never overrides a choice someone has already made for themselves.; Save my current settings as the store default.

Action/navigation references: `store.appearance.experience`, `store.appearance.store-default`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Settings/ChatbotSettings.jsx

Configure business behavior and connected tools.

Source: `app-code/main-app/resources/js/Pages/Settings/ChatbotSettings.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/admin/chatbot/settings` — `store.admin.chatbot.settings`
- `GET,HEAD /VenQore/chatbot/settings` — `platform.chatbot.settings`

Literal interface text: Chatbot Settings; AI Integration; Enter your API key to power the chatbot. We default to Google Gemini.; AI API Key (Google Cloud Console); Chatbot Personalization Rules; Usage & Billing; Token Metrics; Models Active.

Action/navigation references: `platform.chatbot.settings.update`, `store.admin.chatbot.settings.update`, `platform.ai.test`, `store.admin.chatbot.ai.test`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Settings/SettingsPanel.jsx

Configure business behavior and connected tools.

Source: `app-code/main-app/resources/js/Pages/Settings/SettingsPanel.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: My Store; +92 300 1234567; Full store address; e.g. store.mydomain.com; Sales Configuration; Customize your point of sale experience; Auto-Fill Cash Received; Automatically populate the; Senior Mode (Accessibility); Enable larger fonts and high-contrast UI for easier reading; FBR Integration; Automatically report sales to FBR and print QR codes; Show Margin Percentage; Display profit margin in sales overview; Allow Negative Stock (Overselling); Warning: Allows selling items even if inventory is 0; Return Mode Configuration; Configure return settings and validation rules; e.g. 7, 14, 30 — leave empty to disable; Access Control; Manage login security; Enable Passcode Login; Allow users to log in using a 4-6 digit keypad PIN; Enter PIN; SSO / SAML Authentication; Configure Single Sign-On for your organization; Enable SSO; Allow members to sign in securely using SAML Identity Provider; https://identity-provider.com/metadata; https://identity-provider.com/sso; -----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----; Approvals & Governance; Configure store-wide transaction maker-checker approval controls and dual authorization; Enable Store Approval Workflow; When enabled, transactions requiring approval are routed to the manager review queue before posting to the ledger.; Strict Owner Separation; Enforce dual control so store owners cannot self-approve transactions they personally submitted as maker.; 0.00; Inherit store threshold; Custom Tax Configurator; Define custom tax rates and brackets for B2B invoice billing; Settings; Invoice & PDF Customization; B2B Margin Display; Per-Document Approval Policies & Overrides; Phase 1 Additional Operations.

Action/navigation references: `store.settings.update`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Staff/Hub.jsx

Manage people, roles and their business access.

Source: `app-code/main-app/resources/js/Pages/Staff/Hub.jsx`. Module declaration: staff_attendance.

Direct render route(s):
- `GET,HEAD /staff/hub` — `staff.hub`

Literal interface text: Platform Employee Cockpit; Support Room; Content & SEO Room; Marketing & Growth; Finance & Subscriptions; Inbox Fully Cleared!; Resolution Over Time; Escalation Controls.

Action/navigation references: `logout`, `platform.chatbot.autonomy-stats`, `platform.chatbot.autonomy-stats.promote`, `platform.chatbot.inbox`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## StaffAttendance/Show.jsx

Record and inspect staff presence.

Source: `app-code/main-app/resources/js/Pages/StaffAttendance/Show.jsx`. Module declaration: staff_attendance.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/staff-attendance/{id}` — `store.staff-attendance.show`
- `GET,HEAD /s/{store_slug}/staff/attendance/{id}` — `store.staff.attendance.show`

Literal interface text: Attendance History.

Action/navigation references: `store.staff-attendance.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## StaffAttendance/StaffAttendance.jsx

Record and inspect staff presence.

Source: `app-code/main-app/resources/js/Pages/StaffAttendance/StaffAttendance.jsx`. Module declaration: staff_attendance.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/staff-attendance` — `store.staff-attendance.index`
- `GET,HEAD /s/{store_slug}/staff/attendance` — `store.staff.attendance.index`

Literal interface text: Export; Print; Approve; Reject; View Full History; Pending Gap Approvals; Decrypted Terminal Capture.

Action/navigation references: `store.staff-attendance.approve-gap`, `store.staff-attendance.reject-gap`, `store.staff-attendance.index`, `store.staff-attendance.show`, `store.terminal-activities.screenshot`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## StockTake/Create.jsx

Count physical goods and review recorded differences.

Source: `app-code/main-app/resources/js/Pages/StockTake/Create.jsx`. Module declaration: stock_takes.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/stock-audit/create` — `store.stock-takes.create`

Literal interface text: Quick add row — Alt+Q, then just type; Scan the shelf; Warehouse; Which shelves are being counted; Count date; Count; Note; Who counted, which aisles, anything that explains a difference; Open the details; Counted.

Action/navigation references: `store.stock-takes.store`, `store.stock-takes.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## StockTake/Show.jsx

Count physical goods and review recorded differences.

Source: `app-code/main-app/resources/js/Pages/StockTake/Show.jsx`. Module declaration: stock_takes.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/stock-audit/{id}` — `store.stock-takes.show`

Action/navigation references: `store.stock-takes.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## StockTake/StockTake.jsx

Count physical goods and review recorded differences.

Source: `app-code/main-app/resources/js/Pages/StockTake/StockTake.jsx`. Module declaration: stock_takes.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/stock-audit` — `store.stock-takes.index`

Literal interface text: Stock Take / Audit; Stock Take; Stock Audit; Export; Print.

Action/navigation references: `store.stock-takes.create`, `store.stock-takes.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## StockTransfers/Create.jsx

Move recorded stock between locations.

Source: `app-code/main-app/resources/js/Pages/StockTransfers/Create.jsx`. Module declaration: stock_transfers.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/stock-transfers/create` — `store.stock-transfers.create`

Literal interface text: Quick add row — Alt+Q, then just type; Scan barcodes; From warehouse; Where they are now; Swap the two warehouses round; To warehouse; Where they are going; Transfer date; Stock; Note; Who is carrying it, which van, anything worth remembering; Open the details; Items.

Action/navigation references: `store.stock-transfers.store`, `store.stock-transfers.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## StockTransfers/Show.jsx

Move recorded stock between locations.

Source: `app-code/main-app/resources/js/Pages/StockTransfers/Show.jsx`. Module declaration: stock_transfers.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/stock-transfers/{id}` — `store.stock-transfers.show`

Literal interface text: Notes.

Action/navigation references: `store.stock-transfers.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## StockTransfers/StockTransfers.jsx

Move recorded stock between locations.

Source: `app-code/main-app/resources/js/Pages/StockTransfers/StockTransfers.jsx`. Module declaration: stock_transfers.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/stock-transfers` — `store.stock-transfers.index`

Literal interface text: Stock Transfers; Export; Print.

Action/navigation references: `store.stock-transfers.index`, `store.stock-transfers.create`, `store.stock-transfers.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Store/CreateOrJoin.jsx

Configure or select the business.

Source: `app-code/main-app/resources/js/Pages/Store/CreateOrJoin.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /start` — `store.create-or-join`

Literal interface text: Get Started — VenQore; Let's get you started; Create a Store; Join a Store.

Action/navigation references: `logout`, `store.create`, `store.join`, `redeem`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Store/Join.jsx

Configure or select the business.

Source: `app-code/main-app/resources/js/Pages/Store/Join.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /join` — `store.join`

Literal interface text: Join a Store — VenQore; Store join code; VQ-XXXX-XXXX; Pending Invitations; Have a short code?; e.g. VQ-A3X9.

Action/navigation references: `store.join.submit`, `invite.validate-code`, `invite.accept`, `store.create`, `store.create-or-join`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Store/Staff/Index.jsx

Configure or select the business.

Source: `app-code/main-app/resources/js/Pages/Store/Staff/Index.jsx`. Module declaration: staff_attendance.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/staff` — `store.staff`

Literal interface text: colleague@example.com; How they appear in POS (e.g. Ali); POS display name; Cancel.

Action/navigation references: `store.staff.invite`, `store.admin.users.update`, `store.admin.users.remove`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Storefront/Cart.jsx

Give visitors the supported public business experience.

Source: `app-code/main-app/resources/js/Pages/Storefront/Cart.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /shop/{slug}/cart` — `commerce.store.cart`

Literal interface text: Breadcrumb; Items in your cart; Note for the business (optional); Anything they should know about this order; Name; Phone; Email (optional); Delivery address; Checkout; Delivery area; Coupon code (optional); Enter code; Items; Remove them; Your details; Apply.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Storefront/Home.jsx

Give visitors the supported public business experience.

Source: `app-code/main-app/resources/js/Pages/Storefront/Home.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /shop/{slug}` — `commerce.store`

Literal interface text: Hero photos; About ordering; Today’s deals; Shop by category; Scroll left; Scroll right; New arrivals; Delivery photo; What customers say; Shop front photo.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Storefront/Product.jsx

Give visitors the supported public business experience.

Source: `app-code/main-app/resources/js/Pages/Storefront/Product.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /shop/{slug}/p/{id}` — `commerce.store.product`

Literal interface text: Breadcrumb; You may also like; View cart; About this product; Getting it.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Storefront/Shop.jsx

Give visitors the supported public business experience.

Source: `app-code/main-app/resources/js/Pages/Storefront/Shop.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /shop/{slug}/products` — `commerce.store.products`

Literal interface text: Breadcrumb; Categories; Sort products; Search products; Minimum price; Maximum price; Apply.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Storefront/classic/CartClassic.jsx

Give visitors the supported public business experience.

Source: `app-code/main-app/resources/js/Pages/Storefront/classic/CartClassic.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Items in your cart; Note for the business (optional); Anything they should know about this order; Checkout; Delivery area; Name; Phone; Email (optional); Delivery address; Coupon code (optional); Enter code; Your cart.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Storefront/classic/ProductClassic.jsx

Give visitors the supported public business experience.

Source: `app-code/main-app/resources/js/Pages/Storefront/classic/ProductClassic.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: You may also like; About this product.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Storefront/classic/RestaurantHomeClassic.jsx

Give visitors the supported public business experience.

Source: `app-code/main-app/resources/js/Pages/Storefront/classic/RestaurantHomeClassic.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Today; Ordering details; Popular right now; Start with what you fancy; Menu sections; Deals on the menu; From our kitchen to you; Hungry yet?.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Storefront/classic/RestaurantMenuClassic.jsx

Give visitors the supported public business experience.

Source: `app-code/main-app/resources/js/Pages/Storefront/classic/RestaurantMenuClassic.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Search the menu; Clear search; Menu sections; Menu.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Storefront/restaurant/RestaurantHome.jsx

Give visitors the supported public business experience.

Source: `app-code/main-app/resources/js/Pages/Storefront/restaurant/RestaurantHome.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Main photo; Scroll down; Welcome photos; Courses; Delivery photo; Takeaway photo; Dine-in photos; Restaurant front photo; Opening hours.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Storefront/restaurant/RestaurantMenu.jsx

Give visitors the supported public business experience.

Source: `app-code/main-app/resources/js/Pages/Storefront/restaurant/RestaurantMenu.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Breadcrumb; Courses; Search the menu; Clear search.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SuperAdmin/Dashboard.jsx

Operate platform-wide business/account controls as an authorised platform operator.

Source: `app-code/main-app/resources/js/Pages/SuperAdmin/Dashboard.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore` — `platform.dashboard`
- `GET,HEAD /VenQore/tickets` — `platform.tickets`
- `GET,HEAD /superadmin/dashboard` — `superadmin.dashboard`

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SuperAdmin/Stores.jsx

Operate platform-wide business/account controls as an authorised platform operator.

Source: `app-code/main-app/resources/js/Pages/SuperAdmin/Stores.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore/stores` — `platform.stores`
- `GET,HEAD /superadmin/tenants` — `superadmin.tenants`

Literal interface text: Store Management; Platform HQ | Store Management; Search by store name, slug, or owner email…; More store actions.

Action/navigation references: `platform.stores.bulk-destroy`, `platform.stores`, `platform.store.restore`, `platform.impersonate.start`, `platform.store.purge`, `platform.tenants.overrides.show`, `platform.store.activate`, `platform.store.suspend`, `platform.store.extend-trial`, `platform.store.destroy`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SuperAdmin/Users.jsx

Operate platform-wide business/account controls as an authorised platform operator.

Source: `app-code/main-app/resources/js/Pages/SuperAdmin/Users.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore/users` — `platform.users`

Literal interface text: User Management; Platform HQ | User Management; Platform Users; Search by user name or email address…; User actions.

Action/navigation references: `platform.users.bulk-destroy`, `platform.users`, `platform.user.restore`, `platform.user.purge`, `platform.user.destroy`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SuperAdmin/AccessGrants/Index.jsx

Operate platform-wide business/account controls as an authorised platform operator.

Source: `app-code/main-app/resources/js/Pages/SuperAdmin/AccessGrants/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore/access-grants` — `platform.access-grants.index`

Literal interface text: Create Gift Link; Plan to Grant; Duration Length; Duration Unit; Internal Admin Note; e.g. VIP onboarding gift, partner pilot store; Max Redemptions; Link Expiry Date; Gift Access Links; Platform HQ | Gift Access Links; No gift links yet; Re-activate link; Revoke link; Delete unused link.

Action/navigation references: `platform.access-grants.store`, `platform.access-grants.revoke`, `platform.access-grants.unrevoke`, `platform.access-grants.destroy`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SuperAdmin/AiUsage/Index.jsx

Operate platform-wide business/account controls as an authorised platform operator.

Source: `app-code/main-app/resources/js/Pages/SuperAdmin/AiUsage/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore/ai-usage` — `platform.ai-usage.index`

Literal interface text: AI Billing & Fleet Telemetry; Platform AI Cost & Infrastructure — VenQore Platform; Today; Month-to-Date Cost; Projected Run-rate; Daily Platform Cap; Filter store or slug…; 30-Day Cost & Call Trajectory; Per-Tenant AI Consumption; Model & Provider Reconciliation.

Action/navigation references: `platform.dashboard`, `platform.tenants.overrides`, `platform.plans.index`, `platform.tenants.overrides.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SuperAdmin/AppSumo/Index.jsx

Operate platform-wide business/account controls as an authorised platform operator.

Source: `app-code/main-app/resources/js/Pages/SuperAdmin/AppSumo/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore/appsumo` — `platform.appsumo.index`

Literal interface text: AppSumo Code Bank; Platform HQ | AppSumo Code Bank; Search by code or merchant email…; No codes found; Bulk Generate Codes; Quantity (Max 1,000); Target Plan Tier; Import External Codes; Codes (CSV or newline separated); AS-1234-ABCD, AS-5678-EFGH...; Assign to Plan Tier.

Action/navigation references: `platform.appsumo.generate`, `platform.appsumo.import`, `platform.appsumo.purge`, `platform.appsumo.index`, `platform.appsumo.export`, `store.dashboard`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SuperAdmin/Coupons/Index.jsx

Operate platform-wide business/account controls as an authorised platform operator.

Source: `app-code/main-app/resources/js/Pages/SuperAdmin/Coupons/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore/coupons` — `platform.coupons.index`

Literal interface text: Create Coupon; Coupon Code; e.g. SUMMER50; Display Name; e.g. Summer Special 50%; Discount Type; Maximum Cap (USD); e.g. 50.00 or leave blank; Applicable Products; Restrict to Selected Plans; Max Total Uses; e.g. 500; Max Per User; Valid From; Valid Until; Coupon Management; No coupons created yet.

Action/navigation references: `platform.coupons.store`, `platform.coupons.update`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SuperAdmin/DigitalHub/Index.jsx

Operate platform-wide business/account controls as an authorised platform operator.

Source: `app-code/main-app/resources/js/Pages/SuperAdmin/DigitalHub/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore/digital-hub` — `platform.digital-hub`

Literal interface text: Digital Products & Registry Hub; Digital Products & Registry Hub — VenQore Platform; Active Support Chats; Digital Catalog Listings; Operational / Live; Search partner chats…; Type partner message response…; No chat selected; Product Name; e.g. Cafe Quick POS station; Product Description; Comprehensive breakdown of package offerings…; Version / Release Tag; v1.0.0; Deployment Status; Platform (e.g. Etsy); Label (Buy on Etsy); URL link…; No products cataloged; Delete Product; + Add Link.

Action/navigation references: `platform.dashboard`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SuperAdmin/Health/Contacts.jsx

Operate platform-wide business/account controls as an authorised platform operator.

Source: `app-code/main-app/resources/js/Pages/SuperAdmin/Health/Contacts.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore/health/contacts` — `platform.health.contacts`

Literal interface text: Contact Desk & Customer Inquiries; Contact Desk — VenQore Platform; Contact Desk & Inquiries; Inquiry Queue; Unread Submissions; Handled / Read; Inbox Zero 🎉.

Action/navigation references: `platform.health.contacts`, `platform.health.contacts.read`, `platform.dashboard`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SuperAdmin/Health/Errors.jsx

Operate platform-wide business/account controls as an authorised platform operator.

Source: `app-code/main-app/resources/js/Pages/SuperAdmin/Health/Errors.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore/health/errors` — `platform.health.errors`

Literal interface text: System Health & Error Logs; System Health & Error Logs — VenQore Platform; System Health & Exception Tracker; Estimate fixes by file modification timestamps; Backend Exceptions; Frontend Crashes; Total Occurrence Events; Copy Error; Quick Resolve; Add resolution note (optional)....

Action/navigation references: `platform.health.errors`, `platform.health.errors.resolve`, `platform.health.errors.resolve-all`, `platform.health.errors.detect-fixes`, `platform.dashboard`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SuperAdmin/NewsletterHub/Index.jsx

Operate platform-wide business/account controls as an authorised platform operator.

Source: `app-code/main-app/resources/js/Pages/SuperAdmin/NewsletterHub/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore/newsletter-hub` — `platform.newsletter-hub`

Literal interface text: Newsletter & Subscribers Hub; Newsletter Hub — VenQore Platform; Cloud Website List; Digital Marketplace List; Gross Audience Reach; Search by name or email…; No subscribers found.

Action/navigation references: `platform.dashboard`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SuperAdmin/Plans/Index.jsx

Operate platform-wide business/account controls as an authorised platform operator.

Source: `app-code/main-app/resources/js/Pages/SuperAdmin/Plans/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore/plans` — `platform.plans.index`

Literal interface text: System Infrastructure Gate (Protected); Platform System; Tier Type; Plan Title; e.g. Starter; Display Name; e.g. Starter Engine; Identifier Slug; e.g. starter; Start limits & features from; Featured Tier; Active State; Public Visibility; Monthly Rate ($); 29.00; Annual Rate ($); 290.00; Lifetime LTD ($); 179.00; Monthly (PKR); 1100; Annual (PKR); 11000; Lifetime (PKR); 22120; Standard Checkout URL (USD); https://checkout.lemonsqueezy.com/buy/...; Localized Checkout URL (PKR); Unlimited; Platform team confidential notes…; SaaS Subscriptions & Tiers; Plans & Limits | VenQore Platform HQ; Subscription Tiers & Plan Matrix; Registered Tiers; Active Merchant Stores; Feature Matrix Gates; No plans registered; No plans exist for this platform.

Action/navigation references: `platform.plans.bulk-update`, `platform.plans.update`, `platform.plans.store`, `platform.plans.restore-defaults`, `platform.plans.duplicate`, `platform.plans.destroy`, `platform.plans.archive`, `platform.plans.unarchive`, `platform.dashboard`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SuperAdmin/Plans/featureGroups.js

Operate platform-wide business/account controls as an authorised platform operator.

Source: `app-code/main-app/resources/js/Pages/SuperAdmin/Plans/featureGroups.js`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SuperAdmin/Platforms/Index.jsx

Operate platform-wide business/account controls as an authorised platform operator.

Source: `app-code/main-app/resources/js/Pages/SuperAdmin/Platforms/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore/platforms` — `platform.platforms.index`

Literal interface text: System Platforms; Platform HQ | System Platforms; No platforms defined yet; Platform Name; e.g. VenQore Cloud; Identifier Slug; e.g. venqore-cloud.

Action/navigation references: `platform.platforms.update`, `platform.platforms.store`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SuperAdmin/StoreBadges/Index.jsx

Operate platform-wide business/account controls as an authorised platform operator.

Source: `app-code/main-app/resources/js/Pages/SuperAdmin/StoreBadges/Index.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore/store-badges` — `platform.store-badges.index`

Literal interface text: Store Badges; Search store name or link; No stores found.

Action/navigation references: `platform.store-badges.index`, `platform.store-badges.update`, `platform.store-badges.refresh`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SuperAdmin/Tenants/OverrideDetail.jsx

Operate platform-wide business/account controls as an authorised platform operator.

Source: `app-code/main-app/resources/js/Pages/SuperAdmin/Tenants/OverrideDetail.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore/tenant-overrides/{tenant}` — `platform.tenants.overrides.show`

Literal interface text: Revert to plan default; Value (blank = ∞); Reason (e.g. VIP loyalty upgrade, promo, support ticket); Optional Expiry Date; Add-on Product; Quantity; Optional Expiry; Custom Note; Store Name; Store name; Store Owner; Store Slug; Industry; e.g. Retail, Fashion, Cafe; Assigned Plan; Account Status; Trial End Date; Subscription End; Search canonical keys (e.g. multi_branch, sku_limit)…; Reason for granting this override; Add-on Packs & Entitlements; Store Profile & Plan Assignment; Override History & Audit Log; Grant Capability Override; Effective Plan Limits.

Action/navigation references: `platform.tenants.overrides.apply`, `platform.tenants.overrides.remove`, `platform.tenants.overrides.update`, `platform.tenants.overrides.grant-addon`, `platform.tenants.overrides.revoke-addon`, `platform.tenants.overrides`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## SuperAdmin/Tenants/Overrides.jsx

Operate platform-wide business/account controls as an authorised platform operator.

Source: `app-code/main-app/resources/js/Pages/SuperAdmin/Tenants/Overrides.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /VenQore/tenant-overrides` — `platform.tenants.overrides`

Literal interface text: Apply Override; Limit Key; New Allowance; e.g. 1000 or blank (∞); Internal Reason; e.g. Sales concession, VIP tier adjustment, enterprise deal; Expires At; Custom Notification Message; e.g. Your store SKU limit has been upgraded to 5,000 products by our support team.; Tenant Overrides; Search by store name or slug…; No tenants found; Remove override.

Action/navigation references: `platform.tenants.overrides.apply`, `platform.tenants.overrides`, `platform.tenants.overrides.remove`, `platform.tenants.overrides.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Suppliers/SuppliersList.jsx

Maintain suppliers and inspect buying relationships.

Source: `app-code/main-app/resources/js/Pages/Suppliers/SuppliersList.jsx`. Module declaration: suppliers.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/suppliers` — `store.suppliers.index`

Literal interface text: Cancel.

Action/navigation references: `store.suppliers.index`, `store.suppliers.update`, `store.suppliers.store`, `store.suppliers.destroy`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## TableService/FloorBuilder.jsx

Configure or run dining-room work.

Source: `app-code/main-app/resources/js/Pages/TableService/FloorBuilder.jsx`. Module declaration: table_service.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/floor-plan` — `store.tables.plan`

Literal interface text: Floor plan; Back to Table Service; Total tables across all areas; Total seating capacity; Total active dining areas; Tables currently with open guest bills; Table Service is Currently Set to Counter Only; Area name; e.g. Garden Terrace; New area name; Takeaway; Delivery; View layout mode; Save; Cancel; How many; Start at; Seats each; Open bill on this table; Code (e.g. T1); Name (e.g. Window 1); Drag to reorder; optional name, e.g. Window 2; Save this table; This table has an open bill; T13; New table code; optional name; New table name; Seats; Add; Design Your Restaurant Floor Plan.

Action/navigation references: `store.tables.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Transactions/TransactionsList.jsx

Inspect the relevant recorded transaction.

Source: `app-code/main-app/resources/js/Pages/Transactions/TransactionsList.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/transactions` — `store.transactions.index`

Literal interface text: Transactions; Export; Print; Filter; Search; Search ref or party....

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Updater/Index.jsx

Manage a supported application update, subject to release policy.

Source: `app-code/main-app/resources/js/Pages/Updater/Index.jsx`. Module declaration: not explicitly declared by path.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: System Updater | VENQORE; Back to Platform HQ; e.g. 2.0.0; System Update; Confirm Deployment; Update Successful!; How to Increase Upload Limit.

Action/navigation references: `platform.dashboard`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## V3/Products/Create.jsx

Use the relevant inventory, accounting, purchasing or production workflow.

Source: `app-code/main-app/resources/js/Pages/V3/Products/Create.jsx`. Module declaration: products, pricing_tiers, units_of_measure, fixed_assets, loans.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/v3/products/create` — `store.v3.products.create`

Action/navigation references: `store.v3.products.store`, `store.v3.products.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## V3/Products/Edit.jsx

Use the relevant inventory, accounting, purchasing or production workflow.

Source: `app-code/main-app/resources/js/Pages/V3/Products/Edit.jsx`. Module declaration: products, pricing_tiers, units_of_measure, fixed_assets, loans.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/v3/products/{product}/edit` — `store.v3.products.edit`

Action/navigation references: `store.v3.products.update`, `store.v3.products.index`, `store.v3.products.uom.index`, `store.v3.products.tiers.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## V3/Products/Index.jsx

Use the relevant inventory, accounting, purchasing or production workflow.

Source: `app-code/main-app/resources/js/Pages/V3/Products/Index.jsx`. Module declaration: products, pricing_tiers, units_of_measure, fixed_assets, loans.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/v3/products` — `store.v3.products.index`

Action/navigation references: `store.v3.products.destroy`, `store.v3.products.create`, `store.v3.products.edit`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## V3/Products/PriceTiers.jsx

Use the relevant inventory, accounting, purchasing or production workflow.

Source: `app-code/main-app/resources/js/Pages/V3/Products/PriceTiers.jsx`. Module declaration: products, pricing_tiers, units_of_measure, fixed_assets, loans.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/v3/products/{productId}/tiers` — `store.v3.products.tiers.index`

Literal interface text: e.g. 1; e.g. 50; e.g. 95.00; Price Tiers; Add Price Tier.

Action/navigation references: `store.v3.products.tiers.store`, `store.v3.products.tiers.destroy`, `store.v3.products.edit`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## V3/Products/UomConversions.jsx

Use the relevant inventory, accounting, purchasing or production workflow.

Source: `app-code/main-app/resources/js/Pages/V3/Products/UomConversions.jsx`. Module declaration: products, pricing_tiers, units_of_measure, fixed_assets, loans.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/v3/products/{productId}/uom` — `store.v3.products.uom.index`

Literal interface text: e.g. GRAMS; e.g. 1000; UOM Conversions; Add UOM Conversion; Add.

Action/navigation references: `store.v3.products.uom.store`, `store.v3.products.uom.destroy`, `store.v3.products.edit`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## V3/Purchases/Create.jsx

Use the relevant inventory, accounting, purchasing or production workflow.

Source: `app-code/main-app/resources/js/Pages/V3/Purchases/Create.jsx`. Module declaration: pricing_tiers, units_of_measure, purchases, fixed_assets, loans.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/purchases/create` — `store.purchases.create`
- `GET,HEAD /s/{store_slug}/v3/purchases/create` — `store.v3.purchases.create`

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## V3/Purchases/Edit.jsx

Use the relevant inventory, accounting, purchasing or production workflow.

Source: `app-code/main-app/resources/js/Pages/V3/Purchases/Edit.jsx`. Module declaration: pricing_tiers, units_of_measure, purchases, fixed_assets, loans.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/purchases/{purchase}/edit` — `store.purchases.edit`
- `GET,HEAD /s/{store_slug}/v3/purchases/{purchase}/edit` — `store.v3.purchases.edit`

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## V3/Purchases/GoodsIn.jsx

Use the relevant inventory, accounting, purchasing or production workflow.

Source: `app-code/main-app/resources/js/Pages/V3/Purchases/GoodsIn.jsx`. Module declaration: pricing_tiers, units_of_measure, purchases, fixed_assets, loans.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/purchases-goods-in` — `store.purchases.goods-in`

Literal interface text: Goods In · Warehouse Receipt; Goods In · Receive Goods; Search invoice or supplier...; Optional; Condition on arrival, driver remarks, packaging notes...; Goods In (Receive Shipments); All Purchase Shipments are Fully Received.

Action/navigation references: `store.purchases.receive.store`, `store.purchases.index`, `store.purchases.create`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## V3/Purchases/PurchaseForm.jsx

Use the relevant inventory, accounting, purchasing or production workflow.

Source: `app-code/main-app/resources/js/Pages/V3/Purchases/PurchaseForm.jsx`. Module declaration: pricing_tiers, units_of_measure, purchases, fixed_assets, loans.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Settlement; Money comes from; Drawn on Bank; Select bank account...; Cheque leaf; Cheque date; The number on their document; Our reference; Auto; Bill date; Payment terms; Due date; Goods; Goods land in; Note on the purchase; Anything worth remembering about this delivery; Freight, duty and clearing; Landed costs; Cost; Freight, duty, clearing…; Amount; What for; Clearing agent, port charges…; Spread by; Remove this cost; An item costs nothing.

Action/navigation references: `store.v3.purchases.index`, `store.v3.purchases.update`, `store.v3.purchases.store`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## V3/Purchases/Receive.jsx

Use the relevant inventory, accounting, purchasing or production workflow.

Source: `app-code/main-app/resources/js/Pages/V3/Purchases/Receive.jsx`. Module declaration: pricing_tiers, units_of_measure, purchases, fixed_assets, loans.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/purchases/{purchase}/receive` — `store.purchases.receive`
- `GET,HEAD /s/{store_slug}/v3/purchases/{purchase}/receive` — `store.v3.purchases.receive`

Literal interface text: Against purchase; Condition on arrival; Two cartons crushed, driver noted it…; Goods arriving onto the shelf.

Action/navigation references: `store.v3.purchases.receive.store`, `store.v3.purchases.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## V3/Purchases/Return.jsx

Use the relevant inventory, accounting, purchasing or production workflow.

Source: `app-code/main-app/resources/js/Pages/V3/Purchases/Return.jsx`. Module declaration: pricing_tiers, units_of_measure, purchases, fixed_assets, loans.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/v3/purchases/{purchaseId}/return` — `store.v3.purchases.return.create`

Literal interface text: Against purchase; Return date; Reason; Damaged on arrival, wrong item sent, short shipment…; Goods leaving the shelf, back to the supplier.

Action/navigation references: `store.v3.purchases.return.store`, `store.v3.purchases.show`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## V3/Purchases/Show.jsx

Use the relevant inventory, accounting, purchasing or production workflow.

Source: `app-code/main-app/resources/js/Pages/V3/Purchases/Show.jsx`. Module declaration: pricing_tiers, units_of_measure, purchases, fixed_assets, loans.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/purchases/{purchase}` — `store.purchases.show`
- `GET,HEAD /s/{store_slug}/v3/purchases/{purchase}` — `store.v3.purchases.show`

Literal interface text: Void; Line Items; Landed Costs; Returns; Journal History.

Action/navigation references: `store.v3.purchases.destroy`, `store.v3.purchases.index`, `store.v3.purchases.receive`, `store.v3.purchases.edit`, `store.v3.purchases.return.create`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## V3/Sales/GoodsOut.jsx

Use the relevant inventory, accounting, purchasing or production workflow.

Source: `app-code/main-app/resources/js/Pages/V3/Sales/GoodsOut.jsx`. Module declaration: pricing_tiers, units_of_measure, fixed_assets, loans.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/sales-goods-out` — `store.sales.goods-out`

Literal interface text: Goods Out · Delivery Dispatch; Goods Out · Dispatch Goods; Search invoice or customer...; e.g. TCS, Rider John, Self Pickup; e.g. TRK-990142; Special handling instructions, recipient signature memo...; Goods Out (Dispatch Deliveries); All Sales Invoices are Fully Dispatched.

Action/navigation references: `store.sales.dispatch.store`, `store.sales.index`, `store.sales.invoice.create`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## V3/Warehouses/Create.jsx

Use the relevant inventory, accounting, purchasing or production workflow.

Source: `app-code/main-app/resources/js/Pages/V3/Warehouses/Create.jsx`. Module declaration: pricing_tiers, multi_location, units_of_measure, fixed_assets, loans.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/v3/warehouses/create` — `store.v3.warehouses.create`

Literal interface text: e.g. Main Store, Warehouse B; Optional physical address; New Warehouse.

Action/navigation references: `store.v3.warehouses.store`, `store.v3.warehouses.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## V3/Warehouses/Edit.jsx

Use the relevant inventory, accounting, purchasing or production workflow.

Source: `app-code/main-app/resources/js/Pages/V3/Warehouses/Edit.jsx`. Module declaration: pricing_tiers, multi_location, units_of_measure, fixed_assets, loans.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/v3/warehouses/{warehouse}/edit` — `store.v3.warehouses.edit`

Action/navigation references: `store.v3.warehouses.update`, `store.v3.warehouses.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## V3/Warehouses/Index.jsx

Use the relevant inventory, accounting, purchasing or production workflow.

Source: `app-code/main-app/resources/js/Pages/V3/Warehouses/Index.jsx`. Module declaration: pricing_tiers, multi_location, units_of_measure, fixed_assets, loans.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/v3/warehouses` — `store.v3.warehouses.index`

Literal interface text: Warehouses.

Action/navigation references: `store.v3.warehouses.destroy`, `store.v3.warehouses.create`, `store.v3.warehouses.edit`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## VenSynQ/Dashboard.jsx

Configure or inspect enabled marketplace connections.

Source: `app-code/main-app/resources/js/Pages/VenSynQ/Dashboard.jsx`. Module declaration: marketplace_sync.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/vensynq` — `store.vensynq.index`

Literal interface text: VenSynQ — Multi-Channel Fulfillment; Estimated; Paste tracking…; VenSynQ Dashboard; Unified Inventory & Order Control; All clear!.

Action/navigation references: `store.vensynq.sync-orders`, `store.vensynq.sync-tracking`, `store.purchases.index`, `store.vensynq.settings`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## VenSynQ/Payouts.jsx

Configure or inspect enabled marketplace connections.

Source: `app-code/main-app/resources/js/Pages/VenSynQ/Payouts.jsx`. Module declaration: marketplace_sync.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/vensynq/payouts` — `store.vensynq.payouts`

Literal interface text: e.g. Payout #8841; Marketplace Payouts — VenSynQ; Marketplace Payouts; Nothing waiting on you; Recently confirmed.

Action/navigation references: `store.vensynq.payouts.confirm`, `store.vensynq.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## VenSynQ/Settings.jsx

Configure or inspect enabled marketplace connections.

Source: `app-code/main-app/resources/js/Pages/VenSynQ/Settings.jsx`. Module declaration: marketplace_sync.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/vensynq/settings` — `store.vensynq.settings`

Literal interface text: VenSynQ Settings — Integrations Center; Nickname / Nick; Platform Source; Default Fulfillment Type; Fee Percentage %; Currency Override; Default Fulfill Warehouse; Expense category; Select Amazon Region; VenSynQ Integrations; Marketplace Connect Center.

Action/navigation references: `store.vensynq.channels.update`, `store.vensynq.channels.disconnect`, `store.vensynq.index`, `store.vensynq.connect`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## VenSynQ/Components/AmazonSetupWizard.jsx

Configure or inspect enabled marketplace connections.

Source: `app-code/main-app/resources/js/Pages/VenSynQ/Components/AmazonSetupWizard.jsx`. Module declaration: marketplace_sync.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: amzn1.application-oa2-client.…; amzn1.oa2-cs.v1.…; Atzr|IwEBI…; A1BCDEFGHIJKLM; Amazon UK — Main Store.

Action/navigation references: `store.vensynq.amazon.test`, `store.vensynq.amazon.store`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## VenSynQ/Components/MoneyPipeline.jsx

Configure or inspect enabled marketplace connections.

Source: `app-code/main-app/resources/js/Pages/VenSynQ/Components/MoneyPipeline.jsx`. Module declaration: marketplace_sync.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Online sales in pipeline; Held by platforms; Cleared to bank; Where your money is.

Action/navigation references: `store.vensynq.clearing.toggle`, `store.vensynq.payouts`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## VenSynQ/Components/SyncHealthPanel.jsx

Configure or inspect enabled marketplace connections.

Source: `app-code/main-app/resources/js/Pages/VenSynQ/Components/SyncHealthPanel.jsx`. Module declaration: marketplace_sync.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: Sync in progress; API; Webhook; Token.

Action/navigation references: `store.vensynq.health`, `store.vensynq.channels.retry`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## WooCommerce/ConnectionSetup.jsx

Configure or inspect the supported website connection.

Source: `app-code/main-app/resources/js/Pages/WooCommerce/ConnectionSetup.jsx`. Module declaration: marketplace_sync.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/woo/connections/{connection}/setup` — `store.woo.connections.setup`

Literal interface text: WooCommerce Setup; https://my-wordpress-store.com; Copy URL; Copy Token; Zero-Configuration Setup; Download your Custom Plugin; Install & Activate on WordPress; Watch the connection happen; Connecting to WooCommerce; Store Successfully Synced! 🎉; Manual Setup Protocol.

Action/navigation references: `store.woo.connections.settings`, `store.woo.connections.status-json`, `store.woo.connections.sync`, `store.woo.connections.index`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## WooCommerce/Connections.jsx

Configure or inspect the supported website connection.

Source: `app-code/main-app/resources/js/Pages/WooCommerce/Connections.jsx`. Module declaration: marketplace_sync.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/woo/connections` — `store.woo.connections.index`

Literal interface text: e.g. My WordPress Store; https://my-wordpress-store.com; WooCommerce Sync; WooCommerce Sync — VenQore; Add WooCommerce Connection; Cancel; Delete Connection?; No WooCommerce connections yet; How it works.

Action/navigation references: `store.woo.connections.store`, `store.woo.connections.destroy`, `store.woo.connections.sync`, `store.woo.connections.setup`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## WooCommerce/SyncPage.jsx

Configure or inspect the supported website connection.

Source: `app-code/main-app/resources/js/Pages/WooCommerce/SyncPage.jsx`. Module declaration: marketplace_sync.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/woo/connections/{connection}/sync` — `store.woo.connections.sync`

Literal interface text: Ignore; Push VenQore → WooCommerce; Pull WooCommerce → VenQore; Unlink / Ignore; WooCommerce Sync; Search by name or SKU…; Go.

Action/navigation references: `store.woo.connections.approve`, `store.woo.connections.ignore`, `store.woo.connections.push`, `store.woo.connections.pull`, `store.woo.connections.resolve`, `store.woo.connections.sync`, `store.woo.connections.scan`, `store.woo.connections.index`, `store.woo.connections.setup`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## WooCommerce/WooCommerce.jsx

Configure or inspect the supported website connection.

Source: `app-code/main-app/resources/js/Pages/WooCommerce/WooCommerce.jsx`. Module declaration: marketplace_sync.

No direct literal render binding resolved. This can be a helper, indirect render, compatibility or unused file; investigate before counting it as a customer page.

Literal interface text: WooCommerce Sync; WooCommerce Integration; Store Connection.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Workspace/BuildWorkspace.jsx

Review or create the business workspace.

Source: `app-code/main-app/resources/js/Pages/Workspace/BuildWorkspace.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /build-workspace` — `workspace.build`

Literal interface text: Build your VenQore workspace; Answer with AI, or do it yourself; We sell…; Use this setup — no questions; Examples; Setup progress; you@yourbusiness.com; Modules set up so far; What does your business need that you don; Plan; Business name; e.g. Rahman Trading Co. (you can change it later); Phone (optional); For receipts; Email; Password; Building your workspace; Tell us what your business does.; Build it yourself.; Here&rsquo;s everything we think is right for you.; Tell us more about your business; What we&rsquo;ve set up so far; Switch all on; Switch all off; Pick a plan for after your trial.; Save your workspace..

Action/navigation references: `workspace.analyze`, `workspace.demand`, `workspace.converse.deepen`, `workspace.provision`, `workspace.prepare-google`, `auth.google`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Workspace/Dashboard.jsx

Review or create the business workspace.

Source: `app-code/main-app/resources/js/Pages/Workspace/Dashboard.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/workspace` — `store.workspace`

Literal interface text: Dashboard; Reset to default layout; Your dashboard is empty.

Action/navigation references: `store.workspace.data`, `store.workspace.layout.save`, `store.workspace.layout.reset`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.

## Workspace/Overview.jsx

Review or create the business workspace.

Source: `app-code/main-app/resources/js/Pages/Workspace/Overview.jsx`. Module declaration: not explicitly declared by path.

Direct render route(s):
- `GET,HEAD /s/{store_slug}/overview` — `store.overview`

Literal interface text: Overview; To receive; To pay; Stock value; Net profit; Top products; Recent activity.

Action/navigation references: `store.workspace.layout.save`.

How to verify: enter through the authorised navigation or resolved route, inspect its fields and states, exercise its relevant action in isolated test data, and confirm the saved outcome. Empty state, permission denial, invalid input and retry behavior remain part of that check.
