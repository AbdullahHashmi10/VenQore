<?php

namespace App\Http\Controllers;

use App\Models\TenantUser;
use App\Models\User;
use App\Models\StaffInvitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * StaffController — Definitive Plan
 *
 * Manages store members (staff). Operations:
 *  - List staff
 *  - Invite by email (7-day expiry, single-use token, email-locked)
 *  - Accept invite (creates account if needed, adds membership)
 *  - Join by store join_code (self-service, creates cashier membership)
 *  - Update role / display name / suspend
 *  - Remove member
 */
class StaffController extends Controller
{
    /**
     * List all staff members of the current store.
     */
    public function index(): Response
    {
        $tenant = app('current.tenant');

        $members = TenantUser::where('tenant_id', $tenant->id)
            ->with('user:id,name,email')
            ->orderByRaw("FIELD(role, 'owner', 'franchise_admin', 'admin', 'manager', 'shift_supervisor', 'accountant', 'purchasing_officer', 'inventory_controller', 'hr_officer', 'production_supervisor', 'kitchen_manager', 'dispenser', 'sales_executive', 'fulfillment_lead', 'delivery_driver', 'cashier', 'viewer')")
            ->orderBy('status')
            ->get()
            ->map(fn($m) => [
                'id'           => $m->id,
                'user_id'      => $m->user_id,
                'name'         => $m->user?->name,
                'display_name' => $m->display_name,
                'email'        => $m->user?->email,
                'role'         => $m->role,
                'status'       => $m->status,
                'pos_pin_set'  => !is_null($m->pos_pin),
                'joined_at'    => $m->joined_at,
            ])
            ->toArray();

        // Merge in pending invitations
        $invites = StaffInvitation::where('tenant_id', $tenant->id)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->get()
            ->map(fn($i) => [
                'id'           => 'invite_' . $i->id,
                'name'         => 'Pending Invite',
                'email'        => $i->email,
                'role'         => $i->role,
                'status'       => 'invited',
                'invited_at'   => $i->created_at,
                'invite_expires_at' => $i->expires_at,
            ])
            ->toArray();

        $allStaff = array_merge($members, $invites);

        return Inertia::render('Store/Staff/Index', [
            'members'   => $allStaff,
            'join_code' => $tenant->join_code,
            'store_slug' => $tenant->slug,
        ]);
    }

    /**
     * Invite a new staff member by email.
     * Creates a pending TenantUser record with a 7-day token.
     */
    public function invite(Request $request): RedirectResponse
    {
        $request->validate([
            'email'        => 'required|email|max:255',
            'role'         => 'required|in:franchise_admin,admin,manager,shift_supervisor,accountant,purchasing_officer,inventory_controller,sales_executive,cashier,hr_officer,kitchen_manager,dispenser,production_supervisor,fulfillment_lead,delivery_driver,viewer',
            'display_name' => 'nullable|string|max:50',
        ]);

        $tenant    = app('current.tenant');
        $myRole    = app('current.membership')->role;
        $inviteEmail = strtolower($request->email);

        // Only owner and admin can invite
        if (!in_array($myRole, ['owner', 'admin'])) {
            abort(403);
        }

        // ── Plan Limit Check ───────────────────────────────────────────────
        // Count active + invited members (pending invites hold a seat)
        $currentCount = TenantUser::where('tenant_id', $tenant->id)
            ->whereIn('status', ['active', 'invited'])
            ->count();
        \App\Services\PlanGate::enforce('staff_limit', $currentCount);

        // Cannot invite an owner (only one owner per store)
        if ($request->role === 'owner') {
            abort(403, 'Cannot invite another owner.');
        }

        // Check if already a member
        $existingUser = User::where('email', $inviteEmail)->first();
        if ($existingUser) {
            $existingMembership = TenantUser::where('tenant_id', $tenant->id)
                ->where('user_id', $existingUser->id)
                ->first();
            if ($existingMembership && $existingMembership->status === 'active') {
                return back()->withErrors(['email' => 'This person is already a member of your store.']);
            }
        }

        $token = Str::random(64);

        StaffInvitation::updateOrCreate(
            ['tenant_id' => $tenant->id, 'email' => $inviteEmail],
            [
                'invited_by' => auth()->id(),
                'role'       => $request->role,
                'token'      => $token,
                'expires_at' => now()->addDays(7),
            ]
        );

        // Send invite email
        Mail::to($inviteEmail)->queue(new \App\Mail\StaffInviteMail(
            $tenant,
            $request->role,
            route('invite.accept', ['token' => $token])
        ));

        return back()->with('success', "Invitation sent to {$inviteEmail}.");
    }

    /**
     * Accept a staff invite via email link.
     * Creates an account if the email has no account yet.
     */
    public function acceptInvite(Request $request, string $token): Response|RedirectResponse
    {
        $membership = StaffInvitation::where('token', $token)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->with('tenant:id,name,plan')
            ->firstOrFail();

        // If user is logged in with a different email, log them out
        if (Auth::check() && Auth::user()->email !== $membership->invite_email) {
            Auth::logout();
        }

        return Inertia::render('Auth/AcceptInvite', [
            'token'       => $token,
            'invite_email'=> $membership->invite_email,
            'store_name'  => $membership->tenant->name,
            'role'        => $membership->role,
        ]);
    }

