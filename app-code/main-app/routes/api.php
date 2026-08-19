<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\HeartbeatController;
use App\Http\Controllers\LemonSqueezyWebhookController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/heartbeat', [HeartbeatController::class, 'store'])->middleware('throttle:60,1');

use App\Http\Controllers\Api\TerminalActivityController;
Route::post('/terminal/activities', [TerminalActivityController::class, 'store'])->middleware('throttle:60,1');
Route::post('/terminal/screenshot', [TerminalActivityController::class, 'uploadScreenshot'])->middleware('throttle:60,1');

use App\Http\Controllers\Api\SyncController;

Route::get('/check-connection', [SyncController::class, 'checkConnection']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/sync/users', [SyncController::class, 'users']);
    Route::get('/sync/products', [SyncController::class, 'products']);
    Route::get('/sync/customers', [SyncController::class, 'customers']);
    Route::get('/sync/suppliers', [SyncController::class, 'suppliers']);
    Route::get('/sync/inventory', [SyncController::class, 'inventory']);
    Route::get('/sync/taxes', [SyncController::class, 'taxes']);
    Route::post('/sync/orders/batch', [SyncController::class, 'batchOrders']);
});

// ── Work Orders & Service Jobs API ──────────────────────────────────────────
use App\Http\Controllers\Api\WorkOrderController;

Route::middleware(['auth:sanctum', 'plan.feature:work_orders'])->group(function () {
    Route::get('/work-orders', [WorkOrderController::class, 'index']);
    Route::post('/work-orders', [WorkOrderController::class, 'store'])->middleware('permission:sales.create');
    Route::get('/work-orders/{id}', [WorkOrderController::class, 'show']);
    Route::put('/work-orders/{id}', [WorkOrderController::class, 'update'])->middleware('permission:sales.edit');
    Route::post('/work-orders/{id}/assign', [WorkOrderController::class, 'assign'])->middleware('permission:sales.edit');
    Route::post('/work-orders/{id}/convert-invoice', [WorkOrderController::class, 'convertInvoice'])->middleware('permission:sales.edit');
});

// ── Phase 2.1: Lemon Squeezy Billing Webhooks ──────────────────────────────
// Verified via HMAC-SHA256 signature (VerifyLemonSqueezySignature middleware)
// Excluded from CSRF — this is a server-to-server POST from Lemon Squeezy
Route::post('/webhooks/lemon-squeezy', [LemonSqueezyWebhookController::class, 'handle'])
    ->middleware('lemon-squeezy.signature');

Route::post('/webhooks/pusher', [\App\Http\Controllers\PusherWebhookController::class, 'handle']);

// ── Phase 3.1: POS Product Search API ─────────────────────────────────────
// Replaces the Product::get() timebomb in PosController.
// Rate-limited to 300 requests/min per tenant (config in bootstrap/app.php).
use App\Http\Controllers\Api\PosSearchController;

Route::prefix('pos')->middleware(['auth:sanctum', 'throttle:pos'])->group(function () {
    Route::get('/search',           [PosSearchController::class, 'search']);
    Route::get('/featured',         [PosSearchController::class, 'featured']);
    Route::get('/categories',       [PosSearchController::class, 'categories']);
    Route::get('/barcode/{code}',   [PosSearchController::class, 'findByBarcode']);
});

// ── WooCommerce Sync — Public Endpoints ───────────────────────────────────
// These are called by WooCommerce/WordPress directly — no auth, no CSRF.
// Security is handled via HMAC signature verification (webhook) and token (verify).
use App\Http\Controllers\WooSync\WooWebhookController;

Route::middleware('plan.feature:woocommerce')->group(function () {
    Route::post('/woo/webhook/{uuid}', [WooWebhookController::class, 'receive'])
        ->name('woo.webhook.receive');

    Route::get('/woo/verify/{token}', [WooWebhookController::class, 'verify'])
        ->name('woo.verify');

    Route::post('/woo/handshake', [\App\Http\Controllers\WooSync\WooHandshakeController::class, 'handshake'])
        ->name('woo.handshake');
});

// ── Offline DRM Validation Endpoints ─────────────────────────────────────
use App\Http\Controllers\DrmLicenseController;

Route::post('/drm/validate', [DrmLicenseController::class, 'validateLicense']);

Route::middleware('drm.license')->get('/drm/protected', function () {
    return response()->json(['status' => 'access_granted']);
});

// ── Public Chatbot Visitor API Routes ──────────────────────────────────────
// SECURITY (T0-0): these endpoints are UNAUTHENTICATED and reach an upstream
// LLM on the platform API key. Without throttling they are a free public LLM
// billed to us. The limits below are the emergency floor — the full guard
// (per-session / per-IP / per-store caps, Turnstile, spend kill-switch and
// answer cache) lands in App\Http\Middleware\VisitorChatGuard.
//
// NOTE: Laravel's `throttle` middleware uses the cache store. It is only
// effective across PHP-FPM workers when CACHE_STORE=database (or redis).
// Verify `CACHE_STORE` before relying on this. See T0-8.
use App\Http\Controllers\VisitorChatController;

Route::middleware(['throttle:5,1', 'visitor.chat.guard', 'plan.feature:live_chat_widget'])->group(function () {
    Route::post('/{store_slug}/chatbot/session', [VisitorChatController::class, 'startSession']);
});

Route::middleware(['throttle:15,1', 'visitor.chat.guard', 'plan.feature:live_chat_widget'])->group(function () {
    Route::post('/{store_slug}/chatbot/session/{uuid}/message', [VisitorChatController::class, 'sendMessage']);
    Route::post('/{store_slug}/chatbot/session/{uuid}/typing', [VisitorChatController::class, 'typing']);
});

// ── Vena Subscription Context API ──────────────────────────────────────────
// Returns plan, feature flags, limits, and geo signal for the Vena chat widget.
// Called once at session start; cached client-side for the session lifetime.
use App\Http\Controllers\VenaContextController;

Route::middleware('plan.feature:ai_assistant')->group(function () {
    Route::get('/{store_slug}/vena/context', [VenaContextController::class, 'index']);
    Route::post('/{store_slug}/vena/assist', [\App\Http\Controllers\VenaAssistController::class, 'assist']);
});




