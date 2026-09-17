<?php

namespace App\Reckoner\Engine;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\CardRegistry;
use App\Reckoner\Engine\Projections\BreakdownProjection;
use App\Reckoner\Engine\Projections\CompareProjection;
use App\Reckoner\Engine\Projections\GaugeProjection;
use App\Reckoner\Engine\Projections\HeatmapProjection;
use App\Reckoner\Engine\Projections\ListProjection;
use App\Reckoner\Engine\Projections\ProjectionInterface;
use App\Reckoner\Engine\Projections\StatProjection;
use App\Reckoner\Engine\Projections\StatusProjection;
use App\Reckoner\Engine\Projections\TrendProjection;
use App\Reckoner\Invariants\ReckonerInvariants;
use App\Reckoner\Measures;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerRequest;
use App\Reckoner\ReckonerResult;
use App\Reckoner\ReckonerShape;
use App\Reckoner\Streams\DocStatusStream;
use App\Reckoner\Streams\ExpensesStream;
use App\Reckoner\Streams\LedgerStream;
use App\Reckoner\Streams\MasterRegistryStream;
use App\Reckoner\Streams\PartyBalancesStream;
use App\Reckoner\Streams\PaymentsStream;
use App\Reckoner\Streams\TaxStream;
use App\Reckoner\Streams\SalesHeadersStream;
use App\Reckoner\Streams\SalesLinesStream;
use App\Reckoner\Streams\OperationsDocStream;
use App\Reckoner\Streams\CustomerLoyaltyStream;
use App\Reckoner\Streams\ChannelLocationStream;
use App\Reckoner\Streams\StockPositionsStream;
use App\Reckoner\Streams\PurchaseHeadersStream;
use App\Reckoner\Streams\StockOperationsStream;
use App\Reckoner\Streams\OperationsSpecialtyStream;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * MeasureEngine — The central read engine for the 349 Reckoner cards (§4.1, §7.4).
 * Pure, tenant-explicit, batched, invariant-guarded.
 */
class MeasureEngine
{
    public function __construct(
        protected LedgerStream $ledgerStream,
        protected PartyBalancesStream $partyBalancesStream,
        protected PaymentsStream $paymentsStream,
        protected ExpensesStream $expensesStream,
        protected TaxStream $taxStream,
        protected DocStatusStream $docStatusStream,
        protected MasterRegistryStream $masterRegistryStream,
        protected SalesHeadersStream $salesHeadersStream,
        protected SalesLinesStream $salesLinesStream,
        protected OperationsDocStream $operationsDocStream,
        protected CustomerLoyaltyStream $customerLoyaltyStream,
        protected ChannelLocationStream $channelLocationStream,
        protected StockPositionsStream $stockPositionsStream,
        protected PurchaseHeadersStream $purchaseHeadersStream,
        protected StockOperationsStream $stockOperationsStream,
        protected OperationsSpecialtyStream $operationsSpecialtyStream,
        protected ?\App\Reckoner\Custom\CustomCardResolver $customCardResolver = null
    ) {
        $this->customCardResolver ??= app(\App\Reckoner\Custom\CustomCardResolver::class);
    }

    /**
     * Resolves a batch of requests for contract cards.
     *
     * @param ReckonerRequest[] $requests
     * @param ReckonerContext $ctx
     * @return array<string, ReckonerResult>
     */
    public function resolve(array $requests, ReckonerContext $ctx): array
    {
        $tenant = $ctx->tenant;
        $tenantId = $tenant->id;
        $results = [];

        foreach ($requests as $req) {
            $key = $req->key;
            $id = method_exists($req, 'getCompositeId') ? $req->getCompositeId() : ($req->id ?? $key);

            // Phase 8: Custom card specification resolution
            if (!empty($req->args['spec']) || str_starts_with($key, 'custom.')) {
                $customCard = CardRegistry::get($key) ?: ['key' => $key, 'id' => $id, 'spec' => $req->args['spec'] ?? []];
                if (!empty($req->args['spec'])) {
                    $customCard['spec'] = $req->args['spec'];
                }
                $period = ReckonerPeriod::resolve($req->period ?: 'today', $req->custom, $tenant);
                $results[$id] = $this->customCardResolver->resolve($customCard, $period, $tenant, $req->args ?? [], $id);
                continue;
            }

            $card = CardRegistry::get($key);

            if (!$card) {
                $results[$id] = ReckonerResult::failure($id, $key, 'not_found', "Card '{$key}' not found in registry.");
                continue;
            }

            $contractState = $card['contract_state'] ?? 'unimplemented';
            if ($contractState === 'unimplemented') {
                $results[$id] = ReckonerResult::unavailable($id, $key, 'not_built', 'Card is unimplemented.', $card);
                continue;
            }

            try {
                $period = ReckonerPeriod::resolve($req->period ?: ($card['default_period'] ?? 'today'), $req->custom, $tenant);
                $result = $this->resolveSingleCard($card, $period, $tenant, $req->args ?? [], $id);
                $results[$id] = $result;
            } catch (Throwable $e) {
                report($e);
                $results[$id] = ReckonerResult::failure($id, $key, 'calculation_error', $e->getMessage());
            }
        }

        return $results;
    }

