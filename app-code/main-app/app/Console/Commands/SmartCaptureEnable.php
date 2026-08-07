<?php

namespace App\Console\Commands;

use App\Models\Setting;
use App\Models\Tenant;
use App\Helpers\SettingsHelper;
use Illuminate\Console\Command;

/**
 * Turn AI Scan on for one store so it can be tested locally.
 *
 * Typical local flow (BYOK — the store pastes its own Gemini key in the app):
 *
 *   php artisan smartcapture:enable --list
 *   php artisan smartcapture:enable "My Test Store"
 *   → then open the store, click AI Scan, gear icon, paste the Gemini key, Test, Save.
 *
 * Managed mode instead (uses the platform key from .env and meters usage):
 *
 *   php artisan smartcapture:enable "My Test Store" --mode=managed --scans=500
 */
class SmartCaptureEnable extends Command
{
    protected $signature = 'smartcapture:enable
                            {tenant? : Tenant id, slug or name}
                            {--mode=byok : byok (store pastes its own key) or managed (platform key, metered)}
                            {--scans=500 : Scan allowance when --mode=managed}
                            {--queries=500 : OmniSearch AI query allowance when --mode=managed}
                            {--key= : Optionally store a Gemini/OpenAI key for this tenant right away}
                            {--provider=gemini : Provider for --key (gemini|openai|anthropic|deepseek)}
                            {--model= : Optional model override, e.g. gemini-2.5-flash}
                            {--list : List tenants and their current AI status, then exit}
                            {--status : Show this tenant AI status without changing anything}';

    protected $description = 'Enable and configure AI Scan (SmartCapture) for a store, for local testing.';

    public function handle(): int
    {
        if ($this->option('list')) {
            return $this->listTenants();
        }

        $tenant = $this->resolveTenant();
        if (!$tenant) {
            return self::FAILURE;
        }

        if ($this->option('status')) {
            return $this->showStatus($tenant);
        }

        $mode = strtolower((string) $this->option('mode'));
        if (!in_array($mode, ['byok', 'managed'], true)) {
            $this->error("--mode must be 'byok' or 'managed'.");
            return self::FAILURE;
        }

        // ── Flip the entitlement ─────────────────────────────────────────────
        $tenant->ai_status = $mode;

        if ($mode === 'managed') {
            $tenant->ai_pages_limit   = (int) ($this->option('pages') ?: $this->option('scans'));
            $tenant->ai_queries_limit = (int) $this->option('queries');
            // Reset the meters so testing starts from a clean slate.
            $tenant->ai_pages_used    = 0;
            $tenant->ai_queries_used  = 0;
        }

        $tenant->save();

        // ── Optionally seed the key so the UI is ready immediately ───────────
        if ($this->option('key')) {
            $this->storeSetting($tenant, 'smartcapture_provider', (string) $this->option('provider'));
            $this->storeSetting($tenant, 'smartcapture_api_key', trim((string) $this->option('key')));

            if ($this->option('model')) {
                $this->storeSetting($tenant, 'smartcapture_model', (string) $this->option('model'));
            }

            SettingsHelper::clearCacheForTenant((string) $tenant->id);
            $this->info('Stored the API key against this store only.');
        }

        $this->newLine();
        $this->info("AI Scan enabled for: {$tenant->name}");
        $this->line("  tenant id : {$tenant->id}");
        $this->line("  ai_status : {$tenant->ai_status}");

        if ($mode === 'managed') {
            $this->line("  pages     : 0 / {$tenant->ai_pages_limit}");
            $this->line("  queries   : 0 / {$tenant->ai_queries_limit}");
            $this->newLine();
            $this->warn('Managed mode uses the PLATFORM key. Set GEMINI_API_KEY in .env, then run: php artisan optimize:clear');
        } else {
            $hasKey = $this->settingValue($tenant, 'smartcapture_api_key') !== null;

            $this->newLine();
            if ($hasKey) {
                $this->info('A key is already stored for this store — AI Scan is ready to use.');
            } else {
                $this->warn('Next step: open the store, click AI Scan, open the gear icon,');
                $this->warn('paste your Gemini API key, press "Test Connection", then Save.');
                $this->line('Get a free key at: https://aistudio.google.com/apikey');
            }
        }

        $this->newLine();
        $this->line('Then run: php artisan optimize:clear');

        return self::SUCCESS;
    }

    private function listTenants(): int
    {
        $tenants = Tenant::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'ai_status', 'ai_pages_used', 'ai_pages_limit']);

        if ($tenants->isEmpty()) {
            $this->warn('No tenants found.');
            return self::SUCCESS;
        }

        $this->table(
            ['Name', 'Slug', 'AI status', 'Pages', 'Own key?', 'Tenant id'],
            $tenants->map(fn ($t) => [
                $t->name,
                $t->slug,
                $t->ai_status ?? 'none',
                ($t->ai_pages_used ?? 0) . ' / ' . ($t->ai_pages_limit ?: '—'),
                $this->settingValue($t, 'smartcapture_api_key') ? 'yes' : 'no',
                $t->id,
            ])->all()
        );

        return self::SUCCESS;
    }

    private function showStatus(Tenant $tenant): int
    {
        $provider = $this->settingValue($tenant, 'smartcapture_provider') ?? config('smartcapture.provider');
        $model    = $this->settingValue($tenant, 'smartcapture_model') ?? config("smartcapture.default_models.{$provider}");
        $ownKey   = $this->settingValue($tenant, 'smartcapture_api_key');

        $this->info("AI Scan status — {$tenant->name}");
        $this->line('  ai_status  : ' . ($tenant->ai_status ?? 'none'));
        $this->line('  pages used : ' . ($tenant->ai_pages_used ?? 0) . ' / ' . ($tenant->ai_pages_limit ?: '—'));
        $this->line('  provider   : ' . $provider);
        $this->line('  model      : ' . $model);
        $this->line('  own key    : ' . ($ownKey ? substr($ownKey, 0, 4) . str_repeat('*', 8) . substr($ownKey, -4) : 'not set'));
        $this->line('  platform key present : ' . (config('smartcapture.gemini_key') || config('smartcapture.api_key') ? 'yes' : 'no'));

        $learned = \App\Models\SmartCaptureAlias::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->count();
        $this->line("  learned mappings : {$learned}");

        return self::SUCCESS;
    }

    private function resolveTenant(): ?Tenant
    {
        $needle = $this->argument('tenant');

        if (!$needle) {
            $needle = $this->ask('Which store? (id, slug or name — run with --list to see them all)');
        }

        $tenant = Tenant::where('id', $needle)
            ->orWhere('slug', $needle)
            ->orWhere('name', $needle)
            ->first();

        if (!$tenant) {
            $tenant = Tenant::where('name', 'like', "%{$needle}%")->first();
        }

        if (!$tenant) {
            $this->error("No tenant matched '{$needle}'. Run: php artisan smartcapture:enable --list");
            return null;
        }

        return $tenant;
    }

    private function storeSetting(Tenant $tenant, string $key, string $value): void
    {
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => $key],
            ['value' => $value]
        );
    }

    private function settingValue(Tenant $tenant, string $key): ?string
    {
        $value = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', $key)
            ->value('value');

        $value = is_string($value) ? trim($value) : null;

        return ($value === '' || $value === null) ? null : $value;
    }
}
