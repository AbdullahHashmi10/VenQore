<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\CommerceOrder;
use App\Services\Commerce\CommerceException;
use App\Services\Commerce\DeliveryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/** Manager dispatch for online-store deliveries. Every query is tenant-scoped explicitly. */
class DeliveryController extends Controller
{
    public function __construct(private DeliveryService $deliveries)
    {
    }

    private function tid(): int
    {
        return (int) app('current.tenant')->id;
    }

    private function url(string $name, array $extra = []): string
    {
        return route('store.commerce.' . $name, array_merge(['store_slug' => app('current.tenant')->slug], $extra));
    }

    public function index(Request $r)
    {
        $tid = $this->tid();
        $tz = (string) (DB::table('storefronts')->where('tenant_id', $tid)->value('timezone') ?: 'UTC');

        $hasProfile = \Illuminate\Support\Facades\Schema::hasColumn('employees', 'rider_photo_path');
        $riders = DB::table('employees')->where('tenant_id', $tid)->where('is_rider', 1)->where('status', 'active')->orderBy('name')
            ->get($hasProfile ? ['id', 'name', 'rider_photo_path', 'rider_phone', 'rider_vehicle'] : ['id', 'name']);
        $active = DB::table('commerce_deliveries')->where('tenant_id', $tid)->whereIn('status', ['assigned', 'accepted', 'collected', 'out_for_delivery'])
            ->selectRaw('rider_id, count(*) as n')->groupBy('rider_id')->pluck('n', 'rider_id');

        $accounts = DB::table('commerce_rider_accounts as a')->join('users as u', 'u.id', '=', 'a.user_id')
            ->where('a.tenant_id', $tid)->get(['a.employee_id', 'u.name', 'u.email'])->keyBy('employee_id');
        $members = DB::table('tenant_users as tu')->join('users as u', 'u.id', '=', 'tu.user_id')
            ->where('tu.tenant_id', $tid)->where('tu.status', 'active')->whereNotIn('tu.role', ['owner', 'admin', 'franchise_admin'])
            ->where(function ($q) {
                $q->whereNull('tu.membership_type')->orWhere('tu.membership_type', '!=', 'pos');
            })
            ->orderBy('u.name')->get(['u.id', 'u.name', 'u.email', 'tu.role']);

        $riderRows = $riders->map(fn ($x) => [
            'login' => isset($accounts[$x->id]) ? ['name' => $accounts[$x->id]->name, 'email' => $accounts[$x->id]->email] : null,
            'account_url' => $this->url('riders.account', ['employee' => $x->id]),
            'id' => $x->id, 'name' => $x->name, 'active' => (int) ($active[$x->id] ?? 0),
            'cash_outstanding' => $this->deliveries->outstandingCash($tid, $x->id),
            'link_url' => $this->url('riders.link', ['employee' => $x->id]),
            'photo_url' => ($x->rider_photo_path ?? null) ? \App\Services\Commerce\StorefrontPresenter::mediaUrl($x->rider_photo_path) : null,
            'phone' => $x->rider_phone ?? null, 'vehicle' => $x->rider_vehicle ?? null,
            'profile_url' => $this->url('riders.profile', ['employee' => $x->id]),
        ])->values();

        $rows = DB::table('commerce_orders as o')
            ->leftJoin('commerce_deliveries as d', 'd.order_id', '=', 'o.id')
            ->leftJoin('employees as e', 'e.id', '=', 'd.rider_id')
            ->where('o.tenant_id', $tid)->where('o.fulfilment', 'delivery')
            ->where(function ($q) {
                $q->whereIn('o.status', ['confirmed', 'preparing', 'ready', 'out_for_delivery'])
                  ->orWhere(function ($w) {
                      $w->where('o.status', 'completed')->where('o.completed_at', '>=', now('UTC')->subDay());
                  })
                  ->orWhereIn('d.status', ['failed']);
            })
            ->orderByDesc('o.created_at')->limit(100)
            ->get(['o.id as order_id', 'o.public_number', 'o.status as order_status', 'o.customer_name', 'o.customer_phone', 'o.delivery_address',
                'o.total', 'o.payment_method', 'o.payment_status', 'o.currency_symbol', 'o.created_at',
                'd.id as delivery_id', 'd.status as delivery_status', 'd.rider_id', 'e.name as rider_name', 'd.cash_expected', 'd.cash_collected',
                'd.cash_acknowledged_at', 'd.fail_reason']);

        return Inertia::render('OnlineStore/Deliveries', [
            'riders' => $riderRows,
            'members' => $members->map(fn ($m) => ['id' => $m->id, 'name' => $m->name, 'email' => $m->email])->values(),
            'orders' => $rows->map(fn ($o) => (array) $o + [
                'created_at_local' => CommerceOrder::localTime($o->created_at, $tz),
                'order_url' => $this->url('orders.show', ['id' => $o->order_id]),
            ])->values(),
            'urls' => [
                'home' => $this->url('home'), 'orders' => $this->url('orders'), 'settings' => $this->url('settings'),
                'products' => $this->url('products'), 'promotions' => $this->url('promotions'), 'alerts' => $this->url('alerts'),
                'assign' => $this->url('deliveries.assign'),
            ],
            'can' => [
                'manage' => $r->user()->hasPermission('online.orders_manage'),
                'cash' => $r->user()->hasPermission('online.orders_collect'),
            ],
            'riderLink' => session('rider_link'),
        ]);
    }

