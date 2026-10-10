<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\Storefront;
use App\Services\Commerce\StorefrontPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Photos placed straight onto the public pages in "edit photos" mode.
 *
 * Store owners fill the slots of their own storefront (stored on storefronts.page_images);
 * the platform admin fills the slots of the /shop marketplace (settings key marketplace_images).
 * A slot holding more than one photo shows as a slideshow where the layout allows it.
 */
class PageImagesController extends Controller
{
    /** slot => how many photos it may hold */
    public const STORE_SLOTS = ['hero' => 6, 'story' => 2, 'delivery' => 1, 'takeaway' => 1, 'dinein' => 3, 'visit' => 1];
    public const MARKET_SLOTS = ['hero' => 6, 'promo_deals' => 1, 'promo_delivery' => 1, 'kind_restaurants' => 1, 'kind_groceries' => 1, 'kind_pharmacy' => 1, 'kind_fashion' => 1, 'kind_electronics' => 1, 'join' => 1];
    private const MARKET_KEY = 'marketplace_images';

    /** Stored paths -> public URLs, every known slot present (empty when unset). */
    public static function urls(?array $paths, array $slots): array
    {
        $out = [];
        foreach ($slots as $slot => $max) {
            $out[$slot] = collect($paths[$slot] ?? [])->filter()->take($max)->map(fn ($p) => StorefrontPresenter::mediaUrl($p))->values()->all();
        }

        return $out;
    }

    public static function forStore(Storefront $s): array
    {
        $raw = $s->getAttributes()['page_images'] ?? null;

        return self::urls(is_string($raw) ? (json_decode($raw, true) ?: []) : (array) $raw, self::STORE_SLOTS);
    }

    public static function forMarketplace(): array
    {
        $raw = DB::table('settings')->where('key', self::MARKET_KEY)->value('value');

        return self::urls($raw ? (json_decode($raw, true) ?: []) : [], self::MARKET_SLOTS);
    }

    // ── store owner ────────────────────────────────────────────────────────────

    public function storeUpload(Request $request): JsonResponse
    {
        $store = $this->ownStore();
        $slot = $this->slot($request, self::STORE_SLOTS);
        $paths = $this->storeRaw($store);
        if (count($paths[$slot] ?? []) >= self::STORE_SLOTS[$slot]) {
            return response()->json(['message' => 'This spot is full. Remove a photo first.'], 422);
        }
        $paths[$slot][] = $request->file('image')->store('commerce/page', 'public');
        $this->saveStore($store, $paths);

        return response()->json(['images' => self::forStore($store->fresh())]);
    }

    public function storeRemove(Request $request): JsonResponse
    {
        $store = $this->ownStore();
        $slot = $this->slot($request, self::STORE_SLOTS, false);
        $i = (int) $request->input('index', -1);
        $paths = $this->storeRaw($store);
        if (isset($paths[$slot][$i])) {
            Storage::disk('public')->delete($paths[$slot][$i]);
            array_splice($paths[$slot], $i, 1);
            $this->saveStore($store, $paths);
        }

        return response()->json(['images' => self::forStore($store->fresh())]);
    }

    // ── platform admin (marketplace) ───────────────────────────────────────────

    public function marketUpload(Request $request): JsonResponse
    {
        $slot = $this->slot($request, self::MARKET_SLOTS);
        $paths = $this->marketRaw();
        if (count($paths[$slot] ?? []) >= self::MARKET_SLOTS[$slot]) {
            return response()->json(['message' => 'This spot is full. Remove a photo first.'], 422);
        }
        $paths[$slot][] = $request->file('image')->store('marketplace', 'public');
        $this->saveMarket($paths);

        return response()->json(['images' => self::forMarketplace()]);
    }

    public function marketRemove(Request $request): JsonResponse
    {
        $slot = $this->slot($request, self::MARKET_SLOTS, false);
        $i = (int) $request->input('index', -1);
        $paths = $this->marketRaw();
        if (isset($paths[$slot][$i])) {
            Storage::disk('public')->delete($paths[$slot][$i]);
            array_splice($paths[$slot], $i, 1);
            $this->saveMarket($paths);
        }

        return response()->json(['images' => self::forMarketplace()]);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private function slot(Request $request, array $slots, bool $withImage = true): string
    {
        $rules = ['slot' => ['required', 'string', 'in:' . implode(',', array_keys($slots))]];
        if ($withImage) {
            $rules['image'] = ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'];
        } else {
            $rules['index'] = ['required', 'integer', 'min:0', 'max:20'];
        }

        return $request->validate($rules)['slot'];
    }

    private function ownStore(): Storefront
    {
        $t = app('current.tenant');
        $s = Storefront::where('tenant_id', $t->id)->first();
        abort_unless($s, 404, 'Set up your online store first.');

        return $s;
    }

    private function storeRaw(Storefront $s): array
    {
        $raw = $s->getAttributes()['page_images'] ?? null;

        return is_string($raw) ? (json_decode($raw, true) ?: []) : (array) $raw;
    }

    private function saveStore(Storefront $s, array $paths): void
    {
        DB::table('storefronts')->where('id', $s->id)->update(['page_images' => json_encode(array_map('array_values', $paths)), 'updated_at' => now()]);
    }

    private function marketRaw(): array
    {
        $raw = DB::table('settings')->where('key', self::MARKET_KEY)->value('value');

        return $raw ? (json_decode($raw, true) ?: []) : [];
    }

    private function saveMarket(array $paths): void
    {
        $value = json_encode(array_map('array_values', $paths));
        if (DB::table('settings')->where('key', self::MARKET_KEY)->exists()) {
            DB::table('settings')->where('key', self::MARKET_KEY)->update(['value' => $value, 'updated_at' => now()]);
        } else {
            DB::table('settings')->insert(['id' => (string) \Illuminate\Support\Str::uuid(), 'key' => self::MARKET_KEY, 'value' => $value, 'group' => 'marketplace', 'created_at' => now(), 'updated_at' => now()]);
        }
    }
}
