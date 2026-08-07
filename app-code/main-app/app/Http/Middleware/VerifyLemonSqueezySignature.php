<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * VerifyLemonSqueezySignature — Phase 2.1
 *
 * Validates that incoming webhook payloads actually came from Lemon Squeezy.
 * Without this, anyone who discovers your webhook URL can fake a payment
 * and get a free account provisioned.
 *
 * Lemon Squeezy uses HMAC-SHA256 signing:
 *   1. They hash the raw request body with your signing secret.
 *   2. They send the result in the X-Signature header.
 *   3. We compute the same hash and compare.
 *
 * Registration alias: 'lemon-squeezy.signature' (in bootstrap/app.php)
 */
class VerifyLemonSqueezySignature
{
    public function handle(Request $request, Closure $next): Response
    {
        $secret    = config('services.lemon_squeezy.signing_secret');
        $signature = $request->header('X-Signature');

        if (!$secret || !$signature) {
            return response()->json(['error' => 'Missing webhook signature.'], 401);
        }

        // Compute expected signature from raw body
        $rawBody = $request->getContent();
        $expected = hash_hmac('sha256', $rawBody, $secret);

        if (!hash_equals($expected, $signature)) {
            \Illuminate\Support\Facades\Log::warning('Lemon Squeezy webhook signature mismatch', [
                'ip' => $request->ip(),
                'signature' => $signature,
            ]);
            return response()->json(['error' => 'Invalid webhook signature.'], 401);
        }

        return $next($request);
    }
}
