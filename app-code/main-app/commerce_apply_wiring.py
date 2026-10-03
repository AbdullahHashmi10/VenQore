# Binary-safe wiring for the Commerce MVP. Idempotent. Run from app-code/main-app.
import sys
def patch(path, fn):
    b = open(path, 'rb').read()
    nb = fn(b)
    if nb != b:
        open(path, 'wb').write(nb)
        print('patched', path)
    else:
        print('already ok', path)

def web(b):
    old = b"    Route::get('/online-store-manager', [\\App\\Http\\Controllers\\OnlineStoreController::class, 'index'])->name('online-store.index');"
    new = b"    Route::get('/online-store-manager', fn () => redirect()->route('store.commerce.home', ['store_slug' => app('current.tenant')->slug]))->name('online-store.index'); // Commerce MVP: see routes/commerce.php"
    if old in b:
        b = b.replace(old, new)
    marker = b"// \xe2\x94\x80\xe2\x94\x80 FALLBACK: 404 for any URL not matched above"
    if b"require __DIR__ . '/commerce.php';" not in b:
        assert marker in b, 'fallback marker not found'
        b = b.replace(marker, "// VenQore Commerce MVP (public shop + merchant online store)\nrequire __DIR__ . '/commerce.php';\n\n".encode() + marker, 1)
    return b

def console(b):
    line = b"\\Illuminate\\Support\\Facades\\Schedule::command('commerce:expire-orders')->everyFiveMinutes();"
    if line in b:
        return b
    if not b.endswith(b"\n"):
        b += b"\n"
    return b + b"\n// Commerce MVP: expire online orders that were never accepted\n" + line + b"\n"

patch('routes/web.php', web)
patch('routes/console.php', console)

def layout(b):
    old = b"'/tools/', '/tools']"
    new = b"'/tools/', '/tools', '/shop', '/order-status/']"
    if b"'/order-status/'" in b:
        return b
    assert old in b, 'public prefix list not found'
    return b.replace(old, new, 1)
patch('resources/js/Layouts/GlobalProviderLayout.jsx', layout)

def console2(b):
    line = b"\\Illuminate\\Support\\Facades\\Schedule::command('commerce:send-notifications')->everyMinute();"
    if line in b:
        return b
    if not b.endswith(b"\n"):
        b += b"\n"
    return b + b"// Commerce MVP: email outbox for new online orders\n" + line + b"\n"
patch('routes/console.php', console2)

def engine(b):
    marker = b"\\App\\Services\\Commerce\\HoldGuard::assertSellable("
    if marker in b:
        return b
    anchor = b"                        // FIFO deduction \xe2\x80\x94 returns array of batch deductions\n"
    assert anchor in b, 'FIFO anchor not found in SaleService'
    new = b"                        // Commerce MVP: never consume stock held by an accepted online order.\n                        \\App\\Services\\Commerce\\HoldGuard::assertSellable((string) $item['product_id'], (string) $data['warehouse_id'], (float) $baseQty, $data['source_order_id'] ?? null);\n\n"
    return b.replace(anchor, new + anchor, 1)
patch('app/Engines/SaleService.php', engine)

def inventory(b):
    """Transfers: keep held stock in place (checked under the batch locks)."""
    nl = b'\r\n' if b'\r\n' in b else b'\n'
    if b"HoldGuard::assertUnderLock(" in b:
        return b
    # remove the earlier, pre-lock guard lines from a previous sync if present
    lines = b.split(nl)
    lines = [l for l in lines if b"HoldGuard::assertSellable(" not in l and b"stock an accepted online order is holding cannot be moved away\n" not in l]
    b = nl.join(lines)
    anchor = b"$totalAvailable = $batches->sum('remaining_qty');"
    assert anchor in b, 'anchor not found in InventoryService'
    i = b.index(anchor)
    ls = b.rfind(nl, 0, i) + len(nl)
    indent = b[ls:i]
    add = indent + b"\\App\\Services\\Commerce\\HoldGuard::assertUnderLock($productId, $fromWarehouseId, (float) $qty, (float) $totalAvailable);"
    j = b.index(nl, i) + len(nl)
    return b[:j] + add + nl + b[j:]
