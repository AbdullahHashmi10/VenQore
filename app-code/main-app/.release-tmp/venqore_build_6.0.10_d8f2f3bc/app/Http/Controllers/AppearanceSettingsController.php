<?php

namespace App\Http\Controllers;

use App\Support\Appearance;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Settings → Appearance.
 *
 * A separate page rather than another section inside the existing settings
 * panel: appearance is the one setting a user changes for themselves rather than
 * for the store, and burying a personal preference among tax rates and invoice
 * numbering is how it goes unfound. It is also the only settings screen a member
 * of staff with no admin rights can safely be given.
 */
class AppearanceSettingsController extends Controller
{
    public function index(Request $request)
    {
        abort_unless(Appearance::NEW_EXPERIENCE_ENABLED, 404);

        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;

        return Inertia::render('Settings/Appearance', [
            'appearance' => Appearance::forRequest(),
            'storeDefault' => Appearance::tenantDefault(),

            // Only an admin sees the store-wide default controls. Everyone else
            // gets the personal ones, which is the majority case.
            'canManageStoreDefault' => (bool) $request->user()?->hasPermission('admin.settings_manage'),

            // Fonts, densities and radii are not shared: the settings screen no
            // longer offers them, and shipping the lists would invite a client
            // to render controls for dials the backend now pins.
            'options' => [
                'modes' => Appearance::MODES,
                'experiences' => Appearance::EXPERIENCES,
            ],

            'storeSlug' => $tenant?->slug,
        ]);
    }
}
