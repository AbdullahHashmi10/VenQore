<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class WooConnection extends Model
{
    use SoftDeletes;

    protected $table = 'woo_connections';

    protected $fillable = [
        'tenant_id',
        'name',
        'site_url',
        'uuid',
        'consumer_key',
        'consumer_secret',
        'webhook_secret',
        'api_token',
        'setup_token',
        'priority_source',
        'auto_stage_new_products',
        'sync_fields',
        'status',
        'last_synced_at',
        'billing_subscription_id',
    ];

    protected $casts = [
        'auto_stage_new_products' => 'boolean',
        'sync_fields'             => 'array',
        'last_synced_at'          => 'datetime',
    ];

    protected $hidden = [
        'consumer_key',
        'consumer_secret',
        'webhook_secret',
        'api_token',
    ];

    // ─── Encrypted attribute accessors ────────────────────────────────────────

    public function setConsumerKeyAttribute($value): void
    {
        $this->attributes['consumer_key'] = $value ? encrypt($value) : null;
    }

    public function getConsumerKeyAttribute($value): ?string
    {
        try {
            return $value ? decrypt($value) : null;
        } catch (\Exception) {
            return null;
        }
    }

    public function setConsumerSecretAttribute($value): void
    {
        $this->attributes['consumer_secret'] = $value ? encrypt($value) : null;
    }

    public function getConsumerSecretAttribute($value): ?string
    {
        try {
            return $value ? decrypt($value) : null;
        } catch (\Exception) {
            return null;
        }
    }

    public function setWebhookSecretAttribute($value): void
    {
        $this->attributes['webhook_secret'] = $value ? encrypt($value) : null;
    }

    public function getWebhookSecretAttribute($value): ?string
    {
        try {
            return $value ? decrypt($value) : null;
        } catch (\Exception) {
            return null;
        }
    }

    public function setApiTokenAttribute($value): void
    {
        $this->attributes['api_token'] = $value ? encrypt($value) : null;
    }

    public function getApiTokenAttribute($value): ?string
    {
        try {
            return $value ? decrypt($value) : null;
        } catch (\Exception) {
            return null;
        }
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function productLinks(): HasMany
    {
        return $this->hasMany(WooProductLink::class, 'connection_id');
    }

    public function syncQueue(): HasMany
    {
        return $this->hasMany(WooSyncQueue::class, 'connection_id');
    }

    public function syncLogs(): HasMany
    {
        return $this->hasMany(WooSyncLog::class, 'connection_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Generate a fresh UUID for the webhook URL.
     */
    public static function generateUuid(): string
    {
        return (string) Str::uuid();
    }

    /**
     * Generate a secure API token for the WordPress plugin.
     */
    public static function generateApiToken(): string
    {
        return 'vq_' . Str::random(40);
    }

    /**
     * The webhook receiver URL for this connection.
     */
    public function webhookUrl(): string
    {
        return url("/api/woo/webhook/{$this->uuid}");
    }

    /**
     * Is this connection healthy and ready to sync?
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Get the default sync fields configuration.
     */
    public static function defaultSyncFields(): array
    {
        return [
            'name'              => true,
            'sku'               => true,
            'price'             => true,
            'sale_price'        => true,
            'stock_quantity'    => true,
            'stock_status'      => true,
            'description'       => true,
            'short_description' => true,
            'status'            => true,
            'images'            => false,  // opt-in due to heavy upload
            'categories'        => true,
            'tags'              => true,
            'weight'            => false,
            'dimensions'        => false,
            'barcode'           => false,
            'variants'          => false,  // opt-in — complex
        ];
    }
}
