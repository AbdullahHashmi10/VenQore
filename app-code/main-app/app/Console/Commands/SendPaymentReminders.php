<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Mail\PaymentReminderMail;
use App\Helpers\SettingsHelper;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SendPaymentReminders extends Command
{
    protected $signature = 'invoices:send-payment-reminders {--tenant= : Run for a specific tenant ID only}';
    protected $description = 'Sends payment reminder emails to customers with outstanding balances, based on the payment_reminder_days setting.';

    public function handle()
    {
        $this->info('Starting Payment Reminder mailing...');

        $tenantQuery = Tenant::whereIn('status', ['active', 'trial']);
        if ($this->option('tenant')) {
            $tenantQuery->where('id', $this->option('tenant'));
        }

        $tenants = $tenantQuery->get();

        foreach ($tenants as $tenant) {
            $this->info("🏪 Checking Tenant [{$tenant->id}] — {$tenant->name}");

            app()->instance('current.tenant', $tenant);
            SettingsHelper::clearCache();

            // Check that the feature is enabled
            if (!SettingsHelper::isEnabled('payment_reminders')) {
                $this->line("   Skipped: 'payment_reminders' setting is disabled.");
                continue;
            }

            $reminderDays = SettingsHelper::getPaymentReminderDays();
            $cutoffDate   = Carbon::now()->subDays($reminderDays)->toDateString();

            // Find posted sales that are older than the reminder window AND have a balance due
            // Balance due = invoice_total - sum(payments.amount) > 0
            // We fetch them grouped by party so we send one email per customer
            // NOTE: `sales` has no `invoice_no` or `invoice_number` column — the
            // sales table's human-readable invoice identifier is `reference_number`
            // (see database/migrations/2026_01_02_000002_create_sales_table.php:12).
            // Selecting/grouping by the nonexistent columns caused a hard SQL error
            // ("Unknown column 'invoice_no'") that crashed this command whenever a
            // tenant had a qualifying overdue sale — fixed below.
            $salesWithBalance = DB::table('sales as s')
                ->leftJoin('payments as p', 'p.sale_id', '=', 's.id')
                ->join('parties as pa', 'pa.id', '=', 's.party_id')
                ->where('s.tenant_id', $tenant->id)
                ->where('s.status', 'posted')
                ->whereNotNull('s.posted_at')
                ->whereNotNull('s.party_id')
                ->where('pa.type', 'customer')
                ->whereNotNull('pa.email')
                ->where('pa.email', '!=', '')
                ->where(DB::raw('DATE(s.posted_at)'), '<=', $cutoffDate)
                ->groupBy('s.id', 's.reference_number', 's.posted_at', 's.invoice_total', 's.total',
                          'pa.id', 'pa.name', 'pa.email')
                ->selectRaw("
                    s.id,
                    s.reference_number,
                    s.posted_at,
                    COALESCE(s.invoice_total, s.total, 0) as invoice_total,
                    COALESCE(SUM(p.amount), 0) as paid_amount,
                    pa.id as party_id,
                    pa.name as party_name,
                    pa.email as party_email
                ")
                ->havingRaw('COALESCE(SUM(p.amount), 0) < COALESCE(s.invoice_total, s.total, 0)')
                ->get();

            if ($salesWithBalance->isEmpty()) {
                $this->line("   No outstanding invoices beyond {$reminderDays} days.");
                continue;
            }

            // Group by party
            $byParty = $salesWithBalance->groupBy('party_id');

            foreach ($byParty as $partyId => $partySales) {
                $first     = $partySales->first();
                $partyName  = $first->party_name;
                $partyEmail = $first->party_email;

                $salesData = $partySales->map(function ($s) {
                    return [
                        'invoice_no' => $s->reference_number ?? ('INV-' . $s->id),
                        'date'       => Carbon::parse($s->posted_at)->toDateString(),
                        'total'      => (float) $s->invoice_total,
                        'paid'       => (float) $s->paid_amount,
                        'balance'    => max(0, (float) $s->invoice_total - (float) $s->paid_amount),
                    ];
                })->values()->toArray();

                $totalOutstanding = array_sum(array_column($salesData, 'balance'));

                if ($totalOutstanding <= 0) {
                    continue;
                }

                try {
                    Mail::to($partyEmail)->send(new PaymentReminderMail(
                        $tenant,
                        $partyName,
                        $partyEmail,
                        $salesData,
                        $totalOutstanding,
                        $reminderDays
                    ));
                    $this->line("   ✅ Reminder sent to {$partyName} <{$partyEmail}> — Balance: {$totalOutstanding}");
                } catch (\Exception $e) {
                    $this->error("   ❌ Failed to send to {$partyEmail}: " . $e->getMessage());
                }
            }
        }

        $this->info('Payment Reminder mailing complete.');
        return 0;
    }
}
