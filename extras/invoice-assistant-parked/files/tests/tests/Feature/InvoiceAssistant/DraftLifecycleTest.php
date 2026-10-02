<?php

namespace Tests\Feature\InvoiceAssistant;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

/**
 * The draft state machine, idempotency, revision control and isolation.
 */
class DraftLifecycleTest extends InvoiceAssistantTestCase
{
    private function draftUrl(string $id, string $suffix = ''): string
    {
        return $this->url('drafts/' . $id . $suffix);
    }

    private function ready(): array
    {
        $this->fakeModel($this->intent());

        return $this->createDraft()->assertStatus(201)->json();
    }

    // ── creation ────────────────────────────────────────────────────────────

    public function test_create_returns_the_documented_draft_shape(): void
    {
        $d = $this->ready();
        foreach (['draft_id', 'schema_version', 'revision', 'status', 'input_mode', 'expires_at', 'turns', 'customer', 'lines',
            'lines_pending', 'payment', 'invoice_date', 'unresolved', 'warnings', 'totals_preview', 'can_handoff'] as $key) {
            $this->assertArrayHasKey($key, $d, "missing $key");
        }
        $this->assertSame(1, $d['revision']);
        $this->assertSame('text', $d['input_mode']);
        $this->assertSame(1, $d['turns']);
    }

    public function test_create_stores_the_draft_for_this_store_and_user_only(): void
    {
        $d = $this->ready();
        $row = DB::table('invoice_assistant_drafts')->where('id', $d['draft_id'])->first();
        $this->assertSame((int) $this->tenant->id, (int) $row->tenant_id);
        $this->assertSame((int) $this->owner->id, (int) $row->user_id);
        $this->assertNotNull($row->expires_at);
    }

    public function test_the_same_request_id_returns_the_same_draft_and_calls_the_model_once(): void
    {
        $this->fakeModel($this->intent(), 1);
        $req = $this->reqId();

        $a = $this->createDraft('invoice Ali Traders 3 ABC-101', $req)->assertStatus(201);
        $b = $this->createDraft('invoice Ali Traders 3 ABC-101', $req);
        $this->assertContains($b->status(), [200, 201]);
        $this->assertSame($a->json('draft_id'), $b->json('draft_id'));
        $this->assertSame(1, DB::table('invoice_assistant_drafts')->count());
    }

    public function test_the_same_request_id_with_different_text_is_refused(): void
    {
        $this->fakeModel($this->intent(), 1);
        $req = $this->reqId();

        $this->createDraft('invoice Ali Traders 3 ABC-101', $req)->assertStatus(201);
        $this->createDraft('something completely different', $req)->assertStatus(409)->assertJsonPath('code', 'conflicting_replay');
    }

    public function test_two_different_users_may_reuse_a_request_id(): void
    {
        $this->fakeModel($this->intent());
        $req = $this->reqId();
        $this->createDraft('invoice Ali Traders 3 ABC-101', $req)->assertStatus(201);

        $second = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($second, $this->tenant)
            ->postJson($this->url('drafts'), ['text' => 'invoice Ali Traders 3 ABC-101', 'input_mode' => 'text', 'request_id' => $req])
            ->assertStatus(201);
        $this->assertSame(2, DB::table('invoice_assistant_drafts')->count());
    }

