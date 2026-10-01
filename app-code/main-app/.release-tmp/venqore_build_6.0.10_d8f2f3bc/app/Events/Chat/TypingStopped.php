<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TypingStopped implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $sessionUuid;
    public string $senderType;
    public string $senderName;

    /**
     * Create a new event instance.
     */
    public function __construct(string $sessionUuid, string $senderType, string $senderName)
    {
        $this->sessionUuid = $sessionUuid;
        $this->senderType = $senderType;
        $this->senderName = $senderName;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('chat.' . $this->sessionUuid),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'TypingStopped';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'sender_type' => $this->senderType,
            'sender_name' => $this->senderName,
        ];
    }
}
