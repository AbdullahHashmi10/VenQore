<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Support\ToolRegistry;
use Inertia\Inertia;

/**
 * PaymentFeeCalculatorToolController — free Payment Processing Fee
 * Calculator.
 *
 * Like MarginCalculatorToolController, this tool has NO server-side
 * computation endpoint at all. Every calculation (single-transaction fee,
 * monthly-volume comparison, cheapest-processor ranking) happens
 * client-side in React for instant feedback. The controller's only job is
 * to render the Inertia page with the tool nav. Free, ungated, no rate
 * limiting concerns since there is no POST route.
 *
 * IMPORTANT: the illustrative default processor rates shown in the React
 * page are well-known, long-stable baseline figures, not live/verified
 * current rates — see the disclaimer rendered directly above the results
 * table in PaymentFeeCalculator.jsx and in ToolSeo::paymentFeePages().
 */
class PaymentFeeCalculatorToolController extends Controller
{
    public function index()
    {
        return Inertia::render('Marketing/Tools/PaymentFeeCalculator', [
            'toolGroups' => ToolRegistry::groups(),
        ]);
    }
}
