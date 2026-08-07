---
tags: [frontend, pages]
---

# Pages Directory Structure

Part of [[VenQore POS - Home]] · [[Frontend Architecture]]

238 `.jsx` files under `resources/js/Pages/`. Root-level pages: `Dashboard.jsx`, `Pos.jsx`, `Welcome.jsx`.

| Folder | Representative files |
|---|---|
| `Accounting/` | `BalanceSheet.jsx`, `ChartOfAccounts.jsx`, `ProfitLoss.jsx` |
| `Admin/` | Store-level admin pages |
| `Auth/` | Login, Register, ForgotPassword, ConfirmPassword |
| `BankAccounts/`, `BankReconciliation/` | Bank account CRUD, reconciliation workflow |
| `BatchTracking/` | Expiry/batch stock pages |
| `Billing/` | Tenant subscription billing |
| `Cookbook/` | Composite product "recipe" pages |
| `Dashboards/` | Role/segment dashboards |
| `DebitNotes/` | Supplier debit notes |
| `Demo/` | Demo-mode/sandbox pages |
| `EInvoicing/` | E-invoice compliance pages |
| `Expenses/`, `Finance/`, `Funds/` | Expense entry, funds/bank overview |
| `Gift/` | Public gift-card redemption pages |
| `GrowthEngine/` | Marketing/growth tooling |
| `Hub/` | Multi-store hub |
| `Installer/` | First-run installer wizard |
| `Inventory/` (+ `Attributes/`, `Production/`, `Variants/`) | Stock pages, product attributes, manufacturing, variants |
| `Invite/` | Staff invite acceptance |
| `Labels/` | Barcode/label printing |
| `Manufacturing/` | Production/manufacturing pages |
| `Marketing/` (+ `Blog/`, `Compare/`, `Solutions/`, `Tools/`, `Shared/`) | Public marketing site: `About.jsx`, `Pricing.jsx`, `Features.jsx`, `Contact.jsx`, `Roadmap.jsx`, `VenSynQ.jsx`, `SmartCapture.jsx`, `Compare/Index.jsx`, `Compare/Show.jsx`, `Solutions/Index.jsx`, `Solutions/Show.jsx` |
| `OnlineStore/` | Storefront/e-commerce pages |
| `Parties/`, `Payments/` | Customers & suppliers, payment records |
| `Platform/`, `PlatformOwner/` | Platform-level pages, distinct from SuperAdmin |
| `PreSales/`, `Proposals/` | Pre-sale/quote invoices |
| `PurchaseOrders/`, `Purchases/` | PO management, purchase transactions |
| `RecurringInvoices/`, `Reminders/` | Recurring billing, reminder/task pages |
| `Reports/` (+ `Components/`) | ~50 report pages — `ProfitLoss.jsx`, `TrialBalance.jsx`, `StockValuation.jsx`, `PartyStatement.jsx`, `ReportsHub.jsx` |
| `Returns/` | Sales/purchase returns |
| `Sales/` (+ `Customers/`, `Orders/`) | `CreateInvoice.jsx`, `MasterSales.jsx`, `SalesHistory.jsx`, `Show.jsx`, `Analytics.jsx`, `ParkedSales.jsx` |
| `SalesOrders/`, `SerialTracking/` | Sales order pages, serialized item tracking |
| `Settings/` | `SettingsPanel.jsx`, `ChatbotSettings.jsx` |
| `Staff/`, `StaffAttendance/` | Staff management, attendance |
| `StockTake/`, `StockTransfers/` | Stock-take/counting, inter-warehouse transfers |
| `Store/` (+ `Staff/`) | Store profile settings |
| `SuperAdmin/` (+ `AccessGrants/`, `AppSumo/`, `Coupons/`, `DigitalHub/`, `Health/`, `NewsletterHub/`, `Plans/`, `Platforms/`, `Tenants/`) | `Dashboard.jsx`, `Stores.jsx`, `Users.jsx` plus platform subpages |
| `Suppliers/`, `Transactions/` | Supplier pages, generic transaction views |
| `Updater/` | App updater UI |
| `V3/` (+ `Products/`, `Purchases/`, `Warehouses/`) | Next-gen/rewrite module in progress |
| `VenSynQ/` | Product-specific feature module |
| `WooCommerce/` | WooCommerce integration settings/sync pages |

> [!warning] Duplicate-cased Contexts directory
> Both `resources/js/Contexts/` and `resources/js/contexts/` exist with identical filenames — likely dead code or a case-sensitivity risk (Windows is case-insensitive, but Linux CI/production is not). Worth flagging to the team.

## Related
- [[Frontend Architecture]]
- [[Components & Layouts]]
