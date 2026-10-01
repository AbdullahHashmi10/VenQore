<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ToolLeadEvent — append-only audit trail for a ToolLead.
 *
 * PLATFORM-LEVEL MODEL. No tenant scoping.
 * Never update or delete rows here — this table is the consent audit
 * trail referenced in SEO/SEO Tools/VENQORE_FREE_TOOLS_IMPLEMENTATION_PLAN.md §6.4.
 */
class ToolLeadEvent extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['tool_lead_id', 'event', 'ip', 'user_agent', 'meta'];

    protected $casts = [
        'meta'       => 'array',
        'created_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(ToolLead::class, 'tool_lead_id');
    }
}
