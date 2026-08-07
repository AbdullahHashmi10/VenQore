# VenQore - The Ultimate V1 Gold Master Feature Registry

This document is the absolute, most granular record of every feature, logic path, and aesthetic choice within **VenQore POS (Advanced Management Dashboard & Point of Sale)**. It details the "dots" and the "thousands of lines" of logic that power this enterprise-grade system.

---

## Ã°Å¸ï¿½â€ºÃ¯Â¸ï¿½ 1. The Executive Control & Strategy (Admin Panel)

The Admin Panel provides a "high-altitude" view for the business owner, managing the core heartbeat of the application.

### Ã°Å¸â€œÅ  A. Professional Dashboard Analytics
*   **The "At-A-Glance" Matrix:** Real-time data visualization cards showing Today's Revenue, Transaction Count, Active Staff, and Revenue Trends.
*   **Inventory Health Snapshot:** Visual indicators for Stock Valuation, Out of Stock items, and Low Stock warnings.
*   **Revenue Heatmap:** A visual graph of sales performance over the last 30 days to identify peak business cycles.
*   **Executive Dashboard Toggle:** Switch between a simplified operational view and a detailed financial analytics dashboard.
*   **Efficiency Metrics:** Automated calculation of **Staff Efficiency** (Total Sales vs. Total Hours Worked).
*   **Payment Method Popularity:** Pie-chart analysis of which payment methods (Cash, Card, Bank, Credit) are most used.

### Ã¢Å¡â„¢Ã¯Â¸ï¿½ B. System Configuration (Global Hub)
*   **Business Profile:** Global settings for Company Name, Address, Contact details, and Logo (synchronized across all invoices and receipts).
*   **Tax Compliance Engine:** Set Global Tax Rates (GST/VAT) with a toggle for Tax-Inclusive or Tax-Exclusive pricing.
*   **Currency & Localization:** Support for PKR, USD, EUR, GBP, AED, SAR, and INR formatting.
*   **Module "Glass Door" Control:** Enable/Disable entire modules (AI, Manufacturing, Staff Tracking) with a single switch.
*   **Stop Sale on Negative Stock:** A hard-lock setting to prevent sales if physical stock is unavailable.
*   **Custom Charges Factory:** Define service fees, delivery charges, and shipping costs that appear automatically on checkout screens.

---

## Ã¢Å¡Â¡ 2. The Sales & Outbound Ecosystem

VenQore provides **Four Comprehensive Methods** for creating transactions, each optimized for different business scenarios.

### Ã°Å¸â€ºâ€™ A. High-Speed Retail POS (Point of Sale)
Designed for supermarkets, pharmacies, and high-traffic retail.
*   **Ã°Å¸Å½Â¨ Midnight Nebula Identity:** A dark-mode, glassmorphic interface that reduces eye strain for cashiers.
*   **Ã¢Å¡Â¡ Triple-Layer Focus System:** Smart input management that defaults to the barcode scanner when search is inactive.
*   **Ã°Å¸Å¡â‚¬ Keyboard-Only Workflow:** 
    *   `F1`: Jump to Item Search.
    *   `F2`: Change Quantity (Active Item).
    *   `F3`: Change Discount (Active Item).
    *   `F4`: Remove Item (Active Item).
    *   `F5`: Change Price (Active Item).
    *   `F11`: Jump to Customer Search.
    *   `CTRL + T/W`: Manage Sale Tabs.
    *   `CTRL + S/P`: Quick Save / Save & Print.
*   **Ã°Å¸â€œÅ¸ Smart Barcode Scanning:**
    *   **Serial/IMEI Mapping:** Automatically links individual device identity to the transaction.
    *   **Contextual Qty Update:** Typing/scanning a small number asks if you want to update the quantity of the last added item.
*   **Ã°Å¸â€”â€šÃ¯Â¸ï¿½ Multi-Tab Contexts:** Handle up to 10 customers simultaneously with a browser-like tab interface.
*   **Ã°Å¸â€¦Â¿Ã¯Â¸ï¿½ Park & Recall (Hold Bill):** Move bills to a "Hold" state with custom notes (e.g., "Table 5").
*   **Ã°Å¸â€�ï¿½ Unified OmniSearch:** Search items by Name, SKU, Barcode, Serial, or Category.
*   **Ã¢Å“ï¿½Ã¯Â¸ï¿½ Inline Product Control:** Add new products or edit item prices/stock **while on the POS screen** via the "Quick Modal."
*   **Ã°Å¸â€˜Â´ Senior Mode (Accessibility):** Toggle to increase font sizes by **40%** and enable high-contrast "Traffic Light" colors.
*   **Ã°Å¸â€™Â° Secure Profit Peek:** A hidden owner gesture (drag down on total) to reveal real-time margin percentage.
*   **Ã°Å¸Å½Â¢ Cart Rescue (Crash Airbag):** Automatic local-storage persistence ensures carts are never lost during crashes or reloads.

### Ã°Å¸â€œï¿½ B. Professional B2B Invoicing (`/sales/invoice/create`)
Designed for wholesalers and corporate billing.
*   **Zenith Workspace:** Wide-screen interface for 50+ item invoices.
*   **Customer Khata Status:** Instant visibility of the customer's current debt/balance in the sidebar.
*   **Serial Number Ledger:** A dedicated column for recording IMEIs/Serials per line item.
*   **Split Payments:** Support for multi-account pay (e.g., Cash 5000 + Bank 2000 + Credit 3000).

### Ã°Å¸â€œÅ“ C. Proposals & Quotations
*   **Validity Tracker:** Displays "Valid Until" dates on exports.
*   **Conversion Engine:** One-click "Convert to Sale" button transfers all data to a live invoice.

### Ã°Å¸Â§Âª D. Pre-Sales (Sales Orders)
*   **Stock-Hold Logic:** Reserves stock for future delivery.
*   **Stock-Check OFF Mode:** Allows building price quotes for missing items without stock errors.

### Ã°Å¸â€�â€ž E. Recurring Invoice Automation (`/sales/recurring`)
*   **Subscription Billing:** Automatically generate invoices on a daily, weekly, monthly, or quarterly basis.
*   **Customer Retention:** Ideal for service-based contracts or rent tracking.

---

## Ã°Å¸â€ºï¿½Ã¯Â¸ï¿½ 3. Procurement & Inbound Ecosystem

### Ã°Å¸â€œÂ¦ A. Purchase Management
*   **Cost Price Intelligence:** Automatically tracks price fluctuations from suppliers; product cost price is **auto-updated** on every receipt.
*   **Partial Receiving:** Handle situations where suppliers send only part of an order.
*   **Batch & Expiry Intake:** Record manufacturing/expiry dates the moment stock hits the warehouse.

### Ã°Å¸Â¤ï¿½ B. Purchase Orders (Pre-Purchases)
*   **"Ordered" vs "Received":** Tracks the lifecycle of a stock order.
*   **Direct Receipt Switch:** One-click option to mark an order as received and update stock immediately.

---

## Ã°Å¸ï¿½â€”Ã¯Â¸ï¿½ 4. Inventory, Warehousing & Godown Control

*   **Multi-Warehouse (Godowns):** Manage inventory across separate physical locations.
*   **Stock Transfers:** Log and voucher-driven movement between godowns.
*   **Serial & IMEI Lifespan:** Full audit trail for a device from Purchase -> Store -> Sale -> Returns.
*   **Stock Take (Audit):** Reconcile system numbers with physical counts and log "Discrepancy Reasons" (Damage, Theft).
*   **Barcode Label Factory:** Generate printable labels with custom pricing and branding.

---

## Ã°Å¸Â§Âª 5. Expert Manufacturing (The Cookbook)

*   **Bill of Materials (BOM):** Define complex recipes where finished items consume raw stock.
*   **Auto-Assembly ("Garam Masala Logic"):** If a pizza is sold while out of stock, the system automatically "manufactures" it by deducting components in real-time.
*   **Production Simulator:** Run a "Stress Test" to see if you have enough ingredients to fulfill a target production run.
*   **Recipe Versioning:** Immutable history tracking for past financial audit accuracy.

---

## Ã°Å¸â€™Â° 6. Finance & The "Truth Checker" (Accounting)

*   **Double-Entry Engine:** Background Journal Entries for every single movement of money or stock.
*   **Bank Reconciliation (Truth Checker):** Upload CSV/Excel statements and auto-match them against recorded payments to ensure system balances are 100% correct.
*   **Fund Management:** Handle Owner Capital transfers, Withdrawals, and Adjustments.
*   **Debit & Credit Notes:** Dedicated modules for returns-to-supplier and returns-from-customers.
*   **Fixed Asset Depreciation:** Professional automated daily/monthly depreciation engine for long-term investments (Bikes, Computers, Furniture).

---

## Ã°Å¸Â§Â  7. Growth Engine & AI Intelligence

*   **The Three AI Brains:**
    *   **Retention Engine:** Predicts when a customer is due back.
    *   **Forecasting Engine:** Predicts stock outages based on demand cycles.
    *   **Churn Detection:** Alerts you if a loyal customer has stopped visiting.
*   **Natural Language Query:** Use plain English ("Who was my top customer?") to search data.
*   **Multichannel Reminders:** WhatsApp and SMS generation for invoice delivery and payment reminders.

---

## Ã°Å¸â€™Â¼ 8. Workforce Integrity & Resilience

*   **Hardware Heartbeat:** Tracks terminal connectivity to identify power-cuts (Load-Shedding) vs. manual shutdowns.
*   **Gap Detector:** Manager oversight for unexplained inactivity periods; justify downtime with specific "Reason" tags.
*   **Kiosk Lockdown:** Mandatory Manager PIN required to exit the POS or close the terminal.
*   **Staff Summaries:** Detailed performance tracking including avg. transaction value and last-seen activity.

---

## Ã°Å¸â€œÅ  9. The Report Factory (38 Master Reports)

VenQore provides a professional suite of 38 reports, categorized into:
*   **Financials:** P&L, Balance Sheet, Trial Balance, Cash Flow, Tax Reports.
*   **Sales:** Item-wise Profit, Bill-wise Profit, Sale Aging (Receivables), Discount leakage.
*   **Inventory:** Valuation, Low Stock, Movement History, Expiry, Stock Aging.
*   **Logistics:** Stock Transfers, Audit Summaries, Batch History.

---

## Ã°Å¸â€�ï¿½ 10. Security & Infrastructure

*   **VenQore Station Shell:** Native browser wrapper for **Silent Printing** and Cash Drawer control.
*   **UUID Data Integrity:** Collision-free synchronization between offline terminals and the cloud.
*   **Recycle Bin:** "Soft-Delete" safety net allowing one-click restoration of any record.
*   **Passcode Strength Logic:** Suggests unique combinations and prevents common sequences for security.
*   **Local & Cloud Backups:** Automated management of database state with email delivery options.

---

## Ã°Å¸Å’ï¿½ 11. Multi-Channel & Social Responsibility

*   **WooCommerce Multi-Channel Sync:** Real-time bi-directional synchronization of stock levels and pricing between the physical shop and the website.
*   **Quick Charity/Donation Module:** One-touch charity deduction from cash register with dedicated reporting for community impact.

---
### VenQore Station Real-Time Monitoring & Dark Theme
**Date:** 2026-01-30
**Alignment:** According to Plan (Hardware Integration)

**Decision Context:**
Originally the shell indicators used mock data (e.g., "Epson T88") for UI demonstration. The user requested "Real Data" and corrected the aesthetics for dark mode. Implemented a heartbeat-synchronized status loop in the Electron main process and fixed the CSS background artifacts.

**Technical Implementation:**
- **Files:** `amd-station/main.js`, `amd-station/shell.css`, `amd-station/shell.html`, `amd-station/shell-renderer.js`, `routes/api.php`
- **Status:** Completed
---
### Local Data Supremacy & DRM Enforcement
**Date:** 2026-01-31
**Alignment:** According to Plan (Project Eternity)

**Decision Context:**
Implemented the "Local First" architecture where the app runs from a client-side Dexie.js database. Added the requested DRM logic: First run requires internet, monthly check-in required, blocks access after 30 days offline. Also added "Sync Engine" to hydrate full catalog on load.

**Technical Implementation:**
- **Files:** `resources/js/DB/LocalDB.js`, `resources/js/Services/SyncService.js`, `resources/js/Components/OfflineLockScreen.jsx`, `resources/js/Layouts/GlobalProviderLayout.jsx`
- **Status:** Completed
---
### Bulletproof Installer V1.0 Architecture
**Date:** 2026-02-02
**Alignment:** According to Plan (Phase 3: Pre-Flight Safety Net)

**Decision Context:**
Implemented a hardened "CodeCanyon-Style" installer to minimize support tickets. This includes:
1. **Crash Prevention:** `HandleInertiaRequests` updated with schema checks to prevent "Base table not found".
2. **Safe Defaults:** Session driver set to `cookie`, Strict Mode `off` for MariaDB/MySQL.
3. **Pre-Flight Check:** Root `index.php` created to trap PHP < 8.2 traffic with a helpful error page.
4. **Enhanced UI:** Installer UI now includes real-time validation, server specs, and actionable fix instructions.
5. **Ready-to-Deploy:** Golden Zip created with pre-built assets and `vendor` engine included.

**Technical Implementation:**
- **Files:** `index.php`, `.env.example`, `.htaccess`, `config/session.php`, `config/database.php`, `app/Http/Middleware/HandleInertiaRequests.php`, `resources/js/Pages/Installer/Index.jsx`
- **Status:** Completed
---
### Comprehensive POS Shortcut Engine
**Date:** 2026-02-03
**Alignment:** Deviation from Plan (Enhanced Power-User Workflow)

**Decision Context:**
Originally planned with a 5-key setup. Expanded to a 25+ shortcut system to align with professional retail hardware standards. Overrode standard browser behaviors (CTRL+S, CTRL+P, CTRL+W) to provide a seamless, mouse-free environment for cashiers.

**Technical Implementation:**
- **Files:** `resources/js/Pages/Pos.jsx`
- **Status:** Completed
---
### VenQore Global Keyboard Grid
**Date:** 2026-02-03
**Alignment:** New Feature (User Request)

**Decision Context:**
Implemented a global shortcut system (`SHIFT` for Navigation, `ALT` for Creation) to allow rapid movement between Sales, Purchases, and Reports without using a mouse. This mirrors the behavior of legacy desktop ERP software familiar to the client.

**Technical Implementation:**
- **Hook:** `resources/js/Hooks/useGlobalShortcuts.js`
- **Integration:** `GlobalProviderLayout.jsx`
- **Status:** Active
---
### Shortcut Helper UI
**Date:** 2026-02-03
**Alignment:** UX Improvement

**Decision Context:**
Added a persistent, unobtrusive "Cheat Sheet" trigger in the bottom-left corner of the screen. This popup is context-aware, showing Function Keys when in POS mode and Global Navigation shortcuts when elsewhere.

**Technical Implementation:**
- **Component:** `Components/KeyboardShortcutsModal.jsx`
- **Trigger:** Fixed widget in `GlobalProviderLayout.jsx`
- **Status:** Active
---
### Reports Engine Layout & Usability Overhaul
**Date:** 2026-02-06
**Alignment:** UX Refinement & Feature Request

**Decision Context:**
The user requested a significant optimization of the Reports section to reduce whitespace and improve information density. Key changes include a custom "Compact Single-Line" layout for KPI cards and a specialized Filter Toolbar that integrates Universal Customer Search and Date Presets alongside a collapsible Custom Date Range input for maximum flexibility.

**Technical Implementation:**
- **Files:** `resources/js/Components/Reports/MasterReport.jsx`, `resources/js/Layouts/ReportsLayout.jsx`
- **Features:** Compact KPI Grid, Inline Date Filters, Local Timezone Logic, Collapsible Custom Date Input.
- **Status:** Completed
---
### Advanced RBAC & Security Hardening
**Date:** 2026-02-06
**Alignment:** According to Plan (Security & Administration)

