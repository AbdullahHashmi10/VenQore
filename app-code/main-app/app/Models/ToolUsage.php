<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * ToolUsage — anonymous aggregate telemetry, one row per tool interaction.
 *
 * PLATFORM-LEVEL MODEL. No tenant scoping.
 *
 * HARD RULE: never write email, IP address, or uploaded file content into
 * `metrics`. This table feeds the VenQore Retail Index (plan §9), which is
 * published only in aggregate with n >= 30 per cohort. See
 * App\Services\Tools\ToolUsageRecorder for the only sanctioned writer.
 */
class ToolUsage extends Model
{
    protected $fillable = ['tool_slug', 'variant', 'country', 'metrics', 'used_on'];

    protected $casts = [
        'metrics' => 'array',
        'used_on' => 'date',
    ];
}
