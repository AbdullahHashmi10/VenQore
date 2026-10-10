<?php

namespace App\Models\Commerce;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * One public storefront per tenant. Deliberately NOT using HasTenant: public
 * request paths resolve it by slug and must never rely on an ambient tenant.
 */
class Storefront extends Model
{
    use HasUuids;

    protected $table = 'storefronts';

    protected $guarded = [];

    protected $casts = [
        'opening_hours' => 'array',
        'supports_pickup' => 'boolean',
        'supports_delivery' => 'boolean',
        'accept_cod' => 'boolean',
        'booking_enabled' => 'boolean',
        'accept_pickup_payment' => 'boolean',
        'accept_bank_transfer' => 'boolean',
        'intake_paused' => 'boolean',
        'orders_outside_hours' => 'boolean',
        'orders_during_break' => 'boolean',
        'show_images' => 'boolean',
        'onsite_ordering_enabled' => 'boolean',
        'counter_qr_enabled' => 'boolean',
        'onsite_show_images' => 'boolean',
        'onsite_paused' => 'boolean',
        'onsite_require_seated' => 'boolean',
        'onsite_auto_hours' => 'boolean',
        'delivery_zones' => 'array',
        'delivery_charge' => 'float',
        'min_order_amount' => 'float',
        'pricing_percent' => 'float',
        'published_at' => 'datetime',
    ];

    /**
     * Is this business's module switched on? The shop and the QR menu & catalogue are
     * separate modules (online_store / onsite_catalogue), so each public surface must
     * honour its own switch. A business with no module setup at all counts as "on".
     */
    public function moduleOn(string $module): bool
    {
        $tenant = \App\Models\Tenant::find($this->tenant_id);

        return \App\Services\ModuleService::enabled($tenant, $module);
    }

    /** SQL fragment: this storefront's tenant has $module on (or has no module setup at all). */
    public static function moduleLiveSql(string $alias = 'storefronts'): string
    {
        return "(not exists (select 1 from tenant_modules tm0 where tm0.tenant_id = {$alias}.tenant_id)"
            . " or exists (select 1 from tenant_modules tm1 where tm1.tenant_id = {$alias}.tenant_id and tm1.module_key = ? and tm1.enabled = 1))";
    }

    /** Only storefronts whose business still has the Online Store module on. */
    public function scopeOnlineStoreOn($query)
    {
        return $query->whereRaw(self::moduleLiveSql($this->getTable()), ['online_store']);
    }

    public function isAcceptingOrders(): bool
    {
        return $this->customer_mode !== 'catalogue'
            && $this->moduleOn('online_store')
            && $this->status === 'published'
            && ! $this->intake_paused
            && ! $this->isClosedByHours();
    }

    public function isAcceptingOnsiteOrders(): bool
    {
        return (bool) $this->onsite_ordering_enabled && $this->moduleOn('onsite_catalogue');
    }

    /**
     * Why guests cannot send an order from the QR menu right now, or null when they can. The menu itself
     * stays viewable; only sending is held back, and the guest is told in plain words.
     */
    /** Languages a business can offer next to English on its QR menu: code => [name in that language, right-to-left]. */
    public const ALT_LANGUAGES = [
        'ar' => ['العربية', true], 'ur' => ['اردو', true], 'fa' => ['فارسی', true], 'he' => ['עברית', true],
        'hi' => ['हिन्दी', false], 'bn' => ['বাংলা', false], 'ta' => ['தமிழ்', false], 'es' => ['Español', false],
        'fr' => ['Français', false], 'de' => ['Deutsch', false], 'pt' => ['Português', false], 'it' => ['Italiano', false],
        'tr' => ['Türkçe', false], 'ru' => ['Русский', false], 'id' => ['Bahasa Indonesia', false], 'ms' => ['Bahasa Melayu', false],
        'th' => ['ไทย', false], 'vi' => ['Tiếng Việt', false], 'zh' => ['中文', false], 'ja' => ['日本語', false], 'ko' => ['한국어', false],
        'sw' => ['Kiswahili', false],
    ];

    /** The extra QR-menu language as ['code','label','rtl'], or null. Safe before the column exists. */
    public function altLang(): ?array
    {
        $code = $this->getAttributes()['onsite_alt_lang'] ?? null;
        if (! $code || ! isset(self::ALT_LANGUAGES[$code])) {
            return null;
        }

        return ['code' => $code, 'label' => self::ALT_LANGUAGES[$code][0], 'rtl' => self::ALT_LANGUAGES[$code][1]];
    }

    public function onsiteHoldReason(): ?string
    {
        if ($this->onsite_paused) {
            return 'QR ordering is paused for a moment. Please ask a member of staff to take your order.';
        }
        if ($this->onsite_auto_hours && $this->isClosedByHours()) {
            return 'We are not taking orders right now. Please check our opening hours.';
        }

        return null;
    }

    /**
     * Opening hours check respecting granular intake settings:
     * - If on a scheduled break: depends on `orders_during_break`.
     * - If outside opening hours: depends on `orders_outside_hours`.
     */
    public function isClosedByHours(?\Carbon\CarbonImmutable $now = null): bool
    {
        $hours = $this->opening_hours;
        if (empty($hours)) {
            return false;
        }
        $tz = $this->timezone ?: 'UTC';

        $onBreak = \App\Services\Commerce\OpeningHours::isOnBreak($hours, $tz, $now);
        if ($onBreak !== null) {
            return ! $this->orders_during_break;
        }

        $isOpen = \App\Services\Commerce\OpeningHours::isOpenNow($hours, $tz, $now);
        if ($isOpen === false) {
            return ! $this->orders_outside_hours;
        }

        return false;
    }

    public function isOnBreak(?\Carbon\CarbonImmutable $now = null): ?array
    {
        return \App\Services\Commerce\OpeningHours::isOnBreak($this->opening_hours, $this->timezone ?: 'UTC', $now);
    }

    public function isVisible(): bool
    {
        return $this->status === 'published' && $this->moduleOn('online_store');
    }
}
