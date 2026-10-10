<?php

namespace App\Services\Commerce;

use App\Models\Commerce\CommerceOrder;
use App\Models\Commerce\Storefront;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Partial fulfilment and substitutions, with the customer's consent.
 *
 * While an order is PENDING the business may propose: lower a quantity, remove a line, or substitute a
 * different published item. Nothing changes until the customer accepts on their status page; the order
 * cannot be accepted by the business while a proposal is waiting. Kept lines keep the price the customer
 * saw; a substitute is priced at today's online price. Accepting rewrites the lines and totals atomically,
 * declining leaves the order untouched (the business can then reject it).
 */
class OrderRevisions
{
    public function __construct(private OrderService $orders, private CheckoutService $checkout, private OnlinePricing $pricing, private StockAvailability $stock)
    {
    }

    /**
     * @param array<int, array{item: string, action: string, quantity?: int|float, listing_id?: string}> $changes item = commerce_order_items.id
     */
    public function propose(string $orderId, int $tenantId, ?int $actor, array $changes, ?string $note, ?int $expectedVersion = null): CommerceOrder
    {
        return DB::transaction(function () use ($orderId, $tenantId, $actor, $changes, $note, $expectedVersion) {
            $o = CommerceOrder::where('id', $orderId)->where('tenant_id', $tenantId)->lockForUpdate()->first();
            if (! $o) {
                throw new CommerceException('Order not found.', 'not_found', [], 404);
            }
            if ($expectedVersion !== null && $expectedVersion !== (int) $o->version) {
                throw new CommerceException('This order was changed by someone else. Reload and try again.', 'stale', [], 409);
            }
            if ($o->status !== 'pending') {
                throw new CommerceException('Changes can only be proposed before the order is accepted.', 'bad_state', [], 409);
            }
            if ($o->revision_status === 'proposed') {
                throw new CommerceException('A change is already waiting for the customer.', 'bad_state', [], 409);
            }
            $store = Storefront::where('id', $o->storefront_id)->where('tenant_id', $tenantId)->firstOrFail();
            $items = $o->items()->get()->keyBy('id');
            $by = collect($changes)->keyBy('item');
            foreach ($by->keys() as $k) {
                if (! $items->has($k)) {
                    throw new CommerceException('That order line does not exist.', 'bad_change');
                }
            }

            $lines = [];
            $summary = [];
            foreach ($items as $id => $it) {
                $c = $by->get($id);
                $orig = (float) $it->quantity;
                if (! $c) {
                    $lines[] = $this->fromItem($it, $orig);
                    continue;
                }
                $action = $c['action'] ?? '';
                if ($action === 'remove') {
                    $summary[] = ['type' => 'removed', 'title' => $it->title, 'from' => $orig, 'to' => 0];
                } elseif ($action === 'qty') {
                    $q = (float) ($c['quantity'] ?? 0);
                    if ($q <= 0 || $q >= $orig) {
                        throw new CommerceException('Pick a smaller quantity than ordered, or remove the line.', 'bad_change');
                    }
                    $lines[] = $this->fromItem($it, $q);
                    $summary[] = ['type' => 'reduced', 'title' => $it->title, 'from' => $orig, 'to' => $q];
                } elseif ($action === 'substitute') {
                    $q = (int) ($c['quantity'] ?? $orig);
                    if ($q < 1) {
                        throw new CommerceException('Substitute quantity must be at least 1.', 'bad_change');
                    }
                    $row = DB::table('storefront_products')->where('storefront_id', $store->id)->where('tenant_id', $tenantId)->where('is_published', 1)->where('id', (string) ($c['listing_id'] ?? ''))->first();
                    if (! $row || $row->product_id === $it->product_id) {
                        throw new CommerceException('Choose a different published item as the substitute.', 'bad_change');
                    }
                    try {
                        $quoted = $this->checkout->quote($store, [['item_id' => $row->id, 'quantity' => $q]], $o->fulfilment)['items'][0];
                    } catch (CommerceException $e) {
                        throw new CommerceException('That substitute is not available online right now.', 'bad_change');
                    }
                    if ($o->warehouse_id && ! $this->stock->sellsWithoutStock($tenantId, (string) $quoted['product_id']) && $this->stock->available($tenantId, $quoted['product_id'], $o->warehouse_id) + 0.00001 < $q) {
                        throw new CommerceException($quoted['title'] . ' does not have enough stock to substitute.', 'insufficient_stock');
                    }
                    $lines[] = [
                        'product_id' => $quoted['product_id'], 'title' => $quoted['title'], 'sku' => $quoted['sku'], 'uom' => $quoted['uom'], 'quantity' => $q,
                        'base_price' => $quoted['base_price'], 'price_rule' => $quoted['rule'], 'rule_percent' => $quoted['rule_percent'],
                        'online_price' => $quoted['online_price'], 'list_price' => $quoted['list_price'] ?? $quoted['online_price'], 'discount_percent' => $quoted['discount_percent'] ?? 0,
                        'net_unit_price' => $quoted['net_unit_price'], 'tax_rate' => $quoted['tax_rate'], 'price_includes_tax' => (bool) $quoted['price_includes_tax'],
                        'line_net' => $quoted['line_net'], 'tax_amount' => $quoted['tax_amount'], 'line_total' => $quoted['line_total'],
                    ];
                    $summary[] = ['type' => 'substituted', 'title' => $it->title, 'from' => $orig, 'to' => $q, 'with' => $quoted['title']];
                } else {
                    throw new CommerceException('Unknown change.', 'bad_change');
                }
            }
            if (! $summary) {
                throw new CommerceException('Nothing to change.', 'bad_change');
            }
            if (! $lines) {
                throw new CommerceException('That removes every item. Reject the order instead.', 'bad_change');
            }

            $minor = fn ($v) => \App\Support\Money::toMinor(\Brick\Math\BigDecimal::of(number_format((float) $v, 6, '.', '')));
            $subtotalMinor = array_sum(array_map(fn ($l) => $minor($l['line_net']), $lines));
            $taxMinor = array_sum(array_map(fn ($l) => $minor($l['tax_amount']), $lines));
            $subtotal = \App\Support\Money::toFloat($subtotalMinor);
            $tax = \App\Support\Money::toFloat($taxMinor);
            $discount = round(array_sum(array_map(fn ($l) => ($l['list_price'] - $l['online_price']) * $l['quantity'], $lines)), 2);
            $revision = [
                'lines' => $lines, 'summary' => $summary,
                'subtotal' => $subtotal, 'tax_total' => $tax, 'discount_total' => max(0, $discount),
                'total' => \App\Support\Money::toFloat($subtotalMinor + $taxMinor + $minor($o->delivery_fee)), 'previous_total' => (float) $o->total,
            ];
            $o->forceFill(['revision_status' => 'proposed', 'revision_note' => $note ? mb_substr($note, 0, 255) : null, 'revision' => $revision, 'revision_at' => now(), 'accept_by' => now('UTC')->addMinutes(max(60, (int) (DB::table('storefronts')->where('id', $o->storefront_id)->value('accept_deadline_minutes') ?: 30)))->format('Y-m-d H:i:s'), 'version' => $o->version + 1])->save();
            $this->orders->event($o, 'revision_proposed', 'pending', 'pending', 'staff', $actor, $note, ['summary' => $summary]);
            return $o->fresh(['items']);
        });
    }

