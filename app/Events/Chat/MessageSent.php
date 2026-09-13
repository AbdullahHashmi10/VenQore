<?php

namespace App\Events\Chat;

use App\Models\ChatMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ChatMessage $chatMessage;
    public string $sessionUuid;

    /**
     * Create a new event instance.
     */
    public function __construct(ChatMessage $chatMessage, string $sessionUuid)
    {
        $this->chatMessage = $chatMessage;
        $this->sessionUuid = $sessionUuid;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $session = $this->chatMessage->session;
        $tenantId = $session ? (int) $session->tenant_id : 0;

        return [
            new Channel('chat.' . $this->sessionUuid),
            new PrivateChannel('agent.inbox.' . $tenantId),
            new PrivateChannel('agent.inbox.global'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'MessageSent';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->chatMessage->id,
            'session_id' => $this->chatMessage->session_id,
            'sender_type' => $this->chatMessage->sender_type,
            'sender_id' => $this->chatMessage->sender_id,
            'sender_name' => $this->chatMessage->sender_name,
            'body' => $this->chatMessage->body,
            'metadata' => $this->chatMessage->metadata,
            'is_read' => $this->chatMessage->is_read,
            'created_at' => $this->chatMessage->created_at->toIso8601String(),
        ];
    }
}
