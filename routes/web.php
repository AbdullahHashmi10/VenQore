<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ProductAttributeController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\FundController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Inertia\Inertia;


// ── Public Marketing Pages ──────────────────────────────────────────────
Route::get('/features', fn() => Inertia::render('Marketing/Features'))->name('marketing.features');
Route::get('/features/{slug}', [\App\Http\Controllers\Marketing\FeaturesController::class, 'show'])->name('marketing.features.show');

Route::get('/roadmap', [\App\Http\Controllers\Marketing\RoadmapController::class, 'index'])->name('marketing.roadmap');
Route::get('/solutions', [\App\Http\Controllers\Marketing\SolutionsController::class, 'index'])->name('marketing.solutions.index');
Route::get('/solutions/{slug}', [\App\Http\Controllers\Marketing\SolutionsController::class, 'show'])->name('marketing.solutions.show');
Route::get('/compare', [\App\Http\Controllers\Marketing\CompareController::class, 'index'])->name('marketing.compare.index');
Route::get('/compare/{slug}', [\App\Http\Controllers\Marketing\CompareController::class, 'show'])->name('marketing.compare.show');
Route::get('/pricing', function () {
    try {
        $plans = \App\Models\Plan::with(['limits', 'features'])
            ->where('is_active', true)
            ->where('is_visible', true)
            ->orderBy('sort_order')
            ->get();
    } catch (\Throwable $e) {
        $plans = collect();
    }

    return Inertia::render('Marketing/Pricing', [
        'plans' => $plans,
    ]);
})->name('marketing.pricing');
Route::post('/pricing/currency-override', function (\Illuminate\Http\Request $request) {
    $request->validate(['country' => 'required|string|size:2']);
    $country = strtoupper($request->country);
    
    if ($country === 'PK') {
        session(['geo_country_override' => 'PK']);
    } else {
        session(['geo_country_override' => 'US']);
    }
    
    return back()->with('success', 'Region updated successfully.');
})->name('marketing.pricing.override');
Route::get('/about',    fn() => Inertia::render('Marketing/About'))->name('marketing.about');
Route::get('/contact',  fn() => Inertia::render('Marketing/Contact'))->name('marketing.contact');
Route::post('/contact', [\App\Http\Controllers\Marketing\ContactController::class, 'store'])->name('marketing.contact.submit');

// Coming-soon product lines — SEO/GEO landing pages with newsletter capture (2026-07-03)
Route::get('/vensynq', fn() => Inertia::render('Marketing/VenSynQ'))->name('marketing.vensynq');
Route::get('/smartcapture', fn() => Inertia::render('Marketing/SmartCapture'))->name('marketing.smartcapture');

// Newsletter subscription
Route::get('/subscribe', [\App\Http\Controllers\Marketing\NewsletterController::class, 'index'])->name('marketing.newsletter');
Route::post('/subscribe', [\App\Http\Controllers\Marketing\NewsletterController::class, 'store'])->name('marketing.newsletter.submit');

// Digital products list page
Route::get('/digital-products', [\App\Http\Controllers\Marketing\DigitalProductsPublicController::class, 'index'])->name('marketing.digital-products');

// Secret Support Desk (accessed via VenQore.html link)
Route::get('/partner-support', [\App\Http\Controllers\Marketing\PartnerSupportController::class, 'index'])->name('marketing.partner-support');
Route::post('/api/partner-support/chat', [\App\Http\Controllers\Marketing\PartnerSupportController::class, 'startChat'])->name('partner-support.start');
Route::get('/api/partner-support/chat/{ticket_id}', [\App\Http\Controllers\Marketing\PartnerSupportController::class, 'getMessages'])->name('partner-support.messages');
Route::post('/api/partner-support/chat/{ticket_id}/reply', [\App\Http\Controllers\Marketing\PartnerSupportController::class, 'reply'])->name('partner-support.reply');

// Documentation
Route::get('/docs', [\App\Http\Controllers\Marketing\DocsController::class, 'index'])->name('marketing.docs.index');
Route::get('/docs/{slug}', [\App\Http\Controllers\Marketing\DocsController::class, 'show'])->name('marketing.docs.show');


// Barcode Generator (Module 03) — internal Code128B SVG endpoint, used inside the
// app (e.g. product labels). NOT the public /tools/barcode-generator tool below.
Route::get('/barcode/generate', [\App\Http\Controllers\BarcodeController::class, 'generate'])->name('barcode.generate');

// ── Public Free Tools (TOFU / GEO) ──────────────────────────────────────
// Public, unauthenticated, NOT tenant-scoped. See SEO/SEO Tools/VENQORE_FREE_TOOLS_IMPLEMENTATION_PLAN.md §3.3.
Route::prefix('tools')->name('tools.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Marketing\Tools\ToolsHubController::class, 'index'])->name('index');

    // T1 — Barcode Generator
    Route::get('/barcode-generator', [\App\Http\Controllers\Marketing\Tools\BarcodeToolController::class, 'index'])->name('barcode');
    Route::get('/barcode-generator/{format}', [\App\Http\Controllers\Marketing\Tools\BarcodeToolController::class, 'format'])
        ->where('format', 'code128|code39|code93|ean-13|ean-8|upc-a|upc-e|itf-14|codabar')
        ->name('barcode.format');
    Route::post('/barcode-generator/render', [\App\Http\Controllers\Marketing\Tools\BarcodeToolController::class, 'render'])
        ->middleware('throttle:tools')->name('barcode.render');
    Route::post('/barcode-generator/validate', [\App\Http\Controllers\Marketing\Tools\BarcodeToolController::class, 'validateExisting'])
        ->middleware('throttle:tools')->name('barcode.validate');
    Route::post('/barcode-generator/sheet', [\App\Http\Controllers\Marketing\Tools\BarcodeToolController::class, 'sheet'])
        ->middleware('throttle:tools')->name('barcode.sheet');

    // Invoice Scanner Tool (T7-2)
    Route::get('/invoice-scanner', [\App\Http\Controllers\PublicToolController::class, 'showInvoiceScanner'])->name('invoice-scanner');
    Route::post('/invoice-scanner', [\App\Http\Controllers\PublicToolController::class, 'submitInvoiceScanner'])->middleware('throttle:tools')->name('invoice-scanner.submit');

    // T2 — Invoice Generator
    Route::get('/invoice-generator', [\App\Http\Controllers\Marketing\Tools\InvoiceToolController::class, 'index'])->name('invoice');
    Route::post('/invoice-generator/render', [\App\Http\Controllers\Marketing\Tools\InvoiceToolController::class, 'render'])
        ->middleware('throttle:tools')->name('invoice.render');


    // Credit Note Generator
    Route::get('/credit-note-generator', [\App\Http\Controllers\Marketing\Tools\CreditNoteToolController::class, 'index'])->name('credit-note');
    Route::post('/credit-note-generator/render', [\App\Http\Controllers\Marketing\Tools\CreditNoteToolController::class, 'render'])
        ->middleware('throttle:tools')->name('credit-note.render');

    // T3 — Receipt Generator
    Route::get('/receipt-generator', [\App\Http\Controllers\Marketing\Tools\ReceiptToolController::class, 'index'])->name('receipt');
    Route::post('/receipt-generator/render', [\App\Http\Controllers\Marketing\Tools\ReceiptToolController::class, 'render'])
        ->middleware('throttle:tools')->name('receipt.render');

    // Packing Slip Generator — Documents group (no prices/totals by design)
    Route::get('/packing-slip-generator', [\App\Http\Controllers\Marketing\Tools\PackingSlipToolController::class, 'index'])->name('packing-slip');
    Route::post('/packing-slip-generator/render', [\App\Http\Controllers\Marketing\Tools\PackingSlipToolController::class, 'render'])
        ->middleware('throttle:tools')->name('packing-slip.render');

    // Price Tag Generator — Barcodes & Labels group
    Route::get('/price-tag-generator', [\App\Http\Controllers\Marketing\Tools\PriceTagToolController::class, 'index'])->name('price-tag');
    Route::post('/price-tag-generator/sheet', [\App\Http\Controllers\Marketing\Tools\PriceTagToolController::class, 'sheet'])
        ->middleware('throttle:tools')->name('price-tag.sheet');
    Route::post('/price-tag-generator/parse', [\App\Http\Controllers\Marketing\Tools\PriceTagToolController::class, 'parse'])
        ->middleware('throttle:tools')->name('price-tag.parse');

    // Label Sheet Generator — Barcodes & Labels group (general-purpose text labels)
    Route::get('/label-sheet-generator', [\App\Http\Controllers\Marketing\Tools\LabelSheetToolController::class, 'index'])->name('label-sheet');
    Route::post('/label-sheet-generator/sheet', [\App\Http\Controllers\Marketing\Tools\LabelSheetToolController::class, 'sheet'])
        ->middleware('throttle:tools')->name('label-sheet.sheet');
    Route::post('/label-sheet-generator/parse', [\App\Http\Controllers\Marketing\Tools\LabelSheetToolController::class, 'parse'])
        ->middleware('throttle:tools')->name('label-sheet.parse');

    // QR Code Generator — Barcodes & Labels group
    Route::get('/qr-code-generator', [\App\Http\Controllers\Marketing\Tools\QrCodeToolController::class, 'index'])->name('qr');
    Route::post('/qr-code-generator/render', [\App\Http\Controllers\Marketing\Tools\QrCodeToolController::class, 'render'])
        ->middleware('throttle:tools')->name('qr.render');

    // QR Menu Generator — Barcodes & Labels group
    Route::get('/qr-menu-generator', [\App\Http\Controllers\Marketing\Tools\QrMenuToolController::class, 'index'])->name('qr-menu');
    Route::post('/qr-menu-generator/render', [\App\Http\Controllers\Marketing\Tools\QrMenuToolController::class, 'render'])
        ->middleware('throttle:tools')->name('qr-menu.render');

    // Product CSV Cleaner — Inventory & Data group
    Route::get('/product-csv-cleaner', [\App\Http\Controllers\Marketing\Tools\ProductCsvCleanerToolController::class, 'index'])->name('csv-cleaner');
    Route::post('/product-csv-cleaner/parse', [\App\Http\Controllers\Marketing\Tools\ProductCsvCleanerToolController::class, 'parse'])
        ->middleware('throttle:tools')->name('csv-cleaner.parse');
    Route::post('/product-csv-cleaner/download', [\App\Http\Controllers\Marketing\Tools\ProductCsvCleanerToolController::class, 'download'])
        ->middleware('throttle:tools')->name('csv-cleaner.download');

    // Purchase Order Generator — Documents group
    Route::get('/purchase-order-generator', [\App\Http\Controllers\Marketing\Tools\PurchaseOrderToolController::class, 'index'])->name('purchase-order');
    Route::post('/purchase-order-generator/render', [\App\Http\Controllers\Marketing\Tools\PurchaseOrderToolController::class, 'render'])
        ->middleware('throttle:tools')->name('purchase-order.render');

    // Quotation Generator — Documents group
    Route::get('/quote-generator', [\App\Http\Controllers\Marketing\Tools\QuotationToolController::class, 'index'])->name('quote');
    Route::post('/quote-generator/render', [\App\Http\Controllers\Marketing\Tools\QuotationToolController::class, 'render'])
        ->middleware('throttle:tools')->name('quote.render');

    // Stock Count Sheet — Inventory & Data group
    Route::get('/stock-count-sheet', [\App\Http\Controllers\Marketing\Tools\StockCountSheetToolController::class, 'index'])->name('stock-count');
    Route::post('/stock-count-sheet/render', [\App\Http\Controllers\Marketing\Tools\StockCountSheetToolController::class, 'render'])
        ->middleware('throttle:tools')->name('stock-count.render');
    Route::post('/stock-count-sheet/parse', [\App\Http\Controllers\Marketing\Tools\StockCountSheetToolController::class, 'parse'])
        ->middleware('throttle:tools')->name('stock-count.parse');

    // Cash Drawer Count Sheet — Inventory & Data group
    Route::get('/cash-drawer-count-sheet', [\App\Http\Controllers\Marketing\Tools\CashDrawerToolController::class, 'index'])->name('cash-drawer');
    Route::post('/cash-drawer-count-sheet/render', [\App\Http\Controllers\Marketing\Tools\CashDrawerToolController::class, 'render'])
        ->middleware('throttle:tools')->name('cash-drawer.render');

    // Profit Margin & Markup Calculator — Calculators group. Pure client-side
    // math tool, no POST endpoint needed at all.
    Route::get('/margin-calculator', [\App\Http\Controllers\Marketing\Tools\MarginCalculatorToolController::class, 'index'])->name('margin-calculator');

    // Inventory Health Toolkit — Inventory & Data group. Pure client-side
    // math tool (reorder point, safety stock, EOQ, GMROI, turnover), no
    // POST endpoint needed at all.
    Route::get('/inventory-health', [\App\Http\Controllers\Marketing\Tools\InventoryHealthToolController::class, 'index'])->name('inventory-health');

    // POS ROI Calculator — Calculators group. Pure client-side math tool,
    // no POST endpoint needed at all.
    Route::get('/pos-roi-calculator', [\App\Http\Controllers\Marketing\Tools\PosRoiToolController::class, 'index'])->name('pos-roi');

    // Recipe Costing Calculator — Calculators group. Pure client-side math
    // tool (ingredient unit conversion, cost per portion, target food-cost
    // % pricing), no POST endpoint needed at all.
    Route::get('/food-cost-calculator', [\App\Http\Controllers\Marketing\Tools\FoodCostToolController::class, 'index'])->name('food-cost');

    // Payment Processing Fee Calculator — Calculators group. Pure
    // client-side math tool, no POST endpoint needed at all.
    Route::get('/payment-fee-calculator', [\App\Http\Controllers\Marketing\Tools\PaymentFeeCalculatorToolController::class, 'index'])->name('payment-fee');

    // Bulk SKU Generator — Inventory & Data group. Pure client-side scheme
    // builder + bulk generation, no POST endpoint needed at all.
    Route::get('/sku-generator', [\App\Http\Controllers\Marketing\Tools\SkuGeneratorToolController::class, 'index'])->name('sku-generator');

    // T10 — Barcode Validator
    Route::get('/barcode-validator', [\App\Http\Controllers\Marketing\Tools\BarcodeValidatorToolController::class, 'index'])->name('barcode-validator');
    Route::post('/barcode-validator/check', [\App\Http\Controllers\Marketing\Tools\BarcodeValidatorToolController::class, 'validateGtin'])
        ->middleware('throttle:tools')->name('barcode-validator.check');

    // Shared lead capture (plan §4.4, §6.3)
    Route::post('/lead', [\App\Http\Controllers\Marketing\Tools\ToolLeadController::class, 'store'])
        ->middleware('throttle:tool-leads')->name('lead.store');
    Route::get('/lead/confirm/{token}', [\App\Http\Controllers\Marketing\Tools\ToolLeadController::class, 'confirm'])->name('lead.confirm');
    Route::get('/lead/unsubscribe/{token}', [\App\Http\Controllers\Marketing\Tools\ToolLeadController::class, 'unsubscribe'])->name('lead.unsubscribe');
    Route::post('/lead/unsubscribe/{token}', [\App\Http\Controllers\Marketing\Tools\ToolLeadController::class, 'unsubscribeConfirm'])->name('lead.unsubscribe.confirm');

    // Signed, expiring download of a generated artifact (plan §4.6)
    Route::get('/download/{uuid}', [\App\Http\Controllers\Marketing\Tools\ToolsHubController::class, 'download'])
        ->middleware('signed')->name('download');
});

// Public static WordPress plugin download route (compiles on-the-fly)
Route::get('/downloads/venqore-sync.zip', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'downloadStaticPlugin']);
Route::get('/api/woo/plugin/check-update', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'checkPluginUpdate']);



