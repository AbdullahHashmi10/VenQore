<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * QrMenu — a restaurant menu created by the QR Menu Generator free tool.
 *
 * PLATFORM-LEVEL MODEL. No tenant scoping — created anonymously by public
 * visitors, never joined against Tenant/TenantUser. See the migration
 * (database/migrations/2026_08_01_000010_create_qr_menus_table.php) for
 * the full design rationale, in particular the slug vs edit_token
 * ownership-without-accounts tradeoff.
 *
 * `slug` is the public identifier (goes in the QR code URL — safe to
 * expose). `edit_token` is the secret that proves "ownership" for editing;
 * never expose it in any response except the one returned immediately
 * after creation.
 */
class QrMenu extends Model
{
    protected $fillable = [
        'slug', 'edit_token', 'restaurant_name', 'logo_base64',
        'theme_color', 'currency', 'menu_data',
        'last_viewed_at', 'view_count',
    ];

    protected $casts = [
        'menu_data'      => 'array',
        'last_viewed_at' => 'datetime',
    ];

    /**
     * Never let edit_token leak into a generic ->toArray()/JSON response by
     * accident — controllers that legitimately need to return it (only the
     * create() response) must pull it explicitly via ->getAttribute() or
     * before this hidden cast applies to the response payload.
     */
    protected $hidden = [
        'edit_token',
    ];

    public function recordView(): void
    {
        $this->increment('view_count');
        $this->forceFill(['last_viewed_at' => now()])->saveQuietly();
    }
}
