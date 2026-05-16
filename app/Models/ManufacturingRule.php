<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ManufacturingRule extends Model
{
    protected $guarded = [];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function ingredients()
    {
        return $this->hasMany(ManufacturingIngredient::class, 'rule_id');
    }

    public function canManufacture()
    {
        return $this->is_active;
    }
}
