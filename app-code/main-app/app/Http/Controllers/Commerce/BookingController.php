<?php

namespace App\Http\Controllers\Commerce;

use App\Engines\ServiceEngine;
use App\Http\Controllers\Controller;
use App\Models\Commerce\Storefront;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Public booking page for service businesses: /book/{slug}.
 *
 * A customer asks for a service and a time. Nothing is promised: the request
 * lands as a DRAFT service job (the status the Services screen already uses
 * for "not confirmed yet") and the merchant schedules it or turns it down.
 * The page is off until the merchant switches it on in store settings.
 */
class BookingController extends Controller
{
    private const MAX_OPEN_REQUESTS_PER_PHONE = 3;

    private function openStore(string $slug): Storefront
    {
        $store = Storefront::where('slug', $slug)->firstOrFail();

        $tenantStatus = DB::table('tenants')->where('id', $store->tenant_id)->whereNull('deleted_at')->value('status');
        abort_unless(
            $store->status === 'published'
            && $store->booking_enabled
            && $store->moduleOn('services')
            && in_array($tenantStatus, ['active', 'trial', 'trialing'], true),
            404
        );

        return $store;
    }

    private function services(Storefront $store)
    {
        return DB::table('products')
            ->where('tenant_id', $store->tenant_id)->where('type', 'service')->where('is_active', 1)
            ->whereNull('deleted_at')->orderBy('name')->limit(100)
            ->get(['id', 'name', 'description', 'price'])
            ->map(fn ($p) => [
                'id' => $p->id, 'name' => $p->name, 'description' => $p->description, 'price' => (float) $p->price,
            ])->values();
    }

    public function show(Request $request, string $slug)
    {
        $store = $this->openStore($slug);

        return Inertia::render('Commerce/Book', [
            'store' => [
                'slug' => $store->slug, 'name' => $store->display_name, 'phone' => $store->phone,
                'currency_symbol' => $store->currency_symbol,
            ],
            'services' => $this->services($store),
            'submit_url' => '/book/' . $store->slug,
            'min_date' => now($store->timezone ?: 'UTC')->toDateString(),
        ]);
    }

    public function store(Request $request, string $slug): JsonResponse
    {
        $store = $this->openStore($slug);

        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:150'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'service_id' => ['nullable', 'string', 'max:36'],
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'date_format:H:i'],
            'address' => ['nullable', 'string', 'max:500'],
            'note' => ['nullable', 'string', 'max:500'],
            'company_site' => ['nullable', 'max:0'], // honeypot
        ]);

        $tz = $store->timezone ?: 'UTC';
        $start = \Carbon\Carbon::createFromFormat('Y-m-d H:i', $data['date'] . ' ' . $data['time'], $tz);
        if ($start->lt(now($tz)->subMinutes(5))) {
            return response()->json(['message' => 'Please choose a time in the future.', 'reason' => 'past'], 422);
        }
        if ($start->gt(now($tz)->addDays(180))) {
            return response()->json(['message' => 'Please choose a date within the next six months.', 'reason' => 'too_far'], 422);
        }

        $phone = preg_replace('/[^\d+]/', '', $data['customer_phone']);
        if (strlen($phone) < 7 || strlen($phone) > 20) {
            return response()->json(['message' => 'Please enter a valid phone number.', 'reason' => 'phone_invalid'], 422);
        }

        $service = null;
        if (! empty($data['service_id'])) {
            $service = DB::table('products')->where('tenant_id', $store->tenant_id)->where('id', $data['service_id'])
                ->where('type', 'service')->where('is_active', 1)->whereNull('deleted_at')->first();
            if (! $service) {
                return response()->json(['message' => 'That service is not available for booking.', 'reason' => 'bad_service'], 422);
            }
        }

        $tenant = Tenant::find($store->tenant_id);
        $owner = $tenant?->ownerUser();
        if (! $owner) {
            abort(404);
        }

        // the services engine and its models work in the ambient tenant
        app()->instance('current.tenant', $tenant);

        $job = DB::transaction(function () use ($store, $data, $phone, $service, $start, $owner) {
            $party = DB::table('parties')->where('tenant_id', $store->tenant_id)->where('phone', $phone)->whereNull('deleted_at')->first();
            if (! $party) {
                $partyId = (string) Str::uuid();
                DB::table('parties')->insert([
                    'id' => $partyId, 'tenant_id' => $store->tenant_id, 'name' => trim($data['customer_name']), 'phone' => $phone,
                    'type' => 'customer', 'address' => $data['address'] ?? null, 'notes' => 'Created from a booking request',
                    'is_active' => 1, 'created_at' => now(), 'updated_at' => now(),
                ]);
            } else {
                $partyId = $party->id;
            }

            $open = DB::table('service_jobs')->where('tenant_id', $store->tenant_id)->where('party_id', $partyId)->where('status', 'draft')->count();
            if ($open >= self::MAX_OPEN_REQUESTS_PER_PHONE) {
                abort(response()->json(['message' => 'You already have several booking requests waiting. Please wait for the business to reply.', 'reason' => 'too_many_open'], 429));
            }

            $when = $start->format('D j M Y, g:i A');
            $engine = app(ServiceEngine::class);
            $job = $engine->createJob([
                'tenant_id' => $store->tenant_id,
                'created_by' => $owner->id,
                'party_id' => $partyId,
                'title' => ($service->name ?? 'Booking request') . ' - ' . trim($data['customer_name']),
                'description' => "Booking request from the public page.\nPreferred time: {$when}"
                    . (! empty($data['note']) ? "\nNote: " . trim($data['note']) : ''),
                'site_address' => $data['address'] ?? null,
                'status' => 'draft',
                'scheduled_for' => $start->toDateString(),
                'estimated_total' => $service ? (float) $service->price : 0,
                'lines' => $service ? [[
                    'kind' => 'service', 'product_id' => $service->id, 'description' => $service->name,
                    'quantity' => 1, 'unit_price' => (float) $service->price,
                ]] : [],
            ]);
            // the engine does not take a start time; keep the requested slot visible on the calendar
            DB::table('service_jobs')->where('id', $job->id)->update([
                'scheduled_start_at' => $start->clone()->utc()->format('Y-m-d H:i:s'),
            ]);

            return $job;
        });

        return response()->json([
            'reference' => $job->number,
            'message' => 'Thanks! Your request was sent. ' . ($store->display_name ?: 'The business') . ' will confirm your time shortly.',
        ], 201);
    }
}
