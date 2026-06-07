<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Str;

class DebitNote extends Model
{
    use SoftDeletes, HasUuids, HasTenant;

    protected $fillable = [
        'reference_number',
        'supplier_id',
        'purchase_id',
        'date',
        'amount',
        'reason',
        'status',
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
                $model->reference_number = 'DN-' . strtoupper(Str::random(8));
            }
        });
    }

    public function supplier()
    {
        return $this->belongsTo(Party::class, 'supplier_id');
    }

    public function items()
    {
        return $this->hasMany(DebitNoteItem::class);
    }
}
