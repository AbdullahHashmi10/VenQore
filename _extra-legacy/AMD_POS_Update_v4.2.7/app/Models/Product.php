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
    protected $guarded = [];

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
        return $this->hasMany(Recipe::class, 'product_id');
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
