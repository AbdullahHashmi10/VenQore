<?php

namespace Tests\Feature\Hardening;

use App\Models\Setting;
use App\Models\User;
use App\Services\Ai\Providers\KeyResolver;
use App\Services\SmartCapture\AiExtractionService;
use App\Support\PlatformAiKeys;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

/**
 * Hashmi Dashboard AI keys (2026-09-11): a FREE Gemini key and PAID keys per
 * provider can be saved side by side. Free usage takes the free key; paid
 * usage takes the active paid provider's key. Keys are encrypted at rest,
 * owner-only to change, and never reach the browser.
 */
class PlatformAiKeysTest extends VenQoreTestCase
{
    private const FREE = 'AIzaFREE-free-tier-key-1111';
    private const PAID_GEMINI = 'AIzaPAID-paid-gemini-key-2222';
    private const CLAUDE = 'sk-ant-paid-claude-key-3333';

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'smartcapture.free_api_key' => null,
            'smartcapture.gemini_key'   => null,
            'smartcapture.api_key'      => null,
            'services.gemini.key'       => null,
            'services.openai.key'       => null,
            'services.anthropic.key'    => null,
            'services.deepseek.key'     => null,
        ]);
    }

    private ?User $owner = null;

    private function owner(): User
    {
        return $this->owner ??= User::factory()->create([
            'is_platform_admin' => true,
            'platform_role'     => 'platform_owner',
            'last_store_id'     => null,
        ]);
    }

    private function saveAsOwner(array $payload)
    {
        return $this->actingAs($this->owner())->post('/VenQore/settings/save', $payload);
    }

    private function raw(string $key): ?string
    {
        return Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', $key)->value('value');
    }

    #[Test]
    public function owner_can_save_free_and_paid_keys_side_by_side_encrypted(): void
    {
        $this->saveAsOwner([
            'ai_free_gemini_api_key'    => self::FREE,
            'ai_paid_gemini_api_key'    => self::PAID_GEMINI,
            'ai_paid_anthropic_api_key' => self::CLAUDE,
            'ai_paid_provider'          => 'anthropic',
            'ai_free_fallback_to_paid'  => 0,
        ])->assertRedirect();

        foreach (['ai_free_gemini_api_key' => self::FREE, 'ai_paid_gemini_api_key' => self::PAID_GEMINI, 'ai_paid_anthropic_api_key' => self::CLAUDE] as $key => $plain) {
            $stored = $this->raw($key);
            $this->assertStringStartsWith('enc:', $stored);
            $this->assertStringNotContainsString($plain, $stored);
        }

        $keys = new PlatformAiKeys();
        $this->assertSame(self::FREE, $keys->freeKey());
        $this->assertSame(self::CLAUDE, $keys->paidKey('anthropic'));
        $this->assertSame('anthropic', $keys->paidProvider());
        $this->assertFalse($keys->freeFallsBackToPaid());
    }

    #[Test]
    public function free_usage_takes_the_free_key_and_paid_usage_takes_the_paid_provider(): void
    {
        $this->saveAsOwner([
            'ai_free_gemini_api_key'    => self::FREE,
            'ai_paid_anthropic_api_key' => self::CLAUDE,
            'ai_paid_provider'          => 'anthropic',
        ]);

        $resolver = new KeyResolver();

        $free = $resolver->resolve(null, 'query', 'free');
        $this->assertSame(self::FREE, $free['api_key']);
        $this->assertSame('gemini', $free['provider']);
        $this->assertSame('platform_free', $free['key_mode']);
        $this->assertSame(config('ai_models.query.model'), $free['model']);

        $public = $resolver->resolve(null, 'public_tool', null);
        $this->assertSame(self::FREE, $public['api_key']);

        $paid = $resolver->resolve(null, 'query', 'managed');
        $this->assertSame(self::CLAUDE, $paid['api_key']);
        $this->assertSame('anthropic', $paid['provider']);
        $this->assertSame('platform_paid', $paid['key_mode']);
        // A Claude request must not be sent a Gemini model name.
        $this->assertSame(config('smartcapture.default_models.anthropic'), $paid['model']);

        // SmartCapture uses the same two pools.
        $scan = app(AiExtractionService::class);
        $this->assertSame(self::FREE, $scan->resolveConfig('scan', 'free')['api_key']);
        $this->assertSame('gemini', $scan->resolveConfig('scan', 'free')['provider']);
        $managed = $scan->resolveConfig('scan', 'managed');
        $this->assertSame(self::CLAUDE, $managed['api_key']);
        $this->assertSame('anthropic', $managed['provider']);
        $this->assertSame(config('smartcapture.default_models.anthropic'), $managed['model']);
    }

    #[Test]
    public function free_usage_never_spends_the_paid_key_when_fallback_is_off(): void
    {
        $this->saveAsOwner([
            'ai_paid_gemini_api_key'   => self::PAID_GEMINI,
            'ai_free_fallback_to_paid' => 0,
        ]);

        $this->assertNull((new KeyResolver())->resolve(null, 'query', 'free')['api_key']);
        $this->assertNull(app(AiExtractionService::class)->resolveConfig('scan', 'free')['api_key']);
        $this->assertSame(self::PAID_GEMINI, (new KeyResolver())->resolve(null, 'query', 'managed')['api_key']);

        // Default (never set) keeps the old behaviour: fall back to the paid key.
        Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'ai_free_fallback_to_paid')->delete();
        $this->assertSame(self::PAID_GEMINI, (new KeyResolver())->resolve(null, 'query', 'free')['api_key']);
    }

    #[Test]
    public function blank_field_keeps_a_saved_key_and_remove_clears_it(): void
    {
        $this->saveAsOwner(['ai_paid_anthropic_api_key' => self::CLAUDE]);
        $this->saveAsOwner(['ai_paid_anthropic_api_key' => '', 'ai_paid_provider' => 'anthropic']);
        $this->assertSame(self::CLAUDE, (new PlatformAiKeys())->paidKey('anthropic'));

        $this->saveAsOwner(['clear_ai_keys' => ['ai_paid_anthropic_api_key']]);
        $this->assertNull((new PlatformAiKeys())->paidKey('anthropic'));
    }

    #[Test]
    public function only_the_platform_owner_can_change_ai_keys(): void
    {
        $manager = User::factory()->create([
            'is_platform_admin' => true,
            'platform_role'     => 'platform_manager',
        ]);

        $this->actingAs($manager)
            ->post('/VenQore/settings/save', ['ai_paid_anthropic_api_key' => self::CLAUDE])
            ->assertForbidden();
        $this->assertNull($this->raw('ai_paid_anthropic_api_key'));

        // Other platform settings still work for a manager.
        $this->actingAs($manager)
            ->post('/VenQore/settings/save', ['default_grace_days' => 9])
            ->assertRedirect();
        $this->assertSame('9', $this->raw('default_grace_days'));
    }

    #[Test]
    public function keys_never_reach_the_browser(): void
    {
        $this->saveAsOwner([
            'ai_free_gemini_api_key'    => self::FREE,
            'ai_paid_anthropic_api_key' => self::CLAUDE,
        ]);
        // A legacy plaintext key saved by an older build.
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['key' => 'gemini_api_key', 'tenant_id' => null],
            ['value' => 'AIzaLEGACY-plaintext-4444']
        );
        \Illuminate\Support\Facades\Cache::flush();

        $dashboard = $this->actingAs($this->owner())->get('/VenQore?view=settings');
        $dashboard->assertOk();
        $html = $dashboard->getContent();
        foreach ([self::FREE, self::CLAUDE, 'AIzaLEGACY-plaintext-4444'] as $secret) {
            $this->assertStringNotContainsString($secret, $html);
        }
        $this->assertStringContainsString('"last4":"3333"', html_entity_decode($html));

        auth()->logout();
        app()->forgetInstance('current.tenant');
        $public = $this->get('/pricing');
        $public->assertOk();
        foreach ([self::FREE, self::CLAUDE, 'AIzaLEGACY-plaintext-4444', 'enc:'] as $secret) {
            $this->assertStringNotContainsString($secret, $public->getContent());
        }
    }

    #[Test]
    public function audit_log_never_records_a_key(): void
    {
        $this->saveAsOwner(['ai_paid_anthropic_api_key' => self::CLAUDE]);

        $logged = \App\Models\PlatformAuditLog::query()->latest('id')->get()->map(fn ($r) => json_encode($r->getAttributes()))->implode("\n");
        $this->assertStringNotContainsString(self::CLAUDE, $logged);
    }
}