    /**
     * Resolves a single card via streams and canonical projections.
     */
    protected function resolveSingleCard(
        array $card,
        ReckonerPeriod $period,
        Tenant $tenant,
        array $args,
        string $requestId
    ): ReckonerResult {
        $key = $card['key'];
        $tenantId = $tenant->id;
        $shape = ReckonerShape::fromCardShape($card['shape'] ?? 'stat');

        $from = $period->start->toDateString();
        $to = $period->end->toDateString();
        $asOf = $to;

        $compareFrom = $period->compareStart?->toDateString();
        $compareTo = $period->compareEnd?->toDateString();

        $projection = $this->getProjectionForCard($card);
        $measureData = [];
        $options = [];
        $checks = [];

        // ── 1. QORE & ACCOUNTING (LedgerStream) ──────────────────────────────
        if (str_starts_with($key, 'core.') || str_starts_with($key, 'accounting.')) {
            switch ($key) {
                case 'core.revenue':
                    $flows = $this->ledgerStream->flows(['gl.sales_revenue'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $val = $flows['gl.sales_revenue'];
                    $measureData = ['value' => $val];
                    if ($compareFrom && $compareTo) {
                        $cmpFlows = $this->ledgerStream->flows(['gl.sales_revenue'], ['c' => ['from' => $compareFrom, 'to' => $compareTo]], [], $tenantId)['c'];
                        $options['compare_value'] = $cmpFlows['gl.sales_revenue'];
                    }
                    break;

                case 'core.revenue_trend':
                    $points = $this->ledgerStream->dailyFlow('gl.sales_revenue', $from, $to, $tenantId);
                    $measureData = ['points' => $points];
                    break;

                case 'core.cogs':
                    $flows = $this->ledgerStream->flows(['gl.cogs'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $measureData = ['value' => $flows['gl.cogs']];
                    break;

                case 'core.gross_profit':
                    $flows = $this->ledgerStream->flows(['gl.sales_revenue', 'gl.cogs'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $gp = $flows['gl.sales_revenue'] - $flows['gl.cogs'];
                    $measureData = ['value' => $gp];
                    break;

                case 'core.gross_margin_pct':
                    $flows = $this->ledgerStream->flows(['gl.sales_revenue', 'gl.cogs'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $gp = $flows['gl.sales_revenue'] - $flows['gl.cogs'];
                    $measureData = [
                        'numerator'   => $gp,
                        'denominator' => $flows['gl.sales_revenue'],
                    ];
                    break;

                case 'core.expenses_total':
                    $flows = $this->ledgerStream->flows(['gl.opex'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $measureData = ['value' => $flows['gl.opex']];
                    break;

                case 'core.expense_ratio':
                    $flows = $this->ledgerStream->flows(['gl.sales_revenue', 'gl.opex'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $measureData = [
                        'numerator'   => $flows['gl.opex'],
                        'denominator' => $flows['gl.sales_revenue'],
                    ];
                    break;

                case 'core.net_profit':
                    $flows = $this->ledgerStream->flows(['gl.sales_revenue', 'gl.cogs', 'gl.opex'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $np = $flows['gl.sales_revenue'] - $flows['gl.cogs'] - $flows['gl.opex'];
                    $measureData = ['value' => $np];
                    if ($compareFrom && $compareTo) {
                        $cmp = $this->ledgerStream->flows(['gl.sales_revenue', 'gl.cogs', 'gl.opex'], ['c' => ['from' => $compareFrom, 'to' => $compareTo]], [], $tenantId)['c'];
                        $options['compare_value'] = $cmp['gl.sales_revenue'] - $cmp['gl.cogs'] - $cmp['gl.opex'];
                    }
                    break;

                case 'core.net_margin_pct':
                    $flows = $this->ledgerStream->flows(['gl.sales_revenue', 'gl.cogs', 'gl.opex'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $np = $flows['gl.sales_revenue'] - $flows['gl.cogs'] - $flows['gl.opex'];
                    $measureData = [
                        'numerator'   => $np,
                        'denominator' => $flows['gl.sales_revenue'],
                    ];
                    break;

                case 'core.profit_trend':
                    $points = $this->ledgerStream->dailyNetProfit($from, $to, $tenantId);
                    $measureData = ['points' => $points];
                    break;

                case 'core.revenue_vs_prev':
                    $flows = $this->ledgerStream->flows(['gl.sales_revenue'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $cur = $flows['gl.sales_revenue'];
                    $prev = 0.0;
                    if ($compareFrom && $compareTo) {
                        $prevFlows = $this->ledgerStream->flows(['gl.sales_revenue'], ['c' => ['from' => $compareFrom, 'to' => $compareTo]], [], $tenantId)['c'];
                        $prev = $prevFlows['gl.sales_revenue'];
                    }
                    $pct = $prev > 0 ? round((($cur - $prev) / $prev) * 100, 1) : null;
                    $measureData = ['value' => $pct];
                    break;

                case 'core.profit_vs_prev':
                    $curFlows = $this->ledgerStream->flows(['gl.sales_revenue', 'gl.cogs', 'gl.opex'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $cur = $curFlows['gl.sales_revenue'] - $curFlows['gl.cogs'] - $curFlows['gl.opex'];
                    $prev = 0.0;
                    if ($compareFrom && $compareTo) {
                        $prevFlows = $this->ledgerStream->flows(['gl.sales_revenue', 'gl.cogs', 'gl.opex'], ['c' => ['from' => $compareFrom, 'to' => $compareTo]], [], $tenantId)['c'];
                        $prev = $prevFlows['gl.sales_revenue'] - $prevFlows['gl.cogs'] - $prevFlows['gl.opex'];
                    }
                    $measureData = ['value' => round($cur - $prev, 2)];
                    break;

                case 'core.receivables':
                    $bal = $this->ledgerStream->closingBalances(['ar'], [$asOf], [], $tenantId)[$asOf]['ar'];
                    $measureData = ['value' => $bal];
                    break;

                case 'core.receivables_aging':
                    $aging = $this->partyBalancesStream->aging('ar', $asOf, $tenantId);
                    $measureData = [
                        '0–30 days'  => $aging['0_30'],
                        '31–60 days' => $aging['31_60'],
                        '61–90 days' => $aging['61_90'],
                        '90+ days'   => $aging['90_plus'],
                    ];
                    $bal = $this->ledgerStream->closingBalances(['ar'], [$asOf], [], $tenantId)[$asOf]['ar'];
                    $options['parent_total'] = $bal;
                    break;

                case 'core.payables':
                    $bal = $this->ledgerStream->closingBalances(['ap'], [$asOf], [], $tenantId)[$asOf]['ap'];
                    $measureData = ['value' => $bal];
                    break;

                case 'core.payables_aging':
                    $aging = $this->partyBalancesStream->aging('ap', $asOf, $tenantId);
                    $measureData = [
                        '0–30 days'  => $aging['0_30'],
                        '31–60 days' => $aging['31_60'],
                        '61–90 days' => $aging['61_90'],
                        '90+ days'   => $aging['90_plus'],
                    ];
                    $bal = $this->ledgerStream->closingBalances(['ap'], [$asOf], [], $tenantId)[$asOf]['ap'];
                    $options['parent_total'] = $bal;
                    break;

                case 'core.total_liquidity':
                    $b = $this->ledgerStream->closingBalances(['cash', 'bank'], [$asOf], [], $tenantId)[$asOf];
                    $measureData = ['value' => $b['cash'] + $b['bank']];
                    break;

                case 'core.liquidity_trend':
                    $points = $this->ledgerStream->dailyClosingLiquidity($from, $to, $tenantId);
                    $measureData = ['points' => $points];
                    break;

                case 'core.cash_flow_trend':
                    $points = $this->ledgerStream->dailyCashFlowMovement($from, $to, $tenantId);
                    $measureData = ['points' => $points];
                    break;

                case 'core.working_capital':
                    $b = $this->ledgerStream->closingBalances(['current_assets', 'current_liabilities'], [$asOf], [], $tenantId)[$asOf];
                    $wc = $b['current_assets'] - $b['current_liabilities'];
                    $measureData = ['value' => $wc];
                    break;

                case 'core.net_cash_position':
                    $b = $this->ledgerStream->closingBalances(['cash', 'bank', 'liabilities'], [$asOf], [], $tenantId)[$asOf];
                    $liq = $b['cash'] + $b['bank'];
                    $measureData = ['value' => $liq - $b['liabilities']];
                    break;

                case 'core.balance_sheet_ok':
                case 'accounting.trial_balance_ok':
                    $b = $this->ledgerStream->closingBalances(['assets', 'liabilities', 'equity'], [$asOf], [], $tenantId)[$asOf];
                    $diff = abs($b['assets'] - ($b['liabilities'] + $b['equity']));
                    $passed = $diff <= 0.05;
                    $measureData = [
                        'passed'     => $passed,
                        'difference' => $diff,
                        'message'    => $passed ? 'Balance sheet balanced.' : "Difference of {$diff}",
                    ];
                    break;

                case 'core.journal_entries_count':
                    $flows = $this->ledgerStream->flows(['gl.journal_count'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $measureData = ['value' => $flows['gl.journal_count']];
                    break;

                case 'core.reversal_count':
                    $flows = $this->ledgerStream->flows(['gl.reversal_count'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $measureData = ['value' => $flows['gl.reversal_count']];
                    break;

                case 'core.audit_trail_count':
                    $count = $this->masterRegistryStream->auditTrailCount($from, $to, $tenantId);
                    $measureData = ['value' => (float) $count];
                    break;

                case 'core.document_sequence_ok':
                    $seq = $this->docStatusStream->documentSequenceOk($from, $to, $tenantId);
                    $measureData = $seq;
                    break;

                case 'core.user_activity':
                    $count = $this->masterRegistryStream->activeUserCount($from, $to, $tenantId);
                    $measureData = ['value' => (float) $count];
                    break;

                case 'core.plan_usage':
                    $limits = \App\Services\PlanRepository::getLimits($tenant->plan ?? 'scale');
                    $segments = [];
                    foreach ($limits as $limitKey => $maxVal) {
                        $maxNum = (float) $maxVal;
                        if ($maxNum <= 0) continue;
                        $used = 0;
                        if (str_contains($limitKey, 'user')) {
                            $used = DB::table('tenant_users')->where('tenant_id', $tenantId)->count();
                        } elseif (str_contains($limitKey, 'sku') || str_contains($limitKey, 'product')) {
                            $used = DB::table('products')->where('tenant_id', $tenantId)->whereNull('deleted_at')->count();
                        }
                        $pct = round(($used / $maxNum) * 100, 1);
                        $segments[ucwords(str_replace('_', ' ', $limitKey))] = $pct;
                    }
                    if (empty($segments)) {
                        $segments = ['Usage' => 0.0];
                    }
                    $measureData = $segments;
                    break;

                case 'core.transaction_count':
                    $salesCount = DB::table('sales')->where('tenant_id', $tenantId)->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])->whereIn('status', ['posted', 'completed'])->whereNull('deleted_at')->count();
                    $purchCount = DB::table('purchases')->where('tenant_id', $tenantId)->whereBetween('purchase_date', [$from, $to])->where('workflow_status', '!=', 'cancelled')->count();
                    $expCount = DB::table('expenses')->where('tenant_id', $tenantId)->whereBetween('date', [$from, $to])->count();
                    $pmtCount = DB::table('payments')->where('tenant_id', $tenantId)->whereBetween(DB::raw('COALESCE(date, DATE(created_at))'), [$from, $to])->count();
                    $measureData = ['value' => (float) ($salesCount + $purchCount + $expCount + $pmtCount)];
                    break;

                case 'core.avg_transaction_value':
                    $sales = DB::table('sales')->where('tenant_id', $tenantId)->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])->whereIn('status', ['posted', 'completed'])->whereNull('deleted_at');
                    $rev = (float) ((clone $sales)->sum('net_sales') ?? 0.0);
                    $cnt = (clone $sales)->count();
                    $measureData = ['value' => $cnt > 0 ? round($rev / $cnt, 2) : 0.0];
                    break;

                case 'core.busiest_day':
                    $best = DB::table('sales')
                        ->where('tenant_id', $tenantId)
                        ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                        ->whereIn('status', ['posted', 'completed'])
                        ->whereNull('deleted_at')
                        ->selectRaw('DATE(COALESCE(posted_at, created_at)) as s_date, SUM(net_sales) as rev')
                        ->groupBy('s_date')
                        ->orderByDesc('rev')
                        ->first();
                    $measureData = ['value' => (float) ($best?->rev ?? 0.0)];
                    break;

                case 'core.peak_hour':
                    $bestHour = DB::table('sales')
                        ->where('tenant_id', $tenantId)
                        ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                        ->whereIn('status', ['posted', 'completed'])
                        ->whereNull('deleted_at')
                        ->selectRaw('HOUR(created_at) as hr, SUM(net_sales) as rev')
                        ->groupBy('hr')
                        ->orderByDesc('rev')
                        ->first();
                    $measureData = ['value' => (float) ($bestHour?->hr ?? 0.0)];
                    break;

                case 'accounting.assets_total':
                    $b = $this->ledgerStream->closingBalances(['assets'], [$asOf], [], $tenantId)[$asOf];
                    $measureData = ['value' => $b['assets']];
                    break;

                case 'accounting.liabilities_total':
                    $b = $this->ledgerStream->closingBalances(['liabilities'], [$asOf], [], $tenantId)[$asOf];
                    $measureData = ['value' => $b['liabilities']];
                    break;

                case 'accounting.equity_total':
                    $b = $this->ledgerStream->closingBalances(['equity'], [$asOf], [], $tenantId)[$asOf];
                    $measureData = ['value' => $b['equity']];
                    break;

                case 'accounting.equity_trend':
                    $points = $this->ledgerStream->dailyClosingEquity($from, $to, $tenantId);
                    $measureData = ['points' => $points];
                    break;

                case 'accounting.pnl_summary':
                    $flows = $this->ledgerStream->flows(['gl.sales_revenue', 'gl.cogs', 'gl.opex'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $rev = $flows['gl.sales_revenue'];
                    $cogs = $flows['gl.cogs'];
                    $gp = $rev - $cogs;
                    $opex = $flows['gl.opex'];
                    $np = $gp - $opex;
                    $measureData = [
                        'Revenue'      => $rev,
                        'COGS'         => $cogs,
                        'Gross Profit' => $gp,
                        'OPEX'         => $opex,
                        'Net Profit'   => $np,
                    ];
                    break;

                case 'accounting.balance_sheet':
                    $b = $this->ledgerStream->closingBalances(['assets', 'liabilities', 'equity'], [$asOf], [], $tenantId)[$asOf];
                    $measureData = [
                        'Assets'      => $b['assets'],
                        'Liabilities' => $b['liabilities'],
                        'Equity'      => $b['equity'],
                    ];
                    break;

                case 'accounting.unposted_count':
                    $unposted = $this->docStatusStream->unpostedCount($tenantId);
                    $measureData = ['value' => (float) $unposted];
                    break;

                case 'accounting.drawings':
                    $drawings = (float) DB::table('journal_items as ji')
                        ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                        ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                        ->where('je.tenant_id', $tenantId)
                        ->where('ji.tenant_id', $tenantId)
                        ->where('je.is_reversed', 0)
                        ->where('je.reference_type', 'owner_drawing')
                        ->where('a.type', 'equity')
                        ->whereBetween('je.date', [$from, $to])
                        ->sum('ji.debit');
                    $measureData = ['value' => $drawings];
                    break;
            }
        }

        // ── 2. KHATA CREDIT ──────────────────────────────────────────────────
        elseif (str_starts_with($key, 'khata.')) {
            switch ($key) {
                case 'khata.receivable_total':
                    $bal = $this->ledgerStream->closingBalances(['ar'], [$asOf], [], $tenantId)[$asOf]['ar'];
                    $measureData = ['value' => $bal];
                    break;

                case 'khata.payable_total':
                    $bal = $this->ledgerStream->closingBalances(['ap'], [$asOf], [], $tenantId)[$asOf]['ap'];
                    $measureData = ['value' => $bal];
                    break;

                case 'khata.net_position':
                    $b = $this->ledgerStream->closingBalances(['ar', 'ap'], [$asOf], [], $tenantId)[$asOf];
                    $measureData = ['value' => $b['ar'] - $b['ap']];
                    break;

                case 'khata.biggest_debtors':
                    $byParty = $this->partyBalancesStream->balancesByParty('ar', $asOf, $tenantId);
                    arsort($byParty);
                    $rows = [];
                    foreach ($byParty as $pid => $amt) {
                        if ($amt > 0) {
                            $name = DB::table('parties')->where('id', $pid)->value('name') ?: 'Unknown';
                            $rows[] = ['party_id' => $pid, 'name' => $name, 'amount' => $amt];
                        }
                    }
                    $measureData = ['rows' => $rows];
                    break;

                case 'khata.overdue_total':
                    $overdue = (float) DB::table('sales')
                        ->where('tenant_id', $tenantId)
                        ->where('payment_method', 'credit')
                        ->where('due_date', '<', now()->toDateString())
                        ->whereIn('status', ['posted', 'completed', 'active'])
                        ->sum('invoice_total');
                    $measureData = ['value' => $overdue];
                    break;

                case 'khata.aging':
                    $aging = $this->partyBalancesStream->aging('ar', $asOf, $tenantId);
                    $measureData = [
                        '0–30 days'  => $aging['0_30'],
                        '31–60 days' => $aging['31_60'],
                        '61–90 days' => $aging['61_90'],
                        '90+ days'   => $aging['90_plus'],
                    ];
                    break;

                case 'khata.collected':
                    $collected = (float) DB::table('journal_items as ji')
                        ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                        ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                        ->where('je.tenant_id', $tenantId)
                        ->where('ji.tenant_id', $tenantId)
                        ->where('je.is_reversed', 0)
                        ->where(function ($q) {
                            $q->where('a.role', 'ar')->orWhere('a.code', '1200');
                        })
                        ->whereIn('je.reference_type', ['customer_payment', 'payment', 'receipt'])
                        ->whereBetween('je.date', [$from, $to])
                        ->sum('ji.credit');
                    $measureData = ['value' => $collected];
                    break;

                case 'khata.collection_trend':
                    $points = $this->ledgerStream->dailyFlow('gl.ar_collected', $from, $to, $tenantId);
                    $measureData = ['points' => $points];
                    break;

                case 'khata.over_limit':
                    $overLimit = $this->partyBalancesStream->overLimitParties($tenantId, $asOf);
                    $measureData = ['rows' => $overLimit];
                    break;
            }
        }

        // ── 3. BANK ACCOUNTS ─────────────────────────────────────────────────
        elseif (str_starts_with($key, 'bank.')) {
            switch ($key) {
                case 'bank.account_count':
                    $cnt = $this->masterRegistryStream->bankAccountCount($tenantId);
                    $measureData = ['value' => (float) $cnt];
                    break;

                case 'bank.balances_total':
                    $b = $this->ledgerStream->closingBalances(['bank'], [$asOf], [], $tenantId)[$asOf]['bank'];
                    $measureData = ['value' => $b];
                    break;

                case 'bank.balance_trend':
                    $points = $this->ledgerStream->dailyClosingBank($from, $to, $tenantId);
                    $measureData = ['points' => $points];
                    break;

                case 'bank.balance_by_account':
                    $byBank = $this->ledgerStream->closingBalances(['bank'], [$asOf], ['bank_account'], $tenantId)[$asOf]['bank_by_bank'] ?? [];
                    $segments = [];
                    foreach ($byBank as $baId => $amt) {
                        $baName = DB::table('bank_accounts')->where('id', $baId)->value('name') ?: 'Bank';
                        $segments[$baName] = $amt;
                    }
                    $measureData = $segments;
                    break;

                case 'bank.top_account':
                    $byBank = $this->ledgerStream->closingBalances(['bank'], [$asOf], ['bank_account'], $tenantId)[$asOf]['bank_by_bank'] ?? [];
                    $top = !empty($byBank) ? max($byBank) : 0.0;
                    $measureData = ['value' => $top];
                    break;

                case 'bank.money_in':
                    $moneyIn = (float) DB::table('journal_items as ji')
                        ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                        ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                        ->where('je.tenant_id', $tenantId)
                        ->where('ji.tenant_id', $tenantId)
                        ->where('je.is_reversed', 0)
                        ->where(function ($q) {
                            $q->where('a.role', 'bank')->orWhere('a.code', '1010');
                        })
                        ->whereBetween('je.date', [$from, $to])
                        ->sum('ji.debit');
                    $measureData = ['value' => $moneyIn];
                    break;

                case 'bank.money_out':
                    $moneyOut = (float) DB::table('journal_items as ji')
                        ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                        ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                        ->where('je.tenant_id', $tenantId)
                        ->where('ji.tenant_id', $tenantId)
                        ->where('je.is_reversed', 0)
                        ->where(function ($q) {
                            $q->where('a.role', 'bank')->orWhere('a.code', '1010');
                        })
                        ->whereBetween('je.date', [$from, $to])
                        ->sum('ji.credit');
                    $measureData = ['value' => $moneyOut];
                    break;

                case 'bank.cash_vs_bank':
                    $b = $this->ledgerStream->closingBalances(['cash', 'bank'], [$asOf], [], $tenantId)[$asOf];
                    $measureData = [
                        'Cash' => $b['cash'],
                        'Bank' => $b['bank'],
                    ];
                    $options['parent_total'] = $b['cash'] + $b['bank'];
                    break;

                case 'bank.idle_accounts':
                    $idle = DB::table('bank_accounts')
                        ->where('tenant_id', $tenantId)
                        ->where('type', 'bank')
                        ->whereRaw('NOT EXISTS (SELECT 1 FROM journal_items WHERE bank_account_id = bank_accounts.id)')
                        ->get(['id', 'name', 'account_number'])
                        ->toArray();
                    $measureData = ['rows' => $idle];
                    break;
            }
        }

        // ── 4. PAYMENTS ──────────────────────────────────────────────────────
        elseif (str_starts_with($key, 'payments.')) {
            switch ($key) {
                case 'payments.received':
                    $flows = $this->ledgerStream->flows(['gl.cash_in'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $measureData = ['value' => $flows['gl.cash_in']];
                    break;

                case 'payments.received_trend':
                    $points = $this->ledgerStream->dailyCashIn($from, $to, $tenantId);
                    $measureData = ['points' => $points];
                    break;

                case 'payments.paid':
                    $flows = $this->ledgerStream->flows(['gl.cash_out'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $measureData = ['value' => $flows['gl.cash_out']];
                    break;

                case 'payments.net_flow':
                    $flows = $this->ledgerStream->flows(['gl.cash_in', 'gl.cash_out'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $measureData = ['value' => $flows['gl.cash_in'] - $flows['gl.cash_out']];
                    break;

                case 'payments.by_method':
                    $byMethod = $this->paymentsStream->receiptsByMethod($from, $to, $tenantId);
                    $measureData = $byMethod;
                    break;

                case 'payments.cash_vs_digital':
                    $byMethod = $this->paymentsStream->receiptsByMethod($from, $to, $tenantId);
                    $cash = $byMethod['cash'] ?? 0.0;
                    $all = array_sum($byMethod);
                    $measureData = [
                        'numerator'   => $cash,
                        'denominator' => $all,
                    ];
                    break;

                case 'payments.unallocated':
                    $unallocated = $this->paymentsStream->unallocated($asOf, $tenantId);
                    $measureData = ['rows' => $unallocated];
                    break;

                case 'payments.bounced':
                    $measureData = ['value' => 0.0];
                    break;
            }
        }

        // ── 5. EXPENSES ──────────────────────────────────────────────────────
        elseif (str_starts_with($key, 'expenses.')) {
            switch ($key) {
                case 'expenses.count':
                    $summary = $this->expensesStream->summary($from, $to, $tenantId);
                    $measureData = ['value' => $summary['count']];
                    break;

                case 'expenses.trend':
                    $points = $this->ledgerStream->dailyFlow('gl.opex', $from, $to, $tenantId);
                    $measureData = ['points' => $points];
                    break;

                case 'expenses.by_category':
                    $byCat = $this->expensesStream->byCategory($from, $to, $tenantId);
                    $measureData = $byCat;
                    break;

                case 'expenses.top_categories':
                    $byCat = $this->expensesStream->byCategory($from, $to, $tenantId);
                    $rows = [];
                    foreach ($byCat as $cat => $amt) {
                        $rows[] = ['category' => $cat, 'amount' => $amt];
                    }
                    $measureData = ['rows' => $rows];
                    break;

                case 'expenses.unpaid':
                    $summary = $this->expensesStream->summary($from, $to, $tenantId);
                    $measureData = ['value' => $summary['unpaid']];
                    break;

                case 'expenses.largest':
                    $largest = $this->expensesStream->largest($from, $to, $tenantId, 10);
                    $measureData = ['rows' => $largest];
                    break;

                case 'expenses.recurring_total':
                    return ReckonerResult::unavailable($requestId, $key, 'data_not_captured', 'No recurring expense templates exist.', $card, $period);

                case 'expenses.per_day':
                    $summary = $this->expensesStream->summary($from, $to, $tenantId);
                    $days = max(1, \Carbon\Carbon::parse($from)->diffInDays(\Carbon\Carbon::parse($to)) + 1);
                    $measureData = ['value' => round($summary['total'] / $days, 2)];
                    break;

                case 'expenses.vs_prev':
                    $cur = $this->expensesStream->summary($from, $to, $tenantId)['total'];
                    $prev = 0.0;
                    if ($compareFrom && $compareTo) {
                        $prev = $this->expensesStream->summary($compareFrom, $compareTo, $tenantId)['total'];
                    }
                    $measureData = ['value' => round($cur - $prev, 2)];
                    break;
            }
        }

        // ── 6. TAX COMPLIANCE ────────────────────────────────────────────────
        elseif (str_starts_with($key, 'tax.')) {
            switch ($key) {
                case 'tax.collected':
                    $flows = $this->ledgerStream->flows(['gl.tax_collected'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $measureData = ['value' => $flows['gl.tax_collected']];
                    break;

                case 'tax.paid':
                    $flows = $this->ledgerStream->flows(['gl.tax_paid'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId)['w'];
                    $measureData = ['value' => $flows['gl.tax_paid']];
                    break;

                case 'tax.net_liability':
                    $b = $this->ledgerStream->closingBalances(['tax_output', 'tax_input'], [$asOf], [], $tenantId)[$asOf];
                    $measureData = ['value' => $b['tax_output'] - $b['tax_input']];
                    break;

                case 'tax.liability_trend':
                    $points = $this->ledgerStream->dailyTaxLiability($from, $to, $tenantId);
                    $measureData = ['points' => $points];
                    break;

                case 'tax.by_rate':
                    $byRate = $this->taxStream->byRate($from, $to, $tenantId);
                    $measureData = $byRate;
                    break;

                case 'tax.taxable_vs_exempt':
                    $split = $this->taxStream->taxableVsExempt($from, $to, $tenantId);
                    $measureData = $split;
                    break;

                case 'tax.filing_due':
                    return ReckonerResult::unavailable($requestId, $key, 'data_not_captured', 'Tax filing frequency settings not configured.', $card, $period);

                case 'tax.invoices_missing_tax':
                    $missing = DB::table('sales as s')
                        ->where('s.tenant_id', $tenantId)
                        ->whereBetween(DB::raw('DATE(COALESCE(s.posted_at, s.created_at))'), [$from, $to])
                        ->where('s.total_tax', 0)
                        ->whereIn('s.status', ['posted', 'completed'])
                        ->whereNull('s.deleted_at')
                        ->select('s.id', 's.reference_number', DB::raw('DATE(COALESCE(s.posted_at, s.created_at)) as sale_date'), 's.total as total_amount')
                        ->get()
                        ->toArray();
                    $measureData = ['rows' => $missing];
                    break;
            }
        }

        // ── 7. POS (SalesHeadersStream) ───────────────────────────────────────────
        if (str_starts_with($key, 'pos.')) {
            $posSummary = $this->salesHeadersStream->posSummary($from, $to, $tenantId);
            switch ($key) {
                case 'pos.revenue':
                    $measureData = ['value' => $posSummary['net_sales']];
                    break;
                case 'pos.revenue_trend':
                    $points = $this->salesHeadersStream->dailyRevenueTrend($from, $to, $tenantId, 'pos');
                    $measureData = ['points' => $points];
                    break;
                case 'pos.sale_count':
                    $measureData = ['value' => (float) $posSummary['transaction_count']];
                    break;
                case 'pos.avg_ticket':
                    $measureData = ['value' => $posSummary['avg_sale']];
                    break;
                case 'pos.max_sale':
                    $measureData = ['value' => $posSummary['max_sale']];
                    break;
                case 'pos.items_per_sale':
                    $measureData = ['value' => $posSummary['items_per_sale']];
                    break;
                case 'pos.payment_breakdown':
                    $tender = $this->salesHeadersStream->tenderSplit($from, $to, $tenantId);
                    $measureData = ['rows' => $tender];
                    break;
                case 'pos.hourly_heatmap':
                    $heatmap = $this->salesHeadersStream->hourlyHeatmap($from, $to, $tenantId);
                    $measureData = ['rows' => $heatmap];
                    break;
                case 'pos.weekday_split':
                    $rows = DB::table('sales')
                        ->where('tenant_id', $tenantId)
                        ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                        ->where('source', 'pos')
                        ->whereIn('status', ['posted', 'completed'])
                        ->whereNull('deleted_at')
                        ->selectRaw('DAYNAME(COALESCE(posted_at, created_at)) as day, SUM(net_sales) as revenue, COUNT(*) as count')
                        ->groupBy('day')
                        ->orderByRaw('DAYOFWEEK(COALESCE(posted_at, created_at))')
                        ->get()
                        ->map(fn($r) => ['label' => $r->day, 'value' => (float)$r->revenue, 'count' => (int)$r->count])
                        ->toArray();
                    $measureData = ['rows' => $rows];
                    break;
                case 'pos.discount_total':
                    $measureData = ['value' => $posSummary['discounts_given']];
                    break;
                case 'pos.live_feed':
                    $rows = DB::table('sales')
                        ->where('tenant_id', $tenantId)
                        ->where('source', 'pos')
                        ->whereIn('status', ['posted', 'completed'])
                        ->whereNull('deleted_at')
                        ->orderByDesc('created_at')
                        ->limit(20)
                        ->select('id', 'reference_number', DB::raw('COALESCE(posted_at, created_at) as time'), 'net_sales', 'party_id')
                        ->get()
                        ->map(fn($r) => ['ref' => $r->reference_number, 'time' => $r->time, 'amount' => (float)$r->net_sales])
                        ->toArray();
                    $measureData = ['rows' => $rows];
                    break;
            }
        }

        // ── 8. INVOICING (SalesHeadersStream) ─────────────────────────────────────
        if (str_starts_with($key, 'invoicing.')) {
            $invSummary = $this->salesHeadersStream->invoiceSummary($from, $to, $tenantId);
            switch ($key) {
                case 'invoicing.count':
                    $measureData = ['value' => (float) $invSummary['invoice_count']];
                    break;
                case 'invoicing.value':
                    $measureData = ['value' => $invSummary['total_invoiced']];
                    break;
                case 'invoicing.value_trend':
                    $points = $this->salesHeadersStream->dailyRevenueTrend($from, $to, $tenantId, 'invoice');
                    $measureData = ['points' => $points];
                    break;
                case 'invoicing.unpaid_value':
                    $aging = $this->salesHeadersStream->invoiceAging($asOf, $tenantId);
                    $measureData = ['value' => (float) ($aging['total'] ?? 0.0)];
                    break;
                case 'invoicing.overdue_count':
                    $overdueAging = $this->salesHeadersStream->invoiceAging($asOf, $tenantId, true);
                    $measureData = ['value' => (float) ($overdueAging['count'] ?? 0)];
                    break;
                case 'invoicing.overdue_value':
                    $overdueAging = $this->salesHeadersStream->invoiceAging($asOf, $tenantId, true);
                    $measureData = ['value' => (float) ($overdueAging['total'] ?? 0.0)];
                    break;
                case 'invoicing.avg_invoice':
                    $measureData = ['value' => $invSummary['avg_invoice']];
                    break;
                case 'invoicing.avg_days_to_pay':
                    $measureData = ['value' => 0.0];
                    break;
                case 'invoicing.largest_open':
                    $aging = $this->salesHeadersStream->invoiceAging($asOf, $tenantId);
                    $items = $aging['items'] ?? [];
                    $largest = !empty($items) ? max(array_column($items, 'unpaid_amount')) : 0.0;
                    $measureData = ['value' => (float) $largest];
                    break;
                case 'invoicing.draft_count':
                    $draftCount = DB::table('sales')
                        ->where('tenant_id', $tenantId)
                        ->where('source', 'invoice')
                        ->where('status', 'draft')
                        ->whereNull('deleted_at')
                        ->count();
                    $measureData = ['value' => (float) $draftCount];
                    break;
            }
        }

        // ── 9. CUSTOMERS (CustomerLoyaltyStream) ──────────────────────────────────
        if (str_starts_with($key, 'customers.')) {
            $custSummary = $this->customerLoyaltyStream->customerSummary($from, $to, $tenantId);
            switch ($key) {
                case 'customers.count':
                    $measureData = ['value' => (float) $custSummary['count']];
                    break;
                case 'customers.active':
                    $measureData = ['value' => (float) $custSummary['active']];
                    break;
                case 'customers.new':
                    $measureData = ['value' => (float) $custSummary['new']];
                    break;
                case 'customers.owing':
                    $byParty = $this->partyBalancesStream->balancesByParty('ar', $asOf, $tenantId);
                    arsort($byParty);
                    $rows = [];
                    foreach ($byParty as $pid => $amt) {
                        if ($amt > 0) {
                            $name = DB::table('parties')->where('id', $pid)->value('name') ?: 'Unknown';
                            $rows[] = ['party_id' => $pid, 'name' => $name, 'amount' => $amt, 'value' => $amt];
                        }
                    }
                    $measureData = ['rows' => $rows];
                    break;
                case 'customers.repeat_rate':
                    $measureData = ['value' => $custSummary['repeat_rate'] ?? 0.0];
                    break;
                case 'customers.top_customers':
                    $rows = DB::table('sales')
                        ->where('sales.tenant_id', $tenantId)
                        ->whereBetween(DB::raw('DATE(COALESCE(sales.posted_at, sales.created_at))'), [$from, $to])
                        ->whereNotNull('sales.party_id')
                        ->join('parties', function ($j) use ($tenantId) {
                            $j->on('sales.party_id', '=', 'parties.id')
                              ->where('parties.tenant_id', $tenantId)
                              ->whereNull('parties.deleted_at');
                        })
                        ->selectRaw('parties.name, SUM(sales.net_sales) as revenue, COUNT(sales.id) as orders')
                        ->groupBy('parties.id', 'parties.name')
                        ->orderByDesc('revenue')
                        ->limit(10)
                        ->get()
                        ->map(fn($r) => ['label' => $r->name, 'value' => (float)$r->revenue, 'orders' => (int)$r->orders])
                        ->toArray();
                    $measureData = ['rows' => $rows];
                    break;
                case 'customers.new_trend':
                    $points = DB::table('parties')
                        ->where('tenant_id', $tenantId)
                        ->where('type', 'customer')
                        ->whereNull('deleted_at')
                        ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
                        ->selectRaw('DATE(created_at) as day, COUNT(*) as value')
                        ->groupBy('day')
                        ->orderBy('day')
                        ->get()
                        ->map(fn($r) => ['date' => $r->day, 'value' => (int)$r->value])
                        ->toArray();
                    $measureData = ['points' => $points];
                    break;
                case 'customers.dormant':
                    // Customers who haven't bought in the period but have historically
                    $recentBuyers = DB::table('sales')
                        ->where('tenant_id', $tenantId)
                        ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                        ->whereNotNull('party_id')
                        ->pluck('party_id')
                        ->unique()
                        ->toArray();
                    $allBuyers = DB::table('sales')
                        ->where('tenant_id', $tenantId)
                        ->whereNotNull('party_id')
                        ->pluck('party_id')
                        ->unique()
                        ->toArray();
                    $dormant = count(array_diff($allBuyers, $recentBuyers));
                    $measureData = ['value' => (float) $dormant];
                    break;
                case 'customers.avg_spend':
                    $totalRev = (float) (DB::table('sales')
                        ->where('tenant_id', $tenantId)
                        ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                        ->whereIn('status', ['posted', 'completed'])
                        ->whereNull('deleted_at')
                        ->whereNotNull('party_id')
                        ->sum('net_sales') ?? 0.0);
                    $buyerCount = (int) DB::table('sales')
                        ->where('tenant_id', $tenantId)
                        ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                        ->whereIn('status', ['posted', 'completed'])
                        ->whereNull('deleted_at')
                        ->whereNotNull('party_id')
                        ->distinct('party_id')
                        ->count('party_id');
                    $measureData = ['value' => $buyerCount > 0 ? round($totalRev / $buyerCount, 2) : 0.0];
                    break;
                case 'customers.by_area':
                    $rows = $this->customerLoyaltyStream->customersByArea($tenantId);
                    $measureData = ['rows' => $rows];
                    break;
                default:
                    $measureData = ['value' => 0.0];
            }
        }

        // ── 10. SALES RETURNS ─────────────────────────────────────────────────────
        if (str_starts_with($key, 'sales_returns.')) {
            $returnsSummary = $this->salesHeadersStream->returnsSummary($from, $to, $tenantId);
            switch ($key) {
                case 'sales_returns.count':
                    $measureData = ['value' => (float) $returnsSummary['count']];
                    break;
                case 'sales_returns.value':
                    $measureData = ['value' => $returnsSummary['value']];
                    break;
                case 'sales_returns.rate':
                    $grossSales = (float) (DB::table('sales')
                        ->where('tenant_id', $tenantId)
                        ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                        ->whereIn('status', ['posted', 'completed', 'active'])
                        ->whereNull('deleted_at')
                        ->whereNull('original_sale_id')
                        ->sum('net_sales') ?? 0.0);
                    $rate = $grossSales > 0 ? round($returnsSummary['value'] / $grossSales * 100, 2) : 0.0;
                    $measureData = ['value' => $rate];
                    break;
                case 'sales_returns.trend':
                    $points = DB::table('sales')
                        ->where('tenant_id', $tenantId)
                        ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                        ->whereNotNull('original_sale_id')
                        ->whereNull('deleted_at')
                        ->selectRaw('DATE(COALESCE(posted_at, created_at)) as day, SUM(ABS(net_sales)) as value')
                        ->groupBy('day')
                        ->orderBy('day')
                        ->get()
                        ->map(fn($r) => ['date' => $r->day, 'value' => (float)$r->value])
                        ->toArray();
                    $measureData = ['points' => $points];
                    break;
                case 'sales_returns.top_returned':
                    $rows = $this->salesLinesStream->topReturnedProducts($from, $to, $tenantId);
                    $measureData = ['rows' => $rows];
                    break;
                case 'sales_returns.by_reason':
                    $rows = [];
                    foreach ($returnsSummary['by_reason'] ?? [] as $reason => $val) {
                        $rows[] = ['label' => (string)$reason, 'value' => (float)$val];
                    }
                    $measureData = ['rows' => $rows];
                    break;
            }
        }

        // ── 11. QUOTATIONS (OperationsDocStream) ──────────────────────────────────
        if (str_starts_with($key, 'quotations.')) {
            $quoteSummary = $this->operationsDocStream->quotationsSummary($from, $to, $tenantId);
            switch ($key) {
                case 'quotations.count':
                    $measureData = ['value' => (float) $quoteSummary['count']];
                    break;
                case 'quotations.open_value':
                    $measureData = ['value' => $quoteSummary['pipeline_value']];
                    break;
                case 'quotations.win_rate':
                    $measureData = ['value' => $quoteSummary['win_rate']];
                    break;
                case 'quotations.win_rate_trend':
                    $points = $this->operationsDocStream->quotationsWinRateTrend($from, $to, $tenantId);
                    $measureData = ['points' => $points];
                    break;
                case 'quotations.avg_quote':
                    $measureData = ['value' => $quoteSummary['avg_value']];
                    break;
                case 'quotations.expiring':
                    $measureData = ['value' => (float) $quoteSummary['expiring_count']];
                    break;
            }
        }

        // ── 12. SALES ORDERS (OperationsDocStream) ────────────────────────────────
        if (str_starts_with($key, 'sales_orders.')) {
            $soSummary = $this->operationsDocStream->salesOrdersSummary($from, $to, $tenantId);
            switch ($key) {
                case 'sales_orders.open_count':
                    $measureData = ['value' => (float) $soSummary['open_count']];
                    break;
                case 'sales_orders.open_value':
                    $measureData = ['value' => $soSummary['open_value']];
                    break;
                case 'sales_orders.count':
                    $measureData = ['value' => (float) $soSummary['count']];
                    break;
                case 'sales_orders.value_trend':
                    $points = $this->operationsDocStream->salesOrdersDailyTrend($from, $to, $tenantId);
                    $measureData = ['points' => $points];
                    break;
                case 'sales_orders.fulfil_rate':
                    $measureData = ['value' => $soSummary['fulfil_rate']];
                    break;
                case 'sales_orders.overdue':
                    $measureData = ['value' => (float) $soSummary['overdue_count']];
                    break;
                case 'sales_orders.by_customer':
                    $rows = DB::table('sales_orders')
                        ->where('sales_orders.tenant_id', $tenantId)
                        ->whereBetween(DB::raw('DATE(COALESCE(sales_orders.order_date, sales_orders.created_at))'), [$from, $to])
                        ->join('parties', function ($j) use ($tenantId) {
                            $j->on('sales_orders.party_id', '=', 'parties.id')
                              ->where('parties.tenant_id', $tenantId)
                              ->whereNull('parties.deleted_at');
                        })
                        ->selectRaw('parties.name, SUM(sales_orders.total_amount) as value, COUNT(*) as count')
                        ->groupBy('parties.id', 'parties.name')
                        ->orderByDesc('value')
                        ->limit(10)
                        ->get()
                        ->map(fn($r) => ['label' => $r->name, 'value' => (float)$r->value, 'count' => (int)$r->count])
                        ->toArray();
                    $measureData = ['rows' => $rows];
                    break;
            }
        }

        // ── 13. PRICING TIERS (CustomerLoyaltyStream) ────────────────────────────
        if (str_starts_with($key, 'pricing.')) {
            $pricingSummary = $this->customerLoyaltyStream->pricingTierSummary($from, $to, $tenantId);
            $linesSummary   = $this->salesLinesStream->avgRealizedPrice($from, $to, $tenantId);
            $discountVsList = $this->salesLinesStream->discountVsList($from, $to, $tenantId);
            switch ($key) {
                case 'pricing.tier_count':
                    $measureData = ['value' => (float) $pricingSummary['tier_count']];
                    break;
                case 'pricing.revenue_by_tier':
                    $measureData = ['rows' => $pricingSummary['revenue_by_tier']];
                    break;
                case 'pricing.customers_by_tier':
                    $measureData = ['rows' => $pricingSummary['by_tier']];
                    break;
                case 'pricing.avg_realised_price':
                    $measureData = ['value' => $linesSummary['avg_realized_price'] ?? 0.0];
                    break;
                case 'pricing.discount_vs_list':
                    $measureData = ['value' => $discountVsList['discount_pct'] ?? 0.0];
                    break;
            }
        }

        // ── 14. SERVICES (OperationsDocStream) ────────────────────────────────────
        if (str_starts_with($key, 'services.')) {
            $servicesSummary = $this->operationsDocStream->serviceJobsSummary($from, $to, $tenantId);
            switch ($key) {
                case 'services.count':
                case 'services.jobs_count':
                    $measureData = ['value' => (float) $servicesSummary['count']];
                    break;
                case 'services.revenue':
                    $measureData = ['value' => $servicesSummary['revenue']];
                    break;
                case 'services.revenue_trend':
                    $points = DB::table('service_jobs')
                        ->where('tenant_id', $tenantId)
                        ->whereBetween(DB::raw('DATE(COALESCE(completed_at, scheduled_for, created_at))'), [$from, $to])
                        ->selectRaw('DATE(COALESCE(completed_at, scheduled_for, created_at)) as day, SUM(actual_total) as value')
                        ->groupBy('day')
                        ->orderBy('day')
                        ->get()
                        ->map(fn($r) => ['date' => $r->day, 'value' => (float)$r->value])
                        ->toArray();
                    $measureData = ['points' => $points];
                    break;
                case 'services.share_of_revenue':
                    $totalRev = (float) (DB::table('sales')
                        ->where('tenant_id', $tenantId)
                        ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                        ->whereIn('status', ['posted', 'completed'])
                        ->whereNull('deleted_at')
                        ->sum('net_sales') ?? 0.0);
                    $share = $totalRev > 0 ? round($servicesSummary['revenue'] / $totalRev * 100, 2) : 0.0;
                    $measureData = ['value' => $share];
                    break;
                case 'services.top_services':
                    $rows = DB::table('service_jobs')
                        ->where('tenant_id', $tenantId)
                        ->whereBetween(DB::raw('DATE(COALESCE(completed_at, scheduled_for, created_at))'), [$from, $to])
                        ->whereNotNull('title')
                        ->selectRaw('title as label, COUNT(*) as count, SUM(actual_total) as revenue')
                        ->groupBy('title')
                        ->orderByDesc('revenue')
                        ->limit(10)
                        ->get()
                        ->map(fn($r) => ['label' => $r->label, 'value' => (float)$r->revenue, 'count' => (int)$r->count])
                        ->toArray();
                    $measureData = ['rows' => $rows];
                    break;
                case 'services.avg_ticket':
                    $measureData = ['value' => $servicesSummary['avg_val'] ?? 0.0];
                    break;
            }
        }

        // ── 15. STAFF ATTENDANCE (CustomerLoyaltyStream) ─────────────────────────
        if (str_starts_with($key, 'staff.')) {
            $staffSummary = $this->customerLoyaltyStream->staffAttendanceSummary($from, $to, $tenantId);
            switch ($key) {
                case 'staff.member_count':
                    $measureData = ['value' => (float) $staffSummary['member_count']];
                    break;
                case 'staff.on_shift_count':
                    $measureData = ['value' => (float) $staffSummary['on_shift']];
                    break;
                case 'staff.present_today':
                    $measureData = ['value' => (float) $staffSummary['present_today']];
                    break;
                case 'staff.absent_today':
                    // absent = member_count - present_today (approx)
                    $measureData = ['value' => (float) max(0, $staffSummary['member_count'] - $staffSummary['present_today'])];
                    break;
                case 'staff.hours_worked':
                    $measureData = ['value' => $staffSummary['hours_worked']];
                    break;
                case 'staff.attendance_rate':
                    $measureData = ['value' => $staffSummary['attendance_rate']];
                    break;
                case 'staff.sales_by_staff':
                    $measureData = ['rows' => $staffSummary['sales_by_staff']];
                    break;
                case 'staff.revenue_per_staff':
                    $measureData = ['value' => $staffSummary['revenue_per_staff']];
                    break;
            }
        }

        // ── 16. MULTI-LOCATION (ChannelLocationStream) ────────────────────────────
        if (str_starts_with($key, 'locations.')) {
            $locationSummary = $this->channelLocationStream->locationSummary($from, $to, $tenantId);
            switch ($key) {
                case 'locations.count':
                    $measureData = ['value' => (float) $locationSummary['count']];
                    break;
                case 'locations.revenue_by_location':
                    $measureData = ['rows' => $locationSummary['revenue_by_location']];
                    break;
                case 'locations.profit_by_location':
                    // Proxy: revenue minus COGS not available per-location without dedicated tables
                    $measureData = ['rows' => $locationSummary['revenue_by_location']];
                    break;
                case 'locations.stock_by_location':
                    $measureData = ['rows' => $locationSummary['stock_by_location']];
                    break;
                case 'locations.revenue_trend_by_location':
                    $rows = $this->channelLocationStream->revenueTrendByLocation($from, $to, $tenantId);
                    $measureData = ['rows' => $rows];
                    break;
                case 'locations.stock_imbalance':
                    $measureData = ['rows' => $locationSummary['stock_imbalance']];
                    break;
            }
        }

        // ── 17. LOYALTY & GIFT CARDS (CustomerLoyaltyStream) ─────────────────────
        if (str_starts_with($key, 'loyalty.')) {
            $loyaltySummary = $this->customerLoyaltyStream->loyaltySummary($from, $to, $tenantId);
            $giftSummary    = $this->customerLoyaltyStream->giftCardSummary($tenantId);
            switch ($key) {
                case 'loyalty.member_count':
                    $measureData = ['value' => (float) $loyaltySummary['member_count']];
                    break;
                case 'loyalty.new_members':
                    $measureData = ['value' => (float) $loyaltySummary['new_members']];
                    break;
                case 'loyalty.member_revenue_share':
                    $measureData = ['value' => $loyaltySummary['member_revenue_share']];
                    break;
                case 'loyalty.member_avg_spend':
                    $measureData = ['value' => $loyaltySummary['member_avg_spend']];
                    break;
                case 'loyalty.liability':
                    $measureData = ['value' => $loyaltySummary['liability']];
                    break;
                case 'loyalty.gift_card_balance':
                    $measureData = ['value' => $giftSummary['active_balance']];
                    break;
            }
        }

        // ── 18. MARKETPLACE SYNC (ChannelLocationStream) ─────────────────────────
        if (str_starts_with($key, 'marketplace.')) {
            $channelSummary = $this->channelLocationStream->channelSummary($from, $to, $tenantId);
            switch ($key) {
                case 'marketplace.channel_count':
                    $measureData = ['value' => (float) $channelSummary['channel_count']];
                    break;
                case 'marketplace.revenue_by_channel':
                    $measureData = ['rows' => $channelSummary['revenue_by_channel']];
                    break;
                case 'marketplace.online_vs_offline':
                    $measureData = ['rows' => [
                        ['label' => 'Online', 'value' => $channelSummary['online_sales']],
                        ['label' => 'Offline', 'value' => $channelSummary['offline_sales']],
                    ]];
                    break;
                case 'marketplace.sync_errors':
                    $measureData = ['value' => (float) $channelSummary['sync_errors']];
                    break;
                case 'marketplace.stock_mismatch':
                    $measureData = ['value' => (float) $channelSummary['stock_mismatch']];
                    break;
                case 'marketplace.channel_margin':
                    $measureData = ['rows' => $channelSummary['channel_margin']];
                    break;
            }
        }

        // ── 19. RECURRING INVOICES (OperationsDocStream) ─────────────────────────
        if (str_starts_with($key, 'recurring.')) {
            $recurringSummary = $this->operationsDocStream->recurringInvoicesSummary($from, $to, $tenantId);
            switch ($key) {
                case 'recurring.active_count':
                    $measureData = ['value' => (float) $recurringSummary['active_count']];
                    break;
                case 'recurring.monthly_value':
                    $measureData = ['value' => $recurringSummary['monthly_value']];
                    break;
                case 'recurring.trend':
                    $measureData = ['value' => $recurringSummary['trend_pct']];
                    break;
                case 'recurring.due_next_7':
                    $measureData = ['value' => (float) $recurringSummary['due_next_7']];
                    break;
                case 'recurring.share_of_revenue':
                    $measureData = ['value' => $recurringSummary['share_of_revenue']];
                    break;
                case 'recurring.churned':
                    $measureData = ['value' => (float) $recurringSummary['churned_count']];
                    break;
            }
        }

        // ── 20. B2B PROPOSALS (OperationsDocStream) ───────────────────────────────
        if (str_starts_with($key, 'proposals.')) {
            $proposalSummary = $this->operationsDocStream->proposalsSummary($from, $to, $tenantId);
            switch ($key) {
                case 'proposals.count':
                    $measureData = ['value' => (float) $proposalSummary['count']];
                    break;
                case 'proposals.pipeline_value':
                    $measureData = ['value' => $proposalSummary['pipeline_value']];
                    break;
                case 'proposals.win_rate':
                    $measureData = ['value' => $proposalSummary['win_rate']];
                    break;
                case 'proposals.avg_value':
                    $measureData = ['value' => $proposalSummary['avg_value']];
                    break;
                case 'proposals.stale':
                    $measureData = ['value' => (float) $proposalSummary['stale_count']];
                    break;
                case 'proposals.avg_cycle_days':
                    $measureData = ['value' => $proposalSummary['avg_cycle_days']];
                    break;
            }
        }

                // ── 21. PRODUCTS (10 cards) ──────────────────────────────────────────
        elseif (str_starts_with($key, 'products.')) {
            $prodSummary = $this->stockOperationsStream->productsSummary($from, $to, $tenantId);
            switch ($key) {
                case 'products.count':
                    $measureData = ['value' => (float) $prodSummary['count']];
                    break;
                case 'products.active_count':
                    $measureData = ['value' => (float) $prodSummary['active_count']];
                    break;
                case 'products.by_category':
                    $measureData = $prodSummary['by_category'];
                    break;
                case 'products.catalogue_value':
                    $measureData = ['value' => (float) $prodSummary['catalogue_value']];
                    break;
                case 'products.avg_margin':
                    $measureData = ['value' => (float) $prodSummary['avg_margin']];
                    break;
                case 'products.top_margin':
                    $measureData = ['rows' => $prodSummary['top_margin']];
                    break;
                case 'products.lowest_margin':
                    $measureData = ['rows' => $prodSummary['lowest_margin']];
                    break;
                case 'products.never_sold':
                    $measureData = ['rows' => $prodSummary['never_sold']];
                    break;
                case 'products.missing_cost':
                    $measureData = ['value' => (float) $prodSummary['missing_cost']];
                    break;
                case 'products.new_this_period':
                    $measureData = ['value' => (float) $prodSummary['new_this_period']];
                    break;
            }
        }

        // ── 22. SUPPLIERS (8 cards) ──────────────────────────────────────────
        elseif (str_starts_with($key, 'suppliers.')) {
            $supSummary = $this->stockOperationsStream->suppliersSummary($from, $to, $tenantId);
            switch ($key) {
                case 'suppliers.count':
                    $measureData = ['value' => (float) $supSummary['count']];
                    break;
                case 'suppliers.active':
                    $measureData = ['value' => (float) $supSummary['active']];
                    break;
                case 'suppliers.top_suppliers':
                    $measureData = ['rows' => $supSummary['top_suppliers']];
                    break;
                case 'suppliers.spend_total':
                    $measureData = ['value' => (float) $supSummary['spend_total']];
                    break;
                case 'suppliers.spend_trend':
                    $measureData = ['points' => $this->purchaseHeadersStream->dailySpendTrend($from, $to, $tenantId)];
                    break;
                case 'suppliers.owed_list':
                    $byParty = $this->partyBalancesStream->balancesByParty('ap', $asOf, $tenantId);
                    arsort($byParty);
                    $rows = [];
                    foreach ($byParty as $pid => $amt) {
                        if ($amt > 0) {
                            $name = DB::table('parties')->where('id', $pid)->value('name') ?: 'Supplier';
                            $rows[] = ['party_id' => $pid, 'name' => $name, 'label' => $name, 'amount' => $amt, 'value' => $amt];
                        }
                    }
                    $measureData = ['rows' => $rows];
                    break;
                case 'suppliers.concentration':
                    $measureData = ['value' => (float) $supSummary['concentration']];
                    break;
                case 'suppliers.new':
                    $measureData = ['value' => (float) $supSummary['new']];
                    break;
            }
        }

        // ── 23. INVENTORY (12 cards) ─────────────────────────────────────────
        elseif (str_starts_with($key, 'inventory.')) {
            switch ($key) {
                case 'inventory.stock_value':
                    $measureData = ['value' => $this->stockPositionsStream->stockValuation($asOf, $tenantId)];
                    break;
                case 'inventory.stock_value_trend':
                    $measureData = ['points' => $this->stockPositionsStream->valuationTrend($from, $to, $tenantId)];
                    break;
                case 'inventory.product_count':
                    $measureData = ['value' => (float) DB::table('products')->where('tenant_id', $tenantId)->whereNull('deleted_at')->where('is_active', 1)->count()];
                    break;
                case 'inventory.units_on_hand':
                    $measureData = ['value' => $this->stockPositionsStream->unitsOnHand($asOf, $tenantId)];
                    break;
                case 'inventory.low_stock_count':
                    $measureData = ['value' => $this->stockPositionsStream->lowStockCount($tenantId)];
                    break;
                case 'inventory.low_stock_list':
                    $measureData = ['rows' => $this->stockPositionsStream->lowStockList($tenantId)];
                    break;
                case 'inventory.out_of_stock_count':
                    $measureData = ['value' => $this->stockPositionsStream->outOfStockCount($tenantId)];
                    break;
                case 'inventory.dead_stock_value':
                    $measureData = ['value' => $this->stockPositionsStream->deadStockValue($asOf, $from, $tenantId)];
                    break;
                case 'inventory.turnover_ratio':
                    $measureData = ['value' => $this->stockPositionsStream->turnoverRatio($from, $to, $tenantId)];
                    break;
                case 'inventory.days_of_cover':
                    $measureData = ['value' => $this->stockPositionsStream->daysOfCover($from, $to, $tenantId)];
                    break;
                case 'inventory.value_by_category':
                    $measureData = $this->stockPositionsStream->valueByCategory($asOf, $tenantId);
                    break;
                case 'inventory.top_by_value':
                    $measureData = ['rows' => $this->stockPositionsStream->topStockByValue($asOf, $tenantId)];
                    break;
            }
        }

        // ── 24. PURCHASES (9 cards) ──────────────────────────────────────────
        elseif (str_starts_with($key, 'purchases.')) {
            $purchSummary = $this->purchaseHeadersStream->purchaseSummary($from, $to, $tenantId);
            switch ($key) {
                case 'purchases.spend':
                    $measureData = ['value' => $purchSummary['spend']];
                    break;
                case 'purchases.spend_trend':
                    $measureData = ['points' => $this->purchaseHeadersStream->dailySpendTrend($from, $to, $tenantId)];
                    break;
                case 'purchases.count':
                    $measureData = ['value' => $purchSummary['count']];
                    break;
                case 'purchases.unpaid_value':
                    $measureData = ['value' => $this->purchaseHeadersStream->purchaseAging($asOf, $tenantId)['unpaid_value']];
                    break;
                case 'purchases.overdue_value':
                    $measureData = ['value' => $this->purchaseHeadersStream->purchaseAging($asOf, $tenantId, true)['overdue_value']];
                    break;
                case 'purchases.paid_to_suppliers':
                    $measureData = ['value' => $this->purchaseHeadersStream->paidToSuppliers($from, $to, $tenantId)];
                    break;
                case 'purchases.by_supplier':
                    $measureData = $this->purchaseHeadersStream->bySupplier($from, $to, $tenantId);
                    break;
                case 'purchases.by_category':
                    $measureData = $this->purchaseHeadersStream->byCategory($from, $to, $tenantId);
                    break;
                case 'purchases.price_increases':
                    $measureData = ['rows' => []];
                    break;
            }
        }

        // ── 25. PURCHASE ORDERS (6 cards) ────────────────────────────────────
        elseif (str_starts_with($key, 'po.')) {
            $poSummary = $this->purchaseHeadersStream->purchaseOrdersSummary($from, $to, $tenantId);
            switch ($key) {
                case 'po.open_count':
                    $measureData = ['value' => $poSummary['open_count']];
                    break;
                case 'po.open_value':
                    $measureData = ['value' => $poSummary['open_value']];
                    break;
                case 'po.pending_receipt_value':
                    $measureData = ['value' => $poSummary['pending_receipt_value']];
                    break;
                case 'po.overdue_count':
                    $measureData = ['value' => $poSummary['overdue_count']];
                    break;
                case 'po.avg_lead_days':
                    $measureData = ['value' => $poSummary['avg_lead_days']];
                    break;
                case 'po.fill_rate':
                    $measureData = ['value' => $poSummary['fill_rate']];
                    break;
            }
        }

        // ── 26. PURCHASE RETURNS (5 cards) ───────────────────────────────────
        elseif (str_starts_with($key, 'purchase_returns.')) {
            $prSummary = $this->purchaseHeadersStream->purchaseReturnsSummary($from, $to, $tenantId);
            switch ($key) {
                case 'purchase_returns.count':
                    $measureData = ['value' => $prSummary['count']];
                    break;
                case 'purchase_returns.value':
                    $measureData = ['value' => $prSummary['value']];
                    break;
                case 'purchase_returns.credit_due':
                    $measureData = ['value' => $prSummary['credit_due']];
                    break;
                case 'purchase_returns.by_supplier':
                    $measureData = $prSummary['by_supplier'];
                    break;
                case 'purchase_returns.rate':
                    $measureData = ['value' => $prSummary['rate']];
                    break;
            }
        }

        // ── 28. STOCK TRANSFERS (5 cards) ────────────────────────────────────
        elseif (str_starts_with($key, 'transfers.')) {
            $transSummary = $this->stockOperationsStream->stockTransfersSummary($from, $to, $tenantId);
            switch ($key) {
                case 'transfers.count':
                    $measureData = ['value' => $transSummary['count']];
                    break;
                case 'transfers.pending_count':
                    $measureData = ['value' => $transSummary['pending_count']];
                    break;
                case 'transfers.pending_value':
                    $measureData = ['value' => $transSummary['pending_value']];
                    break;
                case 'transfers.avg_transit_days':
                    $measureData = ['value' => $transSummary['avg_transit_days']];
                    break;
                case 'transfers.discrepancy_count':
                    $measureData = ['value' => $transSummary['discrepancy_count']];
                    break;
            }
        }

        // ── 29. STOCK TAKES (5 cards) ────────────────────────────────────────
        elseif (str_starts_with($key, 'stocktakes.')) {
            $stSummary = $this->stockOperationsStream->stockTakesSummary($from, $to, $tenantId);
            switch ($key) {
                case 'stocktakes.pending_count':
                    $measureData = ['value' => $stSummary['pending_count']];
                    break;
                case 'stocktakes.variance_value':
                    $measureData = ['value' => $stSummary['variance_value']];
                    break;
                case 'stocktakes.variance_pct':
                    $measureData = ['value' => $stSummary['variance_pct']];
                    break;
                case 'stocktakes.last_count_days':
                    $measureData = ['value' => $stSummary['last_count_days']];
                    break;
                case 'stocktakes.top_variances':
                    $measureData = ['rows' => $stSummary['top_variances']];
                    break;
            }
        }

        // ── 30. BATCHES & EXPIRY (7 cards) ───────────────────────────────────
        elseif (str_starts_with($key, 'batches.')) {
            $batchSummary = $this->stockOperationsStream->batchesSummary($asOf, $tenantId);
            switch ($key) {
                case 'batches.count':
                    $measureData = ['value' => $batchSummary['count']];
                    break;
                case 'batches.qty':
                    $measureData = ['value' => $batchSummary['qty']];
                    break;
                case 'batches.expiring_30':
                    $measureData = ['value' => $batchSummary['expiring_30']];
                    break;
                case 'batches.expiring_value':
                    $measureData = ['value' => $batchSummary['expiring_value']];
                    break;
                case 'batches.expired_value':
                    $measureData = ['value' => $batchSummary['expired_value']];
                    break;
                case 'batches.expiry_list':
                    $measureData = ['rows' => $batchSummary['expiry_list']];
                    break;
                case 'batches.write_off_trend':
                    $measureData = ['points' => []];
                    break;
            }
        }

        // ── 31. SERIALS (5 cards) ────────────────────────────────────────────
        elseif (str_starts_with($key, 'serials.')) {
            $serSummary = $this->stockOperationsStream->serialsSummary($asOf, $tenantId);
            switch ($key) {
                case 'serials.count':
                    $measureData = ['value' => $serSummary['count']];
                    break;
                case 'serials.in_stock':
                    $measureData = ['value' => $serSummary['in_stock']];
                    break;
                case 'serials.under_warranty':
                    $measureData = ['value' => $serSummary['under_warranty']];
                    break;
                case 'serials.warranty_expiring':
                    $measureData = ['rows' => $serSummary['warranty_expiring']];
                    break;
                case 'serials.returned':
                    $measureData = ['value' => $serSummary['returned']];
                    break;
            }
        }

        // ── 32. VARIANTS (5 cards) ───────────────────────────────────────────
        elseif (str_starts_with($key, 'variants.')) {
            $varSummary = $this->stockOperationsStream->variantsSummary($asOf, $tenantId);
            switch ($key) {
                case 'variants.count':
                    $measureData = ['value' => $varSummary['count']];
                    break;
                case 'variants.top_variants':
                    $measureData = ['rows' => $varSummary['top_variants']];
                    break;
                case 'variants.slow_variants':
                    $measureData = ['rows' => $varSummary['slow_variants']];
                    break;
                case 'variants.out_of_stock':
                    $measureData = ['value' => $varSummary['out_of_stock']];
                    break;
                case 'variants.size_colour_mix':
                    $measureData = $varSummary['size_colour_mix'];
                    break;
            }
        }

        // ── 33. BARCODES (5 cards) ───────────────────────────────────────────
        elseif (str_starts_with($key, 'barcodes.')) {
            $totalProds = (float) DB::table('products')->where('tenant_id', $tenantId)->whereNull('deleted_at')->count();
            $withBarcode = (float) DB::table('products')->where('tenant_id', $tenantId)->whereNull('deleted_at')->whereNotNull('sku')->where('sku', '!=', '')->count();
            switch ($key) {
                case 'barcodes.coverage_pct':
                    $measureData = ['value' => $totalProds > 0 ? round($withBarcode / $totalProds * 100, 2) : 0.0];
                    break;
                case 'barcodes.missing_count':
                    $measureData = ['value' => max(0.0, $totalProds - $withBarcode)];
                    break;
                case 'barcodes.labels_printed':
                    $measureData = ['value' => 0.0];
                    break;
                case 'barcodes.scan_share':
                    $measureData = ['value' => null];
                    break;
                case 'barcodes.duplicate_count':
                    $dups = DB::table('products')
                        ->where('tenant_id', $tenantId)
                        ->whereNull('deleted_at')
                        ->whereNotNull('sku')
                        ->select('sku')
                        ->groupBy('sku')
                        ->havingRaw('COUNT(*) > 1')
                        ->count();
                    $measureData = ['value' => (float) $dups];
                    break;
            }
        }

        // ── 34. UNITS OF MEASURE (5 cards) ───────────────────────────────────
        elseif (str_starts_with($key, 'uom.')) {
            $uomSummary = $this->stockOperationsStream->uomSummary($tenantId);
            switch ($key) {
                case 'uom.count':
                    $measureData = ['value' => $uomSummary['count']];
                    break;
                case 'uom.conversion_count':
                    $measureData = ['value' => $uomSummary['conversion_count']];
                    break;
                case 'uom.sales_by_uom':
                    $measureData = $uomSummary['sales_by_uom'];
                    break;
                case 'uom.missing_conversion':
                    $measureData = ['value' => $uomSummary['missing_conversion']];
                    break;
                case 'uom.bulk_vs_retail':
                    $measureData = $uomSummary['bulk_vs_retail'];
                    break;
            }
        }

        // ── 35. COMPOSITE ITEMS (5 cards) ────────────────────────────────────
        elseif (str_starts_with($key, 'composite.')) {
            $compSummary = $this->stockOperationsStream->compositeSummary($from, $to, $tenantId);
            switch ($key) {
                case 'composite.count':
                    $measureData = ['value' => $compSummary['count']];
                    break;
                case 'composite.revenue':
                    $measureData = ['value' => $compSummary['revenue']];
                    break;
                case 'composite.margin':
                    $measureData = ['value' => $compSummary['margin']];
                    break;
                case 'composite.top_bundles':
                    $measureData = ['rows' => $compSummary['top_bundles']];
                    break;
                case 'composite.component_shortage':
                    $measureData = ['rows' => $compSummary['component_shortage']];
                    break;
            }
        }

        // ── 37. PRODUCTION RUNS (8 cards) ────────────────────────────────────
        elseif (str_starts_with($key, 'production.')) {
            $prodRunSummary = $this->stockOperationsStream->productionRunsSummary($from, $to, $tenantId);
            switch ($key) {
                case 'production.run_count':
                    $measureData = ['value' => $prodRunSummary['run_count']];
                    break;
                case 'production.total_cost':
                    $measureData = ['value' => $prodRunSummary['total_cost']];
                    break;
                case 'production.output_qty':
                    $measureData = ['value' => $prodRunSummary['output_qty']];
                    break;
                case 'production.cost_per_unit':
                    $measureData = ['value' => $prodRunSummary['cost_per_unit']];
                    break;
                case 'production.yield_pct':
                    $measureData = ['value' => $prodRunSummary['yield_pct']];
                    break;
                case 'production.wastage_value':
                    $measureData = ['value' => 0.0];
                    break;
                case 'production.in_progress':
                    $measureData = ['value' => $prodRunSummary['in_progress']];
                    break;
                case 'production.output_trend':
                    $measureData = ['points' => $prodRunSummary['output_trend']];
                    break;
            }
        }

        // ── 38. PARK & RECALL (3 cards) ──────────────────────────────────────
        elseif (str_starts_with($key, 'park.')) {
            $parkSummary = $this->operationsSpecialtyStream->parkSummary($from, $to, $tenantId);
            switch ($key) {
                case 'park.open_count':
                    $measureData = ['value' => $parkSummary['open_count']];
                    break;
                case 'park.open_value':
                    $measureData = ['value' => $parkSummary['open_value']];
                    break;
                case 'park.oldest':
                    $measureData = ['value' => $parkSummary['oldest']];
                    break;
            }
        }

        // ── 39. TABLE SERVICE (6 cards) ──────────────────────────────────────
        elseif (str_starts_with($key, 'tables.')) {
            $tableSummary = $this->operationsSpecialtyStream->tablesSummary($from, $to, $tenantId);
            switch ($key) {
                case 'tables.occupied':
                    $measureData = ['value' => $tableSummary['occupied']];
                    break;
                case 'tables.kitchen_pending':
                    $measureData = ['value' => $tableSummary['kitchen_pending']];
                    break;
                case 'tables.avg_turn_minutes':
                    $measureData = ['value' => $tableSummary['avg_turn_minutes']];
                    break;
                case 'tables.occupancy_rate':
                    $measureData = ['value' => $tableSummary['occupancy_rate']];
                    break;
                case 'tables.revenue_per_table':
                    $measureData = $tableSummary['revenue_per_table'];
                    break;
                case 'tables.peak_occupancy':
                    $measureData = ['matrix' => $tableSummary['peak_occupancy']];
                    break;
            }
        }

        // ── 40. REPORTS SHORTCUTS (3 cards) ──────────────────────────────────
        elseif (str_starts_with($key, 'reports.')) {
            $repSummary = $this->operationsSpecialtyStream->reportsSummary($from, $to, $tenantId);
            switch ($key) {
                case 'reports.pnl_shortcut':
                    $measureData = $repSummary['pnl_shortcut'];
                    break;
                case 'reports.sales_shortcut':
                    $measureData = $repSummary['sales_shortcut'];
                    break;
                case 'reports.stock_shortcut':
                    $measureData = $repSummary['stock_shortcut'];
                    break;
            }
        }

        // ── 41. AI INSIGHTS (6 cards) ────────────────────────────────────────
        elseif (str_starts_with($key, 'ai.')) {
            $aiSummary = $this->operationsSpecialtyStream->aiSummary($from, $to, $tenantId);
            switch ($key) {
                case 'ai.top_insight':
                    $measureData = $aiSummary['top_insight'];
                    break;
                case 'ai.alerts_open':
                    $measureData = ['value' => $aiSummary['alerts_open']];
                    break;
                case 'ai.anomalies':
                    $measureData = ['rows' => $aiSummary['anomalies']];
                    break;
                case 'ai.forecast_revenue':
                    $measureData = ['points' => $aiSummary['forecast_revenue']];
                    break;
                case 'ai.forecast_cash':
                    $measureData = ['points' => $aiSummary['forecast_cash']];
                    break;
                case 'ai.reorder_suggestions':
                    $measureData = ['rows' => $aiSummary['reorder_suggestions']];
                    break;
            }
        }

        // ── 42. FIXED ASSETS & LOANS INTERIM GL (3 cards) ────────────────────
        elseif ($key === 'assets.gross_value' || $key === 'loans.outstanding_total' || $key === 'loans.outstanding_trend') {
            $interim = $this->operationsSpecialtyStream->interimLedgerSummary($from, $to, $tenantId);
            switch ($key) {
                case 'assets.gross_value':
                    $measureData = ['value' => $interim['assets_gross_value']];
                    break;
                case 'loans.outstanding_total':
                    $measureData = ['value' => $interim['loans_outstanding_total']];
                    break;
                case 'loans.outstanding_trend':
                    $measureData = ['points' => $interim['loans_outstanding_trend']];
                    break;
            }
        }

        // Project data into canonical card shape
        $projected = $projection->project($measureData, $card, $period, $options);

        // Run card checks if defined
        $checksToRun = (array) ($card['contract']['checks'] ?? []);
        $failedLedgerCheck = null;
        foreach ($checksToRun as $inv) {
            $checkRes = ReckonerInvariants::check($inv, $tenant, $period, [
                'card_key' => $key,
                'data'     => $projected['data'],
            ]);
            $checks[] = [
                'key'        => $inv,
                'status'     => $checkRes['status'] ?? ($checkRes['passed'] ? 'pass' : 'fail'),
                'difference' => $checkRes['difference'] ?? 0.0,
                'message'    => $checkRes['message'],
            ];

            if (($checkRes['status'] ?? '') === 'fail' || !($checkRes['passed'] ?? false)) {
                $category = ReckonerInvariants::INVARIANTS[$inv] ?? 'ledger';
                if ($category === 'ledger' && !$failedLedgerCheck) {
                    $failedLedgerCheck = $checkRes;
                }
            }
        }

        $today = now()->toDateString();
        $isStored = ($to < $today) && \App\Reckoner\Rollup\DirtyDayTracker::isClean($tenantId, $from, $to);
        $freshness = $isStored ? 'stored' : ($from < $today && $to >= $today ? 'mixed' : 'live');

        $periodKind = $card['period_kind'] ?? ($card['contract']['period_kind'] ?? 'flow');
        if ($periodKind === 'live' || $periodKind === 'position' || ($card['shape'] ?? '') === 'gauge') {
            $ttl = 30;
        } elseif ($to >= $today) {
            $ttl = 60;
        } else {
            $ttl = 86400;
        }

        $meta = array_merge($projected['meta'] ?? [], [
            'checks'       => $checks,
            'freshness'    => $freshness,
            'ttl'          => $ttl,
            'data_version' => (int) ($tenant->reckoner_data_version ?? 0),
        ]);

        if ($failedLedgerCheck) {
            return ReckonerResult::failure(
                id: $requestId,
                key: $key,
                code: 'books_disagree',
                message: $failedLedgerCheck['message'],
                checks: $checks,
                meta: $meta
            );
        }

        return ReckonerResult::success(
            id: $requestId,
            key: $key,
            shape: $shape,
            definition: $card,
            period: $period,
            data: $projected['data'],
            meta: $meta
        );
    }

    protected function getProjectionForCard(array $card): ProjectionInterface
    {
        $shape = strtolower($card['shape'] ?? $card['viz'] ?? 'stat');

        return match ($shape) {
            'stat', 'scalar' => new StatProjection(),
            'trend', 'series' => new TrendProjection(),
            'breakdown' => new BreakdownProjection(),
            'list', 'ranking' => new ListProjection(),
            'gauge' => new GaugeProjection(),
            'status' => new StatusProjection(),
            'heatmap', 'table' => new HeatmapProjection(),
            default => new StatProjection(),
        };
    }
}
