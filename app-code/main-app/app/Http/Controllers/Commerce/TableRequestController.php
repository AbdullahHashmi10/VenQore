<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\Storefront;
use App\Models\Tenant;
use App\Services\ModuleService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * "Book a table" on a restaurant's public store: POST /shop/{slug}/reserve.
 *
 * The request lands in table_reservations — the same list the Front-of-House host
 * stand reads — as a normal 'booked' row whose note says it came from the website,
 * so staff see it on the floor for that day and can call the guest to confirm.
 * Only businesses that run Front of House (table service) accept these.
 */
class TableRequestController extends Controller
{
    private const MAX_OPEN_PER_PHONE = 2;
    private const MAX_DAYS_AHEAD = 60;
    private const MAX_PARTY = 30;

    public function store(Request $request, string $slug): JsonResponse
    {
        $store = Storefront::where('slug', $slug)->where('status', 'published')->first();
        abort_unless($store && $store->moduleOn('online_store'), 404);
        $tenant = Tenant::find($store->tenant_id);
        abort_unless(ModuleService::runsFrontOfHouse($tenant), 404);

        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_phone' => ['required', 'string', 'max:40'],
            'party_size' => ['required', 'integer', 'min:1', 'max:' . self::MAX_PARTY],
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'date_format:H:i'],
            'note' => ['nullable', 'string', 'max:300'],
            'company_site' => ['nullable', 'max:0'], // honeypot
        ]);

        $phone = preg_replace('/[^\d+]/', '', $data['customer_phone']);
        if (strlen($phone) < 7 || strlen($phone) > 20) {
            return response()->json(['message' => 'Please enter a valid phone number.', 'reason' => 'phone_invalid'], 422);
        }

        $tz = $store->timezone ?: 'UTC';
        $at = Carbon::createFromFormat('Y-m-d H:i', $data['date'] . ' ' . $data['time'], $tz);
        $now = now($tz);
        if ($at->lt($now->clone()->addMinutes(15))) {
            return response()->json(['message' => 'Please choose a time at least 15 minutes from now.', 'reason' => 'too_soon'], 422);
        }
        if ($at->gt($now->clone()->addDays(self::MAX_DAYS_AHEAD))) {
            return response()->json(['message' => 'Please choose a date within the next two months.', 'reason' => 'too_far'], 422);
        }

        // One person cannot hold the floor with a stack of requests.
        $open = DB::table('table_reservations')
            ->where('tenant_id', $store->tenant_id)->where('phone', $phone)
            ->where('status', 'booked')->where('reserved_at', '>=', $now->format('Y-m-d H:i:s'))
            ->count();
        if ($open >= self::MAX_OPEN_PER_PHONE) {
            return response()->json(['message' => 'You already have upcoming table requests with us. Please call if you need to change them.', 'reason' => 'too_many_open'], 429);
        }

        $note = 'Online request from the website — please confirm with the guest.';
        if (! empty($data['note'])) {
            $note .= "\nGuest note: " . trim($data['note']);
        }

        // Same wall-clock convention as the host stand: the restaurant's local time.
        $id = DB::table('table_reservations')->insertGetId([
            'tenant_id' => $store->tenant_id,
            'customer_name' => trim($data['customer_name']),
            'phone' => $phone,
            'party_size' => (int) $data['party_size'],
            'reserved_at' => $at->format('Y-m-d H:i:s'),
            'position_id' => null,
            'status' => 'booked',
            'notes' => $note,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $name = $store->display_name ?: $store->name ?: 'The restaurant';

        return response()->json([
            'reference' => 'T-' . str_pad((string) $id, 5, '0', STR_PAD_LEFT),
            'when' => $at->format('D j M, g:i A'),
            'message' => "Request sent. {$name} will confirm your table" . ($store->phone ? ' — or call ' . $store->phone : '') . '.',
        ], 201);
    }
}
