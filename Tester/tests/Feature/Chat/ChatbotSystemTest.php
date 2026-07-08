<?php

use App\Models\ChatSession;
use App\Models\ChatMessage;
use App\Models\CannedResponse;
use App\Models\Setting;
use App\Models\SupportTicket;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Event;
use App\Events\Chat\MessageSent;
use App\Events\Chat\SessionStatusChanged;
use App\Events\Chat\TypingStarted;
use App\Events\Chat\TypingStopped;

beforeEach(function () {
    // Create a tenant and provision it
    $this->tenant = $this->createTenant('test-store');
    // Act as the owner
    $this->owner = $this->createTenantUser($this->tenant, 'owner');
    $this->actingAs($this->owner);
    $this->bindTenantContext($this->tenant, $this->owner);
});

test('platform admin can configure chatbot settings', function () {
    app()->forgetInstance('current.tenant');
    $this->actingAsSuperAdmin();

    $response = $this->post(route('platform.chatbot.settings.update'), [
        'chatbot_api_key' => 'test-gemini-key',
        'chatbot_custom_rules' => 'Store return policy is 30 days.'
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('settings', [
        'tenant_id' => null,
        'key' => 'chatbot_api_key',
        'value' => 'test-gemini-key'
    ]);
    $this->assertDatabaseHas('settings', [
        'tenant_id' => null,
        'key' => 'chatbot_custom_rules',
        'value' => 'Store return policy is 30 days.'
    ]);
});

test('visitor can start a session and send a message', function () {
    // Start session
    $response = $this->post("/api/{$this->tenant->slug}/chatbot/session", [
        'visitor_name' => 'John Doe',
        'visitor_email' => 'john@example.com'
    ]);

    $response->assertStatus(200);
    $response->assertJsonStructure([
        'session_uuid',
        'status',
        'visitor_name',
        'visitor_email',
        'messages'
    ]);

    $uuid = $response->json('session_uuid');

    // Send a message (mock AI response)
    Http::fake([
        'generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [
                [
                    'content' => [
                        'parts' => [
                            ['text' => 'Hello visitor, how can I help you?']
                        ]
                    ]
                ]
            ]
        ], 200)
    ]);

    // Save key in settings first so AI service doesn't throw Key Missing exception
    Setting::create(['tenant_id' => $this->tenant->id, 'key' => 'chatbot_api_key', 'value' => 'some-valid-looking-key']);

    $responseMsg = $this->post("/api/{$this->tenant->slug}/chatbot/session/{$uuid}/message", [
        'body' => 'Hello AI'
    ]);

    $responseMsg->assertStatus(200);
    $this->assertDatabaseHas('chat_messages', [
        'sender_type' => 'visitor',
        'body' => 'Hello AI'
    ]);
    
    // Check that AI replied
    $this->assertDatabaseHas('chat_messages', [
        'sender_type' => 'bot',
        'body' => 'Hello visitor, how can I help you?'
    ]);
});

test('silent handoff to human on AI API failure', function () {
    // Setup key
    Setting::create(['tenant_id' => $this->tenant->id, 'key' => 'chatbot_api_key', 'value' => 'some-key']);

    // Force API failure
    Http::fake([
        'generativelanguage.googleapis.com/*' => Http::response(['error' => 'quota exceeded'], 429)
    ]);

    // Start session
    $session = ChatSession::create([
        'tenant_id' => $this->tenant->id,
        'session_uuid' => \Illuminate\Support\Str::uuid()->toString(),
        'visitor_name' => 'John Guest',
        'status' => ChatSession::STATUS_BOT_ACTIVE,
    ]);

    // Clear any activity log rows from setup so isAgentOnline() returns false
    \App\Models\ActivityLog::withoutTenantScope()
        ->where('tenant_id', $this->tenant->id)
        ->delete();

    // Send message which will cause AI service to fail and trigger silent handoff
    $response = $this->post("/api/{$this->tenant->slug}/chatbot/session/{$session->session_uuid}/message", [
        'body' => 'Help me now'
    ]);

    $response->assertStatus(200); // Silent success, no HTTP crash for client!
    
    $session->refresh();
    // Since agents are offline in tests (no ActivityLog logs), status should transition to idle_offline and create ticket
    expect($session->status)->toBe(ChatSession::STATUS_IDLE_OFFLINE);
    expect($session->ai_disabled)->toBeTrue();
    expect($session->escalation_reason)->toBe('ai_api_failure');

    // Confirm support ticket is created
    $this->assertDatabaseHas('support_tickets', [
        'tenant_id' => $this->tenant->id,
        'requester_name' => 'John Guest',
    ]);
});

