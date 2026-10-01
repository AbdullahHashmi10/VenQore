<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Support\ToolRegistry;
use Inertia\Inertia;

/**
 * FoodCostToolController — free Composition Costing Calculator.
 *
 * Pure client-side interactive recipe costing tool with unit conversions,
 * portion yield math, waste allowance, target food cost % pricing solver,
 * multi-recipe summary table, and CSV export.
 */
class FoodCostToolController extends Controller
{
    public function index()
    {
        return Inertia::render('Marketing/Tools/FoodCostCalculator', [
            'toolGroups' => ToolRegistry::groups(),
        ]);
    }
}
