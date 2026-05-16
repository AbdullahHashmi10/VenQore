# VenQore POS - Ultimate Project Documentation

**Project Name:** VenQore POS – Advanced Management Dashboard & Point of Sale
**Tech Stack:** Laravel 11 (Backend), React 18 (Frontend), Inertia.js (Glue), Tailwind CSS (Styling), MySQL (Database).

---

# I. MASTER PAGE & ROUTE INDEX

This section lists every user-facing page in the application, its accessible route, and its primary function.

**Core Design Philosophy:** The "Midnight Nebula" theme powers the entire UI, featuring deep dark modes, glassmorphism, and vibrant accent colors. Every major module utilizes the **"One Glance"** sidebar layout, ensuring easy navigation and a unified experience. Note that **Every Single Feature Category** has its own dedicated dashboard for instant analytics.

### 1. CORE & AUTHENTICATION
| Page Component | Route | Functionality |
| :--- | :--- | :--- |
| `Home/Home.jsx` | `/home` | Landing page/Dashboard redirect. |
| `Dashboard.jsx` | `/dashboard` | Main Business Dashboard (Sales, Stock, Alerts). |
| `Auth/Login.jsx` | `/login` | Secure user authentication. |
| `Auth/Register.jsx` | `/register` | New user/admin registration. |
| `Auth/ForgotPassword.jsx` | `/forgot-password` | Email-based password recovery. |
| `Auth/ResetPassword.jsx` | `/reset-password` | Set new password. |
| `Auth/VerifyEmail.jsx` | `/verify-email` | Email ownership verification steps. |
| `Profile/Edit.jsx` | `/profile` | User account settings (Name, Password, 2FA). |

### 2. POINT OF SALE (POS)
| Page Component | Route | Functionality |
| :--- | :--- | :--- |
| `Pos.jsx` | `/pos` | **The Core POS Interface.** Features: Barcode scanning, Product search, Cart management, Cash/Card payments, Receipt printing, Hold/Park bills, Customer selection. |

### 3. SELL MODULE (SALES & CRM)
| Page Component | Route | Functionality |
| :--- | :--- | :--- |
| `Sales/Dashboard.jsx` | `/sales` | Analytics dashboard specific to sales performance. |
| `Sales/SalesHistory.jsx` | `/sales/list` | List of all invoices. Supports filtering, sorting, bulk actions. |
| `Sales/CreateInvoice.jsx` | `/sales/invoice/create` | Full-screen invoice builder (Back-office mode). |
| `Sales/CreatePreSale.jsx` | `/sales/presale/create` | Quotation/Pre-order builder (No stock reservation). |
| `Sales/Show.jsx` | `/sales/{id}` | Detailed Invoice view with Print, PDF, Email actions. |
| `Sales/MasterSales.jsx` | `/sales/master` | Advanced "Atomic" sales analysis tool. |
| `Sales/ParkedSales.jsx` | `/sales/parked-items` | Manage "On Hold" bills from the POS. |
| `Proposals/ProposalsList.jsx` | `/proposals` | View and manage generated quotations. |
| `SalesOrders/PreSales.jsx` | `/sales/pre-sales` | Manage active Sales Orders (Pre-orders). |
| `Returns/ReturnsHistory.jsx` | `/returns-history` | Log of all customer returns and refunds. |
| `Customers/Index.jsx` | `/customers` | Customer Database (CRM). |

### 4. PURCHASE MODULE (PROCUREMENT)
| Page Component | Route | Functionality |
| :--- | :--- | :--- |
| `Purchases/Index.jsx` | `/purchases` | List of Vendor Bills / Purchase Invoices. |
| `Purchases/Create.jsx` | `/purchases/create` | Record new stock purchase. |
| `PurchaseOrders/Index.jsx` | `/purchase-orders` | Manage POs sent to suppliers. |
| `Suppliers/Index.jsx` | `/suppliers` | Supplier/Vendor Database. |
| `DebitNotes/Index.jsx` | `/debit-notes` | Vendor Returns (Debit Notes) management. |

