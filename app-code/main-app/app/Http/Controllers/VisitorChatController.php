<?php

namespace App\Http\Controllers;

use App\Events\Chat\TypingStarted;
use App\Events\Chat\TypingStopped;
use App\Models\ChatSession;
use App\Services\ChatRoutingService;
use App\Services\PlanGate;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VisitorChatController extends Controller
{
    private ChatRoutingService $routingService;

    public function __construct(ChatRoutingService $routingService)
    {
        $this->routingService = $routingService;
    }

    /**
     * Resolve and bind the current tenant context.
     */
    private function resolveTenant(string $storeSlug): bool
    {
        // Use without tenant scope to lookup the tenant itself
        $tenant = \App\Models\Tenant::where('slug', $storeSlug)->first();
        if ($tenant) {
            app()->instance('current.tenant', $tenant);
            return true;
        }
        return false;
    }

    /**
     * Start a new chat session or restore an existing one.
     */
    public function startSession(Request $request, string $storeSlug)
    {
        if (!$this->resolveTenant($storeSlug)) {
            return response()->json(['error' => 'Store context not resolved.'], 400);
        }

        // ── Turnstile Verification (T0-0) ──────────────────────────────────
        $turnstileSecret = config('services.cloudflare.turnstile_secret_key');
        if (!empty($turnstileSecret)) {
            $token = $request->input('turnstile_token');
            if (empty($token)) {
                return response()->json([
                    'success' => false,
                    'error'   => 'CAPTCHA verification token required.',
                    'reason'  => 'turnstile_missing',
                ], 422);
            }

            $verifyRes = \Illuminate\Support\Facades\Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret'   => $turnstileSecret,
                'response' => $token,
                'remoteip' => $request->ip(),
            ]);

            if (!$verifyRes->json('success')) {
                return response()->json([
                    'success' => false,
                    'error'   => 'CAPTCHA verification failed. Please try again.',
                    'reason'  => 'turnstile_failed',
                ], 422);
            }
        }

        // ── Plan Gate: Live Chat Widget ──────────────────────────────────
        if (app()->bound('current.tenant')) {
            PlanGate::enforce('live_chat_widget');
        }

        $uuid = $request->input('session_uuid');
        $tenant = app('current.tenant');
        $session = null;

        if ($uuid) {
            // Attempt to restore existing session
            $session = ChatSession::where('session_uuid', $uuid)
                ->where('tenant_id', $tenant->id)
                ->first();
        }

        // Create new session if none found or if original session was resolved
        if (!$session || $session->status === ChatSession::STATUS_RESOLVED) {
            $session = ChatSession::create([
                'tenant_id' => $tenant->id,
                'session_uuid' => Str::uuid()->toString(),
                'status' => ChatSession::STATUS_BOT_ACTIVE,
                'visitor_name' => $request->input('visitor_name', 'Guest'),
                'visitor_email' => $request->input('visitor_email'),
            ]);
        }

        // Broadcast to agent inbox so Support Queue updates in real-time.
        try {
            broadcast(new \App\Events\Chat\SessionStatusChanged($session));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Broadcasting SessionStatusChanged failed: " . $e->getMessage());
        }

        // Return session detail along with history
        return response()->json([
            'session_uuid' => $session->session_uuid,
            'status' => $session->status,
            'visitor_name' => $session->visitor_name,
            'visitor_email' => $session->visitor_email,
            'messages' => $session->messages()->get()->map(fn($m) => [
                'id' => $m->id,
                'sender_type' => $m->sender_type,
                'sender_name' => $m->sender_name,
                'body' => $m->body,
                'metadata' => $m->metadata,
                'created_at' => $m->created_at->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Post a new message from the visitor chat widget.
     */
    public function sendMessage(Request $request, string $storeSlug, string $uuid)
    {
        if (!$this->resolveTenant($storeSlug)) {
            return response()->json(['error' => 'Store context not resolved.'], 400);
        }

        $tenant = app('current.tenant');
        $session = ChatSession::where('session_uuid', $uuid)
            ->where('tenant_id', $tenant->id)
            ->firstOrFail();

        if ($session->status === ChatSession::STATUS_RESOLVED) {
            $session->update([
                'status' => ChatSession::STATUS_BOT_ACTIVE,
                'ai_disabled' => false,
                'claimed_by' => null,
                'referred_to' => null,
                'claim_lock_token' => null,
                'claim_lock_expires' => null,
                'resolved_at' => null,
            ]);
            try {
                broadcast(new \App\Events\Chat\SessionStatusChanged($session));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning("Broadcasting SessionStatusChanged failed: " . $e->getMessage());
            }
        }

        // SECURITY (T0-0): max 500 characters
        $request->validate([
            'body' => 'required|string|max:500',
        ]);

        $body = $request->input('body');

        // 1. Rate Limiter (T0-7 & FIX-2) — bucket visitor_chat:tenant_id
        $rateLimiter = app(\App\Services\Ai\AiRateLimiter::class);
        $rateCheck = $rateLimiter->tryAcquire("visitor_chat:{$tenant->id}");
        if (!$rateCheck['ok']) {
            return response()->json([
                'error' => 'Visitor chat is busy right now. Please wait a few seconds and try again.'
            ], 429);
        }

        // 2. Spend Guard Pre-Check (T0-0 A3 & FIX-2 & FIX-3)
        $estimatedCost = (float) config('ai_limits.features.visitor_chat.estimated_cost', 0.0010);
        $spendCap = (float) config('ai_limits.features.visitor_chat.spend_cap', 3.00);
        $spendGuard = app(\App\Services\Ai\AiSpendGuard::class);
        if (!$spendGuard->checkAndRecord("visitor_chat:{$tenant->id}", $estimatedCost, $spendCap)) {
            $alertKey = 'visitor_chat_spend_alert_' . today()->toDateString();
            if (!\Illuminate\Support\Facades\Cache::has($alertKey)) {
                \Illuminate\Support\Facades\Cache::put($alertKey, true, 86400);
                \Illuminate\Support\Facades\Log::emergency("ALERT: Visitor chat daily spend cap ($spendCap) tripped for tenant {$tenant->id}. Switching to email capture fallback.");
            }

            $fallbackMsg = \App\Models\ChatMessage::create([
                'tenant_id' => $tenant->id,
                'chat_session_id' => $session->id,
                'sender_type' => \App\Models\ChatMessage::SENDER_BOT,
                'sender_name' => 'Support Assistant',
                'body' => "Our AI assistant is temporarily busy right now. Please leave your email address and our team will get back to you shortly!",
                'metadata' => ['fallback' => 'spend_cap'],
            ]);

            return response()->json([
                'success' => true,
                'message' => [
                    'id' => $fallbackMsg->id,
                    'sender_type' => $fallbackMsg->sender_type,
                    'sender_name' => $fallbackMsg->sender_name,
                    'body' => $fallbackMsg->body,
                    'metadata' => $fallbackMsg->metadata,
                    'created_at' => $fallbackMsg->created_at->toIso8601String(),
                ]
            ]);
        }

        // 3. Answer Cache Lookup (T0-0 A5)
        $normalizedQuestion = preg_replace('/\s+/', ' ', strtolower(trim($body)));
        $questionHash = hash('sha256', $normalizedQuestion);

        $cached = \Illuminate\Support\Facades\DB::table('visitor_chat_cached_answers')
            ->where('store_id', $tenant->id)
            ->where('question_hash', $questionHash)
            ->first();

        if ($cached) {
            \Illuminate\Support\Facades\DB::table('visitor_chat_cached_answers')
                ->where('id', $cached->id)
                ->increment('hits');

            // Reconcile spend counter: cache hit costs $0.00 AI spend
            $spendGuard->reconcile('visitor_chat', $estimatedCost, 0.0);

            $cachedMsg = \App\Models\ChatMessage::create([
                'tenant_id' => $tenant->id,
                'chat_session_id' => $session->id,
                'sender_type' => \App\Models\ChatMessage::SENDER_BOT,
                'sender_name' => 'Support Assistant',
                'body' => $cached->answer,
                'metadata' => ['cached' => true],
            ]);

            return response()->json([
                'success' => true,
                'message' => [
                    'id' => $cachedMsg->id,
                    'sender_type' => $cachedMsg->sender_type,
                    'sender_name' => $cachedMsg->sender_name,
                    'body' => $cachedMsg->body,
                    'metadata' => $cachedMsg->metadata,
                    'created_at' => $cachedMsg->created_at->toIso8601String(),
                ]
            ]);
        }

        // vena_context is sent by ChatWidget from the /api/vena/context fetch.
        $venaContext = $request->input('vena_context', []);
        if (!is_array($venaContext)) {
            $venaContext = [];
        }

        $message = $this->routingService->processVisitorMessage($session, $body, $venaContext);

        // Reconcile spend counter with actual cost
        $actualCost = (float) ($message->metadata['cost_usd'] ?? 0.0002);
        $spendGuard->reconcile('visitor_chat', $estimatedCost, $actualCost);

        // Store generated answer in cache for this store + hash
        if ($message && $message->sender_type === \App\Models\ChatMessage::SENDER_BOT && !empty($message->body)) {
            \Illuminate\Support\Facades\DB::table('visitor_chat_cached_answers')->insertOrIgnore([
                'store_id'      => $tenant->id,
                'question_hash' => $questionHash,
                'answer'        => $message->body,
                'hits'          => 1,
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => [
                'id' => $message->id,
                'sender_type' => $message->sender_type,
                'sender_name' => $message->sender_name,
                'body' => $message->body,
                'metadata' => $message->metadata,
                'created_at' => $message->created_at->toIso8601String(),
            ]
        ]);
    }

    /**
     * Broadcast visitor typing events.
     */
    public function typing(Request $request, string $storeSlug, string $uuid)
    {
        if (!$this->resolveTenant($storeSlug)) {
            return response()->json(['error' => 'Store context not resolved.'], 400);
        }

        $tenant = app('current.tenant');
        $session = ChatSession::where('session_uuid', $uuid)
            ->where('tenant_id', $tenant->id)
            ->firstOrFail();

        $isTyping = $request->boolean('typing');
        $senderName = $session->visitor_name ?? 'Visitor';

        try {
            if ($isTyping) {
                broadcast(new TypingStarted($session->session_uuid, 'visitor', $senderName))->toOthers();
            } else {
                broadcast(new TypingStopped($session->session_uuid, 'visitor', $senderName))->toOthers();
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Broadcasting visitor typing failed: " . $e->getMessage());
        }

        return response()->json(['success' => true]);
    }
}
