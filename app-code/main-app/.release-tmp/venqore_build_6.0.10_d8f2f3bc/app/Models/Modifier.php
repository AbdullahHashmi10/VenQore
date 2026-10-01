<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

/**
 * One choice inside a ModifierGroup.
 *
 * price_delta is SIGNED and is added to the line's unit price, never used as a
 * price of its own: "no cheese, -30" is as real a menu item as "extra cheese,
 * +80", and a modifier that could only add would force the second one to be
 * modelled as a discount, which is a different thing on the P&L.
 */
class Modifier extends Model
{
    use HasTenant;

    protected $table = 'modifiers';

    protected $fillable = [
        'tenant_id',
        'modifier_group_id',
        'name',
        'price_delta',
        'is_default',
        'available',
        'sort_order',
    ];

    protected $casts = [
        'price_delta' => 'decimal:4',
        'is_default'  => 'boolean',
        'available'   => 'boolean',
        'sort_order'  => 'integer',
    ];

    public function group()
    {
        return $this->belongsTo(ModifierGroup::class, 'modifier_group_id');
    }
}