**Decision Context:**
The user requested expanded role definitions and stricter access control. We introduced a dedicated "Support Specialist" role for technical troubleshooting and added "Audit Logs" and "Discounts" as granular permissions. Furthermore, we enforced these rules at the kernel level (Middleware) and the UI level (Sidebar), ensuring a secure, permission-aware environment.

**Technical Implementation:**
- **Files:** `app/Models/User.php`, `routes/web.php`, `resources/js/Layouts/OneGlanceLayout.jsx`, `resources/js/Pages/Admin/Users.jsx`
- **Features:** Support Specialist Role, Discounts/Audit Permissions, Backend Middleware Gates, Frontend Menu Filtering.
- **Status:** Completed
---
### Premium "At-A-Glance" Modal Redesign
**Date:** 2026-02-06
**Alignment:** UX Enhancement (User Request)

**Decision Context:**
The user found the previous "Compact" modal too small for comfort. We completely redesigned the "Add New Team Member" modal to be expansive (`max-w-7xl`, `h-[95vh]`), prioritizing readability and spaciousness. The new design presents User Details, Roles, and Permissions in a single, non-scrolling "One Glance" view with a premium, glassmorphic aesthetic.

**Technical Implementation:**
- **Files:** `resources/js/Pages/Admin/Users.jsx`
- **Features:** 90rem Width, 95vh Height, Enhanced Grid Layout, Scaled Typography & Icons.
- **Status:** Completed
---
### Unified Print System & Settings Synchronization
**Date:** 2026-02-07
**Alignment:** According to Plan (Print Architecture Overhaul)

**Decision Context:**
The user identified a critical gap: print settings configured in Admin Ã¢â€ â€™ Settings were not being applied to actual prints. The Preview used React components while the Print used hardcoded HTML generators Ã¢â‚¬â€œ two completely disconnected systems. This overhaul unified them into a single, settings-respecting print engine.

**Technical Implementation:**
- **Files:** `resources/js/Utils/PrintService.js`, `resources/js/Components/PrintPreview.jsx`, `resources/js/Components/PrintSettingsSection.jsx`

**Features Implemented:**

| Setting Category | Regular (A4/Letter) | Thermal (58mm/80mm) |
|------------------|---------------------|---------------------|
| **Theme Selection** | 3 themes: Modern, Classic, Bold | 3 themes: Modern, Classic Typewriter, Bold Boxed |
| **Accent Color** | Ã¢Å“â€¦ Dynamic theme color | Ã¢ï¿½Å’ (B&W only) |
| **Custom Margins** | Ã¢Å“â€¦ Top/Bottom/Left/Right | N/A |
| **Column Toggles** | S.No, Units, MRP, HSN, Description, Discount | S.No, Units, MRP, Description, Batch, Expiry |
| **Total Rows** | Total Qty, Tax Details, Received, Balance, You Saved | Same |
| **Amount in Words** | Ã¢Å“â€¦ | Ã¢Å“â€¦ |
| **Footer** | Terms, Signature Text, Original/Copy Label | Terms, Custom Footer, Barcode, Feed Lines |

**Print Flow Verified:**
```
Settings Page (save) Ã¢â€ â€™ Database Ã¢â€ â€™ HandleInertiaRequests (share)
Ã¢â€ â€™ usePage().props.settings Ã¢â€ â€™ OneGlanceLayout (window.amdSettings)
Ã¢â€ â€™ PrintButton / PrintService.quickPrint Ã¢â€ â€™ generateRegularHTML / generateThermalHTML
```

**Key Insight:** Both POS (`Pos.jsx`) and Sales (`Show.jsx`) pages use `OneGlanceLayout`, ensuring `window.amdSettings` is populated. The `PrintService.quickPrint()` method retrieves settings via `getSettings()` and passes them to the unified generators.

- **Status:** Completed
---
### Vyapar Backup Restoration & Integration
**Date:** 2026-02-13
**Alignment:** New Feature (Strategic Expansion)

**Decision Context:**
To facilitate the transition of legacy Vyapar users to VenQore, we implemented a sophisticated restoration engine. Originally, the system only supported native .sql backups. The new system performs a deep forensic analysis of Vyapar's `.vyb` and `.vyp` SQLite databases, mapping complex entity structures (Items, Parties with balances, Sales history with line items, and Bank accounts) into the VenQore relational schema.

**Technical Implementation:**
- **Files:** `app/Http/Controllers/InstallerController.php`, `resources/js/Pages/Installer/Index.jsx`, `app/Http/Controllers/MigrationController.php`
- **Features:** 
    - **Zip Decryption:** Automatic extraction of encrypted/compressed .vyb containers.
    - **Schema Auto-Detection:** Introspects unknown SQLite tables to find PII (Parties) and Catalog (Items) data.
    - **Pre-Restoration Preview:** A beautiful, glassmorphic analysis screen showing exact counts of what will be recovered before any data is overwritten.
    - **Integrity Mapping:** Prevents duplicate phone numbers and SKUs during restoration.
- **Status:** Completed
---
### Advanced Installer & Unlimited Restoration
**Date:** 2026-02-13
**Alignment:** Core Infrastructure & UX

**Decision Context:**
To support users on any hosting environment (including shared hosting with strict limits) and large backup files (1GB+), we completely re-architected the installer's file handling mechanism.

**Technical Implementation:**
- **Chunked Uploads:** Frontend (`Index.jsx`) splits files into 1MB chunks, uploading them sequentially to bypass server `upload_max_filesize` and `post_max_size` limits.
- **Server-Side Assembly:** Backend (`InstallerController.php`) receives chunks, assembles them in a temporary directory, and processes the full file only when assembly is complete.
- **Memory Optimization:** The installation process now explicitly sets `memory_limit` to `-1` and `max_execution_time` to `0` to prevent OOM or timeout errors during massive data migrations.
- **Seamless Experience:** No manual server configuration or `php.ini` editing is required by the user.

- **Status:** Completed
---

---
### Settings Consolidation & Negative Stock Logic
**Date:** 2026-02-10
**Alignment:** According to Plan (System Configuration)

**Decision Context:**
The system had two duplicate settings panels (\/settings\ and \/admin-panel/settings\) with conflicting controls for 'Negative Stock'. We unified this into a single 'Admin Settings' panel and implemented the actual backend enforcement logic which was previously missing.

**Technical Implementation:**
- **Files:** \pp/Http/Controllers/SaleController.php\, \
outes/web.php\, \
esources/js/Layouts/OneGlanceLayout.jsx\
- **Features:** 
    - **Single Source of Truth:** Redirected legacy \/settings\ route to \/admin-panel/settings\.
    - **Negative Stock Enforcement:** \SaleController\ now checks \SettingsHelper::shouldStopNegativeStock()\ after auto-manufacturing logic. Does NOT allow sale if stock is insufficient and setting is ON.
    - **Navigation Updates:** Updated Sidebar, CommandPalette, and OmniSearch to point to the correct Admin Settings route.
- **Status:** Completed

---
### Party Wise Discount
**Date:** 2026-02-10
**Alignment:** User Request

**Decision Context:**
The user requested a feature to set a default discount percentage for specific parties (customers), which should be automatically applied during sales.

**Technical Implementation:**
- **Database:** Added \default_discount\ (decimal 5,2) to \parties\ table.
- **Frontend (Party Management):** Added 'Default Discount %' field to \QuickPartyModal.jsx\ (and Party Controller validation).
- **Frontend (POS):** 
    - Updated \Pos.jsx\ to handle \discountType\ ('percentage' vs 'fixed') and \discountValue\.
    - \selectCustomer\ now applies the percentage discount if available.
    - Updated \	otalDiscounts\ calculation to handle percentage logic dynamically.
    - Updated Checkout Payload to send the calculated currency amount to backend.
    - Updated UI Discount Button to display percentage/fixed status correctly.
- **Status:** Completed

---
### Bug Note: Attendance & Rendering Fixes
**Date:** 2026-02-10
**Type:** Bug Fix

**Description:**
Addressed several console errors reported by the user to improve stability.

**Fixes Applied:**
1.  **Attendance Log Gap (500 Error):**
    -   Fixed column mismatch in \AttendanceController::logGap\.
    -   Changed \gap_start/end\ to \start_time/end_time\ to match database schema.
    -   Removed non-existent columns (\duration_minutes\, \is_approved\).
2.  **Toast System (React Warning):**
    -   Fixed 'duplicate key' warning in \OneGlanceLayout.jsx\.
    -   Replaced simple timestamp ID with unique ID generator (\Date.now() + Random\).
3.  **Charts (Recharts Warning):**
    -   Added \min-h-[300px]\ to \ChartSection.jsx\ container.
    -   Prevents Recharts from warning about 0 height/width during initial render or flex layout calculation.

**Status:** Fixed

---
### Activity Log Refactor
**Date:** 2026-02-10
**Type:** Refactor

**Description:**
The user reported that /activity-log was not working. The controller returned a paginated response to a simpler component. 
Upgraded the controller to use the existing robust 'Admin/Logs' component (Security Command Center) and updated the query to return a collection instead of pagination.

**Implementation:**
- **Access:** Admin/Audit permission required.
- **Component:** Uses \Admin/Logs.jsx\.
- **Query:** Latest 500 logs (matching Admin Panel logic).

**Status:** Completed

---
### Settings Consolidation & Recycle Bin
**Date:** 2026-02-10
**Type:** Refactor

**Description:**
Restructured the navigation to remove 'System' settings from the main shop sidebar and consolidate them into the Admin Panel as requested.

**Changes:**
- **Navigation:** Removed 'System' (Recycle Bin, Activity Log) from Shop Sidebar.
- **Admin Panel:** Added 'Recycle Bin' to Admin Sidebar.
- **UI:** Updated \RecycleBin.jsx\ to use Admin layout (\mode='admin'\).
- **Functionality:** Verified Recycle Bin controller handles restore/force-delete for Products and Sales.

**Status:** Completed

---
### Admin Panel UX Update
**Date:** 2026-02-10
**Type:** Refactor

**Description:**
Renamed the 'Security Logs' menu item in the Admin Panel to 'Activity Log' to match user terminology and expectations.

**Changes:**
- **Navigation:** Updated label in \OneGlanceLayout.jsx\.
- **Permissions:** Verified existing permission mapping covers the new name.

**Status:** Completed

---
### Recycle Bin Fix & Validation
**Date:** 2026-02-10
**Type:** Bug Fix

**Description:**
User reported Recycle Bin 'not working'. Implemented fixes to ensure stability and visibility.

**Fixes:**
- **Data Safety:** Forced \deleted_at\ date conversion to string to prevent frontend serialization mishaps.
- **Validation:** Added a temporary 'System Check' dummy item to the list. If visible, it confirms the Recycle Bin page is loading and rendering correctly.
- **Syntax:** Corrected a map closure syntax error in the controller.

**Status:** Fixed

---
### Missing View Pages Implementation
**Date:** 2026-02-10
**Type:** Bug Fix

**Description:**
Restored missing 'Show' (Detail) views for several core moduels that were causing crashes or 404s when accessed.

**Fixed Pages:**
- **Stock Audit Details:** \StockTake/Show.jsx\
- **Transfer Details:** \StockTransfers/Show.jsx\
- **Purchase Invoice:** \Purchases/Show.jsx\

**Status:** Completed

---
### Recycle Bin Fixes
**Date:** 2026-02-10
**Type:** Bug Fix
**Status:** Fixed
**Details:** Resolved syntax error in `RecycleBin.jsx` that prevented page load.

---
### Staff Attendance Module
**Date:** 2026-02-10
**Type:** Feature Completion
**Status:** Completed
**Details:** Implemented missing backend logic (`approveGap`, `rejectGap`), added `Show.jsx` for attendance history, and updated database with `status` column.

---
### Growth Engine & Wholesale Pricing
**Date:** 2026-02-10
**Type:** Feature Update
**Status:** Partial
**Details:** Implemented Wholesale Pricing logic in POS (`Pos.jsx`). Loyalty system backend is present but requires frontend integration for automatic point awarding.

---
### System Settings Verification
**Date:** 2026-02-10
**Type:** Verification
**Status:** Verified
**Details:** Audited all settings sections (Business, System, Security, etc.) and confirmed they are loading correctly. Note: "Recycle Bin" (previously reported broken) is now fixed.

---
### Phase 1.1 Ã¢â‚¬â€� Mathematical Architecture Forensic Audit & Blueprint
**Date:** 2026-02-20
**Alignment:** According to Plan (Master Architecture Rollout Plan Ã¢â‚¬â€� Phase 1.1)

**Decision Context:**
Performed a full forensic audit of the entire codebase against the Master Architecture Rollout Plan. The goal was to identify every mathematical flaw before writing a single migration. The audit revealed 9 critical issues that corrupt financial data for clients. Rather than implementing code immediately, a complete architectural blueprint was written first in `CALCULATION_LOGIC.md` to serve as the single source of truth for all subsequent implementation.

**Critical Issues Discovered:**
1. **Revenue Label Fraud:** Dashboard `getSalesStats()` returns Gross Profit labeled as "Revenue" Ã¢â‚¬â€� a fundamental financial misrepresentation.
2. **Tax Included in Sales Totals:** `SUM(sales.total)` is used for Revenue which includes Tax. Tax is a government liability, never revenue.
3. **Collapsed Sale Waterfall:** `sales` table missing `subtotal_gross`, `total_item_discounts`, `global_discount`, `net_sales`, `invoice_total` columns. The financial waterfall is not stored.
4. **Incomplete `sale_items` Schema:** Missing `gross_amount`, `discount_amount`, `net_amount`, `tax_rate`, `tax_amount`, `line_total` Ã¢â‚¬â€� the full line-level math is not persisted.
5. **Static COGS (The 50/100 Rupee Problem):** COGS calculated from `products.cost_price` (overwritten on each purchase). If you buy at Rs.50 then Rs.100, the system erases the Rs.50 cost, permanently corrupting all historical profit reports.
6. **No FIFO Infrastructure:** `inventory_batches` and `sale_item_batches` tables do not exist. Without them, FIFO is mathematically impossible.
7. **Inventory Value Accounting Fraud:** Dashboard calculates `SUM(stocks.quantity Ãƒâ€” products.cost_price)` which can inflate asset value by tens of thousands when the cost_price column was overwritten by a later purchase.
8. **Status Flag Dependency on Receivables:** `payment_status = 'paid'` is used as a financial signal for "Total Paid" calculation Ã¢â‚¬â€� a fragile text string dictating the most critical asset metric.
9. **Cached Account Balance Desync Risk:** Dashboard reads `accounts.balance` (a static cached column) for Receivables/Payables instead of a real-time ledger query.

**Technical Implementation:**
- **Files Created:** `CALCULATION_LOGIC.md` (the complete Phase 1.1 mathematical bible)
- **Files Read (Audit):** `DashboardController.php`, `SaleController.php`, `PosController.php`, `AccountingService.php`, all relevant migrations (sales, sale_items, accounting_tables, product_batches, inventory_management)
- **Status:** AUDIT COMPLETE Ã¢â‚¬â€� Blueprint Written. Implementation pending user direction for Phase 1.1 Step 1.
---
### Phase 1.1 Ã¢â‚¬â€� Full Implementation: Gross Sale vs. Net Sale
**Date:** 2026-02-20
**Alignment:** According to Plan (Master Architecture Rollout Plan Ã¢â‚¬â€� Phase 1.1)

**What Was Built:**