    public function test_input_validation(): void
    {
        $this->fakeModel($this->intent(), 0);
        $auth = $this->actingAsTenantUserModel($this->owner, $this->tenant);

        $auth->postJson($this->url('drafts'), ['input_mode' => 'text', 'request_id' => $this->reqId()])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
        $auth->postJson($this->url('drafts'), ['text' => 'x', 'input_mode' => 'text', 'request_id' => $this->reqId()])->assertStatus(422);
        $auth->postJson($this->url('drafts'), ['text' => str_repeat('a', 4001), 'input_mode' => 'text', 'request_id' => $this->reqId()])
            ->assertStatus(422)->assertJsonStructure(['code', 'message', 'field_errors' => ['text'], 'retryable', 'request_id']);
        $auth->postJson($this->url('drafts'), ['text' => 'invoice please', 'input_mode' => 'fax', 'request_id' => $this->reqId()])->assertStatus(422);
        $auth->postJson($this->url('drafts'), ['text' => 'invoice please', 'input_mode' => 'text', 'request_id' => 'bad id!'])->assertStatus(422);
        $auth->postJson($this->url('drafts'), ['text' => 'invoice please', 'input_mode' => 'text'])->assertStatus(422);
        $this->assertSame(0, DB::table('invoice_assistant_drafts')->count());
    }

    public function test_unsupported_requests_get_a_helpful_422_and_leave_no_active_draft(): void
    {
        $this->fakeModel(['intent' => 'unsupported', 'unsupported_reason' => 'That is a purchase, not a sale.']);
        $this->createDraft('buy 10 widgets from Acme')->assertStatus(422)->assertJsonPath('code', 'unsupported_request');
        $this->assertSame(0, DB::table('invoice_assistant_drafts')->whereIn('status', ['needs_clarification', 'ready_for_review', 'interpreting'])->count());
    }

    public function test_malformed_model_output_is_a_502_and_the_draft_is_marked_failed(): void
    {
        $this->fakeModel($this->intent(['customer_id' => '999']));
        $this->createDraft()->assertStatus(502)->assertJsonPath('code', 'invalid_model_output');
        $row = DB::table('invoice_assistant_drafts')->first();
        $this->assertSame('failed', $row->status);
        $this->assertSame('invalid_model_output', $row->failure_code);
    }

    public function test_provider_failures_are_mapped_to_safe_errors(): void
    {
        $this->fakeModel(null, null, false, 'rate_limited');
        $this->createDraft()->assertStatus(429)->assertJsonPath('code', 'rate_limited');

        $this->fakeModel(null, null, false, 'spend_capped');
        $this->createDraft()->assertStatus(429)->assertJsonPath('code', 'spend_capped');

        $this->fakeModel(null, null, false, 'no_addon');
        $this->createDraft()->assertStatus(402)->assertJsonPath('code', 'ai_not_available');

        $this->fakeModel(null, null, false, 'some_provider_explosion');
        $r = $this->createDraft()->assertStatus(503);
        $r->assertJsonPath('code', 'assistant_unavailable');
        $this->assertStringNotContainsString('explosion', json_encode($r->json()), 'raw provider errors must not reach the browser');
    }

    // ── isolation ───────────────────────────────────────────────────────────

    public function test_a_draft_is_invisible_to_other_stores_and_other_users(): void
    {
        $d = $this->ready();

        $foreign = $this->createTenantUser($this->other, 'owner');
        $this->actingAsTenantUserModel($foreign, $this->other)
            ->getJson($this->url('drafts/' . $d['draft_id'], $this->other))->assertStatus(404)->assertJsonPath('code', 'draft_not_found');

        $coworker = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($coworker, $this->tenant)
            ->getJson($this->draftUrl($d['draft_id']))->assertStatus(404);
        $this->postJson($this->draftUrl($d['draft_id'], '/handoff'), ['expected_revision' => 1, 'request_id' => $this->reqId()])->assertStatus(404);
        $this->deleteJson($this->draftUrl($d['draft_id']))->assertStatus(404);
    }

    public function test_malformed_draft_ids_are_a_404_not_a_500(): void
    {
        $this->actingAsTenantUserModel($this->owner, $this->tenant);
        foreach (['abc', '123', 'not-a-uuid', '%27%20OR%201=1'] as $bad) {
            $this->getJson($this->draftUrl($bad))->assertStatus(404);
        }
    }

    // ── revisions and messages ──────────────────────────────────────────────

