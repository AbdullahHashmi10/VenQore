<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\HasTenant;

class InvoiceReminder extends Model
{
    use HasUuids, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'scheduled_at' => 'datetime',
    ];

    public function invoice()
    {
        return $this->belongsTo(Sale::class, 'invoice_id');
    }

    public function customer()
    {
        return $this->belongsTo(Party::class, 'customer_id');
    }
}
