<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CompositionItem extends Model
{
    use HasUuids, HasTenant;

    protected $table = 'composition_items';

    protected $guarded = [];

    public function recipe()
    {
        return $this->belongsTo(Composition::class, 'composition_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Alias for clearer naming
    public function ingredientProduct()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
