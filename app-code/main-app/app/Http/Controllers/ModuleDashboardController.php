<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Party;
use App\Models\Payment;
use App\Models\Purchase;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Overview pages for Purchase, Contacts and Money — same idea as the Sell
 * dashboard: headline numbers, one trend, two breakdowns, recent activity.
 * Every block is built defensively: one that can't be computed comes back
 * empty instead of breaking the page.
 */
class ModuleDashboardController extends Controller
{
    private function tz(): string
    {
        return app('current.tenant')->timezone ?: config('app.timezone', 'UTC');
    }

    private function safe(callable $fn, $fallback = [])
    {
        try { return $fn(); } catch (\Throwable $e) { report($e); return $fallback; }
    }

    private function days(array $map, Carbon $today): array
    {
        $out = [];
        for ($i = 29; $i >= 0; $i--) {
            $d = $today->copy()->subDays($i)->format('Y-m-d');
            $out[] = ['x' => $d, 'y' => (float) ($map[$d] ?? 0)];
        }
        return $out;
    }

    private function growth(float $now, float $before): float
    {
        return $before > 0 ? round((($now - $before) / $before) * 100, 1) : ($now > 0 ? 100.0 : 0.0);
    }

    private function partyNames(array $ids): array
    {
        return Party::whereIn('id', array_filter($ids))->pluck('name', 'id')->all();
    }

