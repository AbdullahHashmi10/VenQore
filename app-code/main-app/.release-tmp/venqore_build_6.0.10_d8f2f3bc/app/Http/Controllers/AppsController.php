<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppsController extends Controller
{
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
                'windows' => [
                    'name'            => 'VenQore Station for Windows',
                    'version'         => '1.4.2',
                    'release_date'    => '2026-09-01',
                    'installer_url'   => '/downloads/VenQore_Station_Setup.exe',
                    'file_size'       => '84.6 MB',
                    'min_os'          => 'Windows 10 / 11 (64-bit)',
                    'status'          => 'stable',
                    'is_live'         => true,
                ],
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
