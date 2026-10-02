<?php

namespace Tests\Feature\InvoiceAssistant;

use App\Models\Setting;
use Illuminate\Support\Facades\DB;

/**
 * Who may use the assistant at all. Every layer is re-checked per request.
 */
class AccessTest extends InvoiceAssistantTestCase
{
    public function test_guest_cannot_reach_any_assistant_route(): void
    {
        $this->postJson($this->url('drafts'), ['text' => 'x', 'input_mode' => 'text', 'request_id' => $this->reqId()])
            ->assertStatus(401);
        $this->getJson($this->url('config'))->assertStatus(401);
    }

    public function test_a_role_without_sales_create_is_refused_before_anything_runs(): void
    {
        $viewer = $this->createTenantUser($this->tenant, 'viewer');
        $this->fakeModel($this->intent(), 0);

        $this->actingAsTenantUserModel($viewer, $this->tenant)
            ->postJson($this->url('drafts'), ['text' => 'invoice Ali 3 ABC-101', 'input_mode' => 'text', 'request_id' => $this->reqId()])
            ->assertStatus(403);
        $this->assertSame(0, DB::table('invoice_assistant_drafts')->count());
    }

    public function test_master_switch_off_returns_feature_disabled_and_calls_no_model(): void
    {
        config(['invoice_assistant.enabled' => false]);
        $this->fakeModel($this->intent(), 0);

        $this->createDraft()->assertStatus(403)->assertJsonPath('code', 'feature_disabled');
        $this->assertSame(0, DB::table('invoice_assistant_drafts')->count());
    }

    public function test_config_endpoint_reports_the_switches_without_being_gated(): void
    {
        config(['invoice_assistant.enabled' => false]);
        $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->getJson($this->url('config'))
            ->assertOk()->assertJsonPath('enabled', false)->assertJsonPath('voice_enabled', false);

        config(['invoice_assistant.enabled' => true, 'invoice_assistant.voice_enabled' => false]);
        $this->getJson($this->url('config'))->assertOk()->assertJsonPath('enabled', true)->assertJsonPath('voice_enabled', false);
    }

    public function test_pilot_list_limits_which_stores_can_use_it(): void
    {
        config(['invoice_assistant.enabled_tenants' => [(string) $this->other->id]]);
        $this->fakeModel($this->intent(), 0);

        $this->createDraft()->assertStatus(403)->assertJsonPath('code', 'feature_disabled');
    }

    public function test_store_ai_switch_turns_the_assistant_off(): void
    {
        Setting::updateOrCreate(['tenant_id' => $this->tenant->id, 'key' => 'ai_enabled'], ['value' => '0']);
        $this->fakeModel($this->intent(), 0);

        $this->createDraft()->assertStatus(403)->assertJsonPath('code', 'ai_disabled');
    }

    public function test_ai_restricted_roles_are_honoured(): void
    {
        Setting::updateOrCreate(['tenant_id' => $this->tenant->id, 'key' => 'ai_restricted_roles'], ['value' => json_encode(['owner'])]);
        $this->fakeModel($this->intent(), 0);

        $this->createDraft()->assertStatus(403)->assertJsonPath('code', 'role_restricted');
    }

    public function test_voice_requires_its_own_switch(): void
    {
        config(['invoice_assistant.voice_enabled' => false]);
        $file = \Illuminate\Http\UploadedFile::fake()->createWithContent('a.webm', "\x1A\x45\xDF\xA3" . str_repeat("\0", 64));

        $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->post($this->url('transcriptions'), ['audio' => $file, 'request_id' => $this->reqId()], ['Accept' => 'application/json'])
            ->assertStatus(403)->assertJsonPath('code', 'feature_disabled');
    }
}
