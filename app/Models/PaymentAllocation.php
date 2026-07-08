<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PaymentAllocation extends Model
{
    use HasUuids, HasTenant;

    protected $guarded = [];

    public function payment()
    {
        return $this->belongsTo(Payment::class, 'payment_journal_entry_id');
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    public function purchase()
    {
        return $this->belongsTo(Invoice::class, 'purchase_id');
    }
}
