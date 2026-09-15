<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class OnlineStoreController extends Controller
{
    public function index()
    {
        return Inertia::render('OnlineStore/OnlineStore', [
            'store_data' => [],
            'stats' => []
        ]);
    }
    
    public function update(Request $request) { /* to implement */ }
}
