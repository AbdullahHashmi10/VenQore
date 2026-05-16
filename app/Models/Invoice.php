<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Invoice extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected $casts = [
        'date' => 'date',
    ];

    public function party()
    {
        return $this->belongsTo(Party::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'purchase_id');
    }

    public function payments()
    {
        return $this->hasManyThrough(Payment::class, PaymentAllocation::class, 'invoice_id', 'id', 'id', 'payment_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