    private function run(callable $fn, string $ok)
    {
        try {
            $fn();
        } catch (CommerceException $e) {
            return back()->withErrors(['delivery' => $e->getMessage()]);
        }
        return back()->with('success', $ok);
    }

    public function assign(Request $r)
    {
        $v = $r->validate(['order_id' => ['required', 'string', 'max:36'], 'rider_id' => ['required', 'string', 'max:36'], 'note' => ['nullable', 'string', 'max:255']]);
        return $this->run(fn () => $this->deliveries->assign($v['order_id'], $this->tid(), $v['rider_id'], $r->user()->id, $v['note'] ?? null), 'Rider assigned.');
    }

    public function returned(Request $r, string $id)
    {
        return $this->run(fn () => $this->deliveries->markReturned($id, $this->tid(), $r->user()->id), 'Marked as returned to the store.');
    }

    public function acknowledgeCash(Request $r, string $id)
    {
        $v = $r->validate(['received' => ['nullable', 'numeric', 'min:0', 'max:100000000']]);
        return $this->run(fn () => $this->deliveries->acknowledgeCash($id, $this->tid(), $r->user()->id, isset($v['received']) ? (float) $v['received'] : null), 'Cash received from rider recorded.');
    }

    public function linkLogin(Request $r, string $employee)
    {
        $v = $r->validate(['user_id' => ['nullable', 'integer']]);
        if (empty($v['user_id'])) {
            $this->deliveries->unlinkAccount($this->tid(), $employee);
            return back()->with('success', 'Rider login removed.');
        }
        return $this->run(fn () => $this->deliveries->linkAccount($this->tid(), $employee, (int) $v['user_id'], $r->user()->id), 'Login linked. The rider signs in as usual and lands on My rides.');
    }

    /** The rider's public card on the customer's order page: optional photo, phone to call, vehicle. */
    public function riderProfile(Request $r, string $employee)
    {
        $tid = $this->tid();
        $e = DB::table('employees')->where('tenant_id', $tid)->where('id', $employee)->where('is_rider', 1)->first();
        abort_unless($e, 404);
        $data = $r->validate([
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
            'remove_photo' => ['boolean'],
            'phone' => ['nullable', 'string', 'max:40'],
            'vehicle' => ['nullable', 'string', 'max:80'],
        ]);
        $up = ['rider_phone' => $data['phone'] ?? null, 'rider_vehicle' => $data['vehicle'] ?? null, 'updated_at' => now()];
        if ($r->hasFile('photo')) {
            $up['rider_photo_path'] = $r->file('photo')->store('commerce/riders', 'public');
        } elseif ($r->boolean('remove_photo')) {
            $up['rider_photo_path'] = null;
        }
        if (array_key_exists('rider_photo_path', $up) && $e->rider_photo_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($e->rider_photo_path);
        }
        DB::table('employees')->where('id', $e->id)->update($up);

        return back()->with('success', 'Rider details saved.');
    }

    public function riderLink(Request $r, string $employee)
    {
        try {
            $token = $this->deliveries->issueRiderLink($this->tid(), $employee, $r->user()->id);
        } catch (CommerceException $e) {
            return back()->withErrors(['delivery' => $e->getMessage()]);
        }
        // Shown once; any older link for this rider stops working.
        return back()->with('rider_link', ['employee' => $employee, 'url' => url('/rider/' . $token)])->with('success', 'New rider link created. Older links no longer work.');
    }
}
