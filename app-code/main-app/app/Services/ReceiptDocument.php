<?php
namespace App\Services;

use App\Models\Sale;
use App\Models\Setting;

final class ReceiptDocument
{
    public static function prepare(Sale $sale): array
    {
        if (!$sale->tenant_id) throw new \InvalidArgumentException('Receipt tenant is required.');
        $tenantId = $sale->tenant_id;
        $scope = fn ($query) => $query->withoutGlobalScope('tenant')
            ->where($query->getModel()->qualifyColumn('tenant_id'), $tenantId);
        $sale->load(['customer' => $scope, 'items' => $scope, 'items.product' => $scope,
            'items.productVariant' => $scope, 'payments' => $scope, 'user', 'tenant']);
        $settings = Setting::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)->pluck('value', 'key')->all();

        $settings['business_name'] = $settings['business_name'] ?? $sale->tenant?->name ?? $settings['store_name'] ?? 'Store';
        $settings['business_address'] = $settings['business_address'] ?? $sale->tenant?->address ?? $settings['address'] ?? '';
        $settings['business_phone'] = $settings['business_phone'] ?? $sale->tenant?->phone ?? $settings['phone'] ?? '';
        $settings['business_email'] = $settings['business_email'] ?? $sale->tenant?->email ?? $settings['email'] ?? '';
        $settings['currency_symbol'] = $settings['currency_symbol'] ?? $sale->tenant?->currency_symbol ?? 'Rs';
        $settings['default_print_type'] = $settings['default_print_type'] ?? 'regular';

        return ['sale' => $sale, 'settings' => $settings];
    }

    public static function qrDataUri(string $text): string
    {
        return \Endroid\QrCode\Builder\Builder::create()
            ->writer(new \Endroid\QrCode\Writer\SvgWriter())
            ->data($text)->size(240)->margin(12)->build()->getDataUri();
    }
}
