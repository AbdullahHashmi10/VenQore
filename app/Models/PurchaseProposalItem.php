<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class PurchaseProposalItem extends Model
{
    use HasUuids, HasTenant;

    protected $guarded = [];

    public function purchaseProposal()
    {
        return $this->belongsTo(PurchaseProposal::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
