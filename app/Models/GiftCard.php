<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;
use Illuminate\Support\Str;

class GiftCard extends Model
{
    use HasUuids, HasFactory, HasTenant;

    protected $fillable = [
        'code',
        'initial_value',
        'current_balance',
        'purchased_by',
        'assigned_to',
        'status',
        'expires_at',
    ];

    protected $casts = [
        'initial_value' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'expires_at' => 'date',
    ];

    public function purchaser()
    {
        return $this->belongsTo(Party::class, 'purchased_by');
    }

    public function assignee()
    {
        return $this->belongsTo(Party::class, 'assigned_to');
    }

    /**
     * Generate a unique gift card code
     */
    public static function generateCode()
    {
        do {
            $code = strtoupper(Str::random(4) . '-' . Str::random(4) . '-' . Str::random(4));
        } while (self::where('code', $code)->exists());

        return $code;
    }

    /**
     * Use balance from gift card
     */
    public function deduct($amount)
    {
        if ($this->current_balance < $amount) {
            throw new \Exception('Insufficient gift card balance');
        }

        $this->current_balance -= $amount;

        if ($this->current_balance <= 0) {
            $this->status = 'used';
        }

        $this->save();

        return $this;
    }

    /**
     * Check if card is usable
     */
    public function isUsable()
    {
        return $this->status === 'active'
            && $this->current_balance > 0
            && (!$this->expires_at || $this->expires_at >= now());
    }
}