    /**
     * Complete invite acceptance — create account if needed, activate membership.
     */
    public function completeAcceptInvite(Request $request): RedirectResponse
    {
        $request->validate(['token' => 'required|string|size:64']);

        $invitation = StaffInvitation::where('token', $request->token)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->firstOrFail();

        DB::transaction(function () use ($invitation, $request) {
            // Find or create the user account
            $user = User::firstOrCreate(
                ['email' => $invitation->email],
                [
                    'name'     => $request->name ?? explode('@', $invitation->email)[0],
                    'password' => bcrypt($request->password ?? Str::random(12)),
                ]
            );

            // Create the membership
            TenantUser::create([
                'tenant_id' => $invitation->tenant_id,
                'user_id'   => $user->id,
                'role'      => $invitation->role,
                'status'    => 'active',
                'joined_at' => now(),
            ]);

            // Mark invitation as accepted
            $invitation->update(['accepted_at' => now()]);

            $user->update(['last_store_id' => $invitation->tenant_id]);

            Auth::login($user);
        });

        return redirect()->route('store.dashboard', ['store_slug' => $invitation->tenant->slug])
                         ->with('success', 'Welcome to the team!');
    }

    /**
     * Show the join-by-code form.
     */
    public function joinForm(): \Inertia\Response
    {
        $user = Auth::user();

        // Fetch pending invites for this user's email 
        $pendingInvites = \App\Models\StaffInvitation::where('invitee_email', $user->email)
            ->whereIn('status', ['pending', 'no_account'])
            ->where('expires_at', '>', now())
            ->with(['tenant:id,name,plan'])
            ->get()
            ->map(fn($inv) => [
                'token'      => $inv->token,
                'store_name' => $inv->tenant->name,
                'plan'       => $inv->tenant->plan,
                'role'       => $inv->role ?? 'cashier',
                'accept_url' => route('invite.accept', ['token' => $inv->token]),
            ]);

        return \Inertia\Inertia::render('Store/Join', [
            'pending_invites' => $pendingInvites
        ]);
    }

    /**
     * Join a store via its public join code (self-service, always grants cashier).
     */
    public function joinWithCode(Request $request): RedirectResponse
    {
        $request->validate(['join_code' => 'required|string|size:7']);

        $tenant = \App\Models\Tenant::where('join_code', strtoupper($request->join_code))
            ->whereIn('status', ['trial', 'active'])
            ->firstOrFail();

        $user = Auth::user();

        $existing = TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing && $existing->status === 'active') {
            return redirect()->route('store.dashboard', ['store_slug' => $tenant->slug])
                             ->with('info', 'You are already a member of this store.');
        }

        TenantUser::updateOrCreate(
            ['tenant_id' => $tenant->id, 'user_id' => $user->id],
            ['role' => 'cashier', 'status' => 'active', 'joined_at' => now()]
        );

        $user->update(['last_store_id' => $tenant->id]);

        return redirect()->route('store.dashboard', ['store_slug' => $tenant->slug]);
    }

    /**
     * Update a member's role or display name.
     */
    public function update(Request $request, TenantUser $member): RedirectResponse
    {
        $this->authorizeMemberAction($member);

        $request->validate([
            'role'         => 'nullable|in:franchise_admin,admin,manager,shift_supervisor,accountant,purchasing_officer,inventory_controller,sales_executive,cashier,hr_officer,kitchen_manager,dispenser,production_supervisor,fulfillment_lead,delivery_driver,viewer,custom',
            'display_name' => 'nullable|string|max:50',
            'status'       => 'nullable|in:active,suspended',
            'permissions'  => 'nullable|array',
        ]);

        // Cannot change role of owner
        if ($member->role === 'owner' && $request->has('role')) {
            abort(403, 'Owner role cannot be changed.');
        }

        $member->update($request->only(['role', 'display_name', 'status', 'permissions']));

        return back()->with('success', 'Member updated.');
    }

    /**
     * Remove a member from the store.
     */
    public function remove(TenantUser $member): RedirectResponse
    {
        $this->authorizeMemberAction($member);

        if ($member->role === 'owner') {
            abort(403, 'Owner cannot be removed from a store.');
        }

        $member->delete();

        return back()->with('success', 'Member removed.');
    }

    // ──────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────

    private function authorizeMemberAction(TenantUser $member): void
    {
        $myMembership = app('current.membership');
        $tenant       = app('current.tenant');

        // Must be acting within the same store
        if ($member->tenant_id !== $tenant->id) {
            abort(403);
        }

        // Must be owner or admin
        if (!in_array($myMembership->role, ['owner', 'admin'])) {
            abort(403);
        }
    }
}
