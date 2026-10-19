# Explicit source markers requiring review

Automated extraction from current application implementation areas on 16 October 2026. A TODO or placeholder word can be a comment, a deliberately unsupported option or a false positive. The list is a queue for review, not a defect count. No secrets, configuration values from the environment or customer records are included.

A confirmed availability conflict is MarketingCampaignController: its index returns empty campaign data and its create/store methods contain `to implement` placeholders. Earlier broad feature documents must not be reused as evidence that campaign automation works.

| Source | Line | Marker | Excerpt |
| --- | --- | --- | --- |
| app-code/main-app/app/Console/Commands/ReckonerCensusCommand.php | 202 | implementation marker | `'unavailable' => 'Contract not implemented or data not captured',` |
| app-code/main-app/app/Http/Controllers/BankReconciliationController.php | 26 | implementation marker | `/* to implement */` |
| app-code/main-app/app/Http/Controllers/DashboardController.php | 1229 | implementation marker | `* TODO: Re-implement as 'php artisan inventory:heal' (Artisan command)` |
| app-code/main-app/app/Http/Controllers/DashboardController.php | 1248 | implementation marker | `* TODO: Re-implement as 'php artisan sales:fix-return-timestamps' (Artisan command)` |
| app-code/main-app/app/Http/Controllers/EInvoicingController.php | 23 | implementation marker | `// TODO: implement e-invoicing generation` |
| app-code/main-app/app/Http/Controllers/EInvoicingController.php | 30 | implementation marker | `// TODO: implement waybill generation` |
| app-code/main-app/app/Http/Controllers/Marketing/Tools/BarcodeToolController.php | 24 | implementation marker | `* requires an email via ToolLeadController and is not implemented in this` |
| app-code/main-app/app/Http/Controllers/MarketingCampaignController.php | 26 | implementation marker | `/* to implement */` |
| app-code/main-app/app/Http/Controllers/MarketingCampaignController.php | 30 | implementation marker | `/* to implement */` |
| app-code/main-app/app/Http/Controllers/OnlineStoreController.php | 18 | implementation marker | `public function update(Request $request) { /* to implement */ }` |
| app-code/main-app/routes/web.php | 914 | explicit not-implemented HTTP response | `Route::post('/admin/migration/analyze', fn() => \abort(501, 'Not yet implemented'))->middleware(\App\Http\Middleware\PlatformRole::class . ':admin')->name('admin.migration.analyze');` |
| app-code/main-app/routes/web.php | 1065 | implementation marker | `// TODO(T-03b): This endpoint has no per-tenant authorization. Tenant-scoped` |
| app-code/main-app/routes/web.php | 1663 | explicit not-implemented HTTP response | `Route::get('/reports/discount-report', fn() => \abort(501, 'Implement reports.discount-report'))->name('reports.discount-report');` |
| app-code/main-app/routes/web.php | 2467 | explicit not-implemented HTTP response | `Route::get('/finance/accounts', fn() => \abort(501, 'Implement finance.accounts'))->name('finance.accounts');` |
| app-code/main-app/routes/web.php | 2468 | explicit not-implemented HTTP response | `Route::get('/finance/journal', fn() => \abort(501, 'Implement finance.journal'))->name('finance.journal');` |
| app-code/main-app/routes/web.php | 2471 | explicit not-implemented HTTP response | `Route::get('/sales/pre-sales/{order}/print', fn() => \abort(501, 'Implement pre-sales.print'))->name('pre-sales.print');` |
| app-code/main-app/routes/web.php | 2472 | explicit not-implemented HTTP response | `/* Both of these were abort(501) closures, so a debit note could be raised` |
| app-code/main-app/routes/web.php | 2476 | explicit not-implemented HTTP response | `Route::get('/purchases/{purchase}/print', fn() => \abort(501, 'Implement purchases.print'))->name('purchases.print');` |
| app-code/main-app/routes/web.php | 2478 | explicit not-implemented HTTP response | `Route::get('/inventory/production/{run}/edit', fn() => \abort(501, 'Implement production.edit'))->name('production.edit');` |
| app-code/main-app/config/modules.php | 1121 | explicit not-implemented HTTP response | `'KNOWN GAP (feature #84): print and update endpoints for debit notes are literal stubs — abort(501, "Implement debit-notes.print"). Create and view are solid. Either finish those two endpoints or hide the buttons before launch. A 501 in front of a paying custo` |
| app-code/main-app/resources/js/Hooks/useGlobalShortcuts.js | 90 | implementation marker | `// case '3': // Calculator (Modal TODO)` |
| app-code/main-app/resources/js/Pages/DebitNotes/Show.jsx | 245 | implementation marker | `{/* TODO: DebitNoteController::store() does not create a JournalEntry yet` |
| app-code/main-app/resources/js/Pages/Proposals/ProposalsList.jsx | 705 | implementation marker | `onClick={() => { /* TODO: Convert to Pre-Sale */ }}` |
| app-code/main-app/resources/js/Pages/Returns/Show.jsx | 116 | implementation marker | `{/* TODO: inventory_batches has no FK back to the originating return (no sale_id/` |
| app-code/main-app/resources/js/Pages/SerialTracking/Show.jsx | 72 | implementation marker | `{/* TODO: ProductSerial.purchase_id references purchase_orders, but the` |
| app-code/main-app/resources/js/Pages/SerialTracking/Show.jsx | 107 | implementation marker | `{/* TODO: no dedicated serial-movement ledger table exists yet — this timeline` |
| app-code/main-app/resources/js/Services/SyncService.js | 235 | implementation marker | `* because of a plan gate, or not implemented — taxes) never wipes data.` |
