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
            'items.productVariant' => $scope, 'payments' => $scope, 'user']);
        return ['sale' => $sale, 'settings' => Setting::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)->pluck('value', 'key')];
    }

    public static function qrDataUri(string $text): string
    {
        return \Endroid\QrCode\Builder\Builder::create()
            ->writer(new \Endroid\QrCode\Writer\SvgWriter())
            ->data($text)->size(240)->margin(12)->build()->getDataUri();
    }
}
