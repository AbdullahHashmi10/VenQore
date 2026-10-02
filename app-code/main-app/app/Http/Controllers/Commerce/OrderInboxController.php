<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\CommerceOrder;
use App\Services\Commerce\CommerceException;
use App\Services\Commerce\OrderService;
use App\Services\Commerce\StockAvailability;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/** Merchant Online Orders inbox. Every query is explicitly tenant-scoped (no reliance on ambient scopes). */
class OrderInboxController extends Controller
{
    private const TABS = [
        'new' => ['pending'],
        'active' => ['confirmed', 'preparing', 'ready', 'out_for_delivery'],
        'completed' => ['completed'],
        'closed' => ['cancelled', 'rejected', 'expired'],
    ];

    public function __construct(private OrderService $orders)
    {
    }

    private function tid(): int
    {
        return (int) app('current.tenant')->id;
    }

    private function tz(): string
    {
        return (string) (DB::table('storefronts')->where('tenant_id', $this->tid())->value('timezone') ?: 'UTC');
    }

    private function url(string $name, array $extra = []): string
    {
        return route('store.commerce.' . $name, array_merge(['store_slug' => app('current.tenant')->slug], $extra));
    }

    public function index(Request $request)
    {
        $tab = array_key_exists($request->query('tab'), self::TABS) ? $request->query('tab') : 'new';
        $tid = $this->tid();

        $counts = [];
        foreach (self::TABS as $k => $statuses) {
            $counts[$k] = DB::table('commerce_orders')->where('tenant_id', $tid)->whereIn('status', $statuses)->count();
        }
        $page = DB::table('commerce_orders')->where('tenant_id', $tid)->whereIn('status', self::TABS[$tab])
            ->orderByDesc('created_at')
            ->paginate(20, ['id', 'public_number', 'status', 'payment_status', 'payment_method', 'fulfilment', 'customer_name', 'customer_phone', 'total', 'currency_symbol', 'created_at', 'accept_by', 'version'])
            ->withQueryString();

        $tz = $this->tz();
        return Inertia::render('OnlineStore/Orders', [
            'tab' => $tab, 'counts' => $counts,
            'orders' => collect($page->items())->map(fn ($o) => ['created_at' => CommerceOrder::localTime($o->created_at, $tz), 'accept_by' => CommerceOrder::localTime($o->accept_by, $tz)] + (array) $o + ['show_url' => $this->url('orders.show', ['id' => $o->id])]),
            'pagination' => ['current' => $page->currentPage(), 'last' => $page->lastPage(), 'total' => $page->total()],
            'urls' => ['home' => $this->url('home'), 'orders' => $this->url('orders'), 'alerts' => $this->url('alerts')],
        ]);
    }

    public function show(string $id)
    {
        $tid = $this->tid();
        $o = CommerceOrder::where('tenant_id', $tid)->where('id', $id)->firstOrFail();
        if ($o->status === 'completed' && $o->payment_status !== 'refunded') {
            $o = app(\App\Services\Commerce\OrderService::class)->syncPaymentFromSale($o->id, $tid) ?? $o;
        }
        $items = $o->items()->get();
        $stock = app(StockAvailability::class);

        $lines = $items->map(function ($it) use ($stock, $o, $tid) {
            return [
                'title' => $it->title, 'sku' => $it->sku, 'quantity' => (float) $it->quantity, 'online_price' => (float) $it->online_price,
                'base_price' => (float) $it->base_price, 'rule' => $it->price_rule, 'rule_percent' => $it->rule_percent !== null ? (float) $it->rule_percent : null,
                'line_total' => (float) $it->line_total,
                'available' => $o->warehouse_id ? round($stock->available($tid, $it->product_id, $o->warehouse_id, $o->id), 2) : null,
            ];
        });

        $sale = $o->sale_id ? DB::table('sales')->where('tenant_id', $tid)->where('id', $o->sale_id)->first(['id', 'reference_number', 'invoice_total', 'payment_status']) : null;
        DB::table('commerce_notifications')->where('tenant_id', $tid)->where('order_id', $o->id)->whereNull('read_at')->update(['read_at' => now()]);

        return Inertia::render('OnlineStore/OrderShow', [
            'order' => [
                'id' => $o->id, 'public_number' => $o->public_number, 'status' => $o->status, 'payment_status' => $o->payment_status,
                'payment_method' => $o->payment_method, 'fulfilment' => $o->fulfilment, 'customer_name' => $o->customer_name,
                'customer_phone' => $o->customer_phone, 'delivery_address' => $o->delivery_address, 'customer_note' => $o->customer_note,
                'subtotal' => $o->subtotal, 'tax_total' => $o->tax_total, 'delivery_fee' => $o->delivery_fee, 'total' => $o->total,
                'currency_symbol' => $o->currency_symbol, 'bank_reference' => $o->bank_reference, 'reason' => $o->reason,
                'version' => $o->version, 'created_at' => CommerceOrder::localTime($o->created_at, $this->tz()),
                'accept_by' => CommerceOrder::localTime($o->accept_by, $this->tz()), 'completed_at' => CommerceOrder::localTime($o->completed_at, $this->tz()),
            ],
            'lines' => $lines,
            'events' => $o->events()->get(['type', 'from_status', 'to_status', 'actor_type', 'note', 'created_at'])->map(fn ($e) => ['type' => $e->type, 'from_status' => $e->from_status, 'to_status' => $e->to_status, 'actor_type' => $e->actor_type, 'note' => $e->note, 'created_at' => CommerceOrder::localTime($e->created_at, $this->tz())]),
            'sale' => $sale ? (array) $sale : null,
            'urls' => [
                'back' => $this->url('orders'),
                'accept' => $this->url('orders.accept', ['id' => $o->id]), 'reject' => $this->url('orders.reject', ['id' => $o->id]),
                'advance' => $this->url('orders.advance', ['id' => $o->id]), 'cancel' => $this->url('orders.cancel', ['id' => $o->id]),
                'collect' => $this->url('orders.collect', ['id' => $o->id]), 'complete' => $this->url('orders.complete', ['id' => $o->id]),
                'sale' => $sale ? url('/s/' . app('current.tenant')->slug . '/sales/' . $sale->id) : null,
                'receive_payment' => ($sale && $o->party_id) ? url('/s/' . app('current.tenant')->slug . '/payments/in?party_id=' . $o->party_id) : null,
            ],
        ]);
    }

