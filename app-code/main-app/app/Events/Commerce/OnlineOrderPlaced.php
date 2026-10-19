<?php

namespace App\Events\Commerce;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

/** A new online-store order arrived. Carries ids only (no customer data) to the tenant's private channel. */
class OnlineOrderPlaced implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public int $tenantId, public string $orderId, public string $publicNumber)
    {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('tenant.' . $this->tenantId . '.orders')];
    }

    public function broadcastAs(): string
    {
        return 'OnlineOrderPlaced';
    }

    public function broadcastWith(): array
    {
        return ['order_id' => $this->orderId, 'public_number' => $this->publicNumber];
    }
}
