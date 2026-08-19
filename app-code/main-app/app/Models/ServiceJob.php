<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class ServiceJob extends Model
{
    use HasTenant;

    protected $table = 'service_jobs';

    protected $fillable = [
        'tenant_id',
        'number',
        'party_id',
        'contract_id',
        'quotation_id',
        'invoice_id',
        'occupancy_id',
        'title',
        'description',
        'site_address',
        'site_lat',
        'site_lng',
        'priority',
        'status',
        'scheduled_for',
        'started_at',
        'completed_at',
        'estimated_total',
        'actual_total',
        'created_by',
    ];

    protected $casts = [
        'scheduled_for' => 'date',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'estimated_total' => 'float',
        'actual_total' => 'float',
    ];

    public function party()
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    public function contract()
    {
        return $this->belongsTo(ServiceContract::class, 'contract_id');
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }

    public function lines()
    {
        return $this->hasMany(JobLine::class, 'job_id');
    }

    public function assignments()
    {
        return $this->hasMany(JobAssignment::class, 'job_id');
    }

    public function events()
    {
        return $this->hasMany(JobEvent::class, 'job_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
