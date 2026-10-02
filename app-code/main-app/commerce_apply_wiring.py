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
