<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\FinancialReportingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class ReportExportController extends Controller
{
    public function __construct(private FinancialReportingService $frs) {}

    public function export(Request $request)
    {
        $validated = $request->validate([
            'report' => ['required', 'in:trial_balance,profit_loss,balance_sheet,aged_receivables,aged_payables,inventory_valuation,sales,purchases,cogs,tax'],
            'from'   => ['nullable', 'date'],
            'to'     => ['nullable', 'date'],
            'format' => ['required', 'in:json,csv'],
        ]);

        $from = $validated['from'] ?? null;
        $to   = $validated['to']   ?? Carbon::today()->toDateString();

        $data = match($validated['report']) {
            'trial_balance'       => $this->frs->getTrialBalance($to),
            'profit_loss'         => $this->frs->getProfitAndLoss($from ?? Carbon::today()->startOfYear()->toDateString(), $to),
            'balance_sheet'       => $this->frs->getBalanceSheet($to),
            'aged_receivables'    => $this->frs->getAgedReceivables($to),
            'aged_payables'       => $this->frs->getAgedPayables($to),
            'inventory_valuation' => ['rows' => $this->frs->getInventoryValuationReport()->toArray(), 'grand_total' => $this->frs->getInventoryValue()],
            'sales'               => $this->frs->getSalesReport($from ?? Carbon::today()->startOfMonth()->toDateString(), $to),
            'purchases'           => $this->frs->getPurchasesReport($from ?? Carbon::today()->startOfMonth()->toDateString(), $to),
            'cogs'                => $this->frs->getCogsReport($from ?? Carbon::today()->startOfMonth()->toDateString(), $to),
            'tax'                 => $this->frs->getTaxSummary($from ?? Carbon::today()->startOfMonth()->toDateString(), $to),
        };

        if ($validated['format'] === 'csv') {
            return $this->toCsv($data, $validated['report']);
        }
        return response()->json($data);
    }

    private function toCsv(array $data, string $reportName): \Illuminate\Http\Response
    {
        $rows = $data['rows'] ?? $data;
        if (empty($rows)) { return Response::make('No data', 204); }
        $csv  = implode(',', array_keys((array)$rows[0])) . "\n";
        foreach ($rows as $row) {
            $csv .= implode(',', array_map(
                fn($v) => '"' . str_replace('"', '""', $v) . '"',
                array_values((array)$row)
            )) . "\n";
        }
        return Response::make($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$reportName}.csv\"",
        ]);
    }
}
