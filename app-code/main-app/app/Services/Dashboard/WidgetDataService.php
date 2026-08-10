<?php

namespace App\Services\Dashboard;

use App\Services\FinancialReportingService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Resolves the figures behind each dashboard card.
 *
 * ── The rule this class exists to enforce ──────────────────────────────────
 *
 * It computes nothing. Every number below comes out of an engine that already
 * owns it — FinancialReportingService for anything derived from the ledger, the
 * existing models for anything operational. There is no second definition of
 * revenue, profit, receivables or stock value in this file, and there must never
 * be one: the moment the dashboard's "Net Profit" and the P&L report disagree,
 * every number in the product becomes a question.
 *
 * Where the legacy DashboardController reads a figure a particular way — the
 * AR/AP account-code join, the calendar-month definition of "Month" — that exact
 * approach is reproduced here rather than improved on, so the new dashboard and
 * the classic one cannot drift apart.
 *
 * ── Resolution is per widget, by request ───────────────────────────────────
 *
 * `resolve()` takes only the ids the browser actually has on screen. A user with
 * five cards runs five resolvers. Nothing pre-computes the full catalogue, which
 * is the difference between this and the classic dashboard controller — that one
 * builds every section on every load whether or not the user can see it.
 */
class WidgetDataService
{
    protected FinancialReportingService $reporting;

    public function __construct(?FinancialReportingService $reporting = null)
    {
        $this->reporting = $reporting ?? app(FinancialReportingService::class);
    }

    /**
     * Resolve a set of widgets.
     *
     * Each resolver is wrapped: a widget that throws returns an error marker and
     * the rest of the dashboard still renders. A single bad query taking the
     * whole page down is the failure mode that makes people distrust a
     * dashboard, and it is entirely avoidable.
     *
     * @param  string[]  $ids  Already filtered by WidgetRegistry — do not pass raw input.
     */
    public function resolve(array $ids): array
    {
        $out = [];

        foreach (array_unique($ids) as $id) {
            $method = 'widget' . str_replace(' ', '', ucwords(str_replace('_', ' ', $id)));

            if (! method_exists($this, $method)) {
                continue;
            }

            try {
                $out[$id] = ['ok' => true, 'data' => $this->{$method}()];
            } catch (\Throwable $e) {
                report($e);
                $out[$id] = ['ok' => false, 'error' => 'This card could not be loaded.'];
            }
        }

        return $out;
    }

    /* ------------------------------------------------------------------ *
     * Shared period helpers
     * ------------------------------------------------------------------ */

    protected function now(): Carbon
    {
        $timezone = app()->bound('current.tenant')
            ? (app('current.tenant')->timezone ?: config('app.timezone', 'UTC'))
            : config('app.timezone', 'UTC');

        return Carbon::now($timezone);
    }

    /** The store's P&L for a period, from the one read engine. */
    protected function pl(Carbon $start, Carbon $end): array
    {
        return $this->reporting->getProfitAndLoss($start->toDateString(), $end->toDateString());
    }

    /* ------------------------------------------------------------------ *
     * Business
     * ------------------------------------------------------------------ */

    protected function widgetRevenueToday(): array
    {
        $now = $this->now();

        $today = $this->pl($now->copy()->startOfDay(), $now->copy()->endOfDay());
        $yesterday = $this->pl(
            $now->copy()->subDay()->startOfDay(),
            $now->copy()->subDay()->endOfDay(),
        );

        $current = (float) $today['revenue'];
        $previous = (float) $yesterday['revenue'];

        return [
            'value' => $current,
            'previous' => $previous,
            // Growth against a zero baseline is undefined, not infinite. Saying
            // "+100%" because yesterday was a public holiday is a lie the user
            // will act on, so it stays null and the card shows no delta.
            'change_pct' => $previous > 0
                ? round((($current - $previous) / $previous) * 100, 1)
                : null,
            'label' => 'vs yesterday',
        ];
    }