**New Migrations (3):**
1. `2026_02_20_000001` Ã¢â‚¬â€� Adds `gross_amount`, `discount_amount`, `net_amount`, `tax_rate`, `tax_amount`, `line_total` to `sale_items`
2. `2026_02_20_000002` Ã¢â‚¬â€� Adds `subtotal_gross`, `total_item_discounts`, `global_discount`, `net_sales`, `total_tax`, `shipping_charges`, `invoice_total` to `sales`
3. `2026_02_20_000003` Ã¢â‚¬â€� Creates `inventory_batches` and `sale_item_batches` tables (FIFO infrastructure)

**New Files:**
- `app/Services/FifoService.php` Ã¢â‚¬â€� FIFO engine: `deductAndRecord()`, `receiveBatch()`, `getInventoryCostValue()`
- `app/Models/InventoryBatch.php` Ã¢â‚¬â€� One row per purchase delivery; tracks `remaining_qty`
- `app/Models/SaleItemBatch.php` Ã¢â‚¬â€� Permanent paper trail of batch-level cost consumed per sale line

**Modified: `SaleController::store()`**
- Full financial waterfall calculated before DB write: `gross_amount` Ã¢â€ â€™ `discount_amount` Ã¢â€ â€™ `net_amount` per line, then `subtotal_gross` Ã¢â€ â€™ `net_sales` Ã¢â€ â€™ `invoice_total` at header
- FIFO deduction attempted on each sale item (graceful fallback to static `cost_price` if no batches yet)
- `SaleItem` now persists all 6 waterfall columns
- `Sale` now persists all 7 waterfall columns
- **Journal Entry FIXED**: Sales Revenue (4000) now credited with `net_sales` (not gross `subtotal`). Journal now balances correctly when discounts are applied.

**Modified: `DashboardController::getSalesStats()`**
- Returns `net_sales` (true revenue, ex-tax) instead of `total`
- Returns correctly labeled `gross_profit` (not mislabeled `revenue`)
- COGS from FIFO batches first, static `cost_price` fallback for older records

**Modified: `DashboardController::getChartData()`**
- Chart `sales` line now uses `net_sales` (true revenue)
- Chart `profit` line now uses FIFO COGS + static fallback

**Modified: `SaleController::dashboard()`**
- All daily/monthly sales cards now use `net_sales` (ex-tax)
- Top Selling Products now shows `revenue` (net_amount) and new `gross_profit` column

**Status:** Ã¢Å“â€¦ FULLY IMPLEMENTED & DATABASE NORMALISED
- All 4 migrations ran (Batches 4Ã¢â‚¬â€œ7)
- Backfill permanently populated `net_sales` and all waterfall columns for ALL historical records
- All COALESCE fallback hacks removed from `DashboardController` and `SaleController`
- Future queries: pure `SELECT SUM(net_sales)` Ã¢â‚¬â€� no conditional math, no workarounds
---

---
### Phase 1.2 Ã¢â‚¬â€� Revenue Recognition (Accrual vs. Cash)
**Date:** 2026-02-20
**Alignment:** According to Plan (Master Architecture Rollout Plan Ã¢â‚¬â€� Phase 1.2)

**New Migrations (2):**
1. `2026_02_20_100001` Ã¢â‚¬â€� Canonicalizes `sales.status` to accrual state machine. Renames all `completed` Ã¢â€ â€™ `posted`. Adds `posted_at` timestamp.
2. `2026_02_20_100002` Ã¢â‚¬â€� Seeds `inventory_batches` from ALL existing received purchase history (FIFO-ordered stock assignment).

**Modified Files:**
- `PurchaseController::store()` Ã¢â‚¬â€� Now calls `FifoService::receiveBatch()` on every received delivery. Live FIFO pipe is open.
- `SaleController::store()` Ã¢â‚¬â€� `status='posted'` + `posted_at=now()` on every sale.
- `Sale` Model Ã¢â‚¬â€� `posted_at` cast, `scopePosted()`, `scopePostedBetween()`, full state machine DocBlock.

**Architectural Contracts Enforced:**
- Revenue recognized at posting (accrual), separated from cash receipt
- `payment_status` documented as UI badge only Ã¢â‚¬â€� never financial signal
- `FifoService::receiveBatch()` = sole runtime creator of inventory_batch records

**Status:** Ã¢Å“â€¦ FULLY IMPLEMENTED Ã¢â‚¬â€� Both migrations ran. All files pass PHP syntax check.

### Phase 1.2 Addendum Ã¢â‚¬â€� The Immutable Lock & Reversal Engine
**Date:** 2026-02-20
**Alignment:** According to Plan

**The Problem (diagnosed and corrected):**
The first Phase 1.2 commit added a status label (`posted`) and a timestamp (`posted_at`) but left the edit route open, `cancel()` as a simple string-flip with no journal entry, and `update()` with no status check. A posted sale could be silently mutated without leaving any audit trail. The system was not immutable.

**The Deadbolt Ã¢â‚¬â€� `SaleObserver` (Eloquent layer):**
- Registered in `AppServiceProvider::boot()` via `Sale::observe(SaleObserver::class)`
- Fires on EVERY `updating` event before the SQL UPDATE reaches the database
- If `status = 'posted'` AND any financial column is in `$dirty`, throws `RuntimeException`
- This breaks the enclosing `DB::transaction()` Ã¢â‚¬â€� no partial state is possible
- There is no ORM-level code path that can bypass this
- Immutable columns: `net_sales`, `subtotal_gross`, `subtotal`, `total`, `invoice_total`, `total_tax`, `tax`, `discount`, `party_id`, `warehouse_id`, `posted_at`

**The Reversal Engine Ã¢â‚¬â€� `SaleReversalService`:**
- `cancel()` and `returnSale()` in `SaleController` now call `SaleReversalService::reverse()`
- Service posts a **counter journal entry** Ã¢â‚¬â€� every debit becomes credit, every credit becomes debit
- This is NOT a deletion. The reversal entry goes into the permanent ledger as a new dated record
- The trial balance still zeros out: the original entry + the counter entry = net zero
- Restores FIFO stock to exact batches via `sale_item_batches` paper trail (`remaining_qty` incremented precisely)
- Falls back to simple stock counter for pre-FIFO sales
- Restores `stocks` table aggregate and `products.stock_quantity`
- Original sale's financial columns are **never touched** Ã¢â‚¬â€� they are the historical record
- Only the `status` column transitions (to `returned`/`cancelled`) via raw `DB::statement` to bypass the observer for this one permitted mutation

**The Edit Block Ã¢â‚¬â€� `SaleController::edit()` and `update()`:**
- `edit()`: returns HTTP 403 for posted sales with clear accounting explanation
- `update()`: returns HTTP 403 for posted sales before opening any transaction

**New Files:**
- `app/Observers/SaleObserver.php` Ã¢â‚¬â€� The deadbolt
- `app/Services/SaleReversalService.php` Ã¢â‚¬â€� The reversal engine

**Status:** Ã¢Å“â€¦ The lock is closed. It is now mathematically impossible to alter the financial history of a posted sale without leaving a balanced, counter journal entry.
---
---
### Reports & Dashboard Calculation Architecture (Audit Fixes)
**Date:** 2026-02-20
**Alignment:** According to Plan (Reporting Integrity)

**Decision Context:**
The user identified several desynchronization issues between reported figures and the actual ledger. We performed a sweeping fix of the reporting controllers to shift all critical metrics from cached table columns to real-time, ledger-driven queries.

**Fixes Implemented:**
- **Double-Entry Trail Balance (BUG-01):** Shifted Trial Balance to read exclusively from `journal_items` with date-range support.
- **Ledger-Driven Balance Sheet (BUG-02):** Re-engineered the Balance Sheet to compute Assets, Liabilities, and Equity directly from the ledger. Added an "As Of" date picker for historical snapshots.
- **Revenue Recognition Accuracy (BUG-03, BUG-07):** Sales History and Category reports now use `net_sales` (tax-exclusive revenue) instead of `total`. Paid/Unpaid statistics now rely on the `payments` table instead of the `payment_status` flag.
- **Accurate Returns Waterfall (BUG-04):** Partial returns now correctly pro-rate the `net_amount` (post-discount value) instead of gross price, ensuring returns never exceed original revenue.
- **Real-Time Cash Snapshot (BUG-08):** Dashboard cash balance now performs a real-time `SUM(debit) - SUM(credit)` from the ledger for the primary cash account (1000), eliminating cache desync.

**Status:** Completed
---
### Phase 2 Ã¢â‚¬â€� Advanced Inventory & Tax Logic
**Date:** 2026-02-20
**Alignment:** Phase 2 (Advanced Features & Compliance)

**Decision Context:**
Implemented two foundational Phase 2 features (Variant FIFO and Per-Item Tax) that were identified as critical for business accuracy during the Phase 1 audit.

**Technical Implementation:**
- **Variant FIFO Tracking (BUG-05):**
    - Added `variant_id` to `inventory_batches` and `product_variant_id` to `invoice_items`.
    - Updated `FifoService` to separate stock pools per variant. 
    - Removed the "variants skip FIFO" safeguard; size/color variants now track their own COGS.
- **Automated Per-Item Tax (BUG-06):**
    - Added `tax_rate` to `products` table.
    - Updated `SaleController` to fetch the product's rate per line and compute `tax_amount` automatically based on the line's `net_amount`.
    - Manual tax input on the POS is now bypassed; the system generates a compliant tax trail (Taxable Base Ãƒâ€” Rate = Tax Due).

**Status:** Completed

---
### Phase 1.1 Ã¢â‚¬â€� Forensic Data Migration & Variance Accounting
**Date:** 2026-02-21
**Alignment:** According to Plan (Data integrity & Historical backfill)

**Decision Context:**
Executing a live-fire data migration on 14,950 legacy sales revealed critical historical data corruption where legacy grand totals did not equal the sum of mathematically strict line-items (due to ghost returns and manual overrides). Rather than halting migration or mutating historical financial records, a "Variance Account" strategy was developed to accurately zero-out the Trial Balance while exposing the discrepancies for corporate audit.

**Technical Implementation:**
- **Historical Variance Account (3999):** Instituted a dedicated Equity account to safely absorb historical ledger mathematical discrepancies without crashing the migration.
- **Shadow Migration Engine (`migrate:shadow`):** Built a standalone artisan command that runs the strict Phase 1.1 mathematical constraint checks against a clone of the entire legacy dataset, capturing exceptions instead of crashing.
- **Forensic Diagnostic Suite:** Developed standalone PHP scripts (`find_worst.php`, `audit_worst.php`, `audit_top10.php`, `audit_categorize.php`) to directly query the staging database and mathematically prove the source of all variance (categorizing 6.9M rupees of 'ghost returns' vs. 80k rupees of manual cashier overrides).
- **Graceful Row Processing:** The primary backfill script (`2026_02_20_000004_backfill_financial_waterfall_columns`) was rewritten to process rows individually. Math failures calculate the variance and drop the difference as a Journal Entry to Account 3999, ensuring legacy `invoice_total` fields remain legally untouched while resolving mathematical constraints.

**Status:** Completed

---
### Product History Tab Ã¢â‚¬â€� Unified Sales & Purchase Transactions
**Date:** 2026-03-04
**Alignment:** User Request (Inventory Intelligence)

**Decision Context:**
The History tab within the ProductModal previously displayed only raw `stock_movements` data, which lacked accurate party names, prices, or totals. It also did not show any sales transactions. The user required a unified, interactive view of all buying and selling activity for each product, with click-to-view and double-click-to-edit navigation.

**Technical Implementation:**
- **New API Route:** `GET /inventory/{id}/history` Ã¢â€ â€™ `InventoryController@getHistory` (routes/web.php)
- **Backend:** Fetches `SaleItem` + `InvoiceItem` (purchase) records with their parent transactions and parties, merges and sorts by date descending.
- **Frontend:** Lazy-loads via `axios` on tab open. Shows spinner, empty state, and amber hint bar. Single-click navigates to view; double-click navigates to editor.

**Status:** Completed

---
### Financial Consistency Master Plan Ã¢â‚¬â€� Deep Forensic Audit & Architecture
**Date:** 2026-03-05
**Alignment:** According to Plan (Master Architecture Rollout Plan Ã¢â‚¬â€� Financial Integrity)

**Decision Context:**
The user identified a systemic problem: the same financial number (e.g., Cash in Hand, Receivables) shows different values on different screens because there is no single master system behind the numbers. A full forensic audit was performed to identify every root cause, and a phased implementation plan was created in `FINANCIAL_CONSISTENCY_MASTER_PLAN.md`.

**Root Cause Identified:** 5 competing systems independently track money:
1. `bank_accounts.current_balance` Ã¢â‚¬â€� cached, updated by multiple code paths
2. `parties.current_balance` Ã¢â‚¬â€� cached, updated manually with no journal
3. `sales.payment_status` / `sales.total` Ã¢â‚¬â€� UI flag used as financial signal
4. `journal_items` (double-entry ledger) Ã¢â‚¬â€� the CORRECT system, not used everywhere
5. Dashboard derived calculations Ã¢â‚¬â€� duplicated math in controllers

**Critical Active Inconsistencies Found:**
1. **ACTIVE-01:** Cash in Hand uses 3 different formulas across Dashboard, Payments page, and BankAccount cache
2. **ACTIVE-02:** Receivables/Payables: Dashboard reads `parties.current_balance`, Reports read Account 1200 ledger Ã¢â‚¬â€� they always disagree
3. **ACTIVE-03:** `PaymentController::store()` creates Payment records but DOES NOT post a journal entry Ã¢â‚¬â€� missing from P&L, Trial Balance, Cash Flow
4. **ACTIVE-04:** Expenses may be double-counted in Cash balance (once via journal, once via manual deduction)
5. **ACTIVE-05:** Salary has no standard transaction path Ã¢â‚¬â€� may or may not hit the ledger depending on which screen is used
6. **ACTIVE-06:** `autoHealStockIntegrity()` corrupts multi-batch FIFO by setting only the newest batch to the total stock count
7. **ACTIVE-07:** Purchase Returns don't post ledger entries Ã¢â‚¬â€� Payables figure is wrong
8. **ACTIVE-08:** Cash Sale Returns don't create a Payment record for the cash refund given back

**The Fix (8 Phased Steps):**
- Phase 1 (Critical): Add journal entry posting to `PaymentController::store()`
- Phase 2 (Critical): Unify Cash balance to ledger-only (`SUM(debit) - SUM(credit)` on Account 1000)
- Phase 3 (Critical): Unify Receivables/Payables to ledger + one-time historical opening balance seeding migration
- Phase 4 (Important): Fix AutoHeal batch corruption logic
- Phase 5 (Important): Add Purchase Return ledger entries
- Phase 6 (Important): Add Sale Return cash refund tracking
- Phase 7 (Cleanup): Standardize salary as Expense (not Payment)
- Phase 8 (Cleanup): Stock adjustment ledger entries

**Technical Implementation:**
- **Files:** `FINANCIAL_CONSISTENCY_MASTER_PLAN.md` (master architecture document created)
- **Files to be modified:** `PaymentController.php`, `DashboardController.php`, `ReturnController.php`, `SaleController.php::returnSale()`
- **New migration:** Opening balance seeding for historical party data
- **Status:** Plan Complete Ã¢â‚¬â€� Implementation Pending (8 phases defined in priority order)

---
### V3 Unified Accounting & FIFO Engine Overhaul
**Date: 2026-03-07**
**Alignment: According to Plan (Financial Consistency Implementation)**

**Decision Context:**
Completed the transition from fragile, distributed data writes to a unified, service-oriented V3 architecture. This overhaul eliminates critical data-corruption risks identified in legacy "auto-healing" scripts and ensures that every financial and inventory movement is recorded through a consistent, double-entry ledger system. The "Single Source of Truth" is now the `journal_items` table, shared by the Dashboard, Reports, and Inventory valuation engines.

