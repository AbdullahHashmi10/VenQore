<?php

namespace Tests\Feature\InvoiceAssistant;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * The assistant never posts. A draft opened in the editor is saved through the
 * SAME endpoint, validation, approval rules and ledger as any other invoice;
 * the only trace of the assistant is a provenance link written afterwards.
 */
class PostingParityTest extends InvoiceAssistantTestCase
{
    private function drive(): array
    {
        $this->fakeModel($this->intent());
        $d = $this->createDraft()->assertStatus(201)->json();
        $base = fn (string $s = '') => $this->url('drafts/' . $d['draft_id'] . $s);
        $this->postJson($base('/handoff'), ['expected_revision' => $d['revision'], 'request_id' => $this->reqId()])->assertOk();
        $claim = $this->postJson($base('/claim'))->assertOk()->json();
        $this->postJson($base('/applied'), ['claim_token' => $claim['claim_token']])->assertOk();

        return ['draft_id' => $d['draft_id'], 'prefill' => $claim['prefill']];
    }

    /** What the editor would send for the claimed prefill. */
    private function savePayload(array $prefill, array $extra = []): array
    {
        $warehouse = (string) DB::table('warehouses')->where('tenant_id', $this->tenant->id)->value('id');
        $item = $prefill['items'][0];

        return array_merge([
            'customer_id'     => $this->customerId,
            'warehouse_id'    => $warehouse,
            'payment_method'  => $prefill['payment_method'],
            'discount'        => 0,
            'source'          => 'manual',
            'date'            => $prefill['date'],
            'idempotency_key' => 'idem-' . Str::random(12),
            'items'           => [[
                'product_id' => $this->product->id, 'quantity' => $item['quantity'], 'price' => $item['price'], 'discount' => 0,
            ]],
        ], $extra);
    }

    private function save(array $payload)
    {
        return $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->postJson($this->storeUrl($this->tenant, 'sales'), $payload);
    }

    public function test_the_whole_assistant_flow_writes_nothing_to_stock_or_the_ledger(): void
    {
        $sales = $this->salesCount($this->tenant);
        $journal = $this->journalCount($this->tenant);
        $stock = $this->stockTotal($this->product);
        $batches = DB::table('inventory_batches')->where('tenant_id', $this->tenant->id)->count();
        $parties = DB::table('parties')->where('tenant_id', $this->tenant->id)->count();

        $this->drive();

        $this->assertSame($sales, $this->salesCount($this->tenant));
        $this->assertSame($journal, $this->journalCount($this->tenant));
        $this->assertSame($stock, $this->stockTotal($this->product));
        $this->assertSame($batches, DB::table('inventory_batches')->where('tenant_id', $this->tenant->id)->count());
        $this->assertSame($parties, DB::table('parties')->where('tenant_id', $this->tenant->id)->count());
    }

    public function test_saving_an_assistant_draft_links_it_to_the_sale_and_posts_normally(): void
    {
        $x = $this->drive();

        $res = $this->save($this->savePayload($x['prefill'], ['assistant_draft_id' => $x['draft_id']]));
        $res->assertOk()->assertJsonPath('success', true);
        $saleId = (string) $res->json('sale_id');

        $this->assertSame(1, $this->salesCount($this->tenant));
        $this->assertGreaterThan(0, $this->journalCount($this->tenant), 'a normal save posts its ledger entries');

        $row = DB::table('invoice_assistant_drafts')->where('id', $x['draft_id'])->first();
        $this->assertSame($saleId, (string) $row->sale_id);
        $this->assertSame('posted', $row->outcome);
    }

    public function test_a_save_without_the_assistant_is_unchanged_and_links_nothing(): void
    {
        $x = $this->drive();
        $this->save($this->savePayload($x['prefill']))->assertOk();

        $this->assertNull(DB::table('invoice_assistant_drafts')->where('id', $x['draft_id'])->value('sale_id'));
    }

    public function test_the_client_cannot_make_a_sale_look_like_it_came_from_the_assistant(): void
    {
        $x = $this->drive();
        $res = $this->save($this->savePayload($x['prefill'], ['source' => 'invoice_assistant']));

        // `source` is never trusted for provenance; only a verified, applied draft id links.
        $this->assertContains($res->status(), [200, 422]);
        $this->assertNull(DB::table('invoice_assistant_drafts')->where('id', $x['draft_id'])->value('sale_id'));
    }

    public function test_a_draft_that_was_never_applied_is_not_linked(): void
    {
        $this->fakeModel($this->intent());
        $d = $this->createDraft()->assertStatus(201)->json();
        $prefill = ['items' => [['quantity' => 3, 'price' => 100]], 'payment_method' => 'credit', 'date' => now()->toDateString()];

        $this->save($this->savePayload($prefill, ['assistant_draft_id' => $d['draft_id']]))->assertOk();
        $this->assertNull(DB::table('invoice_assistant_drafts')->where('id', $d['draft_id'])->value('sale_id'));
    }

    public function test_another_users_or_stores_draft_id_never_links_and_never_breaks_the_save(): void
    {
        $x = $this->drive();
        $foreignDraft = (string) Str::uuid();
        DB::table('invoice_assistant_drafts')->insert([
            'id' => $foreignDraft, 'tenant_id' => $this->other->id, 'user_id' => $this->owner->id, 'schema_version' => 1, 'revision' => 1,
            'status' => 'handed_off', 'input_mode' => 'text', 'applied_at' => now(), 'expires_at' => now()->addHour(),
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->save($this->savePayload($x['prefill'], ['assistant_draft_id' => $foreignDraft]))->assertOk();
        $this->assertNull(DB::table('invoice_assistant_drafts')->where('id', $foreignDraft)->value('sale_id'));
    }

    public function test_a_malformed_draft_id_is_ignored_and_the_sale_still_posts(): void
    {
        $x = $this->drive();
        $this->save($this->savePayload($x['prefill'], ['assistant_draft_id' => "'; DROP TABLE sales; --"]))->assertOk();
        $this->assertSame(1, $this->salesCount($this->tenant));
    }

    public function test_a_draft_links_to_only_one_sale_and_a_retried_save_does_not_duplicate(): void
    {
        $x = $this->drive();
        $payload = $this->savePayload($x['prefill'], ['assistant_draft_id' => $x['draft_id']]);

        $first = $this->save($payload)->assertOk();
        $this->save($payload);   // same idempotency key: a replay
        $this->assertSame(1, $this->salesCount($this->tenant));

        $second = $this->save($this->savePayload($x['prefill'], ['assistant_draft_id' => $x['draft_id']]));
        $this->assertSame((string) $first->json('sale_id'), (string) DB::table('invoice_assistant_drafts')->where('id', $x['draft_id'])->value('sale_id'),
            'the first sale stays the linked one');
        $this->assertContains($second->status(), [200, 422, 409]);
    }

    public function test_the_assistant_flow_cannot_bypass_a_save_validation_failure(): void
    {
        $x = $this->drive();
        $payload = $this->savePayload($x['prefill'], ['assistant_draft_id' => $x['draft_id']]);
        $payload['items'][0]['quantity'] = -5;

        $res = $this->save($payload);
        $this->assertGreaterThanOrEqual(400, $res->status());
        $this->assertSame(0, $this->salesCount($this->tenant));
        $this->assertNull(DB::table('invoice_assistant_drafts')->where('id', $x['draft_id'])->value('sale_id'));
    }
}
