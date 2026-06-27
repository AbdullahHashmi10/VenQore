<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use App\Models\DigitalProduct;
use Inertia\Inertia;

class DigitalProductsPublicController extends Controller
{
    public function index()
    {
        // Re-seed with the precise 9 files portfolio if not matching the exact count
        if (DigitalProduct::count() !== 9) {
            DigitalProduct::truncate();

            // 1. Core Hub
            DigitalProduct::create([
                'name' => 'VenQore.html (Core Controller File)',
                'description' => 'The central hub of the entire ecosystem. Functions as a comprehensive accounting ledger, cash flow tracker, operational dashboard, and master macro-financial calculator.',
                'version' => 'v1.0.0',
                'is_done' => true,
                'status' => 'active',
                'platforms' => [
                    ['name' => 'Etsy', 'link' => 'https://etsy.com'],
                    ['name' => 'Website', 'link' => '/register']
                ]
            ]);

            // 2. Retail POS
            DigitalProduct::create([
                'name' => 'VenQore_POS.html (Retail POS Module)',
                'description' => 'A high-speed touch register utility designed for standard retail operations. Processes barcode scanner inputs, manages physical cash till balances, and generates customer receipts.',
                'version' => 'v0.8.0-dev',
                'is_done' => false,
                'status' => 'dev',
                'platforms' => [
                    ['name' => 'Etsy', 'link' => 'https://etsy.com']
                ]
            ]);

            // 3. Restaurant
            DigitalProduct::create([
                'name' => 'VenQore_Restaurant.html (Hospitality Register)',
                'description' => 'A specialized hospitality register built to coordinate multi-floor visual table maps, real-time table seating availability, and custom recipe ingredient costing.',
                'version' => 'Coming Soon',
                'is_done' => false,
                'status' => 'soon',
                'platforms' => []
            ]);

            // 4. Cafe
            DigitalProduct::create([
                'name' => 'VenQore_Cafe.html (Lightweight hospitality)',
                'description' => 'A lightweight variant of the hospitality engine optimized for fast counter pick-ups, drink modification queues, and direct kitchen display routing.',
                'version' => 'Coming Soon',
                'is_done' => false,
                'status' => 'soon',
                'platforms' => []
            ]);

            // 5. Khata
            DigitalProduct::create([
                'name' => 'VenQore_Khata.html (Merchant Ledger)',
                'description' => 'A digital replacement for traditional merchant ledger systems. Manages individual customer lines, tracks outstanding store credit accounts, and debt aging timelines.',
                'version' => 'Coming Soon',
                'is_done' => false,
                'status' => 'soon',
                'platforms' => []
            ]);

            // 6. Inventory
            DigitalProduct::create([
                'name' => 'VenQore_Inventory.html (Stock Manager)',
                'description' => 'An enterprise asset manager designed to handle wholesale stock tracking. Automates minimum inventory threshold warnings and incoming purchase logs.',
                'version' => 'Coming Soon',
                'is_done' => false,
                'status' => 'soon',
                'platforms' => []
            ]);

            // 7. Staff
            DigitalProduct::create([
                'name' => 'VenQore_Staff.html (Workforce Control)',
                'description' => 'A workforce management tool that logs employee check-in times, computes hourly shifts, and calculates automated sales commission splits.',
                'version' => 'Coming Soon',
                'is_done' => false,
                'status' => 'soon',
                'platforms' => []
            ]);

            // 8. CRM
            DigitalProduct::create([
                'name' => 'VenQore_CRM.html (Client Database)',
                'description' => 'A centralized customer database module that constructs unique buyer interaction lines and tracks lifetime value parameters.',
                'version' => 'Coming Soon',
                'is_done' => false,
                'status' => 'soon',
                'platforms' => []
            ]);

            // 9. Insight Engine
            DigitalProduct::create([
                'name' => 'VenQore_InsightEngine.html (Financial Intelligence)',
                'description' => 'The ultimate master analytical overlay. Reads transaction logs to generate 20 premium reporting matrices, product velocity logs, and cash burn projections.',
                'version' => 'Coming Soon',
                'is_done' => false,
                'status' => 'soon',
                'platforms' => []
            ]);
        }

        $products = DigitalProduct::orderByRaw("FIELD(status, 'active', 'dev', 'soon')")->orderBy('id', 'asc')->get();
        $totalCount = $products->count();
        $doneCount = $products->where('status', 'active')->count();
        $pendingCount = $products->whereIn('status', ['dev', 'soon'])->count();

        return Inertia::render('Marketing/DigitalProducts', [
            'products' => $products,
            'stats' => [
                'total' => $totalCount,
                'done' => $doneCount,
                'pending' => $pendingCount,
            ]
        ]);
    }
}
