<?php

namespace App\Services\Commerce;

use App\Models\Commerce\CommerceOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Optional status emails to the customer (only when they gave an email at checkout). Never throws:
 * a mail problem must not touch the order. Each email carries a fresh status link (links are additive).
 */
class CustomerNotifier
{
    private const LINES = [
        'placed' => ['Order received', 'We have received your order. The business will confirm it shortly.'],
        'confirmed' => ['Order accepted', 'Good news: the business accepted your order and is getting it ready.'],
        'preparing' => ['Order being prepared', 'Your order is being prepared.'],
        'ready' => ['Order ready for pickup', 'Your order is ready for pickup.'],
        'out_for_delivery' => ['Order on the way', 'Your order is out for delivery.'],
        'completed' => ['Order completed', 'Your order is complete. Thank you!'],
        'rejected' => ['Order not accepted', 'Sorry, the business could not accept your order.'],
        'cancelled' => ['Order cancelled', 'Your order was cancelled.'],
        'expired' => ['Order not accepted in time', 'The business did not accept your order in time, so it was not placed. Nothing was charged by us.'],
        'revision_proposed' => ['Changes proposed to your order', 'The business suggests changes to your order. Please open the link to accept or decline them.'],
    ];

    public function send(CommerceOrder $o, string $event, ?string $token = null): void
    {
        try {
            if (! $o->customer_email || ! isset(self::LINES[$event]) || $o->purged_at) {
                return;
            }
            [$subject, $line] = self::LINES[$event];
            $store = DB::table('storefronts')->where('id', $o->storefront_id)->first(['display_name', 'phone']);
            if (! $token) {
                $token = Str::random(48);
                DB::table('commerce_order_tokens')->insert(['order_id' => $o->id, 'token_hash' => hash('sha256', $token), 'created_at' => now()]);
            }
            $body = $line . "\n\nOrder " . $o->public_number . ' at ' . ($store->display_name ?? 'the business')
                . "\nTrack your order: " . url('/order-status/' . $token)
                . ($o->reason && in_array($event, ['rejected', 'cancelled'], true) ? "\nReason: " . $o->reason : '')
                . ($store && $store->phone ? "\nQuestions? Call " . $store->phone : '');
            Mail::raw($body, fn ($m) => $m->to($o->customer_email)->subject($subject . ' — ' . $o->public_number));
        } catch (\Throwable $e) {
            Log::warning('commerce customer email failed: ' . $e->getMessage());
        }
    }
}
