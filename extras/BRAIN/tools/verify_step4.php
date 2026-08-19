<?php
/*
| STEP 4 VERIFICATION — run this BEFORE and AFTER the migration, and diff.
|
|     php artisan tinker --execute="require 'tools/verify_step4.php';"
|
| or as a standalone with the framework booted.
|
| WHAT IT PROVES
| --------------
| Before: a table of who can reach what today.
| After:  the same table, where every module row reads YES on every plan, the
|         four meters are untouched, and growth_engine is off on every LTD.
|
| If the "after" run shows a module a plan still cannot use, the migration
| missed a key — most likely an ALIAS. PlanRepository::canUseFeature() rewrites
| several feature names before it looks them up (compositions ->
| bill_of_materials, stock_valuation -> report_stock_valuation, and others), so
| a key can look free in plan_limits and still be denied under its alias.
*/

use App\Services\PlanRepository;
use Illuminate\Support\Facades\DB;

$plans = DB::table('plans')->orderBy('id')->pluck('slug')->all();

// Every legacy_gate the module registry declares, plus the aliases the gate
// resolves internally. Testing the registry keys alone would miss the aliases.
$moduleGates = collect(config('modules', []))
    ->pluck('legacy_gate')
    ->filter()
    ->unique()
    ->values()
    ->all();

$aliases = ['compositions', 'bill_of_materials', 'stock_valuation', 'report_stock_valuation',
            'cash_flow_report', 'report_cash_flow', 'aged_receivables', 'report_sales_aging',
            'profit_loss', 'report_profit_loss', 'trial_balance', 'report_trial_balance'];

$keys = array_values(array_unique(array_merge($moduleGates, $aliases)));

$meters = ['transactions_per_month', 'staff_limit', 'locations', 'sku_limit'];
$exceptions = ['growth_engine', 'woocommerce', 'api_access'];

// A representative tenant per plan. canUseFeature() takes a Tenant, not a slug,
// because some rules are tenant-specific (BYOK AI keys, the cafe/Cookbook
// industry exception) — checking plan_limits directly would miss those.
$sample = [];
foreach ($plans as $slug) {
    $tenant = \App\Models\Tenant::withoutGlobalScopes()->where('plan', $slug)->first();
    if ($tenant) {
        $sample[$slug] = $tenant;
    }
}

echo "\n== MODULE GATES (every cell should read YES after Step 4) ==\n\n";
printf("%-26s", 'feature');
foreach (array_keys($sample) as $slug) {
    printf("%-10s", $slug);
}
echo "\n".str_repeat('-', 26 + 10 * count($sample))."\n";

$denied = [];

foreach ($keys as $key) {
    printf("%-26s", substr($key, 0, 25));
    foreach ($sample as $slug => $tenant) {
        $ok = PlanRepository::canUseFeature($tenant, $key);
        printf("%-10s", $ok ? 'yes' : 'NO');
        if (!$ok) {
            $denied[] = "{$slug}:{$key}";
        }
    }
    echo "\n";
}

echo "\n== THE FOUR METERS (must be UNCHANGED — these are what people pay for) ==\n\n";
printf("%-26s", 'meter');
foreach (array_keys($sample) as $slug) {
    printf("%-10s", $slug);
}
echo "\n".str_repeat('-', 26 + 10 * count($sample))."\n";

foreach ($meters as $meter) {
    printf("%-26s", $meter);
    foreach ($sample as $slug => $tenant) {
        $v = PlanRepository::getEffectiveLimit($tenant->id, $slug, $meter);
        printf("%-10s", $v === null ? 'unlim' : (string) $v);
    }
    echo "\n";
}

echo "\n== THE FOUR HONEST EXCEPTIONS (must stay gated) ==\n\n";
foreach ($exceptions as $key) {
    printf("%-26s", $key);
    foreach ($sample as $slug => $tenant) {
        printf("%-10s", PlanRepository::canUseFeature($tenant, $key) ? 'yes' : 'no');
    }
    echo "\n";
}

echo "\n== growth_engine ON LTD (the bug — must be 'no' on all three) ==\n\n";
foreach (['ltd_1', 'ltd_2', 'ltd_3'] as $ltd) {
    if (!isset($sample[$ltd])) {
        echo "  {$ltd}: no tenant on this plan to test\n";
        continue;
    }
    $on = PlanRepository::canUseFeature($sample[$ltd], 'growth_engine');
    echo "  {$ltd}: ".($on ? '⚠️  YES — STILL BROKEN' : 'no — correct')."\n";
}

echo "\n== VERDICT ==\n";
if ($denied === []) {
    echo "  Every module gate is open on every plan. Step 4 is done.\n";
} else {
    echo "  STILL DENIED (".count($denied)."):\n";
    foreach (array_slice($denied, 0, 40) as $d) {
        echo "    - {$d}\n";
    }
    echo "\n  Most likely an alias. Check PlanRepository::canUseFeature()'s \$aliases map\n";
    echo "  and add the resolved name to the migration's NOW_FREE list.\n";
}
echo "\n";
