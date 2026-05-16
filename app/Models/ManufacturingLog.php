<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class ManufacturingLog extends Model
{
    use HasTenant;

    protected $guarded = [];

    protected $casts = [
        'deductions' => 'array',
        'manufactured_at' => 'datetime',
    ];

    public function rule()
    {
        return $this->belongsTo(ManufacturingRule::class, 'rule_id');
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