### 5. INVENTORY MODULE (STOCK & PRODUCTION)
| Page Component | Route | Functionality |
| :--- | :--- | :--- |
| `Inventory/InventoryList.jsx` | `/inventory/list` | Master Product Catalog. |
| `Inventory/StockLevels.jsx` | `/inventory/stock` | Real-time stock counts across warehouses. |
| `Inventory/Categories.jsx` | `/inventory/categories` | Product Category hierarchy management. |
| `StockOperations.jsx` | `/stock-operations` | Hub for Adjustments, Transfers, and Audits. |
| `StockTransfers/Index.jsx` | `/stock-transfers` | Warehouse-to-Warehouse movement logs. |
| `StockTake/Index.jsx` | `/stock-audit` | Physical Stock Taking / Auditing tool. |
| `Manufacturing/Rules.jsx` | `/manufacturing/rules` | Recipes/BOM setup for composite items. |
| `Production/Index.jsx` | `/inventory/production` | Manage Production Runs (Manufacturing batches). |
| `Labels/Index.jsx` | `/labels` | Barcode Label Generator & Printer. |
| `BatchTracking/Index.jsx` | `/batches` | Trace products by Lot/Batch number. |
| `SerialTracking/Index.jsx` | `/serials` | Trace individual Serial Numbers (IMEI/SN). |
| `Attributes/Index.jsx` | `/attributes` | Manage Variant Attributes (Size, Color, etc.). |
| `Variants/Index.jsx` | `/products/{id}/variants` | Manage specific variants of a product. |

### 6. FINANCE MODULE (ACCOUNTS)
| Page Component | Route | Functionality |
| :--- | :--- | :--- |
| `Finance/Dashboard.jsx` | `/finance` | Financial Health Overview (Cash Flow, Net Worth). |
| `Transactions/TransactionsList.jsx`| `/transactions` | Master Ledger of ALL money in/out. |
| `Payments/Index.jsx` | `/payments` | Payment vouchers (Receipts & Payments). |
| `Expenses/Index.jsx` | `/expenses` | Expense recording and categorization. |
| `BankAccounts/Index.jsx` | `/bank-accounts` | Bank Account setup and balance tracking. |
| `BankReconciliation/Index.jsx`| `/bank-reconciliation` | Reconcile bank statements with ERP records. |
| `Funds/Index.jsx` | `/funds` | Capital/Equity management and transfers. |
| `Accounting/Dashboard.jsx` | `/accounting` | Double-Entry Accounting Hub. |
| `Accounting/ChartOfAccounts.jsx`| `/accounting/chart` | COA Setup (Assets, Liabilities, Equity, Income, Expense). |

### 7. REPORTS MODULE (BI & ANALYTICS)
**Hub:** `Reports/ReportsHub.jsx` (`/reports`)
**Sub-Reports:**
- **Sales:** `Sales.jsx`, `SaleAging.jsx`, `SaleOrders.jsx`, `SalePurchaseByParty.jsx`, `SalePurchaseByPartyGroup.jsx`, `SaleOrderItems.jsx`
- **Inventory:** `Purchases.jsx`, `StockValuation.jsx`, `LowStock.jsx`, `StockAging.jsx`, `StockSummaryByCategory.jsx`, `MovementHistory.jsx`, `ExpiryReport.jsx`, `ItemDetail.jsx`, `ItemWiseDiscount.jsx`, `ItemWiseProfit.jsx`
- **Financial:** `ProfitLoss.jsx` (P&L), `BalanceSheet.jsx`, `TrialBalance.jsx`, `CashFlow.jsx`, `Tax.jsx`, `TaxRateReport.jsx`, `BankStatement.jsx`, `LoanStatement.jsx`, `BillWiseProfit.jsx`, `ExpenseByCategory.jsx`, `ExpenseByItem.jsx`.
- **Party:** `AllParties.jsx`, `PartyStatement.jsx`, `PartyWiseProfitLoss.jsx`.
- **Visuals:** `GraphAnalytics.jsx` (Charts/Graphs).

