<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\FinancialReportingService;
use App\Support\CsvSafe;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Facades\Excel;

class ReportExportController extends Controller
{
    /**
     * Permission(s) needed to export each report. data.export is always required
     * on top (route middleware); the user also needs ANY ONE of these.
     */
    private const REPORT_PERMISSIONS = [
        'trial_balance'       => ['reports.financial'],
        'profit_loss'         => ['reports.financial'],
        'balance_sheet'       => ['reports.financial'],
        'aged_receivables'    => ['reports.financial'],
        'aged_payables'       => ['reports.financial'],
        'cogs'                => ['reports.financial'],
        'tax'                 => ['reports.financial'],
        'sales'               => ['reports.financial', 'reports.performance'],
        'purchases'           => ['reports.financial', 'reports.stock'],
        'inventory_valuation' => ['reports.financial', 'reports.stock'],
    ];

    public function __construct(private FinancialReportingService $frs) {}

    public function export(Request $request)
    {
        $validated = $request->validate([
            'report' => ['required', 'in:trial_balance,profit_loss,balance_sheet,aged_receivables,aged_payables,inventory_valuation,sales,purchases,cogs,tax'],
            'from'   => ['nullable', 'date'],
            'to'     => ['nullable', 'date'],
            'format' => ['required', 'in:json,csv,xlsx'],
        ]);

        $from = $validated['from'] ?? null;
        $to   = $validated['to']   ?? Carbon::today()->toDateString();

        // Per-report permission: data.export alone is not enough to pull a report
        // the user could not open on screen.
        $user = $request->user();
        $allowed = collect(self::REPORT_PERMISSIONS[$validated['report']])
            ->contains(fn ($p) => $user && $user->hasPermission($p));
        if (!$allowed) {
            $message = 'You do not have permission to export this report.';
            if ($request->expectsJson() || $request->is('api/*') || $validated['format'] === 'json') {
                return response()->json(['message' => $message, 'error' => 'forbidden'], 403);
            }
            abort(403, $message);
        }

        $tenant = app('current.tenant');
        if ($tenant && !\App\Services\PlanGate::check('report_export', $tenant)) {
            $planName = $tenant->plan === 'ltd' ? $tenant->effectivePlan() : $tenant->plan;
            $message = 'Report exports are available on Starter and higher plans.';

            if ($request->expectsJson() || $request->is('api/*') || ($request->input('format') === 'json')) {
                return response()->json([
                    'message'      => $message,
                    'code'         => 'plan_upgrade_required',
                    'action'       => 'upgrade',
                    'upgrade'      => true,
                    'plan_feature' => 'report_export',
                    'current_plan' => $planName,
                ], 403);
            }

            $storeSlug = $tenant->slug;
            $upgradeUrl = \Illuminate\Support\Facades\Route::has('store.billing.upgrade')
                ? route('store.billing.upgrade', ['store_slug' => $storeSlug, 'feature' => 'report_export'])
                : route('store.billing', ['store_slug' => $storeSlug]);

            return redirect($upgradeUrl)->with('plan_limit', [
                'type'         => 'plan_limit',
                'code'         => 'plan_upgrade_required',
                'feature'      => 'report_export',
                'message'      => $message,
                'current_plan' => $planName,
            ]);
        }

        $reportSuffix = str_replace('_', '-', $validated['report']);
        if ($tenant && !\App\Support\ReportModuleMap::visible($tenant, $reportSuffix)) {
            $owner = \App\Support\ReportModuleMap::OWNERS[$reportSuffix] ?? null;
            $message = \App\Support\ReportModuleMap::refusalFor($reportSuffix);

            if ($request->expectsJson() || $request->is('api/*') || $validated['format'] === 'json') {
                return response()->json([
                    'message' => $message,
                    'error'   => 'module_disabled',
                    'module'  => $owner,
                ], 403);
            }

            abort(403, $message);
        }

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

        if ($validated['format'] === 'json') {
            return response()->json($data);
        }

        $grid = $this->toGrid($this->normalize($data));
        if (empty($grid)) {
            return response('No data', 204);
        }

        $filename = str_replace('_', '-', $validated['report']) . '-' . $to;

        if ($validated['format'] === 'xlsx') {
            $export = new class($grid) implements FromArray, ShouldAutoSize {
                public function __construct(private array $rows) {}
                public function array(): array { return $this->rows; }
            };
            return Excel::download($export, $filename . '.xlsx');
        }

        $out = "\xEF\xBB\xBF"; // UTF-8 BOM so Excel reads non-English names correctly
        foreach ($grid as $row) {
            $out .= implode(',', array_map(function ($v) {
                $v = (string) $v;
                return '"' . str_replace('"', '""', $v) . '"';
            }, $row)) . "\r\n";
        }
        return response($out, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}.csv\"",
        ]);
    }

    /** Turn whatever the service returned (array, Arrayable, JsonSerializable) into a plain array. */
    private function normalize(mixed $data): array
    {
        return json_decode(json_encode($data), true) ?: [];
    }

    private function isList(mixed $v): bool
    {
        return is_array($v) && $v !== [] && array_is_list($v);
    }

    private function isRecordList(mixed $v): bool
    {
        return $this->isList($v) && is_array($v[0]);
    }

    /**
     * Flatten a report into a single sheet: the main table first (headers + rows),
     * then every other list as its own titled block, then the scalar totals.
     */
    private function toGrid(array $data): array
    {
        $grid    = [];
        $scalars = [];
        $blocks  = [];

        foreach ($data as $key => $value) {
            if ($this->isRecordList($value)) {
                $blocks[] = [$this->label($key), $value];
            } elseif (is_array($value) && isset($value['accounts']) && $this->isRecordList($value['accounts'])) {
                // Balance-sheet style section: {label, accounts[], total}
                $blocks[] = [$value['label'] ?? $this->label($key), $value['accounts']];
                if (isset($value['total'])) {
                    $scalars[] = [($value['label'] ?? $this->label($key)) . ' total', $value['total']];
                }
            } elseif (is_array($value)) {
                foreach ($value as $k => $v) {
                    if (!is_array($v)) $scalars[] = [$this->label($key) . ' ' . $this->label($k), $v];
                }
            } else {
                $scalars[] = [$this->label($key), $value];
            }
        }

        // Put the block called "Rows" first so the main table leads the sheet.
        usort($blocks, fn ($a, $b) => ($b[0] === 'Rows') <=> ($a[0] === 'Rows'));

        $single = count($blocks) === 1 && $blocks[0][0] === 'Rows';
        foreach ($blocks as [$title, $rows]) {
            if ($grid) $grid[] = [];
            if (!$single) $grid[] = [CsvSafe::cell($title)];
            $headers = [];
            foreach ($rows as $r) {
                foreach (array_keys((array) $r) as $h) {
                    if (!in_array($h, $headers, true)) $headers[] = $h;
                }
            }
            $grid[] = array_map(fn ($h) => CsvSafe::cell($this->label($h)), $headers);
            foreach ($rows as $r) {
                $r = (array) $r;
                $grid[] = array_map(fn ($h) => CsvSafe::cell($r[$h] ?? ''), $headers);
            }
        }

        if ($scalars) {
            if ($grid) $grid[] = [];
            foreach ($scalars as [$label, $value]) {
                $grid[] = [CsvSafe::cell($label), CsvSafe::cell($value)];
            }
        }

        return $grid;
    }

    private function label(int|string $key): string
    {
        return ucfirst(str_replace('_', ' ', (string) $key));
    }
}
