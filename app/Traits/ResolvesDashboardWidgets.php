<?php

namespace App\Traits;

use App\Services\Dashboard\DashboardRegistry;

trait ResolvesDashboardWidgets
{
    protected function resolveWidgets(array $widgetIds, $user, $tenant): array
    {
        $reckoner = app(\App\Reckoner\Reckoner::class);
        $out = [];

        // Build ReckonerRequests for metrics
        $requests = [];

        foreach ($widgetIds as $id) {
            switch ($id) {
                case 'revenue_today':
                    $requests[] = new \App\Reckoner\ReckonerRequest('sales.revenue', 'today');
                    break;
                case 'sales_summary':
                    $requests[] = new \App\Reckoner\ReckonerRequest('sales.revenue', 'today');
                    $requests[] = new \App\Reckoner\ReckonerRequest('sales.revenue', 'this_month');
                    $requests[] = new \App\Reckoner\ReckonerRequest('sales.revenue', 'this_year');
                    $requests[] = new \App\Reckoner\ReckonerRequest('finance.cogs', 'today');
                    $requests[] = new \App\Reckoner\ReckonerRequest('finance.cogs', 'this_month');
                    $requests[] = new \App\Reckoner\ReckonerRequest('finance.cogs', 'this_year');
                    break;
                case 'net_profit':
                    $requests[] = new \App\Reckoner\ReckonerRequest('finance.net_profit', 'this_month');
                    $requests[] = new \App\Reckoner\ReckonerRequest('sales.revenue', 'this_month');
                    $requests[] = new \App\Reckoner\ReckonerRequest('finance.expenses_total', 'this_month');
                    $requests[] = new \App\Reckoner\ReckonerRequest('finance.cogs', 'this_month');
                    break;
                case 'expenses':
                    $requests[] = new \App\Reckoner\ReckonerRequest('finance.expenses_total', 'this_month');
                    break;
                case 'revenue_trend':
                    $requests[] = new \App\Reckoner\ReckonerRequest('sales.revenue_trend', 'this_year');
                    break;
                case 'receivables':
                    $requests[] = new \App\Reckoner\ReckonerRequest('finance.receivables', 'live');
                    break;
                case 'payables':
                    $requests[] = new \App\Reckoner\ReckonerRequest('finance.payables', 'live');
                    break;
                case 'customer_count':
                    $requests[] = new \App\Reckoner\ReckonerRequest('party.customer_count', 'live');
                    $requests[] = new \App\Reckoner\ReckonerRequest('party.new_customers', 'this_month');
                    break;
                case 'top_customers':
                    $requests[] = new \App\Reckoner\ReckonerRequest('sales.top_customers', 'this_month');
                    break;
                case 'low_stock':
                    $requests[] = new \App\Reckoner\ReckonerRequest('inventory.low_stock_list', 'live');
                    break;
                case 'inventory_value':
                    $requests[] = new \App\Reckoner\ReckonerRequest('inventory.stock_value', 'live');
                    break;
                case 'top_products':
                    $requests[] = new \App\Reckoner\ReckonerRequest('sales.top_products', 'this_month');
                    break;
                case 'production_output':
                    $requests[] = new \App\Reckoner\ReckonerRequest('production.run_count', 'this_month');
                    break;
                case 'needs_attention':
                    $requests[] = new \App\Reckoner\ReckonerRequest('finance.receivables', 'live');
                    break;
            }
        }

        // Run readMany if we have requests
        $results = [];
        if (!empty($requests)) {
            $results = $reckoner->readMany($requests, $user, $tenant);
        }

        // Helper to extract value from results key
        $valOf = function(string $key, string $period) use ($results) {
            $composite = "{$key}|{$period}|" . md5(json_encode([]));
            return $results[$composite] ?? null;
        };

        // Format outputs
        foreach ($widgetIds as $id) {
            try {
                $data = null;
                switch ($id) {
                    case 'revenue_today':
                        $res = $valOf('sales.revenue', 'today');
                        if ($res && $res->ok) {
                            $data = [
                                'value' => (float) $res->data['value'],
                                'previous' => (float) $res->data['previous'],
                                'change_pct' => $res->data['change_pct'],
                                'label' => 'vs yesterday',
                            ];
                        }
                        break;

                    case 'sales_summary':
                        $revToday = $valOf('sales.revenue', 'today');
                        $cogsToday = $valOf('finance.cogs', 'today');
                        $revMonth = $valOf('sales.revenue', 'this_month');
                        $cogsMonth = $valOf('finance.cogs', 'this_month');
                        $revYear = $valOf('sales.revenue', 'this_year');
                        $cogsYear = $valOf('finance.cogs', 'this_year');

                        $data = [
                            'today' => [
                                'revenue' => (float) ($revToday->data['value'] ?? 0.0),
                                'cogs' => (float) ($cogsToday->data['value'] ?? 0.0),
                                'gross_profit' => (float) (($revToday->data['value'] ?? 0.0) - ($cogsToday->data['value'] ?? 0.0)),
                            ],
                            'month' => [
                                'revenue' => (float) ($revMonth->data['value'] ?? 0.0),
                                'cogs' => (float) ($cogsMonth->data['value'] ?? 0.0),
                                'gross_profit' => (float) (($revMonth->data['value'] ?? 0.0) - ($cogsMonth->data['value'] ?? 0.0)),
                            ],
                            'year' => [
                                'revenue' => (float) ($revYear->data['value'] ?? 0.0),
                                'cogs' => (float) ($cogsYear->data['value'] ?? 0.0),
                                'gross_profit' => (float) (($revYear->data['value'] ?? 0.0) - ($cogsYear->data['value'] ?? 0.0)),
                            ],
                        ];
                        break;

                    case 'net_profit':
                        $net = $valOf('finance.net_profit', 'this_month');
                        $rev = $valOf('sales.revenue', 'this_month');
                        $exp = $valOf('finance.expenses_total', 'this_month');
                        $cogs = $valOf('finance.cogs', 'this_month');

                        $netVal = (float) ($net->data['value'] ?? 0.0);
                        $revVal = (float) ($rev->data['value'] ?? 0.0);
                        $expVal = (float) ($exp->data['value'] ?? 0.0);
                        $cogsVal = (float) ($cogs->data['value'] ?? 0.0);

                        $data = [
                            'value' => $netVal,
                            'income' => $revVal,
                            'expense' => $expVal + $cogsVal,
                            'label' => now()->format('F'),
                        ];
                        break;

                    case 'expenses':
                        $res = $valOf('finance.expenses_total', 'this_month');
                        if ($res && $res->ok) {
                            $data = [
                                'value' => (float) $res->data['value'],
                                'previous' => (float) $res->data['previous'],
                                'change_pct' => $res->data['change_pct'],
                                'label' => 'vs last month',
                            ];
                        }
                        break;

                    case 'cash_position':
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
                        $data = [
                            'cash' => $cash,
                            'bank' => $bank,
                            'value' => $cash + $bank,
                        ];
                        break;

                    case 'revenue_trend':
                        $now = now();
                        $map = app(\App\Services\FinancialReportingService::class)->getProfitByPeriod(
                            $now->copy()->subMonths(11)->startOfMonth()->toDateString(),
                            $now->copy()->endOfMonth()->toDateString(),
                            'monthly',
                        );
                        $points = [];
                        $totalRev = 0.0;
                        for ($i = 11; $i >= 0; $i--) {
                            $month = $now->copy()->subMonths($i);
                            $row = $map[$month->format('Y-m')] ?? null;
                            $revVal = (float) ($row['revenue'] ?? 0);
                            $points[] = [
                                'name' => $month->format('M'),
                                'revenue' => $revVal,
                                'profit' => (float) ($row['profit'] ?? 0),
                            ];
                            $totalRev += $revVal;
                        }
                        
                        $currentMonthRev = (float) ($map[$now->format('Y-m')]['revenue'] ?? 0.0);
                        $lastMonthRev = (float) ($map[$now->copy()->subMonth()->format('Y-m')]['revenue'] ?? 0.0);
                        $changePct = $lastMonthRev > 0
                            ? round((($currentMonthRev - $lastMonthRev) / $lastMonthRev) * 100, 1)
                            : null;

                        $data = [
                            'points' => $points,
                            'total_revenue' => $totalRev,
                            'change_pct' => $changePct,
                            'series' => $points,
                        ];
                        break;

                    case 'receivables':
                        $res = $valOf('finance.receivables', 'live');
                        if ($res && $res->ok) {
                            $data = ['value' => (float) $res->data['value']];
                        }
                        break;

                    case 'payables':
                        $res = $valOf('finance.payables', 'live');
                        if ($res && $res->ok) {
                            $data = ['value' => (float) $res->data['value']];
                        }
                        break;

                    case 'customer_count':
                        $count = $valOf('party.customer_count', 'live');
                        $newThisMonth = $valOf('party.new_customers', 'this_month');
                        $data = [
                            'value' => (int) ($count->data['value'] ?? 0),
                            'new_this_month' => (int) ($newThisMonth->data['value'] ?? 0),
                            'label' => 'new this month',
                        ];
                        break;

                    case 'top_customers':
                        $res = $valOf('sales.top_customers', 'this_month');
                        if ($res && $res->ok) {
                            $rows = collect($res->data['rows'] ?? [])->map(fn($r) => [
                                'name' => $r['name'],
                                'value' => (float) $r['value'],
                            ])->all();
                            $data = ['rows' => $rows];
                        }
                        break;

                    case 'low_stock':
                        $res = $valOf('inventory.low_stock_list', 'live');
                        if ($res && $res->ok) {
                            $rows = collect($res->data['rows'] ?? [])->map(fn($r) => [
                                'id' => $r['id'],
                                'name' => $r['name'],
                                'sku' => $r['sku'],
                                'quantity' => (float) $r['quantity'],
                                'threshold' => (float) $r['threshold'],
                            ])->take(8)->all();
                            $data = [
                                'rows' => $rows,
                                'total' => (int) ($res->data['total'] ?? count($rows)),
                            ];
                        }
                        break;

                    case 'inventory_value':
                        $res = $valOf('inventory.stock_value', 'live');
                        if ($res && $res->ok) {
                            $data = ['value' => (float) $res->data['value']];
                        }
                        break;

                    case 'top_products':
                        $res = $valOf('sales.top_products', 'this_month');
                        if ($res && $res->ok) {
                            $rows = collect($res->data['rows'] ?? [])->map(fn($r) => [
                                'name' => $r['name'],
                                'sku' => $r['sku'] ?? null,
                                'quantity' => (float) ($r['quantity'] ?? 0),
                                'value' => (float) ($r['value'] ?? 0),
                                'margin_pct' => $r['margin_pct'] ?? null,
                            ])->all();
                            $data = ['rows' => $rows];
                        }
                        break;

                    case 'recent_purchases':
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
                            ])
                            ->all();
                        $data = ['rows' => $rows];
                        break;

                    case 'open_orders':
                        $open = \App\Models\SalesOrder::query()->where('status', 'open')->count();
                        $data = [
                            'value' => $open,
                            'label' => 'awaiting fulfilment',
                        ];
                        break;

                    case 'production_output':
                        $res = $valOf('production.run_count', 'this_month');
                        if ($res && $res->ok) {
                            $data = [
                                'value' => (int) $res->data['value'],
                                'label' => 'runs this month',
                            ];
                        }
                        break;

                    case 'active_staff':
                        $rows = \App\Models\StaffAttendance::query()
                            ->whereNull('check_out')
                            ->whereDate('check_in', now()->toDateString())
                            ->with('user:id,name')
                            ->take(8)
                            ->get()
                            ->map(fn ($attendance) => [
                                'name' => $attendance->user?->name ?? 'Unknown',
                                'since' => optional($attendance->check_in)->toIso8601String(),
                            ]);
                        $data = ['rows' => $rows, 'value' => $rows->count()];
                        break;

                    case 'needs_attention':
                        $items = [];
                        try {
                            $ar = $valOf('finance.receivables', 'live');
                            $receivables = $ar && $ar->ok ? (float) $ar->data['value'] : 0.0;
                            if ($receivables > 0) {
                                $items[] = [
                                    'kind' => 'receivable',
                                    'label' => 'outstanding from customers',
                                    'amount' => $receivables,
                                ];
                            }
                        } catch (\Throwable $e) {}

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
                        } catch (\Throwable $e) {}

                        try {
                            $openOrders = \App\Models\SalesOrder::query()->where('status', 'open')->count();
                            if ($openOrders > 0) {
                                $items[] = [
                                    'kind' => 'open_order',
                                    'label' => $openOrders === 1 ? 'order awaiting fulfilment' : 'orders awaiting fulfilment',
                                    'count' => $openOrders,
                                ];
                            }
                        } catch (\Throwable $e) {}

                        $data = ['items' => $items];
                        break;

                    case 'quick_actions':
                        $data = [
                            'actions' => [
                                ['key' => 'sale', 'label' => 'New Sale', 'permission' => 'sales.create'],
                                ['key' => 'expense', 'label' => 'New Expense', 'permission' => 'finance.transactions'],
                                ['key' => 'customer', 'label' => 'New Customer', 'permission' => 'parties.create'],
                                ['key' => 'product', 'label' => 'New Product', 'permission' => 'inventory.create'],
                            ],
                        ];
                        break;

                    case 'ai_insights':
                        $rows = \App\Models\AiRecommendation::active()
                            ->where('is_read', false)
                            ->latest()
                            ->take(4)
                            ->get(['id', 'title', 'priority'])
                            ->map(fn ($row) => [
                                'id' => $row->id,
                                'title' => $row->title,
                                'priority' => $row->priority,
                            ])
                            ->all();
                        $data = ['rows' => $rows];
                        break;
                }

