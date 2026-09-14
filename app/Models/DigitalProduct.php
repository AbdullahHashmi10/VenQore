<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DigitalProduct extends Model
{
    protected $fillable = [
        'name', 'description', 'version', 'is_done', 'platforms', 'status'
    ];

    protected $casts = [
        'platforms' => 'array',
        'is_done'   => 'boolean',
    ];
}
