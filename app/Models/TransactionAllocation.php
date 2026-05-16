<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransactionAllocation extends Model
{
    protected $guarded = [];

    public function paymentTransaction()
    {
        return $this->belongsTo(Transaction::class, 'payment_transaction_id');
    }

    public function invoiceTransaction()
    {
        return $this->belongsTo(Transaction::class, 'invoice_transaction_id');
    }
}
