<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ProductAttribute extends Model
{
    use HasFactory, HasUuids, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'options' => 'array',
        'is_active' => 'boolean',
    ];
}
