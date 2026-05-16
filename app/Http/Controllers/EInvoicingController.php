<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class EInvoicingController extends Controller
{
    public function index()
    {
        return Inertia::render('EInvoicing/EInvoicing', [
            'invoices' => [
                'data' => [],
                'links' => []
            ],
            'waybills' => [
                'data' => [],
                'links' => []
            ],
            'stats' => []
        ]);
    }
    
    public function generate(Request $request) { /* to implement */ }
}