patch('app/Engines/InventoryService.php', inventory)

def fifo(b):
    nl = b'\r\n' if b'\r\n' in b else b'\n'
    if b"HoldGuard::assertUnderLock(" in b:
        return b
    b = b.replace(b"use ($productId, $warehouseId, $qty) {", b"use ($productId, $warehouseId, $qty, $ownOrderId) {", 1)
    b = b.replace(b"        string $saleUom = 'PCS'" + nl + b"    ): array {", b"        string $saleUom = 'PCS'," + nl + b"        ?string $ownOrderId = null" + nl + b"    ): array {", 1)
    anchor = b"$totalAvailable = (float) $batches->sum('remaining_qty');"
    assert anchor in b, 'anchor not found in FifoService'
    i = b.index(anchor)
    j = b.index(nl, i) + len(nl)
    ls = b.rfind(nl, 0, i) + len(nl)
    indent = b[ls:i]
    add = indent + b"\\App\\Services\\Commerce\\HoldGuard::assertUnderLock((string) $productId, (string) $warehouseId, $qty, $totalAvailable, $ownOrderId);"
    return b[:j] + add + nl + b[j:]
patch('app/Engines/FifoService.php', fifo)

def sale_own_order(b):
    nl = b'\r\n' if b'\r\n' in b else b'\n'
    if b"ownOrderId:" in b:
        return b
    anchor = b"saleUom:     $saleUom"
    assert b.count(anchor) >= 1, 'saleUom anchor not found in SaleService'
    i = b.index(anchor, b.index(b"HoldGuard::assertSellable("))
    j = i + len(anchor)
    ls = b.rfind(nl, 0, i) + len(nl)
    indent = b[ls:i]
    return b[:j] + b"," + nl + indent + b"ownOrderId:  $data['source_order_id'] ?? null" + b[j:]
patch('app/Engines/SaleService.php', sale_own_order)

# ---- user-problems audit fixes: server-rendered shop meta + sitemap (anchors from the shared tree) ----
SEO_BLOCK = r'''        // Public online shop pages: real title/description/preview image for crawlers and link previews (WhatsApp, Facebook).
        if ($route->getName() === 'commerce.store' && ! request()->query('preview')) {
            $shop = \App\Models\Commerce\Storefront::where('slug', (string) $route->parameter('slug'))->where('status', 'published')->first();
            if ($shop) {
                $name = $shop->display_name;
                $title = $name . ' — order online';
                $description = \Illuminate\Support\Str::limit(trim(strip_tags((string) ($shop->description ?: ''))) ?: ('Order directly from ' . $name . ' on VenQore.'), 155);
                $image = $shop->banner_path ? \App\Services\Commerce\StorefrontPresenter::mediaUrl($shop->banner_path) : ($shop->logo_path ? \App\Services\Commerce\StorefrontPresenter::mediaUrl($shop->logo_path) : null);
                return [
                    'title' => $title,
                    'description' => $description,
                    'og_image' => $image ?: url('/images/logo.png'),
                    'canonical' => url('/shop/' . $shop->slug),
                    'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem"><h1>' . htmlspecialchars($name) . '</h1><p>' . htmlspecialchars($description) . '</p></main>',
                ];
            }
        }

'''
def seo(b):
    if b"commerce.store" in b:
        return b
    nl = b'\r\n' if b'\r\n' in b else b'\n'
    anchor = b"        // Help Centre articles (2026-09-10)"
    assert anchor in b, 'MarketingSeo anchor not found'
    block = SEO_BLOCK.encode().replace(b'\n', nl)
    return b.replace(anchor, block + anchor, 1)
patch('app/Support/MarketingSeo.php', seo)

