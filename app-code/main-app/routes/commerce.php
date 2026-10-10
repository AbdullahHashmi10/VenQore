<?php

use App\Http\Controllers\Commerce\OrderInboxController;
use App\Http\Controllers\Commerce\PublicStoreController;
use App\Http\Controllers\Commerce\PromotionsController;
use App\Http\Controllers\Commerce\StoreManagerController;
use App\Http\Controllers\Commerce\OnsiteCatalogueController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| VenQore Commerce MVP
|--------------------------------------------------------------------------
| Public (guest) surface first — no ambient tenant, throttled, allow-listed projections.
*/
Route::get('/shop', [PublicStoreController::class, 'directory'])->name('commerce.directory');
Route::get('/shop/{slug}', [\App\Http\Controllers\Commerce\StorefrontPagesController::class, 'home'])->where('slug', '[a-z0-9-]+')->name('commerce.store');
Route::get('/shop/{slug}/products', [\App\Http\Controllers\Commerce\StorefrontPagesController::class, 'products'])->where('slug', '[a-z0-9-]+')->name('commerce.store.products');
Route::get('/shop/{slug}/p/{id}', [\App\Http\Controllers\Commerce\StorefrontPagesController::class, 'product'])->where(['slug' => '[a-z0-9-]+', 'id' => '[A-Za-z0-9-]{8,40}'])->name('commerce.store.product');
Route::get('/shop/{slug}/cart', [\App\Http\Controllers\Commerce\StorefrontPagesController::class, 'cart'])->where('slug', '[a-z0-9-]+')->name('commerce.store.cart');
Route::get('/catalogue/{slug}', [PublicStoreController::class, 'onsiteCounter'])->where('slug', '[a-z0-9-]+')->name('commerce.onsite.counter');
Route::get('/catalogue/{slug}/table/{token}', [PublicStoreController::class, 'onsiteTable'])->where(['slug' => '[a-z0-9-]+', 'token' => '[A-Za-z0-9]{40}'])->name('commerce.onsite.table');
Route::post('/catalogue/{slug}/orders', [PublicStoreController::class, 'placeOnsiteOrder'])->where('slug', '[a-z0-9-]+')->middleware('throttle:20,1')->name('commerce.onsite.order');
Route::get('/catalogue/{slug}/order/{number}', [PublicStoreController::class, 'onsiteOrderStatus'])->where(['slug' => '[a-z0-9-]+', 'number' => 'SO-[0-9]{6}-[A-Z0-9]{5}'])->middleware('throttle:90,1')->name('commerce.onsite.status');
Route::post('/catalogue/{slug}/call', [PublicStoreController::class, 'onsiteCall'])->where('slug', '[a-z0-9-]+')->middleware('throttle:6,1')->name('commerce.onsite.call');
Route::get('/onsite/{slug}', fn (string $slug) => redirect('/catalogue/' . $slug, 301))->where('slug', '[a-z0-9-]+');
Route::get('/onsite/{slug}/table/{token}', fn (string $slug, string $token) => redirect('/catalogue/' . $slug . '/table/' . $token, 301))->where(['slug' => '[a-z0-9-]+', 'token' => '[A-Za-z0-9]{40}']);
Route::post('/shop/{slug}/quote', [PublicStoreController::class, 'quote'])->where('slug', '[a-z0-9-]+')->middleware('throttle:60,1')->name('commerce.quote');
Route::post('/shop/{slug}/checkout', [PublicStoreController::class, 'placeOrder'])->where('slug', '[a-z0-9-]+')->middleware('throttle:10,1')->name('commerce.checkout');
Route::get('/order-status/{token}', [PublicStoreController::class, 'status'])->middleware('throttle:60,1')->name('commerce.order-status');
Route::get('/order-status/{token}/live', [PublicStoreController::class, 'liveStatus'])->middleware('throttle:30,1')->name('commerce.order-status.live');
Route::get('/order-status/{token}/reorder', [PublicStoreController::class, 'reorder'])->middleware('throttle:30,1')->name('commerce.order-status.reorder');
Route::post('/order-status/{token}/revision', [PublicStoreController::class, 'answerRevision'])->middleware('throttle:10,1')->name('commerce.order-status.revision');
Route::post('/order-status/{token}/cancel', [PublicStoreController::class, 'cancel'])->middleware('throttle:10,1')->name('commerce.order-status.cancel');
Route::get('/book/{slug}', [\App\Http\Controllers\Commerce\BookingController::class, 'show'])->where('slug', '[a-z0-9-]+')->name('commerce.book');
Route::post('/book/{slug}', [\App\Http\Controllers\Commerce\BookingController::class, 'store'])->where('slug', '[a-z0-9-]+')->middleware('throttle:8,1')->name('commerce.book.submit');
Route::get('/rider/{token}', [\App\Http\Controllers\Commerce\RiderPortalController::class, 'show'])->where('token', '[A-Za-z0-9]{48}')->middleware('throttle:60,1')->name('commerce.rider');
Route::post('/rider/{token}/step', [\App\Http\Controllers\Commerce\RiderPortalController::class, 'step'])->where('token', '[A-Za-z0-9]{48}')->middleware('throttle:60,1')->name('commerce.rider.step');
Route::get('/order-lookup', [PublicStoreController::class, 'lookupForm'])->name('commerce.order-lookup');
Route::post('/order-lookup', [PublicStoreController::class, 'lookup'])->middleware('throttle:6,1')->name('commerce.order-lookup.find');
Route::post('/shop/{slug}/customer/login', [PublicStoreController::class, 'customerLogin'])->where('slug', '[a-z0-9-]+')->middleware('throttle:30,1')->name('commerce.customer.login');
Route::post('/shop/{slug}/customer/logout', [PublicStoreController::class, 'customerLogout'])->where('slug', '[a-z0-9-]+')->name('commerce.customer.logout');
Route::post('/shop/{slug}/reserve', [\App\Http\Controllers\Commerce\TableRequestController::class, 'store'])->where('slug', '[a-z0-9-]+')->middleware('throttle:6,1')->name('commerce.reserve');
Route::post('/shop/{slug}/rate', [PublicStoreController::class, 'submitRating'])->where('slug', '[a-z0-9-]+')->middleware('throttle:20,1')->name('commerce.rate');
Route::get('/shop/{slug}/customer/orders', [PublicStoreController::class, 'customerOrders'])->where('slug', '[a-z0-9-]+')->name('commerce.customer.orders');
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
        Route::get('/', [StoreManagerController::class, 'home'])->middleware('permission:online.store_manage,online.catalogue_manage,online.products_manage,online.promotions_manage,online.orders_view')->name('home');
        Route::get('/settings', [StoreManagerController::class, 'settings'])->middleware('permission:online.store_manage,online.catalogue_manage')->name('settings');
        Route::post('/settings', [StoreManagerController::class, 'saveSettings'])->middleware('permission:online.store_manage,online.catalogue_manage')->name('settings.save');
        Route::post('/publish', [StoreManagerController::class, 'publish'])->middleware('permission:online.store_manage')->name('publish');
        Route::post('/unpublish', [StoreManagerController::class, 'unpublish'])->middleware('permission:online.store_manage')->name('unpublish');
        Route::post('/intake', [StoreManagerController::class, 'intake'])->middleware('permission:online.store_manage')->name('intake');
        Route::get('/catalogue', [OnsiteCatalogueController::class, 'setup'])->middleware('permission:online.catalogue_manage')->name('catalogue');
        Route::post('/catalogue', [OnsiteCatalogueController::class, 'save'])->middleware('permission:online.catalogue_manage')->name('catalogue.save');
        Route::get('/catalogue/cards', [OnsiteCatalogueController::class, 'cards'])->middleware('permission:online.catalogue_manage')->name('catalogue.cards');
        Route::post('/catalogue/table/{position}/toggle', [OnsiteCatalogueController::class, 'tableToggle'])->whereNumber('position')->middleware('permission:online.catalogue_manage')->name('catalogue.table.toggle');
        Route::post('/catalogue/table/{position}/regenerate', [OnsiteCatalogueController::class, 'tableRegenerate'])->whereNumber('position')->middleware('permission:online.catalogue_manage')->name('catalogue.table.regenerate');
        Route::get('/catalogue/qr.svg', [OnsiteCatalogueController::class, 'qr'])->middleware('permission:online.catalogue_manage')->name('catalogue.qr');
        Route::post('/page-images', [\App\Http\Controllers\Commerce\PageImagesController::class, 'storeUpload'])->middleware('permission:online.store_manage')->name('page-images.upload');
        Route::post('/page-images/remove', [\App\Http\Controllers\Commerce\PageImagesController::class, 'storeRemove'])->middleware('permission:online.store_manage')->name('page-images.remove');
        Route::get('/products', [StoreManagerController::class, 'products'])->middleware('permission:online.products_manage')->name('products');
        Route::post('/products/{product}/photo', [StoreManagerController::class, 'productPhoto'])->middleware('permission:online.products_manage')->name('products.photo');
        Route::post('/products/bulk', [StoreManagerController::class, 'bulkProducts'])->middleware('permission:online.products_manage')->name('products.bulk');

        Route::post('/orders/{id}/block-phone', [OrderInboxController::class, 'blockPhone'])->middleware('permission:online.orders_manage')->name('orders.block');

        Route::get('/promotions', [PromotionsController::class, 'index'])->middleware('permission:online.promotions_manage')->name('promotions');
        Route::post('/promotions', [PromotionsController::class, 'save'])->middleware('permission:online.promotions_manage')->name('promotions.save');
        Route::post('/promotions/{id}/toggle', [PromotionsController::class, 'toggle'])->middleware('permission:online.promotions_manage')->name('promotions.toggle');
        Route::delete('/promotions/{id}', [PromotionsController::class, 'destroy'])->middleware('permission:online.promotions_manage')->name('promotions.destroy');

        Route::get('/deliveries', [\App\Http\Controllers\Commerce\DeliveryController::class, 'index'])->middleware('permission:online.orders_view')->name('deliveries');
        Route::post('/deliveries/assign', [\App\Http\Controllers\Commerce\DeliveryController::class, 'assign'])->middleware('permission:online.orders_manage')->name('deliveries.assign');
        Route::post('/deliveries/{id}/returned', [\App\Http\Controllers\Commerce\DeliveryController::class, 'returned'])->middleware('permission:online.orders_manage')->name('deliveries.returned');
        Route::post('/deliveries/{id}/ack-cash', [\App\Http\Controllers\Commerce\DeliveryController::class, 'acknowledgeCash'])->middleware('permission:online.orders_collect')->name('deliveries.ack-cash');
        Route::post('/riders/{employee}/account', [\App\Http\Controllers\Commerce\DeliveryController::class, 'linkLogin'])->middleware('permission:online.orders_manage')->name('riders.account');
        Route::get('/my-rides', [\App\Http\Controllers\Commerce\RiderPortalController::class, 'mine'])->middleware('permission:online.rider_deliveries')->name('my-rides');
        Route::post('/my-rides/step', [\App\Http\Controllers\Commerce\RiderPortalController::class, 'mineStep'])->middleware('permission:online.rider_deliveries')->name('my-rides.step');
        Route::post('/riders/{employee}/profile', [\App\Http\Controllers\Commerce\DeliveryController::class, 'riderProfile'])->middleware('permission:online.orders_manage')->name('riders.profile');
        Route::post('/riders/{employee}/link', [\App\Http\Controllers\Commerce\DeliveryController::class, 'riderLink'])->middleware('permission:online.orders_manage')->name('riders.link');

        Route::get('/orders', [OrderInboxController::class, 'index'])->middleware('permission:online.orders_view')->name('orders');
        Route::get('/orders/alerts', [OrderInboxController::class, 'alerts'])->middleware('permission:online.orders_view')->name('alerts');
        Route::post('/orders/alerts', [OrderInboxController::class, 'alerts'])->middleware('permission:online.orders_view')->name('alerts.read');
        Route::get('/orders/{id}', [OrderInboxController::class, 'show'])->middleware('permission:online.orders_view')->name('orders.show');
        Route::post('/orders/{id}/accept', [OrderInboxController::class, 'accept'])->middleware('permission:online.orders_manage')->name('orders.accept');
        Route::post('/orders/{id}/revise', [OrderInboxController::class, 'revise'])->middleware('permission:online.orders_manage')->name('orders.revise');
        Route::post('/orders/{id}/reject', [OrderInboxController::class, 'reject'])->middleware('permission:online.orders_manage')->name('orders.reject');
        Route::post('/orders/{id}/advance', [OrderInboxController::class, 'advance'])->middleware('permission:online.orders_manage')->name('orders.advance');
        Route::post('/orders/{id}/cancel', [OrderInboxController::class, 'cancel'])->middleware('permission:online.orders_cancel')->name('orders.cancel');
        Route::post('/orders/{id}/collect', [OrderInboxController::class, 'collect'])->middleware('permission:online.orders_collect')->name('orders.collect');
        Route::post('/orders/{id}/complete', [OrderInboxController::class, 'complete'])->middleware('permission:online.orders_manage')->name('orders.complete');
    });


/*
| Platform admin: photos on the /shop marketplace, edited in place on /shop?edit=1.
*/
Route::middleware(['auth', 'superadmin'])->prefix('superadmin/marketplace-images')->name('superadmin.marketplace-images.')->group(function () {
    Route::post('/', [\App\Http\Controllers\Commerce\PageImagesController::class, 'marketUpload'])->name('upload');
    Route::post('/remove', [\App\Http\Controllers\Commerce\PageImagesController::class, 'marketRemove'])->name('remove');
});
