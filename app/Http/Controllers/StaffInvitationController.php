<?php

namespace App\Http\Controllers;

use App\Models\StaffInvitation;
use App\Models\TenantUser;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * StaffInvitationController — V1 Invite System
 *
 * Handles: create, list, accept (Path A magic link + Path B code),
 * approve, decline, revoke, resend.
 */
class StaffInvitationController extends Controller
{
    // ─── Admin: List all invitations for this store ───────────────────

    public function index()
    {
        $tenant = app('current.tenant');

        // Expire stale invites before listing
        StaffInvitation::where('tenant_id', $tenant->id)
            ->whereIn('status', ['pending', 'no_account'])
            ->where('expires_at', '<', now())
            ->update(['status' => 'expired']);

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

        // Get tenant timezone
        $tz = $tenant->timezone ?? config('app.timezone', 'UTC');
        \Illuminate\Support\Facades\Log::info("Timezone being used: " . $tz);

        // Get today's summary for each user (respecting store timezone)
        $today = \Carbon\Carbon::today($tz);
        $todayAttendance = \App\Models\StaffAttendance::with('user:id,name,email')
            ->whereDate('check_in', $today)
            ->get()
            ->groupBy('user_id')
            ->map(function($logs) use ($tz) {
                // Sort by check_in
                $first = $logs->sortBy('check_in')->first();
                $last  = $logs->sortBy('check_in')->last();
                
                $firstIn = ($first && $first->check_in) ? Carbon::parse($first->getRawOriginal('check_in'), 'UTC')->tz($tz) : null;
                $lastOut = ($last && $last->check_out) ? Carbon::parse($last->getRawOriginal('check_out'), 'UTC')->tz($tz) : null;
                
                return [
                    'first_in'  => ($firstIn instanceof Carbon) ? $firstIn->format('h:i A') : null,
                    'last_out'  => ($lastOut instanceof Carbon) ? $lastOut->format('h:i A') : null,
                    'is_active' => $logs->whereNull('check_out')->isNotEmpty(),
                    'total_mins' => $logs->sum(function($l) {
                        $start = \Carbon\Carbon::parse($l->getRawOriginal('check_in'), 'UTC');
                        $end = $l->check_out ? \Carbon\Carbon::parse($l->getRawOriginal('check_out'), 'UTC') : now('UTC');
                        $diff = $start->diffInMinutes($end, false);
                        return $diff < 0 ? 0 : $diff;
                    })
                ];
            });

        // Get historical data for the graph (last 30 days)
        $history = \App\Models\StaffAttendance::where('check_in', '>=', now()->subDays(30))
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

        return Inertia::render('Admin/Users', [
            'mode'        => 'admin',
            'users'       => $tenant->users,
            'attendance'  => [
                'today'   => $todayAttendance,
                'history' => $history,
            ],
            'invitations' => $invitations,
        ]);
    }

    // ─── Admin: Create a new invitation ──────────────────────────────

    public function store(Request $request)
    {
        $tenant = app('current.tenant');

        $validated = $request->validate([
            'invitee_name'  => 'required|string|max:255',
            'invitee_email' => 'required|email|max:255',
            'invitee_phone' => 'nullable|string|max:30',
            'roles'         => 'required|array|min:1',
            'roles.*'       => 'string|in:admin,manager,cashier,inventory_staff,accountant,support,custom,viewer',
            'permissions'   => 'nullable|array',
        ]);

        // Check for existing active invite to this email
        $existing = StaffInvitation::where('tenant_id', $tenant->id)
            ->where(fn($q) => $q->where('invitee_email', $validated['invitee_email'])
                ->orWhere('email', $validated['invitee_email']))
            ->whereIn('status', ['pending', 'no_account', 'awaiting_approval'])
            ->first();

        if ($existing) {
            return back()->with('error', 'An active invitation already exists for this email. Resend or revoke it first.');
        }

        // Determine if the invitee has an account already
        $hasAccount = User::where('email', $validated['invitee_email'])->exists();

        $invitation = StaffInvitation::create([
            'tenant_id'     => $tenant->id,
            'invited_by'    => Auth::id(),
            'invitee_name'  => $validated['invitee_name'],
            'invitee_email' => $validated['invitee_email'],
            'email'         => $validated['invitee_email'], // legacy compat
            'invitee_phone' => $validated['invitee_phone'],
            'roles'         => $validated['roles'],
            'permissions'   => $validated['permissions'] ?? [],
            'role'          => $validated['roles'][0] ?? 'cashier', // legacy compat
            'token'         => StaffInvitation::generateToken(),
            'short_code'    => StaffInvitation::generateShortCode(),
            'status'        => $hasAccount ? 'pending' : 'no_account',
            'expires_at'    => now()->addHours(48),
        ]);

        return back()->with('success', 'Invitation sent! Code: ' . $invitation->short_code);
    }

