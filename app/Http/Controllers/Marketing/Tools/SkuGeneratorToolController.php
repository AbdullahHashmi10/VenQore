<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Support\ToolRegistry;
use Inertia\Inertia;

/**
 * SkuGeneratorToolController — free Bulk SKU Generator.
 *
 * Like the Margin Calculator, this tool has NO server-side computation
 * endpoint. The scheme builder, live preview, bulk generation and CSV
 * export all happen client-side in React. The controller's only job is to
 * render the Inertia page with the tool nav. Free, ungated, no rate
 * limiting concerns since there is no POST route.
 */
class SkuGeneratorToolController extends Controller
{
    public function index()
    {
        return Inertia::render('Marketing/Tools/SkuGenerator', [
            'toolGroups' => ToolRegistry::groups(),
        ]);
    }
}
