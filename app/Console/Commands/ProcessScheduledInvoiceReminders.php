<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\InvoiceReminder;
use App\Models\Tenant;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ProcessScheduledInvoiceReminders extends Command
{
    protected $signature = 'invoices:process-scheduled-reminders';
    protected $description = 'Processes scheduled invoice reminders due for dispatch.';

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

            if (!$invoice) {
                $reminder->update(['status' => 'failed']);
                Log::warning("[InvoiceReminder] Skipped reminder #{$reminder->id}: Missing invoice relationship.");
                continue;
            }

            // Immediately check invoice payment & void status
            $unpaid = (float) ($invoice->invoice_total ?? $invoice->total ?? 0.0) - (float) ($invoice->paid_amount ?? 0.0);
            if (in_array(strtolower((string)$invoice->status), ['void', 'cancelled'], true) || $unpaid <= 0.001) {
                $reminder->update(['status' => 'settled']);
                $this->line("Invoice #{$invoice->reference_number} is settled or void; reminder #{$reminder->id} marked settled.");
                continue;
            }

            $amount = number_format($unpaid, 2);
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
                // Per product decision & no-cost policy:
                // Scheduled background workers must NOT make automated outbound WhatsApp or SMS requests.
                // WhatsApp reminders are marked ready_for_draft for manual staff review.
                $reminder->update(['status' => 'ready_for_draft']);
                $this->info("✓ Queued WhatsApp reminder #{$reminder->id} for staff manual review (zero outbound API calls).");
            }
        }
    }
}