    public function purchases()
    {
        $tz = $this->tz();
        $today = Carbon::today($tz);
        $monthStart = $today->copy()->startOfMonth();
        $lastStart = $today->copy()->subMonth()->startOfMonth();
        $lastEnd = $today->copy()->subMonth()->endOfMonth();
        $slug = app('current.tenant')->slug;
        $tid = app('current.tenant')->id;
        $m0 = $monthStart->toDateString();
        $t0 = $today->toDateString();

        $month = (float) $this->safe(fn () => Purchase::whereBetween('purchase_date', [$m0, $t0])->sum('total'), 0);
        $last = (float) $this->safe(fn () => Purchase::whereBetween('purchase_date', [$lastStart->toDateString(), $lastEnd->toDateString()])->sum('total'), 0);
        $todayTotal = (float) $this->safe(fn () => Purchase::whereDate('purchase_date', $t0)->sum('total'), 0);
        $monthCount = (int) $this->safe(fn () => Purchase::whereBetween('purchase_date', [$m0, $t0])->count(), 0);
        $open = $this->safe(fn () => Purchase::where('payment_status', '!=', 'paid')->selectRaw('COUNT(*) c, COALESCE(SUM(total),0) t')->first(), null);

        $trendMap = $this->safe(fn () => Purchase::where('purchase_date', '>=', $today->copy()->subDays(29)->toDateString())
            ->selectRaw('DATE(purchase_date) d, SUM(total) t')->groupBy('d')->pluck('t', 'd')->all(), []);

        $byStatus = $this->safe(fn () => Purchase::whereBetween('purchase_date', [$m0, $t0])
            ->selectRaw('payment_status s, SUM(total) t')->groupBy('s')->get()
            ->map(fn ($r) => ['name' => ucfirst((string) ($r->s ?: 'unpaid')), 'value' => (float) $r->t])->values()->all());

        $suppliers = $this->safe(function () use ($m0, $t0) {
            $rows = Purchase::whereBetween('purchase_date', [$m0, $t0])
                ->selectRaw('party_id, COUNT(*) c, SUM(total) t')->groupBy('party_id')->orderByDesc('t')->take(8)->get();
            $names = $this->partyNames($rows->pluck('party_id')->all());
            return $rows->map(fn ($r) => ['label' => $names[$r->party_id] ?? 'Unknown supplier', 'value' => (float) $r->t, 'sub' => $r->c . ' bills'])->values()->all();
        });

        $items = $this->safe(fn () => DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->join('products', 'purchase_items.product_id', '=', 'products.id')
            ->where('purchases.tenant_id', $tid)
            ->whereBetween('purchases.purchase_date', [$m0, $t0])
            ->selectRaw('products.name, SUM(purchase_items.qty) q, SUM(purchase_items.line_total) t')
            ->groupBy('products.id', 'products.name')->orderByDesc('t')->take(8)->get()
            ->map(fn ($r) => ['label' => $r->name, 'value' => (float) $r->t, 'sub' => rtrim(rtrim(number_format((float) $r->q, 2), '0'), '.') . ' units'])->values()->all());

        $recent = $this->safe(function () use ($slug) {
            $rows = Purchase::latest('purchase_date')->latest('created_at')->take(8)->get(['id', 'invoice_number', 'party_id', 'purchase_date', 'total', 'payment_status']);
            $names = $this->partyNames($rows->pluck('party_id')->all());
            return $rows->map(fn ($p) => [
                'id' => $p->id,
                'href' => route('store.purchases.show', ['store_slug' => $slug, 'purchase' => $p->id]),
                'cells' => [
                    'ref' => $p->invoice_number ?: 'Purchase',
                    'party' => $names[$p->party_id] ?? '—',
                    'date' => $p->purchase_date ? Carbon::parse($p->purchase_date)->format('d M Y') : '',
                    'amount' => (float) $p->total,
                    'status' => (string) $p->payment_status,
                ],
            ])->values()->all();
        });

        return Inertia::render('Dashboards/ModuleDashboard', ['dash' => [
            'module' => 'purchase', 'title' => 'Purchase Dashboard', 'activeMenu' => 'Purchase',
            'kpis' => [
                ['label' => 'Purchases today', 'value' => $todayTotal, 'kind' => 'money', 'icon' => 'ShoppingBag', 'tone' => 'brand'],
                ['label' => 'Purchases this month', 'value' => $month, 'kind' => 'money', 'icon' => 'Calendar', 'tone' => 'emerald', 'sub' => $monthCount . ' bills', 'growth' => $this->growth($month, $last), 'growthLabel' => 'vs last month'],
                ['label' => 'Average bill', 'value' => $monthCount > 0 ? round($month / $monthCount) : 0, 'kind' => 'money', 'icon' => 'TrendingUp', 'tone' => 'blue', 'sub' => 'This month'],
                ['label' => 'Open bills', 'value' => (float) ($open->t ?? 0), 'kind' => 'money', 'icon' => 'Clock', 'tone' => 'amber', 'sub' => ((int) ($open->c ?? 0)) . ' unpaid or part-paid'],
            ],
            'trend' => ['title' => 'Purchases trend', 'subtitle' => 'Last 30 days', 'series' => [['name' => 'Purchases', 'points' => $this->days($trendMap, $today)]]],
            'donut' => ['title' => 'Bills by payment status', 'subtitle' => 'This month', 'slices' => $byStatus],
            'rankA' => ['title' => 'Top suppliers', 'subtitle' => 'This month', 'icon' => 'Truck', 'items' => $suppliers, 'money' => true, 'empty' => 'No purchases this month'],
            'rankB' => ['title' => 'Most purchased items', 'subtitle' => 'This month', 'icon' => 'Package', 'items' => $items, 'money' => true, 'empty' => 'No items purchased this month'],
            'recent' => [
                'title' => 'Recent purchases',
                'viewAll' => route('store.purchases.index', ['store_slug' => $slug]),
                'columns' => [['key' => 'ref', 'label' => 'Reference', 'kind' => 'link'], ['key' => 'party', 'label' => 'Supplier'], ['key' => 'date', 'label' => 'Date'], ['key' => 'amount', 'label' => 'Amount', 'kind' => 'money', 'align' => 'right'], ['key' => 'status', 'label' => 'Status', 'kind' => 'status', 'align' => 'right']],
                'rows' => $recent, 'empty' => 'No purchases yet',
            ],
        ]]);
    }

