<?php

namespace App\Http\Controllers;

use App\Models\DailySnapshot;
use App\Models\TenantUser;
use App\Services\OwnerDailyPulseService;
use App\Helpers\SettingsHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Carbon\Carbon;

class OwnerDailyPulseController extends Controller
{
    /**
     * Display the secure health dashboard.
     */
    public function index(Request $request)
    {
        $tenant = app('current.tenant');
        $sessionKey = 'owner_pulse_authorized_' . $tenant->id;
        $isAuthorized = session()->get($sessionKey, false);

        $setupStatus = SettingsHelper::get('owner_pulse_setup_status_' . $tenant->id);
        if ($setupStatus === 'disabled') {
            $isAuthorized = true;
        }

        $needsSetup = empty($setupStatus);
        $isOwner = false;

        if ($needsSetup) {
            $user = auth()->user();
            if ($user) {
                $tenantUser = TenantUser::where('tenant_id', $tenant->id)
                    ->where('user_id', $user->id)
                    ->first();
                if ($tenantUser && in_array($tenantUser->role, ['owner', 'admin'])) {
                    $isOwner = true;
                }
            }
        }

        if ($needsSetup) {
            return Inertia::render('Reports/OwnersDailyPulse', [
                'is_locked' => true,
                'needs_setup' => true,
                'is_owner' => $isOwner,
                'store_slug' => $tenant->slug,
                'store_name' => $tenant->name,
            ]);
        }

        if (!$isAuthorized) {
            return Inertia::render('Reports/OwnersDailyPulse', [
                'is_locked' => true,
                'needs_setup' => false,
                'is_owner' => false,
                'store_slug' => $tenant->slug,
                'store_name' => $tenant->name,
            ]);
        }

        // --- Self-Healing Auto-Backfiller (Last 30 Days) ---
        $pulseService = new OwnerDailyPulseService();
        $existingDates = DailySnapshot::where('tenant_id', $tenant->id)
            ->where('date', '>=', now()->subDays(30)->toDateString())
            ->pluck('date')
            ->map(fn($d) => $d instanceof Carbon ? $d->toDateString() : (string) $d)
            ->toArray();

        for ($i = 0; $i < 30; $i++) {
            $targetDate = now()->subDays($i)->toDateString();
            // Check if snapshot is missing
            if (!in_array($targetDate, $existingDates)) {
                try {
                    $pulseService->captureSnapshot($tenant, $targetDate);
                } catch (\Exception $e) {
                    // Fail silently for backfiller so user can still see other days
                    logger()->error("Backfiller error on {$targetDate}: " . $e->getMessage());
                }
            }
        }

        // Fetch snapshots (newest first)
        $snapshots = DailySnapshot::where('tenant_id', $tenant->id)
            ->orderBy('date', 'desc')
            ->take(30)
            ->get();

        return Inertia::render('Reports/OwnersDailyPulse', [
            'is_locked' => false,
            'needs_setup' => false,
            'is_owner' => false,
            'store_slug' => $tenant->slug,
            'store_name' => $tenant->name,
            'snapshots' => $snapshots,
        ]);
    }

    /**
     * Verify PIN entry to unlock dashboard.
     */
    public function verifyPasscode(Request $request)
    {
        $request->validate([
            'passcode' => 'required|string',
        ]);

        $tenant = app('current.tenant');
        $passcode = $request->passcode;
        $sessionKey = 'owner_pulse_authorized_' . $tenant->id;

        $unlocked = false;

        // 0. Check against dedicated vault passcode
        $vaultPasscodeHash = SettingsHelper::get('owner_pulse_passcode_' . $tenant->id);
        if ($vaultPasscodeHash && Hash::check($passcode, $vaultPasscodeHash)) {
            $unlocked = true;
        }

        // 1. Check against global store admin passcode
        if (!$unlocked) {
            $adminPasscode = SettingsHelper::get('admin_passcode');
            if ($adminPasscode && $passcode === $adminPasscode) {
                $unlocked = true;
            }
        }

        // 2. Check against owner/admin/manager memberships with a hashed pos_pin
        if (!$unlocked) {
            $members = TenantUser::where('tenant_id', $tenant->id)
                ->whereIn('role', ['owner', 'admin', 'manager'])
                ->whereNotNull('pos_pin')
                ->get();

            foreach ($members as $m) {
                if (Hash::check($passcode, $m->pos_pin)) {
                    $unlocked = true;
                    break;
                }
            }
        }

        if ($unlocked) {
            session()->put($sessionKey, true);
            return response()->json([
                'success' => true,
                'message' => 'Dashboard unlocked successfully.',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Access Denied: Invalid security passcode.',
        ], 403);
    }

    /**
     * Set up the passcode for the first time.
     */
    public function setup(Request $request)
    {
        $tenant = app('current.tenant');
        
        $request->validate([
            'action' => 'required|in:disable,set',
            'passcode' => 'required_if:action,set|nullable|string|min:4|max:8',
        ]);

        if ($request->action === 'disable') {
            SettingsHelper::set('owner_pulse_setup_status_' . $tenant->id, 'disabled');
        } else {
            SettingsHelper::set('owner_pulse_setup_status_' . $tenant->id, 'enabled');
            SettingsHelper::set('owner_pulse_passcode_' . $tenant->id, Hash::make($request->passcode));
        }

        session()->put('owner_pulse_authorized_' . $tenant->id, true);

        return response()->json([
            'success' => true,
            'message' => 'Vault security configuration saved.'
        ]);
    }

    /**
     * Lock the terminal.
     */
    public function lock(Request $request)
    {
        $tenant = app('current.tenant');
        $sessionKey = 'owner_pulse_authorized_' . $tenant->id;
        session()->forget($sessionKey);

        return redirect()->route('reports.owner-daily-pulse', ['store_slug' => $tenant->slug])
            ->with('success', 'Terminal locked.');
    }

    /**
     * Save an in-line daily memo note.
     */
    public function saveNote(Request $request)
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'note' => 'nullable|string|max:5000',
        ]);

        $tenant = app('current.tenant');
        $sessionKey = 'owner_pulse_authorized_' . $tenant->id;
        $isAuthorized = session()->get($sessionKey, false);

        if (!$isAuthorized) {
            abort(403, 'Unauthorized access.');
        }

        $snapshot = DailySnapshot::where('tenant_id', $tenant->id)
            ->where('date', $request->date)
            ->first();

        if (!$snapshot) {
            // Create snapshot with zeros first, then apply note
            $snapshot = DailySnapshot::create([
                'tenant_id' => $tenant->id,
                'date' => $request->date,
                'sales_value' => 0,
                'purchases_value' => 0,
                'stock_value' => 0,
                'payables_value' => 0,
                'receivables_value' => 0,
                'cash_value' => 0,
                'expense_value' => 0,
            ]);
        }

        $snapshot->update([
            'note' => $request->note,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Daily memo saved.',
            'snapshot' => $snapshot,
        ]);
    }
}
