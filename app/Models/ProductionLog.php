<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ProductionLog extends Model
{
    use HasUuids, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'produced_at' => 'datetime',
        'expiry_date' => 'date',
        'quantity_produced' => 'decimal:2',
        'actual_cost' => 'decimal:2',
    ];

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ingredients()
    {
        return $this->hasMany(ProductionLogIngredient::class);
    }

    /**
     * Generate unique batch code
     */
    public static function generateBatchCode()
    {
        $year = date('Y');
        $lastBatch = self::whereYear('created_at', $year)
            ->orderBy('created_at', 'desc')
            ->first();
        
        $sequence = $lastBatch ? intval(substr($lastBatch->batch_code, -4)) + 1 : 1;
        
        return sprintf("BATCH-%s-%04d", $year, $sequence);
    }
}
