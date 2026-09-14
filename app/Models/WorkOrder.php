<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

/**
 * A kitchen / prep ticket.
 *
 * WHY HasTenant IS ON HERE NOW
 * ----------------------------
 * Every sibling in this domain — Position, Occupancy, Setting — carries it, and
 * this model did not. Nothing leaked yet only because both callers happened to
 * remember `where('tenant_id', ...)` by hand. A ticket queue is polled from a
 * screen that sits open all service; that is the last place to rely on every
 * future query remembering. The explicit filters are kept as well: the global
 * scope makes them redundant, not wrong.
 */
class WorkOrder extends Model
{
    use HasTenant;

    protected $table = 'work_orders';

    protected $fillable = [
        'tenant_id',
        'kind',
        'occupancy_id',
        'position_code',
        'station',
        'course',
        'order_number',
        'items',
        'status',
        'time_elapsed_mins',
        'fired_at',
        'bumped_at',
    ];

    protected $casts = [
        'items'             => 'array',
        'time_elapsed_mins' => 'integer',
        'course'            => 'integer',
        'fired_at'          => 'datetime',
        'bumped_at'         => 'datetime',
    ];

    /**
     * The table this was fired from. Nullable, and it goes stale on purpose:
     * the occupancy closes when the table settles, so `position_code` — copied
     * at fire time — is what the pass should display, not this relation.
     */
    public function occupancy()
    {
        return $this->belongsTo(Occupancy::class, 'occupancy_id');
    }
}
