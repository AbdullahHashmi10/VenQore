<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class MessagingAuditService
{
    /**
     * Audit messaging and notification channel configurations across the application.
     */
    public function auditChannels(): array
    {
        $mailDriver = config('mail.default', 'log');
        $environment = config('app.env', 'production');

        $mailConfigured = true;
        $mailWarning = null;

        if ($environment === 'production' && $mailDriver === 'log') {
            $mailConfigured = false;
            $mailWarning = "MAIL_MAILER is set to 'log' in production environment. Real emails will not be delivered to recipients.";
            Log::warning("MessagingAuditService: {$mailWarning}");
        }

        $smsGatewayKey = config('services.sms.api_key') ?? env('SMS_GATEWAY_API_KEY');
        $smsConfigured = !empty($smsGatewayKey);

        $whatsappToken = config('services.whatsapp.token') ?? env('WHATSAPP_TOKEN');
        $whatsappConfigured = !empty($whatsappToken);

        return [
            'mail' => [
                'driver'       => $mailDriver,
                'environment'  => $environment,
                'configured'   => $mailConfigured,
                'warning'      => $mailWarning,
            ],
            'sms' => [
                'configured' => $smsConfigured,
                'status'     => $smsConfigured ? 'Active' : 'Unconfigured',
            ],
            'whatsapp' => [
                'configured' => $whatsappConfigured,
                'status'     => $whatsappConfigured ? 'Active' : 'Unconfigured',
            ],
        ];
    }
}
