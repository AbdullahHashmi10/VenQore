<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\CommerceOrder;
use App\Models\Commerce\Storefront;
use App\Models\Commerce\StorefrontReview;
use App\Services\Commerce\CheckoutService;
use App\Services\Commerce\CommerceException;
use App\Services\Commerce\OnlinePricing;
use App\Services\Commerce\OrderService;
use App\Services\Commerce\ProductReadiness;
use App\Services\Commerce\StorefrontPresenter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Public, unauthenticated surface. Fails closed: nothing is read through ambient tenant scopes, only through
 * an explicit published storefront, and only allow-listed fields are returned.
 */
class PublicStoreController extends Controller
{
    public function __construct(private CheckoutService $checkout, private OrderService $orders)
    {
    }

    private function published(string $slug): Storefront
    {
        return Storefront::where('slug', $slug)->where('status', 'published')->firstOrFail();
    }

    /** An old slug 301s to the current one (printed QR codes and shared links keep working). */
    private function movedSlug(string $slug)
    {
        $id = DB::table('storefront_slug_history')->where('slug', $slug)->value('storefront_id');
        $now = $id ? Storefront::where('id', $id)->where('status', 'published')->value('slug') : null;
        return $now && $now !== $slug ? redirect('/shop/' . $now, 301) : null;
    }

    public function directory(Request $request)
    {
        $countries = DB::table('commerce_countries')->where('is_active', 1)->orderBy('name')->get(['id', 'code', 'name']);
        $country = $countries->firstWhere('code', strtoupper((string) $request->query('country'))) ?? ($countries->count() === 1 ? $countries->first() : null);
        $cities = $country ? DB::table('commerce_cities')->where('country_id', $country->id)->where('is_active', 1)->orderBy('sort_order')->orderBy('name')->get(['id', 'name', 'slug']) : collect();
        $city = $country ? $cities->firstWhere('slug', (string) $request->query('city')) : null;

        $stores = null;
        if ($city) {
            $page = Storefront::where('status', 'published')->where('city_id', $city->id)
                ->orderBy('display_name')->orderBy('id')->paginate(12)->withQueryString();
            $stores = [
                'data' => collect($page->items())->map(fn ($s) => StorefrontPresenter::card($s))->values(),
                'current' => $page->currentPage(), 'last' => $page->lastPage(), 'total' => $page->total(),
            ];
        }

        return Inertia::render('Commerce/Directory', [
            'countries' => $countries, 'country' => $country, 'cities' => $cities, 'city' => $city, 'stores' => $stores,
        ]);
    }

