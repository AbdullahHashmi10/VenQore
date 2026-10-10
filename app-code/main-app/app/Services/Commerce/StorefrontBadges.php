<?php

namespace App\Services\Commerce;

use Illuminate\Support\Facades\DB;

/**
 * Store badges: earned from activity, overridable by the platform owner.
 * See config/store_badges.php for the badges and their thresholds.
 */
class StorefrontBadges
{
    /** @var array<string, array> per-request memo: storefront id => badges to show */
    private static array $memo = [];

    /** The single rule for what shows: an override beats the automatic result. */
    public static function visible(bool $autoEarned, ?string $override): bool
    {
        if ($override === 'on') {
            return true;
        }
        if ($override === 'off') {
            return false;
        }

        return $autoEarned;
    }

    public static function catalogue(): array
    {
        return config('store_badges.badges', []);
    }

    /** Load the badges for many stores in one query (directory pages). */
    public static function preload(array $storefrontIds): void
    {
        $ids = array_values(array_diff(array_unique($storefrontIds), array_keys(self::$memo)));
        if (empty($ids)) {
            return;
        }
        foreach ($ids as $id) {
            self::$memo[$id] = [];
        }

        $cat = self::catalogue();
        $rows = DB::table('storefront_badges')->whereIn('storefront_id', $ids)->get();
        $by = [];
        foreach ($rows as $r) {
            if (isset($cat[$r->badge]) && self::visible((bool) $r->auto_earned, $r->override)) {
                $by[$r->storefront_id][] = $r->badge;
            }
        }
        foreach ($by as $id => $keys) {
            usort($keys, fn ($a, $b) => ($cat[$a]['priority'] ?? 99) <=> ($cat[$b]['priority'] ?? 99));
            self::$memo[$id] = array_map(fn ($k) => [
                'key' => $k, 'label' => $cat[$k]['label'], 'description' => $cat[$k]['description'], 'tone' => $cat[$k]['tone'],
            ], $keys);
        }
    }

    /** Badges to show for one store, best first. */
    public static function forStorefront(string $storefrontId): array
    {
        self::preload([$storefrontId]);

        return self::$memo[$storefrontId] ?? [];
    }

    public static function flushMemo(): void
    {
        self::$memo = [];
    }

