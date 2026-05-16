<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Model;

class PurchaseProposalItem extends Model
{
    use HasUuids;

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
