<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\HeartbeatController;
use App\Http\Controllers\LemonSqueezyWebhookController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/heartbeat', [HeartbeatController::class, 'store']);

use App\Http\Controllers\Api\TerminalActivityController;
Route::post('/terminal/activities', [TerminalActivityController::class, 'store']);
Route::post('/terminal/screenshot', [TerminalActivityController::class, 'uploadScreenshot']);

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

Route::post('/woo/webhook/{uuid}', [WooWebhookController::class, 'receive'])
    ->name('woo.webhook.receive');

Route::get('/woo/verify/{token}', [WooWebhookController::class, 'verify'])
    ->name('woo.verify');

Route::post('/woo/handshake', [\App\Http\Controllers\WooSync\WooHandshakeController::class, 'handshake'])
    ->name('woo.handshake');

// ── Offline DRM Validation Endpoints ─────────────────────────────────────
use App\Http\Controllers\DrmLicenseController;

Route::post('/drm/validate', [DrmLicenseController::class, 'validateLicense']);

Route::middleware('drm.license')->get('/drm/protected', function () {
    return response()->json(['status' => 'access_granted']);
});

// ── Public Chatbot Visitor API Routes ──────────────────────────────────────
use App\Http\Controllers\VisitorChatController;

Route::post('/{store_slug}/chatbot/session', [VisitorChatController::class, 'startSession']);
Route::post('/{store_slug}/chatbot/session/{uuid}/message', [VisitorChatController::class, 'sendMessage']);
Route::post('/{store_slug}/chatbot/session/{uuid}/typing', [VisitorChatController::class, 'typing']);

// ── Vena Subscription Context API ──────────────────────────────────────────
// Returns plan, feature flags, limits, and geo signal for the Vena chat widget.
// Called once at session start; cached client-side for the session lifetime.
use App\Http\Controllers\VenaContextController;

Route::get('/{store_slug}/vena/context', [VenaContextController::class, 'index']);

// Vena Assist co-pilot endpoint
Route::post('/{store_slug}/vena/assist', [\App\Http\Controllers\VenaAssistController::class, 'assist']);