### 8. ADMIN & SYSTEM
| Page Component | Route | Functionality |
| :--- | :--- | :--- |
| `Admin/Dashboard.jsx` | `/admin-panel/dashboard`| Platform Owner Monitoring Dashboard. |
| `Admin/Users.jsx` | `/admin-panel/users` | Employee/User Management & Roles. |
| `Admin/Settings.jsx` | `/admin-panel/settings`| **Global System Configuration.** |
| `Admin/DataManagement.jsx` | `/admin-panel/data` | Database Backup, Import, and Export. |
| `ActivityLog.jsx` | `/activity-log` | Audit Trail of all user actions. |
| `RecycleBin.jsx` | `/recycle-bin` | Restore deleted items. |
| `StaffAttendance/Index.jsx` | `/staff/attendance` | Biometric/Manual Attendance logs. |
| `StaffAttendance/Show.jsx` | `/staff/attendance/{id}`| Individual staff attendance record. |

### 9. GROWTH & EXTRAS
| Page Component | Route | Functionality |
| :--- | :--- | :--- |
| `Marketing/Campaigns.jsx` | `/marketing/campaigns` | SMS/WhatsApp Marketing tools. |
| `OnlineStore/Manager.jsx` | `/online-store-manager` | E-commerce settings (Storefront config). |
| `WooCommerce/Index.jsx` | `/woocommerce-sync` | WordPress/WooCommerce Bridge. |
| `Cookbook/Index.jsx` | `/cookbook` | Corporate Knowledge Base / Recipe Book. |
| `EInvoicing/Index.jsx` | `/e-invoicing` | FBR/Tax Authority Integration settings. |
| `GrowthEngine/Index.jsx` | `/growth-engine` | AI-driven business insights. |

---

# II. DETAILED FEATURE LIST

This section breaks down "every single dot" of functionality available in the system, organized by category.

## A. SYSTEM CONFIGURATION & SETTINGS
*(Located in `Admin/Settings.jsx`)*

### 1. Business Identity
- **Custom Branding:** Set Business Name, Email, Phone, Address.
- **Tax Identity:** Define NTN/VAT/Tax Number.
- **Localization:**
    - **Multi-Currency Support:** PKR, USD, EUR, GBP, AED, SAR, INR.
    - **Timezone Selection:** 5 major global timezones supported.
    - **Date Formats:** Customizable date display.

### 2. General UI & Security
- **Secure Passcode:** Enable 4-6 digit PIN for sensitive actions (Admin actions).
- **Multi-Firm:** Support for managing multiple business entities under one install.
- **UI Scaling:** Adjustable interface size (75% to 125%) for different screen sizes.
- **Decimal Precision:** Configurable decimal places (0 to 3) for prices.
- **Negative Stock Control:** Option to blocking sales if stock is insufficient.
- **2FA:** Two-Factor Authentication toggle.
- **Auto-Logout:** Configurable inactivity timer for security.
- **Dark Mode:** System-wide dark mode support with auto-detection.

### 3. AI Intelligence (The "Brain")
- **AI Providers:** Switch between **Google Gemini** (Free Tier supported) and **OpenAI GPT-4** (Paid).
- **Model Selection:** Choose specific models (Gemini Flash, GPT-4o, GPT-3.5).
- **Key Verification:** Built-in tool to test API keys validity.
- **Smart Search:** Natural language querying (e.g., "Show me sales from last friday").

### 4. Transaction & Billing Rules
- **Invoice Numbering:** Toggle manual vs automatic invoice numbers.
- **Prefixes:** Custom prefixes for Sales (`INV-`) and Purchases (`PUR-`).
- **Billing Modes:** "Lite" (Fast) vs "Full" (Detailed) sale modes.
- **Rounding:** Auto-round off totals (e.g., to nearest integer).
- **POS Defaults:** Auto-fill "Cash Received" field for speed.
- **Profit Margins:** Toggle visibility of profit margins on the sales screen.

### 5. Printing & Receipts
- **Printer Types:** Support for **Regular (A4/A5/Legal)** and **Thermal (3-inch)** printers.
- **Orientation:** Portrait vs Landscape support.
- **Header/Footer:** Custom "Authorized Signatory" text, Logo printing toggle.
- **Live Preview:** Real-time visual preview of receipt layout in settings.

### 6. Tax Management
- **Dynamic Rates:** Create unlimited tax rules (GST 18%, VAT 5%, Zero Rated).
- **Tax Types:** Support for Percentage-based (%) or Fixed Amount taxes.

