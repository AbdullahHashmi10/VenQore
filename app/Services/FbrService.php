<?php

namespace App\Services;

use App\Models\Sale;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FbrService
{
    protected $apiUrl = 'https://ims.fbr.gov.pk/api/Live/PostData'; // Example live URL
    protected $posId;
    protected $usin;

    public function __construct()
    {
        $settings = \App\Models\Setting::all()->pluck('value', 'key');
        $this->posId = $settings['fbr_pos_id'] ?? '123456';
        $this->usin = $settings['fbr_usin'] ?? 'ABC-123';
    }

    /**
     * Report a sale to FBR.
     */
    public function reportSale(Sale $sale)
    {
        $data = [
            'InvoiceNumber' => '', // FBR will return this or we generate based on pattern
            'POSID' => (int) $this->posId,
            'USIN' => $this->usin,
            'DateTime' => $sale->created_at->format('Y-m-d H:i:s'),
            'BuyerName' => $sale->customer->name ?? 'Walk-in',
            'BuyerNTN' => $sale->customer->ntn ?? '',
            'BuyerCNIC' => $sale->customer->cnic ?? '',
            'BuyerPhoneNumber' => $sale->customer->phone ?? '',
            'TotalBill' => (double) $sale->total,
            'TotalQuantity' => (double) $sale->items->sum('quantity'),
            'TotalSaleValue' => (double) $sale->subtotal,
            'TotalTaxCharged' => (double) $sale->tax,
            'Discount' => (double) $sale->discount,
            'PaymentMode' => $this->getPaymentModeCode($sale->payment_method),
            'InvoiceType' => 1, // 1 for New, 2 for Debit Note, 3 for Credit Note
            'Items' => $sale->items->map(function ($item) {
                return [
                    'ItemCode' => $item->product->sku ?? $item->product_id,
                    'ItemName' => $item->product->name,
                    'PCTCode' => $item->product->hsn_code ?? '0000.0000',
                    'Quantity' => (double) $item->quantity,
                    'TaxRate' => $item->tax_rate ?? 17.0, // Default tax rate
                    'SaleValue' => (double) $item->subtotal,
                    'TaxCharged' => (double) ($item->subtotal * 0.17), // Example calculation
                    'TotalAmount' => (double) ($item->subtotal * 1.17),
                    'InvoiceType' => 1,
                    'RefInvoiceNumber' => '',
                ];
            })->toArray(),
        ];

        // In a real scenario, we would send this to FBR
        // For now, we simulate a successful response

        /*
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.fbr.token'),
            ])->post($this->apiUrl, $data);

            if ($response->successful()) {
                return $response->json();
            }
            Log::error('FBR Reporting Failed: ' . $response->body());
        } catch (\Exception $e) {
            Log::error('FBR Connection Error: ' . $e->getMessage());
        }
        */

        // Mock Response
        return [
            'Code' => 100,
            'Response' => 'Success',
            'InvoiceNumber' => 'FBR-' . $this->posId . '-' . time(),
            'QRData' => 'https://verify.fbr.gov.pk/verify/' . time(),
        ];
    }

    private function getPaymentModeCode($method)
    {
        $method = strtolower($method);
        if ($method === 'cash')
            return 1;
        if ($method === 'card' || $method === 'bank')
            return 2;
        return 3; // Other
    }
}
