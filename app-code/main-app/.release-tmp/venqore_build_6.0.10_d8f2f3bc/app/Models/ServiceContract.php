<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class ServiceContract extends Model
{
    use HasTenant;

    protected $table = 'service_contracts';

    protected $fillable = [
        'tenant_id',
        'party_id',
        'number',
        'recurring_invoice_id',
        'starts_on',
        'ends_on',
        'visits_included',
        'visits_used',
        'labour_covered',
        'parts_covered',
    ];

    protected $casts = [
        'starts_on' => 'date',
        'ends_on' => 'date',
        'visits_included' => 'integer',
        'visits_used' => 'integer',
        'labour_covered' => 'boolean',
        'parts_covered' => 'boolean',
    ];

    public function party()
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    public function jobs()
    {
        return $this->hasMany(ServiceJob::class, 'contract_id');
    }
}