### 7. Messaging & Notifications
- **WhatsApp Integration:** Meta Business API connection for sending invoices via WhatsApp.
- **SMS Integration:** Auto-send SMS to parties on transaction.
- **Templates:** Customizable message templates with dynamic placeholders (`[Firm_Name]`, `[Invoice_Amount]`).

## B. INVENTORY & PRODUCT FEATURES

### 1. Product Management
- **Variants:** Support for Size/Color/Style variants (e.g., Shirt -> Red/XL).
- **Batch Tracking:** Track expiration dates and lot numbers (Crucial for Pharmacy/Food).
- **Serial Tracking:** Track individual unique items (IMEI for phones, Serial for electronics).
- **Barcodes:** Generation and scanning support.
- **Categorization:** Hierarchical categories for products.
- **Units:** Multiple units of measure (kg, pcs, box).

### 2. Manufacturing & Bundles
- **BOM (Bill of Materials):** Define recipes for products (e.g., Burger = Bun + Patty + Sauce).
- **Production Runs:** Execute manufacturing to deduct raw materials and add finished goods.
- **Cost Calculation:** Automated cost storage based on ingredient prices.

### 3. Stock Control
- **Multi-Warehouse:** Manage stock across different locations/stores.
- **Stock Transfers:** Moving items between warehouses with audit logs.
- **Stock Audits (Stock Take):** Physical vs System stock reconciliation tools.
- **Low Stock Alerts:** Automated warnings when items breach threshold.
- **Negative Stock Prevention:** Optional hard-stop on selling out-of-stock items.

## C. SALES & POS FEATURES

### 1. Point of Sale (POS)
- **High-Speed Interface:** Keyboard-first design for rapid checkout.
- **Cart Management:** Hold/Park bills to serve other customers, then Recall.
- **Search:** Instant product lookup by Name, Barcode, or SKU.
- **Customer Association:** Link sales to walk-in or registered customers.
- **Discounting:** Line-item discounts and Global/Cart discounts.

### 2. Sales Operations
- **Quotations/Pre-Sales:** Create quotes that don't affect stock until converted.
- **Sales Orders:** Manage long-term orders.
- **Recurring Invoices:** Automate subscription-style billing.
- **Returns:** Full RMA (Return Merchandise Authorization) workflow with refunds to Cash or Ledger.
- **Parked Sales:** "Tab" management for restaurants or active counters.

## D. FINANCE & ACCOUNTING FEATURES

### 1. Ledgers & Banking
- **Double-Entry:** Fully compliant double-entry accounting backend.
- **Chart of Accounts:** Customizable financial structure.
- **Bank Reconciliation:** Match system records with imported bank statements.
- **Fund Management:** Manage petty cash and capital injections.

### 2. Payments & Expenses
- **Payment Vouchers:** Record Receipts (Ins) and Payments (Outs).
- **Expense Recording:** Categorized expense tracking (Rent, Utilities, Salary).
- **Custom Charges:** Add arbitrary fees (Delivery, Service Charge) to bills.

## E. CUSTOMER RELATIONSHIP (CRM) & GROWTH

### 2. Inventory & Manufacturing
- **Product Management:**
    - **Variants:** Comprehensive variant system (Size, Color, etc.) with individual SKU tracking.
    - **Batch & Serial Tracking:** expiration dates for perishables and serial numbers for warranties.
    - **Low Stock Alerts:** Visual color-coded indicators (Red/Amber) for critical stock levels.
    - **Digital Catalogs:** Grid/List views with image previews and instant search.
- **Manufacturing & Bundles:**
    - **Dynamic BOM (Bill of Materials):** Define recipes where 1 Widget = 2 Raw Material A + 1 Raw Material B.
    - **Auto-Deduction:** Selling a bundle automatically deducts component stock.
    - **Cookbook Mode:** Dedicated recipe management interface for food businesses.
    - **Production Runs:** Track manufacturing batches and yields.
- **Stock Control:**
    - **Stock Audits:** Reconcile physical vs. system stock.
    - **Transfers:** Move inventory between multiple warehouses/locations.
    - **Adjustments:** Manually correct stock levels with reason codes (Damaged, Theft).
    - **Negative Stock:** Settings-controlled permission to sell items into negative inventory.

