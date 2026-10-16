<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

/**
 * One-time setup for browser/web-app alerts. Prints a fresh VAPID key pair as .env lines.
 * Keep the private key in the server's .env only; changing the pair later invalidates every
 * existing browser subscription (people would need to turn alerts on again).
 */
class WebPushKeys extends Command
{
    protected $signature = 'webpush:keys';
    protected $description = 'Generate the VAPID key pair used for browser and web-app push alerts';

    public function handle(): int
    {
        if (filled(config('webpush.public_key')) && filled(config('webpush.private_key'))) {
            $this->warn('Keys are already set. Generating new ones would switch off every browser that already allowed alerts.');
            if (! $this->confirm('Print a new pair anyway?', false)) {
                return self::SUCCESS;
            }
        }

        $keys = VAPID::createVapidKeys();

        $this->line('');
        $this->line('Add these to the server .env (the private key stays on the server only):');
        $this->line('');
        $this->line('WEBPUSH_VAPID_PUBLIC_KEY=' . $keys['publicKey']);
        $this->line('WEBPUSH_VAPID_PRIVATE_KEY=' . $keys['privateKey']);
        $this->line('WEBPUSH_VAPID_SUBJECT=mailto:support@venqore.com');
        $this->line('');

        return self::SUCCESS;
    }
}
