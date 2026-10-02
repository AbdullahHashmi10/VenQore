<?php

namespace Tests\Feature\InvoiceAssistant;

use Illuminate\Support\Facades\DB;

/**
 * The model never supplies an id. Customers and products are resolved by the
 * backend, inside the current store only, and anything uncertain becomes a
 * question — never a guess.
 */
class EntityResolutionTest extends InvoiceAssistantTestCase
{
    private function reasons($response): array
    {
        return array_column($response->json('unresolved') ?? [], 'reason');
    }

    public function test_exact_customer_and_sku_resolve_to_a_ready_draft(): void
    {
        $this->fakeModel($this->intent());

        $r = $this->createDraft()->assertStatus(201);
        $r->assertJsonPath('status', 'ready_for_review')
            ->assertJsonPath('can_handoff', true)
            ->assertJsonPath('customer.id', $this->customerId)
            ->assertJsonPath('lines.0.sku', 'ABC-101');
        $this->assertSame([], $r->json('unresolved'));
        $this->assertEquals(100.0, (float) $r->json('lines.0.unit_price'));
        $this->assertEquals(3.0, (float) $r->json('lines.0.quantity'));
    }

    public function test_price_comes_from_the_catalogue_not_from_the_model(): void
    {
        // The model has no way to set a price except an explicit, stated override.
        $this->fakeModel($this->intent());
        $r = $this->createDraft()->assertStatus(201);
        $this->assertEquals(100.0, (float) $r->json('lines.0.unit_price'));
        $this->assertSame('store_policy', $r->json('lines.0.price_source'));
    }

    public function test_two_customers_with_the_same_name_are_a_question_not_a_guess(): void
    {
        $this->party($this->tenant, 'Ali Traders', 'customer', '03009999999');
        $this->fakeModel($this->intent());

        $r = $this->createDraft()->assertStatus(201);
        $r->assertJsonPath('can_handoff', false);
        $this->assertContains('ambiguous_customer', $this->reasons($r));
        $q = collect($r->json('unresolved'))->firstWhere('field', 'customer');
        $this->assertCount(2, $q['candidates']);
        $this->assertNotEmpty($q['candidate_set_id']);
        $this->assertNull($r->json('customer'), 'no customer may be attached while it is ambiguous');
    }

    public function test_another_stores_customer_is_never_found_or_suggested(): void
    {
        $this->party($this->other, 'Zed Corporation', 'customer');
        $this->fakeModel($this->intent(['customer_reference' => ['name' => 'Zed Corporation', 'code' => null]]));

        $r = $this->createDraft()->assertStatus(201);
        $this->assertContains('customer_not_found', $this->reasons($r));
        $this->assertStringNotContainsString('Zed', json_encode($r->json()));
    }

    public function test_another_stores_product_is_never_found_or_suggested(): void
    {
        $this->product($this->other, 'OTHER-1', 'Foreign Widget', 5, 1, 10);
        $i = $this->intent();
        $i['lines'][0]['sku'] = 'OTHER-1';
        $this->fakeModel($i);

        $r = $this->createDraft()->assertStatus(201);
        $this->assertContains('product_not_found', $this->reasons($r));
        $this->assertStringNotContainsString('Foreign Widget', json_encode($r->json()));
        $this->assertFalse($r->json('can_handoff'));
    }

    public function test_a_near_miss_sku_typed_in_text_is_not_silently_corrected(): void
    {
        $i = $this->intent();
        $i['lines'][0]['sku'] = 'abc101';
        $this->fakeModel($i);

        $r = $this->createDraft()->assertStatus(201);
        $this->assertFalse($r->json('can_handoff'));
        $this->assertSame([], $r->json('lines'), 'no line may be resolved from a near-miss SKU');
    }

    public function test_a_missing_quantity_is_asked_for_and_never_defaulted(): void
    {
        $i = $this->intent();
        $i['lines'][0]['quantity'] = null;
        $this->fakeModel($i);

        $r = $this->createDraft()->assertStatus(201);
        $this->assertContains('quantity_missing', $this->reasons($r));
        $this->assertSame([], $r->json('lines'));
        $this->assertFalse($r->json('can_handoff'));
    }

    public function test_no_lines_is_a_question(): void
    {
        $this->fakeModel($this->intent(['lines' => []]));
        $r = $this->createDraft()->assertStatus(201);
        $this->assertContains('no_lines', $this->reasons($r));
    }

    public function test_a_stated_price_override_is_flagged_and_a_stated_discount_is_flagged(): void
    {
        $i = $this->intent();
        $i['lines'][0]['requested_unit_price'] = '90';
        $i['lines'][0]['discount_percent'] = '10';
        $this->fakeModel($i);

        $r = $this->createDraft()->assertStatus(201);
        $codes = array_column($r->json('warnings'), 'code');
        $this->assertContains('price_override', $codes);
        $this->assertContains('discount_requested', $codes);
        $this->assertEquals(90.0, (float) $r->json('lines.0.unit_price'));
        $this->assertSame('requested_override', $r->json('lines.0.price_source'));
    }

