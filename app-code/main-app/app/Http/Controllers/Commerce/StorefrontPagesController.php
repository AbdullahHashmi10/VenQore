<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\CommerceOrder;
use App\Models\Commerce\Storefront;
use App\Models\Commerce\StorefrontReview;
use App\Services\Commerce\CheckoutService;
use App\Services\Commerce\Promotions;
use App\Services\Commerce\StorefrontCatalogue;
use App\Services\Commerce\StorefrontPresenter;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * The public online store as a small website: Home, Shop (filters), Product, Cart.
 *
 * All four pages are the same for every business today; only the data differs. A later "template" is just
 * another set of React pages fed by the same props, so nothing here should know about layout.
 * The QR menu (/catalogue/...) is a different surface and is not served from here.
 */
class StorefrontPagesController extends Controller
{
    public function __construct(private StorefrontCatalogue $catalogue)
    {
    }

    public function home(Request $request, string $slug)
    {
        // Old links used /shop/{slug}?q=...&category=... for browsing: send them to the shop page.
        if ($request->query('q') !== null || $request->query('category') !== null || $request->query('page') !== null) {
            return redirect()->route('commerce.store.products', ['slug' => $slug] + $request->only(['q', 'category', 'page']), 301);
        }

        $open = $this->open($request, $slug);
        if (! $open instanceof Storefront) {
            return $open;
        }
        $store = $open;
        $items = $this->catalogue->items($store);
        $notSoldOut = fn ($i) => $i['stock'] !== 'out';

        $featured = $items->filter(fn ($i) => $i['featured'] && $notSoldOut($i))->take(8)->values();
        // "New" only means something when most of the range is not new.
        $fresh = $items->filter(fn ($i) => $i['is_new'] && $notSoldOut($i));
        $newest = ($fresh->count() >= 3 && $fresh->count() < $items->count() * 0.75) ? $fresh->sortByDesc('listed_at')->take(4)->values() : collect();
        $onOffer = $items->filter(fn ($i) => $i['was_price'] !== null && $notSoldOut($i))->take(8)->values();
        // A small shop may have flagged nothing: fall back to the first items so the page is never empty.
        $picks = $featured->isNotEmpty() ? $featured : $items->filter($notSoldOut)->take(8)->values();

        $shared = $this->shared($request, $store);
        $menu = [];
        if ($shared['template'] === 'restaurant') {
            // A taste of the menu on the home page: the first few dishes of each section, sold-out last.
            $byCat = $items->groupBy(fn ($i) => $i['category_id'] ?: '_none');
            foreach ($this->catalogue->categories($items)->take(6) as $c) {
                $dishes = $byCat->get($c['id'], collect())->sortBy(fn ($i) => $i['stock'] === 'out' ? 1 : 0)->values();
                $menu[] = ['id' => $c['id'], 'name' => $c['name'], 'count' => $dishes->count(), 'items' => $dishes->take(4)->values()];
            }
            if ($menu === [] && $items->isNotEmpty()) {
                $menu[] = ['id' => '_none', 'name' => 'Menu', 'count' => $items->count(), 'items' => $items->take(8)->values()];
            }
        }

        return Inertia::render('Storefront/Home', $shared + [
            'menu' => $menu,
            'picks' => $picks,
            'picks_are_featured' => $featured->isNotEmpty(),
            'new_arrivals' => $newest,
            'on_offer' => $onOffer,
            'categories' => $this->catalogue->categories($items),
            'offers' => $this->catalogue->offers($store),
            'totals' => ['products' => $items->count()],
        ]);
    }

