<?php

namespace App\Observers;

use App\Models\ChatSession;
use Illuminate\Validation\ValidationException;

class ChatSessionObserver
{
    /**
     * Valid transitions for session status state machine.
     */
    private array $validTransitions = [
        ChatSession::STATUS_BOT_ACTIVE => [
            ChatSession::STATUS_HUMAN_REQUESTED,
            ChatSession::STATUS_RESOLVED
        ],
        ChatSession::STATUS_HUMAN_REQUESTED => [
            ChatSession::STATUS_AGENT_CLAIMED,
            ChatSession::STATUS_IDLE_OFFLINE,
            ChatSession::STATUS_RESOLVED,
            ChatSession::STATUS_BOT_ACTIVE
        ],
        ChatSession::STATUS_AGENT_CLAIMED => [
            ChatSession::STATUS_AGENT_ACTIVE,
            ChatSession::STATUS_HUMAN_REQUESTED,
            ChatSession::STATUS_RESOLVED
        ],
        ChatSession::STATUS_AGENT_ACTIVE => [
            ChatSession::STATUS_RESOLVED,
            ChatSession::STATUS_HUMAN_REQUESTED,
            ChatSession::STATUS_BOT_ACTIVE
        ],
        ChatSession::STATUS_IDLE_OFFLINE => [
            ChatSession::STATUS_HUMAN_REQUESTED,
            ChatSession::STATUS_RESOLVED,
            ChatSession::STATUS_BOT_ACTIVE
        ],
        ChatSession::STATUS_RESOLVED => [
            ChatSession::STATUS_BOT_ACTIVE,
            ChatSession::STATUS_HUMAN_REQUESTED
        ] // Allow reopening resolved chats
    ];

    /**
     * Handle the ChatSession "updating" event.
     * Enforce status state machine rules.
     */
    public function updating(ChatSession $chatSession): void
    {
        if ($chatSession->isDirty('status')) {
            $originalStatus = $chatSession->getOriginal('status');
            $newStatus = $chatSession->status;

            // Allow initial transition if original was null (though handled by default value)
            if ($originalStatus === null) {
                return;
            }

            // Verify if new status is in valid transition array
            $allowed = $this->validTransitions[$originalStatus] ?? [];

            if (!in_array($newStatus, $allowed, true)) {
                throw ValidationException::withMessages([
                    'status' => "Invalid session state transition from [{$originalStatus}] to [{$newStatus}]."
                ]);
            }
        }
    }
}
