<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class RoadmapController extends Controller
{
    /**
     * Display the public product roadmap (Now / Next / Later).
     */
    public function index(): Response
    {
        return Inertia::render('Marketing/Roadmap');
    }
}
