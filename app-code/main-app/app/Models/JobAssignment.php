<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobAssignment extends Model
{
    protected $table = 'job_assignments';

    protected $fillable = [
        'job_id',
        'employee_id',
        'role',
        'assigned_at',
        'checked_in_at',
        'checked_out_at',
        'hours',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'checked_in_at' => 'datetime',
        'checked_out_at' => 'datetime',
        'hours' => 'float',
    ];

    public function job()
    {
        return $this->belongsTo(ServiceJob::class, 'job_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
