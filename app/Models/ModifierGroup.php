<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

/**
 * A set of choices offered against a product: "Size", "Toppings", "Cooked to".
 *
 * min_select / max_select are the whole configuration language. "Pick exactly
 * one size" is 1/1, "up to three toppings" is 0/3 — one control, two bounds,
 * so the register never grows a second widget for what is the same question.
 */
class ModifierGroup extends Model
{
    use HasTenant;

    protected $table = 'modifier_groups';

    protected $fillable = [
        'tenant_id',
        'name',
        'min_select',
        'max_select',
        'required',
        'sort_order',
    ];

    protected $casts = [
        'min_select' => 'integer',
        'max_select' => 'integer',
        'required'   => 'boolean',
        'sort_order' => 'integer',
    ];

    public function modifiers()
    {
        return $this->hasMany(Modifier::class, 'modifier_group_id');
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_modifier_group', 'modifier_group_id', 'product_id')
            ->withPivot('sort_order');
    }
}
