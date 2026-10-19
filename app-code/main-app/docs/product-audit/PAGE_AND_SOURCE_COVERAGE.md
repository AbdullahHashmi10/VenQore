# Page and source coverage

Snapshot: 16 October 2026. This is a source inventory, not a record of browser passes. Every page below still needs the authenticated walkthrough. A page file may be a component, redirect target, retired implementation or dynamically rendered page; file count is not feature count.

| Measure | Count |
| --- | --- |
| files_catalogued | 36893 |
| source_files_read | 5134 |
| source_lines | 1319739 |
| pages | 393 |
| documents_indexed | 832 |
| route_entries | 1378 |
| page_without_literal_render | 62 |

## Every React page file

| Page / component | Literal render source(s) | Referenced routes | Validation |
| --- | --- | --- | --- |
| Dashboard.jsx | app-code/main-app/app/Http/Controllers/DashboardController.php; app-code/main-app/app/Services/Dashboard/DashboardPresenter.php; app-code/main-app/docs/PROJECT.md | store.pos; store.sales.index; store.reports.dashboard; store.finance.receivables; store.finance.payables; store.reports.profit-loss; store.inventory.index; store.purchases.create; store.purchases.index; store.purchases.show | Source only |
| Error.jsx | app-code/main-app/routes/web.php |  | Source only |
| Home.jsx | app-code/main-app/app/Http/Controllers/DashboardController.php | store.sales.index; store.admin.logs | Source only |
| LandingPage.jsx | app-code/main-app/routes/web.php |  | Source only |
| NewDashboard.jsx | DASHBOARD_AND_SIDEBAR_FRAME_SYSTEM.md; VENQORE_BUILDER_STATE_AND_PLAN.md; venqore_remaining_work_brief.md; app-code/main-app/app/Http/Controllers/DashboardController.php; app-code/main-app/routes/web.php |  | Source only |
| NewInvoice.jsx | app-code/main-app/app/Http/Controllers/NewInvoiceController.php |  | Source only |
| Pos.jsx | app-code/main-app/app/Http/Controllers/PosController.php | store.pos.modifiers; store.inventory.search; store.pos.recent-sales; store.dashboard; store.pos.search; store.pos.barcode; store.pos.sales.store; store.onboarding.step; store.customers.search; store.sales.parked; store.sales.park; store.sales.recall; store.sales.parked.delete; store.pos.categories; store.pos.featured; store.sales.lookup; store.pos.return.store; store.sales.return; store.foh; store.bank-accounts.store | Source only |
| PrivacyPolicy.jsx | app-code/main-app/routes/web.php |  | Source only |
| RecycleBin.jsx | app-code/main-app/app/Http/Controllers/RecycleBinController.php | store.admin.recycle-bin.restore; store.admin.recycle-bin.force-delete | Source only |
| Redeem.jsx | app-code/main-app/app/Http/Controllers/AppSumoController.php | redeem.submit; login | Source only |
| RefundPolicy.jsx | app-code/main-app/routes/web.php |  | Source only |
| SetupWizard.jsx | app-code/main-app/app/Http/Controllers/SetupController.php | store.setup.complete | Source only |
| StockOperations.jsx | app-code/main-app/app/Http/Controllers/StockOperationsController.php | store.stock-operations.warehouse.update; store.stock-operations.warehouse.store; store.stock-operations.transfer; store.stock-operations.adjust; store.inventory.check-dependencies; store.inventory.bulk-destroy; store.stock-operations.audit | Source only |
| TermsOfService.jsx | app-code/main-app/routes/web.php |  | Source only |
| Track.jsx | app-code/main-app/app/Http/Controllers/TrackingController.php |  | Source only |
| Welcome.jsx | app-code/main-app/routes/web.php |  | Source only |
| WhatIsIncluded.jsx | app-code/main-app/routes/web.php | redeem | Source only |
| Accounting/BalanceSheet.jsx | app-code/main-app/app/Http/Controllers/AccountingController.php; app-code/main-app/app/Http/Controllers/ReportController.php | store.accounting.balance-sheet | Source only |
| Accounting/ChartOfAccounts.jsx | app-code/main-app/app/Http/Controllers/AccountingController.php |  | Source only |
| Accounting/Dashboard.jsx | app-code/main-app/app/Http/Controllers/AccountingController.php |  | Source only |
| Accounting/ProfitLoss.jsx | app-code/main-app/app/Http/Controllers/AccountingController.php |  | Source only |
| Admin/AgentInbox.jsx | app-code/main-app/routes/web.php |  | Source only |
| Admin/Backups.jsx | app-code/main-app/app/Http/Controllers/BackupController.php | store.backups.store; store.backups.restore | Source only |
| Admin/DataManagement.jsx | app-code/main-app/app/Http/Controllers/DataManagementController.php | store.google.backup.restore; store.google.backup.delete; store.google.settings; store.google.sync-now; store.admin.data.export; store.admin.data.upload-mapping; store.backup.import; store.admin.data.template; store.backups.store; store.backups.restore; store.admin.settings.update; store.legacy.admin.migration.analyze; store.legacy.admin.migration.execute; store.google.disconnect; store.google.redirect; store.google.backup.download; store.backup.export; store.backups.download; store.parties.index; store.inventory.index; store.onboarding.step; store.dashboard | Source only |
| Admin/DataMapping.jsx | app-code/main-app/app/Http/Controllers/ImportMappingController.php | store.admin.data.validate-import; store.admin.data.process-import; store.admin.data | Source only |
| Admin/Database.jsx | app-code/main-app/app/Http/Controllers/AdminController.php | store.backups.store | Source only |
| Admin/ExecutiveDashboard.jsx | app-code/main-app/app/Http/Controllers/AdminController.php; app-code/main-app/app/Http/Controllers/Admin/StoreAdminController.php |  | Source only |
| Admin/FiscalYears.jsx | app-code/main-app/app/Http/Controllers/V3/FiscalYearController.php | store.v3.fiscal-year.preview; store.v3.fiscal-year.store; store.v3.fiscal-year.close; store.v3.fiscal-year.reopen; store.v3.fiscal-year.locks.store; store.v3.fiscal-year.exceptions.store; store.v3.fiscal-year.report | Source only |
| Admin/Logs.jsx | app-code/main-app/app/Http/Controllers/ActivityLogController.php; app-code/main-app/app/Http/Controllers/AdminController.php |  | Source only |
| Admin/Migration.jsx | app-code/main-app/app/Http/Controllers/MigrationController.php | store.legacy.admin.migration.analyze; store.legacy.admin.migration.execute; store.parties.index; store.inventory.index | Source only |
| Admin/Settings.jsx | app-code/main-app/app/Http/Controllers/AdminController.php | store.ai.test; store.settings.update; store.admin.data | Source only |
| Admin/Users.jsx | app-code/main-app/app/Http/Controllers/AdminController.php; app-code/main-app/app/Http/Controllers/StaffInvitationController.php; app-code/main-app/app/Http/Controllers/Admin/StoreAdminController.php | store.billing.checkout-addon; store.billing; store.settings.update; store.builder.apply; store.builder; store.admin.invitations.store; store.admin.users.update; store.admin.users.remove | Source only |
| Admin/VenaTicketDetail.jsx | app-code/main-app/app/Http/Controllers/Admin/VenaTicketsController.php | platform.vena.tickets; store.admin.vena.tickets | Source only |
| Admin/VenaTickets.jsx | app-code/main-app/app/Http/Controllers/Admin/VenaTicketsController.php | store.admin.vena.ticket.create; platform.vena.tickets; store.admin.vena.tickets; platform.vena.ticket.show; store.admin.vena.ticket.show | Source only |
| AiUsage/Index.jsx | app-code/main-app/app/Http/Controllers/AiUsageController.php | store.billing.checkout-addon; store.admin.settings | Source only |
| Approvals/Correct.jsx | app-code/main-app/app/Http/Controllers/ApprovalDocumentController.php |  | Source only |
| Approvals/Inbox.jsx | app-code/main-app/app/Http/Controllers/ApprovalDocumentController.php | store.approvals.inbox; store.settings; store.approvals.show | Source only |
| Approvals/MySubmissions.jsx | app-code/main-app/app/Http/Controllers/ApprovalDocumentController.php | store.approvals.show; store.approvals.correct | Source only |
| Approvals/Show.jsx | app-code/main-app/app/Http/Controllers/ApprovalDocumentController.php | store.approvals.approve; store.approvals.inbox; store.approvals.return; store.approvals.reject; store.approvals.withdraw; store.approvals.my-submissions; store.approvals.correct | Source only |
| Approvals/Components/AdjustmentReviewView.jsx |  |  | Source only |
| Approvals/Components/AuditHistoryDrawer.jsx |  |  | Source only |
| Approvals/Components/DecisionModal.jsx |  |  | Source only |
| Approvals/Components/DocumentReviewHeader.jsx |  | store.approvals.my-submissions; store.approvals.inbox; store.approvals.correct | Source only |
| Approvals/Components/FundMovementApprovalView.jsx |  | store.approvals.approve; store.approvals.inbox | Source only |
| Approvals/Components/FundTransferApprovalView.jsx |  | store.approvals.approve; store.approvals.inbox | Source only |
| Approvals/Components/MoneyVoucherReviewView.jsx |  |  | Source only |
| Approvals/Components/OperatingExpenseApprovalView.jsx |  | store.approvals.inbox; store.approvals.approve | Source only |
| Approvals/Components/PartyAdjustmentApprovalView.jsx |  | store.approvals.approve; store.approvals.inbox | Source only |
| Approvals/Components/PaymentInApprovalView.jsx |  | store.approvals.approve; store.approvals.inbox | Source only |
| Approvals/Components/PaymentOutApprovalView.jsx |  | store.approvals.approve; store.approvals.inbox | Source only |
| Approvals/Components/ProposalApprovalView.jsx |  | store.approvals.inbox; store.approvals.approve | Source only |
| Approvals/Components/PurchaseReviewView.jsx |  |  | Source only |
| Approvals/Components/SalesInvoiceApprovalView.jsx |  | store.approvals.inbox; store.approvals.approve | Source only |
| Approvals/Components/SalesReturnApprovalView.jsx |  | store.approvals.inbox; store.approvals.approve | Source only |
| Approvals/Components/SalesReviewView.jsx |  |  | Source only |
| Approvals/Components/TransferReviewView.jsx |  |  | Source only |
| Apps/Index.jsx | app-code/main-app/app/Http/Controllers/AppsController.php; app-code/main-app/routes/web.php | store.billing; store.dashboard | Source only |
| Auth/AcceptInvite.jsx | app-code/main-app/app/Http/Controllers/StaffController.php |  | Source only |
| Auth/ConfirmPassword.jsx | app-code/main-app/app/Http/Controllers/Auth/ConfirmablePasswordController.php |  | Source only |
| Auth/ForgotPassword.jsx | app-code/main-app/app/Http/Controllers/Auth/PasswordResetLinkController.php | login | Source only |
| Auth/Login.jsx | app-code/main-app/app/Http/Controllers/Auth/AuthenticatedSessionController.php | register; password.request; auth.google | Source only |
| Auth/Register.jsx | app-code/main-app/app/Http/Controllers/Auth/RegisteredUserController.php | login; terms; privacy; auth.google | Source only |
| Auth/ResetPassword.jsx | app-code/main-app/app/Http/Controllers/Auth/NewPasswordController.php |  | Source only |
| Auth/StaffLogin.jsx | app-code/main-app/app/Http/Controllers/Auth/StaffAuthController.php | login | Source only |
| Auth/TwoFactorSetup.jsx | app-code/main-app/app/Http/Controllers/Auth/TwoFactorController.php |  | Source only |
| Auth/TwoFactorVerify.jsx | app-code/main-app/app/Http/Controllers/Auth/TwoFactorController.php |  | Source only |
| Auth/VerifyCode.jsx | app-code/main-app/app/Http/Controllers/Auth/EmailOtpController.php | otp.verify; otp.resend; otp.cancel | Source only |
| Auth/VerifyEmail.jsx | app-code/main-app/app/Http/Controllers/Auth/EmailVerificationPromptController.php | logout | Source only |
| BankAccounts/BankAccountsList.jsx | app-code/main-app/app/Http/Controllers/FinanceController.php | store.bank-accounts.destroy; store.bank-accounts.update; store.bank-accounts.store; store.bank-accounts.transactions | Source only |
| BankAccounts/Transactions.jsx | app-code/main-app/app/Http/Controllers/FinanceController.php | store.bank-accounts.index | Source only |
| BankReconciliation/BankReconciliation.jsx | app-code/main-app/app/Http/Controllers/BankReconciliationController.php |  | Source only |
| BatchTracking/BatchTracking.jsx | app-code/main-app/app/Http/Controllers/BatchTrackingController.php | store.batches.index | Source only |
| Billing/Index.jsx | app-code/main-app/app/Http/Controllers/BillingController.php | store.billing.payment-history; store.billing.sync-subscription; store.billing.upgrade; store.billing.change-plan; store.billing.cancel-subscription; store.billing.resume-subscription; store.apps; platform.pk-verifications.submit | Source only |
| Builder/Index.jsx | app-code/main-app/app/Http/Controllers/BuilderController.php | store.builder.preview; store.builder.data-at-stake; store.builder.apply; store.builder.modify; store.onboarding.v2; store.dashboard | Source only |
| ChequeBooks/Create.jsx | app-code/main-app/app/Http/Controllers/ChequeBookController.php | store.banking.cheque-books.store; store.banking.cheque-books.index | Source only |
| ChequeBooks/Index.jsx | app-code/main-app/app/Http/Controllers/ChequeBookController.php | store.banking.cheque-books.index; store.banking.cheque-books.close; store.banking.cheque-books.destroy; store.banking.reports.outgoing-cheques; store.banking.cheque-books.create; store.banking.cheque-books.show | Source only |
| ChequeBooks/ReceivedCheques.jsx | app-code/main-app/app/Http/Controllers/ReceivedChequeController.php | store.banking.received-cheques.index; store.banking.received-cheques.store; store.banking.received-cheques.deposit; store.banking.received-cheques.clear; store.banking.received-cheques.bounce; store.banking.received-cheques.return; store.banking.reports.incoming-cheques | Source only |
| ChequeBooks/Show.jsx | app-code/main-app/app/Http/Controllers/ChequeBookController.php | store.banking.cheque-books.show; store.banking.cheque-leaves.void; store.banking.cheque-leaves.stop; store.banking.cheque-leaves.clear; store.banking.cheque-leaves.bounce; store.banking.cheque-books.index | Source only |
| ChequeBooks/Reports/IncomingRegister.jsx | app-code/main-app/app/Http/Controllers/ChequeReportController.php | store.banking.reports.incoming-cheques | Source only |
| ChequeBooks/Reports/OutgoingRegister.jsx | app-code/main-app/app/Http/Controllers/ChequeReportController.php | store.banking.reports.outgoing-cheques | Source only |
| ChequeBooks/Reports/PostDated.jsx | app-code/main-app/app/Http/Controllers/ChequeReportController.php |  | Source only |
| ChequeBooks/Reports/Utilization.jsx | app-code/main-app/app/Http/Controllers/ChequeReportController.php |  | Source only |
| Commerce/Book.jsx | app-code/main-app/app/Http/Controllers/Commerce/BookingController.php |  | Source only |
| Commerce/Directory.jsx | app-code/main-app/app/Http/Controllers/Commerce/PublicStoreController.php |  | Source only |
| Commerce/OnsiteMenu.jsx |  |  | Source only |
| Commerce/OrderLookup.jsx | app-code/main-app/app/Http/Controllers/Commerce/PublicStoreController.php |  | Source only |
| Commerce/OrderStatus.jsx | app-code/main-app/app/Http/Controllers/Commerce/PublicStoreController.php |  | Source only |
| Commerce/RiderDeliveries.jsx | app-code/main-app/app/Http/Controllers/Commerce/RiderPortalController.php |  | Source only |
| Commerce/Store.jsx |  |  | Source only |
| Cookbook/Create.jsx | app-code/main-app/app/Http/Controllers/CookbookController.php | store.cookbook.update; store.cookbook.store; store.cookbook.index; store.inventory.store | Source only |
| Cookbook/RecipesList.jsx | app-code/main-app/app/Http/Controllers/CookbookController.php | store.cookbook.destroy; store.cookbook.simulate; store.cookbook.create; store.cookbook.edit | Source only |
| Dashboards/AccountantDashboard.jsx | app-code/main-app/app/Http/Controllers/DashboardController.php | store.finance.accounts; store.finance.receivables; store.finance.payables; store.reports.profit-loss | Source only |
| Dashboards/CashierDashboard.jsx | app-code/main-app/app/Http/Controllers/DashboardController.php | store.pos; store.returns.create | Source only |
| Dashboards/ClassicDashboardView.jsx |  | store.sales.index; store.reports.dashboard; store.finance.receivables; store.finance.payables; store.reports.profit-loss; store.inventory.index; store.purchases.create; store.purchases.index; store.purchases.show | Source only |
| Dashboards/ModuleDashboard.jsx | app-code/main-app/app/Http/Controllers/ModuleDashboardController.php |  | Source only |
| Dashboards/PurchasingDashboard.jsx | app-code/main-app/app/Http/Controllers/DashboardController.php | store.purchases.create; store.purchases.index; store.inventory.index | Source only |
| Dashboards/ViewerDashboard.jsx | app-code/main-app/app/Http/Controllers/DashboardController.php |  | Source only |
| DebitNotes/Create.jsx | app-code/main-app/app/Http/Controllers/DebitNoteController.php | store.api.purchases.for-party; store.debit-notes.update; store.debit-notes.store | Source only |
| DebitNotes/DebitNotes.jsx | app-code/main-app/app/Http/Controllers/DebitNoteController.php | store.debit-notes.index; store.debit-notes.create; store.debit-notes.show | Source only |
| DebitNotes/Show.jsx | app-code/main-app/app/Http/Controllers/DebitNoteController.php | store.debit-notes.refund; store.purchase-orders.show | Source only |
| Demo/Landing.jsx | app-code/main-app/app/Http/Controllers/DemoController.php |  | Source only |
| EInvoicing/EInvoicing.jsx | app-code/main-app/app/Http/Controllers/EInvoicingController.php | store.e-invoicing.generate; store.e-invoicing.waybill | Source only |
| Errors/StoreSuspended.jsx | app-code/main-app/app/Http/Middleware/TenantMiddleware.php; app-code/main-app/docs/archive/VenQore_Definitive_Plan_Final.md; extras/VenQore_Definitive_Plan_Final.md | hub; logout | Source only |
| Errors/TrialExpired.jsx | app-code/main-app/routes/web.php | store.billing; redeem; hub; logout | Source only |
| Expenses/Create.jsx | app-code/main-app/app/Http/Controllers/ExpenseController.php | store.expenses.category.store; store.expenses.store; store.approvals.show; store.expenses.index | Source only |
| Expenses/ExpensesList.jsx | app-code/main-app/app/Http/Controllers/ExpenseController.php | store.parties.search; store.expenses.index; store.expenses.destroy; store.expenses.category.store; store.expenses.update; store.expenses.store; store.onboarding.step | Source only |
| Finance/FinanceDashboard.jsx | app-code/main-app/app/Http/Controllers/FinanceController.php |  | Source only |
| Finance/Payables.jsx | app-code/main-app/app/Http/Controllers/FinanceController.php | store.payments.out; store.parties.ledger | Source only |
| Finance/Receivables.jsx | app-code/main-app/app/Http/Controllers/FinanceController.php | store.payments.in; store.parties.ledger | Source only |
| Foh/Index.jsx | FOH_IMPLEMENTATION_PLAN.md; app-code/main-app/app/Http/Controllers/FohController.php | store.tables.plan.map; store.tables.service-charge; store.tables.service-mode; store.tables.prepares-orders; store.tables.plan; store.tables.guest-call.clear; store.pos.modifiers; store.inventory.search; store.pos.recent-sales; store.pos; store.pos.search; store.pos.barcode; store.tables.guest-line-reason; store.pos.sales.store; store.onboarding.step; store.customers.search; store.sales.parked; store.sales.park; store.sales.parked.delete; store.pos.categories; store.pos.featured; store.sales.lookup; store.pos.return.store; store.sales.return; store.foh; store.bank-accounts.store | Source only |
| Foh/Settings.jsx | app-code/main-app/app/Http/Controllers/FohController.php | store.foh.settings.save; store.foh.settings.untrack; store.restaurant.riders | Source only |
| Funds/CashHistory.jsx | app-code/main-app/app/Http/Controllers/FundController.php |  | Source only |
| Funds/FundManagement.jsx | app-code/main-app/app/Http/Controllers/FundController.php |  | Source only |
| Gift/Invalid.jsx | app-code/main-app/app/Http/Controllers/GiftRedemptionController.php |  | Source only |
| Gift/Show.jsx | app-code/main-app/app/Http/Controllers/GiftRedemptionController.php |  | Source only |
| GrowthEngine/GrowthDashboard.jsx | app-code/main-app/app/Http/Controllers/GrowthEngineController.php | store.growth-engine.index; store.growth-engine.show; store.growth-engine.refresh; store.growth-engine.whatsapp | Source only |
| GrowthEngine/Settings.jsx | app-code/main-app/app/Http/Controllers/GrowthEngineController.php; app-code/main-app/resources/js/Pages/GrowthEngine/Settings.jsx | store.growth-engine.update-settings; store.growth-engine.unmute | Source only |
| Help/Index.jsx | app-code/main-app/app/Http/Controllers/HelpCenterController.php |  | Source only |
| Help/Show.jsx | app-code/main-app/app/Http/Controllers/HelpCenterController.php |  | Source only |
| Hub/Index.jsx | app-code/main-app/app/Http/Controllers/HubController.php | invite.validate-code; invite.accept; logout; store.create; store.join | Source only |
| Installer/Index.jsx | app-code/main-app/app/Http/Controllers/InstallerController.php | store.create-or-join | Source only |
| Inventory/AddOns.jsx | app-code/main-app/app/Http/Controllers/AddOnLibraryController.php | store.addons.update; store.addons.store; store.addons.destroy | Source only |
| Inventory/Categories.jsx | app-code/main-app/app/Http/Controllers/InventoryController.php | store.categories.index; store.categories.destroy; store.categories.update; store.categories.store | Source only |
| Inventory/Dashboard.jsx | app-code/main-app/app/Http/Controllers/InventoryController.php |  | Source only |
| Inventory/InventoryList.jsx | app-code/main-app/app/Http/Controllers/InventoryController.php | store.inventory.index; store.inventory.destroy; store.inventory.bulk-destroy; store.admin.data; store.admin.settings; store.products.variants.index | Source only |
| Inventory/StockLevels.jsx | app-code/main-app/app/Http/Controllers/InventoryController.php |  | Source only |
| Inventory/Attributes/AttributesList.jsx | app-code/main-app/app/Http/Controllers/ProductAttributeController.php | store.attributes.update; store.attributes.store; store.attributes.destroy | Source only |
| Inventory/Production/Create.jsx | app-code/main-app/app/Http/Controllers/ProductionController.php | store.production.store; store.production.index | Source only |
| Inventory/Production/ProductionRuns.jsx | app-code/main-app/app/Http/Controllers/ProductionController.php | store.production.index; store.production.create; store.production.show; store.production.edit | Source only |
| Inventory/Production/Show.jsx | app-code/main-app/app/Http/Controllers/ProductionController.php |  | Source only |
| Inventory/Variants/VariantsList.jsx | app-code/main-app/app/Http/Controllers/ProductVariantController.php | store.variants.update; store.products.variants.store; store.variants.destroy; store.inventory.index | Source only |
| Invite/Accept.jsx | app-code/main-app/app/Http/Controllers/StaffInvitationController.php |  | Source only |
| Invite/Invalid.jsx | app-code/main-app/app/Http/Controllers/StaffInvitationController.php |  | Source only |
| Labels/LabelPrinter.jsx | app-code/main-app/app/Http/Controllers/LabelController.php | store.labels.print | Source only |
| Loyalty/Index.jsx | app-code/main-app/app/Http/Controllers/GrowthEngineController.php | store.growth-engine.settings | Source only |
| Manufacturing/Rules.jsx | app-code/main-app/routes/web.php | store.inventory.search | Source only |
| Marketing/About.jsx | app-code/main-app/routes/web.php |  | Source only |
| Marketing/Blueprint.jsx | app-code/main-app/routes/web.php |  | Source only |
| Marketing/Campaigns.jsx | app-code/main-app/app/Http/Controllers/MarketingCampaignController.php |  | Source only |
| Marketing/Contact.jsx | app-code/main-app/routes/web.php |  | Source only |
| Marketing/DashboardPreview.jsx | app-code/main-app/routes/web.php |  | Source only |
| Marketing/DigitalProducts.jsx | app-code/main-app/app/Http/Controllers/Marketing/DigitalProductsPublicController.php |  | Source only |
| Marketing/Documents.jsx | app-code/main-app/routes/web.php |  | Source only |
| Marketing/Features.jsx | app-code/main-app/routes/web.php |  | Source only |
| Marketing/KnownIssues.jsx | app-code/main-app/app/Http/Controllers/KnownIssuesController.php |  | Source only |
| Marketing/Ledger.jsx | app-code/main-app/routes/web.php |  | Source only |
| Marketing/Newsletter.jsx | app-code/main-app/app/Http/Controllers/Marketing/NewsletterController.php | marketing.newsletter.submit | Source only |
| Marketing/NewsletterConfirm.jsx | app-code/main-app/app/Http/Controllers/Marketing/NewsletterController.php |  | Source only |
| Marketing/NewsletterUnsubscribe.jsx | app-code/main-app/app/Http/Controllers/Marketing/NewsletterController.php |  | Source only |
| Marketing/Onboarding.jsx | app-code/main-app/routes/web.php |  | Source only |
| Marketing/PartnerSupport.jsx | app-code/main-app/app/Http/Controllers/Marketing/PartnerSupportController.php |  | Source only |
| Marketing/Partners.jsx | app-code/main-app/app/Http/Controllers/Marketing/PartnersPublicController.php | marketing.partners.store | Source only |
| Marketing/PosShowcase.jsx | app-code/main-app/routes/web.php |  | Source only |
| Marketing/Pricing.jsx | app-code/main-app/routes/web.php |  | Source only |
| Marketing/Reckoner.jsx | app-code/main-app/routes/web.php |  | Source only |
| Marketing/Roadmap.jsx | app-code/main-app/app/Http/Controllers/Marketing/RoadmapController.php |  | Source only |
| Marketing/Security.jsx | app-code/main-app/routes/web.php |  | Source only |
| Marketing/SmartCapture.jsx | app-code/main-app/routes/web.php |  | Source only |
| Marketing/VenSynQ.jsx | app-code/main-app/routes/web.php |  | Source only |
| Marketing/Blog/Index.jsx | app-code/main-app/app/Http/Controllers/Marketing/BlogController.php |  | Source only |
| Marketing/Blog/Show.jsx | app-code/main-app/app/Http/Controllers/Marketing/BlogController.php |  | Source only |
| Marketing/Compare/Index.jsx | app-code/main-app/app/Http/Controllers/Marketing/CompareController.php |  | Source only |
| Marketing/Compare/Show.jsx | app-code/main-app/app/Http/Controllers/Marketing/CompareController.php |  | Source only |
| Marketing/Docs/Show.jsx | app-code/main-app/app/Http/Controllers/Marketing/DocsController.php |  | Source only |
| Marketing/Features/Show.jsx | app-code/main-app/app/Http/Controllers/Marketing/FeaturesController.php |  | Source only |
| Marketing/Shared/FeatureDemos.jsx |  |  | Source only |
| Marketing/Shared/MarketingLayout.jsx |  |  | Source only |
| Marketing/Solutions/Index.jsx | app-code/main-app/app/Http/Controllers/Marketing/SolutionsController.php |  | Source only |
| Marketing/Solutions/Show.jsx | app-code/main-app/app/Http/Controllers/Marketing/SolutionsController.php |  | Source only |
| Marketing/Tools/Barcode.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/BarcodeToolController.php; extras/SEO/SEO Tools/VENQORE_FREE_TOOLS_IMPLEMENTATION_PLAN.md | tools.barcode.render; tools.barcode.validate; tools.barcode.sheet | Source only |
| Marketing/Tools/BarcodeLabelSheet.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/BarcodeLabelToolController.php | tools.barcode-label.parse; tools.barcode-label.sheet | Source only |
| Marketing/Tools/BarcodeValidator.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/BarcodeValidatorToolController.php | tools.barcode-validator.check | Source only |
| Marketing/Tools/CashDrawer.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/CashDrawerToolController.php | tools.cash-drawer.render | Source only |
| Marketing/Tools/CashDrawerCountSheet.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/CashDrawerCountSheetToolController.php |  | Source only |
| Marketing/Tools/CreditNote.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/CreditNoteToolController.php | tools.credit-note.render | Source only |
| Marketing/Tools/FoodCostCalculator.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/FoodCostToolController.php |  | Source only |
| Marketing/Tools/Index.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/ToolsHubController.php |  | Source only |
| Marketing/Tools/InventoryHealth.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/InventoryHealthToolController.php |  | Source only |
| Marketing/Tools/Invoice.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/InvoiceToolController.php | tools.invoice.render | Source only |
| Marketing/Tools/LabelSheet.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/LabelSheetToolController.php | tools.label-sheet.parse; tools.label-sheet.sheet | Source only |
| Marketing/Tools/LeadConfirm.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/ToolLeadController.php |  | Source only |
| Marketing/Tools/LeadUnsubscribe.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/ToolLeadController.php |  | Source only |
| Marketing/Tools/MarginCalculator.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/MarginCalculatorToolController.php |  | Source only |
| Marketing/Tools/PackingSlip.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/PackingSlipToolController.php | tools.packing-slip.render | Source only |
| Marketing/Tools/PaymentFeeCalculator.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/PaymentFeeCalculatorToolController.php |  | Source only |
| Marketing/Tools/PosRoiCalculator.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/PosRoiToolController.php |  | Source only |
| Marketing/Tools/PriceTag.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/PriceTagToolController.php | tools.price-tag.parse; tools.price-tag.sheet | Source only |
| Marketing/Tools/ProductCsvCleaner.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/ProductCsvCleanerToolController.php |  | Source only |
| Marketing/Tools/PurchaseOrder.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/PurchaseOrderToolController.php |  | Source only |
| Marketing/Tools/QrCode.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/QrCodeToolController.php | tools.qr.render | Source only |
| Marketing/Tools/QrMenu.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/QrMenuToolController.php | tools.qr-menu.render | Source only |
| Marketing/Tools/QrMenuPublic.jsx |  |  | Source only |
| Marketing/Tools/Quote.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/QuotationToolController.php | tools.quote.render | Source only |
| Marketing/Tools/Receipt.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/ReceiptToolController.php | tools.receipt.render | Source only |
| Marketing/Tools/SkuGenerator.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/SkuGeneratorToolController.php |  | Source only |
| Marketing/Tools/SmartCapture.jsx | app-code/main-app/app/Http/Controllers/PublicToolController.php | tools.invoice.render | Source only |
| Marketing/Tools/StockCountSheet.jsx | app-code/main-app/app/Http/Controllers/Marketing/Tools/StockCountSheetToolController.php |  | Source only |
| Marketing/Tools/Shared/EditableText.jsx |  |  | Source only |
| Marketing/Tools/Shared/EmailGate.jsx |  |  | Source only |
| Marketing/Tools/Shared/HousePromo.jsx |  |  | Source only |
| Marketing/Tools/Shared/Select.jsx |  |  | Source only |
| Marketing/Tools/Shared/SmartCaptureNudge.jsx |  |  | Source only |
| Marketing/Tools/Shared/ToolShell.jsx |  |  | Source only |
| Marketing/Tools/Shared/ToolsSidebar.jsx |  |  | Source only |
| Next/Dashboard.jsx | app-code/main-app/routes/web.php |  | Source only |
| Notifications/NotificationCenter.jsx | app-code/main-app/app/Http/Controllers/NotificationController.php | store.notifications.mark-all-read; store.notifications.mark-read; store.notifications.destroy | Source only |
| Onboarding/Wizard.jsx | app-code/main-app/app/Http/Controllers/OnboardingExperienceController.php | store.onboarding.v2.ai-discovery; store.onboarding.v2.apply-preset; store.onboarding.v2.complete | Source only |
| Onboarding/Components/HistoryUnlockedModal.jsx |  |  | Source only |
| OnlineStore/Deliveries.jsx | app-code/main-app/app/Http/Controllers/Commerce/DeliveryController.php |  | Source only |
| OnlineStore/Home.jsx | app-code/main-app/app/Http/Controllers/Commerce/StoreManagerController.php |  | Source only |
| OnlineStore/OnlineStore.jsx | app-code/main-app/app/Http/Controllers/OnlineStoreController.php |  | Source only |
| OnlineStore/OrderShow.jsx | app-code/main-app/app/Http/Controllers/Commerce/OrderInboxController.php |  | Source only |
| OnlineStore/Orders.jsx | app-code/main-app/app/Http/Controllers/Commerce/OrderInboxController.php |  | Source only |
| OnlineStore/Products.jsx | app-code/main-app/app/Http/Controllers/Commerce/StoreManagerController.php |  | Source only |
| OnlineStore/Promotions.jsx | app-code/main-app/app/Http/Controllers/Commerce/PromotionsController.php |  | Source only |
| OnlineStore/Settings.jsx | app-code/main-app/app/Http/Controllers/Commerce/StoreManagerController.php |  | Source only |
| OnsiteCatalogue/Setup.jsx | app-code/main-app/app/Http/Controllers/Commerce/OnsiteCatalogueController.php |  | Source only |
| Parties/Ledger.jsx | app-code/main-app/app/Http/Controllers/PartyController.php |  | Source only |
| Parties/PartiesList.jsx | app-code/main-app/app/Http/Controllers/PartyController.php | store.parties.ledger; store.parties.destroy; store.parties.bulk-destroy; store.parties.update; store.parties.store | Source only |
| Payments/In.jsx | app-code/main-app/app/Http/Controllers/PaymentController.php | store.parties.search; store.approvals.show; store.payments.store; store.payments.index | Source only |
| Payments/Out.jsx | app-code/main-app/app/Http/Controllers/PaymentController.php | store.parties.search; store.approvals.show; store.payments.store; store.payments.index | Source only |
| Payments/PaymentsList.jsx | app-code/main-app/app/Http/Controllers/PaymentController.php | store.payments.in; store.payments.out; store.payments.index | Source only |
| Payments/Show.jsx | app-code/main-app/app/Http/Controllers/PaymentController.php | store.sales.show | Source only |
| Platform/Overview.jsx |  | platform.dashboard; platform.plans.index; platform.coupons.index; platform.stores | Source only |
| Platform/Views.jsx |  | platform.dashboard; platform.partners.store; platform.partners.destroy; platform.drawings.store; platform.drawings.clear-history; platform.ticket.show; platform.ticket.reply; platform.pk-verifications.approve; platform.pk-verifications.reject; platform.pk-verifications.download; platform.settings.save; platform.vensynq.toggle; platform.jobs.metrics; platform.jobs.flush-failed; platform.jobs.retry; platform.jobs.delete-failed | Source only |
| Platform/BlogPosts/Index.jsx | app-code/main-app/app/Http/Controllers/SuperAdmin/BlogPostAdminController.php | platform.blog-posts.update; platform.blog-posts.store; platform.blog-posts.destroy | Source only |
| PlatformOwner/Login.jsx | app-code/main-app/app/Http/Controllers/Auth/PlatformOwnerAuthController.php |  | Source only |
| Profile/Edit.jsx | app-code/main-app/app/Http/Controllers/ProfileController.php | store.profile.update; account.update; password.update; store.profile.passcode; account.passcode; store.profile.security-pin; account.security-pin; store.profile.destroy; account.destroy; store.settings.update; store.home; verification.send | Source only |
| Proposals/Create.jsx | app-code/main-app/app/Http/Controllers/ProposalController.php | store.proposals.update; store.proposals.store | Source only |
| Proposals/ProposalsList.jsx | app-code/main-app/app/Http/Controllers/ProposalController.php | store.proposals.show; store.proposals.index; store.proposals.convert; store.proposals.destroy; store.proposals.create; store.proposals.print; store.service-jobs.create | Source only |
| Proposals/Show.jsx | app-code/main-app/app/Http/Controllers/ProposalController.php | store.proposals.print; store.proposals.convert-to-sale; store.proposals.convert-to-presale; store.proposals.index; store.service-jobs.create; store.proposals.edit | Source only |
| PurchaseOrders/Create.jsx | app-code/main-app/app/Http/Controllers/PurchaseOrderController.php | store.purchase-orders.update; store.purchase-orders.store | Source only |
| PurchaseOrders/PurchaseOrdersList.jsx | app-code/main-app/app/Http/Controllers/PurchaseOrderController.php | store.purchase-orders.show; store.purchase-orders.index; store.purchase-orders.create; store.purchase-orders.edit; store.purchase-orders.receive | Source only |
| PurchaseOrders/Show.jsx | app-code/main-app/app/Http/Controllers/PurchaseOrderController.php | store.purchase-orders.receive; store.purchase-orders.index; store.purchase-orders.edit | Source only |
| Purchases/PurchasesList.jsx | app-code/main-app/app/Http/Controllers/V3/PurchaseController.php | store.purchases.index; store.purchases.edit; store.purchases.destroy; store.purchases.create; store.vensynq.jit.approve; store.purchases.show; store.purchases.receive | Source only |
| RecurringInvoices/Create.jsx | app-code/main-app/app/Http/Controllers/RecurringInvoiceController.php |  | Source only |
| RecurringInvoices/Edit.jsx | app-code/main-app/app/Http/Controllers/RecurringInvoiceController.php |  | Source only |
| RecurringInvoices/RecurringForm.jsx |  | store.recurring-invoices.update; store.recurring-invoices.store | Source only |
| RecurringInvoices/RecurringInvoices.jsx | app-code/main-app/app/Http/Controllers/RecurringInvoiceController.php | store.recurring-invoices.toggle; store.recurring-invoices.destroy; store.recurring-invoices.create; store.recurring-invoices.edit | Source only |
| Reminders/Create.jsx | app-code/main-app/app/Http/Controllers/InvoiceReminderController.php | store.invoice-reminders.store; store.invoice-reminders.index | Source only |
| Reminders/InvoiceReminders.jsx | app-code/main-app/app/Http/Controllers/InvoiceReminderController.php | store.invoice-reminders.index; store.invoice-reminders.send; store.invoice-reminders.mark-sent-manually; store.invoice-reminders.dismiss; store.invoice-reminders.create; store.sales.show | Source only |
| Reports/AccountLedger.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.account-ledger | Source only |
| Reports/AllParties.jsx |  |  | Source only |
| Reports/BankStatement.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.bank-statement | Source only |
| Reports/BillWiseProfit.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.bill-wise-profit | Source only |
| Reports/CashFlow.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.cash-flow | Source only |
| Reports/CategoryProfitability.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.item-category-wise-profit-loss | Source only |
| Reports/CustomerInsights.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.customer-insights; store.reports.customer-insights.details | Source only |
| Reports/DayBook.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.day-book | Source only |
| Reports/DiscountReport.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.discount-report | Source only |
| Reports/ExpenseByCategory.jsx |  |  | Source only |
| Reports/ExpenseByItem.jsx |  |  | Source only |
| Reports/Expenses.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.expenses | Source only |
| Reports/ExpiryReport.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.expiry | Source only |
| Reports/GenericReport.jsx | app-code/main-app/app/Http/Controllers/ReportController.php; app-code/main-app/docs/archive/VenQore_Category4_C4_Instructions.md; extras/VenQore_Category4_C4_Instructions.md |  | Source only |
| Reports/GraphAnalytics.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.analytics | Source only |
| Reports/ItemCategoryWiseProfitLoss.jsx |  |  | Source only |
| Reports/ItemDetail.jsx | app-code/main-app/app/Http/Controllers/ReportController.php |  | Source only |
| Reports/ItemReportByParty.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.item-report-by-party | Source only |
| Reports/ItemWiseDiscount.jsx |  |  | Source only |
| Reports/ItemWiseProfit.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.item-wise-profit | Source only |
| Reports/LoanStatement.jsx |  |  | Source only |
| Reports/LowStock.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.low-stock | Source only |
| Reports/MovementHistory.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.movement-history | Source only |
| Reports/OwnersDailyPulse.jsx | app-code/main-app/app/Http/Controllers/OwnerDailyPulseController.php | store.reports.owner-daily-pulse.verify; store.reports.owner-daily-pulse.setup; store.reports.owner-daily-pulse.lock; store.reports.owner-daily-pulse.note | Source only |
| Reports/PartyReportByItem.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.party-report-by-item | Source only |
| Reports/PartyStatement.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.party-statement | Source only |
| Reports/PartyWiseProfitLoss.jsx |  |  | Source only |
| Reports/PointInTimeInventory.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.point-in-time-inventory.details; store.reports.point-in-time-inventory | Source only |
| Reports/ProfitLoss.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.profit-loss; store.reports.account-ledger | Source only |
| Reports/PurchaseReturns.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.purchase-returns; store.debit-notes.show | Source only |
| Reports/Purchases.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.purchases | Source only |
| Reports/RefundReasons.jsx | app-code/main-app/app/Http/Controllers/ReportController.php |  | Source only |
| Reports/ReportsHub.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.billing | Source only |
| Reports/SaleAging.jsx | app-code/main-app/app/Http/Controllers/ReportController.php |  | Source only |
| Reports/SaleOrderItems.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.sale-order-items | Source only |
| Reports/SaleOrders.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.sale-orders | Source only |
| Reports/SalePurchaseByItemCategory.jsx |  |  | Source only |
| Reports/SalePurchaseByParty.jsx |  |  | Source only |
| Reports/SalePurchaseByPartyGroup.jsx |  |  | Source only |
| Reports/Sales.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.sales; store.sales.edit | Source only |
| Reports/StockAging.jsx |  | store.reports.stock-aging | Source only |
| Reports/StockSummaryByCategory.jsx |  |  | Source only |
| Reports/StockValuation.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.stock-valuation | Source only |
| Reports/SupplierInsights.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.supplier-insights; store.reports.supplier-insights.details | Source only |
| Reports/Tax.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.tax | Source only |
| Reports/TaxRateReport.jsx |  |  | Source only |
| Reports/Transactions.jsx | app-code/main-app/app/Http/Controllers/ReportController.php | store.reports.transactions | Source only |
| Reports/TrialBalance.jsx | app-code/main-app/app/Http/Controllers/ReportController.php; extras/CALCULATION_LOGIC.md | store.reports.trial-balance | Source only |
| Reports/Components/ReportPage.jsx |  |  | Source only |
| Restaurant/CustomerQueue.jsx | app-code/main-app/app/Http/Controllers/RestaurantDashboardController.php | store.restaurant.queue.state; store.restaurant.settings | Source only |
| Restaurant/Dashboard.jsx | app-code/main-app/app/Http/Controllers/RestaurantDashboardController.php | store.restaurant.kitchen; store.restaurant.queue | Source only |
| Restaurant/Dispatch.jsx | app-code/main-app/app/Http/Controllers/DispatchController.php | store.restaurant.settings; store.restaurant.riders; store.tables.index | Source only |
| Restaurant/Kitchen.jsx | app-code/main-app/app/Http/Controllers/RestaurantDashboardController.php | store.api.sync.products; store.restaurant.reports.kitchen-performance; store.restaurant.settings; store.restaurant.queue; store.pos; store.tables.index | Source only |
| Restaurant/Riders.jsx | app-code/main-app/app/Http/Controllers/RiderController.php | store.restaurant.riders.store; store.restaurant.riders.update; store.restaurant.riders.destroy; store.restaurant.dispatch; store.restaurant.dispatch.rider-cashup | Source only |
| Restaurant/Settings.jsx | app-code/main-app/app/Http/Controllers/RestaurantDashboardController.php | store.restaurant.settings.update; store.restaurant.kitchen; store.restaurant.queue | Source only |
| Returns/Create.jsx | app-code/main-app/app/Http/Controllers/ReturnController.php | store.api.sales.returnable; store.api.sales.returnable.show; store.returns.store | Source only |
| Returns/ReturnsHistory.jsx | app-code/main-app/app/Http/Controllers/ReturnController.php | store.returns-history.index; store.returns.create; store.sales.show | Source only |
| Returns/Show.jsx | app-code/main-app/app/Http/Controllers/ReturnController.php |  | Source only |
| Sales/Analytics.jsx | app-code/main-app/app/Http/Controllers/SalesAnalyticsController.php |  | Source only |
| Sales/CreateInvoice.jsx | app-code/main-app/app/Http/Controllers/SaleController.php; app-code/main-app/routes/web.php | store.sales.show; store.sales.update; store.sales.store; store.approvals.show; store.sales.index; store.onboarding.step | Source only |
| Sales/CreatePreSale.jsx | app-code/main-app/routes/web.php | store.api.categories; store.api.warehouses; store.accounting.accounts.api; store.api.bank-accounts; store.inventory.store; store.inventory.update; store.inventory.search; store.sales.orders.update; store.pre-sales.store; store.pre-sales.index | Source only |
| Sales/Dashboard.jsx | app-code/main-app/app/Http/Controllers/SaleController.php | store.sales.index; store.sales.show | Source only |
| Sales/MasterSales.jsx | app-code/main-app/routes/web.php |  | Source only |
| Sales/ParkedSales.jsx | app-code/main-app/app/Http/Controllers/ParkedSaleController.php | store.pos; store.parked-sales.destroy | Source only |
| Sales/SalesHistory.jsx | app-code/main-app/app/Http/Controllers/SaleController.php | store.sales.index; store.sales.bulk-destroy; store.sales.edit; store.sales.export; store.reports.analytics; store.sales.invoice.create; store.commerce.orders.show; store.pos; store.sales.show; store.sales.goods-out; store.sales.challan; store.sales.cancel; store.sales.destroy; store.sales.print | Source only |
| Sales/Show.jsx | app-code/main-app/docs/archive/Questions.md; extras/Questions.md | store.sales.return; store.sales.send-email; store.sales.send-whatsapp; store.sales.index | Source only |
| Sales/Customers/CustomersList.jsx | app-code/main-app/app/Http/Controllers/CustomerController.php | store.customers.update; store.customers.store; store.customers.destroy; store.customers.index | Source only |
| SalesOrders/CreatePreSale.jsx | app-code/main-app/app/Http/Controllers/SalesOrderController.php | store.sales.index; store.sales.orders.update; store.pre-sales.store | Source only |
| SalesOrders/PreSales.jsx | app-code/main-app/app/Http/Controllers/SalesOrderController.php | store.sales.orders.show; store.pre-sales.index; store.pre-sales.create; store.sales.print; store.inventory.search; store.pre-sales.convert; store.service-jobs.create; store.sales-orders.cancel; store.pre-sales.destroy; store.sales-orders.print | Source only |
| SerialTracking/SerialTracking.jsx | app-code/main-app/app/Http/Controllers/SerialTrackingController.php | store.serials.index | Source only |
| SerialTracking/Show.jsx | app-code/main-app/app/Http/Controllers/SerialTrackingController.php | store.sales.show | Source only |
| Services/CreateServiceJob.jsx | app-code/main-app/app/Http/Controllers/ServiceJobController.php | store.service-jobs.store; store.service-jobs.index | Source only |
| Services/ServiceCalendar.jsx | app-code/main-app/app/Http/Controllers/ServiceJobController.php | store.service-jobs.quick-book; store.service-jobs.show | Source only |
| Services/ServiceJobDetail.jsx | app-code/main-app/app/Http/Controllers/ServiceJobController.php | store.service-jobs.status; store.service-jobs.convert-invoice; store.service-jobs.assign; store.service-jobs.unassign; store.service-jobs.checkout-tool; store.service-jobs.return-tool; store.service-jobs.update-schedule; store.service-jobs.index; store.expenses.index | Source only |
| Services/ServiceJobs.jsx | app-code/main-app/app/Http/Controllers/ServiceJobController.php | store.service-jobs.index; store.service-jobs.create; store.service-jobs.show | Source only |
| Services/ServiceNavTabs.jsx |  | store.service-jobs.index; store.service-jobs.calendar; store.tools.index; store.services.catalogue; store.service-jobs.create | Source only |
| Services/Tools.jsx | app-code/main-app/app/Http/Controllers/ToolController.php | store.tools.update; store.tools.store; store.tools.checkout; store.tools.checkin; store.tools.maintenance; store.tools.destroy; store.tools.index | Source only |
| Settings/Appearance.jsx | app-code/main-app/app/Http/Controllers/AppearanceSettingsController.php | store.appearance.experience; store.appearance.store-default | Source only |
| Settings/ChatbotSettings.jsx | app-code/main-app/app/Http/Controllers/ChatbotSettingsController.php; app-code/main-app/app/Http/Controllers/StoreChatbotSettingsController.php | platform.chatbot.settings.update; store.admin.chatbot.settings.update; platform.ai.test; store.admin.chatbot.ai.test | Source only |
| Settings/SettingsPanel.jsx |  | store.settings.update | Source only |
| Staff/Hub.jsx | app-code/main-app/app/Http/Controllers/StaffHubController.php | logout; platform.chatbot.autonomy-stats; platform.chatbot.autonomy-stats.promote; platform.chatbot.inbox | Source only |
| StaffAttendance/Show.jsx | app-code/main-app/app/Http/Controllers/StaffAttendanceController.php | store.staff-attendance.index | Source only |
| StaffAttendance/StaffAttendance.jsx | app-code/main-app/app/Http/Controllers/StaffAttendanceController.php | store.staff-attendance.approve-gap; store.staff-attendance.reject-gap; store.staff-attendance.index; store.staff-attendance.show; store.terminal-activities.screenshot | Source only |
| StockTake/Create.jsx | app-code/main-app/app/Http/Controllers/StockTakeController.php | store.stock-takes.store; store.stock-takes.index | Source only |
| StockTake/Show.jsx | app-code/main-app/app/Http/Controllers/StockTakeController.php | store.stock-takes.index | Source only |
| StockTake/StockTake.jsx | app-code/main-app/app/Http/Controllers/StockTakeController.php | store.stock-takes.create; store.stock-takes.show | Source only |
| StockTransfers/Create.jsx | app-code/main-app/app/Http/Controllers/StockTransferController.php | store.stock-transfers.store; store.stock-transfers.index | Source only |
| StockTransfers/Show.jsx | app-code/main-app/app/Http/Controllers/StockTransferController.php | store.stock-transfers.index | Source only |
| StockTransfers/StockTransfers.jsx | app-code/main-app/app/Http/Controllers/StockTransferController.php | store.stock-transfers.index; store.stock-transfers.create; store.stock-transfers.show | Source only |
| Store/CreateOrJoin.jsx | app-code/main-app/app/Http/Controllers/StoreController.php | logout; store.create; store.join; redeem | Source only |
| Store/Join.jsx | app-code/main-app/app/Http/Controllers/StaffController.php | store.join.submit; invite.validate-code; invite.accept; store.create; store.create-or-join | Source only |
| Store/Staff/Index.jsx | app-code/main-app/app/Http/Controllers/StaffController.php | store.staff.invite; store.admin.users.update; store.admin.users.remove | Source only |
| Storefront/Cart.jsx | app-code/main-app/app/Http/Controllers/Commerce/StorefrontPagesController.php |  | Source only |
| Storefront/Home.jsx | app-code/main-app/app/Http/Controllers/Commerce/StorefrontPagesController.php |  | Source only |
| Storefront/Product.jsx | app-code/main-app/app/Http/Controllers/Commerce/StorefrontPagesController.php |  | Source only |
| Storefront/Shop.jsx | app-code/main-app/app/Http/Controllers/Commerce/StorefrontPagesController.php |  | Source only |
| Storefront/classic/CartClassic.jsx |  |  | Source only |
| Storefront/classic/ProductClassic.jsx |  |  | Source only |
| Storefront/classic/RestaurantHomeClassic.jsx |  |  | Source only |
| Storefront/classic/RestaurantMenuClassic.jsx |  |  | Source only |
| Storefront/restaurant/RestaurantHome.jsx |  |  | Source only |
| Storefront/restaurant/RestaurantMenu.jsx |  |  | Source only |
| SuperAdmin/Dashboard.jsx | app-code/main-app/app/Http/Controllers/Admin/AdminDashboardController.php; app-code/main-app/app/Http/Controllers/Admin/SuperAdminController.php; app-code/main-app/app/Http/Controllers/Admin/SupportController.php |  | Source only |
| SuperAdmin/Stores.jsx | app-code/main-app/app/Http/Controllers/Admin/AdminDashboardController.php; app-code/main-app/app/Http/Controllers/Admin/SuperAdminController.php | platform.stores.bulk-destroy; platform.stores; platform.store.restore; platform.impersonate.start; platform.store.purge; platform.tenants.overrides.show; platform.store.activate; platform.store.suspend; platform.store.extend-trial; platform.store.destroy | Source only |
| SuperAdmin/Users.jsx | app-code/main-app/app/Http/Controllers/Admin/SuperAdminController.php | platform.users.bulk-destroy; platform.users; platform.user.restore; platform.user.purge; platform.user.destroy | Source only |
| SuperAdmin/AccessGrants/Index.jsx | app-code/main-app/app/Http/Controllers/SuperAdmin/AccessGrantController.php | platform.access-grants.store; platform.access-grants.revoke; platform.access-grants.unrevoke; platform.access-grants.destroy | Source only |
| SuperAdmin/AiUsage/Index.jsx | app-code/main-app/app/Http/Controllers/SuperAdmin/AiCostController.php | platform.dashboard; platform.tenants.overrides; platform.plans.index; platform.tenants.overrides.show | Source only |
| SuperAdmin/AppSumo/Index.jsx | app-code/main-app/app/Http/Controllers/Admin/SuperAdminController.php | platform.appsumo.generate; platform.appsumo.import; platform.appsumo.purge; platform.appsumo.index; platform.appsumo.export; store.dashboard | Source only |
| SuperAdmin/Coupons/Index.jsx | app-code/main-app/app/Http/Controllers/SuperAdmin/CouponController.php; app-code/main-app/docs/Plan_Management_System_Blueprint.md | platform.coupons.store; platform.coupons.update | Source only |
| SuperAdmin/DigitalHub/Index.jsx | app-code/main-app/app/Http/Controllers/Admin/DigitalHubController.php | platform.dashboard | Source only |
| SuperAdmin/Health/Contacts.jsx | app-code/main-app/app/Http/Controllers/Admin/SuperAdminController.php | platform.health.contacts; platform.health.contacts.read; platform.dashboard | Source only |
| SuperAdmin/Health/Errors.jsx | app-code/main-app/app/Http/Controllers/Admin/SuperAdminController.php | platform.health.errors; platform.health.errors.resolve; platform.health.errors.resolve-all; platform.health.errors.detect-fixes; platform.dashboard | Source only |
| SuperAdmin/NewsletterHub/Index.jsx | app-code/main-app/app/Http/Controllers/Admin/NewsletterHubController.php | platform.dashboard | Source only |
| SuperAdmin/Plans/Index.jsx | app-code/main-app/app/Http/Controllers/SuperAdmin/PlanController.php; app-code/main-app/docs/Plan_Management_System_Blueprint.md | platform.plans.bulk-update; platform.plans.update; platform.plans.store; platform.plans.restore-defaults; platform.plans.duplicate; platform.plans.destroy; platform.plans.archive; platform.plans.unarchive; platform.dashboard | Source only |
| SuperAdmin/Plans/featureGroups.js |  |  | Source only |
| SuperAdmin/Platforms/Index.jsx | app-code/main-app/app/Http/Controllers/SuperAdmin/PlatformController.php; app-code/main-app/docs/Plan_Management_System_Blueprint.md | platform.platforms.update; platform.platforms.store | Source only |
| SuperAdmin/StoreBadges/Index.jsx | app-code/main-app/app/Http/Controllers/SuperAdmin/StoreBadgeController.php | platform.store-badges.index; platform.store-badges.update; platform.store-badges.refresh | Source only |
| SuperAdmin/Tenants/OverrideDetail.jsx | app-code/main-app/app/Http/Controllers/SuperAdmin/TenantOverrideController.php; app-code/main-app/docs/Plan_Management_System_Blueprint.md | platform.tenants.overrides.apply; platform.tenants.overrides.remove; platform.tenants.overrides.update; platform.tenants.overrides.grant-addon; platform.tenants.overrides.revoke-addon; platform.tenants.overrides | Source only |
| SuperAdmin/Tenants/Overrides.jsx | app-code/main-app/app/Http/Controllers/SuperAdmin/TenantOverrideController.php; app-code/main-app/docs/Plan_Management_System_Blueprint.md | platform.tenants.overrides.apply; platform.tenants.overrides; platform.tenants.overrides.remove; platform.tenants.overrides.show | Source only |
| Suppliers/SuppliersList.jsx | app-code/main-app/app/Http/Controllers/SupplierController.php | store.suppliers.index; store.suppliers.update; store.suppliers.store; store.suppliers.destroy | Source only |
| TableService/FloorBuilder.jsx | app-code/main-app/app/Http/Controllers/TableServiceController.php | store.tables.index | Source only |
| Transactions/TransactionsList.jsx | app-code/main-app/app/Http/Controllers/TransactionController.php |  | Source only |
| Updater/Index.jsx |  | platform.dashboard | Source only |
| V3/Products/Create.jsx | app-code/main-app/app/Http/Controllers/V3/ProductController.php | store.v3.products.store; store.v3.products.index | Source only |
| V3/Products/Edit.jsx | app-code/main-app/app/Http/Controllers/V3/ProductController.php | store.v3.products.update; store.v3.products.index; store.v3.products.uom.index; store.v3.products.tiers.index | Source only |
| V3/Products/Index.jsx | app-code/main-app/app/Http/Controllers/V3/ProductController.php | store.v3.products.destroy; store.v3.products.create; store.v3.products.edit | Source only |
| V3/Products/PriceTiers.jsx | app-code/main-app/app/Http/Controllers/V3/PriceTierController.php | store.v3.products.tiers.store; store.v3.products.tiers.destroy; store.v3.products.edit | Source only |
| V3/Products/UomConversions.jsx | app-code/main-app/app/Http/Controllers/V3/UomConversionController.php | store.v3.products.uom.store; store.v3.products.uom.destroy; store.v3.products.edit | Source only |
| V3/Purchases/Create.jsx | app-code/main-app/app/Http/Controllers/V3/PurchaseController.php |  | Source only |
| V3/Purchases/Edit.jsx | app-code/main-app/app/Http/Controllers/V3/PurchaseController.php |  | Source only |
| V3/Purchases/GoodsIn.jsx | app-code/main-app/app/Http/Controllers/V3/PurchaseController.php | store.purchases.receive.store; store.purchases.index; store.purchases.create | Source only |
| V3/Purchases/PurchaseForm.jsx |  | store.v3.purchases.index; store.v3.purchases.update; store.v3.purchases.store | Source only |
| V3/Purchases/Receive.jsx | app-code/main-app/app/Http/Controllers/V3/PurchaseController.php | store.v3.purchases.receive.store; store.v3.purchases.show | Source only |
| V3/Purchases/Return.jsx | app-code/main-app/app/Http/Controllers/V3/PurchaseReturnController.php | store.v3.purchases.return.store; store.v3.purchases.show | Source only |
| V3/Purchases/Show.jsx | app-code/main-app/app/Http/Controllers/V3/PurchaseController.php | store.v3.purchases.destroy; store.v3.purchases.index; store.v3.purchases.receive; store.v3.purchases.edit; store.v3.purchases.return.create | Source only |
| V3/Sales/GoodsOut.jsx | app-code/main-app/app/Http/Controllers/V3/SaleController.php | store.sales.dispatch.store; store.sales.index; store.sales.invoice.create | Source only |
| V3/Warehouses/Create.jsx | app-code/main-app/app/Http/Controllers/V3/WarehouseController.php | store.v3.warehouses.store; store.v3.warehouses.index | Source only |
| V3/Warehouses/Edit.jsx | app-code/main-app/app/Http/Controllers/V3/WarehouseController.php | store.v3.warehouses.update; store.v3.warehouses.index | Source only |
| V3/Warehouses/Index.jsx | app-code/main-app/app/Http/Controllers/V3/WarehouseController.php | store.v3.warehouses.destroy; store.v3.warehouses.create; store.v3.warehouses.edit | Source only |
| VenSynQ/Dashboard.jsx | app-code/main-app/app/Http/Controllers/VenSynQController.php | store.vensynq.sync-orders; store.vensynq.sync-tracking; store.purchases.index; store.vensynq.settings | Source only |
| VenSynQ/Payouts.jsx | app-code/main-app/app/Http/Controllers/VenSynQController.php | store.vensynq.payouts.confirm; store.vensynq.index | Source only |
| VenSynQ/Settings.jsx | app-code/main-app/app/Http/Controllers/VenSynQController.php | store.vensynq.channels.update; store.vensynq.channels.disconnect; store.vensynq.index; store.vensynq.connect | Source only |
| VenSynQ/Components/AmazonSetupWizard.jsx |  | store.vensynq.amazon.test; store.vensynq.amazon.store | Source only |
| VenSynQ/Components/MoneyPipeline.jsx |  | store.vensynq.clearing.toggle; store.vensynq.payouts | Source only |
| VenSynQ/Components/SyncHealthPanel.jsx |  | store.vensynq.health; store.vensynq.channels.retry | Source only |
| WooCommerce/ConnectionSetup.jsx | app-code/main-app/app/Http/Controllers/WooSync/WooConnectionController.php | store.woo.connections.settings; store.woo.connections.status-json; store.woo.connections.sync; store.woo.connections.index | Source only |
| WooCommerce/Connections.jsx | app-code/main-app/app/Http/Controllers/WooSync/WooConnectionController.php | store.woo.connections.store; store.woo.connections.destroy; store.woo.connections.sync; store.woo.connections.setup | Source only |
| WooCommerce/SyncPage.jsx | app-code/main-app/app/Http/Controllers/WooSync/WooConnectionController.php | store.woo.connections.approve; store.woo.connections.ignore; store.woo.connections.push; store.woo.connections.pull; store.woo.connections.resolve; store.woo.connections.sync; store.woo.connections.scan; store.woo.connections.index; store.woo.connections.setup | Source only |
| WooCommerce/WooCommerce.jsx | app-code/main-app/app/Http/Controllers/WooCommerceController.php |  | Source only |
| Workspace/BuildWorkspace.jsx | app-code/main-app/app/Http/Controllers/WorkspaceBuilderController.php | workspace.analyze; workspace.demand; workspace.converse.deepen; workspace.provision; workspace.prepare-google; auth.google | Source only |
| Workspace/Dashboard.jsx | app-code/main-app/app/Http/Controllers/WorkspaceDashboardController.php | store.workspace.data; store.workspace.layout.save; store.workspace.layout.reset | Source only |
| Workspace/Overview.jsx | app-code/main-app/app/Http/Controllers/OverviewDashboardController.php | store.workspace.layout.save | Source only |

## Exclusions

Installed dependencies and generated build directories named in tools/inventory.py are pruned before traversal. Credentials (.env), personal backups, databases, logs, uploaded customer records and private directories are not inspected for product claims. Historical copies and unrelated projects are listed by path and scope when traversed, but are not treated as current functionality. File metadata coverage is not a claim that every file was semantically read.

See file-coverage.csv for file-level scope and hashes; document-index.csv for document headings; route-inventory.csv for the complete bootstrapped route table.