// Blog Routes
Route::get('/blog',              [\App\Http\Controllers\Marketing\BlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{slug}',       [\App\Http\Controllers\Marketing\BlogController::class, 'show'])->name('blog.show');

// NOTE (2026-07-05): previously pointed at Inertia::render('Legal/Terms') / ('Legal/Privacy'),
// but resources/js/Pages/Legal/ does not exist — every real visit to /terms or /privacy
// threw a client-side "page not found" error in the browser after Inertia resolved the
// response. Fixed to render the actual components (also removed a dead duplicate pair of
// these two routes further down the file that pointed at the correct components but was
// unreachable because a route registered earlier always wins).
Route::get('/terms',   fn() => Inertia::render('TermsOfService'))->name('terms');
Route::get('/privacy', fn() => Inertia::render('PrivacyPolicy'))->name('privacy');
Route::get('/help', [\App\Http\Controllers\HelpCenterController::class, 'index'])->name('help.index');
Route::get('/help/articles/{slug}', [\App\Http\Controllers\HelpCenterController::class, 'show'])->name('help.show');
Route::get('/known-issues', [\App\Http\Controllers\KnownIssuesController::class, 'show'])->name('known-issues.show');
Route::get('/partners', [\App\Http\Controllers\Marketing\PartnersPublicController::class, 'index'])->name('marketing.partners');
Route::post('/partners-submit', [\App\Http\Controllers\Marketing\PartnersPublicController::class, 'store'])->name('marketing.partners.store');
Route::get('/sitemap.xml', [\App\Http\Controllers\Marketing\SitemapController::class, 'index'])->name('sitemap');
Route::get('/sitemap-{type}.xml', [\App\Http\Controllers\Marketing\SitemapController::class, 'showSubSitemap'])
    ->where('type', 'pages|blog|compare|solutions|tools')
    ->name('sitemap.sub');
Route::post('/webhooks/lemon-squeezy', [\App\Http\Controllers\LemonSqueezyWebhookController::class, 'handle'])
    ->name('webhooks.lemon-squeezy');

// ── Demo Sandbox Routes ───────────────────────────────────────────────
// /demo landing stays indexable (marketing page, covered by MarketingSeo).
// Login/logout are transactional entry points into the sandbox — noindex them.
Route::get('/demo', [\App\Http\Controllers\DemoController::class, 'landing'])->name('demo.landing');
Route::middleware([\App\Http\Middleware\NoIndexMiddleware::class])->group(function () {
    Route::match(['get', 'post'], '/demo/login', [\App\Http\Controllers\DemoController::class, 'login'])->name('demo.login');
    Route::post('/demo/logout', [\App\Http\Controllers\DemoController::class, 'logout'])->name('demo.logout');
});


// ── VenSynQ Universal OAuth Callbacks ────────────────────────────────────────
// These fixed URLs are registered in Amazon / TikTok / eBay developer portals.
// They capture the auth code and session state, then redirect to the correct
// tenant store's callback handler automatically.
//
//   Amazon:  https://venqore.com/amazon/callback
//   TikTok:  https://venqore.com/tiktok/callback
//   eBay:    https://venqore.com/ebay/callback
//
Route::get('/amazon/callback', [\App\Http\Controllers\VenSynQController::class, 'universalCallback'])
    ->name('vensynq.universal.callback.amazon')
    ->defaults('platform', 'amazon');

Route::get('/tiktok/callback', [\App\Http\Controllers\VenSynQController::class, 'universalCallback'])
    ->name('vensynq.universal.callback.tiktok')
    ->defaults('platform', 'tiktok');

Route::get('/ebay/callback', [\App\Http\Controllers\VenSynQController::class, 'universalCallback'])
    ->name('vensynq.universal.callback.ebay')
    ->defaults('platform', 'ebay');

// T16 — WooCommerce is now a first-class VenSynQ platform. The VenQore Sync
// plugin redirects here after the key-pair handshake completes.
Route::get('/woocommerce/callback', [\App\Http\Controllers\VenSynQController::class, 'universalCallback'])
    ->name('vensynq.universal.callback.woocommerce')
    ->defaults('platform', 'woocommerce');

Route::get('/google/callback', [\App\Http\Controllers\GoogleDriveAuthController::class, 'handleGoogleCallback'])
    ->name('google.callback');

// ── Auth (no store context) ──────────────────────────────────────────────
Route::middleware(['auth', 'verified', \App\Http\Middleware\NoIndexMiddleware::class])->group(function () {
    // Store hub (shown to users with 2+ stores)
    Route::get('/hub', [\App\Http\Controllers\HubController::class, 'index'])->name('hub');
    Route::get('/api/my-stores', [\App\Http\Controllers\HubController::class, 'apiList'])->name('my-stores.api');

    // Staff Hub (unified dashboard for store employees)
    Route::get('/staff/hub', [\App\Http\Controllers\StaffHubController::class, 'index'])->name('staff.hub');

    // Create / Join store
    Route::get('/start',     [\App\Http\Controllers\StoreController::class, 'createOrJoin'])->name('store.create-or-join');
    Route::get('/new-store', [\App\Http\Controllers\StoreController::class, 'create'])->name('store.create');
    Route::post('/new-store',[\App\Http\Controllers\StoreController::class, 'store'])->name('store.store');

    // Join by store code
    Route::get('/join',  [\App\Http\Controllers\StaffController::class, 'joinForm'])->name('store.join');
    Route::post('/join', [\App\Http\Controllers\StaffController::class, 'joinWithCode'])->name('store.join.submit');

    // ── V1 Staff Invite: Magic Link (Path A) ─────────────────
    Route::get('/invite/accept',          [\App\Http\Controllers\StaffInvitationController::class, 'acceptByToken'])->name('invite.accept');
    Route::post('/invite/accept',         [\App\Http\Controllers\StaffInvitationController::class, 'accept'])->name('invite.submit');
    Route::post('/invite/decline',        [\App\Http\Controllers\StaffInvitationController::class, 'declineByToken'])->name('invite.decline');

    // ── Gift Access Links: Accept (requires auth — see /gift/{token} below
    // for the public preview page any visitor can see before logging in) ──
    Route::post('/gift/{token}', [\App\Http\Controllers\GiftRedemptionController::class, 'accept'])->name('gift.accept');

    // ── V1 Staff Invite: Code Validation (Path B — Hub) ───────────
    Route::post('/invite/validate-code',  [\App\Http\Controllers\StaffInvitationController::class, 'validateCode'])->name('invite.validate-code');

    // Global account settings (not store-specific)
    Route::get('/account',   [ProfileController::class, 'edit'])->name('account.edit');
    Route::patch('/account', [ProfileController::class, 'update'])->name('account.update');
    Route::post('/account/passcode', [ProfileController::class, 'updatePasscode'])->name('account.passcode');
    Route::post('/account/security-pin', [\App\Http\Controllers\ProfileSecurityController::class, 'updateSecurityPin'])->name('account.security-pin');
    Route::delete('/account', [ProfileController::class, 'destroy'])->name('account.destroy');
});

// ── Store Context Routes ─────────────────────────────────────────────────
// All routes under /s/{store_slug}/ require auth + valid store membership
Route::middleware(['auth', 'verified', 'tenant', 'lifecycle', 'drm', \App\Http\Middleware\DemoMiddleware::class, \App\Http\Middleware\NoIndexMiddleware::class, \App\Http\Middleware\EnforceHostedUntil::class])
    ->prefix('s/{store_slug}')
    ->name('store.')
    ->group(function () {
        Route::get('/', fn() => \redirect()->route('store.pos', ['store_slug' => app('current.tenant')->slug]));

        // Setup wizard (no plan gate — always accessible)
        Route::get('/setup',  [\App\Http\Controllers\SetupController::class, 'index'])->name('setup');
        Route::post('/setup', [\App\Http\Controllers\SetupController::class, 'complete'])->name('setup.complete');

        // L032: Terminal pairing tokens (tenant admin issues these; a new
        // terminal presents one on first heartbeat to prove authorization).
        Route::get('/terminal-pairing-tokens',        [\App\Http\Controllers\TerminalPairingController::class, 'index'])->middleware('permission:admin.settings_manage')->name('terminal-pairing.index');
        Route::post('/terminal-pairing-tokens',       [\App\Http\Controllers\TerminalPairingController::class, 'store'])->middleware('permission:admin.settings_manage')->name('terminal-pairing.store');
        Route::delete('/terminal-pairing-tokens/{id}', [\App\Http\Controllers\TerminalPairingController::class, 'destroy'])->middleware('permission:admin.settings_manage')->name('terminal-pairing.destroy');

        // POS (on-demand API, no full catalog pre-load)
        Route::get('/pos',                     [\App\Http\Controllers\PosController::class, 'index'])->name('pos');
        // GAP 1 FIX: Dead route removed. POS sales go through the legacy SaleController via Route::post('sales', ...) at line 1101.
        // Route::post('/pos/sale', ...) was wired to PosController::completeSale() which does not exist.
        Route::get('/pos/products',            [\App\Http\Controllers\Api\PosSearchController::class, 'search'])->name('pos.search');
        Route::get('/pos/products/featured',   [\App\Http\Controllers\Api\PosSearchController::class, 'featured'])->name('pos.featured');
        Route::get('/pos/categories',          [\App\Http\Controllers\Api\PosSearchController::class, 'categories'])->name('pos.categories');
        Route::get('/pos/barcode/{code}',      [\App\Http\Controllers\Api\PosSearchController::class, 'findByBarcode'])->name('pos.barcode');
        // pos.open / pos.close removed 2026-08-02 — see PosController note above.

        // Staff management (within this store)
        Route::get('/staff',              [\App\Http\Controllers\StaffController::class, 'index'])->middleware('permission:users.manage')->name('staff');
        Route::post('/staff/invite',      [\App\Http\Controllers\StaffController::class, 'invite'])->middleware('permission:users.manage')->name('staff.invite');

        // Store billing
        Route::get('/billing',         [\App\Http\Controllers\BillingController::class, 'index'])->name('billing');
        Route::get('/billing/upgrade', [\App\Http\Controllers\BillingController::class, 'upgrade'])->name('billing.upgrade');
        Route::get('/billing/portal',  [\App\Http\Controllers\BillingController::class, 'portal'])->name('billing.portal');
        // Live payment history from Lemon Squeezy. Lazy-loaded by the Payment
        // History tab so the billing page never blocks on an external API.
        Route::get('/billing/payment-history', [\App\Http\Controllers\BillingController::class, 'paymentHistory'])->name('billing.payment-history');
        Route::get('/backup/export',  [\App\Http\Controllers\VqBackupController::class, 'export'])->middleware('permission:data.export')->name('backup.export');
        Route::post('/backup/import',  [\App\Http\Controllers\VqBackupController::class, 'import'])->name('backup.import');
        Route::post('/billing/cancel-trial', [\App\Http\Controllers\BillingController::class, 'cancelTrial'])->name('billing.cancel-trial');
        // In-app subscription cancel / resume. Without these the only route to
        // cancelling was the Lemon Squeezy portal, which requires a separate
        // login and is a dead end for guest checkouts.
        Route::post('/billing/cancel-subscription', [\App\Http\Controllers\BillingController::class, 'cancelSubscription'])->middleware('permission:admin.billing_store')->name('billing.cancel-subscription');
        Route::post('/billing/resume-subscription', [\App\Http\Controllers\BillingController::class, 'resumeSubscription'])->middleware('permission:admin.billing_store')->name('billing.resume-subscription');
        Route::post('/billing/checkout-addon', [\App\Http\Controllers\BillingController::class, 'checkoutAddon'])->name('billing.checkout-addon');
        Route::post('/billing/change-plan',  [\App\Http\Controllers\BillingController::class, 'changePlan'])->name('billing.change-plan');
        Route::post('/billing/deactivate-feature', [\App\Http\Controllers\BillingController::class, 'deactivateFeature'])->name('billing.deactivate-feature');
        Route::post('/billing/checkout-upload-service', [\App\Http\Controllers\BillingController::class, 'checkoutUploadService'])->name('billing.checkout-upload-service');
        // Webhook safety net — pulls subscription state from the Lemon Squeezy API
        // when the webhook never arrived (local dev, delay, or dropped delivery).
        Route::post('/billing/sync-subscription', [\App\Http\Controllers\BillingController::class, 'syncSubscription'])->middleware('permission:admin.billing_store')->name('billing.sync-subscription');

        // Google Drive Backups
        Route::get('/google/redirect',      [\App\Http\Controllers\GoogleDriveAuthController::class, 'redirectToGoogle'])->name('google.redirect');
        Route::post('/google/disconnect',   [\App\Http\Controllers\GoogleDriveAuthController::class, 'disconnect'])->name('google.disconnect');
        Route::post('/google/settings',     [\App\Http\Controllers\GoogleDriveAuthController::class, 'updateSettings'])->name('google.settings');
        Route::post('/google/sync-now',     [\App\Http\Controllers\VqBackupController::class, 'syncToGoogleDrive'])->name('google.sync-now');
        Route::get('/google/backup/download/{fileId}', [\App\Http\Controllers\VqBackupController::class, 'downloadFromGoogleDrive'])->name('google.backup.download');
        Route::post('/google/backup/delete/{fileId}',   [\App\Http\Controllers\VqBackupController::class, 'deleteFromGoogleDrive'])->name('google.backup.delete');
        Route::post('/google/backup/restore/{fileId}',  [\App\Http\Controllers\VqBackupController::class, 'restoreFromGoogleDrive'])->name('google.backup.restore');

        // Store settings
        Route::get('/settings',                    [\App\Http\Controllers\SettingsController::class, 'index'])->name('settings');
        Route::post('/settings',                   [\App\Http\Controllers\SettingsController::class, 'update'])->name('settings.update');

        // SmartCapture (AI Scan) API
        // NOTE: /extract costs exactly one upstream AI request per call. The
        // throttle here is a blunt safety net; the real protection is the
        // per-store single-flight lock inside the controller.
        Route::prefix('smart-capture')
            ->middleware(\App\Http\Middleware\EnsureSmartCaptureAccess::class)
            ->group(function () {
            Route::get('/context',   [\App\Http\Controllers\SmartCapture\SmartCaptureController::class, 'context'])->name('smart-capture.context');
            Route::post('/extract',  [\App\Http\Controllers\SmartCapture\SmartCaptureController::class, 'extract'])->middleware('throttle:20,1')->name('smart-capture.extract');
            Route::get('/status/{job_id}', [\App\Http\Controllers\SmartCapture\SmartCaptureController::class, 'jobStatus'])->name('smart-capture.job-status');
            Route::post('/confirm',  [\App\Http\Controllers\SmartCapture\SmartCaptureController::class, 'confirm'])->middleware('throttle:30,1')->name('smart-capture.confirm');
            Route::get('/settings',  [\App\Http\Controllers\SmartCapture\SmartCaptureController::class, 'settings'])->name('smart-capture.settings');
            Route::post('/settings', [\App\Http\Controllers\SmartCapture\SmartCaptureController::class, 'saveSettings'])->name('smart-capture.settings.save');
            Route::post('/settings/test', [\App\Http\Controllers\SmartCapture\SmartCaptureController::class, 'testSettings'])->middleware('throttle:10,1')->name('smart-capture.settings.test');
            Route::post('/settings/models', [\App\Http\Controllers\SmartCapture\SmartCaptureController::class, 'models'])->middleware('permission:admin.settings_manage')->middleware('throttle:10,1')->name('smart-capture.settings.models');
            // Learning memory (per-store, shared by all staff)
            Route::get('/aliases',   [\App\Http\Controllers\SmartCapture\SmartCaptureController::class, 'aliases'])->name('smart-capture.aliases');
            Route::post('/aliases/forget', [\App\Http\Controllers\SmartCapture\SmartCaptureController::class, 'forgetAlias'])->middleware('permission:admin.settings_manage')->middleware('throttle:60,1')->name('smart-capture.aliases.forget');
        });

        // Trial expired landing (within store context)
        Route::get('/trial-expired', fn() => Inertia::render('Errors/TrialExpired'))->name('trial.expired');

        // ── Plan Change Notifications ────────────────────────────────────
        Route::group(['prefix' => 'notifications/plan', 'as' => 'notifications.plan.'], function () {
            Route::get('/unread',         [\App\Http\Controllers\PlanNotificationController::class, 'unread'])->name('unread');
            Route::post('/mark-all-read', [\App\Http\Controllers\PlanNotificationController::class, 'markAllRead'])->name('markAllRead');
            Route::post('/{id}/read',     [\App\Http\Controllers\PlanNotificationController::class, 'markRead'])->name('read');
        });

        // ── Store Admin Panel (Restored Legacy Experience) ──────────────────
        Route::group(['prefix' => 'admin', 'as' => 'admin.', 'middleware' => ['permission:admin.settings_manage']], function () {
            Route::get('/',            [\App\Http\Controllers\AdminController::class, 'index'])->name('home');
            Route::get('/dashboard',   [\App\Http\Controllers\AdminController::class, 'dashboard'])->name('dashboard');
            Route::get('/settings',    [\App\Http\Controllers\AdminController::class, 'settings'])->name('settings');
            Route::post('/settings',   [\App\Http\Controllers\AdminController::class, 'updateSettings'])->name('settings.update');
            Route::get('/users',       [\App\Http\Controllers\StaffInvitationController::class, 'index'])->name('users');
            // Member management — single source of truth
            Route::patch('/users/{member}',  [\App\Http\Controllers\AdminController::class, 'updateMember'])->middleware('permission:users.manage')->name('users.update');
            Route::delete('/users/{member}', [\App\Http\Controllers\AdminController::class, 'removeMember'])->middleware('permission:users.manage')->name('users.remove');
            Route::post('/users',      [\App\Http\Controllers\AdminController::class, 'storeUser'])->middleware('permission:users.manage')->name('users.store');
            Route::get('/staff',       function () { return redirect()->route('store.admin.users', ['store_slug' => app('current.tenant')->slug]); })->name('staff');

            // ── V1 Staff Invitation System ─────────────────────────────────
            Route::post('/invitations',                        [\App\Http\Controllers\StaffInvitationController::class, 'store'])->middleware('permission:users.manage')->name('invitations.store');
            Route::post('/invitations/{invitation}/approve',   [\App\Http\Controllers\StaffInvitationController::class, 'approve'])->middleware('permission:users.manage')->name('invitations.approve');
            Route::post('/invitations/{invitation}/decline',   [\App\Http\Controllers\StaffInvitationController::class, 'decline'])->middleware('permission:users.manage')->name('invitations.decline');
            Route::post('/invitations/{invitation}/revoke',    [\App\Http\Controllers\StaffInvitationController::class, 'revoke'])->middleware('permission:users.manage')->name('invitations.revoke');
            Route::post('/invitations/{invitation}/resend',    [\App\Http\Controllers\StaffInvitationController::class, 'resend'])->middleware('permission:users.manage')->name('invitations.resend');
            Route::get('/attendance',  function () { return redirect()->route('store.admin.users', ['store_slug' => app('current.tenant')->slug]); })->name('attendance');
            
            Route::get('/logs',        [\App\Http\Controllers\AdminController::class, 'logs'])->name('logs');

            // Data & Disaster Recovery
            Route::get('/data-management', [\App\Http\Controllers\DataManagementController::class, 'index'])->name('data');
            Route::post('/data/export',    [\App\Http\Controllers\DataManagementController::class, 'export'])->middleware('permission:data.export')->name('data.export');
            Route::post('/data/import',    [\App\Http\Controllers\DataManagementController::class, 'import'])->name('data.import');
            Route::post('/data/upload-mapping', [\App\Http\Controllers\ImportMappingController::class, 'uploadForMapping'])->name('data.upload-mapping');
            Route::post('/data/process-import', [\App\Http\Controllers\ImportMappingController::class, 'processImport'])->name('data.process-import');
            Route::post('/data/validate-import', [\App\Http\Controllers\ImportMappingController::class, 'validateImport'])->name('data.validate-import');
            Route::get('/data/template', [\App\Http\Controllers\DataManagementController::class, 'template'])->name('data.template');
            
            // OVERRIDE: Removed. Raw SQL Backup/Restore strictly locked to Platform Admin.
            // Route::get('/backups',             [\App\Http\Controllers\BackupController::class, 'index'])->name('backups');
            // Route::post('/backups',            [\App\Http\Controllers\BackupController::class, 'store'])->name('backups.store');
            // Route::get('/backups/download/{filename}', [\App\Http\Controllers\BackupController::class, 'download'])->name('backups.download');
            // Route::delete('/backups/{filename}', [\App\Http\Controllers\BackupController::class, 'delete'])->name('backups.delete');
            // Route::post('/backups/email/{filename}', [\App\Http\Controllers\BackupController::class, 'email'])->name('backups.email');
            // Route::post('/backups/restore',    [\App\Http\Controllers\BackupController::class, 'restore'])->name('backups.restore');

            // Recycle Bin
            Route::get('/recycle-bin',         [\App\Http\Controllers\RecycleBinController::class, 'index'])->name('recycle-bin.index');
            Route::post('/recycle-bin/{id}/restore', [\App\Http\Controllers\RecycleBinController::class, 'restore'])->name('recycle-bin.restore');
            Route::delete('/recycle-bin/{id}/force-delete', [\App\Http\Controllers\RecycleBinController::class, 'forceDelete'])->middleware('permission:records.force_delete')->name('recycle-bin.force-delete');

            Route::prefix('chatbot')->name('chatbot.')->middleware(\App\Http\Middleware\StoreChatbotMiddleware::class)->group(function () {
                // Chatbot Settings (API key + custom rules for this store's bot)
                Route::get('/settings',        [\App\Http\Controllers\StoreChatbotSettingsController::class, 'index'])->name('settings');
                Route::post('/settings',       [\App\Http\Controllers\StoreChatbotSettingsController::class, 'update'])->name('settings.update');
                Route::post('/settings/test',  [\App\Http\Controllers\StoreChatbotSettingsController::class, 'testConnection'])->name('ai.test');

                // Agent Inbox (Inertia page)
                Route::get('/inbox', function () {
                    return \Inertia\Inertia::render('Admin/AgentInbox');
                })->name('inbox');

                // Agent API — chat session management for this store
                Route::get('/sessions',                       [\App\Http\Controllers\AgentChatController::class, 'sessions'])->name('sessions');
                Route::post('/sessions/{uuid}/claim',         [\App\Http\Controllers\AgentChatController::class, 'claim'])->name('claim');
                Route::post('/sessions/{uuid}/reply',         [\App\Http\Controllers\AgentChatController::class, 'reply'])->name('reply');
                Route::post('/sessions/{uuid}/typing',        [\App\Http\Controllers\AgentChatController::class, 'typing'])->name('typing.agent');
                Route::post('/sessions/{uuid}/release',       [\App\Http\Controllers\AgentChatController::class, 'release'])->name('release');
                Route::post('/sessions/{uuid}/resolve',       [\App\Http\Controllers\AgentChatController::class, 'resolve'])->name('resolve');
                Route::post('/sessions/{uuid}/handoff-to-ai', [\App\Http\Controllers\AgentChatController::class, 'handoffToAi'])->name('handoff-to-ai');
                Route::post('/sessions/{uuid}/refer',         [\App\Http\Controllers\AgentChatController::class, 'refer'])->name('refer');
                Route::post('/sessions/{uuid}/set-status',     [\App\Http\Controllers\AgentChatController::class, 'setStatus'])->name('set-status');
                Route::post('/sessions/{uuid}/log-learning',   [\App\Http\Controllers\AgentChatController::class, 'logLearning'])->name('log-learning');
                Route::get('/sessions/{uuid}/assist-suggestion', [\App\Http\Controllers\AgentChatController::class, 'assistSuggestion'])->name('assist-suggestion');
                Route::post('/sessions/{uuid}/assist', [\App\Http\Controllers\VenaAssistController::class, 'assist'])->name('assist');
                Route::get('/canned-responses',               [\App\Http\Controllers\AgentChatController::class, 'cannedResponses'])->name('canned-responses');
                Route::delete('/sessions/{uuid}',             [\App\Http\Controllers\AgentChatController::class, 'destroy'])->name('destroy');
            });

            // ── Vena Chat Tickets — store-level view (customers of THIS store only) ─
            Route::get('/vena-tickets',                  [\App\Http\Controllers\Admin\VenaTicketsController::class, 'storeIndex'])->name('vena.tickets');
            Route::post('/vena-tickets/create',          [\App\Http\Controllers\Admin\VenaTicketsController::class, 'storeCreateTicket'])->name('vena.ticket.create');
            Route::get('/vena-tickets/{ticket}',         [\App\Http\Controllers\Admin\VenaTicketsController::class, 'storeShow'])->name('vena.ticket.show');
            Route::post('/vena-tickets/{ticket}/status', [\App\Http\Controllers\Admin\VenaTicketsController::class, 'storeUpdateStatus'])->name('vena.ticket.status');
        });
    });


// ── PK Verifications Submit (accessible by authenticated store owners) ─────
Route::middleware(['auth'])
    ->prefix('VenQore')
    ->name('platform.')
    ->group(function () {
        Route::post('/pk-verifications/submit', [\App\Http\Controllers\Admin\PkVerificationController::class, 'submit'])->name('pk-verifications.submit');
    });

// ── Platform Owner ───────────────────────────────────────────────────────────
Route::middleware([\App\Http\Middleware\SuperAdminMiddleware::class, \App\Http\Middleware\NoIndexMiddleware::class])
    ->prefix('VenQore')
    ->name('platform.')
    ->group(function () {
        Route::get('/',                   [\App\Http\Controllers\Admin\SuperAdminController::class, 'dashboard'])->name('dashboard');

        // Digital Hub (Etsy Partner Support & Product Registry CRUD)
        Route::get('/digital-hub', [\App\Http\Controllers\Admin\DigitalHubController::class, 'index'])->name('digital-hub');
        Route::get('/digital-hub/chats', [\App\Http\Controllers\Admin\DigitalHubController::class, 'chats'])->name('digital-hub.chats');
        Route::post('/digital-hub/chats/{ticket_id}/reply', [\App\Http\Controllers\Admin\DigitalHubController::class, 'reply'])->name('digital-hub.chats.reply');
        Route::post('/digital-hub/chats/{ticket_id}/status', [\App\Http\Controllers\Admin\DigitalHubController::class, 'updateStatus'])->name('digital-hub.chats.status');
        Route::get('/digital-hub/products', [\App\Http\Controllers\Admin\DigitalHubController::class, 'getProducts'])->name('digital-hub.products');
        Route::post('/digital-hub/products', [\App\Http\Controllers\Admin\DigitalHubController::class, 'createProduct'])->name('digital-hub.products.create');
        Route::post('/digital-hub/products/{id}/update', [\App\Http\Controllers\Admin\DigitalHubController::class, 'updateProduct'])->name('digital-hub.products.update');
        Route::delete('/digital-hub/products/{id}', [\App\Http\Controllers\Admin\DigitalHubController::class, 'deleteProduct'])->name('digital-hub.products.delete');

        // Newsletter Hub (Platform Newsletters & Subscribers lists)
        Route::get('/newsletter-hub', [\App\Http\Controllers\Admin\NewsletterHubController::class, 'index'])->name('newsletter-hub');
        Route::get('/newsletter-hub/subscribers', [\App\Http\Controllers\Admin\NewsletterHubController::class, 'subscribers'])->name('newsletter-hub.subscribers');


        // Chatbot Settings
        Route::get('/chatbot/settings',            [\App\Http\Controllers\ChatbotSettingsController::class, 'index'])->name('chatbot.settings');
        Route::post('/chatbot/settings',           [\App\Http\Controllers\ChatbotSettingsController::class, 'update'])->name('chatbot.settings.update');
        Route::post('/chatbot/settings/test',      [\App\Http\Controllers\ChatbotSettingsController::class, 'testConnection'])->name('ai.test');

        // Agent Inbox page (Inertia React view)
        Route::get('/chatbot/inbox', function () {
            return Inertia::render('Admin/AgentInbox');
        })->name('chatbot.inbox');

        // Chatbot Admin API
        Route::get('/api/chatbot/sessions', [\App\Http\Controllers\AgentChatController::class, 'sessions'])->name('chatbot.sessions');
        Route::post('/api/chatbot/sessions/{uuid}/claim', [\App\Http\Controllers\AgentChatController::class, 'claim'])->name('chatbot.claim');
        Route::post('/api/chatbot/sessions/{uuid}/reply', [\App\Http\Controllers\AgentChatController::class, 'reply'])->name('chatbot.reply');
        Route::post('/api/chatbot/sessions/{uuid}/typing', [\App\Http\Controllers\AgentChatController::class, 'typing'])->name('chatbot.typing.agent');
        Route::post('/api/chatbot/sessions/{uuid}/release', [\App\Http\Controllers\AgentChatController::class, 'release'])->name('chatbot.release');
        Route::post('/api/chatbot/sessions/{uuid}/resolve', [\App\Http\Controllers\AgentChatController::class, 'resolve'])->name('chatbot.resolve');
        Route::post('/api/chatbot/sessions/{uuid}/handoff-to-ai', [\App\Http\Controllers\AgentChatController::class, 'handoffToAi'])->name('chatbot.handoff-to-ai');
        Route::post('/api/chatbot/sessions/{uuid}/refer', [\App\Http\Controllers\AgentChatController::class, 'refer'])->name('chatbot.refer');
        Route::post('/api/chatbot/sessions/{uuid}/set-status', [\App\Http\Controllers\AgentChatController::class, 'setStatus'])->name('chatbot.set-status');
        Route::post('/api/chatbot/sessions/{uuid}/log-learning', [\App\Http\Controllers\AgentChatController::class, 'logLearning'])->name('chatbot.log-learning');
        Route::get('/api/chatbot/sessions/{uuid}/assist-suggestion', [\App\Http\Controllers\AgentChatController::class, 'assistSuggestion'])->name('chatbot.assist-suggestion');
        Route::post('/api/chatbot/sessions/{uuid}/assist', [\App\Http\Controllers\VenaAssistController::class, 'assist'])->name('chatbot.assist');
        Route::get('/api/chatbot/canned-responses', [\App\Http\Controllers\AgentChatController::class, 'cannedResponses'])->name('chatbot.canned-responses');
        Route::delete('/api/chatbot/sessions/{uuid}', [\App\Http\Controllers\AgentChatController::class, 'destroy'])->name('chatbot.destroy');

        // Vena Autonomy Dashboard stats and promote endpoints
        Route::get('/api/platform/vena/autonomy-stats', [\App\Http\Controllers\VenaAssistController::class, 'autonomyStats'])->name('chatbot.autonomy-stats');
        Route::post('/api/platform/vena/autonomy-stats/promote', [\App\Http\Controllers\VenaAssistController::class, 'promoteCategory'])->name('chatbot.autonomy-stats.promote');

        // NOTE: The GET /run-migrations browser route was removed (Roadmap T1.7).
        // Migrations run only via the Updater flow / CLI, never from a URL.

        Route::get('/stores',             [\App\Http\Controllers\Admin\SuperAdminController::class, 'stores'])->name('stores');
        Route::get('/users',              [\App\Http\Controllers\Admin\SuperAdminController::class, 'users'])->name('users');
        Route::post('/stores/{tenant}/suspend',      [\App\Http\Controllers\Admin\SuperAdminController::class, 'suspend'])->name('store.suspend');
        Route::post('/stores/{tenant}/activate',     [\App\Http\Controllers\Admin\SuperAdminController::class, 'activate'])->name('store.activate');
        Route::post('/stores/{tenant}/extend-trial', [\App\Http\Controllers\Admin\SuperAdminController::class, 'extendTrial'])->name('store.extend-trial');
        Route::post('/stores/{tenant}/toggle-internal', [\App\Http\Controllers\Admin\SuperAdminController::class, 'toggleInternal'])->name('store.toggle-internal');

        // Trash Management
        Route::delete('/stores/{tenant}/destroy',    [\App\Http\Controllers\Admin\SuperAdminController::class, 'destroyStore'])->name('store.destroy');
        Route::post('/stores/bulk-destroy',          [\App\Http\Controllers\Admin\SuperAdminController::class, 'bulkDestroyStores'])->name('stores.bulk-destroy');
        Route::post('/stores/{id}/restore',          [\App\Http\Controllers\Admin\SuperAdminController::class, 'restoreStore'])->name('store.restore');
        Route::delete('/stores/{id}/purge',          [\App\Http\Controllers\Admin\SuperAdminController::class, 'purgeStore'])->name('store.purge');
        
        Route::delete('/users/{user}/destroy',       [\App\Http\Controllers\Admin\SuperAdminController::class, 'destroyUser'])->name('user.destroy');
        Route::post('/users/bulk-destroy',           [\App\Http\Controllers\Admin\SuperAdminController::class, 'bulkDestroyUsers'])->name('users.bulk-destroy');
        Route::post('/users/{id}/restore',           [\App\Http\Controllers\Admin\SuperAdminController::class, 'restoreUser'])->name('user.restore');
        Route::delete('/users/{id}/purge',           [\App\Http\Controllers\Admin\SuperAdminController::class, 'purgeUser'])->name('user.purge');

        // AppSumo routes gated dynamically via database setting in controller (T3.8)
        Route::get('/appsumo',            [\App\Http\Controllers\Admin\SuperAdminController::class, 'appsumoCodes'])->name('appsumo.index');
        Route::post('/appsumo/generate',  [\App\Http\Controllers\Admin\SuperAdminController::class, 'generateAppSumoCodes'])->name('appsumo.generate');
        Route::post('/appsumo/import',    [\App\Http\Controllers\Admin\SuperAdminController::class, 'importAppSumoCodes'])->name('appsumo.import');
        Route::get('/appsumo/export',     [\App\Http\Controllers\Admin\SuperAdminController::class, 'exportAppSumoCodes'])->name('appsumo.export');
        Route::delete('/appsumo/purge',   [\App\Http\Controllers\Admin\SuperAdminController::class, 'purgeAppSumoCodes'])->name('appsumo.purge');

        // ── V1 Support Inbox ──────────────────────────────────────────────
        Route::get('/tickets',                              [\App\Http\Controllers\Admin\SupportController::class, 'tickets'])->name('tickets');
        Route::get('/tickets/{ticket}',                     [\App\Http\Controllers\Admin\SupportController::class, 'showTicket'])->name('ticket.show');
        Route::post('/tickets/{ticket}/reply',              [\App\Http\Controllers\Admin\SupportController::class, 'reply'])->name('ticket.reply');
        Route::post('/tickets/{ticket}/status',             [\App\Http\Controllers\Admin\SupportController::class, 'updateTicketStatus'])->name('ticket.status');

        // ── Vena Chat Tickets (auto-generated from Vena widget escalations) ───
        Route::get('/vena-tickets',              [\App\Http\Controllers\Admin\VenaTicketsController::class, 'index'])->name('vena.tickets');
        Route::get('/vena-tickets/{ticket}',     [\App\Http\Controllers\Admin\VenaTicketsController::class, 'show'])->name('vena.ticket.show');
        Route::post('/vena-tickets/{ticket}/status', [\App\Http\Controllers\Admin\VenaTicketsController::class, 'updateStatus'])->name('vena.ticket.status');

        // ── Webhook Logs ──────────────────────────────────────────────────
        Route::get('/webhooks',                             [\App\Http\Controllers\Admin\SupportController::class, 'webhooks'])->name('webhooks');

        // ── Feature Flags (per-store overrides) ───────────────────────────
        Route::post('/stores/{tenant}/feature-flag',        [\App\Http\Controllers\Admin\SupportController::class, 'toggleFeatureFlag'])->name('store.feature-flag');

        // ── System Health & Monitoring ────────────────────────────────────
        Route::get('/health/check',                          [\App\Http\Controllers\Admin\HealthCheckController::class, 'check'])->name('health.check');
        Route::get('/health/errors',                         [\App\Http\Controllers\Admin\SuperAdminController::class, 'errorLogs'])->name('health.errors');
        Route::post('/health/errors/resolve-all',            [\App\Http\Controllers\Admin\SuperAdminController::class, 'resolveAllErrors'])->name('health.errors.resolve-all');
        Route::post('/health/errors/detect-fixes',           [\App\Http\Controllers\Admin\SuperAdminController::class, 'detectFixes'])->name('health.errors.detect-fixes');
        Route::post('/health/errors/{error}/resolve',        [\App\Http\Controllers\Admin\SuperAdminController::class, 'resolveError'])->name('health.errors.resolve');
        Route::get('/health/contacts',                       [\App\Http\Controllers\Admin\SuperAdminController::class, 'contactSubmissions'])->name('health.contacts');
        Route::post('/health/contacts/{contact}/read',       [\App\Http\Controllers\Admin\SuperAdminController::class, 'readContact'])->name('health.contacts.read');

        // ── Jobs & Queues (T4.4) ──────────────────────────────────────────────
        Route::get('/jobs/metrics',          [\App\Http\Controllers\Admin\JobsController::class, 'metrics'])->name('jobs.metrics');
        Route::post('/jobs/failed/{id}/retry', [\App\Http\Controllers\Admin\JobsController::class, 'retryFailed'])->name('jobs.retry');
        Route::delete('/jobs/failed/{id}',   [\App\Http\Controllers\Admin\JobsController::class, 'deleteFailed'])->name('jobs.delete-failed');
        Route::post('/jobs/failed/flush',    [\App\Http\Controllers\Admin\JobsController::class, 'flushFailed'])->name('jobs.flush-failed');


        // ── Impersonation ─────────────────────────────────────────────────
        Route::post('/impersonate/{user}',                  [\App\Http\Controllers\Admin\ImpersonationController::class, 'start'])->name('impersonate.start');
        Route::post('/impersonate/end',                     [\App\Http\Controllers\Admin\ImpersonationController::class, 'end'])->name('impersonate.end');

        // ── Platform Owner Security & Profile ─────────────────────────────
        Route::post('/security/set-passcode',   [\App\Http\Controllers\Auth\PlatformOwnerAuthController::class, 'setPasscode'])->name('set-passcode');
        Route::post('/security/clear-passcode', [\App\Http\Controllers\Auth\PlatformOwnerAuthController::class, 'clearPasscode'])->name('clear-passcode');
        Route::post('/security/change-password',[\App\Http\Controllers\Auth\PlatformOwnerAuthController::class, 'changePassword'])->name('change-password');
        Route::post('/security/set-action-passcode',   [\App\Http\Controllers\Auth\PlatformOwnerAuthController::class, 'setActionPasscode'])->name('set-action-passcode');
        Route::post('/security/clear-action-passcode', [\App\Http\Controllers\Auth\PlatformOwnerAuthController::class, 'clearActionPasscode'])->name('clear-action-passcode');

        // ── VenSynQ Module Control ─────────────────────────────────────────
        Route::post('/vensynq/toggle', [\App\Http\Controllers\Admin\SuperAdminController::class, 'toggleVenSynQ'])->name('vensynq.toggle');
        Route::post('/settings/save',   [\App\Http\Controllers\Admin\SuperAdminController::class, 'saveSettings'])->name('settings.save');

        // ── Partners & Equity Drawings (T1.6) ──────────────────────────────
        Route::post('/partners',                [\App\Http\Controllers\Admin\SuperAdminController::class, 'addPartner'])->name('partners.store');
        Route::delete('/partners/{partner}',    [\App\Http\Controllers\Admin\SuperAdminController::class, 'removePartner'])->name('partners.destroy');
        Route::post('/drawings',                [\App\Http\Controllers\Admin\SuperAdminController::class, 'logDrawing'])->name('drawings.store');
        Route::post('/drawings/clear-history',  [\App\Http\Controllers\Admin\SuperAdminController::class, 'clearAllDrawings'])->name('drawings.clear-history');

        // ── Monetization — Plans & Platforms ──────────────────────────────
        Route::prefix('plans')->name('plans.')->group(function () {
            Route::get('/',                  [\App\Http\Controllers\SuperAdmin\PlanController::class, 'index'])->name('index');
            Route::post('/',                 [\App\Http\Controllers\SuperAdmin\PlanController::class, 'store'])->name('store');
            Route::put('/bulk-update',       [\App\Http\Controllers\SuperAdmin\PlanController::class, 'bulkUpdate'])->name('bulk-update');
            Route::put('/{plan}',            [\App\Http\Controllers\SuperAdmin\PlanController::class, 'update'])->name('update');
            Route::post('/{plan}/duplicate', [\App\Http\Controllers\SuperAdmin\PlanController::class, 'duplicate'])->name('duplicate');
            Route::delete('/{plan}',         [\App\Http\Controllers\SuperAdmin\PlanController::class, 'destroy'])->name('destroy');
            Route::post('/{plan}/archive',   [\App\Http\Controllers\SuperAdmin\PlanController::class, 'archive'])->name('archive');
            Route::post('/{plan}/unarchive', [\App\Http\Controllers\SuperAdmin\PlanController::class, 'unarchive'])->name('unarchive');
        });

        Route::prefix('platforms')->name('platforms.')->group(function () {
            Route::get('/',           [\App\Http\Controllers\SuperAdmin\PlatformController::class, 'index'])->name('index');
            Route::post('/',          [\App\Http\Controllers\SuperAdmin\PlatformController::class, 'store'])->name('store');
            Route::put('/{platform}', [\App\Http\Controllers\SuperAdmin\PlatformController::class, 'update'])->name('update');
        });

        Route::prefix('blog-posts')->name('blog-posts.')->group(function () {
            Route::get('/',              [\App\Http\Controllers\SuperAdmin\BlogPostAdminController::class, 'index'])->name('index');
            Route::post('/',             [\App\Http\Controllers\SuperAdmin\BlogPostAdminController::class, 'store'])->name('store');
            Route::put('/{blogPost}',    [\App\Http\Controllers\SuperAdmin\BlogPostAdminController::class, 'update'])->name('update');
            Route::delete('/{blogPost}', [\App\Http\Controllers\SuperAdmin\BlogPostAdminController::class, 'destroy'])->name('destroy');
        });

        Route::prefix('coupons')->name('coupons.')->group(function () {
            Route::get('/',         [\App\Http\Controllers\SuperAdmin\CouponController::class, 'index'])->name('index');
            Route::post('/',        [\App\Http\Controllers\SuperAdmin\CouponController::class, 'store'])->name('store');
            Route::put('/{coupon}', [\App\Http\Controllers\SuperAdmin\CouponController::class, 'update'])->name('update');
        });

        // ── Monetization — Gift Access Links ──────────────────────────────
        Route::prefix('access-grants')->name('access-grants.')->group(function () {
            Route::get('/',                  [\App\Http\Controllers\SuperAdmin\AccessGrantController::class, 'index'])->name('index');
            Route::post('/',                 [\App\Http\Controllers\SuperAdmin\AccessGrantController::class, 'store'])->name('store');
            Route::post('/{grant}/revoke',   [\App\Http\Controllers\SuperAdmin\AccessGrantController::class, 'revoke'])->name('revoke');
            Route::post('/{grant}/unrevoke', [\App\Http\Controllers\SuperAdmin\AccessGrantController::class, 'unrevoke'])->name('unrevoke');
            Route::delete('/{grant}',        [\App\Http\Controllers\SuperAdmin\AccessGrantController::class, 'destroy'])->name('destroy');
        });

        // ── Monetization — Tenant Overrides ───────────────────────────────
        Route::prefix('tenant-overrides')->name('tenants.')->group(function () {
            Route::get('/',              [\App\Http\Controllers\SuperAdmin\TenantOverrideController::class, 'index'])->name('overrides');
            Route::get('/{tenant}',      [\App\Http\Controllers\SuperAdmin\TenantOverrideController::class, 'show'])->name('overrides.show');
            Route::patch('/{tenant}',    [\App\Http\Controllers\SuperAdmin\TenantOverrideController::class, 'updateTenant'])->name('overrides.update');
            Route::post('/{tenant}',     [\App\Http\Controllers\SuperAdmin\TenantOverrideController::class, 'apply'])->name('overrides.apply');
            Route::delete('/{tenant}/{override}', [\App\Http\Controllers\SuperAdmin\TenantOverrideController::class, 'remove'])->name('overrides.remove');
        });

        // ── PK Verifications (T3.7) ────────────────────────────────────────
        Route::post('/pk-verifications/{verification}/approve',        [\App\Http\Controllers\Admin\PkVerificationController::class, 'approve'])->name('pk-verifications.approve');
        Route::post('/pk-verifications/{verification}/reject',         [\App\Http\Controllers\Admin\PkVerificationController::class, 'reject'])->name('pk-verifications.reject');
        Route::get('/pk-verifications/{verification}/download/{side}',  [\App\Http\Controllers\Admin\PkVerificationController::class, 'downloadImage'])->name('pk-verifications.download');

        // Added Category D Platform Admin Routes
        Route::post('/admin/migration/analyze', fn() => \abort(501, 'Not yet implemented'))->name('admin.migration.analyze');

        // NOTE: Debug & repair routes removed before production launch (security hardening).
        // NOTE: Second duplicate GET /run-migrations browser route removed (Roadmap T1.7 / bug #14).

        Route::prefix('demo-store')->name('demo-store.')->group(function () {
            Route::get('/status',               [\App\Http\Controllers\Admin\DemoStoreController::class, 'status'])->name('status');
            Route::post('/reset',               [\App\Http\Controllers\Admin\DemoStoreController::class, 'reset'])->name('reset');
            Route::post('/deploy',              [\App\Http\Controllers\Admin\DemoStoreController::class, 'deploy'])->name('deploy');
            Route::get('/deploy/status/{jobId}', [\App\Http\Controllers\Admin\DemoStoreController::class, 'deployStatus'])->name('deploy.status');
            Route::delete('/deploy/cleanup/{jobId}', [\App\Http\Controllers\Admin\DemoStoreController::class, 'deployCleanup'])->name('deploy.cleanup');
            Route::post('/tests/run',           [\App\Http\Controllers\Admin\DemoStoreController::class, 'runTests'])->name('tests.run');
            Route::get('/tests/status/{jobId}',  [\App\Http\Controllers\Admin\DemoStoreController::class, 'testStatus'])->name('tests.status');
            Route::delete('/tests/cleanup/{jobId}', [\App\Http\Controllers\Admin\DemoStoreController::class, 'testCleanup'])->name('tests.cleanup');
        });

        Route::prefix('smoke-tests')->name('smoke-tests.')->group(function () {
            Route::post('/run',                 [\App\Http\Controllers\Admin\SmokeTestController::class, 'run'])->name('run');
            Route::get('/{job_id}',             [\App\Http\Controllers\Admin\SmokeTestController::class, 'status'])->name('status');
            Route::delete('/{job_id}',          [\App\Http\Controllers\Admin\SmokeTestController::class, 'cleanup'])->name('cleanup');
        });
    });

Route::get('/', function () {
    // 1. Check Database Connection First
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
    } catch (\Exception $e) {
        // If DB fails, redirect to installer (which allows setting it up)
        return \redirect()->route('installer.index');
    }

    // 2. Check if Installed (Table exists)
    if (!file_exists(storage_path('installed')) || !\Illuminate\Support\Facades\Schema::hasTable('settings')) {
        return \redirect()->route('installer.index');
    }

    // 3. Auto-logout demo users when they navigate back to the main site.
    // Demo accounts use the pattern demo-{role}@venqore-demo.internal.
    // Rather than bouncing them to /hub (which is confusing), we cleanly
    // end their session so they land on the marketing page as a visitor.
    if (Auth::check()) {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (str_ends_with($user->email, '@venqore-demo.internal')) {
            \Illuminate\Support\Facades\Cache::decrement('demo_visit_live');
            Auth::logout();
            request()->session()->invalidate();
            request()->session()->regenerateToken();
            // Fall through to render the landing page below
        } elseif ($user->isPlatformAdmin()) {
            return \redirect()->route('platform.dashboard');
        } else {
            return \redirect()->route('hub');
        }
    }

    // 4. Show the marketing landing page to unauthenticated visitors
    // On subdomain tenant installs, this still shows the setup welcome — see TenantMiddleware
    return Inertia::render('LandingPage');
})->name('welcome');



// Post-setup welcome splash (internal, not a marketing page)
Route::get('/welcome-splash', function () {
    return Inertia::render('Welcome');
})->middleware('auth')->name('welcome-splash');



// ── Gift Access Links: public preview page ────────────────────────────────────
// Anyone with the link can see what they're being offered before deciding to
// log in / register. The actual grant (POST /gift/{token}) requires auth —
// see the 'gift.accept' route in the authenticated group above.
Route::get('/gift/{token}', [\App\Http\Controllers\GiftRedemptionController::class, 'show'])->name('gift.show');

// ── Phase 7: AppSumo LTD Code Redemption ──────────────────────────────────────
// Public routes — no auth required (buyers arrive from AppSumo email)
// Launch toggle (2026-07-03): set APPSUMO_PUBLIC=true in .env to open /redeem publicly — config change, not a deploy.
// (This routes file uses closures and is never route:cached, so env() is safe here.)
$hideAppSumoPublic = !env('APPSUMO_PUBLIC', false) && !app()->runningUnitTests();
Route::middleware([\App\Http\Middleware\NoIndexMiddleware::class])->group(function () use ($hideAppSumoPublic) {
    if ($hideAppSumoPublic) {
        Route::get('/redeem',  fn() => abort(404))->name('redeem');
        Route::post('/redeem', fn() => abort(404))->name('redeem.submit');
        Route::get('/what-is-included', fn() => abort(404))->name('what-is-included');
    } else {
        Route::get('/redeem',  [\App\Http\Controllers\AppSumoController::class, 'index'])->name('redeem');
        Route::post('/redeem', [\App\Http\Controllers\AppSumoController::class, 'redeem'])->name('redeem.submit');
        Route::get('/what-is-included', function () {
            return Inertia::render('WhatIsIncluded');
        })->name('what-is-included');
    }
});

// Refund policy is a public trust page regardless of AppSumo launch state (2026-07-03)
Route::get('/refund-policy', function () {
    return Inertia::render('RefundPolicy');
})->name('refund-policy');

// (duplicate /terms and /privacy route registrations removed 2026-07-05 — see the
// single definitions near the top of this file, fixed to render the real components)

// ── Pre-Launch §14: Health Check ─────────────────────────────────────────────
// Public — no auth. Checks DB, Redis, cache, storage, and Horizon queue health.
// Returns HTTP 200 (all ok) or HTTP 503 (any component failing).
// Monitor this with UptimeRobot every 5 minutes.
Route::get('/health', \App\Http\Controllers\HealthController::class)->name('health');


// Image Fallback Route (for Shared Hosting limits)
Route::get('/storage/{path}', function ($path) {
    $filePath = storage_path('app/public/' . $path);
    if (!file_exists($filePath)) {
        \abort(404);
    }
    $mimeType = File::mimeType($filePath);
    return \response()->file($filePath, ['Content-Type' => $mimeType]);
})->where('path', '.*');

// --- INSTALLER ROUTES ---
Route::prefix('installer')->group(function () {
    Route::get('/', [\App\Http\Controllers\InstallerController::class, 'index'])->name('installer.index');
    // API Routes for Installer
});

Route::prefix('api/installer')->middleware(\App\Http\Middleware\InstallerLock::class)->group(function () {
    Route::get('/requirements', [\App\Http\Controllers\InstallerController::class, 'checkRequirements']);
    Route::post('/check-license', [\App\Http\Controllers\InstallerController::class, 'checkLicense']);
    Route::post('/test-db', [\App\Http\Controllers\InstallerController::class, 'testDatabase']);
    Route::post('/run', [\App\Http\Controllers\InstallerController::class, 'install']);
    Route::post('/restart-server', [\App\Http\Controllers\InstallerController::class, 'restartServer']);

    // DIAGNOSTIC ENDPOINT: Visit /api/installer/diagnose in browser to see what's wrong
    Route::get('/diagnose', function () {
        $results = [];

        // 1. Check .env exists and read DB values
        $envPath = base_path('.env');
        $results['env_exists'] = file_exists($envPath);
        if ($results['env_exists']) {
            $envContent = file_get_contents($envPath);
            $envVars = [];
            foreach (explode("\n", $envContent) as $line) {
                $line = trim($line);
                if ($line && !str_starts_with($line, '#') && str_contains($line, '=')) {
                    [$key, $value] = explode('=', $line, 2);
                    $envVars[trim($key)] = trim($value, " \t\n\r\0\x0B\"'");
                }
            }
            $results['db_host'] = $envVars['DB_HOST'] ?? 'NOT SET';
            $results['db_name'] = $envVars['DB_DATABASE'] ?? 'NOT SET';
            $results['db_user'] = $envVars['DB_USERNAME'] ?? 'NOT SET';
            $results['db_pass_set'] = !empty($envVars['DB_PASSWORD']) ? 'YES' : 'NO';
            $results['cache_store'] = $envVars['CACHE_STORE'] ?? 'NOT SET (default from config)';
            $results['session_driver'] = $envVars['SESSION_DRIVER'] ?? 'NOT SET (default from config)';
            $results['app_key_set'] = !empty($envVars['APP_KEY']) ? 'YES' : 'NO';
        }

        // 2. Check runtime config
        $results['runtime_cache_driver'] = config('cache.default');
        $results['runtime_session_driver'] = config('session.driver');
        $results['runtime_db_host'] = config('database.connections.mysql.host');
        $results['runtime_db_name'] = config('database.connections.mysql.database');
        $results['runtime_db_user'] = config('database.connections.mysql.username');

        // 3. Test DB connection
        try {
            \Illuminate\Support\Facades\DB::purge('mysql');
            \Illuminate\Support\Facades\DB::reconnect('mysql');
            \Illuminate\Support\Facades\DB::connection()->getPdo();
            $results['db_connection'] = 'SUCCESS';
            $results['db_version'] = \Illuminate\Support\Facades\DB::connection()->getPdo()->getAttribute(\PDO::ATTR_SERVER_VERSION);
        } catch (\Throwable $e) {
            $results['db_connection'] = 'FAILED: ' . $e->getMessage();
        }

        // 4. Check directories
        $results['storage_writable'] = is_writable(storage_path());
        $results['views_dir_exists'] = is_dir(storage_path('framework/views'));
        $results['cache_dir_exists'] = is_dir(storage_path('framework/cache/data'));
        $results['sessions_dir_exists'] = is_dir(storage_path('framework/sessions'));
        $results['bootstrap_cache_writable'] = is_writable(base_path('bootstrap/cache'));

        // 5. PHP info
        $results['php_version'] = PHP_VERSION;
        $results['max_execution_time'] = ini_get('max_execution_time');
        $results['memory_limit'] = ini_get('memory_limit');

        // 6. Check laravel.log for recent errors
        $logPath = storage_path('logs/laravel.log');
        if (file_exists($logPath)) {
            $logContent = file_get_contents($logPath);
            $results['log_size'] = strlen($logContent) . ' bytes';
            $results['log_tail'] = substr($logContent, -2000); // Last 2000 chars
        } else {
            $results['log_tail'] = 'No log file found';
        }

        return \response()->json($results, 200, [], JSON_PRETTY_PRINT);
    });
});

// CSRF Refresh (Global)
Route::get('/refresh-csrf', [\App\Http\Controllers\CsrfController::class, 'refresh'])->name('csrf.refresh');

// --- UPDATER ROUTES ---
// Page (auth + platform_admin only)
Route::get('/updater', [\App\Http\Controllers\UpdaterController::class, 'index'])
    ->middleware(['auth', \App\Http\Middleware\UpdaterLock::class])
    ->name('updater.index');

// API (auth + platform_admin only, no InstallerLock — app must be installed)
Route::prefix('api/updater')
    ->middleware(['auth', \App\Http\Middleware\UpdaterLock::class])
    ->group(function () {
        Route::get('/info', [\App\Http\Controllers\UpdaterController::class, 'info']);
        Route::post('/run', [\App\Http\Controllers\UpdaterController::class, 'run']);
    });

Route::get('/dashboard', function() {
    /** @var \App\Models\User $user */
    $user = Auth::user();
    if ($user->isPlatformAdmin()) {
        return \redirect()->route('platform.dashboard');
    }
    return \redirect()->route('hub');
})->middleware(['auth', 'verified'])->name('dashboard');

// Error Reporting API
Route::post('/api/report-error', [\App\Http\Controllers\Api\ErrorReporterController::class, 'store'])->name('api.report-error');

// Placeholder for future routes
Route::get('/ping', fn() => \response()->json(['ok' => true]));


// ═══════════════════════════════════════════════════════════
// LEGACY ROUTE MAPPINGS — SEALED 2026-03-07
// ═══════════════════════════════════════════════════════════
Route::middleware([])->group(function () {
    // Stock Legacy Routing
    Route::any('/stock-operations/{any}',    fn() => \redirect('/stock-operations'))->where('any', '.+');
    Route::any('/stock-transfers/{any?}',    [\App\Http\Controllers\StockTransferController::class, 'store'])->where('any', '.*');
    Route::any('/batches',                   fn() => \response()->json(['message' => 'Managed internally by FifoService'], 404));
    Route::any('/serials',                   fn() => \response()->json(['message' => 'Managed internally by FifoService'], 404));

    // Reports are mostly mapped, but let's keep the block for anything that didn't match the specific ones
    Route::any('/reports/{any}',            fn() => \abort(403, 'DEPRECATED: Use /v3/reports/*'))
         ->where('any', '^(?!(dashboard|analytics|p-and-l|balance-sheet|stock-valuation|low-stock|movement-history|expiry|sales|purchases|day-book|profit-loss|party-statement|transactions|expenses|account-ledger|tax|bank-statement|balance-sheet|all-parties|trial-balance|item-wise-profit|party-wise-profit-loss|discount|cash-flow|sale-aging|sale-orders|bill-wise-profit|expense-by-category|expense-by-item|stock-summary-by-category|item-detail|loan-statement|tax-rate|sale-purchase-by-party|item-report-by-party|party-report-by-item|sale-purchase-by-party-group)).*');
});

Route::middleware(['auth', 'verified', 'tenant', 'drm', \App\Http\Middleware\DemoMiddleware::class, \App\Http\Middleware\NoIndexMiddleware::class])
    ->prefix('s/{store_slug}')
    ->group(function () {
        // Compatibility Aliases for POS & AJAX (Resolves Ziggy 'route not found' while keeping URL isolation)
        Route::get('/inventory/search', [InventoryController::class, 'search'])->name('inventory.search');
        Route::get('/customers-search', [\App\Http\Controllers\PartyController::class, 'search'])->name('customers.search');
        Route::get('/api/pos/categories', [\App\Http\Controllers\PosController::class, 'getCategories'])->name('api.categories');
        Route::get('/sales/parked', [\App\Http\Controllers\SaleController::class, 'getParkedSales'])->name('sales.parked');
        Route::get('/sales/parked/{id}', [\App\Http\Controllers\SaleController::class, 'recall'])->name('sales.recall');
        Route::delete('/sales/parked/{id}', [\App\Http\Controllers\SaleController::class, 'deleteParked'])->name('sales.parked.delete');
        Route::post('/sales/park', [\App\Http\Controllers\SaleController::class, 'parkBill'])->name('sales.park');

        Route::name('store.')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/onboarding/step', function ($store_slug) {
        return redirect()->route('store.dashboard', ['store_slug' => $store_slug]);
    });
    Route::post('/onboarding/step', [\App\Http\Controllers\OnboardingController::class, 'updateStep'])->name('onboarding.step');
    Route::get('/home', [\App\Http\Controllers\DashboardController::class, 'home'])->name('home');
    Route::get('/dashboard-v1', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard-v1');

    Route::get('/pos', [\App\Http\Controllers\PosController::class, 'index'])->middleware('permission:pos.checkout')->name('pos');

    // Inventory
    Route::get('/inventory', [InventoryController::class, 'dashboard'])->middleware('permission:inventory.view')->name('inventory.dashboard');
    Route::get('/inventory/list', [InventoryController::class, 'index'])->name('inventory.index');
    Route::get('/inventory/{id}/stats', [InventoryController::class, 'stats'])->name('inventory.stats');
    Route::post('/inventory', [InventoryController::class, 'store'])->name('inventory.store');
    Route::post('/inventory/bulk-destroy', [InventoryController::class, 'bulkDestroy'])->name('inventory.bulk-destroy');
    Route::post('/inventory/check-dependencies', [InventoryController::class, 'checkDependencies'])->name('inventory.check-dependencies');
    Route::get('/inventory/search', [InventoryController::class, 'search'])->name('inventory.search');
    
    Route::get('/inventory/{id}/reservations', [InventoryController::class, 'getReservations'])->name('inventory.reservations');
    Route::get('/inventory/{id}/history', [InventoryController::class, 'getHistory'])->name('inventory.history');
    Route::post('/inventory/{id}', [InventoryController::class, 'update'])->name('inventory.update');
    Route::delete('/inventory/{id}', [InventoryController::class, 'destroy'])->name('inventory.destroy');


    // Stock Operations
    Route::get('/stock-operations', [\App\Http\Controllers\StockOperationsController::class, 'index'])->name('stock-operations');
    Route::post('/stock-operations/transfer', [\App\Http\Controllers\StockOperationsController::class, 'transfer'])->name('stock-operations.transfer');
    Route::post('/stock-operations/adjust', [\App\Http\Controllers\StockOperationsController::class, 'adjust'])->name('stock-operations.adjust');
    Route::post('/stock-operations/audit', [\App\Http\Controllers\StockOperationsController::class, 'audit'])->name('stock-operations.audit');
    Route::post('/stock-operations/warehouse', [\App\Http\Controllers\StockOperationsController::class, 'storeWarehouse'])->name('stock-operations.warehouse.store');
    Route::put('/stock-operations/warehouse/{id}', [\App\Http\Controllers\StockOperationsController::class, 'updateWarehouse'])->name('stock-operations.warehouse.update');


    // Activity Log
    Route::get('/activity-log', [\App\Http\Controllers\ActivityLogController::class, 'index'])->middleware('permission:reports.audit')->name('activity-log.index');

    // Background Sync API (Internal)
    Route::prefix('api')->name('api.')->group(function () {
        Route::get('/sync/users', [\App\Http\Controllers\Api\SyncController::class, 'users'])->name('sync.users');
        Route::get('/sync/products', [\App\Http\Controllers\Api\SyncController::class, 'products'])->name('sync.products');
        Route::get('/sync/customers', [\App\Http\Controllers\Api\SyncController::class, 'customers'])->name('sync.customers');
        Route::get('/sync/suppliers', [\App\Http\Controllers\Api\SyncController::class, 'suppliers'])->name('sync.suppliers');
        Route::get('/sync/inventory', [\App\Http\Controllers\Api\SyncController::class, 'inventory'])->name('sync.inventory');
        Route::get('/sync/taxes', [\App\Http\Controllers\Api\SyncController::class, 'taxes'])->name('sync.taxes');
        Route::post('/sync/orders/batch', [\App\Http\Controllers\Api\SyncController::class, 'batchOrders'])->name('sync.orders.batch');
        Route::post('/heartbeat', [\App\Http\Controllers\Api\HeartbeatController::class, 'store'])->name('heartbeat');
        Route::get('/check-connection', [\App\Http\Controllers\Api\SyncController::class, 'checkConnection'])->name('check-connection');
    });

    // Suppliers

    // Suppliers
    Route::resource('suppliers', \App\Http\Controllers\SupplierController::class)->only(['index'])->middleware(['permission:purchases.view', 'plan.feature:suppliers_directory']);
    Route::resource('suppliers', \App\Http\Controllers\SupplierController::class)->only(['store', 'update', 'destroy'])->middleware(['permission:purchases.suppliers', 'plan.feature:suppliers_directory']);

    // Purchase Orders
    Route::resource('purchase-orders', \App\Http\Controllers\PurchaseOrderController::class)->only(['create', 'store'])->middleware(['permission:purchases.create', 'plan.feature:purchase_orders']);
    Route::resource('purchase-orders', \App\Http\Controllers\PurchaseOrderController::class)->only(['index', 'show'])->middleware(['permission:purchases.view', 'plan.feature:purchase_orders']);
    Route::resource('purchase-orders', \App\Http\Controllers\PurchaseOrderController::class)->only(['edit', 'update'])->middleware(['permission:purchases.edit', 'plan.feature:purchase_orders']);
    Route::resource('purchase-orders', \App\Http\Controllers\PurchaseOrderController::class)->only(['destroy'])->middleware(['permission:purchases.void', 'plan.feature:purchase_orders']);
    Route::post('/purchase-orders/{purchaseOrder}/receive', [\App\Http\Controllers\PurchaseOrderController::class, 'receive'])->middleware(['permission:purchases.edit', 'plan.feature:purchase_orders'])->name('purchase-orders.receive');
    Route::get('/purchase-orders/{purchaseOrder}/print', [\App\Http\Controllers\PurchaseOrderController::class, 'print'])->middleware(['permission:purchases.view', 'plan.feature:purchase_orders'])->name('purchase-orders.print');

    // Proposals
    Route::resource('proposals', \App\Http\Controllers\ProposalController::class)->middleware('plan.feature:b2b_proposal_builder');
    Route::post('/proposals/{proposal}/convert', [\App\Http\Controllers\ProposalController::class, 'convertToSale'])->middleware('plan.feature:b2b_proposal_builder')->name('proposals.convert');
    Route::post('/proposals/{proposal}/convert-to-sale', [\App\Http\Controllers\ProposalController::class, 'convertToSale'])->middleware('plan.feature:b2b_proposal_builder')->name('proposals.convert-to-sale');
    Route::post('/proposals/{proposal}/convert-to-presale', [\App\Http\Controllers\ProposalController::class, 'convertToPreSale'])->middleware('plan.feature:b2b_proposal_builder')->name('proposals.convert-to-presale');
    Route::get('/proposals/{proposal}/print', [\App\Http\Controllers\ProposalController::class, 'print'])->middleware('plan.feature:b2b_proposal_builder')->name('proposals.print');

    // Sales Orders (Pre-orders with Hold)
    Route::resource('sales-orders', \App\Http\Controllers\SalesOrderController::class)->parameters([
        'sales-orders' => 'order'
    ])->middleware('plan.feature:pre_sales_reservation')->except(['edit']);
    Route::post('/sales-orders/{salesOrder}/convert', [\App\Http\Controllers\SalesOrderController::class, 'convertToSale'])->middleware('plan.feature:pre_sales_reservation')->name('sales-orders.convert');
    Route::get('/sales-orders/export/excel', [\App\Http\Controllers\SalesOrderController::class, 'export'])->middleware(['permission:data.export', 'plan.feature:pre_sales_reservation'])->name('sales-orders.export');
    Route::get('/sales-orders/{salesOrder}/print', [\App\Http\Controllers\SalesOrderController::class, 'print'])->middleware('plan.feature:pre_sales_reservation')->name('sales-orders.print');
    Route::post('/sales-orders/{salesOrder}/cancel', [\App\Http\Controllers\SalesOrderController::class, 'cancel'])->middleware('plan.feature:pre_sales_reservation')->name('sales-orders.cancel');

    // Labels
    Route::get('/labels', [\App\Http\Controllers\LabelController::class, 'index'])->middleware('plan.feature:barcode_label_print')->name('labels.index');
    Route::post('/labels/print', [\App\Http\Controllers\LabelController::class, 'print'])->middleware('plan.feature:barcode_label_print')->name('labels.print');

    // Reports
    // Reports
    Route::middleware('permission:reports.summary')->group(function () {
        Route::get('/reports', [\App\Http\Controllers\ReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/daily-sales', [\App\Http\Controllers\ReportController::class, 'dailySales'])->name('reports.daily-sales');
        Route::get('/reports/sales', [\App\Http\Controllers\ReportController::class, 'sales'])->name('reports.sales');
        Route::get('/reports/purchases', [\App\Http\Controllers\ReportController::class, 'purchases'])->middleware('plan.feature:purchase_orders')->name('reports.purchases');
        Route::get('/reports/day-book', [\App\Http\Controllers\ReportController::class, 'dayBook'])->name('reports.day-book');
        Route::get('/reports/profit-loss', [\App\Http\Controllers\ReportController::class, 'profitLoss'])->middleware('plan.feature:report_profit_loss')->name('reports.profit-loss');
        Route::get('/reports/party-statement', [\App\Http\Controllers\ReportController::class, 'partyStatement'])->name('reports.party-statement');
        Route::get('/reports/transactions', [\App\Http\Controllers\ReportController::class, 'transactions'])->name('reports.transactions');
        Route::get('/reports/expenses', [\App\Http\Controllers\ReportController::class, 'expenses'])->middleware('plan.feature:expense_manager')->name('reports.expenses');
        Route::get('/reports/account-ledger', [\App\Http\Controllers\ReportController::class, 'accountLedger'])->middleware('plan.feature:double_entry_ledger')->name('reports.account-ledger');
        Route::get('/reports/tax', [\App\Http\Controllers\ReportController::class, 'tax'])->name('reports.tax');
        Route::get('/reports/bank-statement', [\App\Http\Controllers\ReportController::class, 'bankStatement'])->name('reports.bank-statement');

        // Existing Reports
        Route::get('/reports/stock-valuation', [\App\Http\Controllers\ReportController::class, 'stockValuation'])->name('reports.stock-valuation');
        Route::get('/reports/low-stock', [\App\Http\Controllers\ReportController::class, 'lowStock'])->name('reports.low-stock');
        Route::get('/reports/movement-history', [\App\Http\Controllers\ReportController::class, 'movementHistory'])->name('reports.movement-history');
        Route::get('/reports/expiry', [\App\Http\Controllers\ReportController::class, 'expiryReport'])->name('reports.expiry');

        // Additional 24 Reports (completing 38 total)
        Route::get('/reports/balance-sheet', [\App\Http\Controllers\ReportController::class, 'balanceSheet'])->middleware('plan.feature:report_profit_loss')->name('reports.balance-sheet');
        Route::get('/reports/all-parties', [\App\Http\Controllers\ReportController::class, 'allParties'])->middleware('plan.feature:customer_khata')->name('reports.all-parties');
        Route::get('/reports/trial-balance', [\App\Http\Controllers\ReportController::class, 'trialBalance'])->middleware('plan.feature:report_trial_balance')->name('reports.trial-balance');
        Route::get('/reports/item-wise-profit', [\App\Http\Controllers\ReportController::class, 'itemWiseProfit'])->middleware('plan.feature:report_profit_loss')->name('reports.item-wise-profit');
        Route::get('/reports/party-wise-profit-loss', [\App\Http\Controllers\ReportController::class, 'partyWiseProfitLoss'])->middleware('plan.feature:report_profit_loss')->name('reports.party-wise-profit-loss');
        Route::get('/reports/discount', [\App\Http\Controllers\ReportController::class, 'discountReport'])->middleware('plan.feature:discount_report')->name('reports.discount');
        Route::get('/reports/cash-flow', [\App\Http\Controllers\ReportController::class, 'cashFlow'])->middleware('plan.feature:cash_flow_report')->name('reports.cash-flow');
        Route::get('/reports/sale-aging', [\App\Http\Controllers\ReportController::class, 'saleAging'])->middleware('plan.feature:aged_receivables')->name('reports.sale-aging');
        Route::get('/reports/sale-orders', [\App\Http\Controllers\ReportController::class, 'saleOrders'])->middleware('plan.feature:pre_sales_reservation')->name('reports.sale-orders');
        Route::get('/reports/bill-wise-profit', [\App\Http\Controllers\ReportController::class, 'billWiseProfit'])->middleware('plan.feature:report_profit_loss')->name('reports.bill-wise-profit');
        Route::get('/reports/expense-by-category', [\App\Http\Controllers\ReportController::class, 'expenseByCategory'])->middleware('plan.feature:expense_manager')->name('reports.expense-by-category');
        Route::get('/reports/expense-by-item', [\App\Http\Controllers\ReportController::class, 'expenseByItem'])->middleware('plan.feature:expense_manager')->name('reports.expense-by-item');
        Route::get('/reports/stock-summary-by-category', [\App\Http\Controllers\ReportController::class, 'stockSummaryByCategory'])->middleware('plan.feature:stock_valuation')->name('reports.stock-summary-by-category');
        Route::get('/reports/item-detail', [\App\Http\Controllers\ReportController::class, 'itemDetailReport'])->middleware('plan.feature:stock_valuation')->name('reports.item-detail');
        Route::get('/reports/loan-statement', [\App\Http\Controllers\ReportController::class, 'loanStatement'])->middleware('plan.feature:double_entry_ledger')->name('reports.loan-statement');
        Route::get('/reports/tax-rate', [\App\Http\Controllers\ReportController::class, 'taxRateReport'])->middleware('plan.feature:auto_vat_gst')->name('reports.tax-rate');
        Route::get('/reports/sale-purchase-by-party', [\App\Http\Controllers\ReportController::class, 'salePurchaseByParty'])->middleware('plan.feature:report_party_statement')->name('reports.sale-purchase-by-party');
        Route::get('/reports/item-report-by-party', [\App\Http\Controllers\ReportController::class, 'itemReportByParty'])->middleware('plan.feature:report_party_statement')->name('reports.item-report-by-party');
        Route::get('/reports/party-report-by-item', [\App\Http\Controllers\ReportController::class, 'partyReportByItem'])->middleware('plan.feature:report_party_statement')->name('reports.party-report-by-item');
        Route::get('/reports/sale-purchase-by-item-category', [\App\Http\Controllers\ReportController::class, 'salePurchaseByItemCategory'])->middleware('plan.feature:report_profit_loss')->name('reports.sale-purchase-by-item-category');
        Route::get('/reports/item-category-wise-profit-loss', [\App\Http\Controllers\ReportController::class, 'itemCategoryWiseProfitLoss'])->middleware('plan.feature:report_profit_loss')->name('reports.item-category-wise-profit-loss');
        Route::get('/reports/item-wise-discount', [\App\Http\Controllers\ReportController::class, 'itemWiseDiscount'])->middleware('plan.feature:discount_report')->name('reports.item-wise-discount');
        Route::get('/reports/sale-order-items', [\App\Http\Controllers\ReportController::class, 'saleOrderItems'])->middleware('plan.feature:pre_sales_reservation')->name('reports.sale-order-items');
        Route::get('/reports/stock-aging', [\App\Http\Controllers\ReportController::class, 'stockAging'])->middleware('plan.feature:stock_aging')->name('reports.stock-aging');
        Route::get('/reports/sale-purchase-by-party-group', [\App\Http\Controllers\ReportController::class, 'salePurchaseByPartyGroup'])->middleware('plan.feature:report_party_statement')->name('reports.sale-purchase-by-party-group');
        Route::get('/reports/analytics', [\App\Http\Controllers\ReportController::class, 'analytics'])->name('reports.analytics');

        // New reports: Point-In-Time Inventory, Customer Insights, Supplier Insights
        Route::get('/reports/point-in-time-inventory', [\App\Http\Controllers\ReportController::class, 'pointInTimeInventory'])->middleware('plan.feature:point_in_time_inventory')->name('reports.point-in-time-inventory');
        Route::get('/reports/point-in-time-inventory/details', [\App\Http\Controllers\ReportController::class, 'pointInTimeInventoryDetails'])->middleware('plan.feature:point_in_time_inventory')->name('reports.point-in-time-inventory.details');
        Route::get('/reports/customer-insights', [\App\Http\Controllers\ReportController::class, 'customerInsights'])->middleware('plan.feature:customer_insights')->name('reports.customer-insights');
        Route::get('/reports/customer-insights/details', [\App\Http\Controllers\ReportController::class, 'customerInsightsDetails'])->middleware('plan.feature:customer_insights')->name('reports.customer-insights.details');
        Route::get('/reports/supplier-insights', [\App\Http\Controllers\ReportController::class, 'supplierInsights'])->middleware('plan.feature:supplier_insights')->name('reports.supplier-insights');
        Route::get('/reports/supplier-insights/details', [\App\Http\Controllers\ReportController::class, 'supplierInsightsDetails'])->middleware('plan.feature:supplier_insights')->name('reports.supplier-insights.details');

        // Owner's Daily Pulse (Secure Vault Dashboard)
        Route::get('/reports/owner-daily-pulse', [\App\Http\Controllers\OwnerDailyPulseController::class, 'index'])->middleware('plan.feature:owners_daily_pulse')->name('reports.owner-daily-pulse');
        Route::post('/reports/owner-daily-pulse/verify', [\App\Http\Controllers\OwnerDailyPulseController::class, 'verifyPasscode'])->name('reports.owner-daily-pulse.verify');
        Route::post('/reports/owner-daily-pulse/setup', [\App\Http\Controllers\OwnerDailyPulseController::class, 'setup'])->name('reports.owner-daily-pulse.setup');
        Route::post('/reports/owner-daily-pulse/lock', [\App\Http\Controllers\OwnerDailyPulseController::class, 'lock'])->name('reports.owner-daily-pulse.lock');
        Route::post('/reports/owner-daily-pulse/note', [\App\Http\Controllers\OwnerDailyPulseController::class, 'saveNote'])->name('reports.owner-daily-pulse.note');
    });

    // Cookbook
    Route::get('/cookbook', [\App\Http\Controllers\CookbookController::class, 'index'])->middleware('plan.feature:recipes')->name('cookbook.index');
    Route::get('/cookbook/create', [\App\Http\Controllers\CookbookController::class, 'create'])->middleware('plan.feature:recipes')->name('cookbook.create');
    Route::post('/cookbook', [\App\Http\Controllers\CookbookController::class, 'store'])->middleware('plan.feature:recipes')->name('cookbook.store');
    Route::get('/cookbook/{id}/edit', [\App\Http\Controllers\CookbookController::class, 'edit'])->middleware('plan.feature:recipes')->name('cookbook.edit');
    Route::put('/cookbook/{id}', [\App\Http\Controllers\CookbookController::class, 'update'])->middleware('plan.feature:recipes')->name('cookbook.update');
    Route::delete('/cookbook/{id}', [\App\Http\Controllers\CookbookController::class, 'destroy'])->middleware('plan.feature:recipes')->name('cookbook.destroy');
    Route::post('/cookbook/simulate', [\App\Http\Controllers\CookbookController::class, 'simulate'])->middleware('plan.feature:recipes')->name('cookbook.simulate');

    // growth-engine
    Route::middleware(['permission:reports.summary', 'plan.feature:growth_engine'])->group(function () {
        Route::get('/growth-engine', [\App\Http\Controllers\GrowthEngineController::class, 'index'])->name('growth-engine.index');
        Route::post('/growth-engine/refresh', [\App\Http\Controllers\GrowthEngineController::class, 'refresh'])->name('growth-engine.refresh');
        Route::get('/growth-engine/dashboard', [\App\Http\Controllers\GrowthEngineController::class, 'dashboard'])->name('growth-engine.dashboard');
        Route::get('/growth-engine/whatsapp/{id}', [\App\Http\Controllers\GrowthEngineController::class, 'generateWhatsApp'])->name('growth-engine.whatsapp');
        Route::post('/growth-engine/dismiss/{id}', [\App\Http\Controllers\GrowthEngineController::class, 'dismiss'])->name('growth-engine.dismiss');
        Route::post('/growth-engine/mark-read/{id}', [\App\Http\Controllers\GrowthEngineController::class, 'markRead'])->name('growth-engine.mark-read');

        Route::get('/growth-engine/signal/{id}', [\App\Http\Controllers\GrowthEngineController::class, 'show'])->name('growth-engine.show');
        Route::post('/growth-engine/act/{id}', [\App\Http\Controllers\GrowthEngineController::class, 'act'])->name('growth-engine.act');
        Route::post('/growth-engine/snooze/{id}', [\App\Http\Controllers\GrowthEngineController::class, 'snooze'])->name('growth-engine.snooze');
        Route::get('/growth-engine/scorecard', [\App\Http\Controllers\GrowthEngineController::class, 'scorecard'])->name('growth-engine.scorecard');
        Route::post('/growth-engine/unmute', [\App\Http\Controllers\GrowthEngineController::class, 'unmute'])->name('growth-engine.unmute');
        Route::get('/growth-engine/settings', [\App\Http\Controllers\GrowthEngineController::class, 'settings'])->name('growth-engine.settings');
        Route::post('/growth-engine/settings', [\App\Http\Controllers\GrowthEngineController::class, 'updateSettings'])->name('growth-engine.update-settings');
    });

    // Global Search
    Route::get('/global-search', [\App\Http\Controllers\SearchController::class, 'search'])->name('global.search');
    // AI Query
    Route::get('/ai/query', [\App\Http\Controllers\AiController::class, 'query'])->name('ai.query');
    Route::post('/ai/test-connection', [\App\Http\Controllers\AiController::class, 'testConnection'])->name('ai.test');
    Route::get('/ai/recommendations', [\App\Http\Controllers\AiController::class, 'recommendations'])->name('ai.recommendations');
    Route::get('/ai/smart-reorder', [\App\Http\Controllers\AiController::class, 'smartReorder'])->name('ai.smart-reorder');
    Route::get('/ai/cash-flow-forecast', [\App\Http\Controllers\AiController::class, 'cashFlowForecast'])->name('ai.cash-flow-forecast');



    // Variants
    Route::get('/products/{product}/variants', [\App\Http\Controllers\ProductVariantController::class, 'index'])->middleware('permission:inventory.view')->name('products.variants.index');
    Route::post('/products/{product}/variants', [\App\Http\Controllers\ProductVariantController::class, 'store'])->middleware('permission:inventory.create')->name('products.variants.store');
    Route::put('/variants/{variant}', [\App\Http\Controllers\ProductVariantController::class, 'update'])->middleware('permission:inventory.edit')->name('variants.update');
    Route::delete('/variants/{variant}', [\App\Http\Controllers\ProductVariantController::class, 'destroy'])->middleware('permission:inventory.delete')->name('variants.destroy');

    // Attributes
    Route::get('/attributes', [ProductAttributeController::class, 'index'])->middleware('permission:inventory.view')->name('attributes.index');
    Route::post('/attributes', [ProductAttributeController::class, 'store'])->middleware('permission:inventory.create')->name('attributes.store');
    Route::put('/attributes/{attribute}', [ProductAttributeController::class, 'update'])->middleware('permission:inventory.edit')->name('attributes.update');
    Route::delete('/attributes/{attribute}', [ProductAttributeController::class, 'destroy'])->middleware('permission:inventory.delete')->name('attributes.destroy');

    // Categories (Phase 1 - Unification)
    Route::get('/inventory/categories', [InventoryController::class, 'categories'])->middleware('permission:inventory.view')->name('categories.index');
    Route::post('/categories', [InventoryController::class, 'storeCategory'])->middleware('permission:inventory.create')->name('categories.store');
    Route::put('/categories/{category}', [InventoryController::class, 'updateCategory'])->middleware('permission:inventory.edit')->name('categories.update');
    Route::delete('/categories/{category}', [InventoryController::class, 'destroyCategory'])->middleware('permission:inventory.delete')->name('categories.destroy');

    // Stock Levels
    Route::get('/inventory/stock-levels', [InventoryController::class, 'stockLevels'])->name('inventory.stock-levels');

    // Bank Accounts (Phase 1 - Unification)
    Route::get('/bank-accounts', [FinanceController::class, 'bankAccounts'])->name('bank-accounts.index');
    Route::post('/bank-accounts', [FinanceController::class, 'storeBankAccount'])->name('bank-accounts.store');
    Route::put('/bank-accounts/{bankAccount}', [FinanceController::class, 'updateBankAccount'])->name('bank-accounts.update');
    Route::delete('/bank-accounts/{bankAccount}', [FinanceController::class, 'destroyBankAccount'])->name('bank-accounts.destroy');
    Route::get('/bank-accounts/{bankAccount}/transactions', [FinanceController::class, 'bankAccountTransactions'])->name('bank-accounts.transactions');

    // ============================================
    // PHASE 2 - Party & Transaction Management
    // ============================================

    // Parties (Customers/Suppliers unified)
    Route::get('/parties', [\App\Http\Controllers\PartyController::class, 'index'])->middleware('permission:sales.create,purchases.suppliers')->name('parties.index');
    Route::post('/parties', [\App\Http\Controllers\PartyController::class, 'store'])->middleware('permission:sales.create,purchases.suppliers')->name('parties.store');
    Route::put('/parties/{party}', [\App\Http\Controllers\PartyController::class, 'update'])->middleware('permission:sales.create,purchases.suppliers')->name('parties.update');
    Route::delete('/parties/{party}', [\App\Http\Controllers\PartyController::class, 'destroy'])->middleware('permission:sales.create,purchases.suppliers')->name('parties.destroy');
    Route::delete('/parties', [\App\Http\Controllers\PartyController::class, 'bulkDestroy'])->middleware('permission:sales.create,purchases.suppliers')->name('parties.bulk-destroy');
    Route::get('/parties/ledgers', [\App\Http\Controllers\PartyController::class, 'index'])->name('parties.ledgers');
    Route::get('/parties/{party}/ledger', [\App\Http\Controllers\PartyController::class, 'ledger'])->name('parties.ledger');
    Route::get('/parties/{party}', fn($party) => redirect()->route('store.parties.ledger', ['store_slug' => app('current.tenant')->slug, 'party' => $party]))->name('parties.show');

    // Expenses
    // Expenses
    Route::get('/expenses', [\App\Http\Controllers\ExpenseController::class, 'index'])->middleware('permission:finance.expenses')->name('expenses.index');
    Route::post('/expenses', [\App\Http\Controllers\ExpenseController::class, 'store'])->name('expenses.store');
    Route::post('/expenses/category', [\App\Http\Controllers\ExpenseController::class, 'storeCategory'])->name('expenses.category.store');
    Route::put('/expenses/{expense}', [\App\Http\Controllers\ExpenseController::class, 'update'])->name('expenses.update');
    Route::delete('/expenses/{expense}', [\App\Http\Controllers\ExpenseController::class, 'destroy'])->name('expenses.destroy');

    // ─── VenSynQ — Multi-Channel Fulfillment Engine ───────────────────────────
    Route::prefix('vensynq')->name('vensynq.')
        ->middleware(\App\Http\Middleware\EnsureVenSynQAccess::class)
        ->group(function () {
        // Command Center Dashboard
        Route::get('/', [\App\Http\Controllers\VenSynQController::class, 'index'])->name('index');

        // Channel Management (CRUD)
        Route::post('/channels', [\App\Http\Controllers\VenSynQController::class, 'storeChannel'])->name('channels.store');
        Route::patch('/channels/{channel}', [\App\Http\Controllers\VenSynQController::class, 'updateChannel'])->name('channels.update');
        Route::delete('/channels/{channel}', [\App\Http\Controllers\VenSynQController::class, 'destroyChannel'])->name('channels.destroy');

        // Order Processing
        Route::post('/preview', [\App\Http\Controllers\VenSynQController::class, 'previewOrder'])->name('preview');
        Route::post('/process', [\App\Http\Controllers\VenSynQController::class, 'processOrder'])->name('process');

        // Dispatch & Tracking
        Route::post('/sync-tracking', [\App\Http\Controllers\VenSynQController::class, 'syncTracking'])->name('sync-tracking');

        // JIT Draft Approval
        Route::patch('/jit-drafts/{purchase}/approve', [\App\Http\Controllers\VenSynQController::class, 'approveJitDraft'])->name('jit.approve');

        // VenSynQ Settings
        Route::get('/settings', [\App\Http\Controllers\VenSynQController::class, 'settings'])->name('settings');

        // OAuth Connections & Handshakes
        Route::get('/connect/{platform}', [\App\Http\Controllers\VenSynQController::class, 'connectChannel'])->name('connect');
        Route::get('/callback/{platform}', [\App\Http\Controllers\VenSynQController::class, 'callbackChannel'])->name('callback');
        Route::delete('/channels/{channel}/disconnect', [\App\Http\Controllers\VenSynQController::class, 'disconnectChannel'])->name('channels.disconnect');

        // Live Order Fetch Sync
        Route::post('/sync-orders', [\App\Http\Controllers\VenSynQController::class, 'fetchLiveOrders'])->name('sync-orders');

        // ── T16: Amazon SP-API 3-Step Credential Wizard ───────────────────────
        // Kept alongside the OAuth redirect above, not replacing it — sellers with
        // self-authorized apps hold LWA credentials directly and never see a
        // consent screen.
        Route::post('/amazon/test-credentials', [\App\Http\Controllers\VenSynQController::class, 'testAmazonCredentials'])->middleware('permission:vensynq.manage')->name('amazon.test');
        Route::post('/amazon/credentials', [\App\Http\Controllers\VenSynQController::class, 'storeAmazonCredentials'])->middleware('permission:vensynq.manage')->name('amazon.store');

        // ── T16: Health, Error Inspector & Retry ──────────────────────────────
        Route::get('/health', [\App\Http\Controllers\VenSynQController::class, 'healthStatus'])->name('health');
        Route::post('/channels/{channel}/test', [\App\Http\Controllers\VenSynQController::class, 'testChannelConnection'])->middleware('permission:vensynq.manage')->name('channels.test');
        Route::post('/channels/{channel}/retry', [\App\Http\Controllers\VenSynQController::class, 'retryChannelSync'])->middleware('permission:vensynq.manage')->name('channels.retry');

        // ── T17: Marketplace Clearing / Money Pipeline ────────────────────────
        // Online sales are held in 1205 Marketplace Clearing until the owner
        // confirms the platform actually paid out. See MarketplaceSettlementService.
        Route::get('/money-pipeline', [\App\Http\Controllers\VenSynQController::class, 'moneyPipeline'])->name('money-pipeline');
        Route::get('/payouts', [\App\Http\Controllers\VenSynQController::class, 'payouts'])->name('payouts');
        Route::post('/payouts/{payout}/confirm', [\App\Http\Controllers\VenSynQController::class, 'confirmPayout'])->middleware('permission:vensynq.manage')->name('payouts.confirm');
        Route::post('/clearing/toggle', [\App\Http\Controllers\VenSynQController::class, 'enableClearing'])->middleware('permission:vensynq.manage')->name('clearing.toggle');
    });

    // Phase 7 Growth: AI Product Descriptions & Listing Image Processing
    Route::post('/products/ai-descriptions/generate', [\App\Http\Controllers\ProductDescriptionController::class, 'generate'])->name('products.ai-descriptions.generate');
    Route::post('/products/ai-descriptions/apply', [\App\Http\Controllers\ProductDescriptionController::class, 'apply'])->name('products.ai-descriptions.apply');
    Route::post('/listing-images/process', [\App\Http\Controllers\ListingImageController::class, 'process'])->name('listing-images.process');

    // Payments
    // Payments
    Route::get('/payments', [\App\Http\Controllers\PaymentController::class, 'index'])->middleware('permission:finance.transactions')->name('payments.index');
    Route::get('/payments/in', [\App\Http\Controllers\PaymentController::class, 'createIn'])->name('payments.in');
    Route::get('/payments/out', [\App\Http\Controllers\PaymentController::class, 'createOut'])->name('payments.out');
    Route::post('/payments', [\App\Http\Controllers\PaymentController::class, 'store'])->name('payments.store');
    Route::get('/payments/{payment}', [\App\Http\Controllers\PaymentController::class, 'show'])->name('payments.show');

    // Purchases
    Route::get('/purchases', [\App\Http\Controllers\PurchaseController::class, 'index'])->name('purchases.index');
    Route::get('/purchases/create', [\App\Http\Controllers\PurchaseController::class, 'create'])->name('purchases.create');
    Route::post('/purchases', [\App\Http\Controllers\PurchaseController::class, 'store'])->name('purchases.store');
    Route::get('/purchases/{purchase}', [\App\Http\Controllers\PurchaseController::class, 'show'])->name('purchases.show');
    Route::get('/purchases/{purchase}/edit', [\App\Http\Controllers\PurchaseController::class, 'edit'])->name('purchases.edit');
    Route::put('/purchases/{purchase}', [\App\Http\Controllers\PurchaseController::class, 'update'])->name('purchases.update');
    Route::delete('/purchases/{purchase}', [\App\Http\Controllers\PurchaseController::class, 'destroy'])->name('purchases.destroy');
    Route::get('/purchases/{purchase}/receive', [\App\Http\Controllers\PurchaseController::class, 'receive'])->name('purchases.receive');

    // All Transactions
    Route::get('/transactions', [\App\Http\Controllers\TransactionController::class, 'index'])->name('transactions.index');

    // ============================================
    // PHASE 3 - Enhanced Inventory & Orders
    // ============================================

    // Stock Levels
    Route::get('/inventory/stock', [InventoryController::class, 'stockLevels'])->name('inventory.stock');

    // Sales Orders
    Route::get('/sales/pre-sales', [\App\Http\Controllers\SalesOrderController::class, 'index'])->name('pre-sales.index');
    Route::get('/sales/pre-sales/create', [\App\Http\Controllers\SalesOrderController::class, 'create'])->name('pre-sales.create');
    Route::post('/sales/pre-sales', [\App\Http\Controllers\SalesOrderController::class, 'store'])->name('pre-sales.store');
    Route::get('/sales/pre-sales/export/excel', [\App\Http\Controllers\SalesOrderController::class, 'export'])->middleware('permission:data.export')->name('pre-sales.export');
    Route::get('/sales/orders/{order}', [\App\Http\Controllers\SalesOrderController::class, 'show'])->name('sales.orders.show');
    Route::put('/sales/orders/{order}', [\App\Http\Controllers\SalesOrderController::class, 'update'])->name('sales.orders.update');
    Route::post('/sales/pre-sales/{salesOrder}/convert', [\App\Http\Controllers\SalesOrderController::class, 'convertToSale'])->name('pre-sales.convert');
    Route::delete('/sales/pre-sales/{order}', [\App\Http\Controllers\SalesOrderController::class, 'destroy'])->name('pre-sales.destroy');


    // Production Runs
    Route::get('/inventory/production', [\App\Http\Controllers\ProductionController::class, 'index'])->middleware('plan.feature:production')->name('production.index');
    Route::get('/inventory/production/create', [\App\Http\Controllers\ProductionController::class, 'create'])->middleware('plan.feature:production')->name('production.create');
    Route::post('/inventory/production', [\App\Http\Controllers\V3\ProductionRunController::class, 'store'])->middleware('plan.feature:production')->name('production.store');
    Route::get('/inventory/production/{run}', [\App\Http\Controllers\ProductionController::class, 'show'])->middleware('plan.feature:production')->name('production.show');
    Route::post('/inventory/production/{run}/complete', [\App\Http\Controllers\V3\ProductionRunController::class, 'complete'])->middleware('plan.feature:production')->name('production.complete');

    // Fund Management (Owner Capital, Transfers, Adjustments)
    Route::get('/funds', [FundController::class, 'index'])->middleware(['permission:finance.balances', 'plan.feature:fund_management'])->name('funds.index');
    Route::post('/funds/add', [FundController::class, 'addFunds'])->middleware('plan.feature:fund_management')->name('funds.add');
    Route::post('/funds/remove', [FundController::class, 'removeFunds'])->middleware('plan.feature:fund_management')->name('funds.remove');
    Route::post('/funds/transfer', [FundController::class, 'transfer'])->middleware('plan.feature:fund_management')->name('funds.transfer');
    Route::post('/funds/adjust', [FundController::class, 'adjust'])->middleware('plan.feature:fund_management')->name('funds.adjust');

    // Accounting Routes
    Route::get('/accounting', [\App\Http\Controllers\AccountingController::class, 'dashboard'])->middleware('plan.feature:double_entry_ledger')->name('accounting.dashboard');
    Route::get('/accounting/chart', [\App\Http\Controllers\AccountingController::class, 'index'])->middleware('plan.feature:double_entry_ledger')->name('accounting.index');
    Route::get('/accounting/p-and-l', [\App\Http\Controllers\AccountingController::class, 'profitAndLoss'])->middleware('plan.feature:report_profit_loss')->name('accounting.pnl');
    Route::get('/accounting/balance-sheet', [\App\Http\Controllers\AccountingController::class, 'balanceSheet'])->middleware('plan.feature:report_profit_loss')->name('accounting.balance-sheet');

    // Recurring Invoices
    Route::get('/recurring-invoices', [\App\Http\Controllers\RecurringInvoiceController::class, 'index'])->middleware('plan.feature:recurring_invoices')->name('recurring-invoices.index');
    Route::get('/recurring-invoices/create', [\App\Http\Controllers\RecurringInvoiceController::class, 'create'])->middleware('plan.feature:recurring_invoices')->name('recurring-invoices.create');
    Route::post('/recurring-invoices', [\App\Http\Controllers\RecurringInvoiceController::class, 'store'])->middleware('plan.feature:recurring_invoices')->name('recurring-invoices.store');
    Route::get('/recurring-invoices/{id}/edit', [\App\Http\Controllers\RecurringInvoiceController::class, 'edit'])->middleware('plan.feature:recurring_invoices')->name('recurring-invoices.edit');
    Route::put('/recurring-invoices/{id}', [\App\Http\Controllers\RecurringInvoiceController::class, 'update'])->middleware('plan.feature:recurring_invoices')->name('recurring-invoices.update');
    Route::post('/recurring-invoices/{id}/toggle', [\App\Http\Controllers\RecurringInvoiceController::class, 'toggle'])->middleware('plan.feature:recurring_invoices')->name('recurring-invoices.toggle');
    Route::delete('/recurring-invoices/{id}', [\App\Http\Controllers\RecurringInvoiceController::class, 'destroy'])->middleware('plan.feature:recurring_invoices')->name('recurring-invoices.destroy');

    // Stock Transfers
    Route::get('/stock-transfers', [\App\Http\Controllers\StockTransferController::class, 'index'])->middleware(['permission:inventory.transfer', 'plan.feature:multi_branch'])->name('stock-transfers.index');
    Route::get('/stock-transfers/create', [\App\Http\Controllers\StockTransferController::class, 'create'])->middleware(['permission:inventory.transfer', 'plan.feature:multi_branch'])->name('stock-transfers.create');
    Route::post('/stock-transfers', [\App\Http\Controllers\StockTransferController::class, 'store'])->middleware(['permission:inventory.transfer', 'plan.feature:multi_branch'])->name('stock-transfers.store');
    Route::get('/stock-transfers/{id}', [\App\Http\Controllers\StockTransferController::class, 'show'])->middleware(['permission:inventory.transfer', 'plan.feature:multi_branch'])->name('stock-transfers.show');

    // Debit Notes
    Route::get('/debit-notes', [\App\Http\Controllers\DebitNoteController::class, 'index'])->middleware('plan.feature:debit_credit_notes')->name('debit-notes.index');
    Route::get('/debit-notes/create', [\App\Http\Controllers\DebitNoteController::class, 'create'])->middleware('plan.feature:debit_credit_notes')->name('debit-notes.create');
    Route::post('/debit-notes', [\App\Http\Controllers\DebitNoteController::class, 'store'])->middleware('plan.feature:debit_credit_notes')->name('debit-notes.store');
    Route::get('/debit-notes/{id}', [\App\Http\Controllers\DebitNoteController::class, 'show'])->middleware('plan.feature:debit_credit_notes')->name('debit-notes.show');

    // Bank Reconciliation
    Route::get('/bank-reconciliation', [\App\Http\Controllers\BankReconciliationController::class, 'index'])->middleware('plan.feature:bank_reconciliation')->name('bank-reconciliation.index');
    Route::post('/bank-reconciliation/import', [\App\Http\Controllers\BankReconciliationController::class, 'import'])->middleware('plan.feature:bank_reconciliation')->name('bank-reconciliation.import');

    // Invoice Reminders
    Route::get('/invoice-reminders', [\App\Http\Controllers\InvoiceReminderController::class, 'index'])->middleware('plan.feature:invoice_reminders')->name('invoice-reminders.index');
    Route::get('/invoice-reminders/create', [\App\Http\Controllers\InvoiceReminderController::class, 'create'])->middleware('plan.feature:invoice_reminders')->name('invoice-reminders.create');
    Route::post('/invoice-reminders', [\App\Http\Controllers\InvoiceReminderController::class, 'store'])->middleware('plan.feature:invoice_reminders')->name('invoice-reminders.store');
    Route::post('/invoice-reminders/{id}/send', [\App\Http\Controllers\InvoiceReminderController::class, 'send'])->middleware('plan.feature:invoice_reminders')->name('invoice-reminders.send');

    // Marketing Campaigns
    Route::get('/marketing/campaigns', [\App\Http\Controllers\MarketingCampaignController::class, 'index'])->middleware('plan.feature:marketing_campaigns')->name('marketing-campaigns.index');
    Route::get('/marketing/campaigns/create', [\App\Http\Controllers\MarketingCampaignController::class, 'create'])->middleware('plan.feature:marketing_campaigns')->name('marketing-campaigns.create');
    Route::post('/marketing/campaigns', [\App\Http\Controllers\MarketingCampaignController::class, 'store'])->middleware('plan.feature:marketing_campaigns')->name('marketing-campaigns.store');

    // WooCommerce Sync
    Route::get('/woocommerce-sync', fn() => redirect()->route('store.woo.connections.index', ['store_slug' => request()->route('store_slug') ?? request()->segment(2)]))
        ->middleware('plan.feature:woocommerce')
        ->name('woocommerce.index');
    Route::prefix('woo')->name('woo.')->middleware('plan.feature:woocommerce')->group(function () {
        Route::get('/connections/{connection}/download', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'downloadPlugin'])->name('plugin.download');
        Route::get('/connections', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'index'])->name('connections.index');
        Route::post('/connections', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'store'])->name('connections.store');
        Route::get('/connections/{connection}/setup', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'setup'])->name('connections.setup');
        Route::get('/connections/{connection}/status', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'statusJson'])->name('connections.status-json');
        Route::put('/connections/{connection}/settings', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'updateSettings'])->name('connections.settings');
        Route::delete('/connections/{connection}', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'destroy'])->name('connections.destroy');
        Route::get('/connections/{connection}/sync', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'syncPage'])->name('connections.sync');
        Route::post('/connections/{connection}/approve', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'approveSync'])->name('connections.approve');
        Route::post('/connections/{connection}/push', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'forcePush'])->name('connections.push');
        Route::post('/connections/{connection}/pull', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'forcePull'])->name('connections.pull');
        Route::post('/connections/{connection}/scan', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'scanCatalog'])->name('connections.scan');
        Route::post('/connections/{connection}/resolve', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'resolveConflict'])->name('connections.resolve');
        Route::post('/connections/{connection}/ignore', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'ignore'])->name('connections.ignore');
        Route::get('/connections/{connection}/logs', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'logs'])->name('connections.logs');
    });

    // E-Invoicing
    Route::get('/e-invoicing', [\App\Http\Controllers\EInvoicingController::class, 'index'])->middleware('plan.feature:e_invoicing')->name('e-invoicing.index');
    Route::post('/e-invoicing/generate', [\App\Http\Controllers\EInvoicingController::class, 'generate'])->middleware('plan.feature:e_invoicing')->name('e-invoicing.generate');
    Route::post('/e-invoicing/waybill', [\App\Http\Controllers\EInvoicingController::class, 'generateWaybill'])->middleware('plan.feature:e_invoicing')->name('e-invoicing.waybill');

    // Parked Sales
    Route::get('/sales/parked-items', [\App\Http\Controllers\ParkedSaleController::class, 'index'])->name('parked-sales.index');
    Route::delete('/sales/parked-items/{sale}', [\App\Http\Controllers\ParkedSaleController::class, 'destroy'])->name('parked-sales.destroy');

    // Enhanced Purchase Receive
    Route::post('/purchases/{purchase}/receive', [\App\Http\Controllers\PurchaseController::class, 'storeReceive'])->name('purchases.receive.store');

    // Customers
    Route::resource('customers', \App\Http\Controllers\CustomerController::class)->except(['show', 'edit']);
    // Customers & Suppliers Search
    Route::get('/customers-search', [\App\Http\Controllers\PartyController::class, 'search'])->name('customers.search');
    Route::get('/suppliers-search', [\App\Http\Controllers\PartyController::class, 'search'])->name('suppliers.search');
    Route::get('/parties-search',   [\App\Http\Controllers\PartyController::class, 'search'])->name('parties.search');

    // Sales
    Route::get('/sales', [\App\Http\Controllers\SaleController::class, 'dashboard'])->middleware('permission:sales.view')->name('sales.dashboard');
    Route::get('/sales/list', [\App\Http\Controllers\SaleController::class, 'index'])->middleware('permission:sales.view')->name('sales.index');
    Route::get('/reports/analytics', [\App\Http\Controllers\ReportController::class, 'graphAnalytics'])->name('reports.analytics');
    Route::get('/sales/export', [\App\Http\Controllers\SaleController::class, 'export'])->middleware('permission:data.export')->name('sales.export');
    Route::post('/sales', [\App\Http\Controllers\SaleController::class, 'store'])->middleware(\App\Http\Middleware\EnforceTransactionLimit::class)->name('sales.store');
    Route::get('/attendance/status', [\App\Http\Controllers\AttendanceController::class, 'status'])->name('attendance.status');
    Route::post('/attendance/check-in', [\App\Http\Controllers\AttendanceController::class, 'checkIn'])->name('attendance.check-in');
    Route::post('/attendance/heartbeat', [\App\Http\Controllers\AttendanceController::class, 'heartbeat'])->name('attendance.heartbeat');
    Route::post('/attendance/check-out', [\App\Http\Controllers\AttendanceController::class, 'checkOut'])->name('attendance.check-out');
    Route::post('/attendance/log-gap', [\App\Http\Controllers\AttendanceController::class, 'logGap'])->name('attendance.log-gap');

    Route::get('/sales/{sale}/print', [\App\Http\Controllers\SaleController::class, 'printReceipt'])->name('sales.print');

    // Proposals
    Route::resource('proposals', \App\Http\Controllers\ProposalController::class);
    Route::post('/proposals/{proposal}/convert', [\App\Http\Controllers\ProposalController::class, 'convertToSale'])->name('proposals.convert');

    Route::get('/sales/lookup', [\App\Http\Controllers\SaleController::class, 'lookup'])->name('sales.lookup');

    // Parked Sales (Hold Bill) - MUST BE BEFORE /sales/{sale}
    Route::post('/sales/bulk-destroy', [\App\Http\Controllers\SaleController::class, 'bulkDestroy'])->name('sales.bulk-destroy');
    Route::post('/sales/park', [\App\Http\Controllers\SaleController::class, 'park'])->middleware(\App\Http\Middleware\EnforceTransactionLimit::class)->name('sales.park');
    Route::get('/sales/parked', [\App\Http\Controllers\SaleController::class, 'getParkedSales'])->name('sales.parked');
    Route::get('/sales/parked/{id}', [\App\Http\Controllers\SaleController::class, 'recall'])->name('sales.recall');
    Route::delete('/sales/parked/{id}', [\App\Http\Controllers\SaleController::class, 'deleteParked'])->name('sales.parked.delete');
    // sales.get-items removed 2026-08-02 — no frontend caller, returned full
    // Product rows (including cost_price/purchase_price) to any authenticated
    // user with no validation on the ids array. See audit item A4.

    Route::get('/sales/{sale}', [\App\Http\Controllers\SaleController::class, 'show'])->name('sales.show');
    Route::get('/sales/{sale}/edit', [\App\Http\Controllers\SaleController::class, 'edit'])->name('sales.edit');
    Route::put('/sales/{sale}', [\App\Http\Controllers\SaleController::class, 'update'])->name('sales.update');
    Route::post('/sales/{sale}/cancel', [\App\Http\Controllers\SaleController::class, 'cancel'])->name('sales.cancel');
    Route::post('/pos/return', [\App\Http\Controllers\PosReturnController::class, 'store'])->name('pos.return.store');
    Route::post('/sales/{sale}/return', [\App\Http\Controllers\SaleController::class, 'returnSale'])->name('sales.return');
    Route::delete('/sales/{sale}', [\App\Http\Controllers\SaleController::class, 'destroy'])->name('sales.destroy');

    // POS API Routes
    Route::get('/api/pos/categories', [\App\Http\Controllers\PosController::class, 'getCategories'])->name('api.categories');

    // Detailed Invoice
    // `?ai_prefill=<key>` opens this screen pre-filled from an AI Scan. AI Scan
    // never posts a sale itself (a posted sale is immutable — see SaleObserver),
    // so the user always finalises it here.
    Route::get('/sales/invoice/create', function (\Illuminate\Http\Request $request) {
        return Inertia::render('Sales/CreateInvoice', [
            'aiPrefill' => app(\App\Services\SmartCapture\PrefillService::class)
                ->pull($request->query('ai_prefill')),
        ]);
    })->name('sales.invoice.create');

    // Master Sales Console (Atomic Analysis)
    Route::get('/sales/master', function () {
        return Inertia::render('Sales/MasterSales');
    })->name('sales.master');

    // Pre-Sale Page (Proof of Concept - Stock Check OFF)
    Route::get('/sales/presale/create', function () {
        return Inertia::render('Sales/CreatePreSale');
    })->name('presales.create');




    // Manufacturing Rules
    Route::get('/manufacturing/rules', function () {
        return Inertia::render('Manufacturing/Rules');
    })->name('manufacturing.rules');

    // Manufacturing API
    Route::get('/api/manufacturing-rules', [\App\Http\Controllers\Api\ManufacturingRuleController::class, 'index']);
    Route::post('/api/manufacturing-rules', [\App\Http\Controllers\Api\ManufacturingRuleController::class, 'store']);
    Route::patch('/api/manufacturing-rules/{id}', [\App\Http\Controllers\Api\ManufacturingRuleController::class, 'update']);
    Route::delete('/api/manufacturing-rules/{id}', [\App\Http\Controllers\Api\ManufacturingRuleController::class, 'destroy']);

    // Categories API
    Route::get('/api/categories', function () {
        return \response()->json(\App\Models\Category::all());
    })->name('api.categories.general');

    Route::get('/api/warehouses', function () {
        return \response()->json(\App\Models\Warehouse::all());
    })->name('api.warehouses');

    // Finance Routes
    Route::get('/finance', [FinanceController::class, 'index'])->middleware('permission:finance.balances')->name('finance');
    Route::get('/finance/receivables', [FinanceController::class, 'receivables'])->name('finance.receivables');
    Route::get('/finance/payables', [FinanceController::class, 'payables'])->name('finance.payables');

    // Fund Management (Owner Capital, Transfers, Adjustments)
    Route::get('/funds', [FundController::class, 'index'])->middleware('permission:finance.balances')->name('funds.index');
    Route::post('/funds/add', [FundController::class, 'addFunds'])->name('funds.add');
    Route::post('/funds/remove', [FundController::class, 'removeFunds'])->name('funds.remove');
    Route::post('/funds/transfer', [FundController::class, 'transfer'])->name('funds.transfer');
    Route::post('/funds/adjust', [FundController::class, 'adjust'])->name('funds.adjust');
    Route::get('/funds/cash-history', [FundController::class, 'history'])->name('funds.history.ledger');
    Route::get('/funds/api/history', [FundController::class, 'getCashHistory'])->name('funds.cash-history');

    // Custom Charges
    Route::get('/api/custom-charges', function () {
        return \response()->json(\App\Models\CustomCharge::active()->get());
    })->name('api.custom-charges');

    Route::get('/api/bank-accounts', \App\Http\Controllers\Api\BankAccountController::class)->name('api.bank-accounts');

    // Custom Charges
    Route::post('/settings/charges', [\App\Http\Controllers\SettingsController::class, 'storeCharge'])->name('settings.charges.store');
    Route::put('/settings/charges/{charge}', [\App\Http\Controllers\SettingsController::class, 'updateCharge'])->name('settings.charges.update');
    Route::delete('/settings/charges/{charge}', [\App\Http\Controllers\SettingsController::class, 'deleteCharge'])->name('settings.charges.delete');
    Route::post('/settings/data-privacy', [\App\Http\Controllers\SettingsController::class, 'updateDataPrivacy'])->name('settings.data-privacy.update');

    // Charity Routes
    Route::get('/charity/stats', [\App\Http\Controllers\CharityController::class, 'stats'])->name('charity.stats');
    Route::post('/charity/add', [\App\Http\Controllers\CharityController::class, 'add'])->name('charity.add');
    Route::post('/charity/update-default', [\App\Http\Controllers\CharityController::class, 'updateDefault'])->name('charity.update-default');

    // Communication Routes
    Route::post('/sales/{id}/send-email', [\App\Http\Controllers\CommunicationController::class, 'sendEmail'])->name('sales.send-email');
    Route::post('/sales/{id}/send-whatsapp', [\App\Http\Controllers\CommunicationController::class, 'sendWhatsApp'])->name('sales.send-whatsapp');

    // Accounting Routes
    Route::get('/accounting', [\App\Http\Controllers\AccountingController::class, 'dashboard'])->name('accounting.dashboard');
    Route::get('/accounting/chart', [\App\Http\Controllers\AccountingController::class, 'index'])->name('accounting.index');
    Route::get('/accounting/p-and-l', [\App\Http\Controllers\AccountingController::class, 'profitAndLoss'])->name('accounting.pnl');
    Route::get('/accounting/balance-sheet', [\App\Http\Controllers\AccountingController::class, 'balanceSheet'])->name('accounting.balance-sheet');
    Route::get('/accounting/api/accounts', [\App\Http\Controllers\AccountingController::class, 'apiIndex'])->name('accounting.accounts.api');

    // Reports Dashboard
    // Reports Dashboard
    Route::get('/reports/dashboard', [\App\Http\Controllers\ReportController::class, 'dashboard'])->name('reports.dashboard');

    // Admin Panel (Hub) — DEPRECATED
    // The old /admin-panel is now the Store Admin at /s/{slug}/staff and /s/{slug}/settings
    // This route is kept as a redirect safety net to prevent broken bookmarks from panicking
    Route::get('/admin-panel', [\App\Http\Controllers\AdminController::class, 'index'])->name('admin.panel');

    // Data Management (Import/Export)
    Route::get('/admin-panel/data-management', [\App\Http\Controllers\DataManagementController::class, 'index'])->name('legacy.admin.data');
    Route::post('/admin-panel/data/export', [\App\Http\Controllers\DataManagementController::class, 'export'])->middleware('permission:data.export')->name('legacy.admin.data.export');
    Route::post('/admin-panel/data/import', [\App\Http\Controllers\DataManagementController::class, 'import'])->name('legacy.admin.data.import');
    Route::get('/admin-panel/data/upload-mapping', function () { return \redirect()->route('store.admin.data', ['store_slug' => app('current.tenant')->slug]); });
    Route::post('/admin-panel/data/upload-mapping', [\App\Http\Controllers\ImportMappingController::class, 'uploadForMapping'])->name('legacy.admin.data.upload-mapping');
    Route::get('/admin-panel/data/process-import', function () { return \redirect()->route('store.admin.data', ['store_slug' => app('current.tenant')->slug]); });
    Route::post('/admin-panel/data/process-import', [\App\Http\Controllers\ImportMappingController::class, 'processImport'])->name('legacy.admin.data.process-import');
    Route::post('/admin-panel/data/validate-import', [\App\Http\Controllers\ImportMappingController::class, 'validateImport'])->name('legacy.admin.data.validate-import');
    Route::get('/admin-panel/data/template', [\App\Http\Controllers\DataManagementController::class, 'template'])->name('legacy.admin.data.template');

    // Backups
    // SECURITY FIX: these 8 routes previously had NO permission middleware at all —
    // any authenticated store member (not just admins) could create/download/restore/
    // delete raw SQL database backups. The equivalent routes inside the nested
    // 'admin.' group above (permission:admin.settings_manage) were deliberately
    // commented out "for structural security", but that guard never actually applied
    // here since these routes (registered further down in the same outer 'store.'
    // group) are what Admin/Backups.jsx and now the Data & Backup hub actually call.
    // Gated to admin.settings_manage to match every other admin-only action in this
    // file (Settings, Database, Data Management, Migration).
    // Former page route — Admin/Backups.jsx was folded into the "Backups" tab of the
    // Data & Backup hub (Admin/DataManagement.jsx). Kept as a redirect so old
    // bookmarks/links don't 404.
    Route::get('/admin-panel/backups', function () {
        return redirect()->route('store.admin.data', ['store_slug' => app('current.tenant')->slug, 'tab' => 'backups']);
    })->middleware('permission:admin.settings_manage')->name('backups.index');
    Route::post('/admin-panel/backups', [\App\Http\Controllers\BackupController::class, 'store'])->middleware('permission:admin.settings_manage')->name('backups.store');
    Route::post('/admin-panel/backups/restore', [\App\Http\Controllers\BackupController::class, 'restore'])->middleware('permission:admin.settings_manage')->name('backups.restore');
    Route::post('/admin-panel/backups/import-data', [\App\Http\Controllers\BackupController::class, 'importData'])->middleware('permission:admin.settings_manage')->name('backups.import');
    Route::get('/admin-panel/backups/progress', [\App\Http\Controllers\BackupController::class, 'progress'])->middleware('permission:admin.settings_manage')->name('backups.progress');
    Route::get('/admin-panel/backups/{filename}', [\App\Http\Controllers\BackupController::class, 'download'])->middleware('permission:admin.settings_manage')->name('backups.download');
    Route::delete('/admin-panel/backups/{filename}', [\App\Http\Controllers\BackupController::class, 'delete'])->middleware('permission:admin.settings_manage')->name('backups.delete');
    Route::post('/admin-panel/backups/{filename}/email', [\App\Http\Controllers\BackupController::class, 'email'])->middleware('permission:admin.settings_manage')->name('backups.email');

    Route::get('/admin-panel/dashboard', [\App\Http\Controllers\AdminController::class, 'dashboard'])->name('legacy.admin.dashboard');
    // Migration / Backup Import
    // SECURITY FIX: same gap as Backups above — importing external data into the
    // tenant's live database had no permission check at all. Now gated the same way.
    // Former page route — Admin/Migration.jsx was folded into the "Migrate from
    // Another System" tab of the Data & Backup hub. Kept as a redirect for old links.
    Route::get('/admin-panel/migration', function () {
        return redirect()->route('store.admin.data', ['store_slug' => app('current.tenant')->slug, 'tab' => 'migrate']);
    })->middleware('permission:admin.settings_manage')->name('legacy.admin.migration.index');
    Route::post('/admin-panel/migration/analyze', [\App\Http\Controllers\MigrationController::class, 'analyze'])->middleware('permission:admin.settings_manage')->name('legacy.admin.migration.analyze');
    Route::post('/admin-panel/migration/execute', [\App\Http\Controllers\MigrationController::class, 'execute'])->middleware('permission:admin.settings_manage')->name('legacy.admin.migration.execute');

    Route::get('/admin-panel/users', [\App\Http\Controllers\AdminController::class, 'users'])->middleware('permission:admin.staff_manage')->name('legacy.admin.users');
    Route::post('/admin-panel/users', [\App\Http\Controllers\AdminController::class, 'storeUser'])->middleware('permission:users.manage')->name('legacy.admin.users.store');
    Route::put('/admin-panel/users/{id}', [\App\Http\Controllers\AdminController::class, 'updateUser'])->middleware('permission:users.manage')->name('legacy.admin.users.update');
    Route::delete('/admin-panel/users/{id}', [\App\Http\Controllers\AdminController::class, 'destroyUser'])->middleware('permission:users.manage')->name('legacy.admin.users.destroy');
    Route::get('/admin-panel/settings', [\App\Http\Controllers\AdminController::class, 'settings'])->middleware('permission:admin.settings_manage')->name('legacy.admin.settings');
    Route::post('/admin-panel/settings', [\App\Http\Controllers\AdminController::class, 'updateSettings'])->name('legacy.admin.settings.update');
    Route::get('/admin-panel/logs', [\App\Http\Controllers\AdminController::class, 'logs'])->middleware('permission:reports.audit')->name('legacy.admin.logs');
    Route::get('/admin-panel/database', [\App\Http\Controllers\AdminController::class, 'database'])->middleware('permission:admin.settings_manage')->name('legacy.admin.database');
    Route::get('/admin-panel/staff', function () { return redirect()->route('store.legacy.admin.users', ['store_slug' => app('current.tenant')->slug]); })->name('legacy.admin.staff');

    // Staff Attendance
    Route::get('/staff-attendance', [\App\Http\Controllers\StaffAttendanceController::class, 'index'])->name('staff-attendance.index');
    Route::get('/terminal-activities/screenshot/{id}', [\App\Http\Controllers\Api\TerminalActivityController::class, 'viewScreenshot'])->name('terminal-activities.screenshot');
    Route::get('/staff-attendance/{id}', [\App\Http\Controllers\StaffAttendanceController::class, 'show'])->name('staff-attendance.show');
    Route::post('/staff-attendance/approve-gap/{id}', [\App\Http\Controllers\StaffAttendanceController::class, 'approveGap'])->name('staff-attendance.approve-gap');
    Route::post('/staff-attendance/reject-gap/{id}', [\App\Http\Controllers\StaffAttendanceController::class, 'rejectGap'])->name('staff-attendance.reject-gap');




    Route::middleware('permission:pos.checkout')->group(function () {
        Route::get('/api/loyalty/{partyId}', [\App\Http\Controllers\GrowthEngineController::class, 'customerLoyalty'])->name('loyalty.info');
        Route::post('/api/loyalty/award', [\App\Http\Controllers\GrowthEngineController::class, 'awardPoints'])->name('loyalty.award');
        Route::post('/api/loyalty/redeem', [\App\Http\Controllers\GrowthEngineController::class, 'redeemPoints'])->name('loyalty.redeem');

        // Gift Cards
        Route::post('/api/gift-cards', [\App\Http\Controllers\GrowthEngineController::class, 'createGiftCard'])->name('gift-cards.create');
        Route::get('/api/gift-cards/{code}', [\App\Http\Controllers\GrowthEngineController::class, 'checkGiftCard'])->name('gift-cards.check');
        Route::post('/api/gift-cards/use', [\App\Http\Controllers\GrowthEngineController::class, 'useGiftCard'])->name('gift-cards.use');

        // Store Credit
        Route::post('/api/store-credit/add', [\App\Http\Controllers\GrowthEngineController::class, 'addStoreCredit'])->name('store-credit.add');
        Route::post('/api/store-credit/use', [\App\Http\Controllers\GrowthEngineController::class, 'useStoreCredit'])->name('store-credit.use');
    });
    // Notifications
    Route::get('/notifications', [App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/mark-all-read', [App\Http\Controllers\NotificationController::class, 'markAllRead'])->name('notifications.mark-all-read');
    Route::post('/notifications/{id}/mark-read', [App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('notifications.mark-read');
    Route::delete('/notifications/{id}', [App\Http\Controllers\NotificationController::class, 'destroy'])->name('notifications.destroy');

    // Profile Routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/passcode', [ProfileController::class, 'updatePasscode'])->name('profile.passcode');
    Route::post('/profile/security-pin', [\App\Http\Controllers\ProfileSecurityController::class, 'updateSecurityPin'])->name('profile.security-pin');
    Route::post('/profile/verify-security-pin', [\App\Http\Controllers\ProfileSecurityController::class, 'verifySecurityPin'])->name('profile.verify-security-pin');
    Route::post('/profile/verify-elevated-pin', [\App\Http\Controllers\ProfileSecurityController::class, 'verifyElevatedPin'])->name('profile.verify-elevated-pin');
    Route::get('/profile/store-members', [\App\Http\Controllers\ProfileSecurityController::class, 'storeMembers'])->name('profile.store-members');
    // ============================================
    // NEW FEATURES ROUTES (Returns, StockOps, etc)
    // ============================================

    // Returns History — PROBLEM 10 FIX: Permission middleware added
    // returns.create/store: requires 'returns' (owner, admin, manager, cashier)
    // returns-history: requires 'returns' or 'sales_view' (accountant read-only)
    Route::get('/returns-history', [\App\Http\Controllers\ReturnController::class, 'index'])->name('returns-history.index')->middleware('permission:sales.returns,sales.view');
    Route::get('/returns/create', [\App\Http\Controllers\ReturnController::class, 'create'])->name('returns.create')->middleware('permission:sales.returns');
    Route::post('/returns', [\App\Http\Controllers\ReturnController::class, 'store'])->name('returns.store')->middleware('permission:sales.returns');
    Route::get('/returns-history/{id}', [\App\Http\Controllers\ReturnController::class, 'show'])->name('returns-history.show')->middleware('permission:sales.returns,sales.view');

    // Recurring Invoices
    Route::get('/recurring-invoices', [\App\Http\Controllers\RecurringInvoiceController::class, 'index'])->name('recurring-invoices.index');
    Route::get('/recurring-invoices/create', [\App\Http\Controllers\RecurringInvoiceController::class, 'create'])->name('recurring-invoices.create');
    Route::post('/recurring-invoices', [\App\Http\Controllers\RecurringInvoiceController::class, 'store'])->name('recurring-invoices.store');
    Route::get('/recurring-invoices/{id}/edit', [\App\Http\Controllers\RecurringInvoiceController::class, 'edit'])->name('recurring-invoices.edit');
    Route::put('/recurring-invoices/{id}', [\App\Http\Controllers\RecurringInvoiceController::class, 'update'])->name('recurring-invoices.update');
    Route::post('/recurring-invoices/{id}/toggle', [\App\Http\Controllers\RecurringInvoiceController::class, 'toggle'])->name('recurring-invoices.toggle');
    Route::delete('/recurring-invoices/{id}', [\App\Http\Controllers\RecurringInvoiceController::class, 'destroy'])->name('recurring-invoices.destroy');

    // Stock Transfers
    Route::get('/stock-transfers', [\App\Http\Controllers\StockTransferController::class, 'index'])->middleware('permission:inventory.transfer')->name('stock-transfers.index');
    Route::get('/stock-transfers/create', [\App\Http\Controllers\StockTransferController::class, 'create'])->middleware('permission:inventory.transfer')->name('stock-transfers.create');
    Route::post('/stock-transfers', [\App\Http\Controllers\StockTransferController::class, 'store'])->middleware('permission:inventory.transfer')->name('stock-transfers.store');
    Route::get('/stock-transfers/{id}', [\App\Http\Controllers\StockTransferController::class, 'show'])->middleware('permission:inventory.transfer')->name('stock-transfers.show');
    Route::get('/stock-transfers/{id}/edit', function () { /* Placeholder */})->name('stock-transfers.edit');

    // Stock Take / Audit
    Route::get('/stock-audit', [\App\Http\Controllers\StockTakeController::class, 'index'])->middleware('permission:inventory.adjust')->name('stock-takes.index');
    Route::get('/stock-audit/create', [\App\Http\Controllers\StockTakeController::class, 'create'])->middleware('permission:inventory.adjust')->name('stock-takes.create');
    Route::post('/stock-audit', [\App\Http\Controllers\StockTakeController::class, 'store'])->middleware('permission:inventory.adjust')->name('stock-takes.store');
    Route::get('/stock-audit/{id}', [\App\Http\Controllers\StockTakeController::class, 'show'])->middleware('permission:inventory.adjust')->name('stock-takes.show');

    // Batch Tracking
    Route::get('/batches', [\App\Http\Controllers\BatchTrackingController::class, 'index'])->middleware('permission:inventory.view')->name('batches.index');
    Route::get('/batches/{id}', [\App\Http\Controllers\BatchTrackingController::class, 'show'])->middleware('permission:inventory.view')->name('batches.show');

    // Serial Tracking
    Route::get('/serials', [\App\Http\Controllers\SerialTrackingController::class, 'index'])->middleware('permission:inventory.view')->name('serials.index');
    Route::get('/serials/{id}', [\App\Http\Controllers\SerialTrackingController::class, 'show'])->middleware('permission:inventory.view')->name('serials.show');

    // Debit Notes
    Route::get('/debit-notes', [\App\Http\Controllers\DebitNoteController::class, 'index'])->name('debit-notes.index');
    Route::get('/debit-notes/create', [\App\Http\Controllers\DebitNoteController::class, 'create'])->name('debit-notes.create');
    Route::post('/debit-notes', [\App\Http\Controllers\DebitNoteController::class, 'store'])->name('debit-notes.store');
    Route::get('/debit-notes/{id}', [\App\Http\Controllers\DebitNoteController::class, 'show'])->name('debit-notes.show');

    // Bank Reconciliation
    Route::get('/bank-reconciliation', [\App\Http\Controllers\BankReconciliationController::class, 'index'])->name('bank-reconciliation.index');
    Route::post('/bank-reconciliation/import', [\App\Http\Controllers\BankReconciliationController::class, 'import'])->name('bank-reconciliation.import');

    // Invoice Reminders
    Route::get('/invoice-reminders', [\App\Http\Controllers\InvoiceReminderController::class, 'index'])->name('invoice-reminders.index');
    Route::get('/invoice-reminders/create', [\App\Http\Controllers\InvoiceReminderController::class, 'create'])->name('invoice-reminders.create');
    Route::post('/invoice-reminders', [\App\Http\Controllers\InvoiceReminderController::class, 'store'])->name('invoice-reminders.store');
    Route::post('/invoice-reminders/{id}/send', [\App\Http\Controllers\InvoiceReminderController::class, 'send'])->name('invoice-reminders.send');

    // Staff Attendance
    Route::get('/staff/attendance', [\App\Http\Controllers\StaffAttendanceController::class, 'index'])->name('staff.attendance.index');
    Route::get('/staff/attendance/{id}', [\App\Http\Controllers\StaffAttendanceController::class, 'show'])->name('staff.attendance.show');
    Route::post('/staff/attendance/gap/{id}/approve', [\App\Http\Controllers\StaffAttendanceController::class, 'approveGap'])->name('staff.attendance.approve-gap');
    Route::post('/staff/attendance/gap/{id}/reject', [\App\Http\Controllers\StaffAttendanceController::class, 'rejectGap'])->name('staff.attendance.reject-gap');

    // Marketing Campaigns
    Route::get('/marketing/campaigns', [\App\Http\Controllers\MarketingCampaignController::class, 'index'])->name('marketing-campaigns.index');
    Route::get('/marketing/campaigns/create', [\App\Http\Controllers\MarketingCampaignController::class, 'create'])->name('marketing-campaigns.create');
    Route::post('/marketing/campaigns', [\App\Http\Controllers\MarketingCampaignController::class, 'store'])->name('marketing-campaigns.store');

    // Online Store
    Route::get('/online-store-manager', [\App\Http\Controllers\OnlineStoreController::class, 'index'])->name('online-store.index');
    Route::post('/online-store-manager', [\App\Http\Controllers\OnlineStoreController::class, 'update'])->name('online-store.update');

    // ── WooCommerce Sync (Full System) ────────────────────────────────────────
    // Entry point: redirects to the new connection list
    Route::get('/woocommerce-sync', fn() => redirect()->route('store.woo.connections.index', ['store_slug' => request()->route('store_slug') ?? request()->segment(2)]))
        ->name('woocommerce.index');
    // WooSync — Connection Management & Sync Operations
    Route::prefix('woo')->name('woo.')->group(function () {
        // Plugin download (public within auth context)
        Route::get('/connections/{connection}/download', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'downloadPlugin'])
            ->name('plugin.download');

        // Connections CRUD
        Route::get('/connections', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'index'])
            ->name('connections.index');
        Route::post('/connections', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'store'])
            ->name('connections.store');
        Route::get('/connections/{connection}/setup', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'setup'])
            ->name('connections.setup');
        Route::get('/connections/{connection}/status', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'statusJson'])
            ->name('connections.status-json');
        Route::put('/connections/{connection}/settings', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'updateSettings'])
            ->name('connections.settings');
        Route::delete('/connections/{connection}', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'destroy'])
            ->name('connections.destroy');

        // Sync Page (per connection)
        Route::get('/connections/{connection}/sync', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'syncPage'])
            ->name('connections.sync');

        // Sync Actions
        Route::post('/connections/{connection}/approve', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'approveSync'])
            ->name('connections.approve');
        Route::post('/connections/{connection}/push', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'forcePush'])
            ->name('connections.push');
        Route::post('/connections/{connection}/pull', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'forcePull'])
            ->name('connections.pull');
        Route::post('/connections/{connection}/scan', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'scanCatalog'])
            ->name('connections.scan');
        Route::post('/connections/{connection}/resolve', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'resolveConflict'])
            ->name('connections.resolve');
        Route::post('/connections/{connection}/ignore', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'ignore'])
            ->name('connections.ignore');

        // Logs
        Route::get('/connections/{connection}/logs', [\App\Http\Controllers\WooSync\WooConnectionController::class, 'logs'])
            ->name('connections.logs');
    });

    // E-Invoicing
    Route::get('/e-invoicing', [\App\Http\Controllers\EInvoicingController::class, 'index'])->name('e-invoicing.index');
    Route::post('/e-invoicing/generate', [\App\Http\Controllers\EInvoicingController::class, 'generate'])->name('e-invoicing.generate');
    Route::post('/e-invoicing/waybill', [\App\Http\Controllers\EInvoicingController::class, 'generateWaybill'])->name('e-invoicing.waybill');

    // System Reset (Admin Only)
    Route::post('/api/system/reset', [\App\Http\Controllers\Admin\SystemResetController::class, 'factoryReset'])->middleware('throttle:5,1')->name('system.reset');
    Route::post('/api/system/reset/{entity}', [\App\Http\Controllers\Admin\SystemResetController::class, 'deleteEntity'])->middleware('throttle:5,1')->name('system.delete-entity');

    // Added Category D Store Routes
    Route::get('/finance/accounts', fn() => \abort(501, 'Implement finance.accounts'))->name('finance.accounts');
    Route::get('/finance/journal', fn() => \abort(501, 'Implement finance.journal'))->name('finance.journal');
    Route::get('/payments/in/create', fn() => \abort(501, 'Implement payment-in.create'))->name('payment-in.create');
    Route::get('/payments/out/create', fn() => \abort(501, 'Implement payment-out.create'))->name('payment-out.create');
    Route::get('/sales/pre-sales/{order}/print', fn() => \abort(501, 'Implement pre-sales.print'))->name('pre-sales.print');
    Route::get('/debit-notes/{id}/print', fn() => \abort(501, 'Implement debit-notes.print'))->name('debit-notes.print');
    Route::put('/debit-notes/{id}', fn() => \abort(501, 'Implement debit-notes.update'))->name('debit-notes.update');
    Route::get('/purchases/{purchase}/print', fn() => \abort(501, 'Implement purchases.print'))->name('purchases.print');
    Route::get('/sales/create', fn() => \abort(501, 'Implement sales.create'))->name('sales.create');
    Route::get('/inventory/production/{run}/edit', fn() => \abort(501, 'Implement production.edit'))->name('production.edit');
    Route::get('/reports/discount-report', fn() => \abort(501, 'Implement reports.discount-report'))->name('reports.discount-report');
    Route::get('/reports/inventory-valuation', fn() => \abort(501, 'Implement reports.inventory-valuation'))->name('reports.inventory-valuation');
    });
});

