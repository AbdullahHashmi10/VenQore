<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\DemoVisitorLog;
use App\Services\DemoStoreService;
use App\Services\ModuleService;
use App\Support\BusinessTypes;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;

class DemoController extends Controller
{
    /**
     * Business types and role cards — the only data the picker shows. Shared by
     * the /demo page and the in-app demo pill so the two can never disagree.
     */
    private function pickerData(): array
    {
        $types = [];
        foreach (BusinessTypes::all() as $key => $type) {
            $types[] = [
                'key'    => $key,
                'name'   => $type['label'] ?? $type['name'] ?? ucfirst(str_replace('_', ' ', $key)),
                'sector' => $type['sector'],
                'note'   => $type['note'] ?? null,
            ];
        }

        // The 7 Primary Roles
        $primaryRoles = [
            [
                'id'       => 'owner',
                'name'     => 'Store Owner',
                'desc'     => 'Complete executive control, financial ledgers, tax reports, and full team management.',
                'badge'    => 'Full Executive Access',
            ],
            [
                'id'       => 'admin',
                'name'     => 'Store Administrator',
                'desc'     => 'Comprehensive store operations, catalog management, inventory shifts, and configurations.',
                'badge'    => 'Operations & Admin',
            ],
            [
                'id'       => 'manager',
                'name'     => 'Store Manager',
                'desc'     => 'Supervises daily registers, floor shifts, customer discounts, voids, and performance summaries.',
                'badge'    => 'Floor Supervision',
            ],
            [
                'id'       => 'cashier',
                'name'     => 'Cashier & Counter Sales',
                'desc'     => 'Fast-lane POS terminal checkout, barcode scans, cash & digital payments, and returns.',
                'badge'    => 'POS & Register Till',
            ],
            [
                'id'       => 'accountant',
                'name'     => 'Financial Accountant',
                'desc'     => 'Reviews double-entry cash flow, reconciles bank accounts, manages vendor payouts and P&L.',
                'badge'    => 'Financial Books & Ledgers',
            ],
            [
                'id'       => 'purchasing_officer',
                'name'     => 'Purchasing Officer',
                'desc'     => 'Vendor procurement, purchase orders (POs), bills, receiving shipments, and debit notes.',
                'badge'    => 'Procurement & Vendors',
            ],
            [
                'id'       => 'viewer',
                'name'     => 'Auditor / Read-Only Viewer',
                'desc'     => 'Read-only business analytics, security audit trails, and financial statements without edit powers.',
                'badge'    => 'Read-Only Audit',
            ],
        ];

        // The 10 Specialized Roles from the permission system
        $specializedRoles = [
            [
                'id'       => 'franchise_admin',
                'name'     => 'Franchise Administrator',
                'desc'     => 'Multi-branch operations, centralized inventory distributions, POS rules, and branch reporting.',
                'badge'    => 'Franchise & Multi-Outlet',
            ],
            [
                'id'       => 'shift_supervisor',
                'name'     => 'Shift Supervisor',
                'desc'     => 'Floor lead with cart discount overrides, staff attendance oversight, and drawer closeouts.',
                'badge'    => 'Floor Lead',
            ],
            [
                'id'       => 'inventory_controller',
                'name'     => 'Inventory Controller',
                'desc'     => 'Physical stock counting, warehouse transfers, barcode printing, and low stock replenishment.',
                'badge'    => 'Warehousing & Stock',
            ],
            [
                'id'       => 'production_supervisor',
                'name'     => 'Factory & Production Lead',
                'desc'     => 'Bills of materials (BOM), assembly stages, raw material allocation, and batch runs.',
                'badge'    => 'Manufacturing & BOM',
            ],
            [
                'id'       => 'kitchen_manager',
                'name'     => 'Kitchen Manager / Chef Lead',
                'desc'     => 'Front-of-house kitchen display system (KDS), dine-in table tickets, and food prep inventory.',
                'badge'    => 'Kitchen & Table Service',
            ],
            [
                'id'       => 'dispenser',
                'name'     => 'Pharmacy Dispenser & Specialist',
                'desc'     => 'Prescription counter, clinical product lookups, batch numbers, and medical checkouts.',
                'badge'    => 'Clinical Counter & Health',
            ],
            [
                'id'       => 'sales_executive',
                'name'     => 'B2B & Field Sales Executive',
                'desc'     => 'Client price quotes, B2B wholesale orders, custom credit terms, and customer directories.',
                'badge'    => 'B2B & Wholesale Orders',
            ],
            [
                'id'       => 'fulfillment_lead',
                'name'     => 'Fulfillment & Dispatch Lead',
                'desc'     => 'Order picking, packing, multi-depot stock transfers, and parcel courier handoffs.',
                'badge'    => 'Logistics & Dispatch',
            ],
            [
                'id'       => 'delivery_driver',
                'name'     => 'Delivery Driver & Courier',
                'desc'     => 'Dedicated rider view for assigned deliveries, status progression, and cash collection.',
                'badge'    => 'Courier & Last-Mile',
            ],
            [
                'id'       => 'hr_officer',
                'name'     => 'HR & Staffing Officer',
                'desc'     => 'Employee schedules, clock-in logs, staff work hours, and team productivity scorecards.',
                'badge'    => 'Staff & Attendance',
            ],
        ];

        return [
            'businessTypes'    => $types,
            'primaryRoles'     => $primaryRoles,
            'specializedRoles' => $specializedRoles,
        ];
    }

