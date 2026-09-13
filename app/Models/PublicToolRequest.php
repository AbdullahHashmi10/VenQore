<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PublicToolRequest extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'email',
        'ip_address',
        'feature',
        'result_json',
        'cost_usd',
        'created_at',
    ];

    protected $casts = [
        'result_json' => 'array',
        'cost_usd'    => 'float',
        'created_at'  => 'datetime',
    ];
}
