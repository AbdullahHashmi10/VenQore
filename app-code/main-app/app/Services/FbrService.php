<?php

namespace App\Services;

use App\Models\Sale;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FbrService
{
    protected $apiUrl;
    protected $posId;
    protected $usin;
    protected $authToken;
    protected $environment; // 'sandbox', 'live', or 'disabled'

    public function __construct()
    {
        $settings = \App\Models\Setting::all()->pluck('value', 'key');
        $this->posId = $settings['fbr_pos_id'] ?? '';
        $this->usin = $settings['fbr_usin'] ?? '';
        $this->authToken = $settings['fbr_auth_token'] ?? config('services.fbr.token', '');
        
        $rawEnv = strtolower((string) ($settings['fbr_environment'] ?? $settings['fbr_mode'] ?? config('services.fbr.environment', 'sandbox')));
        if ($rawEnv === 'disabled' || ($settings['fbr_integration'] ?? '0') === '0') {
            $this->environment = 'disabled';
        } elseif (in_array($rawEnv, ['live', 'production'], true)) {
            $this->environment = 'live';
        } else {
            $this->environment = 'sandbox';
        }
        
        $defaultUrl = $this->environment === 'live'
            ? 'https://ims.fbr.gov.pk/api/Live/PostData'
            : 'https://ims.fbr.gov.pk/api/Sandbox/PostData';

        $this->apiUrl = $settings['fbr_api_url'] ?? config('services.fbr.url', $defaultUrl);
    }

    /**
     * Report a sale to FBR.
     */
    public function reportSale(Sale $sale)
    {
        if ($this->environment === 'disabled') {
            return [
                'Code' => 0,
                'Response' => 'FBR integration is disabled',
                'InvoiceNumber' => null,
                'QRData' => null,
            ];
        }

        // Build accurate payload from sale data and actual item taxes
        $data = [
            'InvoiceNumber' => '',
            'POSID' => (int) $this->posId,
            'USIN' => $this->usin,
            'DateTime' => $sale->created_at ? $sale->created_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s'),
            'BuyerName' => $sale->customer->name ?? 'Walk-in Customer',
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
                $rate = (double) ($item->tax_rate ?? 0);
                $saleValue = (double) ($item->subtotal ?? ($item->unit_price * $item->quantity));
                $taxCharged = (double) ($item->tax_amount ?? ($saleValue * ($rate / 100)));
                $totalAmount = (double) ($item->total ?? ($saleValue + $taxCharged));

                return [
                    'ItemCode' => (string) ($item->product->sku ?? $item->product_id),
                    'ItemName' => $item->product->name ?? 'Item',
                    'PCTCode' => $item->product->hsn_code ?? '0000.0000',
                    'Quantity' => (double) $item->quantity,
                    'TaxRate' => $rate,
                    'SaleValue' => $saleValue,
                    'TaxCharged' => $taxCharged,
                    'TotalAmount' => $totalAmount,
                    'InvoiceType' => 1,
                    'RefInvoiceNumber' => '',
                ];
            })->toArray(),
        ];

        // Validate that credentials and token are present before attempting gateway communication
        if (empty($this->posId) || empty($this->usin) || empty($this->authToken)) {
            Log::warning('[FBR] Incomplete FBR credentials (missing POS ID, USIN, or Auth Token).');
            return [
                'Code' => 0,
                'Response' => 'Configuration Error: Missing POS ID, USIN, or Auth Token',
                'InvoiceNumber' => null,
                'QRData' => null,
            ];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->authToken,
                'Content-Type' => 'application/json',
            ])->timeout(10)->post($this->apiUrl, $data);

            if ($response->successful()) {
                $json = $response->json();
                if (isset($json['Code']) && $json['Code'] == 100 && !empty($json['InvoiceNumber'])) {
                    return [
                        'Code' => 100,
                        'Response' => $json['Response'] ?? 'Success',
                        'InvoiceNumber' => $json['InvoiceNumber'],
                        'QRData' => $json['QRData'] ?? null,
                    ];
                }
                Log::error('[FBR] Rejected response from gateway: ' . $response->body());
                return [
                    'Code' => $json['Code'] ?? 400,
                    'Response' => $json['Response'] ?? 'Rejected by FBR Gateway',
                    'InvoiceNumber' => null,
                    'QRData' => null,
                ];
            }

            Log::error('[FBR] HTTP Error: ' . $response->status() . ' Body: ' . $response->body());
            return [
                'Code' => $response->status(),
                'Response' => 'FBR Gateway HTTP Error (' . $response->status() . ')',
                'InvoiceNumber' => null,
                'QRData' => null,
            ];
        } catch (\Exception $e) {
            Log::error('[FBR] Connection Exception: ' . $e->getMessage());
            return [
                'Code' => 500,
                'Response' => 'FBR Gateway Connection Exception: ' . $e->getMessage(),
                'InvoiceNumber' => null,
                'QRData' => null,
            ];
        }
    }

    private function getPaymentModeCode($method)
    {
        $method = strtolower($method ?? '');
        if ($method === 'cash') {
            return 1;
        }
        if ($method === 'card' || $method === 'bank') {
            return 2;
        }
        return 3; // Other
    }
}
