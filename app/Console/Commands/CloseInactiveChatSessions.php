<?php

namespace App\Console\Commands;

use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Events\Chat\MessageSent;
use App\Events\Chat\SessionStatusChanged;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CloseInactiveChatSessions extends Command
{
    protected $signature   = 'chat:close-inactive';
    protected $description = 'Automatically close chat sessions where the customer has not replied for 10 minutes.';

    public function handle(): void
    {
        $inactiveTime = now()->subMinutes(10);

        // Fetch all active/non-resolved sessions
        $activeSessions = ChatSession::withoutTenantScope()
            ->where('status', '!=', ChatSession::STATUS_RESOLVED)
            ->get();

        $closedCount = 0;

        foreach ($activeSessions as $session) {
            // Find the most recent message in the session
            $lastMessage = $session->messages()->orderBy('created_at', 'desc')->first();

            if ($lastMessage) {
                // Check if the last message is from bot or agent
                if (in_array($lastMessage->sender_type, [ChatMessage::SENDER_BOT, ChatMessage::SENDER_AGENT])) {
                    // Check if it was sent more than 10 minutes ago
                    if ($lastMessage->created_at->lt($inactiveTime)) {
                        $this->closeSession($session);
                        $closedCount++;
                    }
                }
            } else {
                // If there are no messages at all, check session creation time
                if ($session->created_at->lt($inactiveTime)) {
                    $this->closeSession($session);
                    $closedCount++;
                }
            }
        }

        if ($closedCount > 0) {
            $this->info("Successfully closed {$closedCount} inactive chat session(s).");
        } else {
            $this->line("No inactive chat sessions found.");
        }
    }

    private function closeSession(ChatSession $session): void
    {
        // 1. Mark session as resolved
        $session->status = ChatSession::STATUS_RESOLVED;
        $session->resolved_at = now();
        $session->save();

        // 2. Broadcast status change
        broadcast(new SessionStatusChanged($session));

        // 3. Create closing message from Support
        $closingMessage = ChatMessage::create([
            'session_id' => $session->id,
            'sender_type' => ChatMessage::SENDER_BOT, // bot sender is treated as Support anonymously
            'sender_name' => 'Support',
            'body' => "You have not replied. We are concluding it. If you want to talk about something, just send another message and we will respond back to you.",
        ]);

        // 4. Broadcast message
        broadcast(new MessageSent($closingMessage, $session->session_uuid));

        Log::info("Chat session {$session->session_uuid} automatically closed due to customer inactivity.");
    }
}
