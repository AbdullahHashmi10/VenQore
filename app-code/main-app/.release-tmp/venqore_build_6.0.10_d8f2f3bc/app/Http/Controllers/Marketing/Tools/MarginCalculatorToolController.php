<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Support\ToolRegistry;
use Inertia\Inertia;

/**
 * MarginCalculatorToolController — free Profit Margin & Markup Calculator.
 *
 * Unlike the other free tools, this one has NO server-side computation
 * endpoint at all. Every calculation (margin/markup solving, bulk table,
 * CSV export) happens client-side in React for instant feedback. The
 * controller's only job is to render the Inertia page with the tool nav.
 * Free, ungated, no rate limiting concerns since there is no POST route.
 */
class MarginCalculatorToolController extends Controller
{
    public function index()
    {
        return Inertia::render('Marketing/Tools/MarginCalculator', [
            'toolGroups' => ToolRegistry::groups(),
        ]);
    }
}
