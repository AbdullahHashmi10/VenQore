<?php

use App\Http\Controllers\Commerce\OrderInboxController;
use App\Http\Controllers\Commerce\PublicStoreController;
use App\Http\Controllers\Commerce\StoreManagerController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| VenQore Commerce MVP
|--------------------------------------------------------------------------
| Public (guest) surface first — no ambient tenant, throttled, allow-listed projections.
*/
Route::get('/shop', [PublicStoreController::class, 'directory'])->name('commerce.directory');
Route::get('/shop/{slug}', [PublicStoreController::class, 'show'])->where('slug', '[a-z0-9-]+')->name('commerce.store');
Route::post('/shop/{slug}/quote', [PublicStoreController::class, 'quote'])->where('slug', '[a-z0-9-]+')->middleware('throttle:60,1')->name('commerce.quote');
Route::post('/shop/{slug}/checkout', [PublicStoreController::class, 'placeOrder'])->where('slug', '[a-z0-9-]+')->middleware('throttle:10,1')->name('commerce.checkout');
Route::get('/order-status/{token}', [PublicStoreController::class, 'status'])->middleware('throttle:60,1')->name('commerce.order-status');
Route::post('/order-status/{token}/transfer', [PublicStoreController::class, 'reportTransfer'])->middleware('throttle:10,1')->name('commerce.order-status.transfer');

/*
| Merchant (staff) surface — same middleware stack as every other store-scoped page.
| Route names are `store.commerce.*` (not claimed by the marketplace_sync add-on module),
| so basic storefront participation does not require buying that module.
*/
Route::middleware(['auth', 'verified', 'tenant', 'lifecycle', 'drm', \App\Http\Middleware\DemoMiddleware::class, \App\Http\Middleware\NoIndexMiddleware::class, \App\Http\Middleware\EnforceHostedUntil::class, \App\Http\Middleware\EnsureModule::class])
    ->prefix('s/{store_slug}/online-store')
    ->name('store.commerce.')
    ->group(function () {
        Route::get('/', [StoreManagerController::class, 'home'])->middleware('permission:admin.settings_manage')->name('home');
        Route::get('/settings', [StoreManagerController::class, 'settings'])->middleware('permission:admin.settings_manage')->name('settings');
        Route::post('/settings', [StoreManagerController::class, 'saveSettings'])->middleware('permission:admin.settings_manage')->name('settings.save');
        Route::post('/publish', [StoreManagerController::class, 'publish'])->middleware('permission:admin.settings_manage')->name('publish');
        Route::post('/unpublish', [StoreManagerController::class, 'unpublish'])->middleware('permission:admin.settings_manage')->name('unpublish');
        Route::post('/intake', [StoreManagerController::class, 'intake'])->middleware('permission:admin.settings_manage')->name('intake');
        Route::get('/products', [StoreManagerController::class, 'products'])->middleware('permission:admin.settings_manage')->name('products');
        Route::post('/products/bulk', [StoreManagerController::class, 'bulkProducts'])->middleware('permission:admin.settings_manage')->name('products.bulk');

        Route::get('/orders', [OrderInboxController::class, 'index'])->middleware('permission:sales.view')->name('orders');
        Route::get('/orders/alerts', [OrderInboxController::class, 'alerts'])->middleware('permission:sales.view')->name('alerts');
        Route::post('/orders/alerts', [OrderInboxController::class, 'alerts'])->middleware('permission:sales.view')->name('alerts.read');
        Route::get('/orders/{id}', [OrderInboxController::class, 'show'])->middleware('permission:sales.view')->name('orders.show');
        Route::post('/orders/{id}/accept', [OrderInboxController::class, 'accept'])->middleware('permission:sales.edit')->name('orders.accept');
        Route::post('/orders/{id}/reject', [OrderInboxController::class, 'reject'])->middleware('permission:sales.edit')->name('orders.reject');
        Route::post('/orders/{id}/advance', [OrderInboxController::class, 'advance'])->middleware('permission:sales.edit')->name('orders.advance');
        Route::post('/orders/{id}/cancel', [OrderInboxController::class, 'cancel'])->middleware('permission:sales.void')->name('orders.cancel');
        Route::post('/orders/{id}/collect', [OrderInboxController::class, 'collect'])->middleware('permission:finance.receive_payment')->name('orders.collect');
        Route::post('/orders/{id}/complete', [OrderInboxController::class, 'complete'])->middleware('permission:sales.create')->name('orders.complete');
    });
