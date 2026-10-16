<?php

namespace App\Services\Delivery;

use App\Http\Controllers\CommunicationController;
use App\Jobs\SendWebPush;
use App\Services\Push\WebPushService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * The one place a rider is told about a delivery, for BOTH delivery systems:
 * the online store (DeliveryService::assign) and the restaurant floor (TableServiceController).
 * See MOBILE_APP_DELIVERY_AND_ORDER_CHANGES_MASTER_PLAN.md, B0/B1.
 *
 * What a rider is told, and how:
 *   - Web push to the browsers/installed web app the rider allowed alerts on (nothing is sent if
 *     they have not, or if the server has no VAPID keys).
 *   - A ready-to-send WhatsApp share link, returned to the caller so the dispatcher can tap it.
 *     Nothing is ever sent to WhatsApp automatically.
 *
 * Messages are written to be read on a lock screen: order number, pickup, area, cash to collect.
 * Never the customer's full address or phone.
 *
 * Never throws into a caller: an alert must not be able to break an assignment.
 */
class RiderNotifier
{
    /**
     * @param  array{order_id?:string, order_number?:string, pickup_name?:string, area?:string, cash_expected?:float|int, note?:?string}  $payload
     * @return array{status:string, whatsapp_share_url?:string, message_preview?:string, rider_name?:?string, push_queued?:bool}
     */
    public static function assigned(int $tenantId, $riderEmployeeId, array $payload): array
    {
        try {
            $rider = self::rider($tenantId, $riderEmployeeId);
            if (! $rider) {
                return ['status' => 'rider_not_found'];
            }

            $order = (string) ($payload['order_number'] ?? $payload['order_id'] ?? 'Order');
            $pickup = (string) ($payload['pickup_name'] ?? 'the store');
            $area = self::areaOnly((string) ($payload['area'] ?? ''));
            $cash = (float) ($payload['cash_expected'] ?? 0);
            $cashText = $cash > 0 ? 'Cash to collect: ' . number_format($cash, 2) : 'Already paid, no cash to collect';
            $ridesUrl = self::ridesUrl($tenantId, (string) $riderEmployeeId);

            $lines = ['New delivery #' . $order, 'Pickup: ' . $pickup];
            if ($area !== '') {
                $lines[] = 'Area: ' . $area;
            }
            $lines[] = $cashText;
            if ($ridesUrl) {
                $lines[] = '';
                $lines[] = 'Open your rides: ' . $ridesUrl;
            }
            $message = implode("\n", $lines);

            $pushed = self::push($tenantId, (string) $riderEmployeeId, [
                'title' => 'New delivery #' . $order,
                'body' => trim('Pickup: ' . $pickup . ($cash > 0 ? ' · Collect ' . number_format($cash, 2) : '')),
                'url' => $ridesUrl ? (string) parse_url($ridesUrl, PHP_URL_PATH) : 'landing',
                'tag' => 'delivery-' . $order,
            ]);

            Log::info("[RiderNotifier] rider {$riderEmployeeId} assigned #{$order}", ['tenant_id' => $tenantId]);

            return [
                'status' => 'notified',
                'rider_name' => data_get($rider, 'name'),
                'whatsapp_share_url' => self::whatsAppUrl($tenantId, self::phoneOf($rider), $message),
                'message_preview' => $message,
                'push_queued' => $pushed,
            ];
        } catch (\Throwable $e) {
            Log::error('[RiderNotifier] assignment alert failed: ' . $e->getMessage(), ['tenant_id' => $tenantId, 'rider_id' => $riderEmployeeId]);
            return ['status' => 'error'];
        }
    }

    /** The new rider is alerted; the previous rider is told the order is no longer theirs. */
    public static function reassigned(int $tenantId, $newRiderId, $oldRiderId, array $payload): array
    {
        $result = self::assigned($tenantId, $newRiderId, $payload);

        try {
            if ($oldRiderId && (string) $oldRiderId !== (string) $newRiderId) {
                $order = (string) ($payload['order_number'] ?? $payload['order_id'] ?? 'Order');
                $oldRides = self::ridesUrl($tenantId, (string) $oldRiderId);
                self::push($tenantId, (string) $oldRiderId, [
                    'title' => 'Delivery #' . $order . ' reassigned',
                    'body' => 'This delivery is no longer yours.',
                    'url' => $oldRides ? (string) parse_url($oldRides, PHP_URL_PATH) : 'landing',
                    'tag' => 'delivery-' . $order,
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('[RiderNotifier] could not tell the previous rider: ' . $e->getMessage());
        }

        return $result;
    }

    private static function push(int $tenantId, string $employeeId, array $message): bool
    {
        if (! WebPushService::enabled() && ! \App\Services\Push\FcmService::enabled()) {
            return false;
        }
        SendWebPush::dispatch($tenantId, $employeeId, $message);
        return true;
    }

    private static function rider(int $tenantId, $employeeId): ?object
    {
        return DB::table('employees')->where('id', $employeeId)->where('tenant_id', $tenantId)->first() ?: null;
    }

    private static function phoneOf(object $rider): ?string
    {
        $phone = data_get($rider, 'rider_phone') ?: data_get($rider, 'phone');
        return $phone ? (string) $phone : null;
    }

    /** "My rides" for a rider who has a login. A link-only rider's private link cannot be rebuilt (only its hash is kept). */
    private static function ridesUrl(int $tenantId, string $employeeId): ?string
    {
        $hasLogin = DB::table('commerce_rider_accounts')->where('tenant_id', $tenantId)->where('employee_id', $employeeId)->exists();
        if (! $hasLogin) {
            return null;
        }
        $slug = DB::table('tenants')->where('id', $tenantId)->value('slug');
        return $slug ? route('store.commerce.my-rides', ['store_slug' => $slug]) : null;
    }

    /**
     * Keep only the area, never the house or street line: the first part of an address is dropped.
     * One-part addresses give nothing (the rider opens the app for the full address).
     */
    private static function areaOnly(string $address): string
    {
        $parts = array_values(array_filter(array_map('trim', explode(',', $address))));
        if (count($parts) < 2) {
            return '';
        }
        return mb_substr(implode(', ', array_slice($parts, 1, 2)), 0, 80);
    }

    /**
     * wa.me link with the rider's chat ready. The store's calling code (setting `country_calling_code`)
     * turns a local number into an international one; with no code set a local number is left alone and
     * the link opens WhatsApp's "choose contact" instead of guessing a country.
     */
    private static function whatsAppUrl(int $tenantId, ?string $phone, string $message): string
    {
        $text = '?text=' . rawurlencode($message);
        if (! $phone) {
            return 'https://wa.me/' . $text;
        }

        $cc = (string) DB::table('settings')->where('tenant_id', $tenantId)->where('key', 'country_calling_code')->value('value');
        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        if (str_starts_with($digits, '0') && ! str_starts_with($digits, '00') && $cc === '') {
            return 'https://wa.me/' . $text;
        }

        $n = CommunicationController::normalizePhone($digits, $cc);
        return $n['valid'] ? 'https://wa.me/' . $n['clean'] . $text : 'https://wa.me/' . $text;
    }
}
