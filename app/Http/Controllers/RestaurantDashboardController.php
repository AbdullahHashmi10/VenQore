<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RestaurantDashboardController extends Controller
{
    /**
     * Display the Restaurant / Café Dashboard (Table Layout, Kitchen Display, Modifiers).
     */
    public function index(Request $request): Response
    {
        $tenant = app('current.tenant');

        $tables = [
            ['id' => 'T1', 'number' => 1, 'capacity' => 4, 'status' => 'occupied', 'order_total' => 45.50],
            ['id' => 'T2', 'number' => 2, 'capacity' => 2, 'status' => 'available', 'order_total' => 0.00],
            ['id' => 'T3', 'number' => 3, 'capacity' => 6, 'status' => 'reserved', 'order_total' => 0.00],
            ['id' => 'T4', 'number' => 4, 'capacity' => 4, 'status' => 'occupied', 'order_total' => 82.00],
            ['id' => 'T5', 'number' => 5, 'capacity' => 2, 'status' => 'cleaning', 'order_total' => 0.00],
        ];

        return Inertia::render('Restaurant/Dashboard', [
            'storeSlug' => $tenant->slug,
            'tables'    => $tables,
            'kitchenQueueCount' => 3,
        ]);
    }

    /**
     * Kitchen Display System (KDS) order queue view.
     */
    public function kitchen(Request $request): Response
    {
        $tenant = app('current.tenant');

        $orders = [
            [
                'id' => 'ORD-101',
                'table' => 'T1',
                'items' => [
                    ['name' => 'Burger', 'qty' => 2, 'modifiers' => ['No Onion', 'Extra Cheese']],
                    ['name' => 'Fries', 'qty' => 1, 'modifiers' => ['Large']],
                ],
                'status' => 'preparing',
                'time_elapsed_mins' => 8,
            ],
            [
                'id' => 'ORD-102',
                'table' => 'T4',
                'items' => [
                    ['name' => 'Pasta', 'qty' => 1, 'modifiers' => ['Gluten Free']],
                    ['name' => 'Iced Tea', 'qty' => 2, 'modifiers' => ['Less Ice']],
                ],
                'status' => 'pending',
                'time_elapsed_mins' => 3,
            ],
        ];

        return Inertia::render('Restaurant/Kitchen', [
            'storeSlug' => $tenant->slug,
            'orders'    => $orders,
        ]);
    }
}
