<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use App\Helpers\SettingsHelper;
use App\Models\TenantUser;
use App\Services\PlanGate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    public function index()
    {
        return \Inertia\Inertia::render('Admin/Dashboard', [
            'mode' => 'admin',
            'stats' => [
                'total_users' => \App\Models\User::count(),
                'active_sessions' => \App\Models\StaffAttendance::whereNull('check_out')->count(),
                'security_logs' => 0, // Placeholder
            ]
        ]);
    }

    public function dashboard()
    {
        // ── Folded into the one dashboard (2026-08-21) ───────────────────────
        //
        // The Admin Panel's separate Executive Dashboard is retired: there is
        // one dashboard per user now, and everything this page composed by
        // hand (cash flow, staff performance, inventory health, backups) is
        // reachable as permission-gated cards on it. The route name stays so
        // old links, bookmarks and route() calls keep working — they land on
        // the unified board.
        return redirect()->route('store.dashboard', [
            'store_slug' => app('current.tenant')->slug,
        ]);
    }

    public function users()
    {
        $tenant = app('current.tenant');
        $users  = $tenant->users;

        // Get attendance data for each user
        $attendance = \App\Models\StaffAttendance::with('user')
            ->orderBy('check_in', 'desc')
            ->get()
            ->groupBy('user_id');

        $staffUsers = \App\Models\User::whereHas('memberships', function($q) use ($tenant) {
            if ($tenant) $q->where('tenant_id', $tenant->id);
        })->get();

        $frs        = app(\App\Services\FinancialReportingService::class);
        $allStart   = '1970-01-01';
        $allEnd     = now()->format('Y-m-d');
        $monthStart = now()->startOfMonth()->format('Y-m-d');
        $monthEnd   = now()->endOfMonth()->format('Y-m-d');

        $netByUserAll   = $frs->getNetRevenueByUser($allStart, $allEnd);     // [user_id => net]
        $netByUserMonth = $frs->getNetRevenueByUser($monthStart, $monthEnd); // [user_id => net]

        // Posted-scope transaction counts per user (ONE grouped query, same status scope as the engine)
        $txnCounts = \App\Models\Sale::query()
            ->whereIn('status', ['posted', 'partially_returned', 'returned'])
            ->selectRaw('user_id, COUNT(*) as c')
            ->groupBy('user_id')
            ->pluck('c', 'user_id'); // [user_id => count]

        $staffData = $staffUsers->map(function ($user) use ($tenant, $netByUserAll, $netByUserMonth, $txnCounts) {
            $totalSales       = (float) ($netByUserAll[$user->id]   ?? 0);
            $monthSales       = (float) ($netByUserMonth[$user->id] ?? 0);
            $transactionCount = (int)   ($txnCounts[$user->id]      ?? 0);
            $avgTransaction   = $transactionCount > 0 ? $totalSales / $transactionCount : 0;

            $lastSale = \App\Models\Sale::where('user_id', $user->id)
                ->whereIn('status', ['posted', 'partially_returned', 'returned'])
                ->latest('posted_at')->first();
            $lastActive = $lastSale ? $lastSale->posted_at->diffForHumans() : 'Never';

            // Get role from membership
            $membership = $tenant ? $user->memberships()->where('tenant_id', $tenant->id)->first() : null;
            $displayRole = $membership ? $membership->role : ($user->role ?? 'Staff');

            return [
                'id' => $user->id,
                'name' => $user->name,
                'role' => ucfirst($displayRole),
                'totalSales' => (float) $totalSales,
                'transactionCount' => $transactionCount,
                'avgTransaction' => (float) $avgTransaction,
                'monthSales' => (float) $monthSales,
                'lastActive' => $lastActive,
            ];
        })->sortByDesc('totalSales')->values()->toArray();

        return \Inertia\Inertia::render('Admin/Users', [
            'mode' => 'admin',
            'users' => $users,
            'attendance' => $attendance,
            'staffData' => $staffData,
        ]);
    }

    public function settings()
    {
        $settings = \App\Models\Setting::all()->pluck('value', 'key')->toArray();

        // Fetch Backups
        $files = \Illuminate\Support\Facades\Storage::disk('local')->files('backups');
        $backups = [];
        foreach ($files as $file) {
            $backups[] = [
                'name' => basename($file),
                'size' => number_format(\Illuminate\Support\Facades\Storage::disk('local')->size($file) / 1024, 2) . ' KB',
                'date' => date('Y-m-d H:i:s', \Illuminate\Support\Facades\Storage::disk('local')->lastModified($file)),
            ];
        }
        // Sort newest first
        usort($backups, function($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        return \Inertia\Inertia::render('Admin/Settings', [
            'mode' => 'admin',
            'settings' => $settings,
            'backups' => $backups
        ]);
    }

    public function updateSettings(\Illuminate\Http\Request $request)
    {
        $settingsData = $request->except(['_token', 'print_logo_file']);

        // Handle Logo Upload
        if ($request->hasFile('print_logo_file')) {
            // Validate: images only, max 4MB — prevents arbitrary/oversized file
            // uploads into a public storage path.
            $request->validate([
                'print_logo_file' => ['image', 'mimes:jpg,jpeg,png,gif,webp,svg', 'max:4096'],
            ]);

            $file = $request->file('print_logo_file');
            $path = $file->store('system', 'public');
            
            // Update or Create the logo path setting
            \App\Models\Setting::updateOrCreate(
                ['key' => 'print_logo_path'],
                ['value' => '/storage/' . $path]
            );
            
            // IMPORTANT: Remove from loop data so we don't overwrite with local blob URL
            unset($settingsData['print_logo_path']); 
        }

        foreach ($settingsData as $key => $value) {
            if (is_bool($value)) {
                $value = $value ? '1' : '0';
            }
            \App\Models\Setting::updateOrCreate(
                ['key' => $key],
                ['value' => is_array($value) ? json_encode($value) : (string) $value]
            );
        }

        // ── Phase 7: Sync Metadata to Tenant Model ────────────────────────────
        // Some settings (like currency) are mirrored on the 'tenants' table for 
        // high-performance routing and metadata access.
        $tenant = app('current.tenant');
        if ($tenant) {
            $syncNeeded = false;
            
            if (isset($settingsData['currency_code']) || isset($settingsData['currency'])) {
                $tenant->currency_code = $settingsData['currency_code'] ?? $settingsData['currency'];
                $syncNeeded = true;
            }
            
            if (isset($settingsData['currency_symbol'])) {
                $tenant->currency_symbol = $settingsData['currency_symbol'];
                $syncNeeded = true;
            }

            if (isset($settingsData['store_name']) || isset($settingsData['business_name'])) {
                $tenant->name = $settingsData['store_name'] ?? $settingsData['business_name'];
                $syncNeeded = true;
            }

            if (isset($settingsData['timezone'])) {
                $tenant->timezone = $settingsData['timezone'];
                $syncNeeded = true;
            }

            if ($syncNeeded) {
                $tenant->save();
            }
        }

        // Clear settings cache
        if ($tenant) {
            \Illuminate\Support\Facades\Cache::forget("settings:{$tenant->id}");
        }
        \Illuminate\Support\Facades\Cache::forget('settings:global');
        SettingsHelper::clearCache();

        return redirect()->back()->with('success', 'Settings updated successfully');
    }

    public function logs()
    {
        $logs = \App\Models\ActivityLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(500)
            ->get();

        return \Inertia\Inertia::render('Admin/Logs', [
            'mode' => 'admin',
            'logs' => $logs
        ]);
    }

    public function database()
    {
        // 1. Get DB Stats
        try {
            $dbName = \Illuminate\Support\Facades\DB::getDatabaseName();
            // MySQL specific query for size
            $sizeResult = \Illuminate\Support\Facades\DB::select("SELECT Round(Sum(data_length + index_length) / 1024 / 1024, 2) as size FROM information_schema.tables WHERE table_schema = ?", [$dbName]);
            $dbSize = $sizeResult[0]->size ?? 0;
            
            $tables = \Illuminate\Support\Facades\DB::select('SHOW TABLES');
            $tableCount = count($tables);
        } catch (\Exception $e) {
            $dbSize = 0;
            $tableCount = 0;
            $dbName = 'Unknown';
        }

        // 2. Get Backups
        $files = \Illuminate\Support\Facades\Storage::disk('local')->files('backups');
        $backups = [];
        foreach ($files as $file) {
            $bytes = \Illuminate\Support\Facades\Storage::disk('local')->size($file);
            $units = ['B', 'KB', 'MB', 'GB'];
            $power = $bytes > 0 ? floor(log($bytes, 1024)) : 0;
            $formattedSize = number_format($bytes / pow(1024, $power), 2, '.', ',') . ' ' . $units[$power];

            $backups[] = [
                'name' => basename($file),
                'size' => $formattedSize,
                'date' => date('Y-m-d H:i:s', \Illuminate\Support\Facades\Storage::disk('local')->lastModified($file)),
            ];
        }
        
        // Sort newest first
        usort($backups, function($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        return \Inertia\Inertia::render('Admin/Database', [
            'mode' => 'admin',
            'stats' => [
                'size' => $dbSize . ' MB',
                'tables' => $tableCount,
                'db_name' => $dbName,
                'driver' => \Illuminate\Support\Facades\DB::connection()->getDriverName()
            ],
            'backups' => $backups
        ]);
    }

    public function storeUser(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'nullable|string|in:platform_admin,admin,manager,cashier,inventory_staff,accountant,custom',
            'permissions' => 'nullable|array',
            'passcode' => [
                'nullable',
                'string',
                'min:4',
                'max:6',
                function ($attribute, $value, $fail) {
                    $tenant = app('current.tenant');
                    $exists = false;
                    if ($tenant) {
                        $exists = \App\Models\TenantUser::where('tenant_id', $tenant->id)
                            ->whereNotNull('pos_pin')
                            ->get()->first(function($tu) use ($value) {
                                return \Illuminate\Support\Facades\Hash::check($value, $tu->pos_pin);
                            });
                    }
                    if ($exists) {
                        $phrases = [
                            "That's a bit too simple, try another.",
                            "Common pattern detected, please choose something unique.",
                            "Security check failed, try a different combination.",
                            "This sequence is reserved, pick another.",
                            "Too easy to guess, make it harder.",
                            "System suggests choosing a different PIN."
                        ];
                        $fail($phrases[array_rand($phrases)]);
                    }
                },
            ],
        ]);

        // ── Phase 4.3: Staff Limit Gate ────────────────────────────────────
        // Count all non-platform_admin staff for this tenant before creating
        if (app()->bound('current.tenant')) {
            $staffCount = \App\Models\User::whereNotIn('role', ['platform_admin'])->count();
            PlanGate::enforce('staff_limit', $staffCount);
        }

        $permissions = $validated['permissions'] ?? [];
        $isOwner = app()->bound('current.membership') && app('current.membership')->role === 'owner';
        if (!$isOwner) {
            $permissions = array_filter($permissions, fn($p) => $p !== 'admin.billing_store');
        }

        $user = \App\Models\User::create([
            'name'          => $validated['name'],
            'email'         => $validated['email'],
            'password'      => bcrypt($validated['password']),
            'role'          => $validated['role'] ?? 'cashier',
            'permissions'   => $permissions,
            'passcode'      => $validated['passcode'] ?? null,
            'last_store_id' => app()->bound('current.tenant') ? app('current.tenant')->id : null,
        ]);

        if (app()->bound('current.tenant')) {
            $tenant  = app('current.tenant');
            $newRole = $validated['role'] ?? 'cashier';
            \App\Models\TenantUser::create([
                'tenant_id'    => $tenant->id,
                'user_id'      => $user->id,
                'role'         => $newRole,
                'status'       => 'active',
                'display_name' => $user->name,
                'joined_at'    => now(),
                'pos_pin'      => $user->passcode,
                'permissions'  => $permissions,
            ]);
        }

        return redirect()->back()->with('success', 'User created successfully');
    }

    public function updateUser(\Illuminate\Http\Request $request, $id)
    {
        $user = \App\Models\User::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'email'       => 'required|email|unique:users,email,' . $id,
            'password'    => 'nullable|string|min:6',
            // Include ALL valid store roles so the value is never silently dropped
            'role'        => 'nullable|string|in:owner,franchise_admin,admin,manager,shift_supervisor,accountant,purchasing_officer,inventory_controller,hr_officer,cashier,viewer,custom,platform_admin',
            'permissions' => 'nullable|array',
            'passcode' => [
                'nullable',
                'string',
                'min:4',
                'max:6',
                function ($attribute, $value, $fail) use ($id) {
                    $tenant = app('current.tenant');
                    $exists = false;
                    if ($tenant) {
                        $exists = \App\Models\TenantUser::where('tenant_id', $tenant->id)
                            ->where('user_id', '!=', $id)
                            ->whereNotNull('pos_pin')
                            ->get()->first(function($tu) use ($value) {
                                return \Illuminate\Support\Facades\Hash::check($value, $tu->pos_pin);
                            });
                    }
                    if ($exists) {
                        $phrases = [
                            "That's a bit too simple, try another.",
                            "Common pattern detected, please choose something unique.",
                            "Security check failed, try a different combination.",
                            "This sequence is reserved, pick another.",
                            "Too easy to guess, make it harder.",
                            "System suggests choosing a different PIN."
                        ];
                        $fail($phrases[array_rand($phrases)]);
                    }
                },
            ],
        ]);

        $user->name  = $validated['name'];
        $user->email = $validated['email'];
        if (!empty($validated['password'])) {
            $user->password = bcrypt($validated['password']);
        }
        $user->passcode = $validated['passcode'] ?? $user->passcode;

        // ── CRITICAL FIX ──────────────────────────────────────────────────────
        // Store the new role in a local variable BEFORE calling $user->save().
        // After save(), calling $user->role triggers getRoleAttribute() which
        // queries tenant_users and returns the OLD role — causing TenantUser to
        // be updated with the wrong (old) role.
        // We always write the new role to both tables explicitly.
        $newRole        = $validated['role'] ?? null;
        $newPermissions = $validated['permissions'] ?? null;
        if ($newPermissions !== null) {
            $isOwner = app()->bound('current.membership') && app('current.membership')->role === 'owner';
            if (!$isOwner) {
                $newPermissions = array_filter($newPermissions, fn($p) => $p !== 'admin.billing_store');
            }
        }

        // Update the legacy users column only if a role was provided
        if ($newRole !== null) {
            $user->getAttributes()['role'] ?? null; // ensure attribute is fresh
            $user->setAttribute('role', $newRole);
        }
        if ($newPermissions !== null) {
            $user->setAttribute('permissions', json_encode($newPermissions));
        }

        $user->save();

        // Update the canonical store-level membership in tenant_users directly
        if (app()->bound('current.tenant')) {
            $tenant = app('current.tenant');

            // Get the existing membership to preserve fields we're not changing
            $membership = \App\Models\TenantUser::where('tenant_id', $tenant->id)
                ->where('user_id', $user->id)
                ->first();

            $updateData = ['pos_pin' => $user->passcode];
            if ($newRole !== null) {
                $updateData['role'] = $newRole;
            }
            if ($newPermissions !== null) {
                $updateData['permissions'] = $newPermissions;
            }

            if ($membership) {
                $membership->update($updateData);
            } else {
                \App\Models\TenantUser::create(array_merge($updateData, [
                    'tenant_id'    => $tenant->id,
                    'user_id'      => $user->id,
                    'role'         => $newRole ?? 'cashier',
                    'status'       => 'active',
                    'display_name' => $user->name,
                    'joined_at'    => now(),
                ]));
            }
        }

        return redirect()->back()->with('success', 'User updated successfully');
    }

    public function staffSummaries()
    {
        $tenant = app('current.tenant');
        $users = \App\Models\User::whereHas('memberships', function($q) use ($tenant) {
            if ($tenant) $q->where('tenant_id', $tenant->id);
        })->get();

        $frs        = app(\App\Services\FinancialReportingService::class);
        $allStart   = '1970-01-01';
        $allEnd     = now()->format('Y-m-d');
        $monthStart = now()->startOfMonth()->format('Y-m-d');
        $monthEnd   = now()->endOfMonth()->format('Y-m-d');

        $netByUserAll   = $frs->getNetRevenueByUser($allStart, $allEnd);     // [user_id => net]
        $netByUserMonth = $frs->getNetRevenueByUser($monthStart, $monthEnd); // [user_id => net]

        // Posted-scope transaction counts per user (ONE grouped query, same status scope as the engine)
        $txnCounts = \App\Models\Sale::query()
            ->whereIn('status', ['posted', 'partially_returned', 'returned'])
            ->selectRaw('user_id, COUNT(*) as c')
            ->groupBy('user_id')
            ->pluck('c', 'user_id'); // [user_id => count]

        $staffData = $users->map(function ($user) use ($tenant, $netByUserAll, $netByUserMonth, $txnCounts) {
            $totalSales       = (float) ($netByUserAll[$user->id]   ?? 0);
            $monthSales       = (float) ($netByUserMonth[$user->id] ?? 0);
            $transactionCount = (int)   ($txnCounts[$user->id]      ?? 0);
            $avgTransaction   = $transactionCount > 0 ? $totalSales / $transactionCount : 0;

            $lastSale = \App\Models\Sale::where('user_id', $user->id)
                ->whereIn('status', ['posted', 'partially_returned', 'returned'])
                ->latest('posted_at')->first();
            $lastActive = $lastSale ? $lastSale->posted_at->diffForHumans() : 'Never';

            // Get role from membership
            $membership = $tenant ? $user->memberships()->where('tenant_id', $tenant->id)->first() : null;
            $displayRole = $membership ? $membership->role : ($user->role ?? 'Staff');

            return [
                'id' => $user->id,
                'name' => $user->name,
                'role' => ucfirst($displayRole),
                'totalSales' => (float) $totalSales,
                'transactionCount' => $transactionCount,
                'avgTransaction' => (float) $avgTransaction,
                'monthSales' => (float) $monthSales,
                'lastActive' => $lastActive,
            ];
        })->sortByDesc('totalSales')->values();

        return \Inertia\Inertia::render('Admin/Users', [
            'mode' => 'admin',
            'staffData' => $staffData
        ]);
    }

    public function destroyUser($id)
    {
        $user = \App\Models\User::findOrFail($id);

        // Prevent deleting self
        if ($user->id === \Illuminate\Support\Facades\Auth::id()) {
            return redirect()->back()->with('error', 'You cannot delete yourself');
        }

        $user->delete();

        return redirect()->back()->with('success', 'User deleted successfully');
    }
    // ─── Member Management (Single Source of Truth) ──────────────────────────

    /**
     * Update a store member's role, permissions, display name, status, or passcode.
     * Operates on TenantUser directly — the canonical record for store access.
     */
    public function updateMember(Request $request, TenantUser $member)
    {
        try {
            $this->authorizeMemberAction($member);

            $request->validate([
                'role'         => 'nullable|in:owner,franchise_admin,admin,manager,shift_supervisor,accountant,purchasing_officer,inventory_controller,sales_executive,cashier,hr_officer,kitchen_manager,dispenser,production_supervisor,fulfillment_lead,delivery_driver,viewer,custom',
                'display_name'     => 'nullable|string|max:50',
                'custom_role_name' => 'nullable|string|max:30',
                'status'           => 'nullable|in:active,suspended',
                'permissions'  => 'nullable|array',
                'passcode'     => [
                    'nullable', 'string', 'min:4', 'max:6',
                    function ($attribute, $value, $fail) use ($member) {
                        $tenant = app('current.tenant');
                        if ($tenant) {
                            $exists = TenantUser::where('tenant_id', $tenant->id)
                                ->where('user_id', '!=', $member->user_id)
                                ->whereNotNull('pos_pin')
                                ->get()->first(fn($tu) => Hash::check($value, $tu->pos_pin));
                            if ($exists) {
                                $fail('This passcode is already in use. Please choose a different one.');
                            }
                        }
                    },
                ],
            ]);

            // Owner role is locked — cannot be changed
            if ($member->role === 'owner' && $request->has('role')) {
                abort(403, 'Owner role cannot be changed.');
            }

            // Retrieve acting user's membership to check roles hierarchy
            $myMembership = TenantUser::where('tenant_id', app('current.tenant')->id)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $isOwner = $myMembership->role === 'owner';

            // Non-owners (admins) cannot promote users to owner, franchise_admin, or admin
            if (!$isOwner && $request->has('role')) {
                $requestedRole = $request->input('role');
                if (in_array($requestedRole, ['owner', 'franchise_admin', 'admin'])) {
                    abort(403, 'Admins cannot promote members to owner, franchise_admin, or admin roles.');
                }
            }

            $updateData = $request->only(['role', 'custom_role_name', 'display_name', 'status']);
            \Log::info('updateMember data: ' . json_encode($updateData));
            
            if ($request->has('permissions')) {
                $permissions = $request->input('permissions') ?? [];
                
                // Remove wildcard '*' to prevent God-mode bypass injection (L026)
                $permissions = array_filter($permissions, fn($p) => $p !== '*');

                if (!$isOwner) {
                    $permissions = array_filter($permissions, fn($p) => $p !== 'admin.billing_store');
                }
                $updateData['permissions'] = array_values($permissions);
            }
            $member->update($updateData);

            if ($request->filled('passcode')) {
                $member->update(['pos_pin' => Hash::make($request->passcode)]);
                $user = $member->user;
                if ($user) {
                    $user->passcode = $request->passcode;
                    $user->save();
                }
            }

            return back()->with('success', 'Member updated.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            throw $e;
        } catch (\Exception $e) {
            \Log::error('updateMember error: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove a member from the store (deletes their TenantUser record).
     */
    public function removeMember(TenantUser $member): RedirectResponse
    {
        $this->authorizeMemberAction($member);

        if ($member->role === 'owner') {
            abort(403, 'Owner cannot be removed from a store.');
        }

        $member->delete();

        return back()->with('success', 'Member removed.');
    }

    /**
     * Ensure the acting user is owner or admin of the same store.
     */
    private function authorizeMemberAction(TenantUser $member): void
    {
        $tenant = app('current.tenant');

        if ($member->tenant_id !== $tenant->id) {
            abort(403);
        }

        $myMembership = TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        if (!in_array($myMembership->role, ['owner', 'admin'])) {
            abort(403);
        }

        // Non-owner admins cannot modify other admins, franchise_admins, or owners
        if ($myMembership->role !== 'owner') {
            if (in_array($member->role, ['owner', 'franchise_admin', 'admin'])) {
                abort(403, 'Admins cannot modify or remove other admins, franchise_admins, or owners.');
            }
        }
    }
}
