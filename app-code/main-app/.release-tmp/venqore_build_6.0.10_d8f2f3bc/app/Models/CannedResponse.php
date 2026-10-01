<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\HasTenant;

class CannedResponse extends Model
{
    use HasTenant;

    protected $fillable = [
        'tenant_id',
        'shortcode',
        'title',
        'body',
        'created_by',
    ];

    /**
     * Get the tenant this canned response belongs to.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the user who created this response.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
