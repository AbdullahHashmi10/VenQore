<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Services\Commerce\CommerceException;
use App\Services\Commerce\DeliveryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Rider's phone page, opened from a private link (no login). The link maps to ONE rider of ONE store;
 * every query below is scoped to that pair, so a rider can only ever see and move their own deliveries.
 */
class RiderPortalController extends Controller
{
    public function __construct(private DeliveryService $deliveries)
    {
    }

    private function who(string $token): object
    {
        $l = $this->deliveries->resolveLink($token);
        abort_unless($l, 404);
        return $l;
    }

    public function show(string $token)
    {
        return $this->page($this->who($token), url('/rider/' . $token . '/step'));
    }

    /** Signed-in rider (store member linked to a rider employee). */
    public function mine(Request $r)
    {
        $l = $this->mineLink($r);
        return $this->page($l, route('store.commerce.my-rides.step', ['store_slug' => app('current.tenant')->slug]));
    }

    public function mineStep(Request $r)
    {
        return $this->apply($r, $this->mineLink($r));
    }

    private function mineLink(Request $r): object
    {
        $l = $this->deliveries->accountFor((int) app('current.tenant')->id, (int) $r->user()->id);
        abort_unless($l, 403, 'This login is not linked to a rider.');
        return $l;
    }

    private function page(object $l, string $stepUrl)
    {
        $emp = DB::table('employees')->where('id', $l->employee_id)->where('tenant_id', $l->tenant_id)->first(['name']);
        $tz = (string) (DB::table('storefronts')->where('tenant_id', $l->tenant_id)->value('timezone') ?: 'UTC');
        $dayStart = now($tz)->startOfDay()->utc();
        $rows = DB::table('commerce_deliveries as d')->join('commerce_orders as o', 'o.id', '=', 'd.order_id')
            ->where('d.tenant_id', $l->tenant_id)->where('d.rider_id', $l->employee_id)
            ->where(function ($q) {
                $q->whereIn('d.status', ['assigned', 'accepted', 'collected', 'out_for_delivery', 'failed'])
                  ->orWhere(function ($w) {
                      $w->where('d.status', 'delivered')->where('d.delivered_at', '>=', $dayStart);
                  });
            })
            ->orderByRaw("case d.status when 'out_for_delivery' then 0 when 'collected' then 1 when 'accepted' then 2 when 'assigned' then 3 else 4 end")
            ->orderBy('d.assigned_at')->limit(60)
            ->get(['d.id', 'd.status', 'd.assigned_at', 'd.delivered_at', 'd.cash_expected', 'd.cash_collected', 'd.cash_acknowledged_at', 'd.fail_reason', 'd.rider_fee',
                'o.public_number', 'o.total', 'o.customer_name', 'o.customer_phone', 'o.delivery_address', 'o.customer_note', 'o.currency_symbol']);

        $done = $rows->where('status', 'delivered');
        return Inertia::render('Commerce/RiderDeliveries', [
            'rider' => ['name' => $emp->name ?? 'Rider'],
            'deliveries' => $rows->map(fn ($d) => (array) $d + [
                'assigned_at_local' => $d->assigned_at ? \Carbon\Carbon::parse($d->assigned_at, 'UTC')->setTimezone($tz)->format('g:i A') : null,
                'delivered_at_local' => $d->delivered_at ? \Carbon\Carbon::parse($d->delivered_at, 'UTC')->setTimezone($tz)->format('g:i A') : null,
            ])->values(),
            'today' => [
                'delivered' => $done->count(),
                'earned' => (float) $done->sum('rider_fee'),
                'cash_to_collect' => (float) $rows->whereIn('status', ['assigned', 'accepted', 'collected', 'out_for_delivery'])->sum('cash_expected'),
                'cash_to_hand_in' => $this->deliveries->outstandingCash((int) $l->tenant_id, $l->employee_id),
            ],
            'stepUrl' => $stepUrl,
        ])->withViewData(['noindex' => true]);
    }

    public function step(Request $r, string $token)
    {
        return $this->apply($r, $this->who($token));
    }

    private function apply(Request $r, object $l)
    {
        $v = $r->validate([
            'delivery_id' => ['required', 'string', 'max:36'],
            'to' => ['required', 'in:accepted,collected,out_for_delivery,delivered,failed'],
            'cash_collected' => ['nullable', 'numeric', 'min:0', 'max:100000000'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);
        try {
            $this->deliveries->riderStep($v['delivery_id'], (int) $l->tenant_id, $l->employee_id, $v['to'], isset($v['cash_collected']) ? (float) $v['cash_collected'] : null, $v['reason'] ?? null);
        } catch (CommerceException $e) {
            return back()->withErrors(['delivery' => $e->getMessage()]);
        }
        return back();
    }
}
