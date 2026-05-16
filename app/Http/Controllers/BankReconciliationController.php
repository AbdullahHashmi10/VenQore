<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class BankReconciliationController extends Controller
{
    public function index()
    {
        return Inertia::render('BankReconciliation/BankReconciliation', [
            'transactions' => [
                'data' => [],
                'links' => []
            ],
            'stats' => []
        ]);
    }
    
    public function import(Request $request) { /* to implement */ }
}
