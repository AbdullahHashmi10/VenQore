<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StaffDailySummary extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'date',
        'work_intervals',
        'total_hours',
        'total_gap_hours',
    ];

    protected $casts = [
        'date' => 'date',
        'work_intervals' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
