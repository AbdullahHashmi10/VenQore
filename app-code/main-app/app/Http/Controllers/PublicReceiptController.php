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
        $token = rtrim(strtr(base64_encode($payload . ':' . substr($sig, 0, 16)), '+/', '-_'), '=');

        return url('/r/' . $token);
    }

    /**
     * Show the public customer receipt.
     */
    public function show(string $token)
    {
        $decoded = base64_decode(strtr($token, '-_', '+/'), true);
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
        // The verified capability grants access only to this sale. Keep soft-delete
        // scopes and constrain every related tenant-owned query explicitly.
        $sale = Sale::withoutGlobalScope('tenant')->find($saleId);
        if (!$sale || in_array($sale->status, ['draft', 'void', 'voided', 'cancelled'], true)) {
            abort(404, 'Receipt not found or transaction was voided.');
        }

        $tenantId = $sale->tenant_id;
        $scope = fn ($query) => $query->withoutGlobalScope('tenant')
            ->where($query->getModel()->qualifyColumn('tenant_id'), $tenantId);
        $sale->load(['tenant', 'customer' => $scope, 'items' => $scope,
            'items.product' => $scope, 'payments' => $scope]);
        $settings = \App\Models\Setting::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)->pluck('value', 'key');

        return response()->view('invoices.public_receipt', [
            'settings' => $settings,
            'sale' => $sale,
            'store' => $sale->tenant,
            'customer' => $sale->customer,
            'items' => $sale->items ?? [],
        ])->header('Cache-Control', 'private, no-store')->header('X-Robots-Tag', 'noindex, nofollow')->header('Referrer-Policy', 'no-referrer');
    }
}
