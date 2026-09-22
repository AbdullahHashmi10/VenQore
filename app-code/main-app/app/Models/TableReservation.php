<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class TableReservation extends Model
{
    use HasTenant;

    protected $table = 'table_reservations';

    protected $fillable = [
        'tenant_id',
        'customer_name',
        'phone',
        'party_size',
        'reserved_at',
        'position_id',
        'status',
        'notes',
    ];

    protected $casts = [
        'party_size'  => 'integer',
        'reserved_at' => 'datetime',
    ];

    public function position()
    {
        return $this->belongsTo(Position::class, 'position_id');
    }
}