    public function show(Request $request, string $slug)
    {
        $preview = false;
        if ($request->query('preview') && $request->hasValidSignature()) {
            $store = Storefront::where('slug', $slug)->firstOrFail(); // signed link: the owner previews an unpublished shop
            $preview = true;
        } else {
            $store = Storefront::where('slug', $slug)->where('status', 'published')->first();
            if (! $store) {
                if ($r = $this->movedSlug($slug)) {
                    return $r;
                }
                abort(404);
            }
        }
        $q = trim((string) $request->query('q', ''));
        $cat = (string) $request->query('category', '');
        $base = fn () => DB::table('storefront_products as sp')
            ->join('products as p', function ($j) {
                $j->on('p.id', '=', 'sp.product_id')->on('p.tenant_id', '=', 'sp.tenant_id');
            })
            ->where('sp.storefront_id', $store->id)->where('sp.tenant_id', $store->tenant_id)->where('sp.is_published', 1)
            ->whereNull('p.deleted_at');
        $categories = $base()->join('categories as c', 'c.id', '=', 'p.category_id')
            ->groupBy('c.id', 'c.name')->orderBy('c.name')
            ->get(['c.id', 'c.name', DB::raw('count(*) as n')])
            ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name, 'count' => (int) $c->n])->values();
        $rows = DB::table('storefront_products as sp')
            ->join('products as p', function ($j) {
                $j->on('p.id', '=', 'sp.product_id')->on('p.tenant_id', '=', 'sp.tenant_id');
            })
            ->where('sp.storefront_id', $store->id)->where('sp.tenant_id', $store->tenant_id)->where('sp.is_published', 1)
            ->whereNull('p.deleted_at')
            ->where(fn ($w) => $w->whereNull('sp.option_group')->orWhereRaw('sp.id = (select min(sp2.id) from storefront_products sp2 join products p2 on p2.id = sp2.product_id and p2.deleted_at is null where sp2.storefront_id = sp.storefront_id and sp2.option_group = sp.option_group and sp2.is_published = 1)'))
            ->when($cat !== '', fn ($w) => $w->where('p.category_id', $cat))
            ->when($q !== '', fn ($w) => $w->where(function ($x) use ($q) {
                $like = '%' . str_replace(['%', '_'], ['\\%', '\\_'], mb_substr($q, 0, 60)) . '%';
                $x->where('p.name', 'like', $like)->orWhere('sp.public_name', 'like', $like);
            }))
            ->orderByDesc('sp.is_featured')->orderBy('sp.sort_order')->orderBy('p.name')->orderBy('sp.id')
            ->select(['sp.is_featured', 'p.category_id', 'sp.id as listing_id', 'sp.public_name', 'sp.public_description', 'sp.override_price', 'sp.allow_below_cost', 'sp.product_id',
                'sp.offline_reserve_qty', 'sp.online_stock_limit',
                'sp.image_path as listing_image', 'sp.option_group', 'sp.option_label', 'p.id', 'p.tenant_id', 'p.name', 'p.description', 'p.image_path', 'p.price', 'p.cost_price', 'p.tax_rate', 'p.price_includes_tax',
                'p.base_unit', 'p.unit', 'p.is_active', 'p.type', 'p.has_variants', 'p.is_weighted', 'p.track_serial'])
            ->paginate(24)->withQueryString();

        $pricing = app(OnlinePricing::class);
        $promos = app(\App\Services\Commerce\Promotions::class);
        $plan = ['coupon' => null, 'auto' => $promos->live($store)->filter(fn ($p) => $p->code === null && ($p->kind ?? 'percent') === 'percent' && (float) $p->min_order <= 0)->values()];
        $catNames = $categories->pluck('name', 'id');
        $stockSvc = app(\App\Services\Commerce\StockAvailability::class);
        $build = function ($r) use ($pricing, $store, $promos, $plan, $catNames, $stockSvc) {
            if (ProductReadiness::reason($r) !== null) {
                return null;
            }
            $price = $pricing->resolve($r, $r, $store);
            if ($price['below_cost'] && ! $r->allow_below_cost) {
                return null;
            }
            $was = null;
            if ($promo = $promos->pickFor($plan, $r->category_id)) {
                $d = $pricing->discount($price, $r, (float) $promo->percent);
                if (! $d['below_cost'] || $r->allow_below_cost) {
                    $was = $price['online_price'];
                    $price = $d;
                }
            }
            $rawLeft = $store->warehouse_id ? $stockSvc->available($store->tenant_id, $r->id, $store->warehouse_id) : null;
            $left = null;
            if ($rawLeft !== null) {
                $offline = (float) ($r->offline_reserve_qty ?? 0);
                $left = max(0.0, $rawLeft - $offline);
                if ($r->online_stock_limit !== null) {
                    $left = min($left, (float) $r->online_stock_limit);
                }
                if ($left > 0) {
                    // orders waiting for the business compete for the same units: show the honest remainder (never below 1 while any is free)
                    $left = max(1.0, $left - $stockSvc->pendingDemand($store->tenant_id, $r->id));
                }
            }
            return [
                'category' => $catNames[$r->category_id] ?? null,
                'stock' => $left === null ? null : ($left <= 0 ? 'out' : ($left <= 5 ? 'low' : null)),
                'left' => $left !== null && $left > 0 && $left <= 5 ? (int) floor($left) : null,
                'featured' => (bool) $r->is_featured,
                'was_price' => $was,
                'id' => $r->listing_id,
                'name' => $r->public_name ?: $r->name,
                'description' => $r->public_description ?: $r->description,
                'image_url' => $store->show_images ? StorefrontPresenter::mediaUrl($r->listing_image ?: $r->image_path) : null,
                'price' => $price['online_price'],
                'unit' => $r->base_unit ?: $r->unit,
                'option_label' => $r->option_label,
            ];
        };
        $cols = ['sp.is_featured', 'p.category_id', 'sp.id as listing_id', 'sp.public_name', 'sp.public_description', 'sp.override_price', 'sp.allow_below_cost', 'sp.product_id',
            'sp.offline_reserve_qty', 'sp.online_stock_limit',
            'sp.image_path as listing_image', 'sp.option_group', 'sp.option_label', 'p.id', 'p.tenant_id', 'p.name', 'p.description', 'p.image_path', 'p.price', 'p.cost_price', 'p.tax_rate', 'p.price_includes_tax',
            'p.base_unit', 'p.unit', 'p.is_active', 'p.type', 'p.has_variants', 'p.is_weighted', 'p.track_serial'];
        $groups = collect($rows->items())->pluck('option_group')->filter()->unique()->values()->all();
        $sibRows = $groups ? DB::table('storefront_products as sp')
            ->join('products as p', fn ($j) => $j->on('p.id', '=', 'sp.product_id')->on('p.tenant_id', '=', 'sp.tenant_id'))
            ->where('sp.storefront_id', $store->id)->where('sp.tenant_id', $store->tenant_id)->where('sp.is_published', 1)
            ->whereIn('sp.option_group', $groups)->whereNull('p.deleted_at')
            ->orderBy('sp.option_label')->orderBy('sp.id')->select($cols)->get()->groupBy('option_group') : collect();
        if ($store->warehouse_id) {
            $stockSvc->prime($store->tenant_id, $store->warehouse_id, array_merge(collect($rows->items())->pluck('id')->all(), $sibRows->flatten(1)->pluck('id')->all()));
        }
        $items = collect($rows->items())->map(function ($r) use ($build, $sibRows) {
            $item = $build($r);
            if (! $item || ! $r->option_group) {
                return $item;
            }
            // every published option of this group, each priced and stocked as its own product
            $sibs = ($sibRows[$r->option_group] ?? collect())->map($build)->filter()->map(fn ($o) => [
                    'id' => $o['id'], 'label' => $o['option_label'] ?: $o['name'], 'price' => $o['price'], 'was_price' => $o['was_price'],
                    'stock' => $o['stock'], 'left' => $o['left'], 'image_url' => $o['image_url'],
                ])->values();
            $item['options'] = $sibs->count() > 1 ? $sibs : [];
            if ($sibs->count() > 1) {
                $item['name'] = $r->public_name ?: ($r->option_group ?: $item['name']);
            }
            return $item;
        })->filter()->values();

        $avgRating = StorefrontReview::where('storefront_id', $store->id)->avg('rating');
        $reviewCount = StorefrontReview::where('storefront_id', $store->id)->count();
        $reviewsList = StorefrontReview::where('storefront_id', $store->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'customer_name', 'rating', 'review', 'is_verified_purchaser', 'created_at'])
            ->map(fn ($r) => [
                'id' => $r->id,
                'customer_name' => $r->customer_name,
                'rating' => (int) $r->rating,
                'review' => $r->review,
                'is_verified' => (bool) $r->is_verified_purchaser,
                'created_at' => CommerceOrder::localTime($r->created_at, $store->timezone ?? 'UTC'),
            ])->values();

        $custSession = session('commerce_customer');
        $customerData = null;
        if ($custSession && ! empty($custSession['phone'])) {
            $phone = $custSession['phone'];
            $customerOrders = DB::table('commerce_orders')
                ->where('storefront_id', $store->id)
                ->where('customer_phone', $phone)
                ->orderByDesc('created_at')
                ->limit(20)
                ->get(['id', 'public_number', 'status', 'total', 'currency_symbol', 'created_at', 'fulfilment'])
                ->map(function ($o) use ($store) {
                    $token = \Illuminate\Support\Str::random(48);
                    DB::table('commerce_order_tokens')->insert([
                        'order_id' => $o->id,
                        'token_hash' => hash('sha256', $token),
                        'created_at' => now(),
                    ]);
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

            $myReview = StorefrontReview::where('storefront_id', $store->id)
                ->where('customer_phone', $phone)
                ->first();

            $customerData = [
                'name' => $custSession['name'],
                'phone' => $phone,
                'email' => $custSession['email'] ?? null,
                'orders' => $customerOrders,
                'has_reviewed' => (bool) $myReview,
                'review' => $myReview ? [
                    'rating' => (int) $myReview->rating,
                    'review' => $myReview->review,
                ] : null,
            ];
        }

        return Inertia::render('Commerce/Store', [
            'store' => $preview ? array_merge(StorefrontPresenter::publicStore($store), ['accepting_orders' => false]) : StorefrontPresenter::publicStore($store),
            'preview' => $preview,
            'items' => $items,
            'pagination' => ['current' => $rows->currentPage(), 'last' => $rows->lastPage(), 'total' => $rows->total()],
            'limits' => ['max_qty' => CheckoutService::MAX_QTY],
            'categories' => $categories,
            'filters' => ['q' => $q, 'category' => $cat],
            'show_images' => (bool) $store->show_images,
            'has_coupons' => $promos->live($store)->contains(fn ($p) => $p->code !== null),
            'rating_summary' => [
                'average' => $avgRating ? round((float) $avgRating, 1) : null,
                'count' => $reviewCount,
                'reviews' => $reviewsList,
            ],
            'customer' => $customerData,
        ]);
    }

    public function quote(Request $request, string $slug)
    {
        $store = $this->published($slug);
        $data = $request->validate(['items' => ['required', 'array', 'max:' . CheckoutService::MAX_LINES], 'items.*.item_id' => ['required', 'string', 'max:36'], 'items.*.quantity' => ['required', 'integer', 'min:1', 'max:' . CheckoutService::MAX_QTY], 'fulfilment' => ['nullable', 'in:pickup,delivery'], 'delivery_zone' => ['nullable', 'string', 'max:120'], 'coupon' => ['nullable', 'string', 'max:40']]);
        try {
            $q = $this->checkout->quote($store, $data['items'], $data['fulfilment'] ?? 'pickup', ['zone' => $data['delivery_zone'] ?? null, 'coupon' => $data['coupon'] ?? null]);
        } catch (CommerceException $e) {
            return response()->json(['message' => $e->getMessage(), 'reason' => $e->reason] + $e->payload, $e->httpStatus);
        }
        return response()->json($this->publicQuote($q));
    }

    public function placeOrder(Request $request, string $slug)
    {
        $store = Storefront::where('slug', $slug)->firstOrFail(); // let replays work even if the store was just unpublished
        $data = $request->validate([
            'idempotency_key' => ['required', 'string', 'min:16', 'max:100'],
            'fulfilment' => ['required', 'in:pickup,delivery'],
            'payment_method' => ['required', 'in:cod,pickup,bank'],
            'customer_name' => ['required', 'string', 'max:150'],
            'customer_phone' => ['required', 'string', 'max:40'],
            'customer_email' => ['nullable', 'email', 'max:150'],
            'company_site' => ['nullable', 'string', 'max:5'],   // honeypot: real people never see or fill it
            'opened_at' => ['nullable', 'integer'],               // ms timestamp when the page opened
            'delivery_address' => ['nullable', 'string', 'max:500'],
            'delivery_zone' => ['nullable', 'string', 'max:120'],
            'coupon' => ['nullable', 'string', 'max:40'],
            'customer_note' => ['nullable', 'string', 'max:500'],
            'expected_total' => ['nullable', 'numeric'],
            'items' => ['required', 'array', 'min:1', 'max:' . CheckoutService::MAX_LINES],
            'items.*.item_id' => ['required', 'string', 'max:36'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:' . CheckoutService::MAX_QTY],
        ]);
        // bot check: a filled honeypot or a checkout submitted within 3 seconds of opening is not a person
        if (! empty($data['company_site']) || (! empty($data['opened_at']) && (now()->getTimestampMs() - (int) $data['opened_at']) < 3000 && (now()->getTimestampMs() - (int) $data['opened_at']) >= 0)) {
            return response()->json(['message' => 'Please try again.', 'reason' => 'bot_check'], 422);
        }
        try {
            $r = $this->checkout->place($store, $data);
        } catch (CommerceException $e) {
            return response()->json(['message' => $e->getMessage(), 'reason' => $e->reason] + ($e->reason === 'quote_changed' ? ['quote' => $this->publicQuote($e->payload['quote'])] : $e->payload), $e->httpStatus);
        }
        session(['commerce_customer' => [
            'phone' => preg_replace('/[^\d+]/', '', $data['customer_phone']),
            'name' => $data['customer_name'],
            'email' => $data['customer_email'] ?? null,
        ]]);

        return response()->json([
            'order_number' => $r['order']->public_number,
            'status_url' => url('/order-status/' . $r['token']),
            'replayed' => $r['replayed'],
        ], $r['replayed'] ? 200 : 201);
    }

    public function status(Request $request, string $token)
    {
        $order = $this->orderByToken($token);
        $store = Storefront::find($order->storefront_id);

        $publicEvents = $order->events()->whereIn('type', ['placed', 'status_changed', 'completed', 'expired', 'confirmed', 'rejected', 'cancelled', 'transfer_reported', 'payment_collected'])
            ->get(['type', 'to_status', 'created_at'])->map(fn ($e) => ['type' => $e->type, 'to' => $e->to_status, 'at' => CommerceOrder::localTime($e->created_at, $order->storefront?->timezone ?? 'UTC')]);

        $resp = Inertia::render('Commerce/OrderStatus', [
            'order' => [
                'number' => $order->public_number, 'status' => $order->status, 'payment_status' => $order->payment_status,
                'payment_method' => $order->payment_method, 'fulfilment' => $order->fulfilment, 'customer_name' => $order->customer_name,
                'delivery_address' => $order->delivery_address, 'reason' => in_array($order->status, ['rejected', 'cancelled', 'expired'], true) ? $order->reason : null,
                'subtotal' => $order->subtotal, 'tax_total' => $order->tax_total, 'delivery_fee' => $order->delivery_fee, 'total' => $order->total,
                'currency_symbol' => $order->currency_symbol, 'placed_at' => CommerceOrder::localTime($order->created_at, $order->storefront?->timezone ?? 'UTC'),
                'bank_reference' => $order->bank_reference, 'delivery_zone' => $order->delivery_zone,
                'bank_receipt_url' => $order->bank_receipt_path ? \Illuminate\Support\Facades\Storage::disk('public')->url($order->bank_receipt_path) : null,
                'discount_total' => $order->discount_total, 'promo_name' => $order->promo_name, 'promo_code' => $order->promo_code,
                'items' => $order->items()->get(['title', 'quantity', 'online_price', 'line_total'])->map(fn ($i) => $i->only(['title', 'quantity', 'online_price', 'line_total'])),
            ],
            'events' => $publicEvents,
            'store' => ['name' => $store->display_name, 'phone' => $store->phone, 'address' => $store->address_line, 'slug' => $store->slug,
                'bank_instructions' => ($order->payment_method === 'bank' && $order->payment_status !== 'collected') ? $store->bank_instructions : null],
            'history' => $order->purged_at ? [] : DB::table('commerce_orders')->where('storefront_id', $order->storefront_id)->where('customer_phone', $order->customer_phone)
                ->where('id', '!=', $order->id)->orderByDesc('created_at')->limit(8)->get(['public_number', 'status', 'total', 'currency_symbol', 'created_at'])
                ->map(fn ($h) => ['number' => $h->public_number, 'status' => $h->status, 'total' => (float) $h->total, 'symbol' => $h->currency_symbol, 'at' => CommerceOrder::localTime($h->created_at, $order->storefront?->timezone ?? 'UTC')])->values(),
            'transfer_url' => url('/order-status/' . $token . '/transfer'),
            'cancel_url' => in_array($order->status, ['pending', 'confirmed'], true) && $order->payment_status === 'unpaid' ? url('/order-status/' . $token . '/cancel') : null,
            'revision_url' => url('/order-status/' . $token . '/revision'),
            'revision' => $order->revision_status ? ['status' => $order->revision_status, 'note' => $order->revision_note, 'summary' => $order->revision['summary'] ?? [], 'previous_total' => $order->revision['previous_total'] ?? null, 'total' => $order->revision['total'] ?? null] : null,
            'reorder_url' => $store->status === 'published' ? url('/order-status/' . $token . '/reorder') : null,
            'prep_minutes' => $store->prep_minutes,
            'rating_summary' => [
                'average' => ($avg = StorefrontReview::where('storefront_id', $store->id)->avg('rating')) ? round((float) $avg, 1) : null,
                'count' => StorefrontReview::where('storefront_id', $store->id)->count(),
                'reviews' => StorefrontReview::where('storefront_id', $store->id)->orderByDesc('created_at')->limit(10)->get()
                    ->map(fn ($r) => ['id' => $r->id, 'customer_name' => $r->customer_name, 'rating' => (int) $r->rating, 'review' => $r->review, 'is_verified' => (bool) $r->is_verified_purchaser, 'created_at' => CommerceOrder::localTime($r->created_at, $store->timezone ?? 'UTC')])->values(),
            ],
            'customer' => [
                'name' => $order->customer_name,
                'phone' => $order->customer_phone,
                'orders' => [],
            ],
        ])->toResponse($request);

        // private, never indexed, never cached, never leaks the token via Referer
        $resp->headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        $resp->headers->set('Cache-Control', 'no-store, private');
        $resp->headers->set('Referrer-Policy', 'no-referrer');
        return $resp;
    }

    public function answerRevision(Request $request, string $token)
    {
        $order = $this->orderByToken($token);
        $v = $request->validate(['answer' => ['required', 'in:accept,decline']]);
        try {
            app(\App\Services\Commerce\OrderRevisions::class)->respond($order, $v['answer'] === 'accept');
        } catch (CommerceException $e) {
            return redirect('/order-status/' . $token)->withErrors(['revision' => $e->getMessage()]);
        }
        return redirect('/order-status/' . $token)->with('success', $v['answer'] === 'accept' ? 'Thanks. Your order has been updated and the business will confirm it.' : 'You declined the changes. The business will get in touch.');
    }

    public function reportTransfer(Request $request, string $token)
    {
        $order = $this->orderByToken($token);
        $v = $request->validate([
            'reference' => ['required', 'string', 'min:3', 'max:120'],
            'receipt' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ]);

        $receiptPath = $request->file('receipt')->store('commerce/receipts', 'public');

        try {
            $this->orders->reportTransfer($order->id, $order->tenant_id, $v['reference'], $receiptPath);
        } catch (CommerceException $e) {
            return redirect('/order-status/' . $token)->withErrors(['reference' => $e->getMessage()]);
        }
        return redirect('/order-status/' . $token)->with('success', 'Thanks. Receipt uploaded successfully. The business will verify your transfer.');
    }

    public function cancel(Request $request, string $token)
    {
        $order = $this->orderByToken($token);
        try {
            $this->orders->customerCancel($order->id, $order->tenant_id);
        } catch (CommerceException $e) {
            return redirect('/order-status/' . $token)->withErrors(['cancel' => $e->getMessage()]);
        }
        return redirect('/order-status/' . $token)->with('success', 'Your order has been cancelled.');
    }

    public function lookupForm()
    {
        return Inertia::render('Commerce/OrderLookup');
    }

    /** Lost link: order number + the phone used at checkout adds a fresh link. Same answer whether or not it matched. */
    public function lookup(Request $request)
    {
        $v = $request->validate(['number' => ['required', 'string', 'max:30'], 'phone' => ['required', 'string', 'max:40']]);
        $phone = preg_replace('/[^\d+]/', '', $v['phone']);
        $order = CommerceOrder::where('public_number', strtoupper(trim($v['number'])))->where('customer_phone', $phone)->first();
        if (! $order) {
            return back()->withErrors(['number' => 'We could not find an order with that number and phone.']);
        }
        $token = \Illuminate\Support\Str::random(48);
        DB::table('commerce_order_tokens')->insert(['order_id' => $order->id, 'token_hash' => hash('sha256', $token), 'created_at' => now()]);
        return redirect('/order-status/' . $token);
    }

    private function orderByToken(string $token): CommerceOrder
    {
        abort_unless(preg_match('/^[A-Za-z0-9]{48}$/', $token) === 1, 404);
        $hash = hash('sha256', $token);
        $id = DB::table('commerce_order_tokens')->where('token_hash', $hash)->value('order_id');
        return $id ? CommerceOrder::findOrFail($id) : CommerceOrder::where('status_token_hash', $hash)->firstOrFail();
    }

    private function publicQuote(array $q): array
    {
        return [
            'items' => collect($q['items'])->map(fn ($i) => ['item_id' => $i['item_id'], 'title' => $i['title'], 'quantity' => $i['quantity'], 'price' => $i['online_price'], 'line_total' => $i['line_total']])->values(),
            'subtotal' => $q['subtotal'], 'tax_total' => $q['tax_total'], 'delivery_fee' => $q['delivery_fee'], 'total' => $q['total'],
            'currency_symbol' => $q['currency_symbol'],
            'discount_total' => $q['discount_total'], 'promo_name' => $q['promo_name'], 'promo_code' => $q['promo_code'],
            'delivery_zone' => $q['delivery_zone'], 'zone_required' => $q['zone_required'], 'min_order' => $q['min_order'],
        ];
    }

    /** Secure reorder: the status token proves ownership. Returns only live listings; the cart then reprices via /quote. */
    public function reorder(Request $request, string $token)
    {
        $order = $this->orderByToken($token);
        $store = Storefront::find($order->storefront_id);
        abort_unless($store && $store->status === 'published', 404);
        $lines = DB::table('commerce_order_items as i')
            ->join('storefront_products as sp', fn ($j) => $j->on('sp.product_id', '=', 'i.product_id')->where('sp.storefront_id', $store->id)->where('sp.is_published', 1))
            ->where('i.order_id', $order->id)
            ->get(['sp.id as item_id', 'i.quantity', 'i.title'])
            ->map(fn ($l) => ['item_id' => $l->item_id, 'quantity' => (int) max(1, min(CheckoutService::MAX_QTY, $l->quantity)), 'title' => $l->title]);
        $resp = response()->json(['slug' => $store->slug, 'lines' => $lines, 'skipped' => max(0, $order->items()->count() - $lines->count())]);
        $resp->headers->set('Cache-Control', 'no-store, private');
        return $resp;
    }

    public function customerLogin(Request $request, string $slug)
    {
        $store = Storefront::where('slug', $slug)->firstOrFail();
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:40'],
            'name' => ['required', 'string', 'max:150'],
            'email' => ['nullable', 'email', 'max:150'],
        ]);
        $phone = preg_replace('/[^\d+]/', '', $data['phone']);
        session(['commerce_customer' => [
            'phone' => $phone,
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
        ]]);

        $customerOrders = DB::table('commerce_orders')
            ->where('storefront_id', $store->id)
            ->where('customer_phone', $phone)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get(['id', 'public_number', 'status', 'total', 'currency_symbol', 'created_at', 'fulfilment'])
            ->map(function ($o) use ($store) {
                $token = \Illuminate\Support\Str::random(48);
                DB::table('commerce_order_tokens')->insert([
                    'order_id' => $o->id,
                    'token_hash' => hash('sha256', $token),
                    'created_at' => now(),
                ]);
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

        $myReview = StorefrontReview::where('storefront_id', $store->id)
            ->where('customer_phone', $phone)
            ->first();

        return response()->json([
            'success' => true,
            'customer' => [
                'name' => $data['name'],
                'phone' => $phone,
                'email' => $data['email'] ?? null,
                'orders' => $customerOrders,
                'has_reviewed' => (bool) $myReview,
                'review' => $myReview ? [
                    'rating' => (int) $myReview->rating,
                    'review' => $myReview->review,
                ] : null,
            ]
        ]);
    }

    public function customerLogout(Request $request, string $slug)
    {
        session()->forget('commerce_customer');
        return response()->json(['success' => true]);
    }

    public function submitRating(Request $request, string $slug)
    {
        $store = Storefront::where('slug', $slug)->firstOrFail();
        $custSession = session('commerce_customer');
        $phone = $custSession['phone'] ?? preg_replace('/[^\d+]/', '', (string) $request->input('phone', ''));
        $name = $custSession['name'] ?? trim((string) $request->input('name', ''));
        $email = $custSession['email'] ?? $request->input('email');

        if (empty($phone) || empty($name)) {
            return response()->json([
                'message' => 'Please sign in with your customer name and phone to rate this store.',
            ], 401);
        }

        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'review' => ['nullable', 'string', 'max:1000'],
        ]);

        $isVerified = DB::table('commerce_orders')
            ->where('storefront_id', $store->id)
            ->where('customer_phone', $phone)
            ->exists();

        $review = StorefrontReview::updateOrCreate(
            [
                'storefront_id' => $store->id,
                'customer_phone' => $phone,
            ],
            [
                'tenant_id' => $store->tenant_id,
                'customer_name' => $name,
                'customer_email' => $email,
                'rating' => $data['rating'],
                'review' => $data['review'] ?? null,
                'is_verified_purchaser' => $isVerified,
            ]
        );

        session(['commerce_customer' => [
            'phone' => $phone,
            'name' => $name,
            'email' => $email,
        ]]);

        $avgRating = StorefrontReview::where('storefront_id', $store->id)->avg('rating');
        $reviewCount = StorefrontReview::where('storefront_id', $store->id)->count();
        $reviewsList = StorefrontReview::where('storefront_id', $store->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'customer_name', 'rating', 'review', 'is_verified_purchaser', 'created_at'])
            ->map(fn ($r) => [
                'id' => $r->id,
                'customer_name' => $r->customer_name,
                'rating' => (int) $r->rating,
                'review' => $r->review,
                'is_verified' => (bool) $r->is_verified_purchaser,
                'created_at' => CommerceOrder::localTime($r->created_at, $store->timezone ?? 'UTC'),
            ])->values();

        return response()->json([
            'success' => true,
            'message' => 'Thank you! Your rating has been submitted.',
            'rating_summary' => [
                'average' => $avgRating ? round((float) $avgRating, 1) : null,
                'count' => $reviewCount,
                'reviews' => $reviewsList,
            ],
            'my_review' => [
                'rating' => (int) $review->rating,
                'review' => $review->review,
                'is_verified' => (bool) $review->is_verified_purchaser,
            ],
        ]);
    }

    public function customerOrders(Request $request, string $slug)
    {
        $store = Storefront::where('slug', $slug)->firstOrFail();
        $custSession = session('commerce_customer');
        if (! $custSession || empty($custSession['phone'])) {
            return response()->json(['orders' => []]);
        }
        $orders = DB::table('commerce_orders')
            ->where('storefront_id', $store->id)
            ->where('customer_phone', $custSession['phone'])
            ->orderByDesc('created_at')
            ->limit(20)
            ->get(['id', 'public_number', 'status', 'total', 'currency_symbol', 'created_at', 'fulfilment'])
            ->map(function ($o) use ($store) {
                $token = \Illuminate\Support\Str::random(48);
                DB::table('commerce_order_tokens')->insert([
                    'order_id' => $o->id,
                    'token_hash' => hash('sha256', $token),
                    'created_at' => now(),
                ]);
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

        return response()->json(['orders' => $orders]);
    }
}
