<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class VisitorChatGuard
{
    private const MAX_IP_PER_HOUR = 40;
    private const MAX_IP_PER_DAY = 100;
    private const MAX_SESSION_MESSAGES = 20;
    private const MAX_STORE_PER_DAY = 500;
    private const MAX_BODY_LENGTH = 500;

    private const INJECTION_PATTERNS = [
        '/ignore\s+(all\s+)?(previous|prior)\s+instructions/i',
        '/system\s+prompt/i',
        '/you\s+are\s+now\s+a/i',
        '/act\s+as\s+a/i',
        '/jailbreak/i',
        '/dan\s+mode/i',
    ];

    public function handle(Request $request, Closure $next)
    {
        // 1. Global Platform Kill-Switch
        if (Cache::get('visitor_chat_disabled', false)) {
            return response()->json([
                'error' => 'Visitor chat is temporarily disabled for maintenance.'
            ], 503);
        }

        $ip = $request->ip();
        $uuid = $request->route('uuid') ?? $request->input('session_uuid');
        $storeSlug = $request->route('store_slug') ?? $request->input('store_slug');

        $isLocal = app()->environment('local', 'testing') || in_array($ip, ['127.0.0.1', '::1', 'localhost']);

        // 2. Per-IP Rate Limiting (Hourly: 40, Daily: 100) - Bypassed in local/testing
        if (!$isLocal) {
            $ipKey = "chat_guard_ip_{$ip}";
            Cache::add($ipKey, 0, 3600);
            $ipCount = Cache::increment($ipKey);

            if ($ipCount > self::MAX_IP_PER_HOUR) {
                Log::warning("VisitorChatGuard: IP hourly limit exceeded for IP {$ip}");
                return response()->json([
                    'error' => 'Hourly message limit reached for your IP. Please try again later.'
                ], 429);
            }

            $ipDayKey = "chat_guard_ip_day_{$ip}";
            Cache::add($ipDayKey, 0, 86400);
            $ipDayCount = Cache::increment($ipDayKey);

            if ($ipDayCount > self::MAX_IP_PER_DAY) {
                Log::warning("VisitorChatGuard: IP daily limit exceeded for IP {$ip}");
                return response()->json([
                    'error' => 'Daily message limit reached for your IP. Please try again tomorrow.'
                ], 429);
            }
        }

        // 3. Per-Store Daily Limit (500/day) - Bypassed in local/testing
        if ($storeSlug && !$isLocal) {
            $storeDayKey = "chat_guard_store_day_{$storeSlug}";
            Cache::add($storeDayKey, 0, 86400);
            $storeDayCount = Cache::increment($storeDayKey);

            if ($storeDayCount > self::MAX_STORE_PER_DAY) {
                Log::warning("VisitorChatGuard: Store daily limit exceeded for store {$storeSlug}");
                return response()->json([
                    'error' => 'Daily chat limit reached for this store. Please try again tomorrow.'
                ], 429);
            }
        }

        // 4. Per-Session Rate Limiting (20 messages max) - Bypassed in local/testing
        if ($uuid && !$isLocal) {
            $sessionKey = "chat_guard_session_{$uuid}";
            Cache::add($sessionKey, 0, 3600);
            $sessionCount = Cache::increment($sessionKey);

            if ($sessionCount > self::MAX_SESSION_MESSAGES) {
                return response()->json([
                    'error' => 'Session message limit reached for this session.'
                ], 429);
            }
        }

        // 4. Prompt Injection & Body Inspection
        if ($request->has('body')) {
            $body = (string) $request->input('body');

            if (strlen($body) > self::MAX_BODY_LENGTH) {
                $request->merge(['body' => mb_substr($body, 0, self::MAX_BODY_LENGTH)]);
            }

            foreach (self::INJECTION_PATTERNS as $pattern) {
                if (preg_match($pattern, $body)) {
                    Log::warning("VisitorChatGuard: Prompt injection attempt detected from IP {$ip}");
                    return response()->json([
                        'message' => [
                            'sender_type' => 'bot',
                            'sender_name' => 'Support Assistant',
                            'body' => "I am an assistant designed to help with store inquiries. How can I help you today?",
                            'created_at' => now()->toIso8601String(),
                        ]
                    ]);
                }
            }
        }

        $response = $next($request);
        $response->headers->set('X-Visitor-Chat-Guard', 'active');

        return $response;
    }
}