SITEMAP_BLOCK = r'''        // 6. Published online shops (public, indexable)
        try {
            foreach (\Illuminate\Support\Facades\DB::table('storefronts')->where('status', 'published')->orderBy('id')->limit(5000)->get(['slug', 'updated_at']) as $shop) {
                $categorized['shops'][] = ['loc' => url('/shop/' . $shop->slug), 'changefreq' => 'weekly', 'priority' => '0.5'];
            }
        } catch (\Throwable $e) {
            // storefronts table not migrated yet: skip
        }

'''
def sitemap(b):
    if b"storefronts" in b:
        return b
    nl = b'\r\n' if b'\r\n' in b else b'\n'
    anchor = b"        return $categorized;"
    assert b.count(anchor) >= 1, 'Sitemap anchor not found'
    i = b.rindex(anchor)
    return b[:i] + SITEMAP_BLOCK.encode().replace(b'\n', nl) + b[i:]
patch('app/Http/Controllers/Marketing/SitemapController.php', sitemap)

# ---- second round: purge schedule + view-only whitelist for closing orders ----
def console2(b):
    line = b"\\Illuminate\\Support\\Facades\\Schedule::command('commerce:purge-customer-data')->dailyAt('03:30');"
    if line in b:
        return b
    nl = b'\r\n' if b'\r\n' in b else b'\n'
    if not b.endswith(nl):
        b += nl
    return b + nl + b"// Commerce: privacy retention for closed online orders" + nl + line + nl
patch('routes/console.php', console2)

def lifecycle(b):
    if b"store.commerce.orders.reject" in b:
        return b
    nl = b'\r\n' if b'\r\n' in b else b'\n'
    anchor = b"'logout'," 
    assert anchor in b, 'lifecycle anchor not found'
    i = b.index(anchor, b.index(b"$allowedRoutes"))
    ls = b.rfind(nl, 0, i) + len(nl)
    indent = b[ls:i]
    add = (nl + indent + b"// Commerce: a locked-out business can still close waiting online orders" + nl + indent + b"'store.commerce.orders.reject'," + nl + indent + b"'store.commerce.orders.cancel',")
    return b[:i+len(anchor)] + add + b[i+len(anchor):]
patch('app/Http/Middleware/SubscriptionLifecycleMiddleware.php', lifecycle)

# ---- offline POS sync: record the sale (goods already left), flag the short online order ----
def sync(b):
    if b"HoldGuard::$offlineSale" in b:
        return b
    nl = b'\r\n' if b'\r\n' in b else b'\n'
    a1 = b"$syncedCount = 0;"
    assert a1 in b, 'SyncController anchor 1 not found'
    i = b.index(a1, b.index(b"function batchOrders"))
    ls = b.rfind(nl, 0, i) + len(nl)
    indent = b[ls:i]
    b = b[:ls] + indent + b"\\App\\Services\\Commerce\\HoldGuard::$offlineSale = true; // Commerce: an offline sale already happened; record it, then flag any short online order" + nl + b[ls:]
    a2 = b"return response()->json(['status' => 'synced', 'count' => $syncedCount]);"
    assert a2 in b, 'SyncController anchor 2 not found'
    j = b.index(a2)
    ls2 = b.rfind(nl, 0, j) + len(nl)
    ind2 = b[ls2:j]
    pre = ind2 + b"\\App\\Services\\Commerce\\HoldGuard::$offlineSale = false;" + nl + ind2 + b"try { \\App\\Services\\Commerce\\HoldGuard::reportConflicts((int) $tenant->id); } catch (\\Throwable $e) { }" + nl
    return b[:ls2] + pre + b[ls2:]
patch('app/Http/Controllers/Api/SyncController.php', sync)

def sync_reset(b):
    nl = b'\r\n' if b'\r\n' in b else b'\n'
    if b.count(b"HoldGuard::$offlineSale = false;") >= 2:
        return b
    anchor = b"Log::error('Offline batch sync transaction failed:"
    assert anchor in b, 'SyncController catch anchor not found'
    i = b.index(anchor)
    ls = b.rfind(nl, 0, i) + len(nl)
    indent = b[ls:i]
    return b[:ls] + indent + b"\\App\\Services\\Commerce\\HoldGuard::$offlineSale = false;" + nl + b[ls:]
patch('app/Http/Controllers/Api/SyncController.php', sync_reset)
