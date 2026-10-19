<?php

namespace App\Services\Notifications;

use App\Models\Tenant;
use App\Models\User;
use App\Notifications\StoreAlertNotification;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * The one place that writes store alerts into the notification bell.
 *
 * Before this existed the bell only ever received a purchase-order cost
 * warning and a plan-migration notice, so it looked broken. Each check below is
 * one cheap aggregate query, isolated in its own try/catch so a failing check
 * can never block the others or the request that triggered us.
 *
 * Recipients are the active owners, admins and managers of the store.
 * An alert is sent at most once per recipient per day per dedupe key.
 */
class NotificationPublisher
{
    public function publishForTenant(Tenant $tenant): int
    {
        $recipients = $this->recipients($tenant->id);
        if ($recipients->isEmpty()) {
            return 0;
        }

        $alerts = [];
        foreach ([
            'lowStock', 'overdueReceivables', 'overduePayables', 'urgentInsights',
            'onlineOrders', 'pendingApprovals', 'expiringStock', 'chequesDue',
        ] as $check) {
            try {
                if ($alert = $this->{$check}($tenant)) {
                    $alerts[] = $alert;
                }
            } catch (\Throwable $e) {
                Log::warning("Notification check {$check} failed for tenant {$tenant->id}: " . $e->getMessage());
            }
        }

        $sent = 0;
        foreach ($alerts as $a) {
            foreach ($recipients as $user) {
                if ($this->alreadySentToday($user, $a['key'])) {
                    continue;
                }
                $user->notify(new StoreAlertNotification(
                    (string) $tenant->id, $a['key'], $a['title'], $a['message'], $a['severity'], $a['url'] ?? null
                ));
                $sent++;
            }
        }

        return $sent;
    }

    /** @return \Illuminate\Support\Collection<int, User> */
    private function recipients($tenantId)
    {
        $ids = DB::table('tenant_users')
            ->where('tenant_id', $tenantId)
            ->whereIn('role', ['owner', 'admin', 'manager'])
            ->where(function ($q) {
                $q->whereNull('status')->orWhere('status', 'active');
            })
            ->pluck('user_id');

        return User::whereIn('id', $ids)->get();
    }

    private function alreadySentToday(User $user, string $key, int $days = 0): bool
    {
        return DatabaseNotification::where('notifiable_type', get_class($user))
            ->whereRaw('CAST(notifiable_id AS CHAR) = ?', [(string) $user->id])
            ->where('created_at', '>=', $days > 0 ? now()->subDays($days) : now()->startOfDay())
            ->where('data', 'like', '%"dedupe_key":"' . $key . '"%')
            ->exists();
    }

    private function url(Tenant $tenant, string $routeName, array $extra = []): ?string
    {
        try {
            return route($routeName, array_merge(['store_slug' => $tenant->slug], $extra));
        } catch (\Throwable $e) {
            return null;
        }
    }

    // ── Checks ───────────────────────────────────────────────────────────

    private function lowStock(Tenant $tenant): ?array
    {
        $rows = DB::table('products as p')
            ->leftJoin('inventory_batches as b', function ($j) {
                $j->on('b.product_id', '=', 'p.id')->whereNull('b.deleted_at');
            })
            ->where('p.tenant_id', $tenant->id)
            ->whereNull('p.deleted_at')
            ->where('p.track_stock', true)
            ->where('p.min_stock_alert', '>', 0)
            ->groupBy('p.id', 'p.min_stock_alert')
            ->havingRaw('COALESCE(SUM(b.remaining_qty),0) <= p.min_stock_alert')
            ->select('p.id')
            ->get();

        if ($rows->isEmpty()) {
            return null;
        }
        $n = $rows->count();

        return [
            'key'      => 'low_stock',
            'title'    => 'Low stock',
            'message'  => $n . ($n === 1 ? ' item is' : ' items are') . ' at or below the reorder level.',
            'severity' => $n >= 10 ? 'critical' : 'important',
            'url'      => $this->url($tenant, 'store.reports.low-stock'),
        ];
    }

    private function overdueReceivables(Tenant $tenant): ?array
    {
        $n = DB::table('sales')
            ->where('tenant_id', $tenant->id)
            ->whereNull('deleted_at')
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', now()->toDateString())
            ->count();

        if (!$n) {
            return null;
        }

        return [
            'key'      => 'overdue_receivables',
            'title'    => 'Customer payments overdue',
            'message'  => $n . ($n === 1 ? ' invoice is' : ' invoices are') . ' past the due date and not fully paid.',
            'severity' => 'important',
            'url'      => $this->url($tenant, 'store.reports.sale-aging'),
        ];
    }