    /**
     * The /demo page: one button that opens a business → user-type picker.
     */
    public function landing(Request $request)
    {
        $requestedType = $request->query('business_type') ?: session('demo_business_type');
        $requestedType = ($requestedType && BusinessTypes::exists((string) $requestedType)) ? $requestedType : null;

        return Inertia::render('Demo/Landing', $this->pickerData() + [
            'initialBusinessType' => $requestedType,
            'initialRole'         => $request->query('role') ?: session('demo_role', 'owner'),
            'flash'               => [
                'error'   => session('error'),
                'success' => session('success'),
                'info'    => session('info'),
            ],
        ]);
    }

    /**
     * Picker data plus the visitor's current choice, for the in-app demo pill.
     */
    public function options(Request $request)
    {
        return response()->json($this->pickerData() + [
            'currentBusinessType' => session('demo_business_type'),
            'currentRole'         => session('demo_role', 'owner'),
        ]);
    }

    /**
     * Log into the shared demo instance with tailored business type modules and chosen role/permissions.
     */
    public function login(Request $request): RedirectResponse
    {
        $role = $request->input('role', 'owner');
        $allConfigRoles = array_keys(config('permissions', []));
        $allowedRoles = array_unique(array_merge($allConfigRoles, [
            'owner', 'admin', 'manager', 'cashier', 'accountant', 'purchasing_officer', 'viewer',
            'franchise_admin', 'shift_supervisor', 'inventory_controller', 'hr_officer',
            'production_supervisor', 'kitchen_manager', 'dispenser', 'sales_executive',
            'fulfillment_lead', 'delivery_driver', 'custom'
        ]));

        if (!in_array($role, $allowedRoles, true)) {
            $role = 'owner';
        }

        // Resolve and validate chosen business type (supports all 85 options)
        $businessTypeKey = $request->input('business_type', 'furniture_maker');
        if (!BusinessTypes::exists($businessTypeKey)) {
            $matched = BusinessTypes::match($businessTypeKey);
            $businessTypeKey = $matched['key'] ?? 'furniture_maker';
        }

        $businessTypeInfo = BusinessTypes::get($businessTypeKey) ?? [
            'key'    => $businessTypeKey,
            'name'   => ucfirst(str_replace('_', ' ', $businessTypeKey)),
            'label'  => ucfirst(str_replace('_', ' ', $businessTypeKey)),
            'sector' => 'manufacturing',
        ];

        $demoTenant = DemoStoreService::goldenMaster();

        $hasData = \Illuminate\Support\Facades\Schema::hasTable('sales')
            && \Illuminate\Support\Facades\DB::table('sales')->where('tenant_id', $demoTenant->id)->exists();

        if (!$hasData) {
            return redirect()->route('demo.landing')->with(
                'error',
                'The demo store is currently regenerating data. Please try again in 30 seconds.'
            );
        }

        // Calculate exact tailored modules for this business type (e.g. factory gets BOM & production, restaurant gets FOH)
        $enabledModuleKeys = BusinessTypes::modulesFor($businessTypeKey);
        $allRegisteredModules = config('modules', []);
        $moduleMap = [];
        foreach (array_keys($allRegisteredModules) as $modKey) {
            $moduleMap[$modKey] = in_array($modKey, $enabledModuleKeys, true);
        }

        // Persist tailored modules to tenant_modules table so database state stays consistent
        $now = now();
        foreach ($moduleMap as $modKey => $isEnabled) {
            DB::table('tenant_modules')->updateOrInsert(
                ['tenant_id' => $demoTenant->id, 'module_key' => $modKey],
                ['enabled' => (bool) $isEnabled, 'source' => 'demo_preset', 'updated_at' => $now, 'created_at' => $now]
            );
        }
        ModuleService::invalidate($demoTenant->id);

        // Update tenant business type and sector
        $demoTenant->update([
            'business_type'        => $businessTypeKey,
            'industry'             => $businessTypeInfo['sector'] ?? 'manufacturing',
            'onboarding_completed' => true,
            'onboarding_step'      => 'completed',
        ]);

        // Handle custom permissions if specified
        $isCustom = (bool) $request->input('is_custom_permissions') || $role === 'custom';
        $inputPermissions = $request->input('permissions');
        $customPermissions = (is_array($inputPermissions) && count($inputPermissions) > 0)
            ? array_values(array_unique(array_filter($inputPermissions)))
            : null;

        // Ensure user exists for this role with EMAIL VERIFIED!
        $email = "demo-{$role}@venqore-demo.internal";
        $demoUser = User::withTrashed()->where('email', $email)->first();
        
        if (!$demoUser) {
            $demoUser = new User();
            $demoUser->email = $email;
            $demoUser->name = 'Demo ' . ucfirst(str_replace('_', ' ', $role));
            $demoUser->password = bcrypt(Str::random(64));
            $demoUser->email_verified_at = now();
            $demoUser->save();
        } else {
            if ($demoUser->trashed()) {
                $demoUser->restore();
            }
            if (!$demoUser->email_verified_at) {
                $demoUser->forceFill(['email_verified_at' => now()])->save();
            }
        }

        // Determine pivot role and permissions override
        $overrideMode = ($isCustom || $customPermissions !== null) ? 'custom' : 'inherit';
        $pivotRole = ($isCustom && $role === 'owner' && $customPermissions !== null) ? 'admin' : $role;

        // Update TenantUser record for this demo user
        TenantUser::updateOrCreate(
            ['tenant_id' => $demoTenant->id, 'user_id' => $demoUser->id],
            [
                'role'                     => $pivotRole,
                'permission_override_mode' => $overrideMode,
                'permissions'              => $customPermissions,
                'status'                   => 'active',
                'joined_at'                => now(),
            ]
        );

        // Log in the demo user
        Auth::login($demoUser, false);
        $request->session()->regenerate();

        // Store demo session preferences for per-visitor isolated module resolution
        $businessLabel = $businessTypeInfo['label'] ?? $businessTypeInfo['name'] ?? ucfirst(str_replace('_', ' ', $businessTypeKey));
        // One stable id per visitor (kept across business/role switches) so the
        // records they create stay theirs. See App\Traits\DemoVisitorScoped.
        if (! $request->session()->get('demo_visitor_id')) {
            $request->session()->put('demo_visitor_id', (string) Str::uuid());
        }
        $request->session()->put('demo_business_type', $businessTypeKey);
        $request->session()->put('demo_business_label', $businessLabel);
        $request->session()->put('demo_modules', $moduleMap);
        $request->session()->put('demo_role', $role);
        $request->session()->put('demo_permissions', $customPermissions);

        // Track the visit
        $demoTenant->increment('demo_visit_count');
        $demoTenant->increment('demo_visit_today');
        Cache::increment('demo_visit_live');
        Cache::put("demo_user_{$request->session()->getId()}", true, now()->addHours(2));
        DemoVisitorLog::recordVisit($role);

        $demoUser->update(['last_store_id' => $demoTenant->id]);

        return redirect()->route('store.dashboard', ['store_slug' => $demoTenant->slug]);
    }

    /**
     * Switch business type or role while inside the demo store without full logout.
     */
    public function switchBusiness(Request $request): RedirectResponse
    {
        $businessTypeKey = $request->input('business_type', session('demo_business_type', 'furniture_maker'));
        $role = $request->input('role', session('demo_role', 'owner'));

        return $this->login($request->merge([
            'business_type' => $businessTypeKey,
            'role'          => $role,
        ]));
    }

    /**
     * Log out of the demo.
     */
    public function logout(Request $request): RedirectResponse
    {
        Cache::decrement('demo_visit_live');
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('demo.landing');
    }
}
