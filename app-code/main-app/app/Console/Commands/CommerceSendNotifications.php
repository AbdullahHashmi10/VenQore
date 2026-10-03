<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

/**
 * Outbox delivery. The notification row is written inside the order transaction (so an order is never
 * lost); this command mails it afterwards with bounded retries. A mail failure never touches the order.
 */
class CommerceSendNotifications extends Command
{
    protected $signature = 'commerce:send-notifications {--max-attempts=5}';
    protected $description = 'Email merchants about new online orders (retries safely).';

    public function handle(): int
    {
        $max = (int) $this->option('max-attempts');
        $sent = 0;
        $rows = DB::table('commerce_notifications')->whereNull('emailed_at')->where('email_attempts', '<', $max)
            ->orderBy('id')->limit(100)->get();

        foreach ($rows as $n) {
            $to = DB::table('storefronts')->where('tenant_id', $n->tenant_id)->value('email');
            if (! $to || ! filter_var($to, FILTER_VALIDATE_EMAIL)) {
                DB::table('commerce_notifications')->where('id', $n->id)->update(['emailed_at' => now(), 'email_error' => 'no merchant email configured']);
                continue;
            }
            try {
                Mail::raw($n->title . "\n\nOpen your Online Store > Online orders in VenQore to review it.", fn ($m) => $m->to($to)->subject($n->title));
                DB::table('commerce_notifications')->where('id', $n->id)->update(['emailed_at' => now(), 'email_error' => null, 'email_attempts' => $n->email_attempts + 1]);
                $sent++;
            } catch (\Throwable $e) {
                DB::table('commerce_notifications')->where('id', $n->id)->update(['email_attempts' => $n->email_attempts + 1, 'email_error' => mb_substr($e->getMessage(), 0, 250)]);
            }
        }
        $this->info("Sent {$sent} notification email(s).");
        return self::SUCCESS;
    }
}
