<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class RegisterShift extends Model
{
    use HasTenant;

    protected $table = 'register_shifts';

    protected $fillable = [
        'tenant_id',
        'register_id',
        'opened_by',
        'opened_at',
        'opening_float',
        'closed_by',
        'closed_at',
        'expected_cash',
        'counted_cash',
        'variance',
        'status',
        'notes',
        'denominations',
    ];

    protected $casts = [
        'opened_at'      => 'datetime',
        'closed_at'      => 'datetime',
        'opening_float'  => 'decimal:2',
        'expected_cash'  => 'decimal:2',
        'counted_cash'   => 'decimal:2',
        'variance'       => 'decimal:2',
        'denominations'  => 'array',
    ];

    public function openedByUser()
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    public function closedByUser()
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function sales()
    {
        return $this->hasMany(Sale::class, 'register_shift_id');
    }

    public function cashMovements()
    {
        return $this->hasMany(ShiftCashMovement::class, 'register_shift_id');
    }
}
