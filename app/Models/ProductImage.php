<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class ProductImage extends Model
{
    use HasFactory, HasTenant;

    protected $fillable = ['product_id', 'file_path', 'file_type'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
