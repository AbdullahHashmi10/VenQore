<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * A store-level alert (low stock, overdue money, urgent Growth insight...).
 * Produced only by App\Services\Notifications\NotificationPublisher, which
 * supplies the dedupe key so the same alert is not repeated within a day.
 */
class StoreAlertNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $tenantId,
        private readonly string $dedupeKey,
        private readonly string $title,
        private readonly string $message,
        private readonly string $severity = 'info',   // info | important | critical
        private readonly ?string $url = null,
    ) {
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'title'      => $this->title,
            'message'    => $this->message,
            'severity'   => $this->severity,
            'type'       => $this->severity,
            'action_url' => $this->url,
            'tenant_id'  => $this->tenantId,
            'dedupe_key' => $this->dedupeKey,
        ];
    }
}
