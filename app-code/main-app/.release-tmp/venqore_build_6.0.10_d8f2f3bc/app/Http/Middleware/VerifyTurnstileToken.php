<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class VerifyTurnstileToken
{
    /**
     * Handle an incoming request and verify Cloudflare Turnstile token.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $secretKey = config('services.cloudflare.turnstile_secret_key');

        // Fail open when not configured (local development, testing, staging without keys).
        // N25 (2026-09-10): in PRODUCTION a missing key fails CLOSED — a silently
        // disabled bot check on public, email-sending and AI-spending routes is
        // worse than a visible error. Set TURNSTILE keys before launch.
        if (empty($secretKey) || $secretKey === 'REPLACE_ME_TURNSTILE_SECRET_KEY') {
            if (app()->environment('production') && !config('services.cloudflare.turnstile_allow_missing_in_production', false)) {
                Log::critical('[Turnstile] Secret key missing in production — refusing protected request', ['path' => $request->path()]);
                return $request->expectsJson()
                    ? response()->json(['success' => false, 'message' => 'This form is temporarily unavailable. Please email us directly.'], 503)
                    : back()->withErrors(['turnstile' => 'This form is temporarily unavailable. Please try again later.']);
            }
            return $next($request);
        }

        $token = $request->input('cf-turnstile-response')
            ?: $request->header('X-Turnstile-Token')
            ?: $request->input('turnstile_token');

        if (empty($token)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Security verification required. Please complete the captcha.',
                ], 422);
            }

            return back()->withErrors([
                'turnstile' => 'Security verification required. Please try again.',
            ]);
        }

        try {
            $response = Http::asForm()->timeout(5)->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret'   => $secretKey,
                'response' => $token,
                'remoteip' => $request->ip(),
            ]);

            if (!$response->successful() || !($response->json('success') ?? false)) {
                Log::warning('[Turnstile] Verification failed', [
                    'ip'      => $request->ip(),
                    'errors'  => $response->json('error-codes', []),
                ]);

                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Security check failed. Please refresh and try again.',
                    ], 422);
                }

                return back()->withErrors([
                    'turnstile' => 'Security check failed. Please refresh and try again.',
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('[Turnstile] Connection error during verification', [
                'error' => $e->getMessage(),
            ]);
            // On upstream network error, fail open or log rather than completely breaking users
        }

        return $next($request);
    }
}
