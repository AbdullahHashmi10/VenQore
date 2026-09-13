<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;

class ConfigGuardCommand extends Command
{
    protected $signature = 'venqore:config-guard';

    protected $description = 'Refuse production deployment when launch-critical configuration is unsafe';

    public function handle(): int
    {
        if (! app()->environment('production')) {
            $this->warn('Production assertions skipped: APP_ENV is not production.');

            return self::SUCCESS;
        }

        $placeholderPricingKeys = $this->placeholderPricingKeys();
        $debugRoutes = $this->registeredDebugRoutes();
        $checks = [
            ['Mail transport is not log', config('mail.default') !== 'log', (string) config('mail.default')],
            ['Mail credentials are configured', $this->mailCredentialsAreConfigured(), 'active transport credentials'],
            ['Application debug is disabled', config('app.debug') === false, config('app.debug') ? 'true' : 'false'],
            ['Queue is asynchronous', config('queue.default') !== 'sync', (string) config('queue.default')],
            ['Cache uses database', config('cache.default') === 'database', (string) config('cache.default')],
            ['Sessions use database', config('session.driver') === 'database', (string) config('session.driver')],
            ['Database driver is MariaDB', config('database.default') === 'mariadb', (string) config('database.default')],
            ['Gemini key is configured', $this->isConfiguredSecret(config('services.gemini.key')), $this->secretState(config('services.gemini.key'))],
            ['Lemon API key is configured', $this->isConfiguredSecret(config('services.lemon_squeezy.api_key')), $this->secretState(config('services.lemon_squeezy.api_key'))],
            ['Lemon signing secret is configured', $this->isConfiguredSecret(config('services.lemon_squeezy.signing_secret')), $this->secretState(config('services.lemon_squeezy.signing_secret'))],
            ['Lemon live mode is enabled', config('services.lemon_squeezy.test_mode') === false, config('services.lemon_squeezy.test_mode') ? 'test mode true' : 'test mode false'],
            ['Pricing has no placeholders', $placeholderPricingKeys === [], $placeholderPricingKeys === [] ? 'none' : implode(', ', $placeholderPricingKeys)],
            ['Sentry DSN is configured', $this->isConfiguredSecret(config('sentry.dsn')), $this->secretState(config('sentry.dsn'))],
            ['Session cookie is secure', config('session.secure') === true, config('session.secure') ? 'true' : 'false'],
            ['Debug routes are absent', $debugRoutes === [], $debugRoutes === [] ? 'none' : implode(', ', $debugRoutes)],
        ];

        $rows = [];
        $failed = false;

        foreach ($checks as [$name, $passed, $detail]) {
            $rows[] = [$name, $passed ? 'PASS' : 'FAIL', $detail];
            $failed = $failed || ! $passed;
        }

        $this->table(['Check', 'Result', 'Detail'], $rows);

        if ($placeholderPricingKeys !== []) {
            $this->error('Placeholder variant IDs still present: '.implode(', ', $placeholderPricingKeys));
        }

        foreach ($debugRoutes as $uri) {
            $this->error("Debug route still registered: /{$uri}");
        }

        if ($failed) {
            $this->error('Production configuration guard failed. Deployment refused.');

            return self::FAILURE;
        }

        $this->info('Production configuration guard passed.');

        return self::SUCCESS;
    }

    /** @return list<string> */
    private function placeholderPricingKeys(): array
    {
        $matches = [];

        $walk = function (mixed $value, string $path = '') use (&$walk, &$matches): void {
            if (is_array($value)) {
                foreach ($value as $key => $child) {
                    $walk($child, ltrim($path.'.'.$key, '.'));
                }

                return;
            }

            if (is_string($value) && trim($value) === 'REPLACE_ME') {
                $matches[] = $path;
            }
        };

        $walk(config('pricing', []));

        return $matches;
    }

    /** @return list<string> */
    private function registeredDebugRoutes(): array
    {
        $denied = ['create-pk-test', 'clear-local-cache', 'set-local-prices', 'check-plans'];
        $found = [];

        foreach (Route::getRoutes() as $route) {
            if (in_array($route->uri(), $denied, true)) {
                $found[] = $route->uri();
            }
        }

        return array_values(array_unique($found));
    }

    private function isConfiguredSecret(mixed $value): bool
    {
        if (! is_string($value) || trim($value) === '') {
            return false;
        }

        return ! preg_match('/^(REPLACE(?:_ME|_WITH)?|CHANGE_ME|YOUR_)/i', trim($value));
    }

    private function secretState(mixed $value): string
    {
        if (! is_string($value) || trim($value) === '') {
            return 'missing';
        }

        return $this->isConfiguredSecret($value) ? 'configured' : 'placeholder';
    }

    private function mailCredentialsAreConfigured(): bool
    {
        return match (config('mail.default')) {
            'smtp' => $this->isConfiguredSecret(config('mail.mailers.smtp.host'))
                && $this->isConfiguredSecret(config('mail.mailers.smtp.username'))
                && $this->isConfiguredSecret(config('mail.mailers.smtp.password')),
            'resend' => $this->isConfiguredSecret(config('services.resend.key')),
            'postmark' => $this->isConfiguredSecret(config('services.postmark.key')),
            'ses', 'ses-v2' => $this->isConfiguredSecret(config('services.ses.key'))
                && $this->isConfiguredSecret(config('services.ses.secret')),
            'sendmail' => true,
            default => false,
        };
    }
}
