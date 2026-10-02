<?php

namespace App\Services\InvoiceAssistant;

use App\Helpers\SettingsHelper;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

/**
 * Adapter over the store's EXISTING price / tax / unit / stock policy — not a
 * second pricing engine.
 *
 * What the current invoice editor does, and therefore what this does:
 *  - a line opens at the product's selling price (a variant's own price when it
 *    has one); there is no customer price list in this codebase;
 *  - a product's own tax rate wins, otherwise the invoice-level default rate
 *    applies (never both);
 *  - the line quantity is in the product's own unit; the editor has no unit
 *    conversion, so any other unit is a question, never a silent guess;
 *  - stock is shown as information; the editor and the server enforce the
 *    store's stop-negative-stock rule at Save.
 * A price or discount the operator asked for is a disclosed OVERRIDE; the
 * normal role limits and manager approval still apply when they press Save.
 */
class DraftPricingResolver
{
    /** Words that mean "one of the product's own unit" and need no conversion. */
    private const GENERIC_UNITS = ['unit', 'units', 'piece', 'pieces', 'piec', 'pc', 'pcs', 'item', 'items', 'nos', 'no', 'each', 'ea', 'qty'];

    public function __construct(private int|string $tenantId) {}

    public function unitPrice(Product $p, ?ProductVariant $v): string
    {
        $variantPrice = $v && is_numeric($v->price) && (float) $v->price > 0 ? (float) $v->price : null;
        $price = $variantPrice ?? (float) ($p->price ?: ($p->selling_price ?? 0));

        return $this->num($price, 4);
    }

    /** @return array{rate:string, source:string} */
    public function taxRate(Product $p): array
    {
        if ($p->tax_rate !== null && $p->tax_rate !== '') {
            return ['rate' => $this->num((float) $p->tax_rate, 4), 'source' => 'product'];
        }

        return ['rate' => $this->num(SettingsHelper::getDefaultTaxRate(), 4), 'source' => 'store_default'];
    }

    /**
     * @return array{status:string, quantity:string, candidates:array}
     *   status: ok | mismatch ; quantity is the (possibly converted) quantity
     */
    public function unitCheck(Product $p, ?string $unit, string $quantity, ?string $choice = null): array
    {
        $asked = $this->normUnit($unit);
        if ($asked === '' || in_array($asked, self::GENERIC_UNITS, true)) {
            return ['status' => 'ok', 'quantity' => $quantity, 'candidates' => []];
        }

        $own = array_filter([$this->normUnit($p->unit), $this->normUnit($p->base_unit)]);
        if (in_array($asked, $own, true)) {
            return ['status' => 'ok', 'quantity' => $quantity, 'candidates' => []];
        }

        $rate = (float) ($p->conversion_rate ?? 0);
        $canConvert = $this->normUnit($p->secondary_unit) === $asked && $rate > 0;
        $base = $p->base_unit ?: ($p->unit ?: 'units');

        if ($choice === 'as_is') {
            return ['status' => 'ok', 'quantity' => $quantity, 'candidates' => []];
        }
        if ($choice === 'convert' && $canConvert) {
            return ['status' => 'ok', 'quantity' => $this->num((float) $quantity * $rate, 4), 'candidates' => []];
        }

        $cands = [];
        if ($canConvert) {
            $cands[] = [
                'id'              => 'convert',
                'label'           => "{$quantity} {$unit} = " . $this->num((float) $quantity * $rate, 4) . " {$base}",
                'secondary_label' => "Uses this product's own conversion ({$rate} per {$p->secondary_unit})",
            ];
        }
        $cands[] = [
            'id'              => 'as_is',
            'label'           => "Sell {$quantity} {$base}",
            'secondary_label' => "Ignore the word “{$unit}”",
        ];

        return ['status' => 'mismatch', 'quantity' => $quantity, 'candidates' => $cands];
    }

    /**
     * @return array{availability:string, available:?float}
     *   availability: sufficient | insufficient | not_tracked | unknown
     */
    public function availability(Product $p, ?ProductVariant $v, string $quantity): array
    {
        if (($p->type ?? null) === 'service') {
            return ['availability' => 'not_tracked', 'available' => null];
        }
        if (!SettingsHelper::isStockMaintenanceEnabled()) {
            return ['availability' => 'not_tracked', 'available' => null];
        }

        try {
            if ($v) {
                $total = (float) $v->stock;
            } else {
                $total = (float) DB::table('stocks')->where('tenant_id', $this->tenantId)->where('product_id', $p->id)->sum('quantity')
                    + (float) DB::table('product_variants')->where('tenant_id', $this->tenantId)->where('product_id', $p->id)->sum('stock');
            }
            $reserved = $v ? 0.0 : $this->reserved($p);
            $available = $total - $reserved;

            return [
                'availability' => $available + 1e-9 >= (float) $quantity ? 'sufficient' : 'insufficient',
                'available'    => $available,
            ];
        } catch (\Throwable) {
            return ['availability' => 'unknown', 'available' => null];
        }
    }

