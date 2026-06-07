<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Models\Sale;
use App\Services\FbrService;
use App\Helpers\SettingsHelper;

class EInvoicingController extends Controller
{
    public function index()
    {
        $today = now()->today();

        $generatedToday = Sale::whereDate('posted_at', $today)
            ->where('is_fbr_reported', true)
            ->count();

        $todayTotal = Sale::whereDate('posted_at', $today)->count();
        $successRate = $todayTotal > 0 ? round(($generatedToday / $todayTotal) * 100) : 100;

        $pendingGeneration = Sale::where('status', 'posted')
            ->where('is_fbr_reported', false)
            ->count();

        $waybillsToday = Sale::whereDate('posted_at', $today)
            ->whereNotNull('eway_bill_number')
            ->count();

        $pendingWaybills = Sale::where('status', 'posted')
            ->whereNull('eway_bill_number')
            ->count();

        $invoices = Sale::with(['customer', 'items.product'])
            ->posted()
            ->orderBy('posted_at', 'desc')
            ->take(100)
            ->get();

        return Inertia::render('EInvoicing/EInvoicing', [
            'invoices' => $invoices,
            'fbr_enabled' => SettingsHelper::get('fbr_integration') == '1',
            'stats' => [
                'generated_today' => $generatedToday,
                'waybills_today' => $waybillsToday,
                'success_rate' => $successRate . '%',
                'pending_generation' => $pendingGeneration,
                'pending_waybills' => $pendingWaybills,
                'failed_errors' => 0
            ]
        ]);
    }

    public function generate(Request $request, FbrService $fbrService)
    {
        $request->validate([
            'sale_id' => 'required|exists:sales,id'
        ]);

        $sale = Sale::with(['customer', 'items.product'])->findOrFail($request->sale_id);

        try {
            $fbrRes = $fbrService->reportSale($sale);

            if (($fbrRes['Code'] ?? 0) == 100) {
                $sale->update([
                    'fbr_invoice_number' => $fbrRes['InvoiceNumber'],
                    'fbr_qr_data' => $fbrRes['QRData'],
                    'is_fbr_reported' => true
                ]);

                return back()->with('success', 'E-Invoice reported to FBR successfully! Reference: ' . $fbrRes['InvoiceNumber']);
            }

            return back()->with('error', 'FBR reporting failed: ' . ($fbrRes['Response'] ?? 'Unknown Error'));
        } catch (\Exception $e) {
            return back()->with('error', 'FBR connection error: ' . $e->getMessage());
        }
    }

    public function generateWaybill(Request $request)
    {
        $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'transporter_name' => 'required|string|max:255',
            'vehicle_number' => 'required|string|max:50'
        ]);

        $sale = Sale::findOrFail($request->sale_id);

        try {
            $ewayBillNumber = 'EWB-' . date('Ymd') . '-' . rand(100000, 999999);

            $sale->update([
                'transporter_name' => $request->transporter_name,
                'vehicle_number' => $request->vehicle_number,
                'eway_bill_number' => $ewayBillNumber
            ]);

            return back()->with('success', 'E-Way Bill generated successfully! Reference: ' . $ewayBillNumber);
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to generate E-Way Bill: ' . $e->getMessage());
        }
    }
}
