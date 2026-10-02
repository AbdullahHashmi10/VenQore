<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\CommerceOrder;
use App\Models\Commerce\Storefront;
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
        $store = $this->published($slug);
        $rows = DB::table('storefront_products as sp')
            ->join('products as p', function ($j) {
                $j->on('p.id', '=', 'sp.product_id')->on('p.tenant_id', '=', 'sp.tenant_id');
            })
            ->where('sp.storefront_id', $store->id)->where('sp.tenant_id', $store->tenant_id)->where('sp.is_published', 1)
            ->whereNull('p.deleted_at')
            ->orderBy('sp.sort_order')->orderBy('p.name')->orderBy('sp.id')
            ->select(['sp.id as listing_id', 'sp.public_name', 'sp.public_description', 'sp.override_price', 'sp.allow_below_cost', 'sp.product_id',
                'p.id', 'p.tenant_id', 'p.name', 'p.description', 'p.image_path', 'p.price', 'p.cost_price', 'p.tax_rate', 'p.price_includes_tax',
                'p.base_unit', 'p.unit', 'p.is_active', 'p.type', 'p.has_variants', 'p.is_weighted', 'p.track_serial'])
            ->paginate(24)->withQueryString();

        $pricing = app(OnlinePricing::class);
        $items = collect($rows->items())->map(function ($r) use ($pricing, $store) {
            if (ProductReadiness::reason($r) !== null) {
                return null;
            }
            $price = $pricing->resolve($r, $r, $store);
            if ($price['below_cost'] && ! $r->allow_below_cost) {
                return null;
            }
            return [
                'id' => $r->listing_id,
                'name' => $r->public_name ?: $r->name,
                'description' => $r->public_description ?: $r->description,
                'image_url' => StorefrontPresenter::mediaUrl($r->image_path),
                'price' => $price['online_price'],
                'unit' => $r->base_unit ?: $r->unit,
            ];
        })->filter()->values();

        return Inertia::render('Commerce/Store', [
            'store' => StorefrontPresenter::publicStore($store),
            'items' => $items,
            'pagination' => ['current' => $rows->currentPage(), 'last' => $rows->lastPage(), 'total' => $rows->total()],
            'limits' => ['max_qty' => CheckoutService::MAX_QTY],
        ]);
    }

    public function quote(Request $request, string $slug)
    {
        $store = $this->published($slug);
        $data = $request->validate(['items' => ['required', 'array', 'max:' . CheckoutService::MAX_LINES], 'items.*.item_id' => ['required', 'string', 'max:36'], 'items.*.quantity' => ['required', 'integer', 'min:1', 'max:' . CheckoutService::MAX_QTY], 'fulfilment' => ['nullable', 'in:pickup,delivery']]);
        try {
            $q = $this->checkout->quote($store, $data['items'], $data['fulfilment'] ?? 'pickup');
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
            'delivery_address' => ['nullable', 'string', 'max:500'],
            'customer_note' => ['nullable', 'string', 'max:500'],
            'expected_total' => ['nullable', 'numeric'],
            'items' => ['required', 'array', 'min:1', 'max:' . CheckoutService::MAX_LINES],
            'items.*.item_id' => ['required', 'string', 'max:36'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:' . CheckoutService::MAX_QTY],
        ]);
        try {
            $r = $this->checkout->place($store, $data);
        } catch (CommerceException $e) {
            return response()->json(['message' => $e->getMessage(), 'reason' => $e->reason] + ($e->reason === 'quote_changed' ? ['quote' => $this->publicQuote($e->payload['quote'])] : $e->payload), $e->httpStatus);
        }
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
                'bank_reference' => $order->bank_reference,
                'items' => $order->items()->get(['title', 'quantity', 'online_price', 'line_total'])->map(fn ($i) => $i->only(['title', 'quantity', 'online_price', 'line_total'])),
            ],
            'events' => $publicEvents,
            'store' => ['name' => $store->display_name, 'phone' => $store->phone, 'address' => $store->address_line, 'slug' => $store->slug,
                'bank_instructions' => ($order->payment_method === 'bank' && $order->payment_status !== 'collected') ? $store->bank_instructions : null],
            'transfer_url' => url('/order-status/' . $token . '/transfer'),
        ])->toResponse($request);

        // private, never indexed, never cached, never leaks the token via Referer
        $resp->headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        $resp->headers->set('Cache-Control', 'no-store, private');
        $resp->headers->set('Referrer-Policy', 'no-referrer');
        return $resp;
    }

    public function reportTransfer(Request $request, string $token)
    {
        $order = $this->orderByToken($token);
        $v = $request->validate(['reference' => ['required', 'string', 'min:3', 'max:120']]);
        try {
            $this->orders->reportTransfer($order->id, $order->tenant_id, $v['reference']);
        } catch (CommerceException $e) {
            return back()->withErrors(['reference' => $e->getMessage()]);
        }
        return back()->with('success', 'Thanks. The business will verify your transfer.');
    }

    private function orderByToken(string $token): CommerceOrder
    {
        abort_unless(preg_match('/^[A-Za-z0-9]{48}$/', $token) === 1, 404);
        return CommerceOrder::where('status_token_hash', hash('sha256', $token))->firstOrFail();
    }

    private function publicQuote(array $q): array
    {
        return [
            'items' => collect($q['items'])->map(fn ($i) => ['item_id' => $i['item_id'], 'title' => $i['title'], 'quantity' => $i['quantity'], 'price' => $i['online_price'], 'line_total' => $i['line_total']])->values(),
            'subtotal' => $q['subtotal'], 'tax_total' => $q['tax_total'], 'delivery_fee' => $q['delivery_fee'], 'total' => $q['total'],
            'currency_symbol' => $q['currency_symbol'],
        ];
    }
}
