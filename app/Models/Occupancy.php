<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class Occupancy extends Model
{
    use HasTenant;

    protected $table = 'occupancies';

    protected $fillable = [
        'tenant_id',
        'position_id',
        'label',
        'session_data',
        'party_id',
        'opened_by',
        'opened_at',
        'expires_at',
        'closed_at',
        'source_type',
        'source_id',
    ];

    protected $casts = [
        'session_data' => 'array',
        'opened_at' => 'datetime',
        'expires_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function position()
    {
        return $this->belongsTo(Position::class, 'position_id');
    }

    public function party()
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'opened_by');
    }
}
