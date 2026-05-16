<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class FundTransaction extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'type',
        'from_account_id',
        'to_account_id',
        'amount',
        'balance_before',
        'balance_after',
        'reason',
        'reference_number',
        'notes',
        'performed_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
    ];

    public function fromAccount()
    {
        return $this->belongsTo(Account::class, 'from_account_id');
    }

    public function toAccount()
    {
        return $this->belongsTo(Account::class, 'to_account_id');
    }

    public function performer()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function getTypeLabel()
    {
        return match ($this->type) {
            'add' => 'Funds Added',
            'remove' => 'Funds Removed',
            'transfer' => 'Transfer',
            'adjust' => 'Adjustment',
            default => ucfirst($this->type)
        };
    }
}
