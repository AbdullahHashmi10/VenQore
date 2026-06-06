<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class StoreCreditBalance extends Model
{
    use HasUuids, HasFactory, HasTenant;

    protected $fillable = [
        'party_id',
        'balance',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    public function party()
    {
        return $this->belongsTo(Party::class);
    }

    /**
     * Add store credit to customer
     */
    public static function addCredit($partyId, $amount, $reason = null, $invoiceId = null)
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($partyId, $amount, $reason, $invoiceId) {
            $balance = self::where('party_id', $partyId)->lockForUpdate()->first();
            if (!$balance) {
                $balance = self::create([
                    'party_id' => $partyId,
                    'balance' => 0,
                ]);
                $balance = self::where('id', $balance->id)->lockForUpdate()->first();
            }
            $balance->increment('balance', $amount);

            StoreCredit::create([
                'party_id' => $partyId,
                'amount' => $amount,
                'type' => 'credit',
                'reason' => $reason ?? 'Store credit added',
                'invoice_id' => $invoiceId,
            ]);

            return $balance;
        });
    }

    /**
     * Use store credit from customer
     */
    public static function useCredit($partyId, $amount, $reason = null, $invoiceId = null)
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($partyId, $amount, $reason, $invoiceId) {
            $balance = self::where('party_id', $partyId)->lockForUpdate()->first();

            if (!$balance || $balance->balance < $amount) {
                throw new \Exception('Insufficient store credit');
            }

            $balance->decrement('balance', $amount);

            StoreCredit::create([
                'party_id' => $partyId,
                'amount' => $amount,
                'type' => 'debit',
                'reason' => $reason ?? 'Store credit used',
                'invoice_id' => $invoiceId,
            ]);

            return $balance;
        });
    }
}
