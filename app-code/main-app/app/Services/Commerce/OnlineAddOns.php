<?php

namespace App\Services\Commerce;

use Illuminate\Support\Facades\DB;

/**
 * Add-ons (modifier groups) for the public shop and the QR menu.
 *
 * The register already offers add-ons from the Add-ons library: groups attached
 * to a product directly, plus groups attached to its category. This reads the
 * same two places so a customer sees the same choices a waiter would, and it is
 * the only place that decides what an order may contain: the browser's prices
 * are never trusted, only the chosen option ids.
 */
class OnlineAddOns
{
    /**
     * @param array<string, string|null> $products product id => category id
     * @return array<string, array<int, array>> product id => groups
     */
    public function forProducts(int $tenantId, array $products): array
    {
        if (empty($products)) {
            return [];
        }

        $pids = array_keys($products);
        $cids = array_values(array_unique(array_filter(array_values($products))));

        $byProduct = DB::table('product_modifier_group')->whereIn('product_id', $pids)
            ->orderBy('sort_order')->get(['product_id', 'modifier_group_id'])->groupBy('product_id');
        $byCategory = empty($cids) ? collect() : DB::table('category_modifier_group')->whereIn('category_id', $cids)
            ->orderBy('sort_order')->get(['category_id', 'modifier_group_id'])->groupBy('category_id');

        $groupIds = $byProduct->flatten(1)->pluck('modifier_group_id')
            ->merge($byCategory->flatten(1)->pluck('modifier_group_id'))->unique()->values()->all();
        if (empty($groupIds)) {
            return [];
        }

        $groups = DB::table('modifier_groups')->where('tenant_id', $tenantId)->whereIn('id', $groupIds)->get()->keyBy('id');
        $mods = DB::table('modifiers')->where('tenant_id', $tenantId)->whereIn('modifier_group_id', $groupIds)
            ->where('available', 1)->orderBy('sort_order')->orderBy('id')->get()->groupBy('modifier_group_id');

        $shape = function ($g) use ($mods) {
            $options = ($mods->get($g->id) ?? collect())->map(fn ($m) => [
                'id' => (int) $m->id,
                'name' => (string) $m->name,
                'price_delta' => round((float) $m->price_delta, 2),
                'is_default' => (bool) $m->is_default,
            ])->values()->all();

            return [
                'id' => (int) $g->id,
                'name' => (string) $g->name,
                'min_select' => (int) $g->min_select,
                'max_select' => (int) $g->max_select,
                'required' => (bool) $g->required,
                'options' => $options,
            ];
        };

        $out = [];
        foreach ($products as $pid => $cid) {
            $ids = collect($byProduct->get($pid) ?? [])->pluck('modifier_group_id')
                ->merge(collect($byCategory->get($cid) ?? [])->pluck('modifier_group_id'))->unique();
            $list = [];
            foreach ($ids as $gid) {
                $g = $groups->get($gid);
                if (! $g) {
                    continue;
                }
                $shaped = $shape($g);
                if ($shaped['options']) {
                    $list[] = $shaped;
                }
            }
            if ($list) {
                $out[$pid] = $list;
            }
        }

        return $out;
    }

    /**
     * Check a customer's chosen option ids against what the product really offers.
     *
     * @param array<int, array> $groups from forProducts() for this one product
     * @param int[]             $selected option ids
     * @return array<int, array{id:int,name:string,group:string,price_delta:float}>
     * @throws CommerceException
     */
    public function resolve(array $groups, array $selected, string $itemTitle = 'this item'): array
    {
        $selected = array_values(array_unique(array_map('intval', $selected)));

        $known = [];
        foreach ($groups as $g) {
            foreach ($g['options'] as $o) {
                $known[$o['id']] = [$g, $o];
            }
        }
        foreach ($selected as $id) {
            if (! isset($known[$id])) {
                throw new CommerceException('One of the options you chose for ' . $itemTitle . ' is no longer available.', 'option_unavailable');
            }
        }

        $resolved = [];
        foreach ($groups as $g) {
            $picked = array_values(array_filter($selected, fn ($id) => ($known[$id][0]['id'] ?? null) === $g['id']));
            $max = (int) $g['max_select'];
            $need = max((int) $g['min_select'], $g['required'] ? 1 : 0);
            if (count($picked) < $need) {
                throw new CommerceException('Please choose ' . $g['name'] . ' for ' . $itemTitle . '.', 'option_required');
            }
            if ($max > 0 && count($picked) > $max) {
                throw new CommerceException('Choose at most ' . $max . ' for ' . $g['name'] . ' on ' . $itemTitle . '.', 'option_too_many');
            }
            foreach ($picked as $id) {
                $o = $known[$id][1];
                $resolved[] = ['id' => $o['id'], 'name' => $o['name'], 'group' => $g['name'], 'price_delta' => $o['price_delta']];
            }
        }

        return $resolved;
    }
}