    /** Verified active default warehouse, or null when the store has none. */
    public function warehouse(): ?array
    {
        $w = Warehouse::query()->where('tenant_id', $this->tenantId)
            ->where(fn ($q) => $q->whereNull('is_active')->orWhere('is_active', true))
            ->orderByDesc('is_default')->orderBy('name')->first();

        return $w ? ['id' => (string) $w->id, 'name' => (string) $w->name] : null;
    }

    /**
     * The product object the invoice editor renders from — the same shape as
     * store.inventory.search. `cost` is included only for the editor handoff,
     * where the normal editor already shows it to a sales user; assistant API
     * responses never carry it.
     */
    public function editorProduct(Product $p, ?ProductVariant $v, bool $withCost): array
    {
        $isService = ($p->type ?? null) === 'service';
        $stock = $this->availability($p, null, '0');
        $total = $isService ? 999999.0 : (float) DB::table('stocks')->where('tenant_id', $this->tenantId)->where('product_id', $p->id)->sum('quantity')
            + (float) DB::table('product_variants')->where('tenant_id', $this->tenantId)->where('product_id', $p->id)->sum('stock');
        $reserved = $isService ? 0.0 : $this->reserved($p);

        $variants = ProductVariant::query()->where('tenant_id', $this->tenantId)->where('product_id', $p->id)->get()
            ->map(fn (ProductVariant $pv) => [
                'id'              => $pv->id,
                'sku'             => $pv->sku,
                'price'           => $pv->price,
                'wholesale_price' => $pv->wholesale_price ?? null,
                'stock_quantity'  => (float) $pv->stock,
                'reserved_quantity' => 0,
                'available_stock' => (float) $pv->stock,
            ])->values()->all();

        $out = [
            'id'                     => $p->id,
            'name'                   => $p->name,
            'sku'                    => $p->sku,
            'type'                   => $p->type ?? 'standard',
            'is_service'             => $isService,
            'unit'                   => $p->unit,
            'base_unit'              => $p->base_unit,
            'price'                  => $v ? (float) $this->unitPrice($p, $v) : (float) ($p->price ?: ($p->selling_price ?? 0)),
            'wholesale_price'        => $p->wholesale_price,
            'wholesale_min_quantity' => $p->wholesale_min_quantity,
            'stock_quantity'         => $total,
            'reserved_quantity'      => $reserved,
            'available_stock'        => $isService ? 999999 : $total - $reserved,
            'tax_rate'               => $p->tax_rate,
            'variants'               => $variants,
        ];
        if ($withCost) {
            $out['cost'] = $p->cost_price;
        }

        return $out;
    }

    private function reserved(Product $p): float
    {
        try {
            return (float) DB::table('sales_order_items as soi')
                ->join('sales_orders as so', function ($join) {
                    $join->on('soi.sales_order_id', '=', 'so.id')->where('so.tenant_id', $this->tenantId);
                })
                ->where('soi.tenant_id', $this->tenantId)
                ->where('soi.product_id', $p->id)
                ->whereNull('so.deleted_at')->whereNull('soi.deleted_at')
                ->whereNotIn('so.status', ['completed', 'cancelled', 'delivered'])
                ->sum('soi.quantity_reserved');
        } catch (\Throwable) {
            return 0.0;
        }
    }

    private function normUnit(?string $u): string
    {
        $u = mb_strtolower(trim((string) $u));
        $u = preg_replace('/[^\p{L}\p{N}]+/u', '', $u) ?? '';
        // "boxes" -> "box", "pieces" handled by the generic list; plain trailing s/es.
        if (mb_strlen($u) > 3 && str_ends_with($u, 'es') && !str_ends_with($u, 'ies')) {
            $u = mb_substr($u, 0, -2);
        } elseif (mb_strlen($u) > 2 && str_ends_with($u, 's') && !str_ends_with($u, 'ss')) {
            $u = mb_substr($u, 0, -1);
        }

        return $u;
    }

    public function num(float|int|string $n, int $scale = 4): string
    {
        $s = rtrim(rtrim(number_format((float) $n, $scale, '.', ''), '0'), '.');

        return $s === '' || $s === '-0' ? '0' : $s;
    }
}