### 3. Sales & POS Features
- **High-Speed POS:**
    - **Quick Entry (Alt+Q):** Keyboard-first mode for rapid product addition.
    - **Barcode Scanning:** Intelligent scanner handling; scanning a small number (e.g., "5") updates the last item's quantity.
    - **Profit Sneak Peek:** Drag down on the total to reveal per-transaction profit (secured by UI lock).
    - **Senior Mode:** Accessibility toggle for larger text and simplified interfaces.
    - **Walk-in & Registered Customers:** Seamless switching between guest and loyal customers.
- **Cart Management:**
    - **Hold/Park Sale:** Save carts for later retrieval.
    - **Multi-Level Discounts:** Apply discounts by fixed amount or percentage, per item or on the subtotal.
    - **Custom Charges:** Add delivery fees or service charges on the fly.
- **Quotations & Pre-Orders:**
    - **Proposals:** Create formal quotes with "Valid Until" dates; one-click conversion to Sale.
    - **Pre-Orders:** Manage advance bookings with partial payments; deducts stock only upon confirmation.
    - **Shareable Links:** Generate WhatsApp/Email friendly text/links for quotes.

### 4. Finance & Accounting
- **Double-Entry Ledgers:** Automatic background journal entries for every transaction.
- **Chart of Accounts:** Fully customizable hierarchy for Assets, Liabilities, Equity, Income, and Expenses.
- **Bank Reconciliation:** Match system records with bank statements.
- **Fund Management:** Track cash flow across different accounts (Petty Cash, Bank, Drawers).
- **Expense Tracking:** Record operating costs with category breakdowns.
- **Loan Management:** Track loans given to or taken from parties.

### 5. Analytics & Reports Hub
- **Sales & Income:**
    - **Sales Analytics:** Visual graphs for revenue trends, comparison by period.
    - **Profit & Loss:** Detail view of net income (Revenue - COGS - Expenses).
    - **Item/Bill Profit:** Granular profitability analysis per product or individual invoice.
- **Inventory & Purchase:**
    - **Stock Aging:** Identify slow-moving vs. fast-moving stock to optimize purchasing.
    - **Stock Valuation:** Real-time calculation of total asset value.
    - **Movement History:** Full audit trail of every stock change.
- **Parties & Relationships:**
    - **Party Statements:** General ledger view for any customer or supplier.
    - **Party-wise P&L:** Determine which customers make you the most money.
- **Visuals:** All reports feature "Card Views" for key metrics (Total Revenue, Net Profit) at the top. based on historic data.

## F. TECHNICAL & ADVANCED FEATURES

### 1. System Configuration (Admin Settings)
- **AI Intelligence:**
    - **Provider Choice:** Switch between Google Gemini (Free Tier) and OpenAI GPT-4.
    - **Key Verification:** "Check Key" button to validate API credentials instantly.
    - **Model Selection:** Choose specific models (e.g., Gemini Flash, GPT-4 Turbo).
- **Hardware & Printing:**
    - **Printer Types:** Toggle between "Regular (A4/Legal)" and "Thermal (3-inch)" modes.
    - **Live Preview:** Real-time visual preview of invoice layout while editing settings.
    - **Signature:** Custom text field for "Authorized Signatory" label.
- **Security & Access:**
    - **Passcode Protection:** System-wide PIN for sensitive actions (deleting, refunding).
    - **2FA:** Two-factor authentication for admin login.
    - **Activity Log:** Comprehensive audit trail of user actions.
- **Data Management:**
- **Activity Log:** Comprehensive audit trail of user actions.
- **Data Management:**
    - **Backup:** One-click database backup and download.
    - **Recycle Bin:** Soft-delete system for restoring accidentally removed items.

### 2. Staff Management
- **Attendance:** Check-in/Check-out logging.
- **Permissions:** Granular role-based access control (Admin, Manager, Cashier).
- **Gaps:** Tracking unexplained gaps in staff activity.

### 3. Developer/System
- **Cookbook:** Internal developer documentation/knowledge base module.
- **API:** Ready-to-use API endpoints for external integrations (`/api/...`).
- **PWA:** Progressive Web App capable (installable on mobile/tablet).
