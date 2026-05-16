<?php

namespace App\Services\V3;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportService
{
    private int $tenantId;

    public function __construct(
        private AccountingService $accounting
    ) {
        $this->tenantId = app('current.tenant')->id;
    }

    // ═══════════════════════════════════════════════════════════════
    // 5.1 — TRIAL BALANCE
    // ═══════════════════════════════════════════════════════════════

    /**
     * All accounts with their debit and credit totals from the ledger.
     * SUM(all debit totals) must equal SUM(all credit totals).
     */
    public function trialBalance(?Carbon $asOf = null): array
    {
        $tid = $this->tenantId;
        $query = DB::table('accounts as a')
            ->where('a.tenant_id', $tid)
            ->leftJoin('journal_items as ji', function($join) use ($tid) {
                $join->on('ji.account_id', '=', 'a.id')
                     ->where('ji.tenant_id', $tid);
            })
            ->leftJoin('journal_entries as je', function ($join) use ($asOf, $tid) {
                $join->on('ji.journal_entry_id', '=', 'je.id')
                     ->where('je.tenant_id', $tid)
                     ->where('je.is_reversed', 0);
                if ($asOf) {
                    $join->where('je.date', '<=', $asOf->toDateString());
                }
            })
            ->where('a.is_active', 1)
            ->groupBy('a.id', 'a.code', 'a.name', 'a.type', 'a.normal_balance')
            ->orderBy('a.code')
            ->selectRaw('
                a.id,
                a.code,
                a.name,
                a.type,
                a.normal_balance,
                COALESCE(SUM(ji.debit), 0)  AS total_debit,
                COALESCE(SUM(ji.credit), 0) AS total_credit
            ')
            ->get();

        $rows          = [];
        $grandDebit    = 0;
        $grandCredit   = 0;

        foreach ($query as $row) {
            $balance = $row->normal_balance === 'debit'
                ? round($row->total_debit - $row->total_credit, 2)
                : round($row->total_credit - $row->total_debit, 2);

            $rows[] = [
                'code'           => $row->code,
                'name'           => $row->name,
                'type'           => $row->type,
                'normal_balance' => $row->normal_balance,
                'total_debit'    => round((float) $row->total_debit,  2),
                'total_credit'   => round((float) $row->total_credit, 2),
                'balance'        => $balance,
            ];

            $grandDebit  += $row->total_debit;
            $grandCredit += $row->total_credit;
        }

        return [
            'as_of'        => $asOf?->toDateString() ?? 'all time',
            'rows'         => $rows,
            'grand_debit'  => round($grandDebit,  2),
            'grand_credit' => round($grandCredit, 2),
            'balanced'     => abs($grandDebit - $grandCredit) < 0.01,
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // 5.2 — PROFIT & LOSS
    // ═══════════════════════════════════════════════════════════════

    public function profitAndLoss(Carbon $from, Carbon $to): array
    {
        $tid = $this->tenantId;
        $accounts = DB::table('accounts as a')
            ->where('a.tenant_id', $tid)
            ->leftJoin('journal_items as ji', function($join) use ($tid) {
                $join->on('ji.account_id', '=', 'a.id')
                     ->where('ji.tenant_id', $tid);
            })
            ->leftJoin('journal_entries as je', function ($join) use ($from, $to, $tid) {
                $join->on('ji.journal_entry_id', '=', 'je.id')
                     ->where('je.tenant_id', $tid)
                     ->where('je.is_reversed', 0)
                     ->whereBetween('je.date', [
                         $from->toDateString(),
                         $to->toDateString(),
                     ]);
            })
            ->whereIn('a.type', ['income', 'expense'])
            ->groupBy('a.id', 'a.code', 'a.name', 'a.type', 'a.normal_balance')
            ->orderBy('a.code')
            ->selectRaw('
                a.code, a.name, a.type, a.normal_balance,
                COALESCE(SUM(ji.debit), 0)  AS total_debit,
                COALESCE(SUM(ji.credit), 0) AS total_credit
            ')
            ->get();

        $revenue  = [];
        $cogs     = [];
        $expenses = [];

        foreach ($accounts as $row) {
            $balance = $row->normal_balance === 'credit'
                ? round($row->total_credit - $row->total_debit,  2)
                : round($row->total_debit  - $row->total_credit, 2);

            $entry = [
                'code'    => $row->code,
                'name'    => $row->name,
                'balance' => $balance,
            ];

            if ($row->type === 'income') {
                $revenue[] = $entry;
            } elseif ($row->code === '5000' || $row->code === '5100') {
                $cogs[] = $entry;
            } else {
                $expenses[] = $entry;
            }
        }

        $totalRevenue  = array_sum(array_column($revenue,  'balance'));
        $totalCogs     = array_sum(array_column($cogs,     'balance'));
        $totalExpenses = array_sum(array_column($expenses, 'balance'));
        $grossProfit   = round($totalRevenue - $totalCogs,     2);
        $netProfit     = round($grossProfit  - $totalExpenses, 2);

        return [
            'period'         => [
                'from' => $from->toDateString(),
                'to'   => $to->toDateString(),
            ],
            'revenue'        => $revenue,
            'cogs'           => $cogs,
            'expenses'       => $expenses,
            'total_revenue'  => round($totalRevenue,  2),
            'total_cogs'     => round($totalCogs,     2),
            'gross_profit'   => $grossProfit,
            'total_expenses' => round($totalExpenses, 2),
            'net_profit'     => $netProfit,
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // 5.3 — BALANCE SHEET
    // ═══════════════════════════════════════════════════════════════

    public function balanceSheet(Carbon $asOf): array
    {
        $tid = $this->tenantId;
        $accounts = DB::table('accounts as a')
            ->where('a.tenant_id', $tid)
            ->leftJoin('journal_items as ji', function($join) use ($tid) {
                $join->on('ji.account_id', '=', 'a.id')
                     ->where('ji.tenant_id', $tid);
            })
            ->leftJoin('journal_entries as je', function ($join) use ($asOf, $tid) {
                $join->on('ji.journal_entry_id', '=', 'je.id')
                     ->where('je.tenant_id', $tid)
                     ->where('je.is_reversed', 0)
                     ->where('je.date', '<=', $asOf->toDateString());
            })
            ->whereIn('a.type', ['asset', 'contra_asset', 'liability', 'equity'])
            ->groupBy('a.id', 'a.code', 'a.name', 'a.type', 'a.normal_balance')
            ->orderBy('a.code')
            ->selectRaw('
                a.code, a.name, a.type, a.normal_balance,
                COALESCE(SUM(ji.debit), 0)  AS total_debit,
                COALESCE(SUM(ji.credit), 0) AS total_credit
            ')
            ->get();

        $assets       = [];
        $liabilities  = [];
        $equity       = [];

        foreach ($accounts as $row) {
            $balance = $row->normal_balance === 'debit'
                ? round($row->total_debit  - $row->total_credit, 2)
                : round($row->total_credit - $row->total_debit,  2);

            // Contra-assets reduce total assets — show as negative
            if ($row->type === 'contra_asset') {
                $balance = -abs($balance);
            }

            $entry = [
                'code'    => $row->code,
                'name'    => $row->name,
                'type'    => $row->type,
                'balance' => $balance,
            ];

            match ($row->type) {
                'asset', 'contra_asset' => $assets[]      = $entry,
                'liability'             => $liabilities[]  = $entry,
                'equity'                => $equity[]        = $entry,
            };
        }

        // Retained earnings from P&L — add net profit for all time up to $asOf
        $plAllTime  = $this->profitAndLoss(Carbon::parse('1900-01-01'), $asOf);
        $retainedEarnings = $plAllTime['net_profit'];

        $equity[] = [
            'code'    => 'RE',
            'name'    => 'Retained Earnings (current period)',
            'type'    => 'equity',
            'balance' => $retainedEarnings,
        ];

        $totalAssets      = round(array_sum(array_column($assets,      'balance')), 2);
        $totalLiabilities = round(array_sum(array_column($liabilities, 'balance')), 2);
        $totalEquity      = round(array_sum(array_column($equity,      'balance')), 2);

        return [
            'as_of'             => $asOf->toDateString(),
            'assets'            => $assets,
            'liabilities'       => $liabilities,
            'equity'            => $equity,
            'total_assets'      => $totalAssets,
            'total_liabilities' => $totalLiabilities,
            'total_equity'      => $totalEquity,
            'balanced'          => abs($totalAssets - ($totalLiabilities + $totalEquity)) < 0.01,
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // 5.4 — CASH FLOW
    // ═══════════════════════════════════════════════════════════════

    public function cashFlow(Carbon $from, Carbon $to): array
    {
        // Direct method: classify each journal entry's cash movement
        // by reference_type into operating / investing / financing.
        $cashAccounts = ['1000', '1010'];

        $tid = $this->tenantId;
        $rows = DB::table('journal_items as ji')
            ->where('ji.tenant_id', $tid)
            ->join('journal_entries as je', function($join) use ($tid) {
                $join->on('ji.journal_entry_id', '=', 'je.id')
                     ->where('je.tenant_id', $tid);
            })
            ->join('accounts as a', function($join) use ($tid) {
                $join->on('ji.account_id', '=', 'a.id')
                     ->where('a.tenant_id', $tid);
            })
            ->where('je.is_reversed', 0)
            ->whereIn('a.code', $cashAccounts)
            ->whereBetween('je.date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('
                je.reference_type,
                je.description,
                je.date,
                SUM(ji.debit)  AS cash_in,
                SUM(ji.credit) AS cash_out
            ')
            ->groupBy('je.id', 'je.reference_type', 'je.description', 'je.date')
            ->orderBy('je.date')
            ->get();

        $operating  = [];
        $investing  = [];
        $financing  = [];

        $operatingTypes = [
            'sale', 'payment', 'purchase', 'salary_payment',
            'settlement_payment', 'cash_shortage', 'operating_expense',
            'donation', 'advance_receipt', 'advance_payment',
        ];
        $investingTypes  = ['asset_purchase', 'insurance_recovery'];
        $financingTypes  = [
            'loan_drawdown', 'loan_repayment',
            'owner_drawing', 'capital_injection',
            'bank_transfer',
        ];

        foreach ($rows as $row) {
            $net   = round((float)$row->cash_in - (float)$row->cash_out, 2);
            $entry = [
                'date'        => $row->date,
                'description' => $row->description,
                'type'        => $row->reference_type,
                'cash_in'     => round((float)$row->cash_in,  2),
                'cash_out'    => round((float)$row->cash_out, 2),
                'net'         => $net,
            ];

            if (in_array($row->reference_type, $operatingTypes)) {
                $operating[] = $entry;
            } elseif (in_array($row->reference_type, $investingTypes)) {
                $investing[] = $entry;
            } elseif (in_array($row->reference_type, $financingTypes)) {
                $financing[] = $entry;
            } else {
                $operating[] = $entry; // default to operating
            }
        }

        $sumNet = fn($arr) => round(array_sum(array_column($arr, 'net')), 2);

        return [
            'period'             => [
                'from' => $from->toDateString(),
                'to'   => $to->toDateString(),
            ],
            'operating'          => $operating,
            'investing'          => $investing,
            'financing'          => $financing,
            'net_operating'      => $sumNet($operating),
            'net_investing'      => $sumNet($investing),
            'net_financing'      => $sumNet($financing),
            'net_change_in_cash' => round(
                $sumNet($operating) + $sumNet($investing) + $sumNet($financing), 2
            ),
        ];
    }

    /**
     * Get aggregate Cash In and Cash Out from the journal (Rule: accounts 1000, 1010).
     */
    public function getCashMovement(Carbon $from, Carbon $to): array
    {
        $tid = $this->tenantId;
        $cashAccounts = ['1000', '1010'];

        $totals = DB::table('journal_items as ji')
            ->where('ji.tenant_id', $tid)
            ->join('journal_entries as je', function($join) use ($tid) {
                $join->on('ji.journal_entry_id', '=', 'je.id')
                     ->where('je.tenant_id', $tid);
            })
            ->join('accounts as a', function($join) use ($tid) {
                $join->on('ji.account_id', '=', 'a.id')
                     ->where('a.tenant_id', $tid);
            })
            ->where('je.is_reversed', 0)
            ->whereIn('a.code', $cashAccounts)
            ->whereBetween('je.date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('COALESCE(SUM(ji.debit), 0) as cash_in, COALESCE(SUM(ji.credit), 0) as cash_out')
            ->first();

        return [
            'cash_in'  => (float) $totals->cash_in,
            'cash_out' => (float) $totals->cash_out,
            'net'      => (float) ($totals->cash_in - $totals->cash_out),
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // 5.5 — AGED RECEIVABLES
    // ═══════════════════════════════════════════════════════════════

    public function agedReceivables(?Carbon $asOf = null): array
    {
        $asOf     = $asOf ?? Carbon::today();
        $buckets  = [0, 30, 60, 90]; // days

        $tid = $this->tenantId;
        $sales = DB::table('sales as s')
            ->where('s.tenant_id', $tid)
            ->join('parties as p', function($join) use ($tid) {
                $join->on('s.party_id', '=', 'p.id')
                     ->where('p.tenant_id', $tid);
            })
            ->where('s.status', 'posted')
            ->whereNotIn('s.payment_status', ['paid', 'written_off'])
            ->where('s.posted_at', '<=', $asOf->toDateString())
            ->selectRaw('
                s.id,
                s.reference_number AS reference_number,
                s.posted_at AS posted_at,
                s.invoice_total AS total_amount,
                p.id   AS party_id,
                p.name AS party_name
            ')
            ->get();

        $rows = [];

        foreach ($sales as $sale) {
            $allocated = (float) DB::table('payment_allocations')
                ->where('tenant_id', $tid)
                ->where('sale_id', $sale->id)
                ->where('status', 'active')
                ->sum('allocated_amount');

            $outstanding = round($sale->total_amount - $allocated, 2);
            if ($outstanding <= 0) continue;

            $ageDays = Carbon::parse($sale->posted_at)->diffInDays($asOf);

            $rows[] = [
                'party_id'       => $sale->party_id,
                'party_name'     => $sale->party_name,
                'invoice_number' => $sale->reference_number,
                'sale_date'      => $sale->posted_at,
                'outstanding'    => $outstanding,
                'age_days'       => $ageDays,
                'bucket'         => $this->ageBucket($ageDays),
            ];
        }

        return [
            'as_of'   => $asOf->toDateString(),
            'rows'    => $rows,
            'summary' => $this->bucketSummary($rows),
            'total'   => round(array_sum(array_column($rows, 'outstanding')), 2),
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // 5.6 — AGED PAYABLES
    // ═══════════════════════════════════════════════════════════════

    public function agedPayables(?Carbon $asOf = null): array
    {
        $asOf = $asOf ?? Carbon::today();

        $tid = $this->tenantId;
        $purchases = DB::table('invoices as pu')
            ->where('pu.tenant_id', $tid)
            ->join('parties as p', function($join) use ($tid) {
                $join->on('pu.party_id', '=', 'p.id')
                     ->where('p.tenant_id', $tid);
            })
            ->where('pu.type', 'purchase')
            // ->where('pu.status', '!=', 'paid') // can be partial
            ->where('pu.date', '<=', $asOf->toDateString())
            ->selectRaw('
                pu.id,
                pu.invoice_number,
                pu.date AS purchase_date,
                pu.total_amount,
                p.id   AS party_id,
                p.name AS party_name
            ')
            ->get();

        $rows = [];

        foreach ($purchases as $purchase) {
            $allocated = (float) DB::table('payment_allocations')
                ->where('tenant_id', $tid)
                ->where('purchase_id', $purchase->id)
                ->where('status', 'active')
                ->sum('allocated_amount');

            $outstanding = round($purchase->total_amount - $allocated, 2);
            if ($outstanding <= 0) continue;

            $ageDays = Carbon::parse($purchase->purchase_date)->diffInDays($asOf);

            $rows[] = [
                'party_id'       => $purchase->party_id,
                'party_name'     => $purchase->party_name,
                'invoice_number' => $purchase->invoice_number,
                'purchase_date'  => $purchase->purchase_date,
                'outstanding'    => $outstanding,
                'age_days'       => $ageDays,
                'bucket'         => $this->ageBucket($ageDays),
            ];
        }

        return [
            'as_of'   => $asOf->toDateString(),
            'rows'    => $rows,
            'summary' => $this->bucketSummary($rows),
            'total'   => round(array_sum(array_column($rows, 'outstanding')), 2),
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // 5.7 — SALES REPORT
    // ═══════════════════════════════════════════════════════════════

    public function salesReport(Carbon $from, Carbon $to, ?string $partyId = null, ?string $productId = null): array
    {
        $tid = $this->tenantId;
        $query = DB::table('sales as s')
            ->where('s.tenant_id', $tid)
            ->join('sale_items as si', function($join) use ($tid) {
                $join->on('si.sale_id', '=', 's.id')
                     ->where('si.tenant_id', $tid);
            })
            ->join('products as pr', function($join) use ($tid) {
                $join->on('si.product_id', '=', 'pr.id')
                     ->where('pr.tenant_id', $tid);
            })
            ->join('parties as pa', function($join) use ($tid) {
                $join->on('s.party_id', '=', 'pa.id')
                     ->where('pa.tenant_id', $tid);
            })
            ->where('s.status', 'posted')
            ->whereBetween('s.posted_at', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('
                s.id,
                s.reference_number AS invoice_number,
                s.posted_at AS sale_date,
                pa.name           AS customer_name,
                pr.id             AS product_id,
                pr.name           AS product_name,
                si.quantity AS qty,
                si.unit_price,
                si.tax_rate,
                si.line_total,
                si.cost_price AS cogs_amount
            ')
            ->orderBy('s.posted_at');

        if ($partyId) {
            $query->where('s.party_id', $partyId);
        }
        if ($productId) {
            $query->where('si.product_id', $productId);
        }

        $rows = $query->get()->toArray();

        return [
            'period'        => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'rows'          => $rows,
            'total_revenue' => round(array_sum(array_column($rows, 'line_total')), 2),
            'total_cogs'    => round(array_sum(array_column($rows, 'cogs_amount')), 2),
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // 5.8 — PURCHASE REPORT
    // ═══════════════════════════════════════════════════════════════

    public function purchasesReport(Carbon $from, Carbon $to, ?string $partyId = null): array
    {
        $tid = $this->tenantId;
        $query = DB::table('invoices as pu')
            ->where('pu.tenant_id', $tid)
            ->join('invoice_items as pi', function($join) use ($tid) {
                $join->on('pi.invoice_id', '=', 'pu.id')
                     ->where('pi.tenant_id', $tid);
            })
            ->join('products as pr', function($join) use ($tid) {
                $join->on('pi.product_id', '=', 'pr.id')
                     ->where('pr.tenant_id', $tid);
            })
            ->join('parties as pa', function($join) use ($tid) {
                $join->on('pu.party_id', '=', 'pa.id')
                     ->where('pa.tenant_id', $tid);
            })
            ->where('pu.type', 'purchase')
            ->whereBetween('pu.date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('
                pu.id,
                pu.invoice_number,
                pu.date AS purchase_date,
                pa.name       AS supplier_name,
                pr.name       AS product_name,
                pi.quantity   AS qty,
                pi.unit_price AS unit_cost,
                pi.total      AS line_total
            ')
            ->orderBy('pu.date');

        if ($partyId) {
            $query->where('pu.party_id', $partyId);
        }

        $rows = $query->get()->toArray();

        return [
            'period'      => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'rows'        => $rows,
            'total_spend' => round(array_sum(array_column($rows, 'line_total')), 2),
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // 5.9 — INVENTORY VALUATION
    // ═══════════════════════════════════════════════════════════════

    public function inventoryValuation(?string $warehouseId = null): array
    {
        $tid = $this->tenantId;
        $query = DB::table('inventory_batches as ib')
            ->where('ib.tenant_id', $tid)
            ->join('products as p', function($join) use ($tid) {
                $join->on('ib.product_id', '=', 'p.id')
                     ->where('p.tenant_id', $tid);
            })
            ->join('warehouses as w', function($join) use ($tid) {
                $join->on('ib.warehouse_id', '=', 'w.id')
                     ->where('w.tenant_id', $tid);
            })
            ->where('ib.remaining_qty', '>', 0)
            ->whereNull('ib.deleted_at')
            ->selectRaw('
                p.id          AS product_id,
                p.name        AS product_name,
                p.sku,
                w.id          AS warehouse_id,
                w.name        AS warehouse_name,
                SUM(ib.remaining_qty)                       AS total_qty,
                SUM(ib.remaining_qty * ib.unit_cost)        AS total_value,
                SUM(ib.remaining_qty * ib.unit_cost)
                    / NULLIF(SUM(ib.remaining_qty), 0)      AS avg_unit_cost
            ')
            ->groupBy('p.id', 'p.name', 'p.sku', 'w.id', 'w.name')
            ->orderBy('p.name');

        if ($warehouseId) {
            $query->where('ib.warehouse_id', $warehouseId);
        }

        $rows = $query->get()->map(fn($r) => [
            'product_id'    => $r->product_id,
            'product_name'  => $r->product_name,
            'sku'           => $r->sku,
            'warehouse_id'  => $r->warehouse_id,
            'warehouse_name'=> $r->warehouse_name,
            'total_qty'     => round((float)$r->total_qty,      4),
            'avg_unit_cost' => round((float)$r->avg_unit_cost,  4),
            'total_value'   => round((float)$r->total_value,    2),
        ])->toArray();

        return [
            'rows'        => $rows,
            'grand_total' => round(array_sum(array_column($rows, 'total_value')), 2),
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // 5.10 — COGS REPORT
    // ═══════════════════════════════════════════════════════════════

    /**
     * Source of truth: sale_item_batches.total_cost — NOT account 5000 balance.
     * These must reconcile. Gate 4 verifies they match.
     */
    public function cogsReport(Carbon $from, Carbon $to): array
    {
        $tid = $this->tenantId;
        $rows = DB::table('sale_item_batches as sib')
            ->where('sib.tenant_id', $tid)
            ->join('sale_items as si', function($join) use ($tid) {
                $join->on('sib.sale_item_id', '=', 'si.id')
                     ->where('si.tenant_id', $tid);
            })
            ->join('sales as s', function($join) use ($tid) {
                $join->on('si.sale_id', '=', 's.id')
                     ->where('s.tenant_id', $tid);
            })
            ->join('products as p', function($join) use ($tid) {
                $join->on('si.product_id', '=', 'p.id')
                     ->where('p.tenant_id', $tid);
            })
            ->where('s.status', 'posted')
            ->where('sib.is_reversed', 0)
            ->whereBetween('s.posted_at', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('
                p.id        AS product_id,
                p.name      AS product_name,
                SUM(sib.qty_deducted) AS total_qty_sold,
                SUM(sib.total_cogs)   AS total_cogs
            ')
            ->groupBy('p.id', 'p.name')
            ->orderByDesc('total_cogs')
            ->get()->toArray();

        // Reconciliation check: must equal account 5000 balance for the period
        $account5000 = $this->periodAccountBalance('5000', $from, $to);

        return [
            'period'          => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'rows'            => $rows,
            'total_cogs'      => round(array_sum(array_column($rows, 'total_cogs')), 2),
            'ledger_5000'     => $account5000,
            'reconciled'      => abs(
                array_sum(array_column($rows, 'total_cogs')) - $account5000
            ) < 0.01,
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // 5.11 — GROSS PROFIT
    // ═══════════════════════════════════════════════════════════════

    public function grossProfit(Carbon $from, Carbon $to, ?string $productId = null): array
    {
        $tid = $this->tenantId;
        $query = DB::table('sale_items as si')
            ->where('si.tenant_id', $tid)
            ->join('sales as s', function($join) use ($tid) {
                $join->on('si.sale_id', '=', 's.id')
                     ->where('s.tenant_id', $tid);
            })
            ->join('products as p', function($join) use ($tid) {
                $join->on('si.product_id', '=', 'p.id')
                     ->where('p.tenant_id', $tid);
            })
            ->where('s.status', 'posted')
            ->whereBetween('s.posted_at', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('
                p.id        AS product_id,
                p.name      AS product_name,
                SUM(si.line_total)   AS total_revenue,
                SUM(si.cost_price)  AS total_cogs,
                SUM(si.line_total) - SUM(si.cost_price) AS gross_profit
            ')
            ->groupBy('p.id', 'p.name')
            ->orderByDesc('gross_profit');

        if ($productId) {
            $query->where('si.product_id', $productId);
        }

        $rows = $query->get()->map(fn($r) => [
            'product_id'    => $r->product_id,
            'product_name'  => $r->product_name,
            'total_revenue' => round((float)$r->total_revenue, 2),
            'total_cogs'    => round((float)$r->total_cogs,    2),
            'gross_profit'  => round((float)$r->gross_profit,  2),
            'margin_pct'    => $r->total_revenue > 0
                ? round(($r->gross_profit / $r->total_revenue) * 100, 2)
                : 0,
        ])->toArray();

        return [
            'period'         => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'rows'           => $rows,
            'total_revenue'  => round(array_sum(array_column($rows, 'total_revenue')), 2),
            'total_cogs'     => round(array_sum(array_column($rows, 'total_cogs')),    2),
            'total_profit'   => round(array_sum(array_column($rows, 'gross_profit')),  2),
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // 5.13 — TAX REPORT
    // ═══════════════════════════════════════════════════════════════

    public function taxReport(Carbon $from, Carbon $to): array
    {
        $outputTax = $this->periodAccountBalance('2200', $from, $to);
        $inputTax  = $this->periodAccountBalance('2300', $from, $to);
        $netTax    = round($outputTax - $inputTax, 2);

        return [
            'period'      => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'output_tax'  => $outputTax,  // 2200 — owed to government
            'input_tax'   => $inputTax,   // 2300 — recoverable
            'net_payable' => $netTax,     // positive = owe, negative = refund due
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // 5.14 — PARTY LEDGER
    // ═══════════════════════════════════════════════════════════════

    public function partyLedger(string $partyId, Carbon $from, Carbon $to): array
    {
        $tid = $this->tenantId;
        $party = DB::table('parties')->where('tenant_id', $tid)->where('id', $partyId)->firstOrFail();

        $lines = DB::table('journal_items as ji')
            ->where('ji.tenant_id', $tid)
            ->join('journal_entries as je', function($join) use ($tid) {
                $join->on('ji.journal_entry_id', '=', 'je.id')
                     ->where('je.tenant_id', $tid);
            })
            ->join('accounts as a', function($join) use ($tid) {
                $join->on('ji.account_id', '=', 'a.id')
                     ->where('a.tenant_id', $tid);
            })
            ->where('ji.party_id', $partyId)
            ->where('je.is_reversed', 0)
            ->whereBetween('je.date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('
                je.date,
                je.reference_type,
                je.description,
                a.code   AS account_code,
                a.name   AS account_name,
                ji.debit,
                ji.credit
            ')
            ->orderBy('je.date')
            ->orderBy('je.created_at')
            ->get()->toArray();

        // Opening balance: everything before $from
        $openingBalance = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('ji.party_id', $partyId)
            ->where('je.is_reversed', 0)
            ->where('je.date', '<', $from->toDateString())
            ->selectRaw('SUM(ji.debit) - SUM(ji.credit) AS balance')
            ->value('balance') ?? 0;

        $runningBalance = $openingBalance;
        $ledgerLines    = [];

        foreach ($lines as $line) {
            $runningBalance += (float)$line->debit - (float)$line->credit;
            $ledgerLines[] = array_merge((array)$line, [
                'running_balance' => round($runningBalance, 2),
            ]);
        }

        return [
            'party'           => ['id' => $party->id, 'name' => $party->name],
            'period'          => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'opening_balance' => round($openingBalance, 2),
            'lines'           => $ledgerLines,
            'closing_balance' => round($runningBalance, 2),
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // 5.15 — INVENTORY MOVEMENT
    // ═══════════════════════════════════════════════════════════════

    public function inventoryMovement(Carbon $from, Carbon $to, ?string $productId = null): array
    {
        $tid = $this->tenantId;
        // Inflows: purchase batches, opening batches, manufactured batches, adjustments+
        $inflows = DB::table('inventory_batches as ib')
            ->where('ib.tenant_id', $tid)
            ->join('products as p', function($join) use ($tid) {
                $join->on('ib.product_id', '=', 'p.id')
                     ->where('p.tenant_id', $tid);
            })
            ->whereNull('ib.deleted_at')
            ->whereBetween('ib.created_at', [
                $from->startOfDay()->toDateTimeString(),
                $to->endOfDay()->toDateTimeString(),
            ])
            ->selectRaw('
                p.id   AS product_id,
                p.name AS product_name,
                ib.batch_type,
                SUM(ib.initial_qty)               AS qty_in,
                SUM(ib.initial_qty * ib.unit_cost) AS value_in
            ')
            ->groupBy('p.id', 'p.name', 'ib.batch_type')
            ->orderBy('p.name');

        if ($productId) {
            $inflows->where('ib.product_id', $productId);
        }

        // Outflows: sale_item_batches
        $outflows = DB::table('sale_item_batches as sib')
            ->where('sib.tenant_id', $tid)
            ->join('sale_items as si', function($join) use ($tid) {
                $join->on('sib.sale_item_id', '=', 'si.id')
                     ->where('si.tenant_id', $tid);
            })
            ->join('sales as s', function($join) use ($tid) {
                $join->on('si.sale_id', '=', 's.id')
                     ->where('s.tenant_id', $tid);
            })
            ->join('products as p', function($join) use ($tid) {
                $join->on('si.product_id', '=', 'p.id')
                     ->where('p.tenant_id', $tid);
            })
            ->where('s.status', 'posted')
            ->where('sib.is_reversed', 0)
            ->whereBetween('s.posted_at', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('
                p.id   AS product_id,
                p.name AS product_name,
                SUM(sib.qty_deducted) AS qty_out,
                SUM(sib.total_cogs)   AS value_out
            ')
            ->groupBy('p.id', 'p.name');

        if ($productId) {
            $outflows->where('si.product_id', $productId);
        }

        return [
            'period'   => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'inflows'  => $inflows->get()->toArray(),
            'outflows' => $outflows->get()->toArray(),
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════

    private function ageBucket($days): string
    {
        $days = (int)$days;
        return match(true) {
            $days <= 30  => '0-30',
            $days <= 60  => '31-60',
            $days <= 90  => '61-90',
            default      => '90+',
        };
    }

    private function bucketSummary(array $rows): array
    {
        $buckets = ['0-30' => 0, '31-60' => 0, '61-90' => 0, '90+' => 0];

        foreach ($rows as $row) {
            $buckets[$row['bucket']] = round(
                $buckets[$row['bucket']] + $row['outstanding'], 2
            );
        }

        return $buckets;
    }

    private function periodAccountBalance(string $code, Carbon $from, Carbon $to): float
    {
        $tid     = $this->tenantId;
        $account = DB::table('accounts')->where('tenant_id', $tid)->where('code', $code)->first();
        if (!$account) return 0.0;

        $result = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('ji.tenant_id', $tid)
            ->where('je.tenant_id', $tid)
            ->where('ji.account_id', $account->id)
            ->where('je.is_reversed', 0)
            ->whereBetween('je.date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('SUM(ji.debit) AS d, SUM(ji.credit) AS c')
            ->first();

        $debit  = (float)($result->d ?? 0);
        $credit = (float)($result->c ?? 0);

        return round(
            $account->normal_balance === 'debit'
                ? $debit - $credit
                : $credit - $debit,
            2
        );
    }
}