    protected function widgetSalesSummary(): array
    {
        $now = $this->now();

        $periods = [
            'today' => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
            'month' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
            'year' => [$now->copy()->startOfYear(), $now->copy()->endOfYear()],
        ];

        $out = [];

        foreach ($periods as $key => [$start, $end]) {
            $pl = $this->pl($start, $end);
            $revenue = (float) $pl['revenue'];
            $cogs = (float) $pl['cogs'];

            $out[$key] = [
                'revenue' => $revenue,
                'cogs' => $cogs,
                'gross_profit' => $revenue - $cogs,
            ];
        }

        return $out;
    }

    protected function widgetNetProfit(): array
    {
        $now = $this->now();
        $pl = $this->pl($now->copy()->startOfMonth(), $now->copy()->endOfMonth());

        return [
            'value' => (float) $pl['net_profit'],
            'income' => (float) $pl['revenue'],
            'expense' => (float) $pl['total_expenses'],
            'label' => $now->format('F'),
        ];
    }

    protected function widgetExpenses(): array
    {
        $now = $this->now();

        $current = $this->pl($now->copy()->startOfMonth(), $now->copy()->endOfMonth());
        $previous = $this->pl(
            $now->copy()->subMonthNoOverflow()->startOfMonth(),
            $now->copy()->subMonthNoOverflow()->endOfMonth(),
        );

        // `total_expenses` in the P&L includes COGS. For an expense card that is
        // misleading — a busy month would read as overspending — so the operating
        // figure is used, derived the same way the P&L itself derives it.
        $currentValue = (float) $current['total_expenses'] - (float) $current['cogs'];
        $previousValue = (float) $previous['total_expenses'] - (float) $previous['cogs'];

        return [
            'value' => $currentValue,
            'previous' => $previousValue,
            'change_pct' => $previousValue > 0
                ? round((($currentValue - $previousValue) / $previousValue) * 100, 1)
                : null,
            'label' => 'vs last month',
        ];
    }

    protected function widgetCashPosition(): array
    {
        $accounts = \App\Models\BankAccount::query()->get();

        $cash = 0.0;
        $bank = 0.0;

        foreach ($accounts as $account) {
            $balance = (float) $account->v3Balance();

            if ($account->account_type === 'cash') {
                $cash += $balance;
            } else {
                $bank += $balance;
            }
        }

        return [
            'cash' => $cash,
            'bank' => $bank,
            'value' => $cash + $bank,
        ];
    }

    protected function widgetRevenueTrend(): array
    {
        $now = $this->now();

        $map = $this->reporting->getProfitByPeriod(
            $now->copy()->subMonths(11)->startOfMonth(),
            $now->copy()->endOfMonth(),
            'monthly',
        );

        $series = [];

        for ($i = 11; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $row = $map[$month->format('Y-m')] ?? null;

            $series[] = [
                'name' => $month->format('M'),
                'revenue' => (float) ($row['revenue'] ?? 0),
                'profit' => (float) ($row['profit'] ?? 0),
            ];
        }

        return ['series' => $series];
    }

    /* ------------------------------------------------------------------ *
     * Customers
     * ------------------------------------------------------------------ */

    /**
     * Receivables and payables, read exactly as the classic dashboard reads
     * them: the net movement on the AR (1200) and AP (2000) control accounts,
     * ignoring reversed entries.
     */
    protected function outstanding(): array
    {
        $tenantId = app('current.tenant')->id;

        $net = function (string $code, string $expression) use ($tenantId) {
            return (float) DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
                ->where('accounts.tenant_id', $tenantId)
                ->where('accounts.code', $code)
                ->where('journal_entries.tenant_id', $tenantId)
                ->where('journal_entries.is_reversed', 0)
                ->selectRaw("{$expression} as net")
                ->value('net');
        };

        return [
            'receivables' => max(0, $net('1200', 'COALESCE(SUM(journal_items.debit),0) - COALESCE(SUM(journal_items.credit),0)')),
            'payables' => max(0, $net('2000', 'COALESCE(SUM(journal_items.credit),0) - COALESCE(SUM(journal_items.debit),0)')),
        ];
    }