    public function test_insufficient_stock_is_a_warning_and_never_hides_the_line(): void
    {
        $i = $this->intent();
        $i['lines'][0]['quantity'] = '500';
        $this->fakeModel($i);

        $r = $this->createDraft()->assertStatus(201);
        $this->assertContains('insufficient_stock', array_column($r->json('warnings'), 'code'));
        $this->assertCount(1, $r->json('lines'));
    }

    public function test_a_payment_method_alone_never_means_money_was_received(): void
    {
        $this->fakeModel($this->intent(['payment' => ['method' => 'cash', 'amount_paid' => null]]));

        $r = $this->createDraft()->assertStatus(201);
        $r->assertJsonPath('payment.method', 'cash')->assertJsonPath('payment.amount_source', 'default_zero');
        $this->assertEquals(0.0, (float) $r->json('payment.amount_paid'));
        $this->assertContains('cash_without_amount', array_column($r->json('warnings'), 'code'));
    }

    public function test_a_stated_payment_is_kept_and_disclosed(): void
    {
        $this->fakeModel($this->intent(['payment' => ['method' => 'cash', 'amount_paid' => '250']]));

        $r = $this->createDraft()->assertStatus(201);
        $r->assertJsonPath('payment.amount_source', 'explicit');
        $this->assertEquals(250.0, (float) $r->json('payment.amount_paid'));
        $this->assertContains('payment_stated', array_column($r->json('warnings'), 'code'));
    }

    public function test_choosing_a_candidate_resolves_it_without_calling_the_model_again(): void
    {
        $second = $this->party($this->tenant, 'Ali Traders', 'customer', '03009999999');
        $this->fakeModel($this->intent(), 1);   // exactly ONE model call for the whole conversation

        $created = $this->createDraft()->assertStatus(201);
        $q = collect($created->json('unresolved'))->firstWhere('field', 'customer');

        $r = $this->postJson($this->url('drafts/' . $created->json('draft_id') . '/messages'), [
            'expected_revision' => $created->json('revision'),
            'selections'        => [['field' => 'customer', 'candidate_set_id' => $q['candidate_set_id'], 'selected_id' => $second]],
            'request_id'        => $this->reqId(),
        ])->assertOk();

        $r->assertJsonPath('customer.id', $second)->assertJsonPath('can_handoff', true);
        $this->assertSame($created->json('revision') + 1, $r->json('revision'));
    }

    public function test_a_forged_candidate_id_is_rejected_and_changes_nothing(): void
    {
        $this->party($this->tenant, 'Ali Traders', 'customer', '03009999999');
        $foreign = $this->party($this->other, 'Ali Traders', 'customer');
        $this->fakeModel($this->intent());

        $created = $this->createDraft()->assertStatus(201);
        $q = collect($created->json('unresolved'))->firstWhere('field', 'customer');

        $res = $this->postJson($this->url('drafts/' . $created->json('draft_id') . '/messages'), [
            'expected_revision' => $created->json('revision'),
            'selections'        => [['field' => 'customer', 'candidate_set_id' => $q['candidate_set_id'], 'selected_id' => $foreign]],
            'request_id'        => $this->reqId(),
        ]);
        $this->assertGreaterThanOrEqual(400, $res->status());

        $fresh = $this->getJson($this->url('drafts/' . $created->json('draft_id')))->assertOk();
        $this->assertNull($fresh->json('customer'));
        $this->assertSame($created->json('revision'), $fresh->json('revision'));
    }

    public function test_a_forged_candidate_set_id_is_rejected(): void
    {
        $this->party($this->tenant, 'Ali Traders', 'customer', '03009999999');
        $this->fakeModel($this->intent());

        $created = $this->createDraft()->assertStatus(201);
        $q = collect($created->json('unresolved'))->firstWhere('field', 'customer');

        $res = $this->postJson($this->url('drafts/' . $created->json('draft_id') . '/messages'), [
            'expected_revision' => $created->json('revision'),
            'selections'        => [['field' => 'customer', 'candidate_set_id' => 'cs_forged', 'selected_id' => $q['candidates'][0]['id']]],
            'request_id'        => $this->reqId(),
        ]);
        $this->assertGreaterThanOrEqual(400, $res->status());
    }

    public function test_the_response_never_contains_cost_or_other_stores_ids(): void
    {
        $this->fakeModel($this->intent());
        $json = json_encode($this->createDraft()->assertStatus(201)->json());

        $this->assertStringNotContainsString('cost_price', $json);
        $this->assertStringNotContainsString('"cost"', $json);
        $this->assertStringNotContainsString('tenant_id', $json);
    }

    public function test_resolution_writes_nothing_outside_the_draft_table(): void
    {
        $before = [DB::table('parties')->count(), DB::table('products')->count()];
        $this->fakeModel($this->intent(['customer_reference' => ['name' => 'Brand New Customer', 'code' => null]]));
        $this->createDraft()->assertStatus(201);

        $this->assertSame($before, [DB::table('parties')->count(), DB::table('products')->count()], 'the assistant must never create customers or products');
    }
}
