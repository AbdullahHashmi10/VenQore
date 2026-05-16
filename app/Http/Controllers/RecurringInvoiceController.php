<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class RecurringInvoiceController extends Controller
{
    public function index()
    {
        return Inertia::render('RecurringInvoices/RecurringInvoices', [
             // Mock data for listing
            'invoices' => [
                'data' => [],
                'links' => []
            ],
            'stats' => [
                'total_active' => 0,
                'total_revenue' => 0,
            ]
        ]);
    }

    public function create() { /* to implement */ }
    public function store(Request $request) { /* to implement */ }
    public function edit($id) { /* to implement */ }
    public function update(Request $request, $id) { /* to implement */ }
    public function destroy($id) { /* to implement */ }
    public function toggle($id) { /* to implement */ }
}
