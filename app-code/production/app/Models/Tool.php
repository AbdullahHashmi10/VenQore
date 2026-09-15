<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasTenant;

/**
 * A physical tool or piece of equipment the business dispatches with staff —
 * a drill, a gas cylinder, a ladder. Not stock: a tool isn't sold and isn't
 * deducted by FIFO, it goes out on a job and comes back (or doesn't, hence
 * `status = 'lost'`).
 *
 * Two separate relationships matter and must not be collapsed into one:
 *   - `requiredByServices()` — the default packing list for a *type* of
 *     service ("an AC repair normally needs the gauge set and the pump").
 *   - `jobAssignments()` — what actually went out on *this specific* job,
 *     via `job_tools`, which is where "where are the tools right now" and
 *     "did this one come back" are answered.
 */
class Tool extends Model
{
    use HasTenant, SoftDeletes;

    protected $table = 'tools';

    protected $fillable = [
        'tenant_id',
        'name',
        'category',
        'description',
        'status',
        'holder_employee_id',
        'current_location',
        'maintenance_interval_days',
        'last_maintenance_at',
        'next_maintenance_due_at',
        'purchase_cost',
        'notes',
    ];

    protected $casts = [
        'last_maintenance_at'       => 'date',
        'next_maintenance_due_at'   => 'date',
        'purchase_cost'             => 'decimal:4',
        'maintenance_interval_days' => 'integer',
    ];

    public function holder()
    {
        return $this->belongsTo(Employee::class, 'holder_employee_id');
    }

    /**
     * Services (products.type = 'service') that list this tool as required.
     */
    public function requiredByServices()
    {
        return $this->belongsToMany(Product::class, 'service_tools', 'tool_id', 'product_id')
            ->withPivot('quantity');
    }

    /**
     * Every job this tool has been checked out on, oldest first.
     */
    public function jobAssignments()
    {
        return $this->hasMany(JobTool::class, 'tool_id')->orderBy('taken_at');
    }

    /**
     * Recompute `next_maintenance_due_at` from `last_maintenance_at` +
     * `maintenance_interval_days`. Called after logging a maintenance event;
     * not a mutator, so a bulk import can set both columns explicitly
     * without this silently overwriting one of them.
     */
    public function recalculateNextMaintenanceDue(): void
    {
        if ($this->last_maintenance_at && $this->maintenance_interval_days) {
            $this->next_maintenance_due_at = $this->last_maintenance_at
                ->copy()
                ->addDays($this->maintenance_interval_days);
        }
    }
}
