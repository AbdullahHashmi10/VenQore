<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Helpers\SettingsHelper;
use App\Services\PlanGate;
use Illuminate\Support\Facades\DB;

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
        // 1. Critical Cash Flow KPIs (Real-time V3 Journal)
        $reportSvc = app(\App\Services\V3\ReportService::class);
        $financeSvc = app(\App\Services\FinancialReportingService::class);
        
        // Today's snapshot for the Right Panel
        $todayMovement = $reportSvc->getCashMovement(now()->startOfDay(), now()->endOfDay());
        
        // MTD (Month to Date) for the main KPI tiles
        $mtdMovement = $reportSvc->getCashMovement(now()->startOfMonth(), now()->endOfMonth());
        
        $totalRevenue = $mtdMovement['cash_in'];
        $totalExpenses = $mtdMovement['cash_out'];
        $netProfit = $mtdMovement['net'];

        // V3 Accounts Receivable (1200) - Real-time
        $overduePayments = $financeSvc->getReceivables();

        // 3. Staff Logic: Count UNIQUE users with an active session today
        $activeStaffCount = \App\Models\StaffAttendance::whereNull('check_out')
            ->whereDate('check_in', now()->toDateString())
            ->distinct('user_id')
            ->count('user_id');
        
        $tenant = app('current.tenant');
        $totalStaffCount = 0;
        
        if ($tenant) {
            $totalStaffCount = \App\Models\TenantUser::where('tenant_id', $tenant->id)
                ->whereNotIn('role', ['platform_admin', 'admin'])
                ->count();
        } else {
            // Fallback for when no tenant is bound (should not happen in store context)
            $totalStaffCount = \App\Models\User::count();
        }

        // 4. Last Backup: Fetch real timestamp from disk
        $lastBackupStr = 'Never';
        $backupFiles = \Illuminate\Support\Facades\Storage::disk('local')->files('backups');
        if (!empty($backupFiles)) {
            $lastBackupFile = collect($backupFiles)->sortByDesc(function($file) {
                return \Illuminate\Support\Facades\Storage::disk('local')->lastModified($file);
            })->first();
            
            $lastBackupTime = \Illuminate\Support\Facades\Storage::disk('local')->lastModified($lastBackupFile);
            $lastBackupStr = \Carbon\Carbon::createFromTimestamp($lastBackupTime)->diffForHumans();
        }

        // 2. Profitability Trend (Last 6 Months) - Now using Cash Basis
        $profitData = collect(range(5, 0))->map(function ($i) use ($reportSvc) {
            $date = now()->subMonths($i);
            $monthName = $date->format('M');
            
            $start = $date->copy()->startOfMonth();
            $end = $date->copy()->endOfMonth();
            
            $movement = $reportSvc->getCashMovement($start, $end);

            return [
                'month' => $monthName,
                'profit' => $movement['net'],
                'expenses' => $movement['cash_out'],
                'revenue' => $movement['cash_in']
            ];
        })->values();

        // 3. Staff Performance (Top 5 by Current Month Sales)
        $staffPerformance = \App\Models\User::whereHas('memberships', function($q) use ($tenant) {
                if ($tenant) $q->where('tenant_id', $tenant->id);
            })
            ->get()
            ->map(function ($user) use ($tenant) {
                $mtdSales = \App\Models\Sale::where('user_id', $user->id)
                    ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
                    ->where('status', 'posted')
                    ->sum('total');

                $totalHours = \App\Models\StaffDailySummary::where('user_id', $user->id)
                    ->whereBetween('date', [now()->startOfMonth(), now()->endOfMonth()])
                    ->sum('total_hours') ?? 0;

                // Get role from membership
                $membership = $tenant ? $user->memberships()->where('tenant_id', $tenant->id)->first() : null;
                $displayRole = $membership ? $membership->role : ($user->role ?? 'Staff');

                return [
                    'name' => $user->name,
                    'role' => ucfirst($displayRole),
                    'sales' => (float)$mtdSales,
                    'hours' => round($totalHours, 1),
                    'efficiency' => $totalHours > 0 ? min(100, round(($mtdSales / $totalHours) / 10)) : 0
                ];
            })
            ->sortByDesc('sales')
            ->take(5)
            ->values();

        // 4. Inventory Health (Synchronized with Catalog/stocks table for real-time accuracy)
        $products = \App\Models\Product::query()->get()->map(function ($product) {
             // Use the same logic as InventoryController@index to ensure "Real Data" consistency
             $product->stock_quantity = (float) \App\Models\Stock::where('product_id', $product->id)->sum('quantity');
             return $product;
        });

        $lowStockThreshold = (int) \App\Helpers\SettingsHelper::getLowStockThreshold();

        $outOfStockCount = $products->where('stock_quantity', '<=', 0)->count();
        $lowStockCount = $products->filter(function ($p) use ($lowStockThreshold) {
            $threshold = $p->alert_quantity > 0 ? $p->alert_quantity : $lowStockThreshold;
            return $p->stock_quantity > 0 && $p->stock_quantity <= $threshold;
        })->count();

        $totalProducts = $products->count();

        // Healthy: Everything else (stock > threshold)
        $healthyStockCount = $totalProducts - $lowStockCount - $outOfStockCount;

        // Ensure no negative values
        $healthyStockCount = max(0, $healthyStockCount);

        // Calculate percentages
        $inventoryHealth = [
            'healthy' => $totalProducts > 0 ? round(($healthyStockCount / $totalProducts) * 100) : 100,
            'lowStock' => $totalProducts > 0 ? round(($lowStockCount / $totalProducts) * 100) : 0,
            'outOfStock' => $totalProducts > 0 ? round(($outOfStockCount / $totalProducts) * 100) : 0,
            'lowStockCount' => $lowStockCount,
            'outOfStockCount' => $outOfStockCount,
            'deadStock' => 0,
        ];

        // 5. Payment Methods
        $paymentMethods = \App\Models\Sale::select('payment_method', DB::raw('count(*) as count'))
            ->groupBy('payment_method')
            ->orderByDesc('count')
            ->get()
            ->map(function ($item, $index) {
                $colors = ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ef4444'];
                return [
                    'name' => ucfirst($item->payment_method),
                    'value' => $item->count,
                    'color' => $colors[$index % count($colors)]
                ];
            });

        // Get Currency Symbol
        $currencyCode = SettingsHelper::get('currency', 'PKR');
        $currencySymbols = [
            'PKR' => 'Rs. ',
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            'AED' => 'AED ',
            'SAR' => 'SAR ',
            'INR' => '₹',
        ];
        $currencySymbol = $currencySymbols[$currencyCode] ?? $currencyCode . ' ';

        // 6. Recent Activity (PHYSICAL CASH FLOW ONLY)
        $activities = \App\Models\Payment::where('method', 'cash')
            ->where('amount', '>', 0)
            ->with(['sale', 'party'])
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($pmt) {
                $isPlus = $pmt->type === 'in';
                $isPurchase = strpos($pmt->reference, 'PUR-') === 0 || ($pmt->notes && strpos($pmt->notes, 'Purchase') !== false);
                
                $reason = 'Cash Payment';
                if ($pmt->sale) $reason = 'Sale #' . $pmt->sale->reference_number;
                elseif ($isPurchase) $reason = 'Purchase #' . ($pmt->reference ?: 'Ref');
                
                if ($pmt->party) $reason .= ' (' . $pmt->party->name . ')';

                return [
                    'id' => $pmt->id,
                    'type' => $pmt->sale ? 'sale' : ($isPurchase ? 'purchase' : 'payment'),
                    'title' => $reason,
                    'subtitle' => $pmt->notes ?? '',
                    'amount' => ($isPlus ? '+' : '-') . ' Rs' . number_format($pmt->amount, 0),
                    'time' => $pmt->created_at->diffForHumans(),
                    'is_plus' => $isPlus
                ];
            });

        return \Inertia\Inertia::render('Admin/ExecutiveDashboard', [
            'mode' => 'admin',
            'currencySymbol' => $currencySymbol, // Pass symbol to frontend
            'stats' => [
                'net_profit' => $netProfit,
                'total_revenue' => $totalRevenue,
                'total_expenses' => $totalExpenses,
                'active_staff' => $activeStaffCount,
                'total_staff' => $totalStaffCount,
                'overdue_payments' => $overduePayments,
                'today_in' => $todayMovement['cash_in'],
                'today_out' => $todayMovement['cash_out'],
                'today_net' => $todayMovement['today_net'] ?? $todayMovement['net'],
                'net_balance' => (function() {
                    try {
                        $accSvc = app(\App\Services\V3\AccountingService::class);
                        return $accSvc->getBalance('1000') + $accSvc->getBalance('1010');
                    } catch (\Exception $e) {
                        return 0.00;
                    }
                })(),
                'last_backup' => $lastBackupStr,
            ],
            'profitData' => $profitData,
            'staffPerformance' => $staffPerformance,
            'recentActivity' => $activities,
            'inventoryHealth' => $inventoryHealth,
            'topProducts' => \App\Models\SaleItem::selectRaw('product_id, SUM(quantity) as sold_qty, SUM(subtotal) as revenue')
                ->groupBy('product_id')
                ->orderByDesc('revenue')
                ->take(5)
                ->with('product.category')
                ->get()
                ->map(function ($item) {
                     $product = $item->product;
                     $category = $product && $product->category ? $product->category->name : 'General';
                     $productName = $product ? $product->name : 'Unknown Product';

                     return [
                         'name' => $productName,
                         'cat' => $category,
                         'sales' => (float)$item->revenue,
                         'stock' => $product ? ($product->stock_quantity ?? 0) : 0
                     ];
                }),
            'expenseData' => (function() {
                 $colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                 $tenant = app('current.tenant');
                 return DB::table('journal_items as ji')
                     ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
                     ->join('accounts as a', 'a.id', '=', 'ji.account_id')
                     ->where('je.tenant_id', $tenant->id)
                     ->where('a.type', 'expense')
                     ->where('a.code', '!=', '5000') // Exclude COGS from the "Expenses" card for clarity
                     ->where('je.is_reversed', 0)
                     ->whereBetween('je.date', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
                     ->selectRaw('a.name as category, SUM(ji.debit - ji.credit) as value')
                     ->groupBy('a.name')
                     ->orderByDesc('value')
                     ->take(6)
                     ->get()
                     ->map(function($item, $index) use ($colors) {
                         return [
                             'name' => $item->category,
                             'value' => (float)$item->value,
                             'color' => $colors[$index % count($colors)]
                         ];
                     });
            })(),
            'paymentMethods' => $paymentMethods
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

        return \Inertia\Inertia::render('Admin/Users', [
            'mode' => 'admin',
            'users' => $users,
            'attendance' => $attendance
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

        // Clear settings cache
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
                    if (\App\Models\User::where('passcode', $value)->exists()) {
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

        \App\Models\User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'role' => $validated['role'] ?? 'cashier',
            'permissions' => $validated['permissions'] ?? [],
            'passcode' => $validated['passcode'] ?? null,
        ]);

        return redirect()->back()->with('success', 'User created successfully');
    }

    public function updateUser(\Illuminate\Http\Request $request, $id)
    {
        $user = \App\Models\User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
            'role' => 'nullable|string|in:platform_admin,admin,manager,cashier,inventory_staff,accountant,custom',
            'permissions' => 'nullable|array',
            'passcode' => [
                'nullable',
                'string',
                'min:4',
                'max:6',
                function ($attribute, $value, $fail) use ($id) {
                    if (\App\Models\User::where('passcode', $value)->where('id', '!=', $id)->exists()) {
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

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        if (!empty($validated['password'])) {
            $user->password = bcrypt($validated['password']);
        }
        $user->role = $validated['role'] ?? $user->role;
        $user->permissions = $validated['permissions'] ?? $user->permissions;
        $user->passcode = $validated['passcode'] ?? $user->passcode;
        $user->save();

        return redirect()->back()->with('success', 'User updated successfully');
    }

    public function staffSummaries()
    {
        $tenant = app('current.tenant');
        $users = \App\Models\User::whereHas('memberships', function($q) use ($tenant) {
            if ($tenant) $q->where('tenant_id', $tenant->id);
        })->get();

        $staffData = $users->map(function ($user) use ($tenant) {
            $sales = \App\Models\Sale::where('user_id', $user->id)->get();
            $totalSales = $sales->sum('total');
            $transactionCount = $sales->count();
            $avgTransaction = $transactionCount > 0 ? $totalSales / $transactionCount : 0;

            // Month sales
            $monthSales = \App\Models\Sale::where('user_id', $user->id)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('total');

            // Last active
            $lastSale = $sales->sortByDesc('created_at')->first();
            $lastActive = $lastSale ? $lastSale->created_at->diffForHumans() : 'Never';

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

        return \Inertia\Inertia::render('Admin/StaffSummaries', [
            'mode' => 'admin',
            'staffData' => $staffData
        ]);
    }

    public function destroyUser($id)
    {
        $user = \App\Models\User::findOrFail($id);

        // Prevent deleting self
        if ($user->id === auth()->id()) {
            return redirect()->back()->with('error', 'You cannot delete yourself');
        }

        $user->delete();

        return redirect()->back()->with('success', 'User deleted successfully');
    }
}