    public function test_a_message_with_an_old_revision_gets_409_and_the_current_draft(): void
    {
        $d = $this->ready();
        $res = $this->postJson($this->draftUrl($d['draft_id'], '/messages'), [
            'expected_revision' => 99, 'text' => 'make it 5', 'request_id' => $this->reqId(),
        ]);
        $res->assertStatus(409)->assertJsonPath('code', 'stale_revision')->assertJsonPath('draft.draft_id', $d['draft_id']);
    }

    public function test_a_free_text_edit_calls_the_model_and_advances_the_revision(): void
    {
        $d = $this->ready();
        $edited = $this->intent();
        $edited['lines'][0]['quantity'] = '5';
        $this->fakeModel($edited, 1);

        $res = $this->postJson($this->draftUrl($d['draft_id'], '/messages'), [
            'expected_revision' => $d['revision'], 'text' => 'make it 5', 'request_id' => $this->reqId(),
        ])->assertOk();
        $this->assertEquals(5.0, (float) $res->json('lines.0.quantity'));
        $this->assertSame($d['revision'] + 1, $res->json('revision'));
        $this->assertSame(2, $res->json('turns'));
    }

    public function test_a_message_replay_is_idempotent_and_a_conflicting_replay_is_refused(): void
    {
        $d = $this->ready();
        $edited = $this->intent();
        $edited['lines'][0]['quantity'] = '5';
        $this->fakeModel($edited, 1);
        $req = $this->reqId();
        $body = ['expected_revision' => $d['revision'], 'text' => 'make it 5', 'request_id' => $req];

        $a = $this->postJson($this->draftUrl($d['draft_id'], '/messages'), $body)->assertOk();
        $b = $this->postJson($this->draftUrl($d['draft_id'], '/messages'), $body)->assertOk();
        $this->assertSame($a->json('revision'), $b->json('revision'));

        $this->postJson($this->draftUrl($d['draft_id'], '/messages'), ['text' => 'make it 9'] + $body)
            ->assertStatus(409)->assertJsonPath('code', 'conflicting_replay');
    }

    public function test_text_and_selections_cannot_be_sent_together_and_empty_messages_are_refused(): void
    {
        $d = $this->ready();
        $this->postJson($this->draftUrl($d['draft_id'], '/messages'), [
            'expected_revision' => $d['revision'], 'text' => 'hi there',
            'selections' => [['field' => 'customer', 'candidate_set_id' => 'cs_x', 'selected_id' => '1']], 'request_id' => $this->reqId(),
        ])->assertStatus(422)->assertJsonPath('code', 'one_interaction_only');

        $this->postJson($this->draftUrl($d['draft_id'], '/messages'), [
            'expected_revision' => $d['revision'], 'request_id' => $this->reqId(),
        ])->assertStatus(422)->assertJsonPath('code', 'empty_message');
    }

    public function test_the_turn_limit_is_enforced(): void
    {
        config(['invoice_assistant.max_turns' => 1]);
        $d = $this->ready();
        $this->postJson($this->draftUrl($d['draft_id'], '/messages'), [
            'expected_revision' => $d['revision'], 'text' => 'change something', 'request_id' => $this->reqId(),
        ])->assertStatus(422)->assertJsonPath('code', 'turn_limit');
    }

    // ── expiry and cancel ───────────────────────────────────────────────────

    public function test_an_expired_draft_is_410_and_cannot_be_changed(): void
    {
        $d = $this->ready();
        DB::table('invoice_assistant_drafts')->where('id', $d['draft_id'])->update(['expires_at' => now()->subMinute()]);

        $this->getJson($this->draftUrl($d['draft_id']))->assertStatus(410)->assertJsonPath('code', 'draft_expired');
        $this->postJson($this->draftUrl($d['draft_id'], '/handoff'), ['expected_revision' => $d['revision'], 'request_id' => $this->reqId()])->assertStatus(410);
        $this->assertSame('expired', DB::table('invoice_assistant_drafts')->where('id', $d['draft_id'])->value('status'));
    }

