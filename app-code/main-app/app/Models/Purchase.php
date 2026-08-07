<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Purchase extends Model
{
    use HasUuids, HasTenant;

    protected $guarded = [];

    public function party()
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    public function items()
    {
        return $this->hasMany(PurchaseItem::class);
    }
}
