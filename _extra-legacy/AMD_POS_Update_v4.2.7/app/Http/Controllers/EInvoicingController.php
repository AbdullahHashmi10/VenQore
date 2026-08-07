<?php

namespace App\Http\Controllers;

use App\Services\PlanGate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EInvoicingController extends Controller
{
    public function index()
    {
        PlanGate::enforce('e_invoicing');

        return Inertia::render('EInvoicing/Dashboard', [
            'invoices' => [],
        ]);
    }

    public function generate(Request $request)
    {
        PlanGate::enforce('e_invoicing');
        // TODO: implement e-invoicing generation
        return response()->json(['message' => 'E-Invoicing generation coming soon.'], 501);
    }

    public function generateWaybill(Request $request)
    {
        PlanGate::enforce('e_invoicing');
        // TODO: implement waybill generation
        return response()->json(['message' => 'Waybill generation coming soon.'], 501);
    }
}