    public function products(Request $request, string $slug)
    {
        $open = $this->open($request, $slug);
        if (! $open instanceof Storefront) {
            return $open;
        }
        $store = $open;
        $all = $this->catalogue->items($store);

        $filters = [
            'q' => mb_substr(trim((string) $request->query('q', '')), 0, 60),
            'category' => (string) $request->query('category', ''),
            'sort' => in_array($request->query('sort'), ['featured', 'price_asc', 'price_desc', 'newest', 'name'], true) ? (string) $request->query('sort') : 'featured',
            'min' => $request->query('min', ''),
            'max' => $request->query('max', ''),
            'in_stock' => $request->boolean('in_stock'),
            'offer' => $request->boolean('offer'),
        ];

        $shared = $this->shared($request, $store);
        $matched = $this->catalogue->filter($all, $filters)->values();
        // A menu reads top to bottom by section, so the restaurant template gets every match on one page.
        $per = $shared['template'] === 'restaurant' ? max(1, $matched->count()) : StorefrontCatalogue::PER_PAGE;
        $page = max(1, (int) $request->query('page', 1));
        $slice = $matched->slice(($page - 1) * $per, $per)->values();
        $pager = new LengthAwarePaginator($slice, $matched->count(), $per, $page);

        $prices = $all->map(fn ($i) => (float) ($i['price_from'] ?? $i['price']));

        return Inertia::render('Storefront/Shop', $shared + [
            'items' => $slice,
            'pagination' => ['current' => $pager->currentPage(), 'last' => $pager->lastPage(), 'total' => $matched->count()],
            'categories' => $this->catalogue->categories($all),
            'filters' => $filters,
            'bounds' => ['min' => $prices->isEmpty() ? 0 : floor($prices->min()), 'max' => $prices->isEmpty() ? 0 : ceil($prices->max())],
            'has_offers' => $all->contains(fn ($i) => $i['was_price'] !== null),
            'catalogue_total' => $all->count(),
        ]);
    }

    public function product(Request $request, string $slug, string $id)
    {
        $open = $this->open($request, $slug);
        if (! $open instanceof Storefront) {
            return $open;
        }
        $store = $open;
        $all = $this->catalogue->items($store);

        // The link may carry an option's own listing id; the page belongs to its group.
        $item = $all->first(fn ($i) => (string) $i['id'] === $id
            || collect($i['options'])->contains(fn ($o) => (string) $o['id'] === $id));
        abort_unless($item, 404);

        $related = $all->filter(fn ($i) => (string) $i['id'] !== (string) $item['id'] && $i['category_id'] && $i['category_id'] === $item['category_id'] && $i['stock'] !== 'out')
            ->take(4)->values();
        if ($related->count() < 4) {
            $related = $related->concat(
                $all->filter(fn ($i) => (string) $i['id'] !== (string) $item['id'] && $i['stock'] !== 'out' && ! $related->contains(fn ($r) => $r['id'] === $i['id']))
                    ->sortByDesc('featured')->take(4 - $related->count())
            )->values();
        }

        return Inertia::render('Storefront/Product', $this->shared($request, $store) + [
            'item' => $item,
            'selected_option' => collect($item['options'])->contains(fn ($o) => (string) $o['id'] === $id) ? $id : null,
            'related' => $related,
        ]);
    }

