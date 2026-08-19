<?php
/*
| STEP 14 — TENANT SNAPSHOT
|
| Proves the build plan's hardest acceptance criterion:
|
|     "existing tenant nav/routes/permissions/reports BYTE-IDENTICAL before
|      and after."
|
| USAGE — on a restored copy of production, never on production:
|
|     php artisan tinker --execute="require 'tools/tenant_snapshot.php';" > before.json
|     php artisan migrate
|     php artisan tinker --execute="require 'tools/tenant_snapshot.php';" > after.json
|     diff before.json after.json
|
| An empty diff is the whole acceptance criterion, evidenced rather than
| asserted.
|
| WHY A SNAPSHOT AND NOT A TEST
| -----------------------------
| A test proves the code behaves on fixtures you wrote. This proves it behaves
| on THE ACTUAL DATA of your actual customers — the messy tenant with 40,000
| products and a plan override nobody remembers creating. Those are the ones
| that break, and they cannot be fixtured because nobody knows they are odd.
|
| WHAT A NON-EMPTY DIFF MEANS
| ---------------------------
| Not necessarily a failure — but ALWAYS a decision. Read every changed line and
| be able to say why it changed. "It's probably fine" is how a customer loses a
| menu item on launch day.
*/

use App\Services\ModuleService;
use App\Services\PlanRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

$snapshot = [];

foreach (DB::table('tenants')->orderBy('id')->get(['id', 'slug', 'plan']) as $row) {
    $tenant = \App\Models\Tenant::withoutGlobalScopes()->find($row->id);

    if (!$tenant) {
        continue;
    }

    app()->instance('current.tenant', $tenant);

    // ── NAV ──────────────────────────────────────────────────────────────────
    // Derived, so this is the real menu a user would see. Sorted so ordering
    // noise never shows up as a false difference.
    $nav = [];

    try {
        foreach (\App\Support\ModuleNavBuilder::build($tenant, null) as $item) {
            $nav[] = $item['route'];
        }
    } catch (\Throwable $e) {
        $nav = ['ERROR: '.$e->getMessage()];
    }

    sort($nav);

    // ── ROUTES the gate would allow ──────────────────────────────────────────
    // The expensive one, and the one that matters most: it is the difference
    // between "the menu looks the same" and "everything is still reachable".
    $reachable = [];

    foreach (array_keys(Route::getRoutes()->getRoutesByName()) as $name) {
        try {
            $owners = \App\Support\ModuleRouteMap::ownersOf($name);

            if ($owners === []) {
                $reachable[] = $name;                     // unclaimed = always open
                continue;
            }

            foreach ($owners as $owner) {
                if (ModuleService::enabled($tenant, $owner)) {
                    $reachable[] = $name;
                    break;
                }
            }
        } catch (\Throwable) {
            $reachable[] = $name;
        }
    }

    sort($reachable);

    // ── FEATURE ENTITLEMENTS ─────────────────────────────────────────────────
    // Step 4 changes these ON PURPOSE — every module becomes free. So expect
    // this section to differ, and check that every difference is false -> true.
    // A true -> false anywhere is a customer losing something they had.
    $features = [];

    try {
        foreach (PlanRepository::featuresFor($tenant) as $key => $allowed) {
            $features[$key] = (bool) $allowed;
        }
        ksort($features);
    } catch (\Throwable $e) {
        $features = ['ERROR' => $e->getMessage()];
    }

    // ── THE FOUR METERS ──────────────────────────────────────────────────────
    // These must NOT move. They are what people pay for.
    $limits = [];

    foreach (['transactions_per_month', 'staff_limit', 'locations', 'sku_limit'] as $meter) {
        $limits[$meter] = PlanRepository::getEffectiveLimit($tenant->id, $tenant->plan ?? 'starter', $meter);
    }

    // ── REPORTS ──────────────────────────────────────────────────────────────
    $reports = [];

    try {
        $reports = \App\Support\ReportModuleMap::visibleFor($tenant);
        sort($reports);
    } catch (\Throwable $e) {
        $reports = ['ERROR: '.$e->getMessage()];
    }

    // ── PERMISSIONS per role ─────────────────────────────────────────────────
    $permissions = [];

    try {
        $permissions = DB::table('tenant_users')
            ->where('tenant_id', $tenant->id)
            ->orderBy('user_id')
            ->pluck('permissions', 'user_id')
            ->map(fn ($p) => is_string($p) ? json_decode($p, true) : $p)
            ->toArray();
    } catch (\Throwable) {
        $permissions = [];
    }

    // ── DATA COUNTS ──────────────────────────────────────────────────────────
    // Nothing here should EVER change. If a row count moves during a
    // configuration migration, stop the launch and find out why.
    $counts = [];

    foreach (['sales', 'products', 'parties', 'journal_entries', 'journal_items', 'stock_movements', 'payments', 'expenses'] as $table) {
        try {
            $counts[$table] = \Illuminate\Support\Facades\Schema::hasTable($table)
                ? DB::table($table)->where('tenant_id', $tenant->id)->count()
                : null;
        } catch (\Throwable) {
            $counts[$table] = null;
        }
    }

    // ── THE LEDGER MUST BALANCE. Before and after. ───────────────────────────
    try {
        $balance = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('je.tenant_id', $tenant->id)
            ->selectRaw('ROUND(SUM(ji.debit) - SUM(ji.credit), 2) AS diff')
            ->value('diff');
    } catch (\Throwable) {
        $balance = null;
    }

    $snapshot[$row->slug] = [
        'plan'            => $row->plan,
        'nav'             => $nav,
        'reachable_count' => count($reachable),
        'reachable'       => $reachable,
        'reports'         => $reports,
        'features'        => $features,
        'meters'          => $limits,
        'permissions'     => $permissions,
        'row_counts'      => $counts,
        'ledger_balance'  => $balance,
    ];
}

echo json_encode($snapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
