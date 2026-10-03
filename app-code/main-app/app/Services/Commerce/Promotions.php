<?php

namespace App\Services\Commerce;

use App\Models\Commerce\Storefront;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Dated store/category offers.
 *
 * Precedence (documented, tested): at most one promotion applies to a line.
 *  1. A valid coupon code replaces every automatic offer for the whole order.
 *  2. Otherwise each line takes the highest-percentage automatic offer that applies to it
 *     (category offer wins a tie against a store-wide one).
 * Promotions are percentages (or a fixed amount spread pro-rata, i.e. an effective percentage) applied to the ONLINE price (after the storefront pricing rule). They never
 * apply to a line when that would take it below cost without the merchant's below-cost approval.
 * Windows are stored in UTC; the merchant enters them in the store's timezone. Orders snapshot
 * list price, discount percent and promotion name, so later edits never change an existing order.
 */
class Promotions
{
    public static function normalizeCode(?string $c): ?string
    {
        $c = strtoupper(preg_replace('/[^A-Za-z0-9_-]/', '', (string) $c));
        return $c === '' ? null : substr($c, 0, 40);
    }

    /** Promotions currently inside their window and switched on (uses cap checked for codes separately). */
    public function live(Storefront $store): Collection
    {
        $now = now('UTC')->format('Y-m-d H:i:s');
        return DB::table('commerce_promotions')
            ->where('storefront_id', $store->id)->where('tenant_id', $store->tenant_id)->where('is_active', 1)
            ->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', $now))
            ->get();
    }

    /** @return array{coupon: ?object, auto: Collection} */
    public function resolve(Storefront $store, ?string $code, float $preDiscountGross): array
    {
        $live = $this->live($store)->filter(fn ($p) => (float) $p->min_order <= $preDiscountGross + 0.0001);
        $coupon = null;
        $code = self::normalizeCode($code);
        if ($code !== null) {
            $coupon = $live->first(fn ($p) => $p->code === $code && ($p->max_uses === null || $p->uses < $p->max_uses));
            if (! $coupon) {
                throw new CommerceException('That coupon code is not valid for this order.', 'invalid_coupon');
            }
        }
        return ['coupon' => $coupon, 'auto' => $live->filter(fn ($p) => $p->code === null)->values()];
    }

    public static function applies(object $promo, ?string $categoryId): bool
    {
        return $promo->scope === 'store' || ($promo->scope === 'category' && $categoryId !== null && $promo->category_id === $categoryId);
    }

    /**
     * Effective percentage for every promotion in the plan. A percent offer is itself; a fixed-amount offer
     * ("Rs 200 off") is spread pro-rata over the lines it applies to, so it becomes the same percentage on each,
     * capped at 90% and never more than the eligible value.
     *
     * @param array<int, array{0:string,1:float,2:object,3:array}> $cand
     * @return array<string,float>
     */
    public function effective(array $plan, array $cand): array
    {
        $promos = collect($plan['auto'])->when($plan['coupon'], fn ($c) => $c->push($plan['coupon']));
        $eff = [];
        foreach ($promos as $p) {
            if (($p->kind ?? 'percent') !== 'amount') {
                $eff[$p->id] = (float) $p->percent;
                continue;
            }
            $base = 0.0;
            foreach ($cand as [, $qty, $row, $price]) {
                if (self::applies($p, $row->category_id)) {
                    $base += round($qty * $price['online_price'], 2);
                }
            }
            $eff[$p->id] = $base > 0 ? round(min(90.0, (float) $p->amount / $base * 100), 4) : 0.0;
        }
        return $eff;
    }

    public function pickFor(array $plan, ?string $categoryId, array $eff = []): ?object
    {
        $pct = fn ($p) => $eff[$p->id] ?? (float) $p->percent;
        if ($plan['coupon']) {
            return self::applies($plan['coupon'], $categoryId) ? $plan['coupon'] : null;
        }
        return $plan['auto']->filter(fn ($p) => self::applies($p, $categoryId))
            ->sortByDesc(fn ($p) => [$pct($p), $p->scope === 'category' ? 1 : 0])->first();
    }
}
