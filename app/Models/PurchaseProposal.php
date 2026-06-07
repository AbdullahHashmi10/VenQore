<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class PurchaseProposal extends Model
{
    use HasUuids, HasTenant;

    protected $guarded = [];

    public function items()
    {
        return $this->hasMany(PurchaseProposalItem::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Party::class, 'supplier_id');
    }
}
