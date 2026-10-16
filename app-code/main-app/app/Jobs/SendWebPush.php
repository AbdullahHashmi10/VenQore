<?php

namespace App\Jobs;

use App\Services\Push\FcmService;
use App\Services\Push\WebPushService;
use Illuminate\Support\Facades\DB;
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

        // The same alert to the rider's phone app, through the login linked to this rider.
        $userIds = DB::table('commerce_rider_accounts')->where('tenant_id', $this->tenantId)
            ->where('employee_id', $this->employeeId)->pluck('user_id');
        foreach ($userIds as $userId) {
            FcmService::toUser((int) $userId, $this->message);
        }
    }
}
