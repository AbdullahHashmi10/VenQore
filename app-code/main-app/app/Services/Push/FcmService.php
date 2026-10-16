<?php

namespace App\Services\Push;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Sends notifications to the Android app through Firebase Cloud Messaging (HTTP v1).
 *
 * The server signs a short-lived Google sign-in with the service-account key (kept outside git and the
 * web folder), then posts each message. Never throws into a caller: a notification must not be able to
 * break the work that triggered it. A token FCM calls dead is revoked.
 *
 * Messages are lock-screen safe: no customer address or phone.
 */
class FcmService
{
    private const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

    public static function enabled(): bool
    {
        $path = config('fcm.service_account_path');
        return filled($path) && is_readable($path);
    }

    /** Remember (or refresh) a phone for the signed-in person. */
    public static function remember(int $userId, string $token, string $platform = 'android', ?string $appVersion = null): void
    {
        $hash = hash('sha256', $token);
        $row = [
            'user_id' => $userId, 'token' => $token, 'platform' => $platform,
            'app_version' => $appVersion ? mb_substr($appVersion, 0, 40) : null,
            'last_seen_at' => now(), 'revoked_at' => null, 'updated_at' => now(),
        ];
        if (DB::table('device_tokens')->where('token_hash', $hash)->exists()) {
            DB::table('device_tokens')->where('token_hash', $hash)->update($row);
        } else {
            DB::table('device_tokens')->insert($row + ['token_hash' => $hash, 'created_at' => now()]);
        }
    }

    public static function forget(int $userId, string $token): void
    {
        DB::table('device_tokens')->where('user_id', $userId)->where('token_hash', hash('sha256', $token))
            ->update(['revoked_at' => now(), 'updated_at' => now()]);
    }

    /** Alert every active phone of one person. Returns how many were reached. */
    public static function toUser(int $userId, array $message): int
    {
        if (! self::enabled()) {
            return 0;
        }

        $tokens = DB::table('device_tokens')->where('user_id', $userId)->whereNull('revoked_at')->get(['token', 'token_hash']);
        if ($tokens->isEmpty()) {
            return 0;
        }

        try {
            $account = self::account();
            $access = self::accessToken($account);
            $url = 'https://fcm.googleapis.com/v1/projects/' . $account['project_id'] . '/messages:send';
            $reached = 0;

            foreach ($tokens as $t) {
                $res = Http::withToken($access)->timeout(8)->acceptJson()->post($url, ['message' => [
                    'token' => $t->token,
                    'notification' => [
                        'title' => mb_substr((string) ($message['title'] ?? 'VenQore'), 0, 80),
                        'body' => mb_substr((string) ($message['body'] ?? ''), 0, 160),
                    ],
                    'data' => ['url' => (string) ($message['url'] ?? ''), 'tag' => (string) ($message['tag'] ?? 'venqore')],
                    'android' => ['priority' => 'HIGH', 'notification' => ['channel_id' => 'venqore_alerts', 'tag' => (string) ($message['tag'] ?? 'venqore')]],
                ]]);

                if ($res->successful()) {
                    $reached++;
                } elseif (in_array($res->json('error.status'), ['NOT_FOUND', 'UNREGISTERED', 'INVALID_ARGUMENT'], true)) {
                    DB::table('device_tokens')->where('token_hash', $t->token_hash)->update(['revoked_at' => now()]);
                } else {
                    Log::warning('[FCM] send failed: ' . $res->status() . ' ' . $res->json('error.message'));
                }
            }

            return $reached;
        } catch (\Throwable $e) {
            Log::warning('[FCM] ' . $e->getMessage());
            return 0;
        }
    }

    /** @return array{project_id:string, client_email:string, private_key:string} */
    private static function account(): array
    {
        $a = json_decode((string) file_get_contents((string) config('fcm.service_account_path')), true);
        if (! is_array($a) || empty($a['project_id']) || empty($a['client_email']) || empty($a['private_key'])) {
            throw new \RuntimeException('FCM service account file is not valid.');
        }

        return $a;
    }

    private static function accessToken(array $account): string
    {
        return Cache::remember('fcm_access_token:' . md5($account['client_email']), 3000, function () use ($account) {
            $now = time();
            $b64 = fn (string $s) => rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
            $unsigned = $b64(json_encode(['alg' => 'RS256', 'typ' => 'JWT'])) . '.' . $b64(json_encode([
                'iss' => $account['client_email'], 'scope' => self::SCOPE,
                'aud' => 'https://oauth2.googleapis.com/token', 'iat' => $now, 'exp' => $now + 3600,
            ]));
            if (! openssl_sign($unsigned, $sig, $account['private_key'], OPENSSL_ALGO_SHA256)) {
                throw new \RuntimeException('Could not sign the FCM sign-in.');
            }

            $res = Http::asForm()->timeout(8)->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $unsigned . '.' . $b64($sig),
            ]);
            if (! $res->successful() || ! $res->json('access_token')) {
                throw new \RuntimeException('FCM sign-in refused: ' . $res->status());
            }

            return (string) $res->json('access_token');
        });
    }
}
