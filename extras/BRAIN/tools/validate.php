<?php
// Offline structural validator — runs the same checks as ModuleRegistryIntegrityTest
// but without Laravel, so it can run here. Route/page existence is NOT checked
// (that needs the app); everything else is.

$modules = require dirname(__DIR__).'/config/modules.php';
$qore    = require dirname(__DIR__).'/config/qore.php';

$PERMS = explode(' ', trim('admin.billing_store admin.data_recovery admin.receipt_print admin.settings_manage admin.settings_view admin.staff_manage admin.staff_view admin.taxes_methods admin.warehouses data.export finance.balances finance.expenses finance.journal finance.receive_payment finance.send_payment finance.transactions inventory.adjust inventory.barcodes inventory.create inventory.delete inventory.edit inventory.transfer inventory.view pos.checkout pos.close_session pos.discounts pos.open_session pos.refund pos.void_item purchases.costs purchases.create purchases.edit purchases.suppliers purchases.view purchases.void records.force_delete reports.audit reports.financial reports.performance reports.stock reports.summary sales.create sales.edit sales.quotations sales.returns sales.view sales.void users.manage vensynq.manage'));
$TERMS = ['customer','supplier','product','service','category','stock','location','sale','purchase','invoice','quotation','order','return','payment','expense','staff','shift','attendance','occupancy','position','job','technician','contract','report','dashboard'];
$CARDS = ['revenue_today','sales_summary','net_profit','expenses','cash_position','revenue_trend','receivables','payables','customer_count','top_customers','low_stock','inventory_value','top_products','recent_purchases','open_orders','production_output','active_staff','needs_attention','quick_actions','ai_insights'];

$err = []; $warn = [];
$deny = $qore['denylist'];

// 1. count + ids
$n = count($modules);
if ($n !== 46) $err[] = "Module count is {$n}, expected 46.";
$ids = array_column($modules, 'id');
if (count(array_unique($ids)) !== $n) $err[] = "Duplicate module ids.";
sort($ids);
if ($ids !== range(1, 46)) $err[] = "IDs are not exactly 1..46: got ".implode(',', $ids);

$required_fields = ['id','group','label','description','requires','requires_one','enhances','routes','pages','permissions','cards','terms','nav','aliases','billing','legacy_gate','status','verify','features','opens','owns_data','history_probe'];

foreach ($modules as $key => $m) {
    foreach ($required_fields as $f) {
        if (!array_key_exists($f, $m)) $err[] = "{$key}: missing field '{$f}'";
    }
    // 2. Qore leak — key
    if (in_array($key, $deny, true)) $err[] = "TIER 0 LEAK: module key '{$key}' is on the Qore denylist.";
    // 3. Qore leak — aliases
    foreach ($m['aliases'] as $a) {
        $slug = str_replace([' ', '-'], '_', strtolower($a));
        if (in_array($slug, $deny, true)) $warn[] = "{$key}: alias '{$a}' collides with the Qore denylist (allowed, but the AI prompt must state it is not switchable).";
    }
    // 4. deps exist + not Qore
    $deps = array_merge($m['requires'], $m['enhances']);
    foreach ($m['requires_one'] as $set) { $deps = array_merge($deps, $set); }
    foreach ($deps as $d) {
        if (!isset($modules[$d])) $err[] = "{$key}: unknown dependency '{$d}'";
        if (in_array($d, $deny, true)) $err[] = "TIER 0 LEAK: {$key} depends on Qore key '{$d}'";
    }
    // 5. aliases >= 6 (guide says 6-10)
    $ac = count($m['aliases']);
    if ($ac < 6) $err[] = "{$key}: only {$ac} aliases (need >= 6)";
    if ($ac > 12) $warn[] = "{$key}: {$ac} aliases (guide targets 6-10)";
    // 6. permissions/terms/cards real
    foreach ($m['permissions'] as $p) if (!in_array($p, $PERMS, true)) $err[] = "{$key}: unknown permission '{$p}'";
    foreach ($m['terms'] as $t) if (!in_array($t, $TERMS, true)) $err[] = "{$key}: unknown term key '{$t}' (Terms.php has 25 keys; 'composition' is NOT one of them yet)";
    foreach ($m['cards'] as $c) if (!in_array($c, $CARDS, true)) $err[] = "{$key}: unknown dashboard card '{$c}'";
    // 7. status
    if (!in_array($m['status'], ['live','beta','building','planned','retired'], true)) $err[] = "{$key}: bad status '{$m['status']}'";
    if ($m['status'] === 'NEEDS_VALIDATION') $err[] = "{$key}: NEEDS_VALIDATION must never ship";
    // 8. billing
    if (!in_array($m['billing'], ['included','metered','addon'], true)) $err[] = "{$key}: bad billing '{$m['billing']}'";
    // 9. live modules must have a surface
    if ($m['status'] === 'live' && !$m['routes']) $err[] = "{$key}: status live but owns no routes";
    if ($m['status'] === 'live' && !$m['nav'] && !$m['cards']) $warn[] = "{$key}: live with no nav and no cards — user cannot see the effect of toggling it (allowed only for deliberate sub-surfaces).";
    // 10. nav route must be inside its own routes patterns (loose check)
    foreach ($m['nav'] as $nav) {
        $ok = false;
        foreach ($m['routes'] as $pat) {
            $re = '/^'.str_replace(['.', '*'], ['\.', '.*'], $pat).'$/';
            if (preg_match($re, $nav['route'])) { $ok = true; break; }
        }
        if (!$ok) $warn[] = "{$key}: nav route '{$nav['route']}' is not matched by this module's own route patterns — the gate may block its own nav item.";
    }
}