    public function cart(Request $request, string $slug)
    {
        $open = $this->open($request, $slug);
        if (! $open instanceof Storefront) {
            return $open;
        }

        return Inertia::render('Storefront/Cart', $this->shared($request, $open));
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    /** The store this request may see, or a redirect (moved slug). Aborts 404 for anything else. */
    private function open(Request $request, string $slug)
    {
        $key = 'commerce_preview.' . $slug;
        if ($request->query('preview') && $request->hasValidSignature()) {
            $store = Storefront::where('slug', $slug)->firstOrFail();   // signed link: the owner previews an unpublished shop
            $request->session()->put($key, true);                       // and may then click through its other pages
            $request->session()->put('commerce_editing.' . $slug, $request->boolean('edit'));
            $request->attributes->set('store_preview', true);

            return $store;
        }
        if ($request->session()->get($key)) {
            $store = Storefront::where('slug', $slug)->firstOrFail();
            if ($store->status !== 'published') {
                $request->attributes->set('store_preview', true);
            }

            return $store;
        }

        $store = Storefront::where('slug', $slug)->where('status', 'published')->first();
        if ($store && ! $store->moduleOn('online_store')) {
            $store = null;
        }
        if (! $store) {
            $id = DB::table('storefront_slug_history')->where('slug', $slug)->value('storefront_id');
            $now = $id ? Storefront::where('id', $id)->where('status', 'published')->value('slug') : null;
            if ($now && $now !== $slug) {
                return redirect(preg_replace('#^/shop/' . preg_quote($slug, '#') . '#', '/shop/' . $now, $request->getRequestUri()), 301);
            }
            abort(404);
        }

        return $store;
    }

    /** Props every store page needs: the business, its rating, the signed-in customer and the cart rules. */
    private function shared(Request $request, Storefront $store): array
    {
        $preview = (bool) $request->attributes->get('store_preview');
        $public = StorefrontPresenter::publicStore($store);
        if ($preview) {
            $public = array_merge($public, ['accepting_orders' => false]);
        }

        $reviews = StorefrontReview::where('storefront_id', $store->id)->orderByDesc('created_at')->limit(10)
            ->get(['id', 'customer_name', 'rating', 'review', 'is_verified_purchaser', 'created_at'])
            ->map(fn ($r) => [
                'id' => $r->id,
                'customer_name' => $r->customer_name,
                'rating' => (int) $r->rating,
                'review' => $r->review,
                'is_verified' => (bool) $r->is_verified_purchaser,
                'created_at' => CommerceOrder::localTime($r->created_at, $store->timezone ?? 'UTC'),
            ])->values();
        $avg = StorefrontReview::where('storefront_id', $store->id)->avg('rating');

        $template = $this->template($request, $store, $preview);

        return [
            'store' => $public,
            'template' => $template,
            // Restaurants that run Front of House take table requests from the website.
            // Owner came from "Edit photos": show Add photo on every photo spot.
            'edit_photos' => $preview && $request->session()->get('commerce_editing.' . $store->slug) ? $request->session()->get('commerce_edit.' . $store->slug) : null,
            'can_reserve' => $template === 'restaurant' && \App\Services\ModuleService::runsFrontOfHouse(\App\Models\Tenant::find($store->tenant_id)),
            'preview' => $preview,
            'show_images' => (bool) $store->show_images,
            'limits' => ['max_qty' => CheckoutService::MAX_QTY],
            'has_coupons' => app(Promotions::class)->live($store)->contains(fn ($p) => $p->code !== null),
            'rating_summary' => [
                'average' => $avg ? round((float) $avg, 1) : null,
                'count' => StorefrontReview::where('storefront_id', $store->id)->count(),
                'reviews' => $reviews,
            ],
            'customer' => $this->customer($store),
        ];
    }

    /**
     * Which set of pages this business gets. Restaurants (the businesses that run Front of House) get a
     * menu-first template; everyone else the general shop. The owner can try the other one in a preview
     * with ?template=restaurant|default; customers can never switch it.
     */
    private function template(Request $request, Storefront $store, bool $preview): string
    {
        $want = $request->query('template');
        if ($preview && in_array($want, ['restaurant', 'default'], true)) {
            $request->session()->put('commerce_template.' . $store->id, $want);
        }
        if ($preview && ($saved = $request->session()->get('commerce_template.' . $store->id))) {
            return $saved;
        }

        $chosen = (string) ($store->getAttributes()['storefront_template'] ?? 'auto');
        if (in_array($chosen, ['restaurant', 'default'], true)) {
            return $chosen;
        }

        return \App\Services\ModuleService::runsFrontOfHouse(\App\Models\Tenant::find($store->tenant_id)) ? 'restaurant' : 'default';
    }

    private function customer(Storefront $store): ?array
    {
        $sess = session('commerce_customer');
        if (! $sess || empty($sess['phone'])) {
            return null;
        }
        $phone = $sess['phone'];
        $orders = DB::table('commerce_orders')->where('storefront_id', $store->id)->where('customer_phone', $phone)
            ->orderByDesc('created_at')->limit(20)
            ->get(['id', 'public_number', 'status', 'total', 'currency_symbol', 'created_at', 'fulfilment'])
            ->map(function ($o) use ($store) {
                $token = Str::random(48);
                DB::table('commerce_order_tokens')->insert(['order_id' => $o->id, 'token_hash' => hash('sha256', $token), 'created_at' => now()]);

                return [
                    'id' => $o->id,
                    'number' => $o->public_number,
                    'status' => $o->status,
                    'total' => (float) $o->total,
                    'currency_symbol' => $o->currency_symbol,
                    'fulfilment' => $o->fulfilment,
                    'created_at' => CommerceOrder::localTime($o->created_at, $store->timezone ?? 'UTC'),
                    'status_url' => url('/order-status/' . $token),
                ];
            })->values();
        $mine = StorefrontReview::where('storefront_id', $store->id)->where('customer_phone', $phone)->first();

        return [
            'name' => $sess['name'],
            'phone' => $phone,
            'email' => $sess['email'] ?? null,
            'orders' => $orders,
            'has_reviewed' => (bool) $mine,
            'review' => $mine ? ['rating' => (int) $mine->rating, 'review' => $mine->review] : null,
        ];
    }
}
