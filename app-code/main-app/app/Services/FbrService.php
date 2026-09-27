<?php

namespace AppServices;

use AppModelsSale;
use IlluminateSupportFacadesHttp;
use IlluminateSupportFacadesLog;

class FbrService
{
    protected $apiUrl;
    protected $posId;
    protected $usin;
    protected $authToken;
    protected $environment; // 'sandbox' or 'live'

    public function __construct()
    {
        $settings = \App\Models\Setting::all()->pluck('value', 'key');
        $this->posId = $settings['fbr_pos_id'] ?? '';
        $this->usin = $settings['fbr_usin'] ?? '';
        $this->authToken = $settings['fbr_auth_token'] ?? config('services.fbr.token', '');
        $this->environment = $settings['fbr_environment'] ?? (config('services.fbr.environment', 'sandbox'));
        
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

        // If credentials are not set, do not mark as reported
        if (empty($this->posId) || empty($this->usin)) {
            Log::warning('[FBR] Missing POS ID or USIN configuration.');
            return [
                'Code' => 0,
                'Response' => 'Configuration Error: Missing POS ID or USIN',
                'InvoiceNumber' => null,
                'QRData' => null,
            ];
        }

        // Live Mode or configured Sandbox API Request
        if (!empty($this->authToken) || $this->environment === 'live') {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->authToken,
                    'Content-Type' => 'application/json',
                ])->timeout(10)->post($this->apiUrl, $data);

                if ($response->successful()) {
                    $json = $response->json();
                    if (isset($json['Code']) && $json['Code'] == 100) {
                        return [
                            'Code' => 100,
                            'Response' => $json['Response'] ?? 'Success',
                            'InvoiceNumber' => $json['InvoiceNumber'] ?? ('FBR-' . $this->posId . '-' . time()),
                            'QRData' => $json['QRData'] ?? ('https://verify.fbr.gov.pk/verify/' . time()),
                        ];
                    }
                    Log::error('[FBR] Rejected response: ' . $response->body());
                    return [
                        'Code' => $json['Code'] ?? 400,
                        'Response' => $json['Response'] ?? 'Rejected by FBR',
                        'InvoiceNumber' => null,
                        'QRData' => null,
                    ];
                }

                Log::error('[FBR] HTTP Error: ' . $response->status() . ' Body: ' . $response->body());
                return [
                    'Code' => $response->status(),
                    'Response' => 'HTTP Error: ' . $response->body(),
                    'InvoiceNumber' => null,
                    'QRData' => null,
                ];
            } catch (\Exception $e) {
                Log::error('[FBR] Connection Exception: ' . $e->getMessage());
                return [
                    'Code' => 500,
                    'Response' => 'Connection Exception: ' . $e->getMessage(),
                    'InvoiceNumber' => null,
                    'QRData' => null,
                ];
            }
        }

        // Sandbox Mode fallback (explicit sandbox indicator)
        Log::info('[FBR] Running in local Sandbox mode for sale #' . $sale->id);
        return [
            'Code' => 100,
            'Response' => 'Sandbox Simulated Success',
            'InvoiceNumber' => 'SANDBOX-FBR-' . $this->posId . '-' . time(),
            'QRData' => 'https://verify.fbr.gov.pk/sandbox/' . time(),
            'is_sandbox' => true,
        ];
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
