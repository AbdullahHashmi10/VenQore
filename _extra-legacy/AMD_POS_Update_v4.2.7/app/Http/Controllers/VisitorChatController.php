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
        // Fires on new sessions AND session restores so the queue always reflects
        // current visitor presence without agents needing to manually refresh.
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

        $request->validate([
            'body' => 'required|string|max:10000',
        ]);

        $body = $request->input('body');

        // vena_context is sent by ChatWidget from the /api/vena/context fetch.
        // It is optional — the routing service degrades gracefully without it.
        $venaContext = $request->input('vena_context', []);
        if (!is_array($venaContext)) {
            $venaContext = [];
        }

        $message = $this->routingService->processVisitorMessage($session, $body, $venaContext);

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