    // ─── Admin: Revoke an invitation ──────────────────────────────────

    public function revoke(StaffInvitation $invitation)
    {
        $this->authorizeTenant($invitation);

        if (!in_array($invitation->status, ['pending', 'no_account', 'awaiting_approval'])) {
            return back()->with('error', 'This invitation cannot be revoked in its current state.');
        }

        $invitation->update(['status' => 'revoked']);

        return back()->with('success', 'Invitation revoked.');
    }

    // ─── Admin: Resend an invitation (reset TTL) ──────────────────────

    public function resend(StaffInvitation $invitation)
    {
        $this->authorizeTenant($invitation);

        $invitation->update([
            'status'     => 'pending',
            'expires_at' => now()->addHours(48),
            'token'      => StaffInvitation::generateToken(),
        ]);

        return back()->with('success', 'Invitation resent. New 48-hour window started.');
    }

    // ─── Admin: Approve a staff member who accepted ───────────────────

    public function approve(StaffInvitation $invitation)
    {
        $this->authorizeTenant($invitation);

        if ($invitation->status !== 'awaiting_approval') {
            return back()->with('error', 'This invitation is not waiting for approval.');
        }

        $user = User::where('email', $invitation->invitee_email ?? $invitation->email)->first();
        if (!$user) {
            return back()->with('error', 'The invitee has not created an account yet.');
        }

        $tenant = app('current.tenant');

        // Link user to this store
        TenantUser::firstOrCreate(
            ['tenant_id' => $tenant->id, 'user_id' => $user->id],
            [
                'role'        => $invitation->primaryRole(),
                'status'      => 'active',
                'display_name' => $invitation->invitee_name,
                'permissions' => $invitation->permissions,
                'joined_at'   => now(),
            ]
        );

        $invitation->update([
            'status'      => 'active',
            'approved_at' => now(),
        ]);

        return back()->with('success', $invitation->invitee_name . ' has been added to your store.');
    }

    // ─── Admin: Decline an awaiting_approval invite ────────────────────

    public function decline(StaffInvitation $invitation)
    {
        $this->authorizeTenant($invitation);

        if ($invitation->status !== 'awaiting_approval') {
            return back()->with('error', 'Nothing to decline.');
        }

        $invitation->update(['status' => 'declined']);

        return back()->with('success', 'Invitation declined. The user has been notified (in-app).');
    }

    // ─── Invitee: Accept via magic-link token (Path A) ───────────────

    public function acceptByToken(Request $request)
    {
        $token      = $request->query('token');
        $invitation = StaffInvitation::where('token', $token)->first();

        if (!$invitation || !$invitation->isValid()) {
            return Inertia::render('Invite/Invalid', [
                'reason' => $invitation ? 'expired' : 'not_found',
            ]);
        }

        $tenant = $invitation->tenant;

        return Inertia::render('Invite/Accept', [
            'invitation'  => [
                'id'            => $invitation->id,
                'invitee_name'  => $invitation->invitee_name,
                'invitee_email' => $invitation->invitee_email ?? $invitation->email,
                'roles'         => $invitation->roles ?? [$invitation->role],
                'short_code'    => $invitation->short_code,
            ],
            'store' => [
                'name'   => $tenant->name,
                'slug'   => $tenant->slug,
            ],
            'admin_name' => $invitation->inviter?->name ?? 'Store Admin',
            'token'      => $token,
        ]);
    }

