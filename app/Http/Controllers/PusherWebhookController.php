<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PusherWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        // 1. Signature Verification
        $secret = config('broadcasting.connections.pusher.secret');
        $signature = $request->header('X-Pusher-Signature');

        if (!$secret || !$signature) {
            return response()->json(['error' => 'Missing webhook signature.'], 401);
        }

        $computed = hash_hmac('sha256', $request->getContent(), $secret);
        if (!hash_equals($computed, $signature)) {
            Log::warning('Pusher webhook signature mismatch', [
                'ip' => $request->ip(),
                'signature' => $signature,
            ]);
            return response()->json(['error' => 'Invalid webhook signature.'], 401);
        }

        // 2. Replay Attack Lookback Protection (300-second lookback replay window)
        $timeMs = $request->input('time_ms');
        if (!$timeMs || abs(now()->timestamp - (int)($timeMs / 1000)) > 300) {
            return response()->json(['error' => 'Webhook request expired or replay detected.'], 400);
        }

        $events = $request->input('events', []);
        Log::info('Pusher webhook received', [
            'event_count' => count($events),
        ]);

        foreach ($events as $event) {
            $name = $event['name'] ?? '';
            $channel = $event['channel'] ?? '';
            $userId = $event['user_id'] ?? null;
            $data = isset($event['data']) ? json_decode($event['data'], true) : [];

            // Example processing for debugging or future extensions
            Log::info("Processing Pusher event: {$name} on channel {$channel}", [
                'user_id' => $userId,
                'data' => $data,
            ]);
        }

        return response()->json(['ok' => true]);
    }
}
