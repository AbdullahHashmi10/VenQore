<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SharedProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'barcode',
        'canonical_name',
        'brand',
        'pack_size',
        'category',
        'description',
        'confirmations',
        'is_published',
    ];

    protected $casts = [
        'confirmations' => 'integer',
        'is_published'  => 'boolean',
    ];

    public function aliases(): HasMany
    {
        return $this->hasMany(SharedProductAlias::class);
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(SharedProductContribution::class, 'shared_product_id');
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }
}
