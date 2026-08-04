<?php

namespace App\Http\Controllers;

use App\Models\PublicToolRequest;
use App\Services\PublicToolBudgetGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicToolController extends Controller
{
    public function showInvoiceScanner(): Response
    {
        return Inertia::render('Marketing/Tools/InvoiceScanner', [
            'turnstileSiteKey' => config('services.cloudflare.turnstile_site_key', ''),
        ]);
    }

    public function submitInvoiceScanner(Request $request, PublicToolBudgetGuard $guard): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|max:255',
            'file'  => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
        ]);

        $email = strtolower(trim($request->input('email')));
        $ip    = $request->ip() ?? '127.0.0.1';

        $check = $guard->checkBudgetAndLimits($email, $ip, 10.00);

        if (!$check['allowed']) {
            return response()->json([
                'error'   => $check['message'],
                'reason'  => $check['reason'],
                'waitlist' => true,
            ], 429);
        }

        // Mock watermarked result for public tool demonstration
        $extractedItems = [
            [
                'item_name' => 'SAMPLE PRODUCT - SAMPLE ONLY',
                'qty'       => 10,
                'unit_price' => 15.00,
                'total'     => 150.00,
            ],
            [
                'item_name' => 'WATERMARKED INVOICE LINE ITEM',
                'qty'       => 5,
                'unit_price' => 20.00,
                'total'     => 100.00,
            ],
        ];

        $resultPayload = [
            'vendor_name' => 'Demo Vendor (Watermarked Output)',
            'invoice_no'  => 'INV-FREE-' . rand(1000, 9999),
            'date'        => now()->toDateString(),
            'subtotal'    => 250.00,
            'items'       => $extractedItems,
            'watermark'   => 'FREE SCANNER DEMO — SIGN UP FOR VENQORE TO REMOVE WATERMARK',
        ];

        // Estimated API cost: $0.012 per document scan
        $costUsd = 0.0120;

        PublicToolRequest::create([
            'email'       => $email,
            'ip_address'  => $ip,
            'feature'     => 'public_tool',
            'result_json' => $resultPayload,
            'cost_usd'    => $costUsd,
            'created_at'  => now(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => $resultPayload,
        ]);
    }
}
