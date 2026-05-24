<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class StoreCredit extends Model
{
    use HasUuids, HasFactory, HasTenant;

    protected $fillable = [
        'party_id',
        'amount',
        'type',
        'reason',
        'invoice_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function party()
    {
        return $this->belongsTo(Party::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
