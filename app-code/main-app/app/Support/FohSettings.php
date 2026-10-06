<?php

namespace App\Support;

use App\Models\Setting;

/**
 * The ONE reader for front-of-house (FOH) settings.  FOH plan 2.6.
 *
 * New keys fall back to the legacy keys the old restaurant screens wrote, so no
 * data migration is needed and nothing silently turns off the day this ships.
 * Only FOH settings write the new keys. The defaults that used to disagree
 * (service_mode 'counter' in JS vs 'both' in the dashboard; lanes 0 vs 1) live
 * here and nowhere else.
 */
class FohSettings
{
    public const KEYS = [
        'foh_tables', 'foh_takeaway', 'foh_delivery', 'foh_stock',
        'foh_takeaway_flow', 'foh_default_tab', 'foh_takeaway_collect', 'foh_takeaway_autoclose',
    ];

    /** @return array<string,string> raw rows for the tenant */
    private static function rows(int $tenantId): array
    {
        return Setting::where('tenant_id', $tenantId)
            ->whereIn('key', array_merge(self::KEYS, ['service_mode', 'pos_service_mode', 'lane_takeaway', 'lane_delivery', 'pay_first', 'prepares_orders']))
            ->pluck('value', 'key')
            ->map(fn ($v) => (string) $v)
            ->all();
    }

    private static function bool(?string $v): bool
    {
        return in_array(strtolower((string) $v), ['1', 'true', 'yes', 'on'], true);
    }

    /** The resolved settings, every key present. */
    public static function all(int $tenantId): array
    {
        $r = self::rows($tenantId);

        $mode = $r['service_mode'] ?? $r['pos_service_mode'] ?? 'both';
        $tables = array_key_exists('foh_tables', $r)
            ? self::bool($r['foh_tables'])
            : in_array($mode, ['tables', 'both'], true);
        $takeaway = array_key_exists('foh_takeaway', $r)
            ? self::bool($r['foh_takeaway'])
            : self::bool($r['lane_takeaway'] ?? '1');
        $delivery = array_key_exists('foh_delivery', $r)
            ? self::bool($r['foh_delivery'])
            : self::bool($r['lane_delivery'] ?? '1');

        $stock = $r['foh_stock'] ?? 'per_item';
        if (!in_array($stock, ['per_item', 'never'], true)) $stock = 'per_item';

        $flow = $r['foh_takeaway_flow'] ?? (self::bool($r['pay_first'] ?? '0') ? 'pay_first' : 'fire_first');
        if (!in_array($flow, ['pay_first', 'fire_first'], true)) $flow = 'fire_first';

        $tab = $r['foh_default_tab'] ?? 'auto';
        if (!in_array($tab, ['auto', 'overview', 'tables', 'takeaway', 'delivery'], true)) $tab = 'auto';

        // A store that has saved ANY new FOH key has opted in to FOH, and gets the
        // paid-but-still-cooking collection behaviour. Others keep today's
        // close-on-pay until they do.
        $optedIn = count(array_intersect_key($r, array_flip(['foh_tables', 'foh_takeaway', 'foh_delivery']))) > 0;
        $collect = array_key_exists('foh_takeaway_collect', $r) ? self::bool($r['foh_takeaway_collect']) : $optedIn;
        $autoclose = array_key_exists('foh_takeaway_autoclose', $r) ? self::bool($r['foh_takeaway_autoclose']) : true;

        return [
            'tables'            => $tables,
            'takeaway'          => $takeaway,
            'delivery'          => $delivery,
            'stock'             => $stock,
            'takeaway_flow'     => $flow,
            'default_tab'       => $tab,
            'takeaway_collect'  => $collect,
            'takeaway_autoclose'=> $autoclose,
            'prepares_orders'   => self::bool($r['prepares_orders'] ?? '1'),
        ];
    }

    public static function stockMode(int $tenantId): string
    {
        return self::all($tenantId)['stock'];
    }

    public static function collectsTakeaway(int $tenantId): bool
    {
        return self::all($tenantId)['takeaway_collect'];
    }

    /** Tabs the store has switched on, in display order. */
    public static function enabledTabs(int $tenantId): array
    {
        $a = self::all($tenantId);
        $tabs = ['overview'];
        if ($a['tables'])   $tabs[] = 'tables';
        if ($a['takeaway']) $tabs[] = 'takeaway';
        if ($a['delivery']) $tabs[] = 'delivery';
        return $tabs;
    }

    /** Old restaurant URLs should hand over to FOH for this store. */
    public static function redirectsOn(int $tenantId): bool
    {
        return (bool) config('venqore.foh_redirects', true) && self::available($tenantId);
    }

    /** At least one of the three channels is on. */
    public static function available(int $tenantId): bool
    {
        $a = self::all($tenantId);
        return $a['tables'] || $a['takeaway'] || $a['delivery'];
    }

    /** Write the new keys. Only FOH settings call this. */
    public static function save(int $tenantId, array $data): void
    {
        $map = [
            'tables' => 'foh_tables', 'takeaway' => 'foh_takeaway', 'delivery' => 'foh_delivery',
            'takeaway_collect' => 'foh_takeaway_collect', 'takeaway_autoclose' => 'foh_takeaway_autoclose',
        ];
        foreach ($map as $field => $key) {
            if (array_key_exists($field, $data)) {
                Setting::updateOrCreate(['tenant_id' => $tenantId, 'key' => $key], ['value' => $data[$field] ? '1' : '0']);
            }
        }
        foreach (['stock' => 'foh_stock', 'takeaway_flow' => 'foh_takeaway_flow', 'default_tab' => 'foh_default_tab'] as $field => $key) {
            if (array_key_exists($field, $data)) {
                Setting::updateOrCreate(['tenant_id' => $tenantId, 'key' => $key], ['value' => (string) $data[$field]]);
            }
        }
    }
}
