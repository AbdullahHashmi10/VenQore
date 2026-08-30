<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\ProductBarcode;
use App\Models\Stock;
use App\Models\Category;
use App\Models\Brand;
use App\Traits\HasTenant;

use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Product extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory, SoftDeletes, HasUuids, HasTenant, \App\Traits\HasActivityLog;

    protected $fillable = [
        'tenant_id', 'name', 'sku', 'type', 'category_id', 'brand_id',
        'price', 'cost_price', 'wholesale_price', 'wholesale_min_quantity',
        'tax_rate', 'price_includes_tax', 'hsn_code', 'unit',
        'base_unit', 'secondary_unit', 'conversion_rate', 'min_stock_alert',
        'alert_quantity', 'stock_quantity', 'quantity', 'is_weighted',
        'is_manufactured', 'is_expiry_tracked', 'has_variants', 'track_serial',
        'description', 'short_description', 'image_path', 'woocommerce_id', 'created_via', 'supplier_sku',
    ];

    protected static function booted(): void
    {
        static::saved(function (Product $product) {
            try {
                app(\App\Services\SmartCapture\ProductSearchIndexService::class)->indexProduct($product);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Failed to index product {$product->id}: " . $e->getMessage());
            }
        });

        static::deleted(function (Product $product) {
            try {
                app(\App\Services\SmartCapture\ProductSearchIndexService::class)->removeProduct($product->tenant_id, $product->id);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Failed to remove product {$product->id} from index: " . $e->getMessage());
            }
        });
    }

    public function barcodes()
    {
        return $this->hasMany(ProductBarcode::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function recipes()
    {
        return $this->hasMany(Composition::class, 'product_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }



    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function batches()
    {
        return $this->hasMany(Batch::class);
    }

    /**
     * Choice sets offered against this product at the register: size, toppings,
     * doneness. Ordered by the PIVOT's sort_order, not the group's — size comes
     * first on a drink and doneness first on a steak, and it is the same group
     * row in both cases.
     */
    public function modifierGroups()
    {
        return $this->belongsToMany(ModifierGroup::class, 'product_modifier_group', 'product_id', 'modifier_group_id')
            ->withPivot('sort_order')
            ->orderBy('product_modifier_group.sort_order');
    }

    public function invoiceItems()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function productionRuns()
    {
        return $this->hasMany(ProductionRun::class);
    }

    /**
     * WooCommerce product links — all connections this product is synced to.
     */
    public function wooLinks()
    {
        return $this->hasMany(\App\Models\WooProductLink::class, 'venqore_product_id');
    }
}
