<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  New POS — the composed register                                          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * This controller is deliberately empty of data.
 *
 * `resources/js/Pages/NewPos.jsx` is a STRUCTURE exercise: the point of it is to
 * settle the register's shape, its composer and its settings before a single
 * product is attached. It runs entirely on `resources/js/NewPos/mock.js`, whose
 * fields are named the way the live payload names them.
 *
 * When the shape is agreed, wiring is:
 *
 *   1. Delete the `mock` import in NewPos.jsx and take these props instead —
 *      the same four PosController@index already assembles:
 *
 *        'recalledSale'      Sale::with(items.product…)->find($request->recall)
 *        'bankAccounts'      BankAccount, non-cash
 *        'warehouses'        Warehouse::all(['id','name','is_default'])
 *        'ecommerceChannels' EcommerceChannel for this tenant
 *        'settings'          Setting::all()->pluck('value','key')
 *
 *   2. Point the catalogue at the endpoints the shipped POS already uses, so
 *      this page inherits the Phase 3.1 timebomb fix rather than re-loading
 *      1,942 products on every open:
 *
 *        GET /api/pos/featured        the initial grid
 *        GET /api/pos/search?q=       debounced search (300ms)
 *        GET /api/pos/barcode/{code}  exact scanner lookup
 *        GET /api/pos/recent-sales    the Recent sheet
 *
 *   3. Move the register's composition out of localStorage and into
 *      `settings` under `pos_composition`, keyed per user and per terminal, so
 *      a cashier's arrangement follows them to another till.
 *
 * Until then this returns nothing on purpose. A page that half-loads real data
 * and half-invents it is the hardest kind to review.
 */
class NewPosController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('NewPos');
    }
}
