<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppsController extends Controller
{
    public function downloadStation()
    {
        $release = \App\Support\StationRelease::metadata();
        abort_unless($release['is_live'], 503, 'The Station installer has not been published yet.');
        return redirect($release['installer_url'], 302)->header('Cache-Control', 'no-store');
    }

    /**
     * Show the dedicated native applications and downloads hub.
     * Displays VenQore Station for Windows and VenQore Mobile (Android & iOS) roadmap.
     */
    public function index(Request $request): Response
    {
        if (!app()->bound('current.tenant')) {
            abort(403, 'No tenant context.');
        }

        $tenant = app('current.tenant');

        return Inertia::render('Apps/Index', [
            'tenant' => [
                'id'    => $tenant->id,
                'name'  => $tenant->name,
                'slug'  => $tenant->slug,
                'plan'  => $tenant->plan,
            ],
            'apps' => [
                'windows' => \App\Support\StationRelease::metadata(),
                'mobile' => [
                    'name'         => 'VenQore Mobile Companion',
                    'status'       => 'coming_soon',
                    'is_live'      => false,
                    'platforms'    => ['Android (Google Play)', 'iOS (App Store)'],
                    'target_date'  => 'Q4 2026',
                    'features'     => [
                        'Instant camera barcode scanner for inventory audits',
                        'Floor stocktaking & rapid quantity adjustments',
                        'Mobile queue-busting POS checkout',
                        'Real-time low stock & end-of-day sales push alerts',
                    ],
                ],
            ],
        ]);
    }
}
