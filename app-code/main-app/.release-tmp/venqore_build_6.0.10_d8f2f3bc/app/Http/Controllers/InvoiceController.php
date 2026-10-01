<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function print(Invoice $invoice)
    {
        $invoice->load(['party', 'items.product', 'user']);

        return view('invoices.receipt', compact('invoice'));
    }
}
