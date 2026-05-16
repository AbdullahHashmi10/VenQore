<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class InvoiceReminderController extends Controller
{
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
