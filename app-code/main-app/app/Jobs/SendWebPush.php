<?php

namespace App\Jobs;

use App\Services\Push\WebPushService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * One web-push alert to a rider employee's browsers. Runs after the surrounding database
 * transaction commits, so a rider is never alerted to an assignment that then rolled back.
 */
class SendWebPush implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 20;

    public function __construct(
        public int $tenantId,
        public string $employeeId,
        public array $message,
    ) {
        $this->afterCommit();
    }

    public function handle(): void
    {
        WebPushService::toEmployee($this->tenantId, $this->employeeId, $this->message);
    }
}
