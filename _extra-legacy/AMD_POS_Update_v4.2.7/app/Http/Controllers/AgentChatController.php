<?php

namespace App\Http\Controllers;

use App\Events\Chat\MessageSent;
use App\Events\Chat\SessionStatusChanged;
use App\Events\Chat\TypingStarted;
use App\Events\Chat\TypingStopped;
use App\Models\CannedResponse;
use App\Models\ChatMessage;
use App\Models\ChatSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AgentChatController extends Controller
{
    /**
     * Get all active sessions for the current tenant.
     */
    public function sessions(Request $request)
    {
        $sessions = ChatSession::orderByRaw("
                CASE status
                    WHEN 'human_requested' THEN 1
                    WHEN 'agent_active' THEN 2
                    WHEN 'bot_active' THEN 3
                    ELSE 4
                END ASC
            ")
            ->orderBy('updated_at', 'desc')
            ->with(['claimedByAgent:id,name', 'referredToAgent:id,name', 'tenant:id,name'])
            ->get();

        $staff = [];
        $tenantId = null;

        if (app()->bound('current.tenant')) {
            $tenantId = app('current.tenant')->id;
        } elseif (auth()->check() && auth()->user()->last_store_id) {
            $tenantId = auth()->user()->last_store_id;
        }

        if ($tenantId) {
            $staff = \App\Models\TenantUser::where('tenant_id', $tenantId)
                ->where('status', 'active')
                ->with('user:id,name,email')
                ->get()
                ->map(fn($m) => [
                    'id' => $m->user_id,
                    'name' => $m->effectiveName(),
                    'email' => $m->user?->email,
                    'role' => $m->role,
                ])
                ->values();
        }

        return response()->json([
            'sessions' => $sessions->map(fn($s) => [
                'id' => $s->id,
                'session_uuid' => $s->session_uuid,
                'visitor_name' => $s->visitor_name,
                'visitor_email' => $s->visitor_email,
                'status' => $s->status,
                'sub_status' => $s->sub_status,
                'claimed_by' => $s->claimed_by,
                'claimed_by_name' => $s->claimedByAgent?->name,
                'referred_to' => $s->referred_to,
                'referred_to_name' => $s->referredToAgent?->name,
                'tenant_name' => $s->tenant?->name,
                'escalation_reason' => $s->escalation_reason,
                'last_message_at' => $s->last_message_at?->toIso8601String(),
                'updated_at' => $s->updated_at->toIso8601String(),
                'messages' => $s->messages()->get()->map(fn($m) => [
                    'id' => $m->id,
                    'sender_type' => $m->sender_type,
                    'sender_name' => $m->sender_name,
                    'body' => $m->body,
                    'metadata' => $m->metadata,
                    'created_at' => $m->created_at->toIso8601String(),
                ]),
            ]),
            'staff' => $staff
        ]);
    }

    /**
     * Claim a session with optimistic locking protection.
     */
    public function claim(Request $request, string $uuid)
    {
        $session = ChatSession::where('session_uuid', $uuid)->firstOrFail();
        $user = auth()->user();

        // 1. Optimistic Locking Claim Logic
        $lockToken = Str::uuid()->toString();
        $lockExpiry = now()->addSeconds(30);

        $claimed = ChatSession::where('id', $session->id)
            ->where(function ($query) use ($user) {
                $query->whereNull('claimed_by')
                    ->orWhere('claimed_by', $user->id)
                    ->orWhere('claim_lock_expires', '<', now()); // Expired lock
            })
            ->whereIn('status', [
                ChatSession::STATUS_HUMAN_REQUESTED,
                ChatSession::STATUS_BOT_ACTIVE,
                ChatSession::STATUS_IDLE_OFFLINE
            ])
            ->update([
                'status' => ChatSession::STATUS_AGENT_CLAIMED,
                'claimed_by' => $user->id,
                'claimed_at' => now(),
                'claim_lock_token' => $lockToken,
                'claim_lock_expires' => $lockExpiry,
                'ai_disabled' => true,
            ]);

        if (!$claimed) {
            return response()->json([
                'error' => 'claim_failed',
                'message' => 'This session was just claimed by another agent.'
            ], 409);
        }

        // 2. Finalize status to active
        $session->refresh();
        $session->status = ChatSession::STATUS_AGENT_ACTIVE;
        $session->save();

        // 3. Broadcast status change
        broadcast(new SessionStatusChanged($session));

        return response()->json([
            'success' => true,
            'session' => [
                'session_uuid' => $session->session_uuid,
                'status' => $session->status,
                'claimed_by' => $session->claimed_by,
                'claimed_by_name' => $user->name,
            ]
        ]);
    }

    /**
     * Post a reply from an agent.
     */
    public function reply(Request $request, string $uuid)
    {
        $session = ChatSession::where('session_uuid', $uuid)->firstOrFail();
        $user = auth()->user();

        // Guard active ownership
        $isOwner = false;
        if (app()->bound('current.membership')) {
            $isOwner = app('current.membership')->hasRoleAtLeast('owner');
        }
        $isPlatformAdmin = $user->isPlatformAdmin();

        if ($session->claimed_by !== $user->id && !$isOwner && !$isPlatformAdmin) {
            return response()->json([
                'error' => 'session_ownership_conflict',
                'message' => 'This session is currently owned by another agent.',
                'owner' => $session->claimedByAgent?->name ?? 'Unknown',
            ], 409);
        }

        // If not claimed by current user but they are owner/platform admin, or if session is in non-active status, claim/transition it
        if ($session->claimed_by !== $user->id || $session->status !== ChatSession::STATUS_AGENT_ACTIVE) {
            $session->status = ChatSession::STATUS_AGENT_ACTIVE;
            $session->claimed_by = $user->id;
            $session->claimed_at = now();
            $session->ai_disabled = true;
            $session->save();
            broadcast(new SessionStatusChanged($session));
        }

        $request->validate([
            'body' => 'required|string|max:10000',
        ]);

        $message = ChatMessage::create([
            'session_id' => $session->id,
            'sender_type' => ChatMessage::SENDER_AGENT,
            'sender_id' => $user->id,
            'sender_name' => $user->displayNameIn($session->tenant_id),
            'body' => $request->input('body'),
        ]);

        $session->update(['last_message_at' => now()]);

        // Broadcast to customer and other agents
        broadcast(new MessageSent($message, $session->session_uuid));

        // ── Passive Learning Engine Loop ──────────────────────────────────
        try {
            // Find the last visitor message as the "question"
            $lastVisitorMsg = ChatMessage::where('session_id', $session->id)
                ->where('sender_type', ChatMessage::SENDER_VISITOR)
                ->orderBy('created_at', 'desc')
                ->first();

            $questionText = $lastVisitorMsg ? $lastVisitorMsg->body : '';
            
            // Get suggestion from request
            $venaSuggestionText = $request->input('vena_suggestion');
            
            if ($lastVisitorMsg) {
                $learningService = app(\App\Services\KnowledgeLearningService::class);
                $learningService->learn(
                    $session->session_uuid,
                    $questionText,
                    $venaSuggestionText,
                    $message->body
                );
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Passive learning execution failed: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => [
                'id' => $message->id,
                'sender_type' => $message->sender_type,
                'sender_name' => $message->sender_name,
                'body' => $message->body,
                'created_at' => $message->created_at->toIso8601String(),
            ]
        ]);
    }

    /**
     * Broadcast agent typing activity.
     */
    public function typing(Request $request, string $uuid)
    {
        $session = ChatSession::where('session_uuid', $uuid)->firstOrFail();
        $user = auth()->user();

        $isTyping = $request->boolean('typing');
        $senderName = $user->name;

        if ($isTyping) {
            broadcast(new TypingStarted($session->session_uuid, 'agent', $senderName))->toOthers();
        } else {
            broadcast(new TypingStopped($session->session_uuid, 'agent', $senderName))->toOthers();
        }

        return response()->json(['success' => true]);
    }

    /**
     * Release a session back into the queue.
     */
    public function release(Request $request, string $uuid)
    {
        $session = ChatSession::where('session_uuid', $uuid)->firstOrFail();
        $user = auth()->user();

        if ($session->claimed_by !== $user->id) {
            return response()->json(['error' => 'You do not own this session.'], 403);
        }

        DB::transaction(function () use ($session) {
            $session->status = ChatSession::STATUS_HUMAN_REQUESTED;
            $session->claimed_by = null;
            $session->claimed_at = null;
            $session->claim_lock_token = null;
            $session->claim_lock_expires = null;
            $session->save();

            broadcast(new SessionStatusChanged($session));

            $sysMsg = ChatMessage::create([
                'session_id' => $session->id,
                'sender_type' => ChatMessage::SENDER_SYSTEM,
                'sender_name' => 'System',
                'body' => "The agent has returned this chat session to the support queue. Another agent will assist you shortly."
            ]);
            broadcast(new MessageSent($sysMsg, $session->session_uuid));
        });

        return response()->json(['success' => true]);
    }

    /**
     * Resolve / close a chat session.
     */
    public function resolve(Request $request, string $uuid)
    {
        $session = ChatSession::where('session_uuid', $uuid)->firstOrFail();
        $user = auth()->user();

        if ($session->claimed_by !== $user->id && !$user->isPlatformAdmin()) {
            return response()->json(['error' => 'You do not own this session.'], 403);
        }

        DB::transaction(function () use ($session) {
            $session->status = ChatSession::STATUS_RESOLVED;
            $session->resolved_at = now();
            $session->save();

            broadcast(new SessionStatusChanged($session));

            $sysMsg = ChatMessage::create([
                'session_id' => $session->id,
                'sender_type' => ChatMessage::SENDER_SYSTEM,
                'sender_name' => 'System',
                'body' => "This support session has been resolved. Thank you!"
            ]);
            broadcast(new MessageSent($sysMsg, $session->session_uuid));
        });

        return response()->json(['success' => true]);
    }

    /**
     * Get canned responses list.
     */
    public function cannedResponses()
    {
        $responses = CannedResponse::orderBy('shortcode')->get();

        return response()->json([
            'canned_responses' => $responses->map(fn($r) => [
                'shortcode' => $r->shortcode,
                'title' => $r->title,
                'body' => $r->body,
            ])
        ]);
    }

    /**
     * Handoff a session back to the AI.
     */
    public function handoffToAi(Request $request, string $uuid)
    {
        $session = ChatSession::where('session_uuid', $uuid)->firstOrFail();
        $user = auth()->user();

        // Check platform admin or store owner/staff membership
        $isOwner = false;
        if (app()->bound('current.membership')) {
            $isOwner = app('current.membership')->hasRoleAtLeast('owner');
        }
        $isPlatformAdmin = $user->isPlatformAdmin();

        if ($session->claimed_by !== $user->id && !$isOwner && !$isPlatformAdmin) {
            // Must belong to this store if not owner/admin
            $hasMembership = \App\Models\TenantUser::where('tenant_id', $session->tenant_id)
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->exists();
            if (!$hasMembership) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }

        $routingService = app(\App\Services\ChatRoutingService::class);
        $routingService->handBackToAi($session);

        return response()->json([
            'success' => true,
            'session' => [
                'session_uuid' => $session->session_uuid,
                'status' => $session->status,
                'claimed_by' => $session->claimed_by,
                'referred_to' => $session->referred_to,
            ]
        ]);
    }

    /**
     * Refer a session to another store staff member.
     */
    public function refer(Request $request, string $uuid)
    {
        $session = ChatSession::where('session_uuid', $uuid)->firstOrFail();
        $user = auth()->user();

        $request->validate([
            'user_id' => 'nullable|integer|exists:users,id'
        ]);

        $userId = $request->input('user_id');

        if ($userId) {
            // Verify membership
            $membershipExists = \App\Models\TenantUser::where('tenant_id', $session->tenant_id)
                ->where('user_id', $userId)
                ->where('status', 'active')
                ->exists();
            if (!$membershipExists) {
                return response()->json([
                    'error' => 'invalid_referral',
                    'message' => 'The selected user is not an active staff member of this store.'
                ], 422);
            }
        }

        DB::transaction(function () use ($session, $userId) {
            $session->referred_to = $userId;
            $session->status = ChatSession::STATUS_HUMAN_REQUESTED;
            $session->claimed_by = null;
            $session->claimed_at = null;
            $session->claim_lock_token = null;
            $session->claim_lock_expires = null;
            $session->save();

            broadcast(new SessionStatusChanged($session));

            $referredName = $userId ? \App\Models\User::find($userId)->name : 'anyone';
            $sysMsg = ChatMessage::create([
                'session_id' => $session->id,
                'sender_type' => ChatMessage::SENDER_SYSTEM,
                'sender_name' => 'System',
                'body' => "This chat has been referred to " . $referredName . "."
            ]);
            broadcast(new MessageSent($sysMsg, $session->session_uuid));
        });

        return response()->json([
            'success' => true,
            'session' => [
                'session_uuid' => $session->session_uuid,
                'status' => $session->status,
                'referred_to' => $session->referred_to,
            ]
        ]);
    }

    /**
     * Set the custom sub-status (e.g. fixed, pending, active, resolved).
     */
    public function setStatus(Request $request, string $uuid)
    {
        $session = ChatSession::where('session_uuid', $uuid)->firstOrFail();
        $user = auth()->user();

        $request->validate([
            'sub_status' => 'nullable|string|in:active,fixed,pending,resolved'
        ]);

        $subStatus = $request->input('sub_status');

        DB::transaction(function () use ($session, $subStatus) {
            $session->sub_status = $subStatus;
            if ($subStatus === 'resolved') {
                $session->status = ChatSession::STATUS_RESOLVED;
                $session->resolved_at = now();
            }
            $session->save();

            broadcast(new SessionStatusChanged($session));

            if ($subStatus === 'resolved') {
                $sysMsg = ChatMessage::create([
                    'session_id' => $session->id,
                    'sender_type' => ChatMessage::SENDER_SYSTEM,
                    'sender_name' => 'System',
                    'body' => "This support session has been resolved. Thank you!"
                ]);
                broadcast(new MessageSent($sysMsg, $session->session_uuid));
            } else {
                $sysMsg = ChatMessage::create([
                    'session_id' => $session->id,
                    'sender_type' => ChatMessage::SENDER_SYSTEM,
                    'sender_name' => 'System',
                    'body' => "Session status marked as: " . ucfirst($subStatus) . "."
                ]);
                broadcast(new MessageSent($sysMsg, $session->session_uuid));
            }
        });

        return response()->json([
            'success' => true,
            'session' => [
                'session_uuid' => $session->session_uuid,
                'status' => $session->status,
                'sub_status' => $session->sub_status,
            ]
        ]);
    }

    /**
     * Log a resolved support session into the AI Learning Engine.
     */
    public function logLearning(Request $request, string $uuid)
    {
        $session = ChatSession::where('session_uuid', $uuid)->firstOrFail();
        $user = auth()->user();

        $request->validate([
            'category' => 'required|string|in:general,billing,checkout,features,bug',
            'problem' => 'required|string|max:10000',
            'solution' => 'required|string|max:10000',
        ]);

        DB::transaction(function () use ($session, $user, $request) {
            // Save log record
            \App\Models\ChatLearningLog::create([
                'chat_session_id' => $session->id,
                'agent_id' => $user->id,
                'category' => $request->input('category'),
                'problem' => $request->input('problem'),
                'solution' => $request->input('solution'),
            ]);

            // Resolve chat
            $session->status = ChatSession::STATUS_RESOLVED;
            $session->sub_status = 'resolved';
            $session->resolved_at = now();
            $session->save();

            broadcast(new SessionStatusChanged($session));

            $sysMsg = ChatMessage::create([
                'session_id' => $session->id,
                'sender_type' => ChatMessage::SENDER_SYSTEM,
                'sender_name' => 'System',
                'body' => "This support session has been resolved and logged in the AI Learning Engine. Thank you!"
            ]);
            broadcast(new MessageSent($sysMsg, $session->session_uuid));
        });

        return response()->json(['success' => true]);
    }

    /**
     * Get Vena Suggested Co-pilot reply suggestions.
     */
    public function assistSuggestion(Request $request, string $uuid)
    {
        $session = ChatSession::where('session_uuid', $uuid)->firstOrFail();

        try {
            $aiService = app(\App\Services\ChatAIService::class);

            $history = $session->messages()
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->reverse()
                ->toArray();

            $suggestionPrompt = "[System: You are acting as an internal co-pilot AI assistant for a human support agent. Please analyze the chat history and draft a high-quality suggested response that the agent can send to the customer. Return ONLY the suggested reply body, with no notes or conversational preamble.]";
            $suggestedReplyResult = $aiService->respond($history, $suggestionPrompt);
            $suggestedReply = $suggestedReplyResult['text'] ?? '';

            return response()->json([
                'success' => true,
                'suggestion' => $suggestedReply,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate suggestion: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a session and all its messages.
     */
    public function destroy(string $uuid)
    {
        $session = ChatSession::where('session_uuid', $uuid)->firstOrFail();

        DB::transaction(function () use ($session) {
            $session->messages()->delete();
            $session->delete();
        });

        // Broadcast a 'deleted' status to clean up other clients
        try {
            $session->status = 'deleted';
            broadcast(new SessionStatusChanged($session));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Broadcasting SessionStatusChanged for deletion failed: " . $e->getMessage());
        }

        return response()->json(['success' => true]);
    }
}