    public function contacts()
    {
        $tz = $this->tz();
        $today = Carbon::today($tz);
        $monthStart = $today->copy()->startOfMonth()->utc();
        $slug = app('current.tenant')->slug;

        $total = (int) $this->safe(fn () => Party::count(), 0);
        $customers = (int) $this->safe(fn () => Party::where('type', 'customer')->count(), 0);
        $suppliers = (int) $this->safe(fn () => Party::where('type', 'supplier')->count(), 0);
        $newThisMonth = (int) $this->safe(fn () => Party::where('created_at', '>=', $monthStart)->count(), 0);
        $receivable = (float) $this->safe(fn () => Party::where('current_balance', '>', 0)->sum('current_balance'), 0);
        $payable = abs((float) $this->safe(fn () => Party::where('current_balance', '<', 0)->sum('current_balance'), 0));

        $trendMap = $this->safe(fn () => Party::where('created_at', '>=', $today->copy()->subDays(29)->startOfDay()->utc())
            ->selectRaw('DATE(created_at) d, COUNT(*) c')->groupBy('d')->pluck('c', 'd')->all(), []);

        $debtors = $this->safe(fn () => Party::where('current_balance', '>', 0)->orderByDesc('current_balance')->take(8)->get(['name', 'current_balance', 'phone'])
            ->map(fn ($p) => ['label' => $p->name, 'value' => (float) $p->current_balance, 'sub' => $p->phone ?: ''])->values()->all());
        $creditors = $this->safe(fn () => Party::where('current_balance', '<', 0)->orderBy('current_balance')->take(8)->get(['name', 'current_balance', 'phone'])
            ->map(fn ($p) => ['label' => $p->name, 'value' => abs((float) $p->current_balance), 'sub' => $p->phone ?: ''])->values()->all());

        $recent = $this->safe(fn () => Party::latest()->take(8)->get(['id', 'name', 'type', 'phone', 'current_balance', 'created_at'])
            ->map(fn ($p) => [
                'id' => $p->id,
                'href' => route('store.parties.index', ['store_slug' => $slug, 'search' => $p->name]),
                'cells' => [
                    'name' => $p->name, 'type' => ucfirst((string) $p->type), 'phone' => $p->phone ?: '—',
                    'added' => optional($p->created_at)->timezone($tz)->format('d M Y'),
                    'balance' => (float) $p->current_balance,
                ],
            ])->values()->all());

        $typeSlices = array_values(array_filter([
            ['name' => 'Customers', 'value' => $customers], ['name' => 'Suppliers', 'value' => $suppliers],
            ['name' => 'Other', 'value' => max(0, $total - $customers - $suppliers)],
        ], fn ($s) => $s['value'] > 0));

        return Inertia::render('Dashboards/ModuleDashboard', ['dash' => [
            'module' => 'contacts', 'title' => 'Contacts Dashboard', 'activeMenu' => 'Contacts',
            'kpis' => [
                ['label' => 'All contacts', 'value' => $total, 'kind' => 'count', 'icon' => 'Users', 'tone' => 'brand', 'sub' => $customers . ' customers · ' . $suppliers . ' suppliers'],
                ['label' => 'New this month', 'value' => $newThisMonth, 'kind' => 'count', 'icon' => 'UserPlus', 'tone' => 'emerald'],
                ['label' => 'To receive', 'value' => $receivable, 'kind' => 'money', 'icon' => 'ArrowDownToLine', 'tone' => 'blue', 'sub' => 'Owed by customers'],
                ['label' => 'To pay', 'value' => $payable, 'kind' => 'money', 'icon' => 'ArrowUpFromLine', 'tone' => 'amber', 'sub' => 'Owed to suppliers'],
            ],
            'trend' => ['title' => 'New contacts', 'subtitle' => 'Last 30 days', 'count' => true, 'series' => [['name' => 'New contacts', 'points' => $this->days($trendMap, $today)]]],
            'donut' => ['title' => 'Contacts by type', 'subtitle' => 'All time', 'count' => true, 'slices' => $typeSlices],
            'rankA' => ['title' => 'Customers who owe you', 'subtitle' => 'Largest balances', 'icon' => 'ArrowDownToLine', 'items' => $debtors, 'money' => true, 'empty' => 'Nobody owes you right now'],
            'rankB' => ['title' => 'Suppliers you owe', 'subtitle' => 'Largest balances', 'icon' => 'ArrowUpFromLine', 'items' => $creditors, 'money' => true, 'empty' => 'You owe nobody right now'],
            'recent' => [
                'title' => 'Recently added', 'viewAll' => route('store.parties.index', ['store_slug' => $slug]),
                'columns' => [['key' => 'name', 'label' => 'Name', 'kind' => 'link'], ['key' => 'type', 'label' => 'Type'], ['key' => 'phone', 'label' => 'Phone'], ['key' => 'added', 'label' => 'Added'], ['key' => 'balance', 'label' => 'Balance', 'kind' => 'money', 'align' => 'right']],
                'rows' => $recent, 'empty' => 'No contacts yet',
            ],
        ]]);
    }

