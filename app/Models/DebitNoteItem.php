<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class DebitNoteItem extends Model
{
    use HasUuids, HasTenant;

    protected $fillable = [
        'debit_note_id',
        'product_id',
        'quantity',
        'unit_price',
        'subtotal'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