Route::post('/woocommerce/webhook/{uuid}', [\App\Http\Controllers\WooCommerceController::class, 'webhook']);

// ── Phase 4.3 & 4.4: Billing + Plan Usage ─────────────────────────────────
// MIGRATED: Added to tenant specific block above to prevent 403 context loss.

// Plan Usage API (read current tenant resource usage vs plan limits)
// Used by: React Billing page, upgrade modal, near-limit warnings
Route::middleware(['auth', 'throttle:api'])->get(
    '/api/plan/usage',
    [\App\Http\Controllers\Api\PlanUsageController::class, 'usage']
)->name('api.plan.usage');



// ── Phase 5.3: Platform Super-Admin Routes ─────────────────────────────────
// These routes are for the VenQore platform operator ONLY (you).
// Protected by 'superadmin' middleware: user->role === 'platform_admin' + no tenant_id.
// Prefix: /superadmin (distinct from per-tenant /admin-panel)
Route::prefix('superadmin')
    ->name('superadmin.')
    ->middleware(['auth', 'superadmin'])
    ->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'index'])
            ->name('dashboard');
        Route::get('/tenants', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'tenants'])
            ->name('tenants');
        Route::post('/tenants/{tenant}/suspend',    [\App\Http\Controllers\Admin\AdminDashboardController::class, 'suspend'])
            ->name('tenants.suspend');
        Route::post('/tenants/{tenant}/reactivate', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'reactivate'])
            ->name('tenants.reactivate');
        Route::post('/tenants/{tenant}/upgrade',    [\App\Http\Controllers\Admin\AdminDashboardController::class, 'upgradePlan'])
            ->name('tenants.upgrade');
    });