    public function test_cancel_drops_the_content_immediately(): void
    {
        $d = $this->ready();
        $this->deleteJson($this->draftUrl($d['draft_id']))->assertStatus(204);

        $row = DB::table('invoice_assistant_drafts')->where('id', $d['draft_id'])->first();
        $this->assertSame('cancelled', $row->status);
        $this->assertNull($row->intent);
        $this->assertNull($row->resolved);
        $this->assertNull($row->transcript);
    }

    // ── hand-off, claim, acknowledge ────────────────────────────────────────

    public function test_handoff_is_refused_while_questions_remain(): void
    {
        $this->party($this->tenant, 'Ali Traders', 'customer', '03009999999');
        $this->fakeModel($this->intent());
        $d = $this->createDraft()->assertStatus(201)->json();

        $this->postJson($this->draftUrl($d['draft_id'], '/handoff'), ['expected_revision' => $d['revision'], 'request_id' => $this->reqId()])
            ->assertStatus(409)->assertJsonPath('code', 'invalid_state');
    }

    public function test_handoff_succeeds_once_and_replays_safely(): void
    {
        $d = $this->ready();
        $req = $this->reqId();
        $body = ['expected_revision' => $d['revision'], 'request_id' => $req];

        $a = $this->postJson($this->draftUrl($d['draft_id'], '/handoff'), $body)->assertOk();
        $this->assertStringContainsString('assistant_draft=' . $d['draft_id'], $a->json('redirect_url'));
        $this->assertSame('handed_off', DB::table('invoice_assistant_drafts')->where('id', $d['draft_id'])->value('status'));

        $b = $this->postJson($this->draftUrl($d['draft_id'], '/handoff'), $body)->assertOk();
        $this->assertSame($a->json('draft_id'), $b->json('draft_id'));
    }

    public function test_handoff_with_a_stale_revision_is_refused(): void
    {
        $d = $this->ready();
        $this->postJson($this->draftUrl($d['draft_id'], '/handoff'), ['expected_revision' => 7, 'request_id' => $this->reqId()])
            ->assertStatus(409)->assertJsonPath('code', 'stale_revision');
    }

    public function test_a_price_change_after_review_blocks_handoff_until_reviewed_again(): void
    {
        $d = $this->ready();
        DB::table('products')->where('id', $this->product->id)->update(['price' => 120]);

        $this->postJson($this->draftUrl($d['draft_id'], '/handoff'), ['expected_revision' => $d['revision'], 'request_id' => $this->reqId()])
            ->assertStatus(409)->assertJsonPath('code', 'changed_since_review')
            ->assertJsonPath('draft.draft_id', $d['draft_id']);
        $this->assertNotSame('handed_off', DB::table('invoice_assistant_drafts')->where('id', $d['draft_id'])->value('status'));
    }

    private function handedOff(): array
    {
        $d = $this->ready();
        $this->postJson($this->draftUrl($d['draft_id'], '/handoff'), ['expected_revision' => $d['revision'], 'request_id' => $this->reqId()])->assertOk();

        return $d;
    }

    public function test_claim_returns_a_versioned_prefill_that_never_settles_the_bill(): void
    {
        $d = $this->handedOff();
        $res = $this->postJson($this->draftUrl($d['draft_id'], '/claim'))->assertOk();

        $p = $res->json('prefill');
        $this->assertSame(1, $p['version']);
        $this->assertSame('invoice_assistant', $p['source']);
        $this->assertSame($d['draft_id'], $p['draft_id']);
        $this->assertSame($this->customerId, $p['party']['id']);
        $this->assertCount(1, $p['items']);
        $this->assertEquals(3.0, (float) $p['items'][0]['quantity']);
        $this->assertEquals(100.0, (float) $p['items'][0]['price']);
        $this->assertSame('credit', $p['payment_method']);
        $this->assertEquals(0.0, (float) $p['amount_paid']);
        $this->assertNotEmpty($res->json('claim_token'));
    }

