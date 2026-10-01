<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FiscalYearEvent extends Model
{
    use HasUuids, HasFactory, HasTenant;

    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'payload'    => 'array',
        'created_at' => 'datetime',
    ];

    public function fiscalYear()
    {
        return $this->belongsTo(FiscalYear::class, 'fiscal_year_id');
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
