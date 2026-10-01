<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Support\ToolRegistry;
use Inertia\Inertia;

/**
 * PosRoiToolController — free POS ROI & Payback Period Calculator.
 *
 * Client-side interactive calculator estimating POS system payback period,
 * monthly labor savings, stock leakage reduction, and 1-year / 3-year net ROI.
 */
class PosRoiToolController extends Controller
{
    public function index()
    {
        return Inertia::render('Marketing/Tools/PosRoiCalculator', [
            'toolGroups' => ToolRegistry::groups(),
        ]);
    }
}
