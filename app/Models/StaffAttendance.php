<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffAttendance extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\Concerns\HasUuids, \App\Traits\HasTenant;

    protected $fillable = [
        'user_id',
        'check_in',
        'check_out',
        'last_active_at',
        'total_gap_minutes',
        'status',
    ];

    protected $casts = [
        'check_in' => 'datetime',
        'check_out' => 'datetime',
        'last_active_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function gaps()
    {
        return $this->hasMany(StaffActivityGap::class);
    }
}
