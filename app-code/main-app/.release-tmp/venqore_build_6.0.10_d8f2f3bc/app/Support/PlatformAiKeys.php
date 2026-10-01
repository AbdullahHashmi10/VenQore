<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

/**
 * Platform-level AI keys set in the Hashmi Dashboard (Platform → Settings).
 *
 * Two separate pools:
 *  - FREE key: a Google AI Studio (Gemini) free-tier key. Used for public
 *    tools, free-plan stores, trials and staff previews.
 *  - PAID keys: one per provider (Gemini, OpenAI, Anthropic/Claude, DeepSeek).
 *    Used for paying stores on managed AI. The dashboard picks which paid
 *    provider is active.
 *
 * Keys are stored encrypted (APP_KEY) in the global `settings` rows and are
 * never sent to the browser; the dashboard only receives a masked status.
 * Store-level BYOK keys are handled elsewhere and always win over these.
 *
 * Resolution order for each pool: dashboard value → legacy dashboard value
 * (older single-key fields) → .env.
 */
class PlatformAiKeys
{
    public const PROVIDERS = ['gemini', 'openai', 'anthropic', 'deepseek'];

    public const FREE_KEY = 'ai_free_gemini_api_key';
    public const FREE_MODEL = 'ai_free_model';
    public const FREE_FALLBACK = 'ai_free_fallback_to_paid';
    public const PAID_PROVIDER = 'ai_paid_provider';
    public const PAID_MODEL = 'ai_paid_model';

    /** Every secret this class manages (encrypted at rest, hidden from the UI). */
    public const SECRET_KEYS = [
        self::FREE_KEY,
        'ai_paid_gemini_api_key',
        'ai_paid_openai_api_key',
        'ai_paid_anthropic_api_key',
        'ai_paid_deepseek_api_key',
        // legacy single-key fields
        'gemini_api_key',
        'ai_api_key',
        'global_ai_api_key',
        'openai_api_key',
    ];

    private const ENC_PREFIX = 'enc:';

    /** @var array<string,string>|null */
    private ?array $values = null;

    public static function paidKeyName(string $provider): string
    {
        return 'ai_paid_' . $provider . '_api_key';
    }

    // ── Free pool ────────────────────────────────────────────────────────

    /** The dedicated free-tier key, or null when none is configured. */
    public function freeKey(): ?string
    {
        return $this->secret(self::FREE_KEY) ?: $this->clean(config('smartcapture.free_api_key'));
    }

    public function freeModel(): ?string
    {
        return $this->clean($this->raw(self::FREE_MODEL));
    }

    /**
     * Whether free-tier features may spend the PAID key when no free key is
     * configured. Defaults to true so existing installs (one key in .env) keep
     * working; switch it off once a free key is saved.
     */
    public function freeFallsBackToPaid(): bool
    {
        $v = $this->raw(self::FREE_FALLBACK);

        return $v === null || $v === '' ? true : $v === '1';
    }

    // ── Paid pool ────────────────────────────────────────────────────────

    /** The paid provider chosen in the dashboard (null = use the feature default). */
    public function paidProvider(): ?string
    {
        $p = strtolower((string) ($this->clean($this->raw(self::PAID_PROVIDER)) ?: $this->clean($this->raw('ai_provider'))));

        return in_array($p, self::PROVIDERS, true) ? $p : null;
    }

    public function paidModel(): ?string
    {
        return $this->clean($this->raw(self::PAID_MODEL)) ?: $this->clean($this->raw('ai_model'));
    }

    /** The paid key for a provider: dashboard → legacy dashboard → .env. */
    public function paidKey(string $provider): ?string
    {
        $provider = strtolower($provider);

        $key = $this->secret(self::paidKeyName($provider));
        if ($key) {
            return $key;
        }

        return match ($provider) {
            'gemini' => $this->secret('gemini_api_key')
                ?: $this->secret('ai_api_key')
                ?: $this->secret('global_ai_api_key')
                ?: $this->clean(config('smartcapture.gemini_key'))
                ?: $this->clean(config('services.gemini.key'))
                ?: $this->clean(config('smartcapture.api_key')),
            'openai' => $this->secret('openai_api_key')
                ?: $this->clean(config('services.openai.key'))
                ?: $this->clean(config('smartcapture.api_key')),
            'anthropic' => $this->clean(config('services.anthropic.key')),
            'deepseek' => $this->clean(config('services.deepseek.key')),
            default => null,
        };
    }

