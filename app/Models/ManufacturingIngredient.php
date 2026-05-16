<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ManufacturingIngredient extends Model
{
    protected $guarded = [];

    public function rule()
    {
        return $this->belongsTo(ManufacturingRule::class, 'rule_id');
    }

    public function ingredientProduct()
    {
        return $this->belongsTo(Product::class, 'ingredient_product_id');
    }

    public function getRequiredQuantity($producedQuantity)
    {
        return $this->quantity_per_unit * $producedQuantity;
    }

    public function hasEnoughStock($requiredQty)
    {
        $stock = Stock::where('product_id', $this->ingredient_product_id)
            ->where('warehouse_id', 1)
            ->sum('quantity');

        return $stock >= $requiredQty;
    }
}
