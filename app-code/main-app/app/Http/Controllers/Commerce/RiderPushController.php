<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Services\Commerce\DeliveryService;
use App\Services\Push\WebPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * A rider turns delivery alerts on (or off) for the browser/installed web app they are using.
 * Reached two ways, like the rider page itself: from the private rider link (no login), or signed in
 * to "My rides". Either way the subscription is bound to ONE rider of ONE store, resolved on the
 * server, never taken from the request body.
 */
class RiderPushController extends Controller
{
    /** Push services a browser can hand us. The server calls this address later, so nothing else is accepted. */
    private const PUSH_HOSTS = [
        '/^fcm\.googleapis\.com$/',
        '/^updates\.push\.services\.mozilla\.com$/',
        '/\.push\.services\.mozilla\.com$/',
        '/^web\.push\.apple\.com$/',
        '/\.push\.apple\.com$/',
        '/\.notify\.windows\.com$/',
    ];

    public function __construct(private DeliveryService $deliveries)
    {
    }

    public function subscribeByToken(Request $r, string $token): JsonResponse
    {
        $l = $this->deliveries->resolveLink($token);
        abort_unless($l, 404);
        return $this->store($r, (int) $l->tenant_id, (string) $l->employee_id, null);
    }

    public function subscribeMine(Request $r): JsonResponse
    {
        $tenantId = (int) app('current.tenant')->id;
        $l = $this->deliveries->accountFor($tenantId, (int) $r->user()->id);
        abort_unless($l, 403, 'This login is not linked to a rider.');
        return $this->store($r, $tenantId, (string) $l->employee_id, (int) $r->user()->id);
    }

    public function unsubscribeByToken(Request $r, string $token): JsonResponse
    {
        $l = $this->deliveries->resolveLink($token);
        abort_unless($l, 404);
        WebPushService::forget((int) $l->tenant_id, (string) $r->validate(['endpoint' => ['required', 'string', 'max:1000']])['endpoint']);
        return response()->json(['ok' => true]);
    }

    public function unsubscribeMine(Request $r): JsonResponse
    {
        $tenantId = (int) app('current.tenant')->id;
        abort_unless($this->deliveries->accountFor($tenantId, (int) $r->user()->id), 403);
        WebPushService::forget($tenantId, (string) $r->validate(['endpoint' => ['required', 'string', 'max:1000']])['endpoint']);
        return response()->json(['ok' => true]);
    }

    private function store(Request $r, int $tenantId, string $employeeId, ?int $userId): JsonResponse
    {
        abort_unless(WebPushService::enabled(), 503, 'Alerts are not switched on for this server yet.');

        $v = $r->validate([
            'endpoint' => ['required', 'url:https', 'max:1000'],
            'keys.p256dh' => ['required', 'string', 'max:255'],
            'keys.auth' => ['required', 'string', 'max:255'],
            'contentEncoding' => ['nullable', 'in:aes128gcm,aesgcm'],
        ]);

        $host = strtolower((string) parse_url($v['endpoint'], PHP_URL_HOST));
        $known = collect(self::PUSH_HOSTS)->contains(fn ($re) => preg_match($re, $host) === 1);
        abort_unless($known, 422, 'That browser\'s alert service is not supported.');

        WebPushService::remember($tenantId, $employeeId, $userId, $v, $r->userAgent());

        return response()->json(['ok' => true]);
    }
}
