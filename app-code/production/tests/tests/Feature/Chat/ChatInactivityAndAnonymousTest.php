<?php

uses(\Tests\Feature\VenQoreTestCase::class);

use App\Models\ChatSession;
use App\Models\ChatMessage;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Event;
use App\Events\Chat\MessageSent;
use App\Events\Chat\SessionStatusChanged;

beforeEach(function () {
    // Create a tenant and provision it
    $this->tenant = $this->createTenant('test-store');
    $this->tenant->update(['ai_status' => 'managed']);
    // Act as the owner
    $this->owner = $this->createTenantUser($this->tenant, 'owner');
    $this->actingAs($this->owner);
    $this->bindTenantContext($this->tenant, $this->owner);
});

test('resolved chat session reopens automatically when visitor sends a message', function () {
    // 1. Create a resolved session
    $session = ChatSession::create([
        'tenant_id' => $this->tenant->id,
        'session_uuid' => \Illuminate\Support\Str::uuid()->toString(),
        'visitor_name' => 'John Reopener',
        'status' => ChatSession::STATUS_RESOLVED,
        'resolved_at' => now()->subDay(),
    ]);

    // Save key in settings first so AI service doesn't throw Key Missing exception
    Setting::create(['tenant_id' => $this->tenant->id, 'key' => 'chatbot_api_key', 'value' => 'some-valid-looking-key']);

    // Mock Gemini API
    Http::fake([
        'generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [
                [
                    'content' => [
                        'parts' => [
                            ['text' => 'Hello again, how can I assist you now?']
                        ]
                    ]
                ]
            ]
        ], 200)
    ]);

    // 2. Send visitor message
    $response = $this->post("/api/{$this->tenant->slug}/chatbot/session/{$session->session_uuid}/message", [
        'body' => 'I need more help'
    ]);

    $response->assertStatus(200);

    // 3. Assert session is reopened
    $session->refresh();
    expect($session->status)->toBe(ChatSession::STATUS_BOT_ACTIVE);
    expect($session->resolved_at)->toBeNull();

    // 4. Assert database has both messages
    $this->assertDatabaseHas('chat_messages', [
        'session_id' => $session->id,
        'sender_type' => ChatMessage::SENDER_VISITOR,
        'body' => 'I need more help'
    ]);

    $this->assertDatabaseHas('chat_messages', [
        'session_id' => $session->id,
        'sender_type' => ChatMessage::SENDER_BOT,
        'body' => 'Hello again, how can I assist you now?'
    ]);
});

test('inactivity timeout command automatically closes inactive sessions', function () {
    // 1. Create an active session
    $session = ChatSession::create([
        'tenant_id' => $this->tenant->id,
        'session_uuid' => \Illuminate\Support\Str::uuid()->toString(),
        'visitor_name' => 'John Inactive',
        'status' => ChatSession::STATUS_AGENT_ACTIVE,
    ]);

    // 2. Create last message from agent, sent 11 minutes ago
    $msg = ChatMessage::create([
        'session_id' => $session->id,
        'sender_type' => ChatMessage::SENDER_AGENT,
        'body' => 'Are you still there?',
    ]);
    $msg->created_at = now()->subMinutes(11);
    $msg->save();

    // 3. Run the inactivity command
    $this->artisan('chat:close-inactive')
        ->assertExitCode(0);

    // 4. Assert session is resolved
    $session->refresh();
    expect($session->status)->toBe(ChatSession::STATUS_RESOLVED);
    expect($session->resolved_at)->not->toBeNull();

    // 5. Assert closing message is added to chat
    $this->assertDatabaseHas('chat_messages', [
        'session_id' => $session->id,
        'sender_type' => ChatMessage::SENDER_BOT,
        'sender_name' => 'Support',
        'body' => 'You have not replied. We are concluding it. If you want to talk about something, just send another message and we will respond back to you.'
    ]);
});

test('claiming a session is completely anonymous (no system join message is sent to visitor)', function () {
    // 1. Create a session that is human requested
    $session = ChatSession::create([
        'tenant_id' => $this->tenant->id,
        'session_uuid' => \Illuminate\Support\Str::uuid()->toString(),
        'visitor_name' => 'Anonymous Visitor',
        'status' => ChatSession::STATUS_HUMAN_REQUESTED,
    ]);

    // Make sure we have platform staff role or owner to claim it
    $this->actingAs($this->owner);

    // 2. Claim the session
    $response = $this->post(route('store.admin.chatbot.claim', [
        'store_slug' => $this->tenant->slug,
        'uuid' => $session->session_uuid,
    ]));

    $response->assertStatus(200);

    // 3. Assert session is claimed
    $session->refresh();
    expect($session->status)->toBe(ChatSession::STATUS_AGENT_ACTIVE);
    expect($session->claimed_by)->toBe($this->owner->id);

    // 4. Assert NO system join message is in the database
    $this->assertDatabaseMissing('chat_messages', [
        'session_id' => $session->id,
        'sender_type' => ChatMessage::SENDER_SYSTEM,
    ]);
});

test('sending a message broadcasts on agent inbox channels', function () {
    Event::fake([MessageSent::class]);

    $session = ChatSession::create([
        'tenant_id' => $this->tenant->id,
        'session_uuid' => \Illuminate\Support\Str::uuid()->toString(),
        'visitor_name' => 'Broadcast Visitor',
        'status' => ChatSession::STATUS_BOT_ACTIVE,
    ]);

    // Send a message as visitor
    $message = ChatMessage::create([
        'session_id' => $session->id,
        'sender_type' => ChatMessage::SENDER_VISITOR,
        'sender_name' => $session->visitor_name,
        'body' => 'Hello',
    ]);

    // Trigger event broadcast manually or by dispatching it
    event(new MessageSent($message, $session->session_uuid));

    // Assert it was broadcasted and check the channels
    Event::assertDispatched(MessageSent::class, function ($event) use ($session) {
        $channels = $event->broadcastOn();
        
        $channelNames = array_map(fn($c) => (string) $c, $channels);

        return in_array('chat.' . $session->session_uuid, $channelNames)
            && in_array('private-agent.inbox.' . $session->tenant_id, $channelNames)
            && in_array('private-agent.inbox.global', $channelNames);
    });
});

