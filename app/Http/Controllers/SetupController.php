<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Setting;
use App\Models\Category;
use App\Models\ProductAttribute;
use App\Models\Unit;
use Illuminate\Support\Facades\DB;

class SetupController extends Controller
{
    public function index()
    {
        $rawIndustries = config('industries');
        $groupedIndustries = [];

        // Group industries by 'group' key
        foreach ($rawIndustries as $key => $data) {
            $groupName = $data['group'];
            
            if (!isset($groupedIndustries[$groupName])) {
                $groupedIndustries[$groupName] = [
                    'name' => $groupName,
                    'icon' => $this->getGroupIcon($groupName),
                    'types' => []
                ];
            }
            // Add the key to the data so frontend knows it
            $data['key'] = $key;
            $groupedIndustries[$groupName]['types'][$key] = $data;
        }
        
        
        return Inertia::render('SetupWizard', [
            'industries'       => $groupedIndustries,
            'userEmail'        => auth()->user()->email ?? '', // Pass current user email
            'initialStoreName' => app('current.tenant')->name ?? '', // Pre-fill with store name
            'store_slug'       => app('current.tenant')->slug,
            'store_logo'       => app('current.tenant')->logo_url, // Added logo URL
        ]);
    }

    private function getGroupIcon($groupName)
    {
        return match($groupName) {
            'Big Retail' => 'Store',
            'Hard Goods' => 'Wrench',
            'Lifestyle' => 'ShoppingBag',
            'Food & Beverage' => 'Coffee',
            'Niche' => 'Briefcase',
            default => 'Store'
        };
    }

