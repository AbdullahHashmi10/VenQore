<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TenantUser;
use App\Models\StaffInvitation;
use App\Models\StaffAttendance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * StoreAdminController
 *
 * Handles the store-level "Admin Panel" pages.
 * These are the old perfected Admin Panel pages now scoped to /s/{store_slug}/admin/*
 * Requires TenantMiddleware — always operating in context of one store.
 */
class StoreAdminController extends Controller
{
    /**
     * Admin Home — store health overview.
     * Route: store.admin.home → GET /s/{store_slug}/admin/
     */
    public function home(): Response
    {
        $tenant     = app('current.tenant');
        $membership = app('current.membership');

        // Owners and admins only
        if (!in_array($membership->role, ['owner', 'admin'])) {
            abort(403);
        }

        $staffCount = TenantUser::where('tenant_id', $tenant->id)->where('status', 'active')->count();

        return Inertia::render('Admin/Dashboard', [
            'tenant'      => [
                'name'       => $tenant->name,
                'plan'       => $tenant->plan,
                'status'     => $tenant->status,
                'trial_ends' => $tenant->trial_ends_at,
            ],
            'staff_count' => $staffCount,
        ]);
    }

    /**
     * Executive Dashboard — same page as the old Admin/ExecutiveDashboard.jsx.
     * Route: store.admin.dashboard → GET /s/{store_slug}/admin/dashboard
     */
    public function dashboard(): Response
    {
        $membership = app('current.membership');

        if (!in_array($membership->role, ['owner', 'admin'])) {
            abort(403);
        }

        return Inertia::render('Admin/ExecutiveDashboard');
    }

