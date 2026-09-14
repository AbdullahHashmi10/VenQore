<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  New invoice — one editor, thirteen documents                             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Like NewPosController, this is deliberately empty of data.
 * `resources/js/Pages/NewInvoice.jsx` is a STRUCTURE exercise: the point is to
 * settle the editor's shape, its composer and — above all — its PAYLOAD CONTRACT
 * before a single row is written. It runs on `resources/js/NewInvoice/mock.js`.
 *
 * The contract is the reason this page exists. Today the codebase has thirteen
 * document screens, eight of which are the same file copy-pasted, and the
 * inventory found seventeen live defects across them. Most are the same defect
 * wearing different clothes: a field that renders and does not post, or posts
 * and is not read.
 *
 *   Quotation      collects tax, delivery, extra charges, amount paid, free
 *                  quantity, date and reference — and drops all seven.
 *   Sales order    sends notes, reference, header discount, tax and per-line
 *                  discount — and SalesOrderController::store ignores all five.
 *   Debit note     never sends warehouse_id, so returnStock() never fires and
 *                  returned stock is never restored.
 *   Sale return    hard-codes warehouse_id to Warehouse::first() and forces tax
 *                  and discount to 0 server-side while the UI collects both.
 *   Purchase order requires warehouse_id server-side and renders no input.
 *   Notes          is in six payloads and in WorkspaceContext's default
 *                  document, and none of the eight clone screens renders it.
 *
 * `NewInvoice/fields.js` answers all of them with ONE payload builder, and the
 * page shows its output on screen (⋯ → "What this would post") so the shape can
 * be agreed before it is wired.
 *
 * ── WIRING, WHEN THE SHAPE IS AGREED ────────────────────────────────────────
 *
 *   1. Take the props the existing editors already assemble — parties (typed by
 *      the document's SIDE, not `type=all`), warehouses, bank accounts, tax
 *      rates from `settings.tax_rates`, and the recalled document.
 *
 *   2. Point the item picker at the endpoints the POS already uses:
 *        GET /api/pos/search?q=   ·   /api/pos/featured
 *
 *   3. Post `buildPayload()` to the V3 endpoint for the type. The builder
 *      already emits `items.*.sale_uom`, which V3 StoreSaleRequest REQUIRES and
 *      which no shipped screen collects.
 *
 *   4. Move the composition out of localStorage into `settings` under
 *      `document_composition`, per user.
 *
 * Until then this returns nothing on purpose. A page that half-loads real data
 * and half-invents it is the hardest kind to review.
 */
class NewInvoiceController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('NewInvoice');
    }
}
