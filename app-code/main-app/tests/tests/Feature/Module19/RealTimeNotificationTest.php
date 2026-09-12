<?php

namespace Tests\Feature\Module19;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Queue;
use Illuminate\Queue\Events\JobProcessing;
use Tests\Feature\VenQoreTestCase;

class RealTimeNotificationTest extends VenQoreTestCase
{
    // ─────────────────────────────────────────────────────────────
    // 1. PRIVATE CHANNEL MULTI-TENANT BYPASS TESTS
    // ─────────────────────────────────────────────────────────────

    public function test_authorizes_store_channel_if_user_belongs_to_the_store_denies_access_if_from_another_store()
    {
        $tenantA = $this->createTenant();
        $tenantB = $this->createTenant();

        $cashierA = $this->createTenantUser($tenantA, 'cashier');
        $cashierB = $this->createTenantUser($tenantB, 'cashier');

        // Act as Cashier A - attempting to authorize for Store A's terminal channel (should succeed 200)
        $responseA = $this->actingAs($cashierA)->postJson('/broadcasting/auth', [
            'channel_name' => "private-store.{$tenantA->id}.terminal",
            'socket_id' => '1234.5678',
        ]);
        $responseA->assertStatus(200);

        // Act as Cashier B - attempting to authorize for Store A's terminal channel (should fail 403)
        $responseB = $this->actingAs($cashierB)->postJson('/broadcasting/auth', [
            'channel_name' => "private-store.{$tenantA->id}.terminal",
            'socket_id' => '1234.5678',
        ]);
        $responseB->assertStatus(403);
    }

    // ─────────────────────────────────────────────────────────────
    // 2. PUSHER WEBHOOK SIGNATURE SPOOFING TESTS
    // ─────────────────────────────────────────────────────────────

    public function test_blocks_pusher_webhook_if_signature_header_is_missing_or_incorrect()
    {
        $payload = [
            'time_ms' => now()->timestamp * 1000,
            'events' => [
                [
                    'name' => 'client-event',
                    'channel' => 'private-store.1.terminal',
                    'event' => 'client-barcode-scan',
                    'data' => '{"barcode":"112233"}',
                ]
            ]
        ];

        // Request without signature header (should fail 401)
        $responseNoSig = $this->postJson('/api/webhooks/pusher', $payload);
        $responseNoSig->assertStatus(401);

        // Request with invalid signature (should fail 401)
        $responseBadSig = $this->withHeaders([
            'X-Pusher-Signature' => 'invalid_signature_hash',
        ])->postJson('/api/webhooks/pusher', $payload);
        $responseBadSig->assertStatus(401);

        // Request with valid signature using app secret (should succeed 200)
        config(['broadcasting.connections.pusher.secret' => 'webhook_secret']);
        $validSignature = hash_hmac('sha256', json_encode($payload), 'webhook_secret');

        $responseGoodSig = $this->withHeaders([
            'X-Pusher-Signature' => $validSignature,
        ])->postJson('/api/webhooks/pusher', $payload);
        
        $responseGoodSig->assertStatus(200);
    }

    // ─────────────────────────────────────────────────────────────
    // 3. PUSHER WEBHOOK REPLAY PROTECTION TESTS
    // ─────────────────────────────────────────────────────────────

    public function test_rejects_pusher_webhooks_older_than_300_seconds_to_prevent_replay_attacks()
    {
        config(['broadcasting.connections.pusher.secret' => 'webhook_secret']);
        
        // Webhook representing a timestamp 10 minutes (600 seconds) in the past
        $payload = [
            'time_ms' => (now()->timestamp - 600) * 1000,
            'events' => [
                [
                    'name' => 'client-event',
                    'channel' => 'private-store.1.terminal',
                    'event' => 'client-barcode-scan',
                    'data' => '{"barcode":"112233"}',
                ]
            ]
        ];

        $signature = hash_hmac('sha256', json_encode($payload), 'webhook_secret');

        $response = $this->withHeaders([
            'X-Pusher-Signature' => $signature,
        ])->postJson('/api/webhooks/pusher', $payload);

        $response->assertStatus(400);
        $response->assertJsonFragment([
            'error' => 'Webhook request expired or replay detected.',
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // 4. UNBOUND BROADCASTER ASYNC CONTEXT TESTS
    // ─────────────────────────────────────────────────────────────

    public function test_preserves_tenant_context_in_queued_events_and_binds_context_during_queue_job_execution()
    {
        $tenant = $this->createTenant();
        
        // Bind tenant context
        app()->instance('current.tenant', $tenant);

        // Clear tenant context to simulate clean queue worker startup environment
        app()->forgetInstance('current.tenant');
        expect(app()->bound('current.tenant'))->toBeFalse();

        // Trigger target queue helper event simulated job payload
        $jobPayload = [
            'tenant_id' => $tenant->id,
        ];

        // Fire simulated queue worker hook event to process payload
        // This mimics Laravel's Queue::before execution hook
        $mockJob = new class($jobPayload) {
            private array $payload;
            public function __construct(array $payload) { $this->payload = $payload; }
            public function payload(): array { return $this->payload; }
        };

        // Trigger the queue before execution event
        event(new JobProcessing('database', $mockJob));

        // Confirm that the queue hook successfully bound the tenant from the payload to the DI container
        expect(app()->bound('current.tenant'))->toBeTrue();
        expect(app('current.tenant')->id)->toBe($tenant->id);
    }
}