    public function complete(Request $request)
    {
        $request->validate([
            'business_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:50',
            'address' => 'required|string|max:500',
            'currency_symbol' => 'required|string|max:10',
            'currency_code' => 'required|string|max:10',
            'industry_key' => 'required|string',
            'logo_style' => 'nullable|string|max:50',
            'logo_file' => 'nullable|image|max:5120',
        ]);

        try {
            DB::beginTransaction();

            // 1. Save Basic Settings (Aligned with Admin/Settings.jsx)
            Setting::updateOrCreate(['key' => 'business_name'], ['value' => $request->business_name]);
            Setting::updateOrCreate(['key' => 'business_email'], ['value' => $request->email]);
            Setting::updateOrCreate(['key' => 'business_phone'], ['value' => $request->phone]);
            Setting::updateOrCreate(['key' => 'business_address'], ['value' => $request->address]);
            Setting::updateOrCreate(['key' => 'currency'], ['value' => $request->currency_code]);
            Setting::updateOrCreate(['key' => 'currency_symbol'], ['value' => $request->currency_symbol]);
            Setting::updateOrCreate(['key' => 'industry'], ['value' => $request->industry_key]);
            
            // Legacy and Shared fallbacks for older components
            Setting::updateOrCreate(['key' => 'store_name'], ['value' => $request->business_name]);
            Setting::updateOrCreate(['key' => 'store_phone'], ['value' => $request->phone]);
            Setting::updateOrCreate(['key' => 'store_address'], ['value' => $request->address]);
            Setting::updateOrCreate(['key' => 'email'], ['value' => $request->email]);
            Setting::updateOrCreate(['key' => 'phone'], ['value' => $request->phone]);
            Setting::updateOrCreate(['key' => 'address'], ['value' => $request->address]);
            Setting::updateOrCreate(['key' => 'currency_code'], ['value' => $request->currency_code]);
            
            // Handle Logo
            if ($request->hasFile('logo_file')) {
                $path = $request->file('logo_file')->store('company_logos', 'public');
                Setting::updateOrCreate(['key' => 'company_logo'], ['value' => $path]);
                Setting::updateOrCreate(['key' => 'logo_style'], ['value' => 'custom']);
            } else {
                Setting::updateOrCreate(['key' => 'logo_style'], ['value' => $request->logo_style ?? 'minimal']);
            }

            // 2. Load Industry Config (Case-insensitive lookup)
            $allIndustries = config('industries');
            $industryKey   = $request->industry_key;
            $matchedKey    = collect(array_keys($allIndustries))->first(fn($k) => strtolower($k) === strtolower($industryKey));
            $industryConfig = $matchedKey ? $allIndustries[$matchedKey] : null;

            // 3. Finalize Local Setup Flag (Legacy fallback)
            Setting::updateOrCreate(['key' => 'setup_completed'], ['value' => '1']);

            // 4. Update SaaS Tenant Record (Primary for SaaS)
            if (app()->bound('current.tenant')) {
                /** @var \App\Models\Tenant $tenantSync */
                $tenantSync = app('current.tenant');
                
                // Ensure we are working with a fresh instance from the DB
                $tenantSync->refresh();

                $tenantSync->setup_completed = true;
                $tenantSync->logo_style      = $request->logo_style;
                $tenantSync->industry        = $matchedKey; // Use original casing from config
                $tenantSync->currency_symbol = $request->currency_symbol;
                $tenantSync->currency_code   = $request->currency_code;
                $tenantSync->name            = $request->business_name;
                
                // Handle Logo Persistence for SaaS
                if ($request->hasFile('logo_file')) {
                    $path = $request->file('logo_file')->store('logos', 'public');
                    $tenantSync->logo_path = $path;
                }

                $tenantSync->save();
            }


            if ($industryConfig) {
                // Apply System Settings
                if (isset($industryConfig['settings'])) {
                    foreach ($industryConfig['settings'] as $key => $value) {
                        Setting::updateOrCreate(['key' => $key], ['value' => (string)$value]);
                    }
                }

                // Seed Categories (Structure needs check: is it array of strings or key-value?)
                if (isset($industryConfig['categories'])) {
                    foreach ($industryConfig['categories'] as $catName => $subCats) {
                        // $catName might be the key if the array is associative (e.g. 'Dairy' => [])
                        // Or value if indexed?
                        // Checked config: 'Fresh Produce' => ['Fruits',...]
                        
                        $mainCat = Category::firstOrCreate(['name' => $catName], ['code' => strtoupper(substr($catName, 0, 3))]);
                        
                        // Seed sub-categories if needed? (Not in DB schema yet, skipping)
                    }
                }

                // Seed Units
                if (isset($industryConfig['units'])) {
                    foreach ($industryConfig['units'] as $unitName) {
                        Unit::firstOrCreate(
                            ['name' => $unitName], 
                            ['short_name' => strtolower(substr($unitName, 0, 3)), 'operator' => '*', 'operator_value' => 1]
                        );
                    }
                }

                // Seed Attributes (Variants)
                if (isset($industryConfig['attributes'])) {
                    foreach ($industryConfig['attributes'] as $attrName => $options) {
                        $attr = ProductAttribute::firstOrCreate(
                            ['name' => $attrName], 
                            ['type' => 'select', 'is_active' => true]
                        );
                    }
                }

                // ── §9 Industry Feature Flags ──────────────────────────────
                // Map industry config keys to the Setting keys that
                // SettingsHelper and the UI actually read.
                // Apparel/Fashion: variants_enabled → 'variants_enabled' = true
                // Electronics/IT: serial_tracking → 'serial_tracking_enabled' = true
                // Pharmacy: batch_tracking → 'batch_tracking_enabled' = true
                $featureMap = [
                    'variants_enabled'     => 'variants_enabled',
                    'serial_tracking'      => 'serial_tracking_enabled',
                    'batch_tracking'       => 'batch_tracking_enabled',
                    'weight_decimals'      => 'decimal_places',   // Jewelry uses precise decimals
                    'batch_tracking_enabled' => 'batch_tracking_enabled',
                ];

                if (isset($industryConfig['settings'])) {
                    foreach ($industryConfig['settings'] as $configKey => $value) {
                        $settingKey = $featureMap[$configKey] ?? $configKey;
                        // Cast booleans to '1'/'0' for DB storage
                        $dbValue = is_bool($value) ? ($value ? '1' : '0') : (string) $value;
                        Setting::updateOrCreate(['key' => $settingKey], ['value' => $dbValue]);
                    }
                }
            }

            // Clear settings cache after wizard (must happen after all saves)
            \App\Helpers\SettingsHelper::clearCache();

            DB::commit();

            // SaaS: stay logged in and go to store dashboard (tenant is now active)
            if (app()->bound('current.tenant')) {
                return redirect()->route('store.dashboard', ['store_slug' => app('current.tenant')->slug])
                    ->with('success', 'Welcome to VenQore! Your store is ready.');
            }

            // Fallback (Single-tenant or detached context)
            return redirect()->route('dashboard')->with('success', 'Setup completed successfully!');


        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Setup failed: ' . $e->getMessage()]);
        }
    }
}
