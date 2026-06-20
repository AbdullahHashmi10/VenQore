<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class InvoiceReminderController extends Controller
{
    // Note: This controller is a stub with unimplemented methods.
    // Backend PlanGate::enforce('invoice_reminders') is skipped here for now,
    // and the navigation item remains hard-locked (locked: true) in OneGlanceLayout.jsx for all plans.
    
    public function index()
    {
        return Inertia::render('Reminders/InvoiceReminders', [
            'reminders' => [
                'data' => [],
                'links' => []
            ],
            'stats' => []
        ]);
    }
    
    public function create() { /* to implement */ }
    public function store(Request $request) { /* to implement */ }
    public function send($id) { /* to implement */ }
}
