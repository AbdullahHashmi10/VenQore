<?php

namespace App\Services;

use App\Events\Chat\MessageSent;
use App\Events\Chat\SessionStatusChanged;
use App\Models\ActivityLog;
use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Models\SupportTicket;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ChatRoutingService
{
    private ChatAIService $aiService;

    // Keywords that signal the user WANTS a human — used as a secondary signal
    // only after 3+ messages, not as a first-response trigger.
    private array $handoffKeywords = [
        'human', 'agent', 'operator', 'manager', 'real person',
        'talk to someone', 'support staff', 'not helping', 'frustrated',
        'escalate', 'complaint', 'refund issue', 'billing problem',
        'help from person', 'live chat', 'representative'
    ];

    public function __construct(ChatAIService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Process an incoming message from the visitor chat widget.
     *
     * Session isolation guarantee:
     *   $session is always looked up by (session_uuid + tenant_id) in VisitorChatController.
     *   ChatMessage records are fetched via $session->messages() which applies a session_id FK.
     *   There is NO cross-session data bleed possible at the query level.
     *
     * @param ChatSession $session
     * @param string      $body        Visitor's incoming message text.
     * @param array       $venaContext Subscription context from /api/vena/context (optional).
     */
    public function processVisitorMessage(ChatSession $session, string $body, array $venaContext = []): ChatMessage
    {
        // 1. Save visitor message to database
        $message = ChatMessage::create([
            'session_id' => $session->id,
            'sender_type' => ChatMessage::SENDER_VISITOR,
            'sender_name' => $session->visitor_name ?? 'Visitor',
            'body' => $body,
        ]);

        // Update session's last activity timestamp
        $session->update(['last_message_at' => now()]);

        // 2. Broadcast message to all subscriber channels (visitor + agent)
        // No ->toOthers() — the widget handles deduplication via the temp-id swap on POST response.
        $this->safeBroadcast(new MessageSent($message, $session->session_uuid));

        // 3. Skip AI processing if session is already claimed or AI is disabled
        if ($session->status !== ChatSession::STATUS_BOT_ACTIVE || $session->ai_disabled) {
            return $message;
        }

        // 4. Count how many messages the visitor has sent in this session
        // Escalation on keyword is only valid after the visitor has already received
        // at least 2 Vena responses (3 visitor messages) — prevents first-message handoff.
        $visitorMessageCount = $session->messages()
            ->where('sender_type', ChatMessage::SENDER_VISITOR)
            ->count();

        $hasHadRealConversation = $visitorMessageCount >= 3;

        // 5. Intent detection — only fire handoff if user has had a real conversation
        // and is still asking for a human. Prevents cold first-message escalation.
        if ($hasHadRealConversation && $this->detectsHandoffIntent($body)) {
            $this->triggerHandoff($session, 'intent_keyword');
            return $message;
        }

        // 6. Query AI Assistant (Vena) with subscription context
        try {
            // Get the last 14 messages BEFORE the current one as conversation history.
            // We exclude the just-saved visitor message ($message->id) because
            // ChatAIService::respond() appends $body as the final user turn separately.
            // Including it here would send the message twice (user→user), breaking Gemini's
            // alternating turn format and causing confused/off-topic replies.
            $history = $session->messages()
                ->where('id', '!=', $message->id)
                ->orderBy('created_at', 'desc')
                ->limit(14)
                ->get()
                ->reverse()
                ->toArray();

            // Pass venaContext so the AI prompt can inject subscription-awareness
            $aiResponse = $this->aiService->respond($history, $body, $venaContext);
            $aiReply = $aiResponse['text'];
            $usage = $aiResponse['usage'] ?? [];

            // Save AI reply as bot message
            $botMessage = ChatMessage::create([
                'session_id' => $session->id,
                'sender_type' => ChatMessage::SENDER_BOT,
                'sender_name' => 'Vena',
                'body' => $aiReply,
                'metadata' => [
                    'prompt_tokens' => $usage['promptTokenCount'] ?? null,
                    'completion_tokens' => $usage['candidatesTokenCount'] ?? null,
                    'total_tokens' => $usage['totalTokenCount'] ?? null,
                    'model' => $aiResponse['model'] ?? null,
                    'api_key_type' => $aiResponse['api_key_type'] ?? null,
                ],
            ]);

            // Broadcast AI reply to visitor/agent channels
            $this->safeBroadcast(new MessageSent($botMessage, $session->session_uuid));

            // If AI itself embedded a handoff action button, honour the escalation
            if (str_contains($aiReply, 'action:handoff')) {
                $this->triggerHandoff($session, 'ai_suggested_handoff');
            }

        } catch (\Exception $e) {
            // Silent failure: AI API down/timeout — never expose raw errors to visitor
            Log::error("Chatbot AI API Error: " . $e->getMessage() . "\nStack Trace: " . $e->getTraceAsString());

            // Silently move visitor to human queue
            $this->triggerHandoff($session, 'ai_api_failure');
        }

        return $message;
    }

    /**
     * Trigger session handoff to human support staff.
     */
    public function triggerHandoff(ChatSession $session, string $reason): void
    {
        // ── Plan check: Starter and LTD 1 cannot escalate to human ──
        $tenant = $session->tenant;
        if ($tenant && in_array($tenant->plan, ['starter', 'ltd_1'])) {
            // Post a bot message explaining the plan limitation
            $limitationMsg = ChatMessage::create([
                'session_id' => $session->id,
                'sender_type' => ChatMessage::SENDER_BOT,
                'sender_name' => 'Vena',
                'body' => "Live agent support is not available on your plan. Please upgrade to a Growth or Business plan to chat with a live agent, or reach out to our team via email.",
            ]);
            $this->safeBroadcast(new MessageSent($limitationMsg, $session->session_uuid));
            return;
        }

        DB::transaction(function () use ($session, $reason) {
            // 1. Transition state
            $session->status = ChatSession::STATUS_HUMAN_REQUESTED;
            $session->ai_disabled = true;
            $session->escalation_reason = $reason;
            $session->save();

            // 2. Broadcast state change
            $this->safeBroadcast(new SessionStatusChanged($session));

            // 3. Post system message
            $systemMsg = ChatMessage::create([
                'session_id' => $session->id,
                'sender_type' => ChatMessage::SENDER_SYSTEM,
                'sender_name' => 'System',
                'body' => "Connecting you to our support team. A team member will join shortly.",
            ]);
            $this->safeBroadcast(new MessageSent($systemMsg, $session->session_uuid));

            // 4. Check agent online presence
            if (!$this->isAgentOnline((string) $session->tenant_id)) {
                // No agents online — post offline message & auto-generate a support ticket
                $offlineMsg = ChatMessage::create([
                    'session_id' => $session->id,
                    'sender_type' => ChatMessage::SENDER_BOT,
                    'sender_name' => 'Support',
                    'body' => "Our team is currently offline. We have logged your conversation and will follow up with you shortly.",
                ]);
                $this->safeBroadcast(new MessageSent($offlineMsg, $session->session_uuid));

                $session->status = ChatSession::STATUS_IDLE_OFFLINE;
                $session->save();

                $this->safeBroadcast(new SessionStatusChanged($session));

                $this->createTicket($session, $reason);
            }
        });
    }

    /**
     * Parse message text for human handoff keywords.
     * This is a secondary signal — only called after 3+ visitor messages.
     */
    public function detectsHandoffIntent(string $body): bool
    {
        $lower = strtolower($body);
        foreach ($this->handoffKeywords as $keyword) {
            if (str_contains($lower, $keyword)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Determine if any support agent / admin for the tenant is online.
     * Uses activity logs: any log in the last 15 minutes = agent online.
     */
    public function isAgentOnline(string $tenantId): bool
    {
        return ActivityLog::withoutTenantScope()
            ->where('tenant_id', $tenantId)
            ->where('created_at', '>=', now()->subMinutes(15))
            ->exists();
    }

    /**
     * Auto-create a support ticket from an offline or escalated chat session.
     * Tagged with source = 'vena_chat' so it appears in the Vena Tickets page.
     */
    private function createTicket(ChatSession $session, string $escalationReason = ''): void
    {
        if ($session->ticket_created) {
            return;
        }

        // Build full message thread log
        $messages = $session->messages()
            ->orderBy('created_at', 'asc')
            ->get();

        $chatLog = "";
        foreach ($messages as $msg) {
            $sender  = ucfirst($msg->sender_type);
            $chatLog .= "[{$msg->created_at->format('Y-m-d H:i:s')}] {$sender}: {$msg->body}\n";
        }

        // Categorise reason for the ticket inbox
        $reasonCategory = match ($escalationReason) {
            'ai_api_failure'       => 'ai_failure',
            'ai_suggested_handoff' => 'billing_or_complex',
            'intent_keyword'       => 'user_requested',
            default                => 'repeated_failure',
        };

        $ticketBody = "This ticket was auto-generated from a Vena chat session.\n\n"
            . "Customer Name:    " . ($session->visitor_name  ?? 'Visitor')        . "\n"
            . "Customer Email:   " . ($session->visitor_email ?? 'Not provided')   . "\n"
            . "Session UUID:     {$session->session_uuid}\n"
            . "Escalation Cause: {$reasonCategory}\n\n"
            . "--- CHAT TRANSCRIPT ---\n"
            . $chatLog;

        SupportTicket::withoutTenantScope()->create([
            'tenant_id'       => $session->tenant_id,
            'subject'         => "Chat Escalation – " . substr($session->session_uuid, 0, 8),
            'message'         => $ticketBody,
            'status'          => 'open',
            'priority'        => 'high',
            'source'          => 'vena_chat',
            'escalation_type' => $reasonCategory,
            'requester_email' => $session->visitor_email ?? 'support-offline@venqore.com',
            'requester_name'  => $session->visitor_name  ?? 'Website Visitor',
        ]);

        $session->update(['ticket_created' => true]);
    }

    /**
     * Hand the conversation back to the AI (Vena), triggering an immediate context-aware continuation.
     */
    public function handBackToAi(ChatSession $session, array $venaContext = []): void
    {
        DB::transaction(function () use ($session, $venaContext) {
            // 1. Transition state
            $session->status = ChatSession::STATUS_BOT_ACTIVE;
            $session->ai_disabled = false;
            $session->claimed_by = null;
            $session->referred_to = null;
            $session->claim_lock_token = null;
            $session->claim_lock_expires = null;
            $session->save();

            // 2. Broadcast state change
            $this->safeBroadcast(new SessionStatusChanged($session));

            // 3. Post system message
            $systemMsg = ChatMessage::create([
                'session_id' => $session->id,
                'sender_type' => ChatMessage::SENDER_SYSTEM,
                'sender_name' => 'System',
                'body' => "Conversation handed back to Vena (AI).",
            ]);
            $this->safeBroadcast(new MessageSent($systemMsg, $session->session_uuid));

            // 4. Immediately trigger AI response to resume the conversation
            try {
                // Get last 15 messages for history context
                $history = $session->messages()
                    ->orderBy('created_at', 'desc')
                    ->limit(15)
                    ->get()
                    ->reverse()
                    ->toArray();

                $aiResponse = $this->aiService->respond($history, "[System: You have just been handed back this conversation from a human agent. Please resume talking to the customer smoothly, welcoming them back or answering their latest questions.]", $venaContext);
                $aiReply = $aiResponse['text'];
                $usage = $aiResponse['usage'] ?? [];

                // Save AI reply
                $botMessage = ChatMessage::create([
                    'session_id' => $session->id,
                    'sender_type' => ChatMessage::SENDER_BOT,
                    'sender_name' => 'Vena',
                    'body' => $aiReply,
                    'metadata' => [
                        'prompt_tokens' => $usage['promptTokenCount'] ?? null,
                        'completion_tokens' => $usage['candidatesTokenCount'] ?? null,
                        'total_tokens' => $usage['totalTokenCount'] ?? null,
                        'model' => $aiResponse['model'] ?? null,
                        'api_key_type' => $aiResponse['api_key_type'] ?? null,
                    ],
                ]);

                // Broadcast AI reply
                $this->safeBroadcast(new MessageSent($botMessage, $session->session_uuid));

            } catch (\Exception $e) {
                Log::error("Chatbot AI handback error: " . $e->getMessage());
                // Fall back silently by placing it back in human queue if AI fails
                $this->triggerHandoff($session, 'ai_api_failure');
            }
        });
    }

    /**
     * Broadcast an event safely, logging failures but not interrupting execution.
     */
    private function safeBroadcast($event): void
    {
        try {
            broadcast($event);
        } catch (\Exception $e) {
            Log::warning("Broadcasting event failed: " . $e->getMessage());
        }
    }
}


