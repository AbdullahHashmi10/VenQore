<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoyaltyBalance extends Model
{
    use HasUuids, HasFactory;

    protected $fillable = [
        'party_id',
        'balance',
        'lifetime_earned',
        'lifetime_redeemed',
    ];

    public function party()
    {
        return $this->belongsTo(Party::class);
    }

    /**
     * Award points to a customer
     */
    public static function awardPoints($partyId, $points, $description = null, $invoiceId = null)
    {
        $balance = self::firstOrCreate(['party_id' => $partyId], [
            'balance' => 0,
            'lifetime_earned' => 0,
            'lifetime_redeemed' => 0,
        ]);

        $balance->increment('balance', $points);
        $balance->increment('lifetime_earned', $points);

        // Log the transaction
        LoyaltyPoint::create([
            'party_id' => $partyId,
            'points' => $points,
            'type' => 'earned',
            'description' => $description ?? 'Points earned from purchase',
            'invoice_id' => $invoiceId,
        ]);

        return $balance;
    }

    /**
     * Redeem points from a customer
     */
    public static function redeemPoints($partyId, $points, $description = null, $invoiceId = null)
    {
        $balance = self::where('party_id', $partyId)->first();

        if (!$balance || $balance->balance < $points) {
            throw new \Exception('Insufficient loyalty points');
        }

        $balance->decrement('balance', $points);
        $balance->increment('lifetime_redeemed', $points);

        // Log the transaction
        LoyaltyPoint::create([
            'party_id' => $partyId,
            'points' => -$points,
            'type' => 'redeemed',
            'description' => $description ?? 'Points redeemed',
            'invoice_id' => $invoiceId,
        ]);

        return $balance;
    }
}
