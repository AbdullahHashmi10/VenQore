<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ProductUnit extends Model
{
    use HasUuids;

    protected $guarded = [];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
