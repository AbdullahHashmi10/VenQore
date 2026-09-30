<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class ShiftCashMovement extends Model
{
    use HasTenant;

    protected $table = 'shift_cash_movements';

    protected $fillable = [
        'tenant_id',
        'register_shift_id',
        'user_id',
        'type',
        'amount',
        'reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function shift()
    {
        return $this->belongsTo(RegisterShift::class, 'register_shift_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
