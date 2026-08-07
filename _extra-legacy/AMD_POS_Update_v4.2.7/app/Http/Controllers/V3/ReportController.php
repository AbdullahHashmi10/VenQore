<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\FinancialReportingService;
use App\Services\ReportTierGate;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private FinancialReportingService $frs) {}

    public function trialBalance(Request $request)
    {
        ReportTierGate::enforce('reports.trial-balance');
        $asOf = $request->has('as_of') ? $request->query('as_of') : null;
        return response()->json($this->frs->getTrialBalance($asOf));
    }

    public function profitAndLoss(Request $request)
    {
        ReportTierGate::enforce('reports.profit-loss');
        $from = $request->has('from') ? $request->query('from') : Carbon::today()->startOfMonth()->toDateString();
        $to   = $request->has('to')   ? $request->query('to')   : Carbon::today()->toDateString();
        return response()->json($this->frs->getProfitAndLoss($from, $to));
    }

    public function balanceSheet(Request $request)
    {
        ReportTierGate::enforce('reports.balance-sheet');
        $asOf = $request->has('as_of') ? $request->query('as_of') : Carbon::today()->toDateString();
        return response()->json($this->frs->getBalanceSheet($asOf));
    }

    public function cashFlow(Request $request)
    {
        ReportTierGate::enforce('reports.cash-flow');
        $from = $request->has('from') ? $request->query('from') : Carbon::today()->startOfMonth()->toDateString();
        $to   = $request->has('to')   ? $request->query('to')   : Carbon::today()->toDateString();
        return response()->json($this->frs->getDetailedCashFlow($from, $to));
    }

    public function agedReceivables(Request $request)
    {
        ReportTierGate::enforce('reports.sale-aging');
        $asOf = $request->has('as_of') ? $request->query('as_of') : null;
        return response()->json($this->frs->getAgedReceivables($asOf));
    }

    public function agedPayables(Request $request)
    {
        ReportTierGate::enforce('reports.sale-aging');
        $asOf = $request->has('as_of') ? $request->query('as_of') : null;
        return response()->json($this->frs->getAgedPayables($asOf));
    }

    public function sales(Request $request)
    {
        ReportTierGate::enforce('reports.sales');
        $from      = $request->has('from') ? $request->query('from') : Carbon::today()->startOfMonth()->toDateString();
        $to        = $request->has('to')   ? $request->query('to')   : Carbon::today()->toDateString();
        $partyId   = $request->query('party_id');
        $productId = $request->query('product_id');
        return response()->json($this->frs->getSalesReport($from, $to, $partyId, $productId));
    }

    public function purchases(Request $request)
    {
        ReportTierGate::enforce('reports.purchases');
        $from    = $request->has('from') ? $request->query('from') : Carbon::today()->startOfMonth()->toDateString();
        $to      = $request->has('to')   ? $request->query('to')   : Carbon::today()->toDateString();
        $partyId = $request->query('party_id');
        return response()->json($this->frs->getPurchasesReport($from, $to, $partyId));
    }

    public function inventoryValuation(Request $request)
    {
        ReportTierGate::enforce('reports.stock-valuation');
        $rows = $this->frs->getInventoryValuationReport()->map(fn($row) => [
            'product_id'  => $row['id'],
            'name'        => $row['name'],
            'sku'         => $row['sku'],
            'category'    => $row['category'],
            'total_qty'   => $row['stock_quantity'],
            'unit_cost'   => $row['unit_cost'],
            'total_value' => $row['stock_value'],
            'retail_value'=> $row['retail_value'],
        ]);
        return response()->json([
            'rows'        => $rows->values()->toArray(),
            'grand_total' => $this->frs->getInventoryValue(),
        ]);
    }

    public function cogs(Request $request)
    {
        ReportTierGate::enforce('reports.item-wise-profit');
        $from = $request->has('from') ? $request->query('from') : Carbon::today()->startOfMonth()->toDateString();
        $to   = $request->has('to')   ? $request->query('to')   : Carbon::today()->toDateString();
        return response()->json($this->frs->getCogsReport($from, $to));
    }

    public function grossProfit(Request $request)
    {
        ReportTierGate::enforce('reports.item-wise-profit');
        $from      = $request->has('from') ? $request->query('from') : Carbon::today()->startOfMonth()->toDateString();
        $to        = $request->has('to')   ? $request->query('to')   : Carbon::today()->toDateString();
        $productId = $request->query('product_id');
        return response()->json($this->frs->getGrossProfitByProduct($from, $to)->toArray());
    }

    public function tax(Request $request)
    {
        ReportTierGate::enforce('reports.tax');
        $from = $request->has('from') ? $request->query('from') : Carbon::today()->startOfMonth()->toDateString();
        $to   = $request->has('to')   ? $request->query('to')   : Carbon::today()->toDateString();
        return response()->json($this->frs->getTaxSummary($from, $to));
    }

    public function partyLedger(Request $request, string $partyId)
    {
        ReportTierGate::enforce('reports.party-statement');
        $from = $request->has('from') ? $request->query('from') : Carbon::today()->startOfMonth()->toDateString();
        $to   = $request->has('to')   ? $request->query('to')   : Carbon::today()->toDateString();
        return response()->json($this->frs->getPartyLedger($partyId, $from, $to));
    }

    public function inventoryMovement(Request $request)
    {
        ReportTierGate::enforce('reports.movement-history');
        $from      = $request->has('from') ? $request->query('from') : Carbon::today()->startOfMonth()->toDateString();
        $to        = $request->has('to')   ? $request->query('to')   : Carbon::today()->toDateString();
        $productId = $request->query('product_id');
        return response()->json($this->frs->getInventoryMovement($from, $to, $productId));
    }
}
