<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasTenant;

class Category extends Model
{
    use HasUuids, HasTenant, SoftDeletes;
    protected $guarded = [];

    /** Add-on groups every product in this category offers (add-ons library). */
    public function modifierGroups()
    {
        return $this->belongsToMany(ModifierGroup::class, 'category_modifier_group', 'category_id', 'modifier_group_id')
            ->withPivot('sort_order')
            ->orderBy('category_modifier_group.sort_order');
    }

    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
