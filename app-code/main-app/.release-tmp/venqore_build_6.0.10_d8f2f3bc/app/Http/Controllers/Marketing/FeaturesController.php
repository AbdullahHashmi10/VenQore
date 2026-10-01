<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class FeaturesController extends Controller
{
    /** Valid deep-dive feature slugs. */
    protected const VALID_SLUGS = [
        'accounting',
        'growth-engine',
        'inventory-management',
        'offline-pos',
        'point-of-sale',
    ];

    /**
     * Display the /features/{slug} deep-dive page.
     */
    public function show(string $slug): Response
    {
        if (!in_array($slug, self::VALID_SLUGS, true)) {
            abort(404, 'Feature page not found.');
        }

        return Inertia::render('Marketing/Features/Show', [
            'slug' => $slug,
        ]);
    }
}
