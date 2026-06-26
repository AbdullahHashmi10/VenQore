<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class EInvoicingController extends Controller
{
    public function index()
    {
        abort(403, 'E-Invoicing is coming soon.');
    }

    public function generate(Request $request)
    {
        abort(403, 'E-Invoicing is coming soon.');
    }

    public function generateWaybill(Request $request)
    {
        abort(403, 'E-Invoicing is coming soon.');
    }
}