    // ─── Invitee: Accept using short code from Hub (Path B) ──────────

    public function validateCode(Request $request)
    {
        $request->validate(['code' => 'required|string']);

        $invitation = StaffInvitation::where('short_code', strtoupper(trim($request->code)))->first();

        if (!$invitation || !$invitation->isValid()) {
            return response()->json(['valid' => false, 'message' => 'Invalid or expired invite code.'], 422);
        }

        // Email match check: if logged in, enforce it
        if (Auth::check() && Auth::user()->email !== ($invitation->invitee_email ?? $invitation->email)) {
            return response()->json(['valid' => false, 'message' => 'This invite code is for a different email address.'], 403);
        }

        return response()->json([
            'valid'      => true,
            'invitation' => [
                'id'            => $invitation->id,
                'invitee_name'  => $invitation->invitee_name,
                'invitee_email' => $invitation->invitee_email ?? $invitation->email,
                'roles'         => $invitation->roles ?? [$invitation->role],
                'short_code'    => $invitation->short_code,
                'token'         => $invitation->token,
            ],
            'store' => [
                'name' => $invitation->tenant?->name,
                'slug' => $invitation->tenant?->slug,
            ],
            'admin_name' => $invitation->inviter?->name ?? 'Store Admin',
        ]);
    }

    // ─── Invitee: Submit acceptance ───────────────────────────────────

    public function accept(Request $request)
    {
        $request->validate(['token' => 'required|string']);

        $invitation = StaffInvitation::where('token', $request->token)->first();

        if (!$invitation || !$invitation->isValid()) {
            return back()->with('error', 'This invitation link is invalid or has expired.');
        }

        $user = Auth::user();
        if (!$user) {
            // Store token in session and redirect to login
            session(['pending_invite_token' => $request->token]);
            return redirect()->route('login')->with('info', 'Please log in to accept your invitation.');
        }

        // Hard email match enforcement
        $inviteEmail = $invitation->invitee_email ?? $invitation->email;
        if ($user->email !== $inviteEmail) {
            return back()->with('error', 'This invitation is for ' . $inviteEmail . '. Please log in with that account.');
        }

        // Mark as active (Auto-approve for seamless UX)
        $invitation->update([
            'status'      => 'active',
            'accepted_at' => now(),
            'approved_at' => now(),
        ]);

        // Link user to this store immediately
        \App\Models\TenantUser::updateOrCreate(
            ['tenant_id' => $invitation->tenant_id, 'user_id' => $user->id],
            [
                'role'         => $invitation->primaryRole(),
                'status'       => 'active',
                'display_name' => $invitation->invitee_name,
                'permissions'  => $invitation->permissions,
                'joined_at'    => now(),
            ]
        );

        return redirect()->route('hub')->with('success', 'Invitation accepted! You now have access to ' . $invitation->tenant->name . '.');
    }

    // ─── Invitee: Decline an invitation ───────────────────────────────

    public function declineByToken(Request $request)
    {
        $request->validate(['token' => 'required|string']);
        $invitation = StaffInvitation::where('token', $request->token)->first();

        if ($invitation && $invitation->isValid()) {
            $invitation->update(['status' => 'declined']);
        }

        return redirect('/')->with('info', 'You have declined the invitation.');
    }

    // ─── Private ─────────────────────────────────────────────────────

    private function authorizeTenant(StaffInvitation $invitation): void
    {
        $tenant = app('current.tenant');
        if ($invitation->tenant_id !== $tenant->id) {
            abort(403, 'Unauthorized');
        }
    }
}