    private function overduePayables(Tenant $tenant): ?array
    {
        $n = DB::table('purchases')
            ->where('tenant_id', $tenant->id)
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->where('workflow_status', '!=', 'cancelled')
            ->where(function ($q) {
                $q->whereDate('due_date', '<', now()->toDateString())
                  ->orWhere(function ($q2) {
                      $q2->whereNull('due_date')->whereDate('purchase_date', '<', now()->subDays(30)->toDateString());
                  });
            })
            ->count();

        if (!$n) {
            return null;
        }

        return [
            'key'      => 'overdue_payables',
            'title'    => 'Supplier bills overdue',
            'message'  => $n . ($n === 1 ? ' bill has' : ' bills have') . ' passed the due date (or 30 days with no due date) unpaid.',
            'severity' => 'important',
            'url'      => null,
        ];
    }

    private function urgentInsights(Tenant $tenant): ?array
    {
        $n = DB::table('ai_recommendations')
            ->where('tenant_id', $tenant->id)
            ->where('priority', 'urgent')
            ->where('is_read', 0)
            ->count();

        if (!$n) {
            return null;
        }

        return [
            'key'      => 'growth_urgent',
            'title'    => 'Growth AI: urgent insights',
            'message'  => $n . ($n === 1 ? ' urgent insight needs' : ' urgent insights need') . ' your attention.',
            'severity' => 'critical',
            'url'      => $this->url($tenant, 'store.growth-engine.index'),
        ];
    }

    private function onlineOrders(Tenant $tenant): ?array
    {
        $n = DB::table('commerce_orders')->where('tenant_id', $tenant->id)->where('status', 'pending')->count();
        if (! $n) {
            return null;
        }

        return ['key' => 'online_orders', 'title' => 'Online orders waiting',
            'message' => $n . ($n === 1 ? ' online order is' : ' online orders are') . ' waiting for you to accept or reject.',
            'severity' => 'critical', 'url' => null];
    }

    private function pendingApprovals(Tenant $tenant): ?array
    {
        $n = DB::table('approval_documents')->where('tenant_id', $tenant->id)->where('status', 'pending')->count();
        if (! $n) {
            return null;
        }

        return ['key' => 'pending_approvals', 'title' => 'Approvals waiting',
            'message' => $n . ($n === 1 ? ' document is' : ' documents are') . ' waiting for approval.',
            'severity' => 'important', 'url' => null];
    }

    private function expiringStock(Tenant $tenant): ?array
    {
        $n = DB::table('inventory_batches')->where('tenant_id', $tenant->id)->whereNull('deleted_at')
            ->where('remaining_qty', '>', 0)->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<=', now()->addDays(30)->toDateString())->count();
        if (! $n) {
            return null;
        }

        return ['key' => 'expiring_stock', 'title' => 'Stock expiring soon',
            'message' => $n . ($n === 1 ? ' batch expires' : ' batches expire') . ' within 30 days (or already expired).',
            'severity' => 'important', 'url' => null];
    }

    private function chequesDue(Tenant $tenant): ?array
    {
        $n = DB::table('payments')->where('tenant_id', $tenant->id)->whereNotNull('cheque_date')
            ->whereDate('cheque_date', '>=', now()->toDateString())
            ->whereDate('cheque_date', '<=', now()->addDays(3)->toDateString())->count();
        if (! $n) {
            return null;
        }

        return ['key' => 'cheques_due', 'title' => 'Cheques falling due',
            'message' => $n . ($n === 1 ? ' cheque is' : ' cheques are') . ' dated within the next 3 days.',
            'severity' => 'important', 'url' => null];
    }

    /**
     * Each urgent Growth insight becomes its own bell alert the moment an analysis finds it (not once a day, and not
     * just a count). One alert per insight per person, re-sent only if it is still open after 7 days. Called by the
     * engine right after every run, so an urgent problem reaches the owner without waiting for the hourly check.
     */
    public function publishUrgentInsights(Tenant $tenant, int $limit = 5): int
    {
        $recipients = $this->recipients($tenant->id);
        if ($recipients->isEmpty()) {
            return 0;
        }
        $rows = \App\Models\AiRecommendation::withoutTenantScope()->where('tenant_id', $tenant->id)->active()
            ->where('priority', 'urgent')->where('is_read', false)->orderByDesc('impact_score')->limit($limit)
            ->get(['id', 'signal_key', 'title', 'message', 'potential_revenue']);

        $sent = 0;
        foreach ($rows as $r) {
            $key = 'growth_' . substr((string) $r->signal_key, 0, 24);
            $msg = \Illuminate\Support\Str::limit(trim(strip_tags((string) $r->message)), 220);
            foreach ($recipients as $user) {
                if ($this->alreadySentToday($user, $key, 7)) {
                    continue;
                }
                $user->notify(new StoreAlertNotification((string) $tenant->id, $key, '🔴 ' . $r->title, $msg, 'critical', $this->url($tenant, 'store.growth-engine.index')));
                $sent++;
            }
        }

        return $sent;
    }
}
