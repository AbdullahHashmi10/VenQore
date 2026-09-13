<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Composition extends Model
{
    use HasFactory, HasUuids, HasTenant;
    protected $guarded = [];

    protected $table = 'compositions';

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function ingredients()
    {
        return $this->hasMany(CompositionItem::class, 'composition_id');
    }

    // Version Control
    public function parentRecipe()
    {
        return $this->belongsTo(Composition::class, 'parent_recipe_id');
    }

    public function versions()
    {
        return $this->hasMany(Composition::class, 'parent_recipe_id');
    }

    // Media / SOPs
    public function media()
    {
        return $this->hasMany(CompositionMedia::class, 'composition_id')->orderBy('sort_order');
    }

    // Production Logs
    public function productionLogs()
    {
        return $this->hasMany(ProductionLog::class);
    }

    // Brand
    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }
}