    public function money()
    {
        $tz = $this->tz();
        $today = Carbon::today($tz);
        $slug = app('current.tenant')->slug;
        $m0 = $today->copy()->startOfMonth()->toDateString();
        $t0 = $today->toDateString();
        $isIn = ['in', 'received'];
        $isOut = ['out', 'sent'];

        $sum = fn (array $types, string $from, string $to) => (float) $this->safe(fn () => Payment::whereIn('type', $types)->whereBetween('date', [$from, $to])->sum('amount'), 0);
        $inToday = $sum($isIn, $t0, $t0);
        $outToday = $sum($isOut, $t0, $t0);
        $inMonth = $sum($isIn, $m0, $t0);
        $outMonth = $sum($isOut, $m0, $t0);
        $expMonth = (float) $this->safe(fn () => Expense::whereBetween('date', [$m0, $t0])->sum('amount'), 0);
        $receivable = (float) $this->safe(fn () => Party::where('current_balance', '>', 0)->sum('current_balance'), 0);
        $payable = abs((float) $this->safe(fn () => Party::where('current_balance', '<', 0)->sum('current_balance'), 0));

        $from30 = $today->copy()->subDays(29)->toDateString();
        $series = fn (array $types) => $this->days($this->safe(fn () => Payment::whereIn('type', $types)->where('date', '>=', $from30)
            ->selectRaw('DATE(date) d, SUM(amount) t')->groupBy('d')->pluck('t', 'd')->all(), []), $today);

        $methods = $this->safe(fn () => Payment::whereIn('type', $isIn)->whereBetween('date', [$m0, $t0])
            ->selectRaw('method m, SUM(amount) t')->groupBy('m')->get()
            ->map(fn ($r) => ['name' => ucfirst(str_replace('_', ' ', (string) ($r->m ?: 'other'))), 'value' => (float) $r->t])->values()->all());

        $expenses = $this->safe(fn () => Expense::whereBetween('date', [$m0, $t0])
            ->selectRaw("COALESCE(category, 'Uncategorised') c, COUNT(*) n, SUM(amount) t")->groupBy('c')->orderByDesc('t')->take(8)->get()
            ->map(fn ($r) => ['label' => $r->c, 'value' => (float) $r->t, 'sub' => $r->n . ' entries'])->values()->all());

        $parties = $this->safe(function () use ($m0, $t0, $isIn) {
            $rows = Payment::whereIn('type', $isIn)->whereBetween('date', [$m0, $t0])->whereNotNull('party_id')
                ->selectRaw('party_id, COUNT(*) n, SUM(amount) t')->groupBy('party_id')->orderByDesc('t')->take(8)->get();
            $names = $this->partyNames($rows->pluck('party_id')->all());
            return $rows->map(fn ($r) => ['label' => $names[$r->party_id] ?? 'Unknown', 'value' => (float) $r->t, 'sub' => $r->n . ' payments'])->values()->all();
        });

        $recent = $this->safe(function () use ($isIn) {
            $rows = Payment::latest('date')->latest('created_at')->take(8)->get(['id', 'party_id', 'amount', 'date', 'method', 'type']);
            $names = $this->partyNames($rows->pluck('party_id')->all());
            return $rows->map(fn ($p) => [
                'id' => $p->id, 'href' => null,
                'cells' => [
                    'date' => $p->date ? Carbon::parse($p->date)->format('d M Y') : '',
                    'party' => $names[$p->party_id] ?? '—',
                    'method' => ucfirst(str_replace('_', ' ', (string) $p->method)),
                    'direction' => in_array($p->type, $isIn) ? 'In' : 'Out',
                    'amount' => (float) $p->amount,
                ],
            ])->values()->all();
        });

        $net = $inMonth - $outMonth;
        return Inertia::render('Dashboards/ModuleDashboard', ['dash' => [
            'module' => 'money', 'title' => 'Money Dashboard', 'activeMenu' => 'Money',
            'kpis' => [
                ['label' => 'Money in today', 'value' => $inToday, 'kind' => 'money', 'icon' => 'ArrowDownToLine', 'tone' => 'emerald', 'valueTone' => 'emerald'],
                ['label' => 'Money out today', 'value' => $outToday, 'kind' => 'money', 'icon' => 'ArrowUpFromLine', 'tone' => 'amber'],
                ['label' => 'Net this month', 'value' => $net, 'kind' => 'money', 'icon' => 'Wallet', 'tone' => 'brand', 'valueTone' => $net < 0 ? 'rose' : null, 'sub' => 'In minus out'],
                ['label' => 'Expenses this month', 'value' => $expMonth, 'kind' => 'money', 'icon' => 'Receipt', 'tone' => 'rose'],
                ['label' => 'To receive', 'value' => $receivable, 'kind' => 'money', 'icon' => 'TrendingUp', 'tone' => 'blue', 'sub' => 'Owed by customers'],
                ['label' => 'To pay', 'value' => $payable, 'kind' => 'money', 'icon' => 'TrendingDown', 'tone' => 'violet', 'sub' => 'Owed to suppliers'],
            ],
            'trend' => ['title' => 'Money in and out', 'subtitle' => 'Last 30 days', 'series' => [['name' => 'Money in', 'points' => $series($isIn)], ['name' => 'Money out', 'points' => $series($isOut)]]],
            'donut' => ['title' => 'Money in by method', 'subtitle' => 'This month', 'slices' => $methods],
            'rankA' => ['title' => 'Where the expenses went', 'subtitle' => 'This month', 'icon' => 'Receipt', 'items' => $expenses, 'money' => true, 'empty' => 'No expenses this month'],
            'rankB' => ['title' => 'Who paid you most', 'subtitle' => 'This month', 'icon' => 'Users', 'items' => $parties, 'money' => true, 'empty' => 'No payments received this month'],
            'recent' => [
                'title' => 'Recent payments', 'viewAll' => route('store.transactions.index', ['store_slug' => $slug]),
                'columns' => [['key' => 'date', 'label' => 'Date'], ['key' => 'party', 'label' => 'Party'], ['key' => 'method', 'label' => 'Method'], ['key' => 'direction', 'label' => 'Direction', 'kind' => 'direction'], ['key' => 'amount', 'label' => 'Amount', 'kind' => 'money', 'align' => 'right']],
                'rows' => $recent, 'empty' => 'No payments yet',
            ],
        ]]);
    }

