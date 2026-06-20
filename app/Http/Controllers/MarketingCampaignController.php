<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Services\PlanGate;

class MarketingCampaignController extends Controller
{
    public function index()
    {
        PlanGate::enforce('marketing_campaigns');
        return Inertia::render('Marketing/Campaigns', [
            'campaigns' => [
                'data' => [],
                'links' => []
            ],
            'stats' => []
        ]);
    }
    
    public function create() {
        PlanGate::enforce('marketing_campaigns');
        /* to implement */
    }
    public function store(Request $request) {
        PlanGate::enforce('marketing_campaigns');
        /* to implement */
    }
}
