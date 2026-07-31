---
tags: [controllers]
---

# Controllers Directory

Part of [[VenQore POS - Home]] · [[Route Map Overview]]

185 controllers across these directories:

## Top-level (`app/Http/Controllers/*.php`) — selected
| Controller | Purpose |
|---|---|
| `SaleController` | Core sales/POS transaction CRUD, park/recall, cancel, return |
| `PurchaseController` | Purchase transactions CRUD, receiving |
| `InventoryController` | Product/stock catalog CRUD, categories, search, history |
| `PosController` | POS terminal page, sessions, categories |
| `PosReturnController` | POS-side return processing |
| `PartyController` | Unified customer/supplier CRUD, ledgers, search |
| `AccountingController` | Chart of accounts, P&L, balance sheet (legacy module) |
| `FinanceController` | Bank accounts, receivables/payables dashboards |
| `ReportController` | Legacy reporting module (~45 endpoints) |
| `BillingController` | Lemon Squeezy subscription billing |
| `GrowthEngineController` | Loyalty points, gift cards, store credit, marketing insights |
| `AiController` | AI recommendations, smart reorder, cash-flow forecast |
| `VenSynQController` | Multi-channel (Amazon/TikTok/eBay) fulfillment engine |
| `CookbookController` | Composite product recipe management + simulation |
| `DrmLicenseController` | Offline DRM license validation |
| `InstallerController` | First-run installer wizard |
| `UpdaterController` | In-app self-update mechanism |
| `BackupController` / `VqBackupController` | Raw SQL DB backup + Google Drive sync |
| `SmartCaptureController` | (SmartCapture/) AI document/receipt scanning |

*(Full list of 90+ top-level controllers spans admin, auth, staff, stock, sales, purchase, party, finance, report, growth, notification, and system-utility concerns — see the codebase directly for exhaustive enumeration.)*

## `Admin/` — store-admin-adjacent + platform tooling
`AdminDashboardController` (superadmin.* routes), `DemoStoreController`, `DigitalHubController`, `HealthCheckController`, `ImpersonationController`, `JobsController`, `NewsletterHubController`, `PkVerificationController`, `SmokeTestController`, `SuperAdminController` (largest — stores/users mgmt, AppSumo, partners/drawings, settings), `SupportController`, `SystemResetController`, `VenaTicketsController`.

## `SuperAdmin/` — platform monetization CRUD
`AccessGrantController`, `CouponController`, `PlanController`, `PlatformController`, `TenantOverrideController`.

## `Api/`
`BankAccountController` (invokable), `ErrorReporterController`, `HeartbeatController`, `ManufacturingRuleController`, `PlanUsageController`, `PosSearchController`, `SyncController`, `TerminalActivityController`.

## `Auth/`
`AuthenticatedSessionController`, `ConfirmablePasswordController`, `EmailVerification*Controller`, `GoogleAuthController`, `NewPasswordController`, `PasswordController`, `PasswordResetLinkController`, `PlatformOwnerAuthController`, `RegisteredUserController`, `StaffAuthController`, `TwoFactorController`, `VerifyEmailController`.

## `Marketing/`
`BlogController`, `ContactController`, `DigitalProductsPublicController`, `NewsletterController`, `PartnerSupportController`, `SitemapController`.

## `V3/` (36 controllers)
One per domain concept — see [[V3 ERP Routes]] for the full list.

## `WooSync/`
`WooConnectionController`, `WooHandshakeController`, `WooWebhookController`.

## Related
- [[Store Context Routes]]
- [[Platform & SuperAdmin Routes]]
- [[V3 ERP Routes]]
