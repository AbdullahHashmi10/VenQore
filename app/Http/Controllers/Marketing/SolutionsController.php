<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class SolutionsController extends Controller
{
    /**
     * Display the Solutions Hub index page (/solutions).
     */
    public function index(): Response
    {
        return Inertia::render('Marketing/Solutions/Index');
    }

    /**
     * Display an industry-specific solutions page (/solutions/{slug}).
     */
    public function show(string $slug): Response
    {
        $validSlugs = ['pharmacy', 'electronics-store', 'grocery', 'wholesale', 'clothing', 'multi-store'];

        if (!in_array($slug, $validSlugs)) {
            abort(404, 'Industry solution not found.');
        }

        return Inertia::render('Marketing/Solutions/Show', [
            'slug' => $slug,
        ]);
    }
}
