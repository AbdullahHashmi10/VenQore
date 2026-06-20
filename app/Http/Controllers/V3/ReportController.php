<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\ReportTierGate;
use App\Services\V3\ReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private ReportService $reports) {}

    public function trialBalance(Request $request)
    {
        ReportTierGate::enforce('reports.trial-balance');
        $asOf = $request->has('as_of') ? Carbon::parse($request->query('as_of')) : null;
        return response()->json($this->reports->trialBalance($asOf));
    }

    public function profitAndLoss(Request $request)
    {
        ReportTierGate::enforce('reports.profit-loss');
        $from = $request->has('from') ? Carbon::parse($request->query('from')) : Carbon::today()->startOfMonth();
        $to   = $request->has('to') ? Carbon::parse($request->query('to')) : Carbon::today();
        return response()->json($this->reports->profitAndLoss($from, $to));
    }

    public function balanceSheet(Request $request)
    {
        ReportTierGate::enforce('reports.balance-sheet');
        $asOf = $request->has('as_of') ? Carbon::parse($request->query('as_of')) : Carbon::today();
        return response()->json($this->reports->balanceSheet($asOf));
    }

    public function cashFlow(Request $request)
    {
        ReportTierGate::enforce('reports.cash-flow');
        $from = $request->has('from') ? Carbon::parse($request->query('from')) : Carbon::today()->startOfMonth();
        $to   = $request->has('to') ? Carbon::parse($request->query('to')) : Carbon::today();
        return response()->json($this->reports->cashFlow($from, $to));
    }

    public function agedReceivables(Request $request)
    {
        ReportTierGate::enforce('reports.sale-aging');
        $asOf = $request->has('as_of') ? Carbon::parse($request->query('as_of')) : null;
        return response()->json($this->reports->agedReceivables($asOf));
    }

    public function agedPayables(Request $request)
    {
        ReportTierGate::enforce('reports.sale-aging');
        $asOf = $request->has('as_of') ? Carbon::parse($request->query('as_of')) : null;
        return response()->json($this->reports->agedPayables($asOf));
    }

    public function sales(Request $request)
    {
        ReportTierGate::enforce('reports.sales');
        $from      = $request->has('from') ? Carbon::parse($request->query('from')) : Carbon::today()->startOfMonth();
        $to        = $request->has('to') ? Carbon::parse($request->query('to')) : Carbon::today();
        $partyId   = $request->query('party_id');
        $productId = $request->query('product_id');
        return response()->json($this->reports->salesReport($from, $to, $partyId, $productId));
    }

    public function purchases(Request $request)
    {
        ReportTierGate::enforce('reports.purchases');
        $from    = $request->has('from') ? Carbon::parse($request->query('from')) : Carbon::today()->startOfMonth();
        $to      = $request->has('to') ? Carbon::parse($request->query('to')) : Carbon::today();
        $partyId = $request->query('party_id');
        return response()->json($this->reports->purchasesReport($from, $to, $partyId));
    }

    public function inventoryValuation(Request $request)
    {
        ReportTierGate::enforce('reports.stock-valuation');
        $warehouseId = $request->query('warehouse_id');
        return response()->json($this->reports->inventoryValuation($warehouseId));
    }

    public function cogs(Request $request)
    {
        ReportTierGate::enforce('reports.item-wise-profit');
        $from = $request->has('from') ? Carbon::parse($request->query('from')) : Carbon::today()->startOfMonth();
        $to   = $request->has('to') ? Carbon::parse($request->query('to')) : Carbon::today();
        return response()->json($this->reports->cogsReport($from, $to));
    }

    public function grossProfit(Request $request)
    {
        ReportTierGate::enforce('reports.item-wise-profit');
        $from      = $request->has('from') ? Carbon::parse($request->query('from')) : Carbon::today()->startOfMonth();
        $to        = $request->has('to') ? Carbon::parse($request->query('to')) : Carbon::today();
        $productId = $request->query('product_id');
        return response()->json($this->reports->grossProfit($from, $to, $productId));
    }

    public function tax(Request $request)
    {
        ReportTierGate::enforce('reports.tax');
        $from = $request->has('from') ? Carbon::parse($request->query('from')) : Carbon::today()->startOfMonth();
        $to   = $request->has('to') ? Carbon::parse($request->query('to')) : Carbon::today();
        return response()->json($this->reports->taxReport($from, $to));
    }

    public function partyLedger(Request $request, string $partyId)
    {
        ReportTierGate::enforce('reports.party-statement');
        $from = $request->has('from') ? Carbon::parse($request->query('from')) : Carbon::today()->startOfMonth();
        $to   = $request->has('to') ? Carbon::parse($request->query('to')) : Carbon::today();
        return response()->json($this->reports->partyLedger($partyId, $from, $to));
    }

    public function inventoryMovement(Request $request)
    {
        ReportTierGate::enforce('reports.movement-history');
        $from      = $request->has('from') ? Carbon::parse($request->query('from')) : Carbon::today()->startOfMonth();
        $to        = $request->has('to') ? Carbon::parse($request->query('to')) : Carbon::today();
        $productId = $request->query('product_id');
        return response()->json($this->reports->inventoryMovement($from, $to, $productId));
    }
}
