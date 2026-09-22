<?php

namespace App\Http\Controllers;

use App\Models\Occupancy;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * Customer delivery tracking — a public, tokenised, expiring URL.
 *
 * WHAT THIS IS
 * ------------
 * A customer who wants to know where their order is should not have to call
 * the restaurant. This page answers that question without a login, without
 * revealing any information that could harm another customer, and without
 * staying alive indefinitely (which would be a data leak of a different kind).
 *
 * WHAT IT NEVER EXPOSES
 * ---------------------
 * - The rider's phone number (only first name)
 * - The rider's exact location
 * - Any other customer's order
 * - Any pricing information
 * - The restaurant's internal ticket ID
 *
 * EXPIRY
 * ------
 * The token expires 6 hours after delivery, or 24 hours after it was created
 * if delivery never happened. Expired tokens return 410 Gone so search engines
 * do not index them and browsers do not cache them as valid pages.
 */
class TrackingController extends Controller
{
    public function show(Request $request, string $token): SymfonyResponse
    {
        // Find occupancy by tracking token stored in session_data
        $occ = Occupancy::whereNotNull('session_data')
            ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(session_data, '$.delivery.tracking_token')) = ?", [$token])
            ->first();

        if (!$occ) {
            // Token not found → 404 through Inertia so the layout stays consistent
            return Inertia::render('Track', ['error' => 'not_found'])
                ->toResponse($request)
                ->setStatusCode(404);
        }

        $sd  = $occ->session_data ?? [];
        $del = $sd['delivery'] ?? [];

        // Check expiry
        if ($this->isExpired($occ, $del)) {
            return Inertia::render('Track', ['error' => 'expired'])
                ->toResponse($request)
                ->setStatusCode(410);
        }

        $status   = $del['status'] ?? 'placed';
        $statusAt = $del['status_at'] ?? $occ->opened_at?->toIso8601String();

        // Rider first name only — never surname, never phone
        $riderFirstName = '';
        if (!empty($del['rider'])) {
            $parts          = explode(' ', trim($del['rider']));
            $riderFirstName = $parts[0];
        }

        // ETA remaining (only meaningful when status = 'out')
        $etaRemainingMinutes = null;
        if ($status === 'out' && !empty($del['eta_minutes']) && $statusAt) {
            $minutesOut          = max(0, (int) floor((time() - strtotime($statusAt)) / 60));
            $etaRemainingMinutes = max(0, (int) $del['eta_minutes'] - $minutesOut);
        }

        return Inertia::render('Track', [
            'tracking' => [
                'status'              => $status,
                'status_at'           => $statusAt,
                'status_label'        => $this->statusLabel($status),
                'rider_first_name'    => $riderFirstName,
                'eta_minutes'         => isset($del['eta_minutes']) ? (int) $del['eta_minutes'] : null,
                'eta_remaining'       => $etaRemainingMinutes,
                'order_type'          => $sd['order_type'] ?? 'delivery',
                'customer_name'       => $sd['customer_name'] ?? '',
            ],
        ]);
    }

    private function isExpired(Occupancy $occ, array $del): bool
    {
        $status = $del['status'] ?? 'placed';

        if ($status === 'delivered') {
            // Expire 6 hours after delivery was marked
            $deliveredAt = null;
            foreach (array_reverse($del['history'] ?? []) as $h) {
                if ($h['status'] === 'delivered') {
                    $deliveredAt = $h['at'] ?? null;
                    break;
                }
            }
            if ($deliveredAt && (time() - strtotime($deliveredAt)) > 6 * 3600) {
                return true;
            }
        }

        // Expire 24 hours after ticket was opened regardless of status
        if ($occ->opened_at && now()->diffInHours($occ->opened_at) > 24) {
            return true;
        }

        return false;
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'placed'    => 'Order placed',
            'preparing' => 'Being prepared',
            'out'       => 'On the way',
            'delivered' => 'Delivered',
            default     => 'Order placed',
        };
    }
}