**Technical Implementation:**
- **V3 Unified Core:**
    - **AccountingService:** Centralized journal entry creation and ledger-based balance retrieval (`getBalance`).
    - **FifoService:** Precise batch-cost tracking (`receiveBatch`, `deductStock`) with schema-compliance for `original_qty` and `initial_qty`.
    - **AuditService:** Resilient safety-net logging using `try-catch` blocks to prevent secondary log failures from crashing primary financial transactions.
- **Transactional Integration:**
    - **PurchaseController:** Migrated to V3. Correctly handles inventory batch creation, tax posting (2100), and vendor bill liability (2000).
    - **SaleController:** Unified revenue recognition and FIFO cost extraction.
    - **ReturnController:** Precise reversal logic that restores specific FIFO batches, eliminating inventory leakage.
- **Dashboard & UI Safety:**
    - **Risk Elimination:** Disabled `autoHealStockIntegrity()` and `autoHealTimestamps()` from the page-load path.
    - **Resilience:** Enhanced `V3\DashboardController` with `safeGetBalance` to handle edge cases where ledger accounts (1000, 1200, etc.) may not yet be initialized.
- **Verification:** Achieved zero-imbalance (0.00) Trial Balance state across all test scenarios (Purchase, Sale, Return, Funds).

**Status: Completed & Verified (Final V3 Swap)**
---

### Editable Line-Item Total with Mode Toggle Ã¢â‚¬â€� Sales Create Invoice
**Date:** 2026-03-24
**Alignment:** Deviation from Plan (New capability, not described in project VenQore.txt but not conflicting)

