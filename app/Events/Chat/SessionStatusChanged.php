<?php

namespace App\Events\Chat;

use App\Models\ChatSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SessionStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ChatSession $chatSession;
    public string $sessionUuid;
    public string $status;
    public int $tenantId;

    /**
     * Create a new event instance.
     */
    public function __construct(ChatSession $chatSession)
    {
        $this->chatSession = $chatSession;
        $this->sessionUuid = $chatSession->session_uuid;
        $this->status = $chatSession->status;
        $this->tenantId = (int) $chatSession->tenant_id;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('chat.' . $this->sessionUuid),
            new PrivateChannel('agent.inbox.' . $this->tenantId),
            new PrivateChannel('agent.inbox.global'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'SessionStatusChanged';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'session_uuid' => $this->sessionUuid,
            'status' => $this->status,
            'visitor_name' => $this->chatSession->visitor_name,
            'visitor_email' => $this->chatSession->visitor_email,
            'claimed_by' => $this->chatSession->claimed_by,
            'claimed_at' => $this->chatSession->claimed_at?->toIso8601String(),
            'escalation_reason' => $this->chatSession->escalation_reason,
            'updated_at' => $this->chatSession->updated_at->toIso8601String(),
        ];
    }
}
