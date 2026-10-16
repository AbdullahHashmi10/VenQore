<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\Push\FcmService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\Feature\VenQoreTestCase;

/** Notifications to the phone app: registering a phone, sending through FCM, dropping dead tokens. */
class FcmTest extends VenQoreTestCase
{
    private string $file;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();

        $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        openssl_pkey_export($key, $pem);
        $this->file = tempnam(sys_get_temp_dir(), 'fcm');
        file_put_contents($this->file, json_encode([
            'type' => 'service_account', 'project_id' => 'demo-project',
            'client_email' => 'sender@demo-project.iam.gserviceaccount.com', 'private_key' => $pem,
        ]));
    }

    protected function tearDown(): void
    {
        @unlink($this->file);
        parent::tearDown();
    }

    private function on(): void
    {
        config(['fcm.service_account_path' => $this->file]);
    }

    public function test_off_when_no_service_account_is_configured(): void
    {
        config(['fcm.service_account_path' => null]);
        Http::fake();
        $user = User::factory()->create();
        FcmService::remember($user->id, str_repeat('t', 40));

        $this->assertSame(0, FcmService::toUser($user->id, ['title' => 'Hi']));
        Http::assertNothingSent();
    }

    public function test_a_signed_in_person_registers_and_removes_their_own_phone(): void
    {
        $user = User::factory()->create();
        $token = str_repeat('a', 60);

        $this->actingAs($user)->postJson('/app/device-token', ['token' => $token, 'app_version' => '1.2.0'])->assertOk();
        $this->assertSame($user->id, (int) DB::table('device_tokens')->where('token_hash', hash('sha256', $token))->value('user_id'));

        // The same phone again is one row, not two.
        $this->actingAs($user)->postJson('/app/device-token', ['token' => $token])->assertOk();
        $this->assertSame(1, DB::table('device_tokens')->count());

        // Someone else cannot switch it off.
        $other = User::factory()->create();
        $this->actingAs($other)->postJson('/app/device-token/off', ['token' => $token])->assertOk();
        $this->assertNull(DB::table('device_tokens')->value('revoked_at'));

        $this->actingAs($user)->postJson('/app/device-token/off', ['token' => $token])->assertOk();
        $this->assertNotNull(DB::table('device_tokens')->value('revoked_at'));
    }

    public function test_guests_cannot_register_a_phone(): void
    {
        $this->postJson('/app/device-token', ['token' => str_repeat('a', 60)])->assertUnauthorized();
    }

    public function test_a_message_reaches_every_active_phone_and_a_dead_one_is_dropped(): void
    {
        $this->on();
        $user = User::factory()->create();
        FcmService::remember($user->id, 'good-' . str_repeat('g', 40));
        FcmService::remember($user->id, 'dead-' . str_repeat('d', 40));

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'tok', 'expires_in' => 3600]),
            'fcm.googleapis.com/*' => function ($request) {
                return str_contains($request['message']['token'], 'dead-')
                    ? Http::response(['error' => ['status' => 'UNREGISTERED', 'message' => 'gone']], 404)
                    : Http::response(['name' => 'projects/demo-project/messages/1']);
            },
        ]);

        $reached = FcmService::toUser($user->id, ['title' => 'New delivery #7', 'body' => 'Pickup: Shop', 'url' => '/s/shop/online-store/my-rides']);

        $this->assertSame(1, $reached);
        Http::assertSent(fn ($r) => str_contains($r->url(), '/v1/projects/demo-project/messages:send')
            && $r->hasHeader('Authorization', 'Bearer tok')
            && $r['message']['notification']['title'] === 'New delivery #7'
            && $r['message']['data']['url'] === '/s/shop/online-store/my-rides');
        $this->assertNotNull(DB::table('device_tokens')->where('token_hash', hash('sha256', 'dead-' . str_repeat('d', 40)))->value('revoked_at'));
        $this->assertNull(DB::table('device_tokens')->where('token_hash', hash('sha256', 'good-' . str_repeat('g', 40)))->value('revoked_at'));
    }

    public function test_a_revoked_phone_gets_nothing(): void
    {
        $this->on();
        $user = User::factory()->create();
        $token = 'old-' . str_repeat('o', 40);
        FcmService::remember($user->id, $token);
        FcmService::forget($user->id, $token);
        Http::fake();

        $this->assertSame(0, FcmService::toUser($user->id, ['title' => 'x']));
        Http::assertNothingSent();
    }
}
