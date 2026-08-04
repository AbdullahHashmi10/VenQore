<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class VisitorChatGuard
{
    private const MAX_IP_PER_HOUR = 20;
    private const MAX_SESSION_PER_HOUR = 15;
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

        // 2. Per-IP Rate Limiting
        $ipKey = "chat_guard_ip_{$ip}";
        $ipCount = Cache::increment($ipKey);
        if ($ipCount === 1) {
            Cache::put($ipKey, 1, 3600); // 1 hour window
        }

        if ($ipCount > self::MAX_IP_PER_HOUR) {
            Log::warning("VisitorChatGuard: IP limit exceeded for IP {$ip}");
            return response()->json([
                'error' => 'Rate limit exceeded. Please try again later.'
            ], 429);
        }

        // 3. Per-Session Rate Limiting
        if ($uuid) {
            $sessionKey = "chat_guard_session_{$uuid}";
            $sessionCount = Cache::increment($sessionKey);
            if ($sessionCount === 1) {
                Cache::put($sessionKey, 1, 3600);
            }

            if ($sessionCount > self::MAX_SESSION_PER_HOUR) {
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
