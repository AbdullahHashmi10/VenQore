<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\HasTenant;

/**
 * Staff / employee record.
 * Strictly tenant-scoped via HasTenant trait and tenant_id column.
 */
class Employee extends Model
{
    use HasUuids, HasTenant;

    protected $table = 'employees';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'name',
        'monthly_salary',
        'hire_date',
        'termination_date',
        'status',
        'default_warehouse_id',
        'hourly_cost',
        'hourly_rate',
        'commission_rate',
        'party_id',
    ];

    protected $casts = [
        'hire_date'        => 'date',
        'termination_date' => 'date',
        'monthly_salary'   => 'decimal:2',
        'commission_rate'  => 'decimal:2',
    ];

    public function party()
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    public function jobAssignments()
    {
        return $this->hasMany(JobAssignment::class, 'employee_id');
    }

    /**
     * Tools currently checked out to this employee — the "who has what"
     * view. See Tool::holder().
     */
    public function toolsHeld()
    {
        return $this->hasMany(Tool::class, 'holder_employee_id');
    }
}
