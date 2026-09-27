<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PublicReceiptController extends Controller
{
    /**
     * Generate a signed, time-limited, privacy-preserving public receipt URL.
     * Valid for 30 days from generation.
     */
    public static function generateReceiptUrl($sale): string
    {
        if (!$sale || empty($sale->id)) {
            return url('/receipt-preview');
        }

        $appKey = config('app.key', 'venqore_receipt_secret');
        $timestamp = time() + (30 * 86400); // 30 days validity
        $payload = $sale->id . ':' . $timestamp;
        $sig = hash_hmac('sha256', $payload, $appKey);
        $token = base64_encode($payload . ':' . substr($sig, 0, 16));

        return url('/r/' . $token);
    }

    /**
     * Show the public customer receipt.
     */
    public function show(string $token)
    {
        $decoded = base64_decode($token, true);
        if (!$decoded) {
            abort(404, 'Invalid or malformed receipt token.');
        }

        $parts = explode(':', $decoded);
        if (count($parts) !== 3) {
            abort(404, 'Invalid receipt link structure.');
        }

        [$saleId, $expiry, $sig] = $parts;

        // Verify expiry
        if ((int)$expiry < time()) {
            abort(410, 'This receipt link has expired for privacy and security reasons.');
        }

        // Verify HMAC signature
        $appKey = config('app.key', 'venqore_receipt_secret');
        $expectedSig = substr(hash_hmac('sha256', $saleId . ':' . $expiry, $appKey), 0, 16);
        if (!hash_equals($expectedSig, $sig)) {
            abort(403, 'Invalid receipt verification signature.');
        }

        // Fetch sale without leaking internal margin data
        $sale = Sale::with(['tenant', 'customer', 'items.product'])->find($saleId);
        if (!$sale) {
            abort(404, 'Receipt not found or transaction was voided.');
        }

        return view('invoices.public_receipt', [
            'sale' => $sale,
            'store' => $sale->tenant,
            'customer' => $sale->customer,
            'items' => $sale->items ?? [],
        ]);
    }

    /**
     * Customer verification by sale ID/UUID.
     */
    public function verifyById(string $id)
    {
        $sale = Sale::with(['tenant', 'customer', 'items.product'])->find($id);
        if (!$sale || $sale->status !== 'posted') {
            abort(404, 'Receipt not found, cancelled, or not yet posted.');
        }

        return view('invoices.public_receipt', [
            'sale' => $sale,
            'store' => $sale->tenant,
            'customer' => $sale->customer,
            'items' => $sale->items ?? [],
        ]);
    }
}