    protected function widgetReceivables(): array
    {
        return ['value' => $this->outstanding()['receivables']];
    }

    protected function widgetPayables(): array
    {
        return ['value' => $this->outstanding()['payables']];
    }

    protected function widgetCustomerCount(): array
    {
        $now = $this->now();

        $base = \App\Models\Party::query()->where('type', 'customer');

        return [
            'value' => (clone $base)->count(),
            'new_this_month' => (clone $base)
                ->where('created_at', '>=', $now->copy()->startOfMonth())
                ->count(),
            'label' => 'new this month',
        ];
    }

    protected function widgetTopCustomers(): array
    {
        $now = $this->now();

        $rows = $this->reporting
            ->getGrossProfitByParty(
                $now->copy()->startOfMonth()->toDateString(),
                $now->copy()->endOfMonth()->toDateString(),
            )
            ->sortByDesc('net_revenue')
            ->take(6)
            ->map(fn ($row) => [
                'name' => $row['party_name'] ?? 'Unnamed',
                'value' => (float) ($row['net_revenue'] ?? 0),
            ])
            ->values();

        return ['rows' => $rows];
    }

    /* ------------------------------------------------------------------ *
     * Operations
     * ------------------------------------------------------------------ */

    protected function widgetLowStock(): array
    {
        $rows = \App\Models\Product::query()
            ->whereNotNull('alert_quantity')
            ->whereColumn('stock_quantity', '<=', 'alert_quantity')
            ->orderBy('stock_quantity')
            ->take(8)
            ->get(['id', 'name', 'sku', 'stock_quantity', 'alert_quantity'])
            ->map(fn ($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'quantity' => (float) $product->stock_quantity,
                'threshold' => (float) $product->alert_quantity,
            ]);

        return [
            'rows' => $rows,
            'total' => \App\Models\Product::query()
                ->whereNotNull('alert_quantity')
                ->whereColumn('stock_quantity', '<=', 'alert_quantity')
                ->count(),
        ];
    }

    protected function widgetInventoryValue(): array
    {
        return ['value' => (float) $this->reporting->getInventoryValue()];
    }

    protected function widgetTopProducts(): array
    {
        $now = $this->now();

        $rows = $this->reporting
            ->getGrossProfitByProduct(
                $now->copy()->startOfMonth()->toDateString(),
                $now->copy()->endOfMonth()->toDateString(),
            )
            ->sortByDesc('net_revenue')
            ->take(6)
            ->map(fn ($item) => [
                'name' => $item['name'] ?? 'Unnamed',
                'sku' => $item['sku'] ?? null,
                'quantity' => (float) ($item['quantity'] ?? 0),
                'value' => (float) ($item['net_revenue'] ?? 0),
                'margin_pct' => $item['margin_pct'] ?? null,
            ])
            ->values();

        return ['rows' => $rows];
    }

    protected function widgetRecentPurchases(): array
    {
        $rows = \App\Models\Purchase::query()
            ->orderByDesc('purchase_date')
            ->orderByDesc('created_at')
            ->take(6)
            ->get(['id', 'invoice_number', 'purchase_date', 'total'])
            ->map(fn ($purchase) => [
                'id' => $purchase->id,
                'reference' => $purchase->invoice_number ?: '—',
                'date' => optional($purchase->purchase_date)->toDateString()
                    ?? optional($purchase->created_at)->toDateString(),
                'value' => (float) $purchase->total,
            ]);

        return ['rows' => $rows];
    }

