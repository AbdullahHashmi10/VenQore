<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Payment extends Model
{
    use HasFactory, HasUuids;

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
        if (!$this->party_id)
            return;

        $party = Party::find($this->party_id);
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
            $party->decrement('current_balance', $amount);
        } elseif (in_array($this->type, ['sent', 'out'])) {
            // We paid money.
            // If supplier, our debt to them decreases.
            $party->decrement('current_balance', $amount);
        }
    }
}