    public function online()
    {
        $tz = $this->tz();
        $today = Carbon::today($tz);
        $tid = app('current.tenant')->id;
        $slug = app('current.tenant')->slug;
        $off = $today->format('P');
        $dayStart = $today->copy()->startOfDay()->utc()->format('Y-m-d H:i:s');
        $monthStart = $today->copy()->startOfMonth()->utc()->format('Y-m-d H:i:s');
        $lastStart = $today->copy()->subMonth()->startOfMonth()->utc()->format('Y-m-d H:i:s');
        $from30 = $today->copy()->subDays(29)->startOfDay()->utc()->format('Y-m-d H:i:s');
        $live = ['rejected', 'cancelled', 'expired'];
        $orders = fn () => DB::table('commerce_orders')->where('tenant_id', $tid);

        $ordersToday = (int) $this->safe(fn () => $orders()->where('created_at', '>=', $dayStart)->count(), 0);
        $pending = (int) $this->safe(fn () => $orders()->where('status', 'pending')->count(), 0);
        $active = (int) $this->safe(fn () => $orders()->whereIn('status', ['confirmed', 'preparing', 'ready', 'out_for_delivery'])->count(), 0);
        $month = (float) $this->safe(fn () => $orders()->where('created_at', '>=', $monthStart)->whereNotIn('status', $live)->sum('total'), 0);
        $last = (float) $this->safe(fn () => $orders()->whereBetween('created_at', [$lastStart, $monthStart])->whereNotIn('status', $live)->sum('total'), 0);
        $monthCount = (int) $this->safe(fn () => $orders()->where('created_at', '>=', $monthStart)->whereNotIn('status', $live)->count(), 0);
        $customers = (int) $this->safe(fn () => $orders()->where('created_at', '>=', $from30)->distinct()->count('customer_phone'), 0);

        $trendMap = $this->safe(fn () => $orders()->where('created_at', '>=', $from30)->whereNotIn('status', $live)
            ->selectRaw("DATE(CONVERT_TZ(created_at, '+00:00', ?)) d, SUM(total) t", [$off])->groupBy('d')->pluck('t', 'd')->all(), []);

        $statuses = $this->safe(fn () => $orders()->where('created_at', '>=', $monthStart)
            ->selectRaw('status s, COUNT(*) c')->groupBy('s')->get()
            ->map(fn ($r) => ['name' => ucfirst(str_replace('_', ' ', (string) $r->s)), 'value' => (int) $r->c])->values()->all());

        $products = $this->safe(fn () => DB::table('commerce_order_items')
            ->join('commerce_orders', 'commerce_order_items.order_id', '=', 'commerce_orders.id')
            ->where('commerce_orders.tenant_id', $tid)->where('commerce_orders.created_at', '>=', $monthStart)
            ->whereNotIn('commerce_orders.status', $live)
            ->selectRaw('commerce_order_items.title t, SUM(commerce_order_items.quantity) q, SUM(commerce_order_items.line_total) v')
            ->groupBy('commerce_order_items.title')->orderByDesc('v')->take(8)->get()
            ->map(fn ($r) => ['label' => $r->t, 'value' => (float) $r->v, 'sub' => rtrim(rtrim(number_format((float) $r->q, 2), '0'), '.') . ' sold'])->values()->all());

        $buyers = $this->safe(fn () => $orders()->where('created_at', '>=', $monthStart)->whereNotIn('status', $live)
            ->selectRaw('customer_name n, COUNT(*) c, SUM(total) v')->groupBy('customer_phone', 'customer_name')->orderByDesc('v')->take(8)->get()
            ->map(fn ($r) => ['label' => $r->n, 'value' => (float) $r->v, 'sub' => $r->c . ' orders'])->values()->all());

        $recent = $this->safe(fn () => $orders()->orderByDesc('created_at')->take(8)->get(['id', 'public_number', 'customer_name', 'fulfilment', 'status', 'total'])
            ->map(fn ($o) => [
                'id' => $o->id,
                'href' => route('store.commerce.orders.show', ['store_slug' => $slug, 'id' => $o->id]),
                'cells' => ['ref' => $o->public_number, 'party' => $o->customer_name, 'method' => ucfirst((string) $o->fulfilment),
                    'status' => ucfirst(str_replace('_', ' ', (string) $o->status)), 'amount' => (float) $o->total],
            ])->values()->all());

        return Inertia::render('Dashboards/ModuleDashboard', ['dash' => [
            'module' => 'online', 'title' => 'Online Store Dashboard', 'activeMenu' => 'Online Store',
            'kpis' => [
                ['label' => 'Orders today', 'value' => $ordersToday, 'kind' => 'count', 'icon' => 'ShoppingBag', 'tone' => 'brand'],
                ['label' => 'Waiting for you', 'value' => $pending, 'kind' => 'count', 'icon' => 'Clock', 'tone' => 'amber', 'valueTone' => $pending > 0 ? 'rose' : null, 'sub' => 'New orders to accept'],
                ['label' => 'In progress', 'value' => $active, 'kind' => 'count', 'icon' => 'TrendingUp', 'tone' => 'blue', 'sub' => 'Accepted, not yet done'],
                ['label' => 'Order value this month', 'value' => $month, 'kind' => 'money', 'icon' => 'Wallet', 'tone' => 'emerald', 'sub' => $monthCount . ' orders', 'growth' => $this->growth($month, $last), 'growthLabel' => 'vs last month'],
                ['label' => 'Average order', 'value' => $monthCount > 0 ? round($month / $monthCount) : 0, 'kind' => 'money', 'icon' => 'Receipt', 'tone' => 'violet', 'sub' => 'This month'],
                ['label' => 'Customers', 'value' => $customers, 'kind' => 'count', 'icon' => 'Users', 'tone' => 'brand', 'sub' => 'Last 30 days'],
            ],
            'trend' => ['title' => 'Order value', 'subtitle' => 'Last 30 days · excludes rejected and cancelled', 'series' => [['name' => 'Order value', 'points' => $this->days($trendMap, $today)]]],
            'donut' => ['title' => 'Orders by status', 'subtitle' => 'This month', 'count' => true, 'slices' => $statuses],
            'rankA' => ['title' => 'Best-selling online items', 'subtitle' => 'This month', 'icon' => 'Package', 'items' => $products, 'money' => true, 'empty' => 'No online sales this month'],
            'rankB' => ['title' => 'Top online customers', 'subtitle' => 'This month', 'icon' => 'Users', 'items' => $buyers, 'money' => true, 'empty' => 'No online customers this month'],
            'recent' => [
                'title' => 'Latest online orders', 'viewAll' => route('store.commerce.orders', ['store_slug' => $slug]),
                'columns' => [['key' => 'ref', 'label' => 'Order', 'kind' => 'link'], ['key' => 'party', 'label' => 'Customer'], ['key' => 'method', 'label' => 'Fulfilment'], ['key' => 'amount', 'label' => 'Total', 'kind' => 'money', 'align' => 'right'], ['key' => 'status', 'label' => 'Status', 'kind' => 'status', 'align' => 'right']],
                'rows' => $recent, 'empty' => 'No online orders yet',
            ],
        ]]);
    }

