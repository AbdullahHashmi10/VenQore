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
            'settings' => 'required|array',
        ]);

        foreach ($data['settings'] as $key => $value) {
            if (is_bool($value)) {
                $value = $value ? '1' : '0';
            }
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => is_array($value) ? json_encode($value) : (string) $value]
            );
        }

        // Clear settings cache so new values take effect immediately
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
}