    protected function widgetOpenOrders(): array
    {
        // The sales_orders status enum is ['open','converted','cancelled'].
        // Matching on 'open' rather than excluding the terminal states means a
        // status added later shows up as "not open" instead of silently being
        // counted as outstanding work.
        $open = \App\Models\SalesOrder::query()->where('status', 'open')->count();

        return [
            'value' => $open,
            'label' => 'awaiting fulfilment',
        ];
    }

    protected function widgetProductionOutput(): array
    {
        $now = $this->now();

        $runs = \App\Models\ProductionRun::query()
            ->where('created_at', '>=', $now->copy()->startOfMonth())
            ->count();

        return [
            'value' => $runs,
            'label' => 'runs this month',
        ];
    }

    /* ------------------------------------------------------------------ *
     * People
     * ------------------------------------------------------------------ */

    protected function widgetActiveStaff(): array
    {
        $rows = \App\Models\StaffAttendance::query()
            ->whereNull('check_out')
            ->whereDate('check_in', $this->now()->toDateString())
            ->with('user:id,name')
            ->take(8)
            ->get()
            ->map(fn ($attendance) => [
                'name' => $attendance->user?->name ?? 'Unknown',
                'since' => optional($attendance->check_in)->toIso8601String(),
            ]);

        return ['rows' => $rows, 'value' => $rows->count()];
    }

    /* ------------------------------------------------------------------ *
     * Insights
     * ------------------------------------------------------------------ */

    /**
     * The one card that reads across modules.
     *
     * Each line is guarded independently: a store without inventory should get
     * the invoice line and simply not get the stock line, rather than the whole
     * card failing because one table is absent.
     */
    protected function widgetNeedsAttention(): array
    {
        $items = [];

        try {
            $receivables = $this->outstanding()['receivables'];
            if ($receivables > 0) {
                $items[] = [
                    'kind' => 'receivable',
                    'label' => 'outstanding from customers',
                    'amount' => $receivables,
                ];
            }
        } catch (\Throwable) {
        }

        try {
            $lowStock = \App\Models\Product::query()
                ->whereNotNull('alert_quantity')
                ->whereColumn('stock_quantity', '<=', 'alert_quantity')
                ->count();

            if ($lowStock > 0) {
                $items[] = [
                    'kind' => 'low_stock',
                    'label' => $lowStock === 1 ? 'product is low on stock' : 'products are low on stock',
                    'count' => $lowStock,
                ];
            }
        } catch (\Throwable) {
        }

        try {
            $openOrders = \App\Models\SalesOrder::query()->where('status', 'open')->count();

            if ($openOrders > 0) {
                $items[] = [
                    'kind' => 'open_order',
                    'label' => $openOrders === 1 ? 'order awaiting fulfilment' : 'orders awaiting fulfilment',
                    'count' => $openOrders,
                ];
            }
        } catch (\Throwable) {
        }

        return ['items' => $items];
    }

    protected function widgetQuickActions(): array
    {
        // Deliberately static and server-owned: the browser decides which of
        // these it may render from the user's own permissions, but the list of
        // what "a quick action" is belongs with the rest of the catalogue.
        return [
            'actions' => [
                ['key' => 'sale', 'label' => 'New Sale', 'permission' => 'sales.create'],
                ['key' => 'expense', 'label' => 'New Expense', 'permission' => 'finance.transactions'],
                ['key' => 'customer', 'label' => 'New Customer', 'permission' => 'parties.create'],
                ['key' => 'product', 'label' => 'New Product', 'permission' => 'inventory.create'],
            ],
        ];
    }

    protected function widgetAiInsights(): array
    {
        $rows = \App\Models\AiRecommendation::active()
            ->where('is_read', false)
            ->latest()
            ->take(4)
            ->get(['id', 'title', 'priority'])
            ->map(fn ($row) => [
                'id' => $row->id,
                'title' => $row->title,
                'priority' => $row->priority,
            ]);

        return ['rows' => $rows];
    }
}