Route::prefix('s/{store_slug}/v3')->name('store.v3.')->middleware(['auth', 'verified', 'tenant'])->group(function () {
    Route::resource('products', \App\Http\Controllers\V3\ProductController::class)->except(['show']);
    Route::resource('warehouses', \App\Http\Controllers\V3\WarehouseController::class)->except(['show']);
    Route::resource('purchases', \App\Http\Controllers\V3\PurchaseController::class)
         ->only(['index', 'create', 'store', 'show']);

    Route::get('purchases/{purchaseId}/return', [\App\Http\Controllers\V3\PurchaseReturnController::class, 'create'])->name('purchases.return.create');
    Route::post('purchases/{purchaseId}/return', [\App\Http\Controllers\V3\PurchaseReturnController::class, 'store'])->name('purchases.return.store');

    Route::post('supplier-payments', [\App\Http\Controllers\V3\SupplierPaymentController::class, 'store'])->name('supplier-payments.store');

    Route::post('opening-balances', [\App\Http\Controllers\V3\OpeningBalanceController::class, 'store'])->name('opening-balances.store');
    Route::get('opening-balances/status', [\App\Http\Controllers\V3\OpeningBalanceController::class, 'status'])->name('opening-balances.status');

    Route::post('supplier-advances', [\App\Http\Controllers\V3\SupplierAdvanceController::class, 'store'])->name('supplier-advances.store');
    Route::post('stock-adjustments', [\App\Http\Controllers\V3\StockAdjustmentController::class, 'store'])->name('stock-adjustments.store');
    Route::post('stock-transfers', [\App\Http\Controllers\V3\StockTransferController::class, 'store'])->name('stock-transfers.store');
    Route::get('suppliers/{supplierId}/statement', [\App\Http\Controllers\V3\SupplierStatementController::class, 'show'])->name('suppliers.statement');

    // Phase 3 — Sales & Customer Management
    Route::post('parties',           [\App\Http\Controllers\V3\PartyController::class, 'store'])->name('parties.store');
    Route::put('parties/{id}',       [\App\Http\Controllers\V3\PartyController::class, 'update'])->name('parties.update');
    Route::delete('parties/{id}',    [\App\Http\Controllers\V3\PartyController::class, 'destroy'])->name('parties.destroy');

    Route::post('sales', [\App\Http\Controllers\V3\SaleController::class, 'store'])->name('sales.store');
    Route::get('sales/{saleId}/pdf', [\App\Http\Controllers\V3\InvoicePdfController::class, 'show'])->name('sales.pdf');
    Route::post('sales/{saleId}/return', [\App\Http\Controllers\V3\SaleReturnController::class, 'store'])->name('sales.return.store');
    Route::post('customer-payments', [\App\Http\Controllers\V3\CustomerPaymentController::class, 'store'])->name('customer-payments.store');
    Route::post('customer-payments/{journalEntryId}/bounce', [\App\Http\Controllers\V3\BounceController::class, 'store'])->name('customer-payments.bounce');
    Route::post('sales/{saleId}/write-off', [\App\Http\Controllers\V3\BadDebtController::class, 'store'])->name('sales.write-off');
    Route::post('customer-advances', [\App\Http\Controllers\V3\CustomerAdvanceController::class, 'store'])->name('customer-advances.store');

    Route::post('sales-orders', [\App\Http\Controllers\V3\SalesOrderController::class, 'store'])->name('sales-orders.store');
    Route::post('sales-orders/{id}/cancel', [\App\Http\Controllers\V3\SalesOrderController::class, 'cancel'])->name('sales-orders.cancel');
    Route::post('sales-orders/{id}/convert', [\App\Http\Controllers\V3\SalesOrderController::class, 'convert'])->name('sales-orders.convert');

    Route::post('quotations', [\App\Http\Controllers\V3\QuotationController::class, 'store'])->name('quotations.store');
    Route::post('quotations/{id}/convert-to-order', [\App\Http\Controllers\V3\QuotationController::class, 'convertToOrder'])->name('quotations.convert-to-order');

    Route::get('customers/{customerId}/statement', [\App\Http\Controllers\V3\CustomerStatementController::class, 'show'])->name('customers.statement');

    // Nested under products
    Route::prefix('products/{productId}')->name('products.')->group(function () {
        Route::get('uom',           [\App\Http\Controllers\V3\UomConversionController::class, 'index'])  ->name('uom.index');
        Route::post('uom',          [\App\Http\Controllers\V3\UomConversionController::class, 'store'])  ->name('uom.store');
        Route::delete('uom/{id}',   [\App\Http\Controllers\V3\UomConversionController::class, 'destroy'])->name('uom.destroy');

        Route::get('tiers',         [\App\Http\Controllers\V3\PriceTierController::class, 'index'])  ->name('tiers.index');
        Route::post('tiers',        [\App\Http\Controllers\V3\PriceTierController::class, 'store'])  ->name('tiers.store');
        Route::delete('tiers/{id}', [\App\Http\Controllers\V3\PriceTierController::class, 'destroy'])->name('tiers.destroy');
    });

    // Phase 4 — Manufacturing & BOM
    Route::post('boms', [\App\Http\Controllers\V3\BomController::class, 'store'])->name('boms.store');
    Route::put('boms/{id}', [\App\Http\Controllers\V3\BomController::class, 'update'])->name('boms.update');
    Route::delete('boms/{id}', [\App\Http\Controllers\V3\BomController::class, 'destroy'])->name('boms.destroy');

    Route::post('production-runs', [\App\Http\Controllers\V3\ProductionRunController::class, 'store'])->name('production-runs.store');
    Route::post('production-runs/{id}/complete', [\App\Http\Controllers\V3\ProductionRunController::class, 'complete'])->name('production-runs.complete');
    Route::post('production-runs/{id}/reverse', [\App\Http\Controllers\V3\ProductionRunController::class, 'reverse'])->name('production-runs.reverse');
    Route::post('disassembly', [\App\Http\Controllers\V3\ProductionRunController::class, 'disassemble'])->name('disassembly.store');

    // Phase 4 — HR & Special Transactions
    Route::post('employees', [\App\Http\Controllers\V3\EmployeeController::class, 'store'])->name('employees.store');
    Route::put('employees/{id}', [\App\Http\Controllers\V3\EmployeeController::class, 'update'])->name('employees.update');
    
    Route::post('payroll/accrue', [\App\Http\Controllers\V3\PayrollController::class, 'accrue'])->name('payroll.accrue');
    Route::post('payroll/pay', [\App\Http\Controllers\V3\PayrollController::class, 'pay'])->name('payroll.pay');
    
    Route::post('employee-settlements', [\App\Http\Controllers\V3\EmployeeSettlementController::class, 'store'])->name('employee-settlements.store');
    
    Route::post('cash-shortages', [\App\Http\Controllers\V3\CashShortageController::class, 'store'])->name('cash-shortages.store');

    Route::post('disaster-claims', [\App\Http\Controllers\V3\DisasterClaimController::class, 'store'])->name('disaster-claims.store');
    Route::post('disaster-claims/{id}/recover', [\App\Http\Controllers\V3\DisasterClaimController::class, 'recover'])->name('disaster-claims.recover');

    Route::post('assets', [\App\Http\Controllers\V3\AssetController::class, 'store'])->name('assets.store');
    Route::post('depreciation', [\App\Http\Controllers\V3\DepreciationController::class, 'store'])->name('depreciation.store');

    Route::post('loans/drawdown', [\App\Http\Controllers\V3\LoanController::class, 'drawdown'])->name('loans.drawdown');
    Route::post('loans/repay', [\App\Http\Controllers\V3\LoanController::class, 'repay'])->name('loans.repay');

    Route::post('expenses', [\App\Http\Controllers\V3\ExpenseController::class, 'store'])->name('expenses.store');
    Route::post('funds', [\App\Http\Controllers\V3\FundController::class, 'store'])->name('funds.store');
    Route::post('bank-transfers', [\App\Http\Controllers\V3\BankTransferController::class, 'store'])->name('bank-transfers.store');
    Route::post('donations', [\App\Http\Controllers\V3\DonationController::class, 'store'])->name('donations.store');

    Route::put('users/{id}/role', [\App\Http\Controllers\V3\RoleController::class, 'update'])->middleware('permission:users.manage')->name('users.role.update');
    Route::post('settings/discount-limits', [\App\Http\Controllers\V3\RoleController::class, 'updateDiscountLimit'])->name('settings.discount-limits');

    Route::post('fiscal-year/close', [\App\Http\Controllers\V3\FiscalYearController::class, 'close'])->name('fiscal-year.close');

    // Reports
    Route::get('reports/trial-balance', [\App\Http\Controllers\V3\ReportController::class, 'trialBalance'])->name('reports.trial-balance');
    Route::get('reports/profit-loss', [\App\Http\Controllers\V3\ReportController::class, 'profitAndLoss'])->name('reports.profit-loss');
    Route::get('reports/balance-sheet', [\App\Http\Controllers\V3\ReportController::class, 'balanceSheet'])->name('reports.balance-sheet');
    Route::get('reports/cash-flow', [\App\Http\Controllers\V3\ReportController::class, 'cashFlow'])->name('reports.cash-flow');
    Route::get('reports/aged-receivables', [\App\Http\Controllers\V3\ReportController::class, 'agedReceivables'])->name('reports.aged-receivables');
    Route::get('reports/aged-payables', [\App\Http\Controllers\V3\ReportController::class, 'agedPayables'])->name('reports.aged-payables');
    Route::get('reports/sales', [\App\Http\Controllers\V3\ReportController::class, 'sales'])->name('reports.sales');
    Route::get('reports/purchases', [\App\Http\Controllers\V3\ReportController::class, 'purchases'])->name('reports.purchases');
    Route::get('reports/inventory-valuation', [\App\Http\Controllers\V3\ReportController::class, 'inventoryValuation'])->name('reports.inventory-valuation');
    Route::get('reports/cogs', [\App\Http\Controllers\V3\ReportController::class, 'cogs'])->name('reports.cogs');
    Route::get('reports/gross-profit', [\App\Http\Controllers\V3\ReportController::class, 'grossProfit'])->name('reports.gross-profit');
    Route::get('reports/tax', [\App\Http\Controllers\V3\ReportController::class, 'tax'])->name('reports.tax');
    Route::get('reports/party-ledger/{partyId}', [\App\Http\Controllers\V3\ReportController::class, 'partyLedger'])->name('reports.party-ledger');
    Route::get('reports/inventory-movement', [\App\Http\Controllers\V3\ReportController::class, 'inventoryMovement'])->name('reports.inventory-movement');
    Route::get('reports/export', [\App\Http\Controllers\V3\ReportExportController::class, 'export'])->middleware('permission:data.export')->name('reports.export');

    // Dashboard
    Route::get('dashboard', [\App\Http\Controllers\V3\DashboardController::class, 'index'])->name('dashboard');
});