                if ($data !== null) {
                    $out[$id] = ['ok' => true, 'data' => $data];
                } else {
                    $errMsg = 'This card could not be loaded.';
                    $keyMap = [
                        'revenue_today' => ['sales.revenue', 'today'],
                        'sales_summary' => ['sales.revenue', 'today'],
                        'net_profit' => ['finance.net_profit', 'this_month'],
                        'expenses' => ['finance.expenses_total', 'this_month'],
                        'revenue_trend' => ['sales.revenue_trend', 'this_year'],
                        'receivables' => ['finance.receivables', 'live'],
                        'payables' => ['finance.payables', 'live'],
                        'customer_count' => ['party.customer_count', 'live'],
                        'top_customers' => ['sales.top_customers', 'this_month'],
                        'low_stock' => ['inventory.low_stock_list', 'live'],
                        'inventory_value' => ['inventory.stock_value', 'live'],
                        'top_products' => ['sales.top_products', 'this_month'],
                        'production_output' => ['production.run_count', 'this_month'],
                        'needs_attention' => ['finance.receivables', 'live'],
                    ];
                    if (isset($keyMap[$id])) {
                        [$mKey, $mPeriod] = $keyMap[$id];
                        $res = $valOf($mKey, $mPeriod);
                        if ($res && !$res->ok) {
                            $errMsg = $res->errorMessage;
                        }
                    }
                    $out[$id] = ['ok' => false, 'error' => $errMsg];
                }
            } catch (\Throwable $e) {
                report($e);
                $out[$id] = ['ok' => false, 'error' => 'This card could not be loaded.'];
            }
        }

        return $out;
    }
}
