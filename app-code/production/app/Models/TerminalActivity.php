<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TerminalActivity extends Model
{
    use HasFactory, HasUuids, HasTenant;

    protected $fillable = [
        'terminal_id',
        'device_id',
        'away_at',
        'back_at',
        'duration_seconds',
        'screenshot_path',
        'tenant_id',
    ];

    protected $casts = [
        'away_at' => 'datetime',
        'back_at' => 'datetime',
        'duration_seconds' => 'integer',
    ];

    /**
     * Relationship with Terminal
     */
    public function terminal()
    {
        return $this->belongsTo(Terminal::class);
    }
}
