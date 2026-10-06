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
        'shift_mode',
        'opened_by',
        'cash_custodian_id',
        'opened_at',
        'opening_float',
        'retained_float',
        'closed_by',
        'closed_at',
        'expected_cash',
        'counted_cash',
        'variance',
        'expected_handover',
        'actual_handover',
        'handover_notes',
        'handover_acknowledged_by',
        'handover_acknowledged_at',
        'manager_close_reason',
        'status',
        'notes',
        'denominations',
    ];

    protected $casts = [
        'opened_at'                => 'datetime',
        'closed_at'                => 'datetime',
        'handover_acknowledged_at' => 'datetime',
        'opening_float'            => 'decimal:2',
        'retained_float'           => 'decimal:2',
        'expected_cash'            => 'decimal:2',
        'counted_cash'             => 'decimal:2',
        'variance'                 => 'decimal:2',
        'expected_handover'        => 'decimal:2',
        'actual_handover'          => 'decimal:2',
        'denominations'            => 'array',
    ];

    public function openedByUser()
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    public function closedByUser()
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function cashCustodian()
    {
        return $this->belongsTo(User::class, 'cash_custodian_id');
    }

    public function handoverAcknowledgedByUser()
    {
        return $this->belongsTo(User::class, 'handover_acknowledged_by');
    }

    public function sales()
    {
        return $this->hasMany(Sale::class, 'register_shift_id');
    }

    public function cashMovements()
    {
        return $this->hasMany(ShiftCashMovement::class, 'register_shift_id');
    }

    public function isOrdersOnly(): bool
    {
        return $this->shift_mode === 'orders_only';
    }

    public function isCashDrawer(): bool
    {
        return $this->shift_mode === 'cash_drawer';
    }
}