test('platform admin can claim, reply, and resolve chat session', function () {
    $this->actingAsSuperAdmin();
    $admin = auth()->user();

    $session = ChatSession::withoutTenantScope()->create([
        'tenant_id' => $this->tenant->id,
        'session_uuid' => \Illuminate\Support\Str::uuid()->toString(),
        'visitor_name' => 'John Guest',
        'status' => ChatSession::STATUS_HUMAN_REQUESTED,
    ]);

    // Claim
    $response = $this->post(route('platform.chatbot.claim', ['uuid' => $session->session_uuid]));
    $response->assertStatus(200);

    $session->refresh();
    expect($session->status)->toBe(ChatSession::STATUS_AGENT_ACTIVE);
    expect($session->claimed_by)->toBe($admin->id);

    // Reply
    $responseReply = $this->post(route('platform.chatbot.reply', ['uuid' => $session->session_uuid]), [
        'body' => 'I am here to help you.'
    ]);
    $responseReply->assertStatus(200);

    $this->assertDatabaseHas('chat_messages', [
        'sender_type' => 'agent',
        'body' => 'I am here to help you.',
        'sender_id' => $admin->id
    ]);

    // Resolve
    $responseResolve = $this->post(route('platform.chatbot.resolve', ['uuid' => $session->session_uuid]));
    $responseResolve->assertStatus(200);

    $session->refresh();
    expect($session->status)->toBe(ChatSession::STATUS_RESOLVED);
});

test('synqchat assistant personalizes prompt and responds with action buttons', function () {
    // Save key and custom rules in settings
    Setting::create(['tenant_id' => $this->tenant->id, 'key' => 'chatbot_api_key', 'value' => 'some-valid-key']);
    Setting::create(['tenant_id' => $this->tenant->id, 'key' => 'chatbot_custom_rules', 'value' => 'Discount policy limit is 10%.']);

    // Mock Gemini API check rules presence in request
    Http::fake([
        'generativelanguage.googleapis.com/*' => function (\Illuminate\Http\Client\Request $request) {
            $body = $request->body();
            // Assert that our custom rule is in the prompt sent to Gemini
            expect($body)->toContain('Discount policy limit is 10%.');

            return Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                ['text' => 'Sure, I can help you with POS. Click here: [Open POS Checkout](action:pos)']
                            ]
                        ]
                    ]
                ]
            ], 200);
        }
    ]);

    // Send message to SynqChat
    $session = ChatSession::create([
        'tenant_id' => $this->tenant->id,
        'session_uuid' => \Illuminate\Support\Str::uuid()->toString(),
        'visitor_name' => 'Jane Customer',
        'status' => ChatSession::STATUS_BOT_ACTIVE,
    ]);

    $response = $this->post("/api/{$this->tenant->slug}/chatbot/session/{$session->session_uuid}/message", [
        'body' => 'How can I pay?'
    ]);

    $response->assertStatus(200);
    $this->assertDatabaseHas('chat_messages', [
        'sender_type' => 'bot',
        'body' => 'Sure, I can help you with POS. Click here: [Open POS Checkout](action:pos)'
    ]);
});

test('starter plan tenant has chatbot enabled but blocked from human handoff', function () {
    $starterTenant = $this->createTenant('starter-store', 'starter');
    Setting::create(['tenant_id' => $starterTenant->id, 'key' => 'chatbot_api_key', 'value' => 'some-valid-key']);

    $response = $this->post("/api/{$starterTenant->slug}/chatbot/session", [
        'visitor_name' => 'Starter Guest',
        'visitor_email' => 'starter@example.com'
    ]);
    $response->assertStatus(200);
    $uuid = $response->json('session_uuid');

    $session = ChatSession::where('session_uuid', $uuid)->firstOrFail();
    expect($session->status)->toBe(ChatSession::STATUS_BOT_ACTIVE);

    $routingService = app(App\Services\ChatRoutingService::class);
    $routingService->triggerHandoff($session, 'intent_keyword');

    $session->refresh();
    expect($session->status)->toBe(ChatSession::STATUS_BOT_ACTIVE);
    expect($session->ai_disabled)->toBeFalse();

    $this->assertDatabaseHas('chat_messages', [
        'session_id' => $session->id,
        'sender_type' => 'bot',
        'sender_name' => 'Vena',
        'body' => "Live agent support is not available on your plan. Please upgrade to a Growth or Business plan to chat with a live agent, or reach out to our team via email.",
    ]);
});

test('growth plan tenant successfully escalates to human agent', function () {
    $growthTenant = $this->createTenant('growth-store', 'growth');
    
    $response = $this->post("/api/{$growthTenant->slug}/chatbot/session", [
        'visitor_name' => 'Growth Guest',
        'visitor_email' => 'growth@example.com'
    ]);
    $response->assertStatus(200);
    $uuid = $response->json('session_uuid');

    $session = ChatSession::where('session_uuid', $uuid)->firstOrFail();
    expect($session->status)->toBe(ChatSession::STATUS_BOT_ACTIVE);

    $routingService = app(App\Services\ChatRoutingService::class);
    $routingService->triggerHandoff($session, 'intent_keyword');

    $session->refresh();
    expect($session->status)->toBe(ChatSession::STATUS_IDLE_OFFLINE);
    expect($session->ai_disabled)->toBeTrue();

    $this->assertDatabaseMissing('chat_messages', [
        'session_id' => $session->id,
        'body' => "Live agent support is not available on your plan. Please upgrade to a Growth or Business plan to chat with a live agent, or reach out to our team via email.",
    ]);
});


