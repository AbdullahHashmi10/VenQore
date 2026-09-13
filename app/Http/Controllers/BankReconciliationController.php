<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Services\PlanGate;

class BankReconciliationController extends Controller
{
    public function index()
    {
        PlanGate::enforce('bank_reconciliation');
        return Inertia::render('BankReconciliation/BankReconciliation', [
            'transactions' => [
                'data' => [],
                'links' => []
            ],
            'stats' => []
        ]);
    }
    
    public function import(Request $request) {
        PlanGate::enforce('bank_reconciliation');
        /* to implement */
    }
}