require __DIR__ . '/auth.php';

// Version Check Route
Route::get('/api/app-version', function () {
    $manifestPath = public_path('build/manifest.json');
    if (file_exists($manifestPath)) {
        return \response()->json(['version' => filemtime($manifestPath)]);
    }
// Change every 5 mins in dev for testing
    return \response()->json(['version' => 'dev-' . floor(time() / 300)]);
});

Route::get('/error/{code}', function ($code) {
    return Inertia::render('Error', [
        'status' => (int) $code,
        'message' => request('message'),
    ]);
})->name('error.page');

// NOTE: Local-only rescue/patch routes removed before production launch.
// Use Artisan commands for any DB repair needs.


// [SECURITY] /debug-error removed — exposed full laravel.log to anyone with the
// hardcoded key committed to source. Use SSH or `tail storage/logs/laravel.log`.

// Temporary route to create local PK test account
Route::get('/create-pk-test', function () {
    $user = \App\Models\User::firstOrCreate(
        ['email' => 'testpk@venqore.com'],
        [
            'name' => 'Pakistani Test User',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]
    );

    $tenant = \App\Models\Tenant::firstOrCreate(
        ['slug' => 'test-pk-store'],
        [
            'name' => 'Pakistani Test Store',
            'status' => 'trial',
            'plan' => 'business',
            'trial_ends_at' => now()->addDays(14),
            'currency_symbol' => 'Rs',
            'country_code' => 'PK',
            'language_code' => 'en',
        ]
    );

    \App\Models\TenantUser::firstOrCreate(
        [
            'user_id' => $user->id,
            'tenant_id' => $tenant->id,
        ],
        [
            'role' => 'owner',
            'status' => 'active',
        ]
    );

    $user->update(['last_store_id' => $tenant->id]);

    return response('Test user testpk@venqore.com and store test-pk-store (PK) created successfully! You can now log in with "password".');
});

