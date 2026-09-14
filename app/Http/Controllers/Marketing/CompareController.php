<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class CompareController extends Controller
{
    /**
     * Display the comparison hub page listing all competitor comparisons.
     */
    public function index(): Response
    {
        $competitors = [
            [
                'slug' => 'venqore-vs-square',
                'name' => 'Square POS',
                'title' => 'VenQore vs Square POS',
                'summary' => 'Zero transaction fees & built-in double-entry accounting vs 2.6% + 10¢ processing markups and external QuickBooks integrations.',
                'tag' => '2.6% Fee Alternative',
            ],
            [
                'slug' => 'venqore-vs-vyapar',
                'name' => 'Vyapar',
                'title' => 'VenQore vs Vyapar',
                'summary' => 'Auditor-grade double-entry general ledger & cross-platform cloud PWA vs desktop single-entry billing software.',
                'tag' => 'Double-Entry Upgrade',
            ],
        ];

        return Inertia::render('Marketing/Compare/Index', [
            'competitors' => $competitors,
        ]);
    }

    /**
     * Display a specific competitor comparison page.
     */
    public function show(string $slug): Response
    {
        // Normalize slug: strip "venqore-vs-" prefix if present
        $cleanSlug = str_replace('venqore-vs-', '', $slug);

        $validCompetitors = ['square', 'vyapar'];

        if (!in_array($cleanSlug, $validCompetitors)) {
            abort(404);
        }

        return Inertia::render('Marketing/Compare/Show', [
            'slug' => $cleanSlug,
            'fullSlug' => "venqore-vs-{$cleanSlug}",
        ]);
    }
}
