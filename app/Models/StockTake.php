<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Str;

class StockTake extends Model
{
    use SoftDeletes, HasUuids, HasTenant;

    protected $fillable = [
        'reference_number',
        'warehouse_id',
        'date',
        'status',
        'notes',
        'created_by'
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (!$model->reference_number) {
                $model->reference_number = 'AUD-' . strtoupper(Str::random(8));
            }
        });
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(StockTakeItem::class);
    }
}
