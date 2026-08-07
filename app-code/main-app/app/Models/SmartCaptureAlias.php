<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A single thing this store has taught AI Scan.
 *
 * "When you read <source_text>, they meant <target_label>."
 *
 * Shared by every member of the store (tenant), with attribution kept so a bad
 * lesson can be traced back and removed.
 */
class SmartCaptureAlias extends Model
{
    use HasFactory, HasUuids, HasTenant;

    public const KIND_PRODUCT  = 'product';
    public const KIND_PARTY    = 'party';
    public const KIND_CATEGORY = 'expense_category';

    protected $guarded = [];

    protected $casts = [
        'hits'         => 'integer',
        'last_used_at' => 'datetime',
    ];

    public function scopeOfKind($query, string $kind)
    {
        return $query->where('kind', $kind);
    }
}