    /**
     * Recompute every automatic badge. Overrides are never touched; a badge no
     * longer earned just flips auto_earned off, so history of overrides stays.
     *
     * @return array<string,int> badge => stores earning it now
     */
    public function refresh(): array
    {
        $cfg = self::catalogue();
        $now = now();
        $earned = [];

        $storeIds = DB::table('storefronts')->pluck('id')->all();

        // early merchant: the first N storefronts ever created
        if (isset($cfg['early_merchant'])) {
            $earned['early_merchant'] = DB::table('storefronts')->orderBy('created_at')->orderBy('id')
                ->limit((int) $cfg['early_merchant']['limit'])->pluck('id')->all();
        }

        // reviews
        $reviews = DB::table('storefront_reviews')->select('storefront_id', DB::raw('COUNT(*) as n'), DB::raw('AVG(rating) as avg_rating'))
            ->groupBy('storefront_id')->get();
        if (isset($cfg['top_rated'])) {
            $c = $cfg['top_rated'];
            $earned['top_rated'] = $reviews->filter(fn ($r) => $r->n >= $c['min_reviews'] && (float) $r->avg_rating >= $c['min_rating'])
                ->pluck('storefront_id')->all();
        }
        if (isset($cfg['most_reviewed'])) {
            $c = $cfg['most_reviewed'];
            $earned['most_reviewed'] = $reviews->filter(fn ($r) => $r->n >= $c['min_reviews'])
                ->sortByDesc('n')->take((int) $c['top'])->pluck('storefront_id')->all();
        }

        // orders, last 30 days vs the 30 before
        $recent = DB::table('commerce_orders')->where('status', 'completed')->where('completed_at', '>=', $now->copy()->subDays(30))
            ->select('storefront_id', DB::raw('COUNT(*) as n'))->groupBy('storefront_id')->pluck('n', 'storefront_id');
        $prev = DB::table('commerce_orders')->where('status', 'completed')
            ->where('completed_at', '>=', $now->copy()->subDays(60))->where('completed_at', '<', $now->copy()->subDays(30))
            ->select('storefront_id', DB::raw('COUNT(*) as n'))->groupBy('storefront_id')->pluck('n', 'storefront_id');

        if (isset($cfg['most_ordered'])) {
            $c = $cfg['most_ordered'];
            $earned['most_ordered'] = $recent->filter(fn ($n) => $n >= $c['min_orders'])->sortDesc()->take((int) $c['top'])->keys()->all();
        }
        if (isset($cfg['fastest_growing'])) {
            $c = $cfg['fastest_growing'];
            $growth = [];
            foreach ($recent as $sid => $n) {
                if ($n < $c['min_recent_orders']) {
                    continue;
                }
                $p = (int) ($prev[$sid] ?? 0);
                $g = $p > 0 ? ($n - $p) / $p : 9.99; // brand-new volume counts as strong growth
                if ($g >= $c['min_growth']) {
                    $growth[$sid] = $g;
                }
            }
            arsort($growth);
            $earned['fastest_growing'] = array_slice(array_keys($growth), 0, (int) $c['top']);
        }

        // fast responder
        if (isset($cfg['fast_responder'])) {
            $c = $cfg['fast_responder'];
            $earned['fast_responder'] = DB::table('commerce_orders')->whereNotNull('confirmed_at')
                ->where('created_at', '>=', $now->copy()->subDays(60))
                ->select('storefront_id', DB::raw('COUNT(*) as n'), DB::raw('AVG(TIMESTAMPDIFF(MINUTE, created_at, confirmed_at)) as mins'))
                ->groupBy('storefront_id')->get()
                ->filter(fn ($r) => $r->n >= $c['min_orders'] && (float) $r->mins <= $c['max_minutes'])
                ->pluck('storefront_id')->all();
        }

        $counts = [];
        foreach ($cfg as $key => $_) {
            $set = array_flip($earned[$key] ?? []);
            $counts[$key] = count($set);

            // earn
            foreach (array_keys($set) as $sid) {
                $row = DB::table('storefront_badges')->where('storefront_id', $sid)->where('badge', $key)->first();
                if (! $row) {
                    DB::table('storefront_badges')->insert([
                        'storefront_id' => $sid, 'badge' => $key, 'auto_earned' => 1, 'earned_at' => $now,
                        'created_at' => $now, 'updated_at' => $now,
                    ]);
                } elseif (! $row->auto_earned) {
                    DB::table('storefront_badges')->where('id', $row->id)->update(['auto_earned' => 1, 'earned_at' => $now, 'updated_at' => $now]);
                }
            }
            // lose: flip off what is no longer earned (override rows are kept)
            DB::table('storefront_badges')->where('badge', $key)->where('auto_earned', 1)
                ->whereNotIn('storefront_id', array_keys($set) ?: [''])
                ->update(['auto_earned' => 0, 'updated_at' => $now]);
        }
        // drop dead rows: nothing earned, no override, so nothing to remember
        DB::table('storefront_badges')->where('auto_earned', 0)->whereNull('override')->delete();

        self::flushMemo();

        return $counts;
    }

    /**
     * Platform owner's word on one badge for one store.
     * $mode: 'on' | 'off' | 'auto' (auto removes the override).
     */
    public function setOverride(string $storefrontId, string $badge, string $mode, ?string $note, ?int $userId): void
    {
        if (! isset(self::catalogue()[$badge]) || ! in_array($mode, ['on', 'off', 'auto'], true)) {
            throw new \InvalidArgumentException('Unknown badge or mode.');
        }

        $row = DB::table('storefront_badges')->where('storefront_id', $storefrontId)->where('badge', $badge)->first();
        $override = $mode === 'auto' ? null : $mode;

        if ($row) {
            DB::table('storefront_badges')->where('id', $row->id)->update([
                'override' => $override, 'note' => $override ? $note : null, 'set_by' => $override ? $userId : null, 'updated_at' => now(),
            ]);
            if ($override === null && ! $row->auto_earned) {
                DB::table('storefront_badges')->where('id', $row->id)->delete();
            }
        } elseif ($override !== null) {
            DB::table('storefront_badges')->insert([
                'storefront_id' => $storefrontId, 'badge' => $badge, 'auto_earned' => 0, 'override' => $override,
                'note' => $note, 'set_by' => $userId, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        self::flushMemo();
    }
}