    public function test_a_draft_that_was_not_handed_off_cannot_be_claimed(): void
    {
        $d = $this->ready();
        $this->assertGreaterThanOrEqual(400, $this->postJson($this->draftUrl($d['draft_id'], '/claim'))->status());
    }

    public function test_a_second_claim_while_the_first_is_pending_is_refused(): void
    {
        $d = $this->handedOff();
        $this->postJson($this->draftUrl($d['draft_id'], '/claim'))->assertOk();
        $this->postJson($this->draftUrl($d['draft_id'], '/claim'))->assertStatus(409)->assertJsonPath('code', 'claim_in_progress');
    }

    public function test_an_unacknowledged_claim_can_be_recovered_after_the_grace_window(): void
    {
        $d = $this->handedOff();
        $this->postJson($this->draftUrl($d['draft_id'], '/claim'))->assertOk();
        DB::table('invoice_assistant_drafts')->where('id', $d['draft_id'])->update(['claimed_at' => now()->subSeconds(600)]);

        $this->postJson($this->draftUrl($d['draft_id'], '/claim'))->assertOk()->assertJsonStructure(['prefill', 'claim_token']);
    }

    public function test_acknowledging_needs_the_right_token_and_is_replay_safe(): void
    {
        $d = $this->handedOff();
        $token = $this->postJson($this->draftUrl($d['draft_id'], '/claim'))->assertOk()->json('claim_token');

        $this->postJson($this->draftUrl($d['draft_id'], '/applied'), ['claim_token' => 'wrong-token'])
            ->assertStatus(409)->assertJsonPath('code', 'claim_mismatch');
        $this->assertNull(DB::table('invoice_assistant_drafts')->where('id', $d['draft_id'])->value('applied_at'));

        $this->postJson($this->draftUrl($d['draft_id'], '/applied'), ['claim_token' => $token])->assertOk()->assertJsonPath('ok', true);
        $this->postJson($this->draftUrl($d['draft_id'], '/applied'), ['claim_token' => $token])->assertOk();
        $this->assertNotNull(DB::table('invoice_assistant_drafts')->where('id', $d['draft_id'])->value('applied_at'));
    }

    public function test_a_claim_after_the_price_changed_returns_fresh_data_not_the_reviewed_price(): void
    {
        $d = $this->handedOff();
        DB::table('products')->where('id', $this->product->id)->update(['price' => 130]);

        $res = $this->postJson($this->draftUrl($d['draft_id'], '/claim'));
        if ($res->status() === 200) {
            $this->assertEquals(130.0, (float) $res->json('prefill.items.0.price'));
            $this->assertNotEmpty($res->json('prefill.notices'), 'a price change since review must be disclosed');
        } else {
            $this->assertSame(409, $res->status());   // or sent back for another review
        }
    }

    // ── housekeeping ────────────────────────────────────────────────────────

    public function test_prune_expires_old_drafts_and_deletes_old_content(): void
    {
        $d = $this->ready();
        DB::table('invoice_assistant_drafts')->where('id', $d['draft_id'])->update(['expires_at' => now()->subHours(48), 'updated_at' => now()->subHours(48)]);

        Artisan::call('invoice-assistant:prune');
        $row = DB::table('invoice_assistant_drafts')->where('id', $d['draft_id'])->first();
        $this->assertTrue($row === null || $row->status === 'expired');

        DB::table('invoice_assistant_drafts')->where('id', $d['draft_id'])->update(['updated_at' => now()->subHours(72)]);
        Artisan::call('invoice-assistant:prune');
        $this->assertNull(DB::table('invoice_assistant_drafts')->where('id', $d['draft_id'])->first());
    }

    public function test_prune_never_touches_an_active_draft(): void
    {
        $d = $this->ready();
        Artisan::call('invoice-assistant:prune');
        $this->assertNotNull(DB::table('invoice_assistant_drafts')->where('id', $d['draft_id'])->first());
    }
}
