<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class RecipeIngredient extends Model
{
    use HasUuids, HasTenant;

    protected $guarded = [];

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
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