// Temporary route to clear Laravel cache on local
Route::get('/clear-local-cache', function () {
    \Illuminate\Support\Facades\Artisan::call('optimize:clear');
    
    if (auth()->check()) {
        auth()->user()->update([
            'is_platform_admin' => true,
            'platform_role' => 'platform_owner',
        ]);
        return response('Local Laravel cache cleared, and your user (' . auth()->user()->email . ') was granted Platform Owner role successfully!');
    }

    return response('Local Laravel cache cleared successfully! (Note: No user was logged in, so role was not updated).');
});

// Temporary route to inspect plan pricing in local DB
Route::get('/check-plans', function () {
    return response()->json(\App\Models\Plan::select('slug', 'price_monthly', 'price_monthly_pkr')->get());
});

// Temporary route to set local PKR prices directly
Route::get('/set-local-prices', function () {
    \App\Models\Plan::where('slug', 'starter')->update([
        'price_monthly_pkr' => 1100,
        'price_annual_pkr' => 11000,
    ]);
    \App\Models\Plan::where('slug', 'growth')->update([
        'price_monthly_pkr' => 1800,
        'price_annual_pkr' => 18000,
    ]);
    \App\Models\Plan::where('slug', 'business')->update([
        'price_monthly_pkr' => 5300,
        'price_annual_pkr' => 53000,
    ]);
    return response('Local PKR prices set successfully! You can verify at /check-plans.');
});

// ── FALLBACK: 404 for any URL not matched above ────────────────────────────
// This is the last line of defense. Every URL that doesn't match a route
// above returns a clean 404 — no redirect, no hint that anything exists.
// This means /admin-panel, /reports, /inventory (bare) all 404 for guessers.
Route::fallback(fn() => \abort(404));
