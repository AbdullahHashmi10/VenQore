<?php

namespace App\Services\V3;

use App\Exceptions\UomConversionException;
use Illuminate\Support\Facades\DB;

class UomService
{
    private int $tenantId;

    public function __construct() {
        $this->tenantId = app('current.tenant')->id;
    }
    /**
     * OWNS: All UOM conversion logic.
     * FifoService::deductStock() receives base_qty — it is the caller's
     * responsibility to convert via UomService first when sale_uom != base_uom.
     *
     * Conversion formula:
     *   base_qty = sale_qty / conversion_factor
     *
     * Example: product base_uom = KG, conversion_factor for GRAMS = 1000
     *   sell 500 GRAMS → base_qty = 500 / 1000 = 0.5 KG deducted from batch
     */

    /**
     * Convert a sale quantity into the product's base UOM quantity.
     * If saleUom matches the product's base_unit, returns qty unchanged.
     * Throws UomConversionException if no conversion exists and UOMs differ.
     *
     * @throws UomConversionException
     */
    public function toBaseQty(
        string $productId,
        float  $saleQty,
        string $saleUom
    ): float {
        $tid = $this->tenantId;
        $product = DB::table('products')->where('tenant_id', $tid)->where('id', $productId)->first();

        // If selling in base UOM — no conversion needed
        if ($product && strtoupper($saleUom) === strtoupper($product->base_unit ?? 'PCS')) {
            return $saleQty;
        }

        $factor = $this->getConversionFactor($productId, $saleUom);

        return round($saleQty / $factor, 4);
    }

    /**
     * Get the conversion factor for a product/UOM pair.
     * Throws UomConversionException if not configured.
     *
     * @throws UomConversionException
     */
    public function getConversionFactor(string $productId, string $saleUom): float
    {
        $tid = $this->tenantId;
        $conversion = DB::table('product_uom_conversions')
            ->where('tenant_id', $tid)
            ->where('product_id', $productId)
            ->whereRaw('UPPER(sale_uom) = ?', [strtoupper($saleUom)])
            ->first();

        if (!$conversion) {
            throw new UomConversionException($productId, $saleUom);
        }

        return (float) $conversion->conversion_factor;
    }
}
