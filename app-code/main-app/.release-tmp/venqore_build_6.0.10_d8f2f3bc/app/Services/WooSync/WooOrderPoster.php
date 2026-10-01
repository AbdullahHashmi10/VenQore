<?php

namespace App\Services\WooSync;

use App\Models\Party;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * WOO-001 (2026-09-10): the single place a WooCommerce ORDER becomes stock
 * movement + a balanced double-entry journal. Used by BOTH webhook receivers:
 *   - POST /woocommerce/webhook/{uuid}   (WooCommerceController, legacy plugin)
 *   - POST /api/woo/webhook/{uuid}       (WooSync → ProcessWebhookJob → SyncEngine)
 * The WooSync path previously dropped order.* topics entirely, so online orders
 * reached neither stock nor the ledger.
 *
 * Rules:
 *   - Idempotent: one journal per Woo order ("WC-{id}"). Woo retries webhooks;
 *     a repeat delivery is acknowledged and changes nothing.
 *   - Unpaid / cancelled states are not posted (pending, failed, cancelled,
 *     refunded, trash, checkout-draft).
 *   - Money comes from the ORDER (line totals after discounts, shipping, tax),
 *     not from VenQore's list price. Tax goes to 2100 Sales Tax Payable.
 *   - COGS comes from real FIFO batch deductions (sale_item_batches).
 *   - Debit side: 1205 Marketplace Clearing once the tenant has gone live on
 *     clearing, else 1000 Cash (unchanged legacy behaviour).
 */
class WooOrderPoster
{
    public const SKIP_STATUSES = ['pending', 'failed', 'cancelled', 'refunded', 'trash', 'checkout-draft', 'draft'];

    public function __construct(
        private readonly \App\Services\V3\FifoService $fifo,
        private readonly \App\Engines\AccountingService $accounting,
    ) {}

    /**
     * @return array{status:string, total?:float, message?:string}
     */
    public function post(Tenant $tenant, array $payload): array
    {
        $orderId = $payload['id'] ?? null;
        if (!$orderId || empty($payload['line_items']) || !is_array($payload['line_items'])) {
            return ['status' => 'ignored', 'message' => 'No line items found'];
        }

        $status = strtolower((string) ($payload['status'] ?? ''));
        if ($status !== '' && in_array($status, self::SKIP_STATUSES, true)) {
            return ['status' => 'ignored', 'message' => "Order status '{$status}' is not posted"];
        }

        $reference = 'WC-' . $orderId;

        return Cache::lock("woo-order:{$tenant->id}:{$orderId}", 30)->block(10, function () use ($tenant, $payload, $reference) {
            if ($this->alreadyPosted($tenant, $reference)) {
                return ['status' => 'duplicate', 'message' => 'Order already recorded'];
            }

            $party = Party::withoutGlobalScopes()->firstOrCreate(
                ['tenant_id' => $tenant->id, 'name' => 'Web Customer'],
                ['type' => 'customer']
            );

            $warehouse = \App\Models\Warehouse::where('tenant_id', $tenant->id)
                ->orderByDesc('is_default')->orderBy('created_at')->first();

            $lines = [];
            foreach ($payload['line_items'] as $item) {
                $sku = $item['sku'] ?? null;
                $qty = (float) ($item['quantity'] ?? 0);
                if (!$sku || $qty <= 0) {
                    continue;
                }
                $product = Product::withoutGlobalScopes()->where('tenant_id', $tenant->id)->where('sku', $sku)->first();
                if (!$product) {
                    Log::warning('[WooOrderPoster] SKU not found', ['tenant_id' => $tenant->id, 'sku' => $sku]);
                    continue;
                }
                $lineTotal = isset($item['total']) && is_numeric($item['total'])
                    ? (float) $item['total']
                    : (float) $product->price * $qty;
                $lines[] = ['product' => $product, 'qty' => $qty, 'total' => $lineTotal];
            }

            if (empty($lines)) {
                return ['status' => 'ignored', 'message' => 'No matching products processed'];
            }

            return DB::transaction(function () use ($tenant, $payload, $reference, $party, $warehouse, $lines) {
                $revenue = 0.0;
                $cogs = 0.0;
                foreach ($lines as $l) {
                    $revenue += $l['total'];
                    if ($warehouse && $l['product']->type !== 'service') {
                        foreach ($this->fifo->deductStock($l['product']->id, $warehouse->id, $l['qty']) as $d) {
                            $cogs += (float) $d['total_cost'];
                        }
                    }
                }

                $shipping = is_numeric($payload['shipping_total'] ?? null) ? (float) $payload['shipping_total'] : 0.0;
                $tax      = is_numeric($payload['total_tax'] ?? null) ? (float) $payload['total_tax'] : 0.0;
                $revenue  = round($revenue + $shipping, 2);
                $tax      = round(max(0.0, $tax), 2);
                $cogs     = round($cogs, 2);
                $received = round($revenue + $tax, 2);

                $clearingLive = $tenant->clearing_go_live_at !== null && now()->gte($tenant->clearing_go_live_at);
                $debitAccount = $clearingLive
                    ? \App\Services\VenSynQ\MarketplaceSettlementService::ACCT_CLEARING
                    : '1000';

                $journal = [
                    ['account_code' => $debitAccount, 'debit' => $received, 'credit' => 0, 'party_id' => $party->id],
                    ['account_code' => '4000', 'debit' => 0, 'credit' => $revenue],
                ];
                if ($tax > 0) {
                    $journal[] = ['account_code' => '2100', 'debit' => 0, 'credit' => $tax];
                }
                if ($cogs > 0) {
                    $journal[] = ['account_code' => '5000', 'debit' => $cogs, 'credit' => 0];
                    $journal[] = ['account_code' => '1100', 'debit' => 0, 'credit' => $cogs];
                }

                $this->accounting->createEntry([
                    'date'            => now()->toDateString(),
                    'reference_type'  => 'sale',
                    'reference'       => $reference,
                    'description'     => 'WooCommerce order ' . $reference,
                    'party_id'        => $party->id,
                    'idempotency_key' => 'woo-order-' . $tenant->id . '-' . substr($reference, 3),
                ], $journal);

                return ['status' => 'posted', 'total' => $received];
            });
        });
    }

    private function alreadyPosted(Tenant $tenant, string $reference): bool
    {
        return DB::table('journal_entries')
            ->where('tenant_id', $tenant->id)
            ->where('reference_type', 'sale')
            ->where('reference', $reference)
            ->exists();
    }
}