    /**
     * Staff Attendance & Summaries — old Admin/StaffSummaries.jsx.
     * Route: store.admin.attendance → GET /s/{store_slug}/admin/attendance
     */
    public function attendance(): Response
    {
        $tenant     = app('current.tenant');
        $membership = app('current.membership');

        if (!in_array($membership->role, ['owner', 'admin'])) {
            abort(403);
        }

        // 1. Expire stale invites before listing
        StaffInvitation::where('tenant_id', $tenant->id)
            ->whereIn('status', ['pending', 'no_account'])
            ->where('expires_at', '<', now())
            ->update(['status' => 'expired']);

        // 2. Fetch invitations
        $invitations = StaffInvitation::where('tenant_id', $tenant->id)
            ->with('inviter:id,name,email')
            ->latest()
            ->get()
            ->map(fn($inv) => [
                'id'            => $inv->id,
                'invitee_name'  => $inv->invitee_name,
                'invitee_email' => $inv->invitee_email ?? $inv->email,
                'invitee_phone' => $inv->invitee_phone,
                'roles'         => $inv->roles ?? [$inv->role ?? 'cashier'],
                'short_code'    => $inv->short_code,
                'status'        => $inv->status ?? 'pending',
                'status_label'  => $inv->statusLabel(),
                'expires_at'    => $inv->expires_at?->toIso8601String(),
                'accepted_at'   => $inv->accepted_at?->toIso8601String(),
                'approved_at'   => $inv->approved_at?->toIso8601String(),
                'invited_by'    => $inv->inviter?->name ?? 'System',
                'created_at'    => $inv->created_at->diffForHumans(),
            ]);

        // 3. Timezone and Attendance
        $tz = $tenant->timezone ?? config('app.timezone', 'UTC');
        $today = Carbon::today($tz);
        
        $todayAttendance = StaffAttendance::with('user:id,name,email')
            ->whereDate('check_in', $today)
            ->get()
            ->groupBy('user_id')
            ->map(function($logs) use ($tz) {
                $first = $logs->sortBy('check_in')->first();
                $last  = $logs->sortBy('check_in')->last();
                
                $firstIn = ($first && $first->check_in) ? Carbon::parse($first->getRawOriginal('check_in'), 'UTC')->tz($tz) : null;
                $lastOut = ($last && $last->check_out) ? Carbon::parse($last->getRawOriginal('check_out'), 'UTC')->tz($tz) : null;
                
                return [
                    'first_in'  => ($firstIn instanceof Carbon) ? $firstIn->format('h:i A') : null,
                    'last_out'  => ($lastOut instanceof Carbon) ? $lastOut->format('h:i A') : null,
                    'is_active' => $logs->whereNull('check_out')->isNotEmpty(),
                    'total_mins' => $logs->sum(function($l) {
                        $start = Carbon::parse($l->getRawOriginal('check_in'), 'UTC');
                        $end = $l->check_out ? Carbon::parse($l->getRawOriginal('check_out'), 'UTC') : now('UTC');
                        $diff = $start->diffInMinutes($end, false);
                        return $diff < 0 ? 0 : $diff;
                    })
                ];
            });

        $history = StaffAttendance::where('check_in', '>=', now()->subDays(30))
            ->get()
            ->groupBy([
                'user_id',
                function ($item) use ($tz) {
                    return $item->check_in->tz($tz)->format('Y-m-d');
                }
            ])
            ->map(function ($dates) use ($tz) {
                return $dates->map(function ($logs) use ($tz) {
                    $first = $logs->sortBy('check_in')->first();
                    $last  = $logs->sortByDesc('check_out')->first();
                    
                    $inTz = $first->check_in ? Carbon::parse($first->getRawOriginal('check_in'), 'UTC')->tz($tz) : null;
                    $outTz = ($last && $last->check_out) ? Carbon::parse($last->getRawOriginal('check_out'), 'UTC')->tz($tz) : null;

                    return [
                        'in'  => ($inTz instanceof Carbon) ? $inTz->format('h:i A') : '—',
                        'out' => ($outTz instanceof Carbon) ? $outTz->format('h:i A') : '—',
                        'in_val'  => $inTz ? round($inTz->hour + ($inTz->minute / 60), 2) : null,
                        'out_val' => $outTz ? round($outTz->hour + ($outTz->minute / 60), 2) : null,
                    ];
                });
            });

        // 4. Active Staff / Members
        $users = TenantUser::where('tenant_id', $tenant->id)
            ->with('user:id,name,email')
            ->orderByRaw("FIELD(role, 'owner', 'franchise_admin', 'admin', 'manager', 'shift_supervisor', 'accountant', 'purchasing_officer', 'inventory_controller', 'hr_officer', 'production_supervisor', 'kitchen_manager', 'dispenser', 'sales_executive', 'fulfillment_lead', 'delivery_driver', 'cashier', 'viewer')")
            ->orderBy('status')
            ->get()
            ->map(fn($m) => [
                'id'            => $m->user_id,
                'membership_id' => $m->id,
                'name'          => $m->user?->name ?? $m->display_name,
                'display_name'  => $m->display_name,
                'email'         => $m->user?->email,
                'role'          => $m->role,
                'status'        => $m->status,
                'pos_pin_set'   => !is_null($m->pos_pin),
                'permissions'   => $m->permissions ?? [],
                'joined_at'     => $m->joined_at,
                'created_at'    => $m->joined_at ?? $m->created_at,
            ])
            ->toArray();

        // 5. Staff Summaries / Sales Performance Data
        $staffData = collect($users)->map(function ($u) use ($tenant) {
            $user_id = $u['id'];
            if (!$user_id) {
                return [
                    'id' => null,
                    'name' => $u['name'],
                    'role' => ucfirst($u['role']),
                    'totalSales' => 0.0,
                    'transactionCount' => 0,
                    'avgTransaction' => 0.0,
                    'monthSales' => 0.0,
                    'lastActive' => 'Never',
                ];
            }
            $sales = \App\Models\Sale::where('user_id', $user_id)->get();
            $totalSales = $sales->sum('total');
            $transactionCount = $sales->count();
            $avgTransaction = $transactionCount > 0 ? $totalSales / $transactionCount : 0;

            $monthSales = \App\Models\Sale::where('user_id', $user_id)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('total');

            $lastSale = $sales->sortByDesc('created_at')->first();
            $lastActive = $lastSale ? $lastSale->created_at->diffForHumans() : 'Never';

            return [
                'id' => $user_id,
                'name' => $u['name'],
                'role' => ucfirst($u['role']),
                'totalSales' => (float) $totalSales,
                'transactionCount' => $transactionCount,
                'avgTransaction' => (float) $avgTransaction,
                'monthSales' => (float) $monthSales,
                'lastActive' => $lastActive,
            ];
        })->sortByDesc('totalSales')->values();

        return Inertia::render('Admin/StaffSummaries', [
            'mode'        => 'admin',
            'users'       => $users,
            'attendance'  => [
                'today'   => $todayAttendance,
                'history' => $history,
            ],
            'invitations' => $invitations,
            'staffData'   => $staffData,
        ]);
    }
}