    private function run(callable $fn, string $ok)
    {
        try {
            $fn();
        } catch (CommerceException $e) {
            return back()->withErrors(['order' => $e->getMessage()]);
        }
        return back()->with('success', $ok);
    }

    private function version(Request $r): ?int
    {
        return $r->filled('version') ? (int) $r->input('version') : null;
    }

    public function accept(Request $r, string $id)
    {
        return $this->run(fn () => $this->orders->confirm($id, $this->tid(), $r->user()->id, $this->version($r)), 'Order accepted. Stock is held for it.');
    }

    public function reject(Request $r, string $id)
    {
        $v = $r->validate(['reason' => ['required', 'string', 'max:255']]);
        return $this->run(fn () => $this->orders->reject($id, $this->tid(), $r->user()->id, $v['reason'], $this->version($r)), 'Order rejected.');
    }

    public function advance(Request $r, string $id)
    {
        $v = $r->validate(['to' => ['required', 'in:preparing,ready,out_for_delivery']]);
        return $this->run(fn () => $this->orders->advance($id, $this->tid(), $r->user()->id, $v['to'], $this->version($r)), 'Order updated.');
    }

    public function cancel(Request $r, string $id)
    {
        $v = $r->validate(['reason' => ['required', 'string', 'max:255']]);
        return $this->run(fn () => $this->orders->cancel($id, $this->tid(), $r->user()->id, $v['reason'], $this->version($r)), 'Order cancelled. Held stock released.');
    }

    public function collect(Request $r, string $id)
    {
        return $this->run(fn () => $this->orders->markCollected($id, $this->tid(), $r->user()->id, $this->version($r)), 'Payment recorded as collected.');
    }

    public function complete(Request $r, string $id)
    {
        $v = $r->validate(['collect_now' => ['boolean'], 'approve_below_cost' => ['boolean']]);
        // Recording that money was received needs the finance permission, not just permission to complete.
        abort_if(! empty($v['collect_now']) && ! $r->user()->hasPermission('finance.receive_payment'), 403, 'You do not have permission to record payments.');
        return $this->run(fn () => $this->orders->complete($id, $this->tid(), $r->user()->id, (bool) ($v['collect_now'] ?? false), $this->version($r), (bool) ($v['approve_below_cost'] ?? false)), 'Order completed and sale posted.');
    }

    /** In-app alert poll (JSON). */
    public function alerts(Request $r)
    {
        $tid = $this->tid();
        if ($r->isMethod('post')) {
            DB::table('commerce_notifications')->where('tenant_id', $tid)->whereNull('read_at')->update(['read_at' => now()]);
            return response()->json(['unread' => 0]);
        }
        $latest = DB::table('commerce_notifications')->where('tenant_id', $tid)->whereNull('read_at')->orderByDesc('id')->limit(5)->get(['id', 'order_id', 'title', 'created_at']);
        return response()->json([
            'unread' => DB::table('commerce_notifications')->where('tenant_id', $tid)->whereNull('read_at')->count(),
            'latest' => $latest->map(fn ($n) => ['id' => $n->id, 'title' => $n->title, 'url' => $this->url('orders.show', ['id' => $n->order_id]), 'at' => $n->created_at]),
        ]);
    }
}