// 11. cycles + depth over 'requires'
function depth(array $modules, string $key, array $seen = []): int {
    if (in_array($key, $seen, true)) throw new RuntimeException("CYCLE: ".implode(' -> ', array_merge($seen, [$key])));
    $seen[] = $key;
    $max = 0;
    foreach ($modules[$key]['requires'] as $r) {
        if (!isset($modules[$r])) continue;
        $max = max($max, 1 + depth($modules, $r, $seen));
    }
    return $max;
}
$maxDepth = 0; $deepest = '';
foreach ($modules as $k => $m) {
    try { $d = depth($modules, $k); if ($d > $maxDepth) { $maxDepth = $d; $deepest = $k; } }
    catch (RuntimeException $e) { $err[] = $e->getMessage(); }
}
if ($maxDepth > 4) $err[] = "Max requires-depth is {$maxDepth} ({$deepest}); plan allows 4.";

// 12. beta/building budget
$nonLive = array_keys(array_filter($modules, fn($m) => $m['status'] !== 'live'));
if (count($nonLive) > 5) $err[] = "Too many non-live modules (".count($nonLive)."): ".implode(', ', $nonLive);

// 13. billing promise
$included = count(array_filter($modules, fn($m) => $m['billing'] === 'included'));
$exceptions = array_keys(array_filter($modules, fn($m) => $m['billing'] !== 'included'));

// report
echo "MODULES: {$n}\n";
echo "MAX REQUIRES DEPTH: {$maxDepth} (deepest: {$deepest})\n";
echo "INCLUDED ON EVERY PLAN: {$included}   EXCEPTIONS: ".implode(', ', $exceptions)."\n";
echo "NON-LIVE: ".implode(', ', array_map(fn($k) => "{$k}({$modules[$k]['status']})", $nonLive))."\n";
$openVerify = array_sum(array_map(fn($m) => count($m['verify']), $modules));
echo "OPEN VERIFY ITEMS: {$openVerify}\n";
$feat = []; foreach ($modules as $m) $feat = array_merge($feat, $m['features']);
echo "CATALOG FEATURES MAPPED: ".count(array_unique($feat))." unique\n";
echo "\n";
if ($err)  { echo "ERRORS (".count($err)."):\n - ".implode("\n - ", $err)."\n\n"; }
else       { echo "ERRORS: none\n\n"; }
if ($warn) { echo "WARNINGS (".count($warn)."):\n - ".implode("\n - ", $warn)."\n"; }
exit($err ? 1 : 0);