    public function restaurant()
    {
        $tz = $this->tz();
        $today = Carbon::today($tz);
        $tid = app('current.tenant')->id;
        $slug = app('current.tenant')->slug;
        $off = $today->format('P');
        $dayStart = $today->copy()->startOfDay()->utc();
        $monthStart = $today->copy()->startOfMonth()->utc();
        $lastStart = $today->copy()->subMonth()->startOfMonth()->utc();
        $from30 = $today->copy()->subDays(29)->startOfDay()->utc();
        $sales = fn () => \App\Models\Sale::where('status', '!=', 'returned');

        $todayTotal = (float) $this->safe(fn () => $sales()->where('created_at', '>=', $dayStart)->sum('total'), 0);
        $todayCount = (int) $this->safe(fn () => $sales()->where('created_at', '>=', $dayStart)->count(), 0);
        $month = (float) $this->safe(fn () => $sales()->where('created_at', '>=', $monthStart)->sum('total'), 0);
        $last = (float) $this->safe(fn () => $sales()->whereBetween('created_at', [$lastStart, $monthStart])->sum('total'), 0);
        $monthCount = (int) $this->safe(fn () => $sales()->where('created_at', '>=', $monthStart)->count(), 0);
        $kitchen = (int) $this->safe(fn () => \App\Models\WorkOrder::where('tenant_id', $tid)->whereIn('status', ['pending', 'preparing'])->count(), 0);
        $tables = $this->safe(function () use ($tid) {
            $all = \App\Models\Position::with('activeOccupancy')->where('tenant_id', $tid)->where('zone', '!=', 'counter')->get();
            return ['total' => $all->count(), 'busy' => $all->filter(fn ($p) => $p->activeOccupancy !== null)->count()];
        }, ['total' => 0, 'busy' => 0]);

        $trendMap = $this->safe(fn () => $sales()->where('created_at', '>=', $from30)
            ->selectRaw("DATE(CONVERT_TZ(created_at, '+00:00', ?)) d, SUM(total) t", [$off])->groupBy('d')->pluck('t', 'd')->all(), []);

        $methods = $this->safe(fn () => $sales()->where('created_at', '>=', $monthStart)
            ->selectRaw('payment_method m, SUM(total) t')->groupBy('m')->get()
            ->map(fn ($r) => ['name' => ucfirst(str_replace('_', ' ', (string) ($r->m ?: 'other'))), 'value' => (float) $r->t])->values()->all());

        $dishes = $this->safe(fn () => DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.tenant_id', $tid)->where('sales.status', '!=', 'returned')->whereNull('sales.deleted_at')
            ->where('sales.created_at', '>=', $monthStart)
            ->selectRaw('products.name n, SUM(sale_items.quantity) q, SUM(sale_items.net_amount) v')
            ->groupBy('products.id', 'products.name')->orderByDesc('q')->take(8)->get()
            ->map(fn ($r) => ['label' => $r->n, 'value' => (float) $r->v, 'sub' => rtrim(rtrim(number_format((float) $r->q, 2), '0'), '.') . ' sold'])->values()->all());

        $hours = $this->safe(fn () => $sales()->where('created_at', '>=', $monthStart)
            ->selectRaw("HOUR(CONVERT_TZ(created_at, '+00:00', ?)) h, COUNT(*) c, SUM(total) t", [$off])->groupBy('h')->orderByDesc('t')->take(8)->get()
            ->map(fn ($r) => ['label' => Carbon::createFromTime((int) $r->h)->format('g A'), 'value' => (float) $r->t, 'sub' => $r->c . ' orders'])->values()->all());

        $recent = $this->safe(fn () => \App\Models\Sale::where('status', '!=', 'returned')->with('party:id,name')->latest()->take(8)
            ->get(['id', 'reference_number', 'party_id', 'total', 'payment_status', 'created_at'])
            ->map(fn ($x) => [
                'id' => $x->id,
                'href' => route('store.sales.show', ['store_slug' => $slug, 'sale' => $x->id]),
                'cells' => ['ref' => $x->reference_number, 'party' => $x->party->name ?? 'Walk-in', 'date' => optional($x->created_at)->timezone($tz)->format('d M, g:i A'),
                    'amount' => (float) $x->total, 'status' => (string) $x->payment_status],
            ])->values()->all());

        return Inertia::render('Dashboards/ModuleDashboard', ['dash' => [
            'module' => 'restaurant', 'title' => 'Restaurant Dashboard', 'activeMenu' => 'Restaurant',
            'kpis' => [
                ['label' => 'Sales today', 'value' => $todayTotal, 'kind' => 'money', 'icon' => 'Receipt', 'tone' => 'emerald', 'valueTone' => 'emerald', 'sub' => $todayCount . ' orders'],
                ['label' => 'Sales this month', 'value' => $month, 'kind' => 'money', 'icon' => 'Calendar', 'tone' => 'brand', 'sub' => $monthCount . ' orders', 'growth' => $this->growth($month, $last), 'growthLabel' => 'vs last month'],
                ['label' => 'Average order', 'value' => $monthCount > 0 ? round($month / $monthCount) : 0, 'kind' => 'money', 'icon' => 'TrendingUp', 'tone' => 'blue', 'sub' => 'This month'],
                ['label' => 'Tables in use', 'value' => $tables['busy'], 'kind' => 'count', 'icon' => 'Users', 'tone' => 'violet', 'sub' => 'of ' . $tables['total'] . ' tables'],
                ['label' => 'In the kitchen', 'value' => $kitchen, 'kind' => 'count', 'icon' => 'Clock', 'tone' => 'amber', 'valueTone' => $kitchen > 5 ? 'rose' : null, 'sub' => 'Waiting or being prepared'],
            ],
            'trend' => ['title' => 'Sales trend', 'subtitle' => 'Last 30 days', 'series' => [['name' => 'Sales', 'points' => $this->days($trendMap, $today)]]],
            'donut' => ['title' => 'Sales by payment method', 'subtitle' => 'This month', 'slices' => $methods],
            'rankA' => ['title' => 'Best-selling dishes', 'subtitle' => 'This month · by quantity', 'icon' => 'Package', 'items' => $dishes, 'money' => true, 'empty' => 'No dishes sold this month'],
            'rankB' => ['title' => 'Busiest hours', 'subtitle' => 'This month · by sales', 'icon' => 'Clock', 'items' => $hours, 'money' => true, 'empty' => 'No sales this month'],
            'recent' => [
                'title' => 'Latest orders', 'viewAll' => route('store.foh', ['store_slug' => $slug]),
                'columns' => [['key' => 'ref', 'label' => 'Reference', 'kind' => 'link'], ['key' => 'party', 'label' => 'Customer'], ['key' => 'date', 'label' => 'Time'], ['key' => 'amount', 'label' => 'Amount', 'kind' => 'money', 'align' => 'right'], ['key' => 'status', 'label' => 'Status', 'kind' => 'status', 'align' => 'right']],
                'rows' => $recent, 'empty' => 'No orders yet',
            ],
        ]]);
    }
}
