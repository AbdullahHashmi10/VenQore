<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\InvoiceReminder;
use App\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ProcessScheduledInvoiceReminders extends Command
{
    protected $signature = 'invoices:process-scheduled-reminders';
    protected $description = 'Processes and delivers scheduled invoice reminders due for dispatch.';

    public function handle()
    {
        $dueReminders = InvoiceReminder::where('status', 'pending')
            ->where('scheduled_at', '<=', now())
            ->with(['invoice', 'customer'])
            ->get();

        if ($dueReminders->isEmpty()) {
            $this->line('No scheduled invoice reminders are due for dispatch.');
            return;
        }

        $this->info("Found {$dueReminders->count()} due invoice reminder(s) to process.");

        foreach ($dueReminders as $reminder) {
            $customer = $reminder->customer;
            $invoice = $reminder->invoice;

            if (!$customer) {
                $reminder->update(['status' => 'failed']);
                Log::warning("[InvoiceReminder] Skipped reminder #{$reminder->id}: Missing customer relationship.");
                continue;
            }

            $amount = (float) ($invoice->invoice_total ?? $invoice->total ?? 0.0);
            $messageBody = "Dear {$customer->name}, this is a reminder that invoice #{$invoice->reference_number} is outstanding. Amount due: {$amount}";

            if ($reminder->type === 'email') {
                if (!empty($customer->email)) {
                    try {
                        Mail::raw($messageBody, function ($m) use ($customer, $invoice) {
                            $m->to($customer->email)
                              ->subject("Payment Reminder: Invoice #{$invoice->reference_number}");
                        });
                        $reminder->update(['status' => 'sent', 'sent_at' => now()]);
                        $this->info("✓ Sent email reminder #{$reminder->id} to {$customer->email}");
                    } catch (\Exception $e) {
                        Log::error("[InvoiceReminder] Email dispatch failed for #{$reminder->id}: " . $e->getMessage());
                        $reminder->update(['status' => 'failed']);
                    }
                } else {
                    $reminder->update(['status' => 'failed']);
                    Log::warning("[InvoiceReminder] Email reminder #{$reminder->id} failed: Customer has no email.");
                }
            } elseif ($reminder->type === 'whatsapp') {
                $phone = $customer->phone;
                if (empty($phone)) {
                    $reminder->update(['status' => 'failed']);
                    Log::warning("[InvoiceReminder] WhatsApp reminder #{$reminder->id} failed: Customer has no phone.");
                    continue;
                }

                $metaToken = \App\Helpers\SettingsHelper::get('whatsapp_access_token');
                $metaPhoneId = \App\Helpers\SettingsHelper::get('whatsapp_phone_number_id');
                $metaApiUrl = \App\Helpers\SettingsHelper::get('whatsapp_api_url', 'https://graph.facebook.com/v17.0');

                if (!empty($metaToken) && !empty($metaPhoneId)) {
                    try {
                        $res = Http::withToken($metaToken)
                            ->timeout(10)
                            ->post("{$metaApiUrl}/{$metaPhoneId}/messages", [
                                'messaging_product' => 'whatsapp',
                                'to' => $phone,
                                'type' => 'text',
                                'text' => ['body' => $messageBody],
                            ]);

                        if ($res->successful()) {
                            $reminder->update(['status' => 'sent', 'sent_at' => now()]);
                            $this->info("✓ Sent Meta WhatsApp reminder #{$reminder->id} to {$phone}");
                        } else {
                            Log::error("[InvoiceReminder] Meta WhatsApp failed for #{$reminder->id}: " . $res->body());
                            $reminder->update(['status' => 'failed']);
                        }
                    } catch (\Exception $e) {
                        Log::error("[InvoiceReminder] WhatsApp exception for #{$reminder->id}: " . $e->getMessage());
                        $reminder->update(['status' => 'failed']);
                    }
                } elseif (class_exists(\Twilio\Rest\Client::class) && config('services.twilio.sid')) {
                    try {
                        $twilio = new \Twilio\Rest\Client(config('services.twilio.sid'), config('services.twilio.token'));
                        $twilio->messages->create("whatsapp:" . $phone, [
                            "from" => "whatsapp:" . config('services.twilio.whatsapp_from'),
                            "body" => $messageBody,
                        ]);
                        $reminder->update(['status' => 'sent', 'sent_at' => now()]);
                        $this->info("✓ Sent Twilio WhatsApp reminder #{$reminder->id} to {$phone}");
                    } catch (\Exception $e) {
                        Log::error("[InvoiceReminder] Twilio WhatsApp failed for #{$reminder->id}: " . $e->getMessage());
                        $reminder->update(['status' => 'failed']);
                    }
                } else {
                    $reminder->update(['status' => 'failed']);
                    Log::warning("[InvoiceReminder] WhatsApp reminder #{$reminder->id} failed: No active WhatsApp API credentials configured.");
                }
            }
        }
    }
}
