<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ProductBarcode extends Model
{
    use HasUuids, HasFactory;

    protected $fillable = [
        'product_id',
        'barcode',
        'barcode_type',
        'is_primary',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Barcode types
    const TYPE_EAN13 = 'EAN13';
    const TYPE_EAN8 = 'EAN8';
    const TYPE_UPC = 'UPC';
    const TYPE_CODE128 = 'CODE128';
    const TYPE_CODE39 = 'CODE39';
    const TYPE_QR = 'QR';

    public static function types()
    {
        return [
            self::TYPE_EAN13 => 'EAN-13 (13 digits)',
            self::TYPE_EAN8 => 'EAN-8 (8 digits)',
            self::TYPE_UPC => 'UPC (12 digits)',
            self::TYPE_CODE128 => 'Code 128',
            self::TYPE_CODE39 => 'Code 39',
            self::TYPE_QR => 'QR Code',
        ];
    }
}