    /**
     * Key for a free-tier request: the free key, else (if allowed) the paid
     * Gemini key. Returns [key, provider|null, fromFreePool].
     *
     * @return array{0: ?string, 1: ?string, 2: bool}
     */
    public function freeTierKey(?string $fallbackProvider = null): array
    {
        $free = $this->freeKey();
        if ($free) {
            return [$free, 'gemini', true];
        }

        if (!$this->freeFallsBackToPaid()) {
            return [null, null, false];
        }

        $provider = $fallbackProvider ?: 'gemini';

        return [$this->paidKey($provider), $provider, false];
    }

    // ── Dashboard helpers ────────────────────────────────────────────────

    /**
     * Masked status for the dashboard. Never includes a usable key.
     *
     * @return array<string,mixed>
     */
    public function status(): array
    {
        $slot = function (string $name, ?string $envValue) {
            $saved = $this->secret($name);

            return [
                'saved'  => (bool) $saved,
                'last4'  => $saved ? substr($saved, -4) : null,
                'env'    => !$saved && (bool) $envValue,
            ];
        };

        return [
            'free' => array_merge($slot(self::FREE_KEY, $this->clean(config('smartcapture.free_api_key'))), [
                'model'           => $this->freeModel(),
                'fallback_to_paid'=> $this->freeFallsBackToPaid(),
            ]),
            'paid' => [
                'provider'  => $this->paidProvider(),
                'model'     => $this->paidModel(),
                'gemini'    => $slot(self::paidKeyName('gemini'), $this->secret('gemini_api_key') ?: $this->secret('ai_api_key') ?: $this->clean(config('smartcapture.gemini_key')) ?: $this->clean(config('services.gemini.key'))),
                'openai'    => $slot(self::paidKeyName('openai'), $this->secret('openai_api_key') ?: $this->clean(config('services.openai.key'))),
                'anthropic' => $slot(self::paidKeyName('anthropic'), $this->clean(config('services.anthropic.key'))),
                'deepseek'  => $slot(self::paidKeyName('deepseek'), $this->clean(config('services.deepseek.key'))),
            ],
        ];
    }

    /** Save (encrypt) or clear a secret slot. */
    public static function putSecret(string $name, ?string $value): void
    {
        $value = $value === null ? '' : trim($value);
        $stored = $value === '' ? '' : self::ENC_PREFIX . Crypt::encryptString($value);

        Setting::withoutGlobalScopes()->updateOrCreate(
            ['key' => $name, 'tenant_id' => null],
            ['value' => $stored]
        );
    }

    /** Decrypt a stored value; plain legacy values are returned as-is. */
    public static function decrypt(?string $stored): ?string
    {
        if ($stored === null || $stored === '') {
            return null;
        }
        if (!str_starts_with($stored, self::ENC_PREFIX)) {
            return trim($stored) ?: null;
        }
        try {
            return trim(Crypt::decryptString(substr($stored, strlen(self::ENC_PREFIX)))) ?: null;
        } catch (\Throwable $e) {
            Log::warning('PlatformAiKeys: a saved AI key could not be decrypted (APP_KEY changed?). Re-enter it in the dashboard.');

            return null;
        }
    }

    /**
     * Remove API keys, secrets, tokens and passcodes from a settings map
     * before it is shared with the browser.
     *
     * @param  array<string,mixed>  $settings
     * @return array<string,mixed>
     */
    public static function withoutSecrets(array $settings): array
    {
        return array_filter(
            $settings,
            fn ($key) => !in_array($key, self::SECRET_KEYS, true)
                && !preg_match('/(api_key|secret|secret_key|token|password|passcode)$/i', (string) $key),
            ARRAY_FILTER_USE_KEY
        );
    }

    // ── internals ────────────────────────────────────────────────────────

    private function secret(string $name): ?string
    {
        return self::decrypt($this->raw($name));
    }

    private function raw(string $name): ?string
    {
        if ($this->values === null) {
            try {
                $this->values = Setting::withoutGlobalScopes()
                    ->whereNull('tenant_id')
                    ->where(function ($q) {
                        $q->where('key', 'like', 'ai\_%')
                          ->orWhereIn('key', ['gemini_api_key', 'global_ai_api_key', 'openai_api_key']);
                    })
                    ->pluck('value', 'key')
                    ->map(fn ($v) => (string) $v)
                    ->all();
            } catch (\Throwable $e) {
                $this->values = [];
            }
        }

        return $this->values[$name] ?? null;
    }

    private function clean(mixed $v): ?string
    {
        if (!is_string($v)) {
            return null;
        }
        $v = trim($v);

        return $v === '' || $v === 'REPLACE_ME' ? null : $v;
    }
}
