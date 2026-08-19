<?php

namespace App\Reckoner;

use App\Models\Setting;
use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;

/**
 * Store-configurable thresholds that are a matter of the owner's opinion, not
 * the Reckoner's business (§6 of the build spec). Backed by the existing
 * per-tenant `settings` key-value table — nothing new is introduced here.
 *
 * "Do not lock a number the owner should own." Every value below has a
 * sensible default and can be overridden per tenant without a deploy.
 */
final class ReckonerSettings
{
    private const GROUP = 'reckoner';

    private const DEFAULTS = [
        'reckoner.heavy_discount_pct' => 20,
        'reckoner.overstock_mode' => 'off',        // off | manual | auto
        'reckoner.overstock_multiplier' => 5,
        'reckoner.overstock_notify' => false,
        'reckoner.stock_aging_buckets' => '30,90,180',
        'reckoner.expiry_warning_days' => 30,
        'reckoner.carrying_cost_pct' => 15,
    ];

    /** Dormancy default, by business type — overridable via reckoner.dormant_days. */
    private const DORMANT_DAYS_BY_TYPE = [
        'restaurant' => 30,
        'grocery' => 21,
        'pharmacy' => 60,
        'retail' => 90,
        'salon' => 60,
        'automotive' => 180,
        'wholesale' => 45,
        'services' => 120,
        'manufacturing' => 90,
        'generic' => 90,
    ];

    public static function get(string $key, ?Tenant $tenant): mixed
    {
        if ($key === 'reckoner.dormant_days') {
            return self::dormantDays($tenant);
        }

        if (! array_key_exists($key, self::DEFAULTS)) {
            return null;
        }

        if (! $tenant) {
            return self::DEFAULTS[$key];
        }

        $cacheKey = "vq_reckoner_setting:{$tenant->id}:{$key}";

        return Cache::remember($cacheKey, 300, function () use ($key, $tenant) {
            $row = Setting::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('key', $key)
                ->first();

            if (! $row || $row->value === null || $row->value === '') {
                return self::DEFAULTS[$key];
            }

            return self::cast($key, $row->value);
        });
    }

    public static function set(string $key, mixed $value, Tenant $tenant): void
    {
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => $key],
            ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value, 'group' => self::GROUP],
        );

        Cache::forget("vq_reckoner_setting:{$tenant->id}:{$key}");

        if ($key === 'reckoner.dormant_days') {
            Cache::forget("vq_reckoner_dormant_days:{$tenant->id}");
        }
    }

    public static function dormantDays(?Tenant $tenant): int
    {
        // `business_type` is added by migration
        // 2026_08_11_100000_add_business_type_to_tenants_table.php (Phase 2)
        // and is nullable — an existing store's type is unknown until the
        // owner sets it, so null degrades to 'generic' exactly like an
        // unrecognised value would.
        $businessType = $tenant?->getAttribute('business_type') ?? 'generic';
        $default = self::DORMANT_DAYS_BY_TYPE[$businessType] ?? self::DORMANT_DAYS_BY_TYPE['generic'];

        if (! $tenant) {
            return $default;
        }

        $cacheKey = "vq_reckoner_dormant_days:{$tenant->id}";

        return (int) Cache::remember($cacheKey, 300, function () use ($tenant, $default) {
            $row = Setting::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('key', 'reckoner.dormant_days')
                ->first();

            if (! $row || $row->value === null || $row->value === '') {
                return $default;
            }

            return (int) $row->value;
        });
    }

    public static function defaultDormantDaysFor(string $businessType): int
    {
        return self::DORMANT_DAYS_BY_TYPE[$businessType] ?? self::DORMANT_DAYS_BY_TYPE['generic'];
    }

    private static function cast(string $key, string $raw): mixed
    {
        return match ($key) {
            'reckoner.overstock_notify' => in_array(strtolower($raw), ['1', 'true', 'on', 'yes'], true),
            'reckoner.overstock_mode' => $raw,
            'reckoner.stock_aging_buckets' => $raw,
            'reckoner.heavy_discount_pct', 'reckoner.overstock_multiplier',
            'reckoner.expiry_warning_days', 'reckoner.carrying_cost_pct' => is_numeric($raw) ? $raw + 0 : $raw,
            default => $raw,
        };
    }
}