    /** Customer answer (reached with the secret status token). */
    public function respond(CommerceOrder $order, bool $accept): CommerceOrder
    {
        return DB::transaction(function () use ($order, $accept) {
            $o = CommerceOrder::where('id', $order->id)->where('tenant_id', $order->tenant_id)->lockForUpdate()->first();
            if ($o->status !== 'pending' || $o->revision_status !== 'proposed') {
                throw new CommerceException('There is no change waiting for your answer.', 'bad_state', [], 409);
            }
            if ($o->accept_by && $o->accept_by->isPast()) {
                throw new CommerceException('This order is no longer open.', 'expired', [], 409);
            }
            $rev = $o->revision;
            if ($accept) {
                DB::table('commerce_order_items')->where('order_id', $o->id)->delete();
                foreach ($rev['lines'] as $l) {
                    $o->items()->create($l + ['tenant_id' => $o->tenant_id]);
                }
                $o->forceFill([
                    'subtotal' => $rev['subtotal'], 'tax_total' => $rev['tax_total'], 'discount_total' => $rev['discount_total'], 'total' => $rev['total'],
                    'revision_status' => 'accepted', 'version' => $o->version + 1,
                ])->save();
            } else {
                $o->forceFill(['revision_status' => 'declined', 'version' => $o->version + 1])->save();
            }
            $this->orders->event($o, $accept ? 'revision_accepted' : 'revision_declined', 'pending', 'pending', 'guest', null, $accept ? 'Customer accepted the changes' : 'Customer declined the changes');
            DB::table('commerce_notifications')->insert([
                'tenant_id' => $o->tenant_id, 'order_id' => $o->id, 'type' => $accept ? 'revision_accepted' : 'revision_declined',
                'title' => ($accept ? 'Customer accepted the changes to ' : 'Customer declined the changes to ') . $o->public_number,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            return $o->fresh(['items']);
        });
    }

    private function fromItem(object $it, float $qty): array
    {
        $line = $this->pricing->line([
            'net_unit_price' => (float) $it->net_unit_price, 'tax_rate' => (float) $it->tax_rate,
        ], $qty);
        return [
            'product_id' => $it->product_id, 'title' => $it->title, 'sku' => $it->sku, 'uom' => $it->uom, 'quantity' => $qty,
            'base_price' => (float) $it->base_price, 'price_rule' => $it->price_rule, 'rule_percent' => $it->rule_percent !== null ? (float) $it->rule_percent : null,
            'online_price' => (float) $it->online_price, 'list_price' => (float) ($it->list_price ?? $it->online_price), 'discount_percent' => (float) ($it->discount_percent ?? 0),
            'net_unit_price' => (float) $it->net_unit_price, 'tax_rate' => (float) $it->tax_rate, 'price_includes_tax' => (bool) $it->price_includes_tax,
            'mods' => $it->mods ?? null, 'notes' => $it->notes ?? null,
        ] + $line;
    }
}
