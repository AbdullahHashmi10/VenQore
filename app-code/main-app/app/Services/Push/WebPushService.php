<?php

namespace App\Services\Push;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

/**
 * Sends Web Push messages to the browsers/installed web apps a person has allowed.
 *
 * Never throws into a caller: an alert is a courtesy on top of the real work (assigning a rider,
 * printing a ticket) and must not be able to fail it. A dead subscription (404/410 from the push
 * service) is revoked so it is not tried again.
 *
 * Payloads carry NO customer address or phone: they are shown on a lock screen.
 */
class WebPushService
{
    public static function enabled(): bool
    {
        return filled(config('webpush.public_key')) && filled(config('webpush.private_key'));
    }

    public static function publicKey(): ?string
    {
        return filled(config('webpush.public_key')) ? (string) config('webpush.public_key') : null;
    }

    /** Create or refresh a subscription for a rider employee (and the login behind it, if any). */
    public static function remember(int $tenantId, ?string $employeeId, ?int $userId, array $sub, ?string $userAgent = null): void
    {
        $endpoint = (string) ($sub['endpoint'] ?? '');
        $p256dh = (string) ($sub['keys']['p256dh'] ?? '');
        $auth = (string) ($sub['keys']['auth'] ?? '');

        $encoding = in_array($sub['contentEncoding'] ?? null, ['aes128gcm', 'aesgcm'], true) ? $sub['contentEncoding'] : 'aes128gcm';
        $hash = hash('sha256', $endpoint);
        $row = [
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'employee_id' => $employeeId,
            'endpoint' => $endpoint,
            'p256dh' => $p256dh,
            'auth_token' => $auth,
            'content_encoding' => $encoding,
            'user_agent' => $userAgent ? mb_substr($userAgent, 0, 255) : null,
            'revoked_at' => null,
            'updated_at' => now(),
        ];

        if (DB::table('push_subscriptions')->where('endpoint_hash', $hash)->exists()) {
            DB::table('push_subscriptions')->where('endpoint_hash', $hash)->update($row);
        } else {
            DB::table('push_subscriptions')->insert($row + ['endpoint_hash' => $hash, 'created_at' => now()]);
        }
    }

    /** Stop alerting this browser (the person turned them off or signed out). */
    public static function forget(int $tenantId, string $endpoint): void
    {
        DB::table('push_subscriptions')
            ->where('tenant_id', $tenantId)
            ->where('endpoint_hash', hash('sha256', $endpoint))
            ->update(['revoked_at' => now(), 'updated_at' => now()]);
    }

    /** Alert every active browser of one rider employee. Returns how many were reached. */
    public static function toEmployee(int $tenantId, string $employeeId, array $message): int
    {
        $subs = DB::table('push_subscriptions')
            ->where('tenant_id', $tenantId)
            ->where('employee_id', $employeeId)
            ->whereNull('revoked_at')
            ->get();

        return self::deliver($subs->all(), $message);
    }

    /** Alert every active browser of one login in a store. */
    public static function toUser(int $tenantId, int $userId, array $message): int
    {
        $subs = DB::table('push_subscriptions')
            ->where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->whereNull('revoked_at')
            ->get();

        return self::deliver($subs->all(), $message);
    }

    /**
     * @param  array<int, object>  $subs
     * @param  array{title:string, body?:string, url?:string, tag?:string}  $message
     */
    private static function deliver(array $subs, array $message): int
    {
        if (! self::enabled() || $subs === []) {
            return 0;
        }

        try {
            $webPush = new WebPush([
                'VAPID' => [
                    'subject' => (string) config('webpush.subject'),
                    'publicKey' => (string) config('webpush.public_key'),
                    'privateKey' => (string) config('webpush.private_key'),
                ],
            ], ['TTL' => (int) config('webpush.ttl', 600), 'urgency' => 'high'], 8);

            $payload = json_encode([
                'title' => mb_substr((string) ($message['title'] ?? 'VenQore'), 0, 80),
                'body' => mb_substr((string) ($message['body'] ?? ''), 0, 160),
                'url' => (string) ($message['url'] ?? '/'),
                'tag' => (string) ($message['tag'] ?? 'venqore'),
            ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

            foreach ($subs as $s) {
                $webPush->queueNotification(Subscription::create([
                    'endpoint' => $s->endpoint,
                    'publicKey' => $s->p256dh,
                    'authToken' => $s->auth_token,
                    'contentEncoding' => $s->content_encoding ?: 'aes128gcm',
                ]), $payload);
            }

            $reached = 0;
            foreach ($webPush->flush() as $report) {
                $endpoint = $report->getRequest()->getUri()->__toString();
                if ($report->isSuccess()) {
                    $reached++;
                    DB::table('push_subscriptions')->where('endpoint_hash', hash('sha256', $endpoint))
                        ->update(['last_used_at' => now()]);
                } elseif ($report->isSubscriptionExpired()) {
                    DB::table('push_subscriptions')->where('endpoint_hash', hash('sha256', $endpoint))
                        ->update(['revoked_at' => now(), 'updated_at' => now()]);
                } else {
                    Log::warning('[WebPush] send failed: ' . $report->getReason());
                }
            }

            return $reached;
        } catch (\Throwable $e) {
            Log::warning('[WebPush] ' . $e->getMessage());
            return 0;
        }
    }
}
