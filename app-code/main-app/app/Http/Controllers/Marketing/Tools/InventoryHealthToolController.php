<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Support\ToolRegistry;
use Inertia\Inertia;

/**
 * InventoryHealthToolController — free Inventory Health Toolkit.
 *
 * Bundles reorder point, safety stock, EOQ, GMROI and inventory turnover
 * into one page. Like the Margin Calculator, this has NO server-side
 * computation endpoint — every calculation happens client-side in React
 * for instant, live feedback. The controller's only job is to render the
 * Inertia page with the tool nav. Free, ungated, no rate limiting concerns
 * since there is no POST route.
 */
class InventoryHealthToolController extends Controller
{
    public function index()
    {
        return Inertia::render('Marketing/Tools/InventoryHealth', [
            'toolGroups' => ToolRegistry::groups(),
        ]);
    }
}