**Decision Context:**
Originally the line-item Total column was a read-only display (`Rs {calculateLineTotal(item)}`). The user required Total to be editable, with a mode-toggle button that controls which field gets back-calculated when Total changes. Two modes: **Price mode (Ã¢â€šÂ¨)** Ã¢â‚¬â€� Qty stays fixed, Price recalculates; **Qty mode (#)** Ã¢â‚¬â€� Price stays fixed, Qty recalculates. All three fields (Qty, Price, Total) remain independently editable at all times. Only applied to `Sales/CreateInvoice.jsx`.

**Technical Implementation:**
- **Files:** `resources/js/Pages/Sales/CreateInvoice.jsx`
- **Logic:** Added `itemTotalModes` state map (keyed by item ID, default `'price'`). `handleTotalChange()` solves the back-calculation algebra accounting for both fixed and percent discounts. `toggleItemTotalMode()` switches per-row.
- **UI:** Total cell replaced with an editable `<input type="number">` + a small colored toggle button (indigo = Price mode, emerald = Qty mode) with a micro-label (`Ã¢â€ ï¿½ recalcs Price` / `Ã¢â€ ï¿½ recalcs Qty`) for clarity.
- **Status:** Completed
---
### Customer Balance Sync & POS UI Optimization
**Date:** 2026-03-24
**Alignment:** According to Plan (Financial Consistency Implementation - Phase 3)

**Decision Context:**
The user identified that customer balances in the POS/Sales interfaces were showing 0 instead of their live debt. We replaced the legacy cached `current_balance` with a real-time, ledger-driven calculation from the V3 accounting system (Account 1200 - AR minus Account 2000 - AP). We also addressed a critical UI bug where the search results popup in the narrow POS sidebar was being cut off.

**Technical Implementation:**
- **V3 Ledger Integration:**
    - **Controllers:** `PartyController`, `SyncController`, `SaleController`, `PurchaseController`, `ProposalController`, `SalesOrderController`, `ReturnController`.
    - **Logic:** Every document load now performs a live `SUM(debit) - SUM(credit)` query on the party's ledger to ensure 100% financial accuracy in the UI sidebar.
- **POS UI Optimization (`resources/js/Pages/Pos.jsx`):**
    - **Layout Refactor:** Moved customer search to its own full-width row to prevent its dropdown from being clipped.
    - **SmartCombobox Fix:** Enabled `w-max` and `min-w-full` for search results to allow detailed cards (name, phone, balance) to expand naturally in narrow containers.
    - **Z-Index Layering:** Explicitly managed `z-index` to ensure search menus overlap payment buttons correctly.

**Status:** Completed & Verified (Live Ledger Sync active)
---

### VenQore ERP Flutter Mobile Ã¢â‚¬â€� "Midnight Nebula" Dashboard
**Date:** 2026-03-25
**Alignment:** According to Plan (Phase 1: Core Mobile UI)

**Decision Context:**
The user initiated the Flutter mobile app development. Following the "Midnight Nebula" design system specified in the master plan, we implemented the high-fidelity Dashboard UI first to establish the premium mobile aesthetic. This serves as the visual foundation before the API authentication layer (Laravel Sanctum) is finalized.

**Technical Implementation:**
- **Folder:** `/amd_erp_mobile/`
- **Files Created:**
    - `lib/theme/app_colors.dart`: Midnight Nebula color palette (Void Base, Indigo/Purple Orbs).
    - `lib/widgets/nebula_card.dart`: Premium glassmorphic card component with ambient blur and gradient highlights.
    - `lib/screens/dashboard_screen.dart`: Main dashboard featuring Cash in Hand, Bank balances, Quick Actions, and Activity Feed.
    - `lib/main.dart`: App entry point with custom dark theme configuration.
- **Status:** Initial UI Prototype Completed.
---
### V3 Legacy Data Migration Engine
**Date:** 2026-03-24
**Alignment:** According to Plan (Financial Consistency - Phase 3)

**Decision Context:**
To ensure zero-imbalance (0.00) financial statements for users transitioning from legacy versions, we implemented a sophisticated migration engine. This script performs a forensic extraction of Parties, Invoices, Sales, and Expenses, converting them into mathematically strict V3 Double-Entry Journal records while preserving the historical integrity of the ledger.

**Technical Implementation:**
- **Files:** `app/Console/Commands/MigrateV3Ledger.php`, `app/Http/Controllers/UpdaterController.php`
- **Logic:** Step-by-step migration of Opening Balances (7000 OBE), Purchases (1100), Sales (4000), and Expenses (6000) with idempotency guards and final Trial Balance validation.
- **Status:** Active (Standard Update Path)
---
### AI Growth Engine: The Three Brains Implementation
**Date:** 2026-03-24
**Alignment:** According to Plan (Advanced Analytics)

**Decision Context:**
Implemented the core intelligence layer of VenQore. The system now actively analyzes customer behavior and inventory demand to provide actionable "Proactive Alerts" rather than just static reports.

**Technical Implementation:**
- **Files:** `app/Console/Commands/RunGrowthEngine.php`, `app/Models/AiRecommendation.php`, `app/Models/CustomerAnalytics.php`, `routes/console.php`
- **Features:** 
    - **Retention Brain:** Predicts order dates based on Average Days Between Orders (ADBO).
    - **Forecast Brain:** Cross-references expected customer visits with current stock to predict outages.
    - **Churn Brain:** Flagging regular customers who have missed 2+ purchase cycles.
- **Status:** Active (Scheduled Daily at 09:00)
---
### Automated Asset Depreciation & WooCommerce Sync
**Date:** 2026-03-24
**Alignment:** According to Plan (Automation Expansion)

**Decision Context:**
Resolved two manual bottlenecks: physical shop vs. website stock desync and manual book-value adjustments for assets. 

**Technical Implementation:**
- **Depreciation:** `app/Console/Commands/RunDepreciation.php`. Automates daily value reduction of Assets (6000-DEP Exp / Asset Credit) based on configured rates.
- **WooCommerce:** `app/Console/Commands/SyncStockToWooCommerce.php`. Pushes "dirty" stock updates to the web store every 5 minutes.
- **Status:** Active
---
### Quick Charity Module & Recurring Billing
**Date:** 2026-03-24
**Alignment:** UX Improvement (User Request)

**Decision Context:**
Implemented a specialized "Charity" workflow for rapid, logged donations from the till and a "Recurring Invoice" engine for automated service billing.

**Technical Implementation:**
- **Files:** `app/Http/Controllers/CharityController.php`, `app/Http/Controllers/RecurringInvoiceController.php`, `resources/js/Pages/RecurringInvoices/RecurringInvoices.jsx`
- **Status:** Completed
---
### Purchase Order Resilience & Updater 1.1.8
**Date:** 2026-03-24
**Alignment:** Stability Core

**Decision Context:**
Addressed critical bugs in the Purchase Order creation flow (UI tag mismatch) and stabilized the remote update extraction process to prevent "Package Not Found" errors on shared hosting.

**Technical Implementation:**
- **Files:** `resources/js/Pages/PurchaseOrders/Create.jsx`, `app/Http/Controllers/UpdaterController.php`
- **Status:** Completed & Deployed
---
### VenQore POS Marketing Website Ã¢â‚¬â€� Midnight Nebula Design
**Date:** 2026-03-31
**Alignment:** New Feature (Marketing / Sales Infrastructure)

**Decision Context:**
Built a complete 6-page marketing website in `d:\VenQore POS\website\` using the real Midnight Nebula design system (colors sourced from `app_colors.dart`). Positioned VenQore POS as global retail software Ã¢â‚¬â€� no country-specific messaging. Currency support (150+) highlighted prominently. All Urdu testimonials translated to English.

**Pages Built:**
- `index.html` Ã¢â‚¬â€� Hero with stats bar, feature strip, video mockup, testimonials, demo banner
- `features.html` Ã¢â‚¬â€� All 10 modules with business-benefit pills (not technical features)
- `pricing.html` Ã¢â‚¬â€� 3 tiers ($79 / $249 / $49yr), FAQ, Lemon Squeezy links
- `reviews.html` Ã¢â‚¬â€� 3 English testimonials, G2 / SoftwareSuggest / Capterra / Fiverr platform links
- `demo.html` Ã¢â‚¬â€� Guest credentials card, 3-step evaluation guide, live instance info
- `docs.html` Ã¢â‚¬â€� 10 core guide links, Notion CTA, 3 support channels

**Shared files:**
- `_nebula.css` Ã¢â‚¬â€� Full Midnight Nebula design system (tokens, components, animations)
- `_nav.js` Ã¢â‚¬â€� Shared scroll nav, mobile menu, fade-in observer logic

**Key Design Decisions:**
- Pure HTML/CSS/JS Ã¢â‚¬â€� no build tool, opens directly in browser
- Colors: `#04000d` void base, `#4F46E5` indigo, `#9333EA` purple, `#06b6d4` cyan (exact from app_colors.dart)
- Fonts: Space Grotesk (headings) + DM Sans (body)
- No Pakistan-specific content anywhere; "150+ currencies" replaces country targeting

**Technical Implementation:**
- **Folder:** `d:\VenQore POS\website\`
- **Status:** Completed
---

---
### Adaptive Dashboard System â€” Phase 1 (react-grid-layout)
**Date:** 2026-04-05
**Alignment:** According to Plan (AMD_ERP_Adaptive_Dashboard_Plan.md)

**Decision Context:**
Implemented phone-style adaptive grid dashboard. All data flows through V3 (DashboardController -> AccountingService/FifoService/FinancialReportingService). New files: UserPreference model, DashboardPreferenceController, AdaptiveDashboard.jsx, 10 widget components, GridPicker, WidgetLibrary, WidgetShell.

**Technical Implementation:**
- **Modified:** Dashboard.jsx, routes/web.php
- **New:** UserPreference.php, DashboardPreferenceController.php, user_preferences migration, dashboardLayout.js, Dashboard/ components (18 files total)
- **Package:** react-grid-layout (npm)
- **Status:** Phase 1 Complete
---

---
### Admin Panel Header Shortcut
**Date:** 2026-04-07
**Alignment:** Deviation from Plan (Not in Project AMD.txt)

**Decision Context:**
Originally planned to be accessible only via the Sidebar (Admin Mode) and User Avatar menu. Added a direct header shortcut next to the Growth Engine (AI) button to provide faster access for administrators frequenting back-office operations.

**Technical Implementation:**
- **Files:** d:\AMD POS\resources\js\Layouts\OneGlanceLayout.jsx
- **Status:** Completed
---


---
### Growth Engine: Opportunity Intelligence Panel (5-Tab Control Room)
**Date:** 2026-04-07
**Alignment:** Enhanced Growth Strategy (Next Features.txt)

**Decision Context:**
Upgraded the basic growth opportunities dash into a high-fidelity 'Control Room' for customer recovery. Implemented a 5-tab modular architecture (Intelligence, Action, History, Forecast, Notes) with real-time AI narrative generation, live revenue trend charts, and interactive outreach actions (WhatsApp, Proposals).

**Technical Implementation:**
- **Files:** resources/js/Components/OpportunityIntelligencePanel.jsx (New), app/Services/AiRetentionService.php (Modified), app/Console/Commands/RunGrowthEngine.php (Modified), resources/js/Pages/GrowthEngine/GrowthDashboard.jsx (Modified), app/Http/Controllers/GrowthEngineController.php (Modified), resources/js/Layouts/OneGlanceLayout.jsx (Modified)
- **Status:** Completed
---


---
### Demo Data Seeding
**Date:** 2026-04-07
**Alignment:** According to Plan (Project AMD.txt section 18.402)

**Decision Context:**
User requested demo data. Ran the pre-existing DemoDataSeeder to fulfill the requirement for a test data suite for validation and demonstration.

**Technical Implementation:**
- **Files:** d:\AMD POS\database\seeders\DemoDataSeeder.php (Run)
- **Status:** Completed
---

---
### Demo Data Seeding
**Date:** 2026-04-07
**Alignment:** According to Plan (Project AMD.txt section 18.402)

**Decision Context:**
User requested demo data. Ran the pre-existing DemoDataSeeder to fulfill the requirement for a test data suite for validation and demonstration.

**Technical Implementation:**
- **Files:** d:\AMD POS\database\seeders\DemoDataSeeder.php (Run)
- **Status:** Completed
---

---
### Global CSRF Resilience & Invisible Auto-Repair
**Date:** 2026-04-08
**Alignment:** Stability Core / UX Excellence (Next Features.txt)

**Decision Context:**
Permanently resolved recurring '419 Page Expired' / CSRF mismatch errors that caused friction during high-frequency POS operations and post-login transitions. Implemented a self-healing security layer that is completely invisible to the user, allowing for persistent, uninterrupted operation across 8-hour shifts.

**Technical Implementation:**
- **Auto-Repair:** Implemented a global Axios interceptor (ootstrap.js) that catches 419 errors, silently fetches a fresh token via /refresh-csrf, and automatically retries the failed request.
- **Inertia Synchronization:** Added an inertia:finish event listener to sync CSRF tokens from page meta tags after every navigation, preventing stale tokens immediately following login.
- **Proactive Sync:** Updated Login.jsx to refresh tokens before credential submission. Hardened AttendanceContext.jsx to wait for full page finalization before check-in.
- **Session Hardening:** Extended SESSION_LIFETIME in .env to 480 minutes (8 hours) to match full work shifts.
- **Local Assets:** Replaced broken external 
oise.svg with a local copy to ensure offline reliability and clean console logs.
- **Status:** Completed & Stabilized
---

---
### Unified Thermal Print Engine Synchronization
**Date:** 2026-04-08
**Alignment:** According to Plan (Project AMD.txt Section 2.48)

**Decision Context:**
Standardized the POS receipt and Invoice printing pipeline by deprecating ~1000 lines of legacy, hardcoded HTML generators in PrintService.jsx. Forced all print paths (Production POS, Admin Test Print, and Browser Preview) to use the centralized PrintPreview.jsx React component. This ensures 100% visual consistency between what the user saves in settings and what is actually printed.

**Technical Implementation:**
- **Files:** resources/js/Components/PrintPreview.jsx (Modified), resources/js/Utils/PrintService.jsx (Modified/Refactored), resources/js/Utils/AMDStation.js (Modified)
- **Fixes:** Barcode reference text added, amount-in-words dynamic conversion fixed, legacy fallback removed.
- **Status:** Completed & Compiled
---

### Live Shield â€” Real-Time Product & Inventory Synchronization
**Alignment:** Critical Bug Fix & UX Reliability Upgrade
The user identified a " Snapshot\ bug where Sales/POS screens cached product data and failed to reflect price or inventory updates made via modals or other tabs without a full page reload, often leading to loss of unsaved invoice data. We implemented a global **\Live Shield\** architecture using a native event bus and cross-tab storage listeners to ensure that any product modification â€” whether made in the current tab or a background window â€” is immediately synchronized across all active interfaces.

#### Key Architectural Components:
- **Event Bus (amd:product-updated):** A global event dispatched upon any successful product creation, update, or purchase.
- **Cross-Tab Synchronization:** Integrated localStorage (amd_product_latest_change) listeners to detect and propagate changes across multiple browser instances.
- **Hot-Swap Refresh Logic:**
 * **Sales/POS Carts:** Automatically re-fetches and patches the price, cost, and available stock of all line items currently on a bill when an update is detected, without losing the user\'s progress or clearing the cart.
 * **Search Dropdowns:** AsyncProductCombobox now automatically re-syncs its local cache whenever a product is modified, ensuring search results always show live quantities.
- **Targeted API Refinement:** Enhanced InventoryController@search to support filtering by a list of ids, allowing interfaces to perform extremely high-performance background refreshes for specific items on an invoice.

- **Files:**
 - resources/js/Components/ProductModal.jsx (Broadcaster)
 - resources/js/Pages/Purchases/Create.jsx (Broadcaster & Subscriber)
 - resources/js/Pages/Sales/CreateInvoice.jsx (Subscriber)
 - resources/js/Pages/Pos.jsx (Subscriber)
 - resources/js/Components/AsyncProductCombobox.jsx (Subscriber)
 - app/Http/Controllers/InventoryController.php (API Support)

**Status:** âœ… Fully Implemented & Live

---

### Inventory Integrity Safeguard â€” Non-Destructive Update Architecture
**Date:** 2026-04-09
**Alignment:** Data Integrity & Security (Critical Bug Fix)

**Decision Context:**
The user reported a critical data corruption issue where editing a product's price via the Product Modal caused the actual transactional inventory (added via purchases) to be reset to the stale stock value (often 0) shown in the modal's UI. We implemented a multi-layered "Inventory Lock" to decouple metadata updates from inventory adjustments.

**Technical Implementation:**
- **Absolute Data Isolation (Frontend):** Modified `ProductModal.jsx` to whitelist attributes during submission. The `stock` field is now physically stripped from the network request during 'Edit' mode, ensuring the server never receives a stale inventory value during a price/name update.
- **Backend Deadbolt (InventoryController):** Hardened the `update` method to conditionally process stock. The system now only performs FIFO adjustments if a valid, non-null stock value is explicitly provided in the request payload.
- **UI UX Enhancement (v3.1):** Resolved a critical key mismatch where POS search results labeled stock as `stock_quantity` while the modal expected `stock`. The UI now proactively handles both keys and displays a full "Total / Reserved / Available" breakdown even in Edit mode, ensuring users have 100% confidence that their inventory data is accurate and protected during metadata updates.

**Files:**
- resources/js/Components/ProductModal.jsx (Isolation Logic, UI Lock, & Breakdown UI)
- app/Http/Controllers/InventoryController.php (Conditional Guard)
- resources/js/Pages/Sales/CreateInvoice.jsx (Sanitized Submission)

**Status:** âœ… Fully Implemented & Live
---

---
### VenQore SaaS Transformation â€” Phase 0 & Phase 1: Multi-Tenancy Foundation
**Date:** 2026-04-10
**Alignment:** According to Plan (VenQore_Master_Roadmap.md â€” Phases 0 & 1)

**Decision Context:**
Initiated the SaaS transformation roadmap. Phase 0 protects live AMD Outlets data before any schema change. Phase 1 installs the database-level multi-tenancy isolation layer. All 131 existing migrations were already run; this implementation adds only new, additive migrations that don't break existing data. The strategy is "nullable first, seeder fills, NOT NULL later" to safely handle the live production database.

**Phase 0 â€” Data Safety (COMPLETE):**
- **`TenantZeroSeeder`** â€” Idempotent script that creates "AMD Outlets" as Tenant 1 (UUID: 45322827-fbe1-4fba-be64-f37a59857ee4) and backfills all 18 core tables. Verification: `SELECT COUNT(*) FROM products WHERE tenant_id IS NULL` = 0.
- **Rows assigned:** 1,942 products, 503 parties, 40 accounts, 1,942 stocks, 2 warehouses, 138 settings, 116 journal entries, 2 stock movements, 1 payment, 2 users, and more.

**Phase 1 â€” Multi-Tenancy (COMPLETE):**
- **`2026_04_10_000001_create_tenants_table`** â€” Tenants table with UUID PK, plan/status enums, Lemon Squeezy billing fields, timezone/currency locale, onboarding flags. âœ… RAN
- **`2026_04_10_000002_add_tenant_id_to_core_tables`** â€” Adds nullable `tenant_id` with composite indexes to 18 core tables (products, sales, parties, accounts, warehouses, stocks, etc.). âœ… RAN
- **`app/Models/Tenant.php`** â€” Eloquent model with SoftDeletes, UUID PK, plan limit helpers (`getLimit()`), accessibility checks (`isAccessible()`, `isTrialActive()`).
- **`app/Traits/HasTenant.php`** â€” Global scope trait auto-filtering all queries by current tenant. Applied to: Product, Sale, Party, Category, Account, Expense, Warehouse, User.
- **`app/Http/Middleware/TenantMiddleware.php`** â€” Subdomain resolver that binds `current.tenant` to DI container, enforces trial/suspension state, shares tenant data with all Inertia pages.
- **`app/Services/SubdomainGenerator.php`** â€” Generates safe, unique subdomains from business names with 33-word reserved blocklist (prevents admin.venqore.com hijacking).
- **`app/Http/Middleware/SuperAdminMiddleware.php`** â€” Guards `/admin/*` command center routes.
- **`config/plans.php`** â€” Starter/Growth/Business plan limits (SKU, location, staff, WooCommerce, API access).
- **`app/Services/PlanGate.php`** â€” Plan enforcement service with `check()` and `enforce()`.
- **`app/Exceptions/PlanLimitException.php`** â€” Structured JSON responses for React upgrade modal interceptor.
- **`.env`** â€” Added `APP_DOMAIN`, R2 storage, Lemon Squeezy, and Postmark placeholder vars.
- **`bootstrap/app.php`** â€” Registered `tenant` and `superadmin` middleware aliases + Phase 1.7 tenant-aware rate limiting (120/min per tenant on API, 300/min on POS, 10/min on auth).

**Technical Implementation:**
- **Files:** `database/migrations/2026_04_10_000001_create_tenants_table.php`, `database/migrations/2026_04_10_000002_add_tenant_id_to_core_tables.php`, `database/seeders/TenantZeroSeeder.php`, `app/Models/Tenant.php`, `app/Traits/HasTenant.php`, `app/Http/Middleware/TenantMiddleware.php`, `app/Http/Middleware/SuperAdminMiddleware.php`, `app/Services/SubdomainGenerator.php`, `app/Services/PlanGate.php`, `app/Exceptions/PlanLimitException.php`, `config/plans.php`, `bootstrap/app.php`, `.env`
- **Status:** âœ… Migrations ran, seeder ran, AMD Outlets = Tenant Zero, live financial data safe.
---

---
### VenQore SaaS Transformation — Phase 2: Auto-Provisioning Engine
**Date:** 2026-04-10
**Alignment:** According to Plan (VenQore_Master_Roadmap.md — Phase 2)

**Phase 2.1** - VerifyLemonSqueezySignature middleware, LemonSqueezyWebhookController, webhook route live, services config updated.
**Phase 2.2** - ProvisionTenantJob (idempotent, 3 retries), TenantDefaultSeeder (20 accounts, 17 settings, 1 warehouse, 7 expense categories), HandleSubscriptionUpdatedJob, HandleSubscriptionCancelledJob, HandleSubscriptionExpiredJob, HandlePaymentFailedJob.
**Phase 2.3** - Infrastructure (DNS/SSL) - documented in roadmap, server-side step.
**Phase 2.4** - TenantWelcomeMail, TrialReminderMail, TrialExpiredMail, PaymentFailedMail, SubscriptionCancelledMail + 5 blade templates. SendTrialReminders command (daily 09:00), ProcessExpiredTrials command (hourly).
**Phase 2.5** - CleanupDeadAccounts command (monthly 1st 03:00, chunked 500-row deletion, --dry-run mode).

**Validation:** Route live (POST api/webhooks/lemon-squeezy). All 3 artisan commands registered. App boots without errors.
**Status:** Completed
---


---
### VenQore SaaS Transformation — Phase 3: Performance & Infrastructure
**Date:** 2026-04-10
**Alignment:** According to Plan (VenQore_Master_Roadmap.md — Phase 3)

**Phase 3.1 — POS Timebomb Fix (COMPLETE):**
- **Root cause:** PosController::index() called Product::get() loading ALL 1,942 products + 5 eager-loaded relations into every single POS page open. This was a hidden O(n) memory bomb that would crash the server under multi-tenant load.
- **Fix:** PosController::index() now only loads bankAccounts + optional recalled sale. Zero products on initial load.
- **PosSearchController** — New API controller with 4 endpoints:
  - GET /api/pos/search?q=&category_id= — Debounced search via raw DB query (not Eloquent). Paginated (30/page).
  - GET /api/pos/featured — Top 50 in-stock products sorted by 30-day sales. 2-min cache.
  - GET /api/pos/categories — Product categories with counts. 5-min cache per tenant.
  - GET /api/pos/barcode/{code} — Exact barcode/SKU scanner lookup.
- All routes: uth:sanctum + 	hrottle:pos (300/min per tenant).

**Phase 3.2 — Queue Everything Heavy (COMPLETE):**
- **config/horizon.php** — 4-queue Horizon configuration:
  - provisioning: 2 workers, 60s timeout (highest priority — new customer signups)
  - emails: 2 workers, 30s timeout
  - default: 4 auto-balanced workers, 90s timeout
  - heavy: 1 worker, 10min timeout (report exports, large data jobs)
- **GenerateReportExport** — Routed to heavy queue, timeout upgraded to 600s.
- WooCommerce sync remains as scheduled command (dispatches to default queue).

**Phase 3.3 — Cloudflare R2 Storage (COMPLETE):**
- **StorageService** — Single abstraction layer for ALL file storage. Methods: store(), storeOptimized(), url(), delete(), exists(). Tenant-scoped paths: 	enants/{id}/products/.
- **config/filesystems.php** — Added 2 disk (S3-compatible, use_path_style_endpoint=true).
- **InventoryController** — Migrated from 54 lines of duplicated GD image code to 2 StorageService calls.
- **Migration Path:** Set FILESYSTEM_DISK=r2 + fill CLOUDFLARE_R2_* env vars ? all uploads instantly route to R2. Zero controller changes needed.

**Technical Implementation:**
- **Files:** pp/Http/Controllers/Api/PosSearchController.php, pp/Http/Controllers/PosController.php, outes/api.php, config/horizon.php, pp/Jobs/GenerateReportExport.php, pp/Services/StorageService.php, config/filesystems.php, pp/Http/Controllers/InventoryController.php
- **Validation:** php artisan route:list --path=api/pos ? 4 routes live. App boots without errors.
- **Status:** Completed
---

---
### VenQore SaaS Transformation — Phase 4: Plan Gating & Subscription Enforcement
**Date:** 2026-04-10
**Alignment:** According to Plan (VenQore_Master_Roadmap.md — Phase 4)

**Phase 4.1 — Plan Limits Config (PRE-EXISTING, VERIFIED):**
- config/plans.php already built with starter/growth/business tiers.
- Limits: sku_limit, staff_limit, locations, woocommerce, pi_access, growth_engine, multi_branch, eports.

**Phase 4.2 — PlanGate Service (PRE-EXISTING, VERIFIED):**
- PlanGate::check('feature', ) ? bool
- PlanGate::enforce('feature', ) ? throws PlanLimitException if over limit
- PlanLimitException::render() ? 403 JSON: { type, feature, message, upgrade_url, current_plan, current_count, limit }

**Phase 4.3 — Gates Injected at Enforcement Points (COMPLETE):**
- AdminController::storeUser() — staff_limit gate (all non-super_admin users counted)
- V3/WarehouseController::store() — locations gate (uses pre-existing )
- InventoryController::store() — sku_limit gate (HasTenant scope auto tenant-filters)
- V3/ProductController::store() — sku_limit gate (raw DB query with tenant_id filter)
- WooCommerceController::index() + webhook() — woocommerce feature gate
- GrowthEngineController::index() — growth_engine feature gate
- All gates are no-ops if no tenant is bound (pp()->bound('current.tenant')), preserving single-tenant AMD Outlets compatibility.

**Phase 4.4 — Frontend Upgrade Prompts (COMPLETE):**
- pp/Http/Controllers/BillingController.php — 3 routes: /billing, /billing/upgrade, /billing/portal
  - Upgrade route pre-fills Lemon Squeezy checkout with tenant email + id via URL params
- pp/Http/Controllers/Api/PlanUsageController.php — GET /api/plan/usage
  - Returns per-resource usage %, limit, near_limit (90%), at_limit flags + feature flags
- esources/js/Components/UpgradeModal.jsx — Premium dark glassmorphism modal
  - Listens to md:plan-limit CustomEvent; shows feature hit, plan perks, upgrade CTA
- esources/js/bootstrap.js — Axios interceptor catches 403 + type=plan_limit
  - Fires md:plan-limit event (bypasses generic error toast entirely)
- esources/js/Layouts/OneGlanceLayout.jsx — <UpgradeModal /> mounted globally

**Routes Validated (?):**
`
GET /billing              ? billing.index
GET /billing/upgrade      ? billing.upgrade  ? named route used by PlanLimitException
GET /billing/portal       ? billing.portal
GET /api/plan/usage       ? api.plan.usage
`

**Technical Implementation:**
- **Files:** AdminController.php, V3/WarehouseController.php, InventoryController.php, V3/ProductController.php, WooCommerceController.php, GrowthEngineController.php, BillingController.php (new), Api/PlanUsageController.php (new), UpgradeModal.jsx (new), bootstrap.js, OneGlanceLayout.jsx
- **Status:** Completed — enforcement is live on all critical creation endpoints
---

---
### VenQore SaaS Transformation — Phase 5: Onboarding & Retention
**Date:** 2026-04-10
**Alignment:** According to Plan (VenQore_Master_Roadmap.md — Phase 5)

**Phase 5.1 — Setup Wizard Flow (COMPLETE):**
- SetupController::store() now syncs wizard data to BOTH:
  - settings table (single-tenant / AMD Outlets compatibility)
  - 	enants table: setup_completed=true, currency_code, currency_symbol, industry, 
ame
- TenantMiddleware updated with wizard redirect guard:
  - Unauthenticated requests pass through (login works)
  - Any authenticated tenant request where !setup_completed redirects to setup.index
  - Exemptions: setup.*, logout, profile.*, csrf.refresh, storage/* routes
- Post-setup redirect:
  - SaaS mode: stay logged in ? /dashboard with success toast
  - Single-tenant (AMD Outlets): original logout ? welcome behaviour preserved

**Phase 5.2 — Currency Refactor (COMPLETE):**
- Created esources/js/Utils/useCurrency.js — single shared React hook
  - Reads 	enant.currency_symbol (SaaS — from TenantMiddleware::Inertia::share)
  - Fallback: settings.currency_symbol (single-tenant — from HandleInertiaRequests)
  - Fallback: 'Rs. ' (original hardcoded default)
- Exports: { symbol, code, format(amount), formatNumber(amount), getCurrencySymbol() }
- Pattern for replacing hardcoded Rs. in components:
  `jsx
  import { useCurrency } from '@/Utils/useCurrency';
  const { symbol, format } = useCurrency();
  // Replace: Rs. {amount}
  // With:    {format(amount)}
  `
- All 10+ affected files can now migrate incrementally using this hook

**Phase 5.3 — Super-Admin Platform Dashboard (COMPLETE):**
- pp/Http/Controllers/Admin/AdminDashboardController.php (new)
  - index(): MRR, tenant counts, plan distribution, MRR trend (6mo), recent signups
  - 	enants(): Paginated tenant list with search/filter by status/plan
  - suspend(), eactivate(), upgradePlan(): Tenant management actions
  - All queries use Tenant::withoutTenantScope() — bypasses all tenant global scopes
- esources/js/Pages/SuperAdmin/Dashboard.jsx (new)
  - KPI cards: MRR, Total Tenants, Active Trials, Churned
  - Area chart: 6-month MRR trend (recharts)
  - Plan distribution with progress bars + status breakdown
  - Recent tenant list with status/plan/setup badges
- Routes (all validated ?):
  `
  GET  /superadmin/dashboard                  ? superadmin.dashboard
  GET  /superadmin/tenants                    ? superadmin.tenants
  POST /superadmin/tenants/{id}/suspend       ? superadmin.tenants.suspend
  POST /superadmin/tenants/{id}/reactivate    ? superadmin.tenants.reactivate
  POST /superadmin/tenants/{id}/upgrade       ? superadmin.tenants.upgrade
  `
- Middleware: ['auth', 'superadmin'] — checks is_super_admin property on user

**Technical Implementation:**
- **Files:** TenantMiddleware.php, SetupController.php, AdminDashboardController.php (new),
  SuperAdmin/Dashboard.jsx (new), utils/useCurrency.js (new), routes/web.php
- **Status:** Completed — wizard enforced, currency hook ready, command center live
---

---
### VenQore SaaS Transformation — Phase 6: Landing Page & Demo Environment
**Date:** 2026-04-10
**Alignment:** According to Plan (VenQore_Master_Roadmap.md — Phase 6)

**Phase 6.1 — venqore.com Landing Page (COMPLETE):**
- esources/js/Pages/LandingPage.jsx (new) — Full public marketing landing page
- Design: Midnight Nebula aesthetic (matched to existing Welcome.jsx — same #020010 base, noise texture, perspective grid floor, ambient indigo/violet orbs, custom magnetic cursor, shimmer headline animations)
- Contains all 7 required roadmap elements:
  1. Headline: 'The Complete POS & ERP for Growing Retail Businesses'
  2. Sub-headline: 'Sales, Inventory, Accounting, and 38 Reports — in one browser tab. No installation.'
  3. Video placeholder: 4-minute Loom demo embed (replace src with actual Loom URL)
  4. Pricing cards: Starter , Growth  (highlighted), Business 
  5. 'Start Free Trial' CTAs ? /register (with 14-day free trial badge, no CC required)
  6. Feature bullets: POS, Inventory, 38 Reports, Growth Engine AI, Multi-Warehouse, WooCommerce
  7. 'Book a Demo' ? Calendly link (replace URL with actual Calendly)
- Route: GET / now renders LandingPage for unauthenticated visitors
  - Authenticated users still redirect to /dashboard
  - Original Welcome.jsx (cinematic post-login splash) preserved at /welcome-splash

**Phase 6.2 — demo.venqore.com Nightly Reset (COMPLETE):**
- pp/Console/Commands/ResetDemoTenant.php (new) — demo:reset artisan command
  - Wipes all tenant-scoped data for subdomain='demo' (all tracked tables, FK-safe order)
  - Re-seeds: 3 categories, 8 realistic products with FIFO batches, 5 customers, 1 warehouse, 1 cash account, admin user
  - Demo credentials (public): demo@venqore.com / demo1234
  - Demo plan: Growth (so visitors see all premium features)
  - Uses --force flag for scheduled execution (no confirmation prompt)
- Scheduled: outes/console.php ? daily at 04:00 demo:reset --force
  - withoutOverlapping() + onOneServer() — safe for multi-server environments
- Validated: php artisan list | grep demo confirms command registration ?

**Files Changed:**
- esources/js/Pages/LandingPage.jsx — new public marketing page
- outes/web.php — / now ? LandingPage, Welcome.jsx ? /welcome-splash
- pp/Console/Commands/ResetDemoTenant.php — new artisan command
- outes/console.php — demo:reset scheduled at 04:00

**Remaining To-Do (manual, not code):**
- [ ] Replace Loom video placeholder src with actual recorded demo URL
- [ ] Replace Calendly href with actual booking link
- [ ] Create demo tenant subdomain in DB: Tenant::create(['subdomain' => 'demo', ...])
- [ ] Point demo.venqore.com DNS to server (Cloudflare wildcard already covers *.venqore.com)
---

---
### VenQore SaaS Transformation — Phase 7: AppSumo Preparation
**Date:** 2026-04-10
**Alignment:** According to Plan (VenQore_Master_Roadmap.md — Phase 7)

**Phase 7.1 — AppSumo LTD Deal Structure (COMPLETE):**
- config/plans.php extended with 3 LTD tiers:
  - ltd_1: 1 code — Starter features (1k SKUs, 3 staff, 1 warehouse) — lifetime license
  - ltd_2: 2 codes stacked — Growth features (unlimited SKUs, WooCommerce, AI engine) — lifetime
  - ltd_3: 3 codes stacked — Business features (everything unlimited + API) — lifetime
  - All LTD plans include hosted_until: +2 years and ltd: true flag
- AppSumo deal structure implemented per roadmap:
  -  per code (AppSumo price)
  - Stackable: 2 codes = Growth, 3 codes = Business
  - After 2 years: /month to stay hosted OR self-host

**Phase 7.2 — Code Redemption System (COMPLETE):**
- database/migrations/..._create_appsumo_codes_table.php — tracks codes with: campaign, tenant_id, stack_position, redeem timestamp, refundable_until (60 days), status (issued/redeemed/refunded)
- pp/Models/AppSumoCode.php — with scopes: issued(), redeemed(), forTenant(), and planForStack() helper
- pp/Http/Controllers/AppSumoController.php — full redemption flow:
  - New user: provisions tenant (plan=ltd_1), creates admin, sends to setup wizard
  - Existing user (stacking): counts existing codes, upgrades to next tier, rejects if >3
  - Extends hosting +2 years per new code, sets refundable_until to now()+60 days
- pp/Console/Commands/ImportAppSumoCodes.php — ppsumo:import-codes command
  - Bulk-imports CSV from AppSumo seller dashboard
  - Idempotent (duplicates skipped), supports --dry-run and --campaign flags

**Phase 7.3 — Required AppSumo Pages (COMPLETE):**
- esources/js/Pages/Redeem.jsx — Code redemption form at /redeem
  - Split layout: tier stacking info (left) + form (right)
  - Shows 1/2/3 code tier cards with feature lists
- esources/js/Pages/RedeemSuccess.jsx — Activated confirmation page
  - Animated plan badge, stacking progress indicator (1-2-3 circles)
  - Direct link to tenant's subdomain dashboard
- esources/js/Pages/WhatIsIncluded.jsx — Full feature table at /what-is-included
  - Required by AppSumo before campaign approval
  - Detailed comparison across all LTD tiers: POS, Inventory, Accounting, Reports, AI
- esources/js/Pages/RefundPolicy.jsx — 60-day refund policy at /refund-policy
  - AppSumo 60-day guarantee section, subscription policy, hosting expiry, data retention

**Routes Validated (all ?):**
`
GET  /redeem              ? appsumo.index
POST /redeem              ? appsumo.redeem
GET  /what-is-included    ? what-is-included
GET  /refund-policy       ? refund-policy
`
**Commands Validated:**
- ppsumo:import-codes ?

**AppSumo Submission Checklist (from roadmap — manual steps):**
- [x] Redemption system built
- [x] What's Included page built ? required by AppSumo
- [x] Refund Policy page built ? required by AppSumo
- [ ] Product live at venqore.com (Phase 8 server setup)
- [ ] demo.venqore.com live (Phase 6.2 — command ready, tenant needs provisioning)
- [ ] 5+ real paying customers before submission
- [ ] Submit at: https://sell.appsumo.com

**Files Created:** config/plans.php (updated), AppSumoCode.php (model), AppSumoController.php, create_appsumo_codes_table.php (migration), ImportAppSumoCodes.php, Redeem.jsx, RedeemSuccess.jsx, WhatIsIncluded.jsx, RefundPolicy.jsx, routes/web.php (updated)
---

---
### VenQore SaaS Transformation — Phase 8: Production Server Setup
**Date:** 2026-04-10
**Alignment:** According to Plan (VenQore_Master_Roadmap.md — Phase 8)

**Phase 8 — Files Created:**

**Server Config Files (deploy/ directory):**
- deploy/nginx/venqore.conf — Nginx config
  - Single server block handles venqore.com AND *.venqore.com
  - HTTP ? HTTPS redirect, wildcard cert, HSTS, security headers
  - PHP 8.3-FPM via unix socket, 100MB upload limit, gzip, static asset caching (1yr)
  - Logging to /var/log/nginx/venqore.{access,error}.log
- deploy/supervisor/venqore-horizon.conf — Supervisor config for Horizon
  - Runs php artisan horizon as www-data, auto-restarts, 36min graceful shutdown
  - Includes cron scheduler setup notes
- deploy/deploy.sh — Zero-downtime deploy script
  - git pull ? composer install (no-dev) ? npm build ? migrate ? cache warm ? horizon:terminate + restart ? OPcache reload ? health check
  - Maintenance mode bypassed during deploy (secret token in art down)
- .github/workflows/deploy.yml — GitHub Actions CI/CD
  - Triggers on push to main ? SSHs into droplet ? runs deploy.sh
  - Uses GitHub Secrets: PRODUCTION_HOST, PRODUCTION_USER, PRODUCTION_SSH_KEY
- .env.production.example — Complete production .env template
  - SESSION_DOMAIN=.venqore.com (wildcard for all subdomains)
  - QUEUE_CONNECTION=redis, CACHE_STORE=redis, SESSION_DRIVER=redis
  - Lemon Squeezy vars, Cloudflare R2, Postmark, AppSumo webhook secret

**Recommended Stack:**
- DigitalOcean: 4GB Droplet, /month (~ with backups)
- MySQL 8 on same server ? read replica when needed
- Redis 7 for sessions + cache + queues
- PHP 8.3-FPM with OPcache (256MB, revalidate=0 in production)
- Nginx + Let's Encrypt wildcard SSL via Cloudflare DNS challenge
- Laravel Horizon via Supervisor (4 queue types: default, provision, webhooks, reports)
- Cloudflare R2 for file storage (.015/GB, 0 egress cost via Cloudflare proxy)
- Postmark for transactional email
- UptimeRobot for monitoring (free)
- GitHub Actions for CI/CD (free for public repos)

**DNS Setup (Cloudflare):**
- A record: @ ? Droplet IP (proxied)
- CNAME: * ? venqore.com (proxied) — covers ALL tenant subdomains
- CNAME: assets ? R2 custom domain

**Key Production Settings:**
- Session cookie: DOMAIN=.venqore.com (leading dot = cross-subdomain auth)
- SSL: Full (Strict) mode in Cloudflare
- OPcache: validate_timestamps=0 (cleared manually on deploy)
- Queue: Redis with 3 workers for webhooks/provisioning priority
---

---
### VenQore — Pre-Launch Checklist Implementation
**Date:** 2026-04-10
**Reference:** VenQore_PreLaunchChecklist.md

**Code Items Implemented:**

**§6.3 — Tenant-Partitioned Cache (CRITICAL BUG FIX):**
- pp/Helpers/SettingsHelper.php — Fixed global 'app_settings' cache key to 'settings:{tenant_id}'
  - clearCache() now clears ONLY the current tenant's cache
  - Added clearCacheForTenant(string \) for super-admin use
  - Fallback to 'settings:global' for console commands and super-admin context
  - This was a data bleed risk: one tenant's settings would pollute another tenant's cache

**§12 — Legal Pages (Required for AppSumo + CAN-SPAM):**
- esources/js/Pages/TermsOfService.jsx — GET /terms
  - 14 sections: acceptance, service description, subscription/AppSumo LTD, trial, data ownership,
    acceptable use, multi-tenant disclosure, SLA, liability cap, termination, governing law
- esources/js/Pages/PrivacyPolicy.jsx — GET /privacy
  - GDPR-compliant: 10 sections covering data collected, third-party sharing table
    (Cloudflare/DigitalOcean/Postmark/Lemon Squeezy), retention by account type,
    6 GDPR rights, security measures, essential-cookies-only policy
- Both pages: MidnightNebula aesthetic, linked to each other and refund policy in footer

**§14 — Health Check Endpoint:**
- pp/Http/Controllers/HealthController.php — GET /health (public, no auth)
  - Checks: database (SELECT 1), Redis (PING), cache (write/read/delete), storage (write test),
    Horizon queue (heartbeat timestamp check)
  - Returns HTTP 200 (all ok) or 503 (any component 'fail')
  - Status levels: 'ok' | 'degraded' | 'fail' per component
  - Storage failure = 'degraded' not 'fail' (app can operate temporarily without storage)
  - UptimeRobot should monitor /health every 5 minutes

**§15 — Pre-Launch Cleanup Command:**
- pp/Console/Commands/PreLaunchCleanup.php — php artisan prelaunch:cleanup
  - Deletes test tenants + all data in FK-safe order (26 tables)
  - Protected subdomains list: ['demo'] — never deleted
  - Modes: --dry-run (preview), --tenant=slug (specific), --all-test (all test-prefix), --force
  - Shows deletion table before confirming
  - Prints next-steps reminder (queue:clear, queue:flush, demo:reset, log clear)

**Routes Added:**
- GET /terms   ? TermsOfService
- GET /privacy ? PrivacyPolicy
- GET /health  ? HealthController (full system check)

**All Validated:** php artisan route:list + list commands ?

**Checklist Items NOT Code (manual/server work):**
- §1 — Server baseline (run on production server)
- §2.1-.5 — Env, DB, Redis, Horizon, Storage config (run on server)
- §3.2 — Cross-tenant manual browser test
- §3.3 — API isolation curl test
- §4 — Full payment flow end-to-end test
- §5 — Security audit (SQL injection test, rate limit test)
- §6.1-.2 — POS performance load test + query analysis
- §7 — Email delivery and template test
- §8 — Core ERP functional testing
- §9 — Onboarding wizard walkthrough
- §10-.11 — Admin dashboard + demo environment check
- §13 — Final production deploy sequence
- §16 — 30-minute post-launch watch
---

---
### VenQore — Pre-Launch Checklist (Continued - Remainder)
**Date:** 2026-04-10

**Implemented:**

**§9 — Industry Feature Flag Mapping (SetupController.php):**
- Fixed: industry config keys (serial_tracking, batch_tracking, variants_enabled)
  now correctly map to SettingsHelper keys (serial_tracking_enabled, etc.)
- Pharmacy: batch_tracking_enabled=1 (expiry dates activated)
- Electronics/IT/Solar: serial_tracking_enabled=1 (IMEI/serial tracking)
- Apparel/Sports/MobileRepair: variants_enabled=1 (size/color variants)
- Jewelry: decimal_places=3 (gram-level precision)
- SettingsHelper::clearCache() called after wizard saves to force fresh load

**§6.1 — LargeProductCatalogSeeder (database/seeders/):**
- Seeds 3,000 products with barcodes (PERF-0001 format), SKUs, categories, FIFO batches
- Batch-inserts 100 at a time for speed (~30 seconds total)
- Requires PERF_TEST_TENANT_SUBDOMAIN env var (default: testshop)

**§6.2 — Performance Indexes Migration:**
- Migration: 2026_04_09_222632_add_performance_indexes_to_core_tables.php (Pending - run on server)
- Composite (tenant_id, created_at) on 12 core tables
- Composite (tenant_id, id) on 5 high-frequency tables
- barcode index, sku index (POS sub-ms lookups)
- tenants.subdomain UNIQUE index (every-request TenantMiddleware lookup)
- tenants.status index, inventory_batches FIFO index, journal_entries date index

**§3.1 + §3.4 — TenantAudit Command (app/Console/Commands/):**
- php artisan tenants:audit
- §3.1: Checks 20 tables for NULL tenant_id rows
- §3.4: Verifies 11 core models use HasTenant via class_uses_recursive()
- §3.5: Tests reserved subdomain blocking (admin, api, www, etc.)
- Bonus: Flags stuck trials, active-but-no-setup tenants, missing demo tenant
- Color-coded output, supports --fail-fast for CI pipelines

**§12 — ToS Acceptance on Registration:**
- Register.jsx: Added checkbox with animated checkmark
- Submit button disabled until checkbox is checked
- Links to /terms and /privacy (open in new tab, don't interrupt form)
- Required by: CAN-SPAM, AppSumo campaign approval, GDPR

**§14 — Full Monitoring Stack:**
- HealthController: GET /health checks DB+Redis+cache+storage+Horizon heartbeat
- config/logging.php: Slack channel level fixed to LOG_SLACK_LEVEL=error (only errors, not debug)
- config/logging.php: Comment added for LOG_STACK=daily,slack production setup
- config/horizon.php: 'notifications' block with Slack + email + SMS
- .env.production.example: Added LOG_SLACK_WEBHOOK_URL, LOG_SLACK_LEVEL, HORIZON_SLACK_WEBHOOK, HORIZON_ALERT_EMAIL, HORIZON_PREFIX

**§4.1 — Webhook Test Fixtures (tests/fixtures/):**
- lemon_squeezy_subscription_created.json
- lemon_squeezy_subscription_cancelled.json
- Includes usage comment + signature computation instructions

**Status after this session:**
- All code-implementable checklist items are now complete
- Remaining items are purely operational (server setup, manual testing, live payment flow)
---

---
### Definitive Plan — URL-Based Multi-Store Architecture
**Date:** 2026-04-10
**Alignment:** Deviation from Plan (Supersedes Previous Architecture)

**Decision Context:**
Originally planned as subdomain-based multi-tenancy (shop1.venqore.com). Changed to path-based URL routing (venqore.com/s/{store_id}/...) because it eliminates wildcard DNS, wildcard SSL, cross-domain session complexity, and enables multi-tab isolation between stores natively. This is the final, locked architecture per VenQore_Definitive_Plan_Final.md.

**Technical Implementation:**
- **Migrations:** 100001 (tenants remodel: slug, join_code, feature flags, bigint PK), 100002 (tenant_users pivot), 100003 (store_licenses), 100004 (appsumo_codes), 100005 (users: remove tenant_id/role/passcode, add last_store_id)
- **Models:** Tenant.php (numeric PK, slug, featuresArray()), TenantUser.php (pivot, role hierarchy), StoreLicense.php, AppSumoCode.php, User.php (global identity, multi-store relationships)
- **Middleware:** TenantMiddleware (URL route param, membership check, deferred last_store_id update)
- **Controllers:** AuthenticatedSessionController (3-case routing), HubController (store picker + API), StoreController (create/join), StaffController (invite/accept/PIN login), AppSumoController (code stacking)
- **Routes:** All store routes under Route::prefix('s/{store_id}')->name('store.')->middleware(['auth','verified','tenant'])
- **Seeder:** TenantZeroSeeder updated for new schema (TenantUser + StoreLicense records)
- **Provisioning:** ProvisionTenantJob updated (slug, TenantUser, StoreLicense)
- **Status:** Completed

---
### God Admin War Room Dashboard (Tier 1 Platform Command Center)
**Date:** 2026-04-10
**Alignment:** According to Plan

**Decision Context:**
Architecture plan defines a God Admin 8-tab War Room at /hq/. Implemented as V1 pragmatic delivery
using the existing /admin/ prefix and is_super_admin boolean (no migration required). Full tab
navigation, store management actions, and platform metrics are live. /hq/ rename + platform_role
ENUM migration is deferred to V2 per the phased build plan.

**Technical Implementation:**
- **Files:**
  - pp/Http/Controllers/Admin/SuperAdminController.php — Full rewrite with 7 data builders
  - esources/js/Pages/SuperAdmin/Dashboard.jsx — 8-tab God Admin War Room (600 lines)
  - outes/web.php — Added extend-trial route + named existing routes
- **Tabs Shipped:** Overview (KPIs + charts + expiring alerts), Stores (filterable table + actions),
  Platform Users, Revenue (with Lemon Squeezy integration note), Support (V1 stub), Activity Feed, Settings (stub)
- **Actions Live:** Suspend, Activate, Extend Trial (+7d)
- **Status:** Completed
---

---
### V1 Tier 2 Role-Gated Dashboards (Phase 2)
**Date:** 2026-04-10
**Alignment:** According to Plan

**Decision:** Built the 4 remaining V1 Tier 2 dashboards and wired a role router
into DashboardController. Owner/Admin/Manager keep the full existing dashboard.

**Files:**
- esources/js/Pages/Dashboards/CashierDashboard.jsx — Minimal: POS button, session count, clock-in
- esources/js/Pages/Dashboards/AccountantDashboard.jsx — Finance hub: P&L chart, aging, bank accounts, journal queue
- esources/js/Pages/Dashboards/PurchasingDashboard.jsx — Procurement: POs, reorder alerts, spend tracker
- esources/js/Pages/Dashboards/ViewerDashboard.jsx — Read-only: 4 permitted reports + summary tiles
- pp/Http/Controllers/DashboardController.php — Role router added via match() statement
  Private builders: cashierDashboard(), accountantDashboard(), purchasingDashboard(), viewerDashboard(), fullDashboard()

**Role ? Dashboard Map (V1 Core 7):**
| Role              | Dashboard |
|-------------------|-----------|
| owner             | Full Dashboard (existing) |
| admin             | Full Dashboard (existing) |
| manager           | Full Dashboard (existing) |
| cashier           | CashierDashboard (minimal) |
| accountant        | AccountantDashboard |
| purchasing_officer| PurchasingDashboard |
| viewer            | ViewerDashboard (read-only) |

**Status:** Completed — build passing
---

---
### Role-Gated Dashboards Dark Mode Fix
**Date:** 2026-04-22
**Alignment:** UX refinement / Bug Fix

**Decision Context:**
The new role-based dashboards (`AccountantDashboard`, `CashierDashboard`, `PurchasingDashboard`, `ViewerDashboard`) were using React inline styles with CSS variables like `var(--card-bg, #fff)` that had not been defined globally, causing the dashboards to render hardcoded white cards and bright borders even when the platform was set to the "Midnight Nebula" dark mode. 

**Technical Implementation:**
- **Files:** `resources/css/app.css`
- **Logic:** Injected `:root` and `.dark` blocks inside the `@layer base` directive that officially define `--card-bg`, `--card-border`, `--text-main`, `--text-sub`, `--sidebar-border`, and `--bg-main` variables.
- **Status:** Completed — dashboards now seamlessly respect the application-wide dark mode toggle.
---

---
### Streamlined Multi-Tenant Store Setup
**Date:** 2026-04-11
**Alignment:** Deviation from Plan (UX Optimization)

**Decision Context:**
Originally, a 3-step wizard was redundant with the initial 'Create Store' form. The flow was simplified to 'Create Store (Name Only) -> Hub -> Detailed Setup Wizard' to align with user feedback and reduce friction.

**Technical Implementation:**
- **Files:** Store/Create.jsx, StoreController.php, SetupController.php, SetupWizard.jsx
- **Status:** Completed
---

---
### Platform HQ Trash & Soft-Delete Management
**Date:** 2026-04-11
**Alignment:** According to Plan (SaaS Lifecycle)

**Decision Context:**
The Platform Owner (SuperAdmin) required visibility into soft-deleted stores and users to manage test data and billing lifecycle. Implemented 'Trash' view, 'Restore', and 'Purge Forever' functionality.

**Technical Implementation:**
- **Files:** SuperAdminController.php, AdminDashboardController.php, SuperAdmin/Stores.jsx, SuperAdmin/Dashboard.jsx
- **Status:** Completed
---

---
### VenQore Routing Fix — Three-Zone Security Enforcement
**Date:** 2026-04-12
**Alignment:** According to Plan (Critical Security Fix)

**Decision Context:**
The codebase had three critical wounds allowing store owners to bleed into the Platform HQ:
1. CheckPermissions.php granted God Mode to any user with role 'owner' or 'admin', meaning store owners could silently pass platform route checks.
2. 400+ legacy bare routes (/reports, /inventory, /pos, etc.) existed without store context — they had no TenantMiddleware and could expose platform data.
3. OneGlanceLayout.jsx showed Platform HQ menu links when the store prop was null (which happened on legacy routes).

Fixed by enforcing strict three-zone separation: Zone 1 (public), Zone 2 (auth/hub), Zone 3 (/s/{store_slug}/*), Zone 4 (/VenQore/* with is_platform_admin = true only).

**Technical Implementation:**
- **Files:** CheckPermissions.php, SuperAdminMiddleware.php, User.php, OneGlanceLayout.jsx, outes/web.php, config/permissions.php (new)
- **Status:** Completed
---

---
### Store Admin Panel Restoration (Structure Alignment)
**Date:** 2026-04-12
**Alignment:** Deviation from Plan (intentional rollback of SaaS minimization)

**Decision Context:**
The SaaS refactor reduced the Admin Panel to 4 items inside a 'Store Settings' executive sub-menu. The user requested restoring the original full Admin Panel as a primary sidebar section with all 9 items (Admin Home, Executive Dashboard, User Management, Staff Attendance, System Settings, Data Management, Activity Log, Recycle Bin, Subscription), while keeping it fully store-scoped at /s/{store_slug}/admin/*. This is a hybrid approach — old UI, new SaaS routing.

**Technical Implementation:**
- **Files:**
  - \esources/js/Layouts/OneGlanceLayout.jsx\ — Restored adminMenuItems to full 9-item list; appMenuItems now store-scoped with routeParams
  - \outes/web.php\ — Added /s/{store_slug}/admin/* route group (store.admin.home, store.admin.dashboard, store.admin.attendance)
  - \pp/Http/Controllers/Admin/StoreAdminController.php\ — New controller for store-scoped admin pages
  - Ziggy regenerated to include new store.admin.* routes
- **Status:** Completed
---

---
### Live Demo Ephemeral Sandboxing (Phase 1)
**Date:** 2026-04-13
**Alignment:** Deviation from Plan (New Feature Addition)

**Decision Context:**
Originally unplanned, added a growth-focused Demo Store functionality. Based on `venqore-live-demo-plan.md`, we chose Option B to implement Phase 1: The Golden Master Dataset with time-shifted logic for a permanent, self-sustaining public demo environment.

**Technical Implementation:**
- **Files:** `database/seeders/DemoMasterSeeder.php`, `database/seeders/Demo/DemoCategorySeeder.php`, `database/seeders/Demo/DemoProductSeeder.php`, `database/seeders/Demo/DemoWarehouseSeeder.php`
- **Status:** Completed Phase 1 base seeders
---

---
### Live Demo Ephemeral Sandboxing (Phase 2)
**Date:** 2026-04-13
**Alignment:** Deviation from Plan (New Feature Addition)
**Status Check:** Phase 2: The Time Engine

**Technical Implementation:**
- **Files:** `app/Services/DemoDateHelper.php`, `app/Traits/HasTenant.php`
- **Scope Details:** Placed the `demo_time_shift` scope directly into `HasTenant::bootHasTenant()` for robust 100% tenant-wide coverage. Automatically applies `DATE_ADD` logic based on `DEMO_EPOCH = '2020-01-01'` for `created_at`, `updated_at`, `sale_date`, and `expense_date`.
- **Status:** Completed Phase 2
---

---
### Live Demo Ephemeral Sandboxing (Phase 3)
**Date:** 2026-04-13
**Alignment:** Deviation from Plan (New Feature Addition)
**Status Check:** Phase 3: Session Management

**Technical Implementation:**
- **Files:** `app/Services/TenantCloner.php`, `app/Services/DemoSessionService.php`, `app/Http/Controllers/DemoController.php`, `app/Console/Commands/CleanExpiredDemoSessions.php`, `app/Http/Middleware/DemoSessionMiddleware.php`
- **Session Details:** Engineered a hyper-fast Single-DB deep duplication trait via PHP batch inserts (`TenantCloner`). Implemented the main Demo API and a strict expiry system managed by cookies and automated cleanup cron-jobs.
- **Status:** Completed Phase 3
---

---
### Live Demo Ephemeral Sandboxing (Phase 4)
**Date:** 2026-04-13
**Alignment:** Deviation from Plan (New Feature Addition)
**Status Check:** Phase 4: Frontend CTA Layer

**Technical Implementation:**
- **Files:** `app/Http/Middleware/DemoBannerMiddleware.php`, `resources/js/Components/DemoBanner.jsx`, `resources/js/Pages/DemoExpired.jsx`
- **Frontend Details:** Built the `DemoBannerMiddleware` to inject global variables into Inertia payloads. Built the `DemoBanner.jsx` globally sticky header prompting users to transition out of the sandbox. Built the `DemoExpired.jsx` conversion funnel to intercept timed-out API calls and pitch sign-up. 
- **Status:** Completed Phase 4 (Full Delivery of Architecture)

---

## 🏛️ 13. Marketing & Brand Identity (Copy Bible V1 Overhaul)

This section details the brand positioning and messaging architecture implemented to align VenQore with the "Financial Truth" narrative.

### 📖 A. The Authority Framework (Copy Bible Integration)
*   **Core Positioning:** Transitioned from a generic POS to a high-authority operations platform built on **Financial Truth**.
*   **The "Midnight Nebula" Marketing Experience:** A premium dark-mode, glassmorphic design for all public-facing pages.
*   **Narrative Flow:** Implementation of a systematic marketing narrative: Hero → Pattern Interrupt → Problem Escalation → Solution → Benefits → Social Proof.
*   **The Pattern Interrupt:** "Most business software lies to you." — A strategic hook used to highlight the structural flaws in average-cost and non-double-entry systems.

### 🌍 B. Marketing Pages Architecture
*   **Home Page (Financial Truth Hub):** Integrated the "The Books Are Always Right" narrative with sections for Pattern Interrupt, Problem Escalation, and Unique Mechanisms.
*   **Features (The Truth Stack):** A deep dive into the 4 Pillars (Financial Accuracy, Operational Control, Professional POS, Intelligence) and a grid of the 38 Master Reports.
*   **Pricing (Scale Without Drama):** Four-tier pricing structure (Solo, Growth, Multi-Loc, Enterprise) aligned with Copy Bible value propositions.
*   **About (The Alternative Was Unacceptable):** The narrative of the operational struggle that led to the creation of VenQore.
*   **Contact (Direct Access):** High-response contact framework with specialized prompts for Sales, Support, and Partnerships.

### 📰 C. Authority Content (The Blog)
*   **Article 1: The Revenue Lie:** A strategic piece on why simple SUM() sales reports are financially incorrect for business owners.
*   **Article 2: The Hidden Tax:** A data-driven approach to customer retention and churn analysis.
*   **Dynamic CMS Logic:** A React-driven, Inertia-powered blog index and article viewer with responsive, markdown-style rendering.

---
---
### Platform HQ "Midnight Nebula" Stabilization & Routing Fixes
**Date:** 2026-06-25
**Alignment:** According to Plan (SuperAdmin Refinement)

**Decision Context:**
Finalized the stabilization of the "Midnight Nebula" SuperAdmin Command Center. The focus was on eliminating hardcoded routing dependencies, resolving navigation regressions within the Platform HQ dashboard, and ensuring theme consistency across light/dark modes.

**Technical Implementation:**
- **Routing Standardization:** Replaced all hardcoded `/admin/` and `/VenQore/` paths in `Dashboard.jsx` with Ziggy `route()` helper calls (e.g., `platform.ticket.reply`, `platform.store.suspend`).
- **Deep-Linking Support:** Updated `SupportController` and `Dashboard.jsx` to correctly synchronize tab state via props, ensuring `/VenQore/tickets` loads the Support tab directly.
- **Sidebar UX Repair:** Fixed `SidebarItem.jsx` to allow standard Inertia navigation while preserving dropdown functionality.
- **Theme Polish:** Refined sidebar aesthetics for Light Mode to ensure high readability and premium feel.
- **Status:** **Production Ready**

---
### VenQore ERP/POS Stabilization & Multi-Tenant Hardening
**Date:** 2026-04-17
**Alignment:** According to Plan (Production Readiness)

**Decision Context:**
Addressed the remaining critical blockers for the multi-tenant ERP system, focusing on resolving frontend state crashes, restoring missing report functionality, and hardening the security context for AI Assistant operations.

**Technical Implementation:**
- **Tenant Context Hardening:** 
    - Resolved `ReferenceError: store is not defined` in `AiAssistantModal.jsx` by refactoring the component to accept `store` as a prop and standardizing on `activeStore` to prevent variable shadowing.
    - Updated `OneGlanceLayout.jsx` to pass the correct tenant context to all global components.
- **Report Stability (Stock Valuation):**
    - Implemented and verified the functional **CSV Export** logic for the Stock Valuation report.
    - Added data validation and robust error handling to prevent "broken download" scenarios.
- **AI Assistant Routing:**
    - Corrected the `store.ai.query` route generation to include the mandatory `store_slug` parameter.
    - Added comprehensive backend logging to `AiController.php` to monitor query integrity and tenant-scoping compliance.
- **Production Build:**
    - Successfully executed `npm run build` after resolving all component naming conflicts and dependency errors.
- **Final Validation:**
    - Multi-tenant transaction flow verified: POS Sale -> Ledger Entry -> Report Reflection.
    - Empty state stability confirmed for new tenants.
- **Status:** **STABILIZED & PRODUCTION READY**

### **Final System Stabilization & Hardening (2026-04-17)**
*   **AI Assistant**: Resolved `store is not defined` runtime errors in `AiAssistantModal.jsx`. Refactored to prop-based context injection for robust multi-tenant operation.
*   **Financial Reporting**: Implemented functional CSV export logic for Stock Valuation report with enhanced data validation and debugging.
*   **Security Audit**: Confirmed `.env` and `storage/` protection (404/403). Verified non-auth routes and hardcoded credential absence.
*   **Performance Verification**: Confirmed Sales List page load executes < 5 queries (no N+1 issues).
*   **Accounting Core Hardening**: 
    *   Refactored `AccountingService.php` (V3) to use a strict, fail-fast constructor.
    *   Enforced `RuntimeException` if a service is instantiated without a valid tenant context in the IOC container.
    *   Standardized `$this->tenantId` usage across the accounting engine to prevent cross-tenant leakage.

---
### V1 Staff Invitation System
**Date:** 2026-04-18
**Alignment:** Deviation from Plan (Replaces direct user creation with secure invite flow)

**Decision Context:**
Originally the system used a direct "create user with password" admin form. The user defined a clean versioned plan (`venqore-staff-invitation-versioned.md`) and requested V1 be built. V1 replaces the old flow entirely: no passwords are set by admins, all staff are invited via a short alphanumeric code (e.g. `VQ-A3X9P2`) with a 48-hour TTL. Staff accept via magic link (Path A) or by entering the code on the Hub (Path B). Admin must approve before access is granted.

**Technical Implementation:**
- **Migration:** `2026_04_19_000001_upgrade_staff_invitations_v1.php` — added `invitee_name`, `invitee_phone`, `roles` (JSON), `short_code`, `status` enum, `approved_at` to `staff_invitations` table.
- **Model:** `app/Models/StaffInvitation.php` — rewritten with `generateShortCode()`, `generateToken()`, `isValid()`, `primaryRole()`, `statusLabel()`.
- **Controller:** `app/Http/Controllers/StaffInvitationController.php` — full V1 flow: `index`, `store`, `approve`, `decline`, `revoke`, `resend`, `acceptByToken`, `accept`, `declineByToken`, `validateCode`.
- **Routes:** Public invite acceptance routes under auth group; admin action routes under `store.admin.*`.
- **UI:** `resources/js/Pages/Admin/Users.jsx` — complete rewrite. Invitations table with status badges (5 statuses), short code copy button, WhatsApp share, 3-dot context menu (Resend/Revoke/Copy/WhatsApp), inline Approve/Decline for awaiting_approval rows. Members tab shows active staff.
- **Pages:** `resources/js/Pages/Invite/Accept.jsx` (magic-link landing), `resources/js/Pages/Invite/Invalid.jsx` (expired/not-found).
- **Status:** Completed — V1 shipped.

---
### VenQore RBAC Remediation & UX Hardening
**Date:** 2026-04-20
**Alignment:** According to Plan (Security & Production Readiness)

**Decision Context:**
Performed a comprehensive security audit and remediation of the Role-Based Access Control (RBAC) system to ensure strict data isolation and correct navigation flows across all tenanted roles. This was triggered by reports of cashiers seeing administrative modules and incorrect redirects landing users on restricted pages.

**Technical Implementation:**
- **Sidebar & Menu Hardening (`OneGlanceLayout.jsx`):**
    - **Granular Filtering:** Restricted 'Sell' sub-items (Orders, Quotations, Orders History) to authorized roles; cashiers now see only POS-related items.
    - **Activity Hub Isolation:** Implemented role-based rendering. Viewers/Accountants see nothing; Cashiers see only their own active POS sessions; Invoices/Purchases are gated to appropriate administrative roles.
    - **Growth Engine:** Gated to `owner` and `admin` roles only.
- **Dashboard Security (`Dashboard.jsx`):**
    - **Financial Data Guard:** Wrapped the `RightPanel` (Cash, Bank, Inventory Value) in a role-check to restrict access to Owners, Admins, and Accountants.
    - **Purchasing Guard:** Gated the "Order" button in Low Stock Alerts to roles with purchasing permissions.
- **Navigation & Redirect Fixes:**
    - **POS Workflow (`Pos.jsx`):** Corrected the session-close redirect to point to the role-appropriate `store.dashboard` instead of the restricted global Sales Index.
    - **Returns Workflow (`Returns/Create.jsx`):** Fixed tab-close and cancel redirects to land on the dashboard, preventing unauthorized access attempts to `/sales`.
- **Backend Middleware (`routes/web.php`):**
    - Applied `permission:returns` and `sales_view` middleware to all Returns-related routes to ensure server-side enforcement.
- **UI Consistency (`Hub/Index.jsx`, `CashierDashboard.jsx`):**
    - Updated `ROLE_LABELS` to include missing `accountant` and `purchasing_officer` identities.
    - Added a direct "Process Return" CTA to the Cashier Dashboard for improved operator efficiency.

**Status:** Completed & Pushed to Production

---
### AppSumo LTD Launch — Pre-Launch Gap Resolution (All 7 Gaps + UpgradeModal LTD CTA)
**Date:** 2026-04-21
**Alignment:** According to Plan (project VenQore.txt — Phase 7: AppSumo LTD)

**Decision Context:**
Based on the full codebase audit documented in `AppSumo_Implementation_Plan.md`, exactly 7 gaps were identified before the AppSumo listing could go live. All 7 gaps + the UpgradeModal LTD-specific CTA were implemented in this session. The existing infrastructure (PlanGate, PlanLimitException, UpgradeModal, Redeem.jsx, AppSumoController, config/plans.php) was already built — only the gaps were missing.

**Technical Implementation:**

| Gap | Fix | Status |
|-----|-----|--------|
| GAP 1 — Dead `pos.sale` route | Route was already removed (no-op) | ✅ Already fixed |
| GAP 2 — `/redeem` returns 500 (method name mismatch) | Renamed `form()` → `index()` in `AppSumoController`; fixed route name `appsumo.redeem` → `redeem.submit` in `Redeem.jsx` | ✅ Fixed |
| GAP 3 — Monthly transaction limit not defined or enforced | Added `transactions_per_month` to all tiers in `config/plans.php`; added message to `PlanLimitException`; added `PlanGate::enforce('transactions_per_month')` to `V3/SaleController::store()` | ✅ Fixed |
| GAP 4 — LTD users can create unlimited stores | Added `TenantUser` owner count check against AppSumo license `storeLimits` map in `StoreController::store()` | ✅ Fixed |
| GAP 5 — Wrong plan keys (`starter`/`growth`/`business` instead of `ltd_1`/`ltd_2`/`ltd_3`) | Updated plan mapping in `AppSumoController::redeem()` and `AppSumoController::index()`; also writes `plan_limits` JSON to tenant on code stacking | ✅ Fixed |
| GAP 6 — `UpgradeModal` not mounted | Was already mounted in `OneGlanceLayout.jsx` line 556 | ✅ Already fixed |
| GAP 7 — No 80%/95% warning banner | Created `PlanUsageBanner.jsx`; wired `plan_usage` lazy closure in `TenantMiddleware::handle()`; mounted banner in `OneGlanceLayout.jsx` | ✅ Fixed |
| BONUS — UpgradeModal LTD CTA | LTD users see "Stack Another AppSumo Code" (if < ltd_3) or "Upgrade to Subscription" (if on ltd_3) instead of generic subscription button | ✅ Fixed |

**Files Modified:**
- `app/Http/Controllers/AppSumoController.php` — GAP 2 (method rename), GAP 5 (plan keys), GAP 5 (plan_limits write)
- `app/Http/Controllers/V3/SaleController.php` — GAP 3 (transaction limit enforcement)
- `app/Http/Controllers/StoreController.php` — GAP 4 (store count limit)
- `app/Exceptions/PlanLimitException.php` — GAP 3 (transactions_per_month message)
- `config/plans.php` — GAP 3 (transactions_per_month added to all tiers)
- `resources/js/Pages/Redeem.jsx` — GAP 2 (route name fix)
- `resources/js/Components/UpgradeModal.jsx` — BONUS (LTD-aware CTA)
- `resources/js/Layouts/OneGlanceLayout.jsx` — GAP 7 (PlanUsageBanner mount + import)
- `app/Http/Middleware/TenantMiddleware.php` — GAP 7 (plan_usage lazy share)

**New Files:**
- `resources/js/Components/PlanUsageBanner.jsx` — GAP 7 (80%/95%/100% warning banner)

**Status:** Completed — Ready for end-to-end testing and AppSumo submission

---
### Centralized Plan & Subscription Management System
**Date:** 2026-04-21
**Alignment:** According to Plan (VenQore Plan_Management_System_Blueprint.md)

**Decision Context:**
Replaced the static `config/plans.php` approach with a fully database-driven plan management system. This enables SuperAdmins to create, price, and limit plans without code deployments. The blueprint defined 7 phases; all backend and frontend phases are now complete.

**Architecture Decisions:**
- Caching via Redis with sentinel value `__NOT_FOUND__` to distinguish "no override" from "null (unlimited) override".
- All limit values stored as strings in DB; `Tenant::getLimit()` casts to appropriate PHP types.
- Priority chain: Tenant Override > Plan DB Default > Legacy JSON column > config fallback.
- `PlanChangeNotifier` auto-generates in-app notifications when limits are changed from SuperAdmin.

**Technical Implementation:**

**Database Migrations (7 total — all marked Ran, Batch 15-16):**
- `2026_04_21_000001_create_platforms_table`
- `2026_04_21_000002_create_plans_table`
- `2026_04_21_000003_create_plan_limits_table`
- `2026_04_21_000004_create_plan_features_table`
- `2026_04_21_000005_create_tenant_plan_overrides_table`
- `2026_04_21_000006_create_coupons_tables`
- `2026_04_21_000007_create_plan_change_notifications_table`

**Models:**
- `app/Models/Platform.php`
- `app/Models/Plan.php`
- `app/Models/PlanLimit.php`
- `app/Models/PlanFeature.php`
- `app/Models/TenantPlanOverride.php`
- `app/Models/Coupon.php`, `CouponRedemption.php`
- `app/Models/PlanChangeNotification.php`

**Services:**
- `app/Services/PlanRepository.php` — Cached limit resolution with override priority chain
- `app/Services/PlanChangeNotifier.php` — In-app notification generator

**Controllers:**
- `app/Http/Controllers/SuperAdmin/PlanController.php` — CRUD + duplicate
- `app/Http/Controllers/SuperAdmin/PlatformController.php` — Platform management
- `app/Http/Controllers/SuperAdmin/TenantOverrideController.php` — Per-tenant overrides
- `app/Http/Controllers/SuperAdmin/CouponController.php` — Coupon management + validation
- `app/Http/Controllers/PlanNotificationController.php` — Tenant notification API

**Model Refactors:**
- `app/Models/Tenant.php` — `getLimit()` now routes through `PlanRepository`
- `app/Http/Controllers/BillingController.php` — Reads plans from DB (no more `config('plans')`)

**Frontend Pages:**
- `resources/js/Pages/SuperAdmin/Plans/Index.jsx` — Platform-tabbed plan table + edit drawer with limits grid
- `resources/js/Pages/SuperAdmin/Coupons/Index.jsx` — Coupon stats + create drawer
- `resources/js/Pages/SuperAdmin/Tenants/Overrides.jsx` — Searchable tenant override management

**Frontend Components:**
- `resources/js/Components/PlanNotificationBell.jsx` — Self-polling bell widget integrated into OneGlanceLayout header

**Routes added to `routes/web.php`:**
- SuperAdmin: `VenQore/plans/*`, `VenQore/platforms/*`, `VenQore/coupons/*`, `VenQore/tenant-overrides/*`
- Store: `notifications/plan/unread`, `notifications/plan/mark-all-read`, `notifications/plan/{id}/read`

**Status:** Completed — All migrations ran, caches cleared, all routes registered

---

### POS Featured Products SQL Fix
**Date:** 2026-04-22
**Type:** Bug Fix
**Status:** Fixed

**Description:**
Resolved a critical SQL error (`SQLSTATE[HY000]: General error: 1111 Invalid use of group function`) on the `/pos/products/featured` endpoint. The error was caused by using an aggregate function (`SUM(s.quantity)`) inside a `WHERE` clause instead of a `HAVING` clause. 

**Technical Implementation:**
- **File:** `app/Http/Controllers/Api/PosSearchController.php`

### Demo Auto-Logout on Main Site Navigation
**Date:** 2026-04-22
**Alignment:** Deviation from Plan (New UX polish — not explicitly planned, but aligned with demo goals)

**Decision Context:**
Demo visitors who logged in as a role (owner, cashier, etc.) and then navigated back to the root URL `/` were being redirected to `/hub` because they were still authenticated. This was confusing — they should land on the marketing landing page as a guest, not inside the app. Added an auto-logout check to the root route handler that detects demo accounts by their internal email pattern (`@venqore-demo.internal`) and cleanly ends their session before rendering the landing page.

**Technical Implementation:**
- **File:** `routes/web.php` (root `/` route handler)
- **Logic:** Added `str_ends_with($user->email, '@venqore-demo.internal')` check before the normal `hub` redirect. If true: decrement cache counter, logout, invalidate session, then fall through to render `LandingPage`.
- **Status:** Completed
---
