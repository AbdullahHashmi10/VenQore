<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class V4PlanMigratedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $oldPlan,
        public string $newPlan
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('VenQore Account Plan Update')
            ->greeting('Hello,')
            ->line("Your VenQore store plan has been upgraded to our V4 pricing matrix.")
            ->line("Previous Plan: " . ucfirst($this->oldPlan))
            ->line("New Plan: " . ucfirst($this->newPlan))
            ->line("Your features and limits have been updated with enhanced capabilities.")
            ->action('View Your Dashboard', url('/'))
            ->line('Thank you for using VenQore!');
    }
}
