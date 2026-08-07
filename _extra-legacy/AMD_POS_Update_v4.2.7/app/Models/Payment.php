<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use App\Traits\HasTenant;

class Payment extends Model
{
    use HasFactory, HasUuids, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'date' => 'date',
    ];

    public function party()
    {
        return $this->belongsTo(Party::class);
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    // Helper to update party balance when payment is created/updated
    protected static function booted()
    {
        static::created(function ($payment) {
            $payment->updatePartyBalance($payment->amount);
        });

        static::deleted(function ($payment) {
            $payment->updatePartyBalance(-$payment->amount);
        });
    }

    public function updatePartyBalance($amount)
    {
        $partyId = $this->party_id;
        if (!$partyId && $this->sale_id) {
            $sale = Sale::find($this->sale_id);
            if ($sale) {
                $partyId = $sale->party_id ?? $sale->customer_id;
            }
        }

        if (!$partyId)
            return;

        $party = Party::find($partyId);
        if (!$party)
            return;

        // Logic:
        // If Payment In (Received): Customer balance decreases (they owe less)
        // If Payment Out (Sent): Supplier balance increases (we owe less, or they owe us)

        // Wait, let's stick to standard accounting:
        // Customer (Asset): Debit increases, Credit decreases.
        // Supplier (Liability): Credit increases, Debit decreases.

        // Current Balance field in Party model usually represents "What they owe us" (for customers)
        // or "What we owe them" (for suppliers).

        if (in_array($this->type, ['received', 'in'])) {
            // We received money.
            // If customer, their debt decreases.
            // For split sales, only the credit method payment leg should decrement outstanding current_balance
            if ($this->method === 'credit' || !request()->has('payments')) {
                $party->decrement('current_balance', $amount);
            }
        } elseif (in_array($this->type, ['sent', 'out'])) {
            // We paid money.
            // If supplier, our debt to them decreases.
            $party->decrement('current_balance', $amount);
        }
    }
}
