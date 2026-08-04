<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\CustomCharge;
use App\Helpers\SettingsHelper;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/SettingsPanel', [
            'settings' => Setting::all()->pluck('value', 'key'),
            'customCharges' => CustomCharge::orderBy('sort_order')->get(),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'settings'                              => 'required|array',
            // Return flow
            'settings.pos_return_mode'              => 'nullable|string|in:reference,customer_or_reference,open',
            'settings.pos_return_window'            => 'nullable|integer|min:0',
            'settings.pos_return_window_behavior'   => 'nullable|string|in:warn,block',
            // Store info
            'settings.store_name'                   => 'nullable|string|max:255',
            'settings.currency_symbol'              => 'nullable|string|max:10',
            'settings.store_address'                => 'nullable|string|max:500',
            'settings.store_phone'                  => 'nullable|string|max:30',
            // POS toggles (sent as '0'/'1' strings)
            'settings.pos_auto_fill_cash'           => 'nullable|string|in:0,1',
            'settings.senior_mode'                  => 'nullable|string|in:0,1',
            'settings.fbr_integration'              => 'nullable|string|in:0,1',
            'settings.show_margin_percentage'       => 'nullable|string|in:0,1',
            'settings.stop_sale_negative_stock'     => 'nullable|string|in:0,1',
            'settings.round_off_total'              => 'nullable|string|in:none,0,1,2,3,4',
            'settings.charity_enabled'              => 'nullable|string|in:0,1',
            // Numeric
            'settings.default_tax_rate'             => 'nullable|numeric|min:0|max:100',
            // Enum
            'settings.product_cost_update_policy'   => 'nullable|string|in:never,always,increase_only,decrease_only',
            // Security
            'settings.enable_passcode'              => 'nullable|string|in:0,1',
            'settings.admin_passcode'               => 'nullable|string|max:6|regex:/^[0-9]*$/',
        ]);

        foreach ($data['settings'] as $key => $value) {
            if (is_bool($value)) {
                $value = $value ? '1' : '0';
            }

            // SEC-1 (2026-07-03): admin passcode is stored as a bcrypt hash, never plaintext.
            // An empty submission means "keep the current passcode".
            if ($key === 'admin_passcode') {
                if ($value === null || $value === '') {
                    continue;
                }
                $value = \Illuminate\Support\Facades\Hash::make($value);
            }
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => is_array($value) ? json_encode($value) : (string) $value]
            );
        }

        // Sync metadata to Tenant model
        $tenant = app('current.tenant');
        if ($tenant) {
            $syncNeeded = false;
            if (isset($data['settings']['store_name'])) {
                $tenant->name = $data['settings']['store_name'];
                $syncNeeded = true;
            }
            if (isset($data['settings']['currency_symbol'])) {
                $tenant->currency_symbol = $data['settings']['currency_symbol'];
                $syncNeeded = true;
            }
            if ($syncNeeded) {
                $tenant->save();
            }
        }

        // Clear settings cache so new values take effect immediately
        if ($tenant) {
            \Illuminate\Support\Facades\Cache::forget("settings:{$tenant->id}");
        }
        \Illuminate\Support\Facades\Cache::forget('settings:global');
        SettingsHelper::clearCache();

        return back()->with('success', 'Settings updated successfully');
    }

    // Custom Charges CRUD
    public function storeCharge(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'default_amount' => 'required|numeric|min:0',
            'is_percentage' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $data['sort_order'] = CustomCharge::max('sort_order') + 1;

        CustomCharge::create($data);

        return back()->with('success', 'Custom charge added!');
    }

    public function updateCharge(Request $request, CustomCharge $charge)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'default_amount' => 'required|numeric|min:0',
            'is_percentage' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $charge->update($data);

        return back()->with('success', 'Charge updated!');
    }

    public function deleteCharge(CustomCharge $charge)
    {
        $charge->delete();
        return back()->with('success', 'Charge deleted!');
    }

    public function updateDataPrivacy(Request $request)
    {
        $data = $request->validate([
            'shared_catalog_opt_out' => 'required|boolean',
            'ai_accuracy_opt_in'     => 'required|boolean',
        ]);

        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        if (!$tenant && auth()->check() && auth()->user()->last_store_id) {
            $tenant = Tenant::find(auth()->user()->last_store_id);
        }

        if ($tenant && $tenant->id) {
            \Illuminate\Support\Facades\DB::table('tenants')
                ->where('id', $tenant->id)
                ->update([
                    'shared_catalog_opt_out' => $data['shared_catalog_opt_out'],
                    'ai_accuracy_opt_in'     => $data['ai_accuracy_opt_in'],
                ]);
        }

        return back()->with('success', 'Data privacy settings updated!');
    }
}

