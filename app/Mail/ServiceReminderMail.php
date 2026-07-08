<?php

namespace App\Mail;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ServiceReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public $tenant;
    public $reminders;

    public function __construct(Tenant $tenant, array $reminders)
    {
        $this->tenant    = $tenant;
        $this->reminders = $reminders;
    }

    public function build()
    {
        $storeName = $this->tenant->name;

        $rowsHtml = '';
        foreach ($this->reminders as $reminder) {
            $lastSent = $reminder['last_sent'] ?? 'First run';
            $rowsHtml .= "
                <tr>
                    <td><strong>{$reminder['name']}</strong></td>
                    <td>Every {$reminder['interval']} {$reminder['unit']}</td>
                    <td>{$lastSent}</td>
                </tr>
            ";
        }

        return $this->subject("🔔 Service Reminder — {$storeName}")
            ->html("
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #4f46e5;'>Service Reminder Notification</h2>
                    <p>Hello,</p>
                    <p>This is an automated service reminder from <strong>{$storeName}</strong>. The following recurring services are due:</p>

                    <table border='1' cellpadding='10' cellspacing='0' style='border-collapse: collapse; border-color: #ddd; width: 100%;'>
                        <tr style='background-color: #f5f5f5;'>
                            <th align='left'>Service</th>
                            <th align='left'>Frequency</th>
                            <th align='left'>Last Sent</th>
                        </tr>
                        {$rowsHtml}
                    </table>

                    <br>
                    <p>Please ensure these recurring services are attended to as scheduled.</p>
                    <br>
                    <p>Best regards,<br><strong>{$storeName}</strong><br><em>VenQore ERP</em></p>
                </div>
            ");
    }
}
