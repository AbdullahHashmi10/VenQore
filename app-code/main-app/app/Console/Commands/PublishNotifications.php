<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\Notifications\NotificationPublisher;
use Illuminate\Console\Command;

class PublishNotifications extends Command
{
    protected $signature = 'notifications:publish {--tenant= : Only this tenant ID}';
    protected $description = 'Write store alerts (low stock, overdue money, urgent Growth insights) into each owner/admin/manager notification bell';

    public function handle(NotificationPublisher $publisher): int
    {
        $q = Tenant::query()->whereIn('status', ['active', 'trial']);
        if ($this->option('tenant')) {
            $q->where('id', $this->option('tenant'));
        }

        $total = 0;
        foreach ($q->get() as $tenant) {
            $n = $publisher->publishForTenant($tenant);
            $total += $n;
            $this->line("{$tenant->name}: {$n} notification(s)");
        }
        $this->info("Done — {$total} notification(s) created.");

        return self::SUCCESS;
    }
}
