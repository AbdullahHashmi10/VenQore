<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\ReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class ReportExportController extends Controller
{
    public function __construct(private ReportService $reports) {}

    public function export(Request $request)
    {
        $validated = $request->validate([
            'report' => ['required', 'in:trial_balance,profit_loss,balance_sheet,aged_receivables,aged_payables,inventory_valuation,sales,purchases,cogs,tax'],
            'from'   => ['nullable', 'date'],
            'to'     => ['nullable', 'date'],
            'format' => ['required', 'in:json,csv'],
        ]);

        $from = isset($validated['from']) ? Carbon::parse($validated['from']) : null;
        $to   = isset($validated['to'])   ? Carbon::parse($validated['to'])   : Carbon::today();

        $data = match($validated['report']) {
            'trial_balance'      => $this->reports->trialBalance($to),
            'profit_loss'        => $this->reports->profitAndLoss($from ?? Carbon::today()->startOfYear(), $to),
            'balance_sheet'      => $this->reports->balanceSheet($to),
            'aged_receivables'   => $this->reports->agedReceivables($to),
            'aged_payables'      => $this->reports->agedPayables($to),
            'inventory_valuation'=> $this->reports->inventoryValuation(),
            'sales'              => $this->reports->salesReport($from ?? Carbon::today()->startOfMonth(), $to),
            'purchases'          => $this->reports->purchasesReport($from ?? Carbon::today()->startOfMonth(), $to),
            'cogs'               => $this->reports->cogsReport($from ?? Carbon::today()->startOfMonth(), $to),
            'tax'                => $this->reports->taxReport($from ?? Carbon::today()->startOfMonth(), $to),
        };

        if ($validated['format'] === 'csv') {
            return $this->toCsv($data, $validated['report']);
        }

        return response()->json($data);
    }

    private function toCsv(array $data, string $reportName): \Illuminate\Http\Response
    {
        $rows = $data['rows'] ?? $data;

        if (empty($rows)) {
            return Response::make('No data', 204);
        }

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
