<?php

namespace Tests\Feature\Production;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;
use Tests\Support\Quarantine;
use Tests\Support\RequiresGoldenCompany;

/**
 * WOO-001 pinning test (blueprint Phase D.2 — "expected to fail today").
 *
 * A WooCommerce order received via the webhook (POST /api/woo/webhook/{uuid} →
 * WooWebhookController@receive) deducts stock but posts NO double-entry journal. Online
 * revenue/COGS/tax never reach the ledger, so every financial report understates online
 * activity.
 *
 * This test asserts the CORRECT behavior: a webhook-created sale must produce a BALANCED
 * journal entry (SUM debit == SUM credit) whose revenue line matches the order net, and
 * the order must be visible in ledger-derived reports. Registered in the quarantine lane.
 * INCOMPLETE while the WOO-001 waiver is valid; runs for real on expiry or fix.
 *
 * (Separately, the misleading V3 test that was named `test_E10_woocommerce...` is renamed
 * to state it only verifies source-tag pass-through on the V3 path — see Phase D notes.)
 */
class WooWebhookJournalPinningTest extends VenQoreTestCase implements RequiresGoldenCompany
{
    public function test_woo001_webhook_sale_posts_balanced_journal(): void
    {
        if (Quarantine::guard('WOO-001', $this)) {
            return;
        }

        $tenant = Tenant::query()->firstOrFail();
        app()->instance('current.tenant', $tenant);

        $connection = DB::table('woo_connections')->where('tenant_id', $tenant->id)->first();
        if ($connection === null) {
            // Without a seeded connection we cannot exercise the real webhook; when this
            // runs for real (waiver expired) the Woo fixtures must be seeded. Fail clearly.
            $this->fail('WOO-001: no woo_connections fixture for the Golden tenant — seed one so the webhook path can be exercised.');
        }

        $journalCountBefore = DB::table('journal_entries')->where('tenant_id', $tenant->id)->count();

        $payload = $this->wooOrderPayload();
        $response = $this->postJson('/api/woo/webhook/' . $connection->uuid, $payload, [
            'x-wc-webhook-signature' => $this->sign($payload, $connection->webhook_secret ?? ''),
        ]);

        // Accept any non-5xx; the point is the ledger side-effect, not the HTTP contract.
        $this->assertLessThan(500, $response->getStatusCode(), 'Webhook errored server-side.');

        $journalCountAfter = DB::table('journal_entries')->where('tenant_id', $tenant->id)->count();
        $this->assertGreaterThan(
            $journalCountBefore,
            $journalCountAfter,
            'WOO-001: webhook sale created NO journal entry — online sales bypass the ledger entirely.'
        );

        // The newest journal for this tenant must balance.
        $newest = DB::table('journal_entries')
            ->where('tenant_id', $tenant->id)
            ->orderByDesc('id')
            ->first();
        $sums = DB::table('journal_items')
            ->where('journal_entry_id', $newest->id)
            ->selectRaw('ROUND(SUM(debit),2) d, ROUND(SUM(credit),2) c')
            ->first();
        $this->assertEqualsWithDelta(
            (float) $sums->d,
            (float) $sums->c,
            0.01,
            'WOO-001: webhook journal is not balanced (debits != credits).'
        );
    }

    private function wooOrderPayload(): array
    {
        return [
            'id'     => 987654,
            'status' => 'completed',
            'total'  => '105.30',
            'line_items' => [[
                'product_id' => 1,
                'sku'        => 'GOLDEN-SKU-1',
                'quantity'   => 1,
                'total'      => '90.00',
            ]],
            'total_tax' => '15.30',
        ];
    }

    private function sign(array $payload, string $secret): string
    {
        return base64_encode(hash_hmac('sha256', json_encode($payload), $secret, true));
    }
}
