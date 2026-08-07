<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Platform extends Model
{
    protected $fillable = ['name', 'slug', 'type', 'is_active', 'config'];

    protected $casts = [
        'is_active' => 'boolean',
        'config'    => 'array',
    ];

    public function plans(): HasMany
    {
        return $this->hasMany(Plan::class);
    }
}
