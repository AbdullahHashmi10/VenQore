<?php

namespace App\Http\Controllers;

use App\Models\Occupancy;
use App\Models\Position;
use App\Models\Setting;
use App\Models\WorkOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  Table Service — the floor, and what is open on it                        ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * WHY THIS EXISTS SEPARATELY FROM THE REGISTER
 * --------------------------------------------
 * The unit of work is the TABLE, not the sale. A table is opened, added to
 * over an hour by several people, split, moved, and only then settled — and
 * for most of that time there is no sale yet. Squeezing that into the register
 * as a fourth column made it compete for width with the cart and the tender,
 * which is why it read as clutter, and it is why the POS build ran on six
 * hard-coded mock tables ("Main Hall / Window / Patio") that were connected to
 * nothing at all.
 *
 * WHAT IS SHARED, AND WHAT IS NOT
 * -------------------------------
 * Separate screens, ONE engine. This controller owns the floor and the open
 * orders on it. It does NOT own money: settling hands the occupancy's cart to
 * the register, which keeps a single tender path, a single journal posting and
 * a single offline queue. Copy-pasting the payment flow here is exactly the
 * mistake CLAUDE.md records against the purchase island — "the same bug had to
 * be fixed eight times and usually was not."
 *
 * THE DATA
 * --------
 * `positions` and `occupancies` already existed and already generalise past
 * restaurants — a position is a table, a chair, a room or a bay, which is what
 * a salon, a clinic or a workshop needs. Nothing new is migrated: the extra
 * state a table service needs (covers, order type, the running cart) lives in
 * `occupancies.session_data`, which is a JSON column that already carried
 * `order_total`.
 *
 *   session_data = {
 *     order_type:  'dine_in' | 'takeaway' | 'delivery',
 *     covers:      int,
 *     cart:        [ {
 *                     id, name, price, qty, notes, sent,
 *                     line_id?:      string,   // stable row id; falls back to `id`
 *                     mods?:         [ { id, name, price_delta } ],
 *                     unit_price?:   float,    // SERVER-WRITTEN: price + Σ price_delta
 *                     paid_sale_id?: string,   // null until this line is settled
 *                   } ],
 *     order_total: float,                      // the UNPAID total, not the bill
 *     note:        string,
 *     sent_at:     iso8601 | null,
 *     pending_settle?: { id, mode, line_ids, amount, covers, created_at },
 *     settled_parts?:  [ { id, mode, amount, line_ids, sale_id, settled_at } ],
 *     settled_sale_id?: string,                // legacy: set when the table closes
 *   }
 *
 * SPLITTING A BILL DOES NOT NEED A SCHEMA
 * ---------------------------------------
 * A split is not a second order — it is a claim on part of one. Modelling it as
 * rows in a `bill_splits` table means two places can disagree about what is
 * owed, which is how a table gets closed with one guest's food unpaid. So the
 * cart stays the single record of the bill and each line carries the sale that
 * paid it; `pending_settle` is the one part currently at the till, and it is a
 * lock as much as it is data — a second waiter cannot start a split while one
 * is open.
 */
class TableServiceController extends Controller
{
    private const ORDER_TYPES = ['dine_in', 'takeaway', 'delivery'];

    /**
     * THE TABLE TERMINAL.
     *
     * This renders the REGISTER, not a separate floor screen. Layout Law §10
     * defines six terminals and the sixth is Table: same cart, same tender,
     * same journal posting, same offline queue, with the floor promoted to a
     * rank-1 pane and the table — not the sale — as the unit of work.
     *
     * The floor used to be its own page that handed a cart to the register by
     * navigating to it. That is one screen too many: a waiter adding a drink
     * to table four should not change pages to do it, and a bill that lives on
     * one screen while the money lives on another is how the two disagree.
     */
    public function index(Request $request): Response
    {
        $tenant = app('current.tenant');

        $this->seedIfEmpty($tenant->id);

        $floor = $this->floorState($tenant->id);

        return Inertia::render('Pos', [
            'terminal'     => 'table',
            /* The envelope is UNPACKED here rather than passed through. `positions`
               has always been an array of shaped positions and the Pos page
               destructures it as one — handing it an object instead would render
               an empty floor. `tickets` is simply a new prop beside it. */
            'positions'    => $floor['positions'],
            'tickets'      => $floor['tickets'],
            'zones'        => $floor['zones'],
            'kitchen'      => $floor['kitchen'],

            /* Everything the register itself needs. It is the same screen, so
               it needs the same props — a table terminal that could not pick a
               bank account or a warehouse would be a register with two of its
               fields quietly missing. */
            'recalledSale' => null,
            'occupancy'    => null,
            'bankAccounts' => \App\Models\BankAccount::where(function ($q) {
                    $q->whereNull('account_type')->orWhere('account_type', '!=', 'cash');
                })
                ->where(function ($q) {
                    $q->whereNull('type')->orWhere('type', '!=', 'cash');
                })
                ->get(['id', 'name', 'account_number as code', 'account_number']),
            'warehouses'   => \App\Models\Warehouse::all(['id', 'name', 'is_default']),
            'settings'     => Setting::all()->pluck('value', 'key'),
            'storeSlug'    => $tenant->slug,
        ]);
    }

    /**
     * The floor as JSON, for polling.
     *
     * floorState() now returns the whole envelope — { positions, tickets,
     * zones, kitchen } — so this is a straight pass-through. The response is a
     * strict SUPERSET of what it was: `positions` is still the same array of
     * shaped positions, `zones` and `kitchen` are unchanged, and `tickets` is
     * new. Every existing reader keeps working untouched.
     */
    public function state(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');

        return response()->json($this->floorState($tenant->id));
    }

    /** Open a position: a party sits down, or a takeaway ticket is started. */
    public function open(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'position_id' => 'required|integer',
            'covers'      => 'nullable|integer|min:1|max:99',
            'order_type'  => 'nullable|string|in:dine_in,takeaway,delivery',
            'party_id'    => 'nullable|integer',
        ]);

        $pos = Position::where('tenant_id', $tenant->id)->findOrFail($data['position_id']);

        if ($this->activeOccupancy($tenant->id, $pos->id)) {
            return response()->json(['message' => 'That table is already open.'], 422);
        }

        $occ = Occupancy::create([
            'tenant_id'    => $tenant->id,
            'position_id'  => $pos->id,
            'label'        => $pos->label,
            'party_id'     => $data['party_id'] ?? null,
            'opened_by'    => $request->user()?->id,
            'opened_at'    => now(),
            'session_data' => [
                'order_type'  => $data['order_type'] ?? 'dine_in',
                'covers'      => $data['covers'] ?? 1,
                'cart'        => [],
                'order_total' => 0.0,
                'note'        => '',
                'sent_at'     => null,
            ],
        ]);

        $pos->update(['status' => 'active']);

        return response()->json(['position' => $this->shape($pos->fresh(), $occ)]);
    }

    /**
     * Persist the running order. The whole cart every time rather than a diff:
     * two waiters on two handhelds editing the same table is the normal case,
     * and a diff applied against a stale base is how a line silently doubles.
     */
    public function saveOrder(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'occupancy_id'              => 'required|integer',
            'cart'                      => 'present|array',
            'cart.*.id'                 => 'required',
            'cart.*.line_id'            => 'nullable',
            'cart.*.name'               => 'required|string|max:255',
            'cart.*.price'              => 'required|numeric|min:0',
            'cart.*.qty'                => 'required|numeric|min:0',
            'cart.*.notes'              => 'nullable|string|max:500',
            'cart.*.sent'               => 'nullable|boolean',
            // Modifiers ride on the line rather than in a table of their own: the
            // kitchen needs them next to the item they change, and a receipt
            // reprinted next year must still say "no onions" even if the modifier
            // has since been renamed or deleted from the menu.
            'cart.*.mods'               => 'nullable|array',
            'cart.*.mods.*.id'          => 'nullable',
            'cart.*.mods.*.name'        => 'required|string|max:80',
            // Signed on purpose — "no cheese, -30" is a real menu item.
            'cart.*.mods.*.price_delta' => 'nullable|numeric',
            'covers'                    => 'nullable|integer|min:1|max:99',
            'order_type'                => 'nullable|string|in:dine_in,takeaway,delivery',
            'note'                      => 'nullable|string|max:1000',
            'party_id'                  => 'nullable|integer',
        ]);

        $occ = $this->ownedOccupancy($tenant->id, $data['occupancy_id']);
        $session = $occ->session_data ?? [];

        // Settled rows are taken from the stored session, never from the request:
        // a handheld showing a stale table must not be able to un-sell them.
        $cart = $this->preservePaidLines(array_values($data['cart']), $session['cart'] ?? []);
        $cart = array_map(fn ($l) => $this->priceLine($l), $cart);

        $session['cart']        = $cart;
        $session['order_total'] = $this->unpaidTotal($session);
        if (array_key_exists('covers', $data) && $data['covers'] !== null)         $session['covers'] = $data['covers'];
        if (array_key_exists('order_type', $data) && $data['order_type'] !== null) $session['order_type'] = $data['order_type'];
        if (array_key_exists('note', $data) && $data['note'] !== null)             $session['note'] = $data['note'];

        $occ->session_data = $session;
        if (array_key_exists('party_id', $data)) $occ->party_id = $data['party_id'];
        $occ->save();

        return response()->json($this->cardFor($occ));
    }

    /**
     * Fire the unsent lines at the kitchen. Only the unsent ones: re-firing a
     * whole ticket because one dessert was added is how a kitchen ends up
     * cooking two mains, and it is the single most common complaint about
     * table-service software.
     */
    public function sendToKitchen(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate(['occupancy_id' => 'required|integer']);

        $occ = $this->ownedOccupancy($tenant->id, $data['occupancy_id']);
        $session = $occ->session_data ?? [];
        $cart = $session['cart'] ?? [];

        $unsent = array_values(array_filter($cart, fn ($l) => empty($l['sent'])));
        if (!count($unsent)) {
            return response()->json(['message' => 'Nothing new to send.'], 422);
        }

        DB::transaction(function () use ($tenant, $occ, $unsent, &$session, $cart) {
            WorkOrder::create([
                'tenant_id'    => $tenant->id,
                'kind'         => 'kitchen',
                // The link back to the floor that this ticket never had. The code
                // is COPIED, not joined: the occupancy closes when the table is
                // settled and the position is re-seated minutes later, and a
                // ticket still on the pass must keep naming the table it was
                // cooked for rather than following whoever is sitting there now.
                'occupancy_id'  => $occ->id,
                'position_code' => $occ->position?->code,
                'station'       => 'kitchen',
                'order_number'  => $occ->label ?: ('#' . $occ->id),
                'items'         => array_map(fn ($l) => [
                    'name'  => $l['name'],
                    'qty'   => $l['qty'],
                    'notes' => $l['notes'] ?? '',
                    // Objects for anything that has to price or reprint the line,
                    // and the plain names as well because that is what the pass
                    // reads at arm's length — and what the KDS already renders.
                    'mods'      => array_values($l['mods'] ?? []),
                    'modifiers' => array_map(fn ($m) => (string) ($m['name'] ?? ''), array_values($l['mods'] ?? [])),
                ], $unsent),
                'status'        => 'pending',
                // When the KITCHEN got it. created_at is when the row was written,
                // which stops being the same thing the moment tickets can be held.
                'fired_at'      => now(),
            ]);

            $session['cart'] = array_map(function ($l) {
                $l['sent'] = true;
                return $l;
            }, $cart);
            $session['sent_at'] = now()->toIso8601String();
            $occ->session_data = $session;
            $occ->save();
        });

        return response()->json($this->cardFor($occ->fresh() ?? $occ) + [
            'sent' => count($unsent),
        ]);
    }

    /** Move an open table to another position. */
    public function transfer(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'occupancy_id' => 'required|integer',
            'to_position'  => 'required|integer',
        ]);

        $occ  = $this->ownedOccupancy($tenant->id, $data['occupancy_id']);
        $dest = Position::where('tenant_id', $tenant->id)->findOrFail($data['to_position']);

        if ($this->activeOccupancy($tenant->id, $dest->id)) {
            return response()->json(['message' => 'That table is already open. Merge instead.'], 422);
        }

        $from = $occ->position;

        DB::transaction(function () use ($occ, $dest, $from) {
            $occ->update(['position_id' => $dest->id, 'label' => $dest->label]);
            $dest->update(['status' => 'active']);
            if ($from) $from->update(['status' => 'available']);
        });

        return response()->json($this->floorState($tenant->id));
    }

    /** Fold one table's order into another and close the empty one. */
    public function merge(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'from_occupancy' => 'required|integer',
            'into_occupancy' => 'required|integer|different:from_occupancy',
        ]);

        $from = $this->ownedOccupancy($tenant->id, $data['from_occupancy']);
        $into = $this->ownedOccupancy($tenant->id, $data['into_occupancy']);

        // A part is at the till on one of these two tables. Folding the bills
        // underneath it would change what that part is a claim on while someone
        // is holding a card over it, so the split has to be resolved first.
        if ((($from->session_data ?? [])['pending_settle'] ?? null) || (($into->session_data ?? [])['pending_settle'] ?? null)) {
            return response()->json(['message' => 'One of these tables has a split at the till. Settle or cancel it first.'], 422);
        }

        DB::transaction(function () use ($from, $into) {
            $a = $into->session_data ?? [];
            $b = $from->session_data ?? [];

            $a['cart'] = array_values(array_merge($a['cart'] ?? [], $b['cart'] ?? []));
            // Money already banked against either table comes across too. Dropping
            // it would re-charge a guest who has already paid their share.
            $a['settled_parts'] = array_values(array_merge($a['settled_parts'] ?? [], $b['settled_parts'] ?? []));
            $a['order_total']   = $this->unpaidTotal($a);
            $a['covers']        = (int) ($a['covers'] ?? 0) + (int) ($b['covers'] ?? 0);
            $into->session_data = $a;
            $into->save();

            $from->update(['closed_at' => now()]);
            if ($from->position) $from->position->update(['status' => 'available']);
        });

        return response()->json($this->floorState($tenant->id));
    }

    /**
     * Close a table without taking money — the party left, or it was opened by
     * mistake. Refuses when there is an unsettled order on it, because "close"
     * quietly discarding a 4,000-rupee tab is not a thing software should do
     * on one tap.
     */
    public function close(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'occupancy_id' => 'required|integer',
            'force'        => 'nullable|boolean',
        ]);

        $occ = $this->ownedOccupancy($tenant->id, $data['occupancy_id']);

        // The guard is about money that would be LOST, so it asks the same
        // helper everything else asks: what is still owed. A table whose lines
        // have all been paid off by splits owes nothing and closes on one tap.
        $total = $this->unpaidTotal($occ->session_data ?? []);

        if ($total > 0 && !($data['force'] ?? false)) {
            return response()->json([
                'message' => 'This table has an unsettled order. Settle it, or confirm to discard.',
                'total'   => $total,
            ], 422);
        }

        DB::transaction(function () use ($occ) {
            $occ->update(['closed_at' => now()]);
            if ($occ->position) $occ->position->update(['status' => 'available']);
        });

        return response()->json($this->floorState($tenant->id));
    }

    /** Update a position's own state: reserved, cleaning, back to available. */
    public function setStatus(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'position_id' => 'required|integer',
            'status'      => 'required|string|in:available,reserved,cleaning',
        ]);

        $pos = Position::where('tenant_id', $tenant->id)->findOrFail($data['position_id']);
        $pos->update(['status' => $data['status'] === 'available' ? 'available' : $data['status']]);

        return response()->json($this->floorState($tenant->id));
    }

    /**
     * Claim part of the bill.
     *
     * WHY THIS IS A LOCK AND NOT JUST A CALCULATION
     * ---------------------------------------------
     * "Split it three ways" is two people at a till and a third still eating.
     * If two waiters could each open a part on the same table, both would carry
     * a share of the same lines to the register and the table would be settled
     * twice for one plate of food. So exactly one part may be pending at a time,
     * and it is written to the table — not held in a browser — because the
     * device that opened it is not necessarily the device that finishes it.
     *
     * The three modes answer three real requests at a table:
     *   lines   "I'll pay for what I had"      → the part IS those rows
     *   covers  "split it evenly, four ways"   → an equal share of the remainder
     *   amount  "put 2,000 on my card"         → whatever they hand over
     *
     * Only `lines` can stamp rows, because only `lines` knows which rows. The
     * other two are recorded as money against the table instead; see settled().
     */
    public function split(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'occupancy_id' => 'required|integer',
            'mode'         => 'required|string|in:lines,covers,amount',
            'line_ids'     => 'required_if:mode,lines|array',
            'parts'        => 'required_if:mode,covers|integer|min:2|max:99',
            'amount'       => 'required_if:mode,amount|numeric|min:0.01',
        ]);

        $occ     = $this->ownedOccupancy($tenant->id, $data['occupancy_id']);
        $session = $occ->session_data ?? [];
        $cart    = $session['cart'] ?? [];

        if (!empty($session['pending_settle'])) {
            return response()->json([
                'message' => 'Another part of this bill is already at the till. Settle or cancel it first.',
            ], 422);
        }

        $remaining = $this->unpaidTotal($session);
        $mode      = $data['mode'];
        $lineIds   = [];
        $amount    = 0.0;
        $covers    = null;

        if ($mode === 'lines') {
            $lineIds = array_values(array_unique(array_map('strval', $data['line_ids'])));
            if (!count($lineIds)) {
                return response()->json(['message' => 'Choose at least one line to split off.'], 422);
            }

            $matched = [];
            foreach ($cart as $line) {
                if (!in_array($this->lineKey($line), $lineIds, true)) continue;
                // Refusing here rather than skipping: a part quietly worth less
                // than the waiter selected is money nobody notices is missing.
                if (!empty($line['paid_sale_id'])) {
                    return response()->json(['message' => 'One of those lines has already been paid for.'], 422);
                }
                $matched[] = $line;
            }
            if (!count($matched)) {
                return response()->json(['message' => 'None of those lines are on this table.'], 422);
            }
            $amount = $this->cartTotal($matched);
        } elseif ($mode === 'covers') {
            if ($remaining <= 0) {
                return response()->json(['message' => 'There is nothing left to settle on this table.'], 422);
            }
            $covers = (int) $data['parts'];
            // Rounded per part, so N parts can be a cent short of the bill. The
            // shortfall stays on the table as the remainder and the last person
            // to pay picks it up — which is what happens at the till anyway.
            $amount = round($remaining / $covers, 2);
        } else {
            $amount = round((float) $data['amount'], 2);
            if ($amount > $remaining + 0.004) {
                return response()->json([
                    'message'   => 'That is more than is left on this table.',
                    'remaining' => $remaining,
                ], 422);
            }
        }

        $session['pending_settle'] = [
            'id'         => (string) \Illuminate\Support\Str::uuid(),
            'mode'       => $mode,
            'line_ids'   => $lineIds,
            'amount'     => $amount,
            'covers'     => $covers,
            'created_at' => now()->toIso8601String(),
        ];

        $occ->session_data = $session;
        $occ->save();

        return response()->json($this->cardFor($occ) + [
            'pending_settle' => $session['pending_settle'],
        ]);
    }

    /** The card was declined, or they changed their mind. Release the lock. */
    public function splitCancel(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate(['occupancy_id' => 'required|integer']);

        $occ     = $this->ownedOccupancy($tenant->id, $data['occupancy_id']);
        $session = $occ->session_data ?? [];

        unset($session['pending_settle']);
        $occ->session_data = $session;
        $occ->save();

        return response()->json($this->cardFor($occ));
    }

    /**
     * A sale completed against this table. Called by the register after a
     * successful tender, so a settled table clears itself rather than waiting
     * for someone to remember.
     *
     * WHOLE OR PART, ONE ENDPOINT
     * ---------------------------
     * With no `part_id` this is what it always was: the whole remaining bill is
     * paid, every unpaid line is stamped, the table closes. With a `part_id` it
     * settles exactly the part that split() put at the till and the table stays
     * open with the remainder — because the other three people are still eating.
     *
     * A `part_id` that does not match the live part is REFUSED rather than
     * treated as a whole settlement. It means the part was cancelled or already
     * settled somewhere else, and the difference between "pay this share" and
     * "pay the whole table" is not a difference to guess at.
     */
    public function settled(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'occupancy_id' => 'required|integer',
            'sale_id'      => 'nullable',
            'part_id'      => 'nullable',
        ]);

        $occ     = $this->ownedOccupancy($tenant->id, $data['occupancy_id']);
        $session = $occ->session_data ?? [];
        $pending = $session['pending_settle'] ?? null;
        $partId  = isset($data['part_id']) ? (string) $data['part_id'] : null;

        if ($partId !== null && $partId !== '' && (string) ($pending['id'] ?? '') !== $partId) {
            return response()->json([
                'message' => 'That part of the bill is no longer open. Reopen the split and try again.',
            ], 422);
        }

        $saleId = $data['sale_id'] ?? null;

        // sale_id has always been nullable here and the register does pass null
        // when it has nothing to quote. A line still has to be MARKED paid — the
        // id is only ever used to trace back to the receipt — so a settlement
        // without one stamps the fact rather than a blank that would read as
        // unpaid and leave the table open for the rest of the night.
        $stamp = ($saleId === null || $saleId === '') ? 'settled' : $saleId;

        $isPart    = $partId !== null && $partId !== '';
        $closed    = false;
        $remaining = 0.0;

        DB::transaction(function () use ($occ, &$session, $pending, $saleId, $stamp, $isPart, &$closed, &$remaining) {
            $cart = $session['cart'] ?? [];

            if ($isPart) {
                // Only a line split knows which rows it bought. A covers or amount
                // split is money against the table, recorded below and subtracted
                // from what is still owed.
                if (($pending['mode'] ?? '') === 'lines') {
                    $ids  = array_map('strval', $pending['line_ids'] ?? []);
                    $cart = array_map(function ($l) use ($ids, $stamp) {
                        if (empty($l['paid_sale_id']) && in_array($this->lineKey($l), $ids, true)) {
                            $l['paid_sale_id'] = $stamp;
                        }
                        return $l;
                    }, $cart);
                }

                $session['settled_parts']   = array_values($session['settled_parts'] ?? []);
                $session['settled_parts'][] = [
                    'id'         => (string) ($pending['id'] ?? ''),
                    'mode'       => (string) ($pending['mode'] ?? ''),
                    'amount'     => (float) ($pending['amount'] ?? 0),
                    'line_ids'   => array_values($pending['line_ids'] ?? []),
                    'sale_id'    => $saleId,
                    'settled_at' => now()->toIso8601String(),
                ];
            } else {
                // The whole remaining bill. Everything still unpaid is stamped,
                // and any part sitting at the till is superseded by it.
                $cart = array_map(function ($l) use ($stamp) {
                    if (empty($l['paid_sale_id'])) $l['paid_sale_id'] = $stamp;
                    return $l;
                }, $cart);
            }

            unset($session['pending_settle']);
            $session['cart'] = array_values($cart);

            $remaining = $this->unpaidTotal($session);
            $session['order_total'] = $remaining;

            // Done when nothing is owed. For a line split that is literally
            // "every line now carries a paid_sale_id"; a covers or amount split
            // never stamps a row, so for those the money is the only honest test.
            $closed = !count($this->unpaidLines($session['cart']))
                || ($remaining <= 0.004 && $this->offLinePaid($session) > 0);

            if ($closed) {
                // Kept for the callers that predate splitting and only ever ask
                // "which sale closed this table".
                $session['settled_sale_id'] = $saleId;
            }

            $occ->session_data = $session;
            if ($closed) $occ->closed_at = now();
            $occ->save();

            if ($closed && $occ->position) $occ->position->update(['status' => 'available']);
        });

        return response()->json([
            'ok'              => true,
            'closed'          => $closed,
            'remaining_total' => $remaining,
        ]);
    }

    /**
     * Counter, table service, or both.
     *
     * This is a STORE setting, not a device one: which service style a business
     * runs is a property of the business, and two tills in the same restaurant
     * must not disagree about whether there is a floor. It decides what appears
     * in navigation and whether the register offers an in-register floor at
     * all — a counter-only shop should never see a Tables control anywhere.
     */
    public function setServiceMode(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mode' => 'required|string|in:counter,tables,both',
        ]);

        Setting::updateOrCreate(
            ['key' => 'service_mode'],
            ['value' => $data['mode']],
        );

        return response()->json(['mode' => $data['mode']]);
    }

    /**
     * The house service charge, as a percentage of the bill.
     *
     * Same shape and same reason as service_mode: a percentage is a property of
     * the business, not of the till someone happens to be standing at, and two
     * terminals in one restaurant adding different service charges to two
     * tables is a complaint at the door. Both are plain rows in `settings`, so
     * every screen that already receives Setting::all() picks this up with no
     * new plumbing — including the register, which is where it gets charged.
     *
     * A tip is NOT set here. A tip is what the guest decides at the moment of
     * paying; a percentage the owner configures in advance is a service charge,
     * and conflating the two is how tips end up booked as the house's income.
     */
    public function setServiceCharge(Request $request): JsonResponse
    {
        $data = $request->validate([
            'percent' => 'required|numeric|min:0|max:100',
        ]);

        Setting::updateOrCreate(
            ['key' => 'service_charge_percent'],
            ['value' => (string) round((float) $data['percent'], 3)],
        );

        return response()->json(['percent' => round((float) $data['percent'], 3)]);
    }

    /* ── LANES: the orders that are not sitting anywhere ─────────────────── */

    /**
     * Start a takeaway or delivery ticket.
     *
     * WHY THIS IS AN OCCUPANCY WITH NO POSITION
     * -----------------------------------------
     * A bag on the counter is an open bill with a cart, a server, a kitchen
     * ticket and a total — which is an occupancy, exactly. What it does not
     * have is a place. Modelling it as a fake "Takeaway 3" position would put
     * phantom tables on the floor plan, break every covers and capacity number
     * and force the floor screen to filter out rows it should never have been
     * given. So `position_id` is NULL and that means one thing only: a lane.
     */
    public function laneOpen(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'order_type'    => 'required|string|in:takeaway,delivery',
            'customer_name' => 'nullable|string|max:120',
            'phone'         => 'nullable|string|max:40',
            'address'       => 'nullable|string|max:500',
            'party_id'      => 'nullable|integer',
        ]);

        $code = $this->nextTicketNumber($tenant->id, $data['order_type']);

        $occ = Occupancy::create([
            'tenant_id'    => $tenant->id,
            'position_id'  => null,
            'label'        => $code,
            'party_id'     => $data['party_id'] ?? null,
            'opened_by'    => $request->user()?->id,
            'opened_at'    => now(),
            'session_data' => [
                'order_type'    => $data['order_type'],
                'covers'        => 0,
                'cart'          => [],
                'order_total'   => 0.0,
                'note'          => '',
                'sent_at'       => null,
                'customer_name' => (string) ($data['customer_name'] ?? ''),
                'phone'         => (string) ($data['phone'] ?? ''),
                'address'       => (string) ($data['address'] ?? ''),
            ],
        ]);

        $occ->load('user');

        return response()->json(['ticket' => $this->ticketShape($occ, [])]);
    }

    /**
     * The bill has been printed and nobody has paid yet.
     *
     * This is a FACT, stamped once, not a status somebody maintains: the moment
     * the check went down. Everything that matters about it is derived from
     * there — the floor colour, the escalation clock, and how long the table
     * has been waiting to pay while a waiter is somewhere else. Clearing it is
     * the "they asked for another round after all" case.
     */
    public function check(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'occupancy_id' => 'required|integer',
            'clear'        => 'nullable|boolean',
        ]);

        $occ     = $this->ownedOccupancy($tenant->id, $data['occupancy_id']);
        $session = $occ->session_data ?? [];

        if ($data['clear'] ?? false) {
            unset($session['check_dropped_at']);
        } else {
            $session['check_dropped_at'] = now()->toIso8601String();
        }

        $occ->session_data = $session;
        $occ->save();
        $occ->load('user');

        return response()->json($this->cardFor($occ));
    }

    /* ── THE FLOOR BUILDER ───────────────────────────────────────────────── */

    /**
     * The screen that builds the floor.
     *
     * Until now `Position::create` appeared in exactly one place in the whole
     * application — the demo seeder below — which meant a restaurant could look
     * at its floor and never change it. Twelve tables named after somebody
     * else's dining room, permanently. Everything here is gated on
     * admin.settings_manage on top of the group's pos.checkout: rearranging the
     * building is not a decision a till makes mid-service.
     */
    public function plan(Request $request): Response
    {
        $tenant = app('current.tenant');

        return Inertia::render('TableService/FloorBuilder', [
            'zones'     => $this->zonesWithCounts($tenant->id),
            'positions' => $this->planPositions($tenant->id),
            'settings'  => Setting::all()->pluck('value', 'key'),
            'storeSlug' => $tenant->slug,
        ]);
    }

    /**
     * Create an area.
     *
     * WHY A ZONE IS A SETTING AND NOT A ROW
     * -------------------------------------
     * `positions.zone` is a string on the table, so a zone only exists while a
     * table stands in it — which makes "add the Terrace, then put tables on it"
     * impossible, and forces the alternative of secretly creating a table the
     * user did not ask for just so the name has somewhere to live. So the
     * declared list is one `settings` row, `floor_zones`, and zones() unions it
     * with the zones actually in use. An empty area can exist; a zone that
     * still has tables in it survives even if the settings row is lost.
     */
    public function planZoneAdd(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate(['name' => 'required|string|max:48']);

        $name = trim($data['name']);
        if ($name === '' || strcasecmp($name, self::RESERVED_ZONE) === 0) {
            return response()->json(['message' => 'That name is reserved.'], 422);
        }
        foreach ($this->zones($tenant->id) as $z) {
            if (strcasecmp($z, $name) === 0) {
                return response()->json(['message' => 'There is already an area called ' . $z . '.'], 422);
            }
        }

        $declared   = $this->declaredZones($tenant->id);
        $declared[] = $name;
        $this->saveDeclaredZones($declared);

        return response()->json($this->planPayload($tenant->id));
    }

    /** Rename an area: every table in it, and the declared list, together. */
    public function planZoneRename(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'from' => 'required|string|max:48',
            'to'   => 'required|string|max:48',
        ]);

        $from = trim($data['from']);
        $to   = trim($data['to']);

        if ($to === '' || strcasecmp($to, self::RESERVED_ZONE) === 0) {
            return response()->json(['message' => 'That name is reserved.'], 422);
        }
        // Refused rather than silently merged: two areas folding into one is a
        // different request from renaming one, and it moves tables.
        if (strcasecmp($from, $to) !== 0) {
            foreach ($this->zones($tenant->id) as $z) {
                if (strcasecmp($z, $to) === 0) {
                    return response()->json(['message' => 'There is already an area called ' . $z . '.'], 422);
                }
            }
        }

        DB::transaction(function () use ($tenant, $from, $to) {
            Position::where('tenant_id', $tenant->id)->where('zone', $from)->update(['zone' => $to]);

            $declared = [];
            $seen     = false;
            foreach ($this->declaredZones($tenant->id) as $z) {
                if (strcasecmp($z, $from) === 0) {
                    $declared[] = $to;
                    $seen = true;
                    continue;
                }
                $declared[] = $z;
            }
            if (!$seen) $declared[] = $to;
            $this->saveDeclaredZones($declared);
        });

        return response()->json($this->planPayload($tenant->id));
    }

    /**
     * Delete an area, moving or deleting the tables in it.
     *
     * An open bill blocks it outright. "Delete the Terrace" while table 12 is
     * eating on it is not a request anybody means, and letting it through
     * either orphans the occupancy or silently discards a live tab.
     */
    public function planZoneRemove(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'name'    => 'required|string|max:48',
            'move_to' => 'nullable|string|max:48',
        ]);

        $name   = trim($data['name']);
        $moveTo = trim((string) ($data['move_to'] ?? ''));

        if ($moveTo !== '' && strcasecmp($moveTo, $name) === 0) {
            return response()->json(['message' => 'Choose a different area to move the tables to.'], 422);
        }
        if ($moveTo !== '' && strcasecmp($moveTo, self::RESERVED_ZONE) === 0) {
            return response()->json(['message' => 'That name is reserved.'], 422);
        }

        $ids = Position::where('tenant_id', $tenant->id)->where('zone', $name)->pluck('id')->all();

        $busy = count($ids)
            ? Occupancy::where('tenant_id', $tenant->id)
                ->whereNull('closed_at')
                ->whereIn('position_id', $ids)
                ->count()
            : 0;

        if ($busy > 0) {
            return response()->json([
                'message'    => $busy === 1
                    ? 'A table in ' . $name . ' still has an open bill. Settle or close it first.'
                    : $busy . ' tables in ' . $name . ' still have open bills. Settle or close them first.',
                'open_bills' => $busy,
            ], 422);
        }

        DB::transaction(function () use ($tenant, $name, $moveTo, $ids) {
            if ($moveTo !== '') {
                Position::where('tenant_id', $tenant->id)->where('zone', $name)->update(['zone' => $moveTo]);
            } elseif (count($ids)) {
                Position::where('tenant_id', $tenant->id)->whereIn('id', $ids)->delete();
            }

            $declared = [];
            foreach ($this->declaredZones($tenant->id) as $z) {
                if (strcasecmp($z, $name) === 0) continue;
                $declared[] = $z;
            }
            if ($moveTo !== '') $declared[] = $moveTo;
            $this->saveDeclaredZones($declared);
        });

        return response()->json($this->planPayload($tenant->id));
    }

    /**
     * Lay out a whole area at once — "twenty tables, T1 to T20, four covers".
     *
     * A CODE ALREADY IN USE IS SKIPPED, NOT FATAL
     * -------------------------------------------
     * Failing the batch on the first collision is how a user ends up clicking
     * Create twenty times, adjusting the start number by hand each time,
     * because one T7 already exists somewhere on the other side of the
     * building. So a taken code is stepped over, the run keeps going until the
     * requested number of tables actually exist, and the response says exactly
     * which codes it skipped.
     */
    public function planTablesBulk(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'zone'     => 'required|string|max:48',
            'count'    => 'required|integer|min:1|max:200',
            'prefix'   => 'required|string|max:8',
            'start'    => 'required|integer|min:0|max:99999',
            'capacity' => 'required|integer|min:1|max:99',
        ]);

        $zone = trim($data['zone']);
        if ($zone === '' || strcasecmp($zone, self::RESERVED_ZONE) === 0) {
            return response()->json(['message' => 'That name is reserved.'], 422);
        }

        $prefix = trim($data['prefix']);
        $want   = (int) $data['count'];
        $cap    = (int) $data['capacity'];
        $n      = (int) $data['start'];
        // A hard stop. Without it a floor whose every candidate code is taken
        // would walk the integers forever inside a transaction.
        $limit  = $n + $want + 1000;

        $taken = [];
        foreach (Position::where('tenant_id', $tenant->id)->pluck('code') as $c) {
            $taken[mb_strtolower((string) $c)] = true;
        }

        $sort    = $this->nextSortOrder($tenant->id);
        $created = 0;
        $skipped = [];

        DB::transaction(function () use ($tenant, $zone, $prefix, $want, $cap, $limit, &$n, &$taken, &$sort, &$created, &$skipped) {
            while ($created < $want && $n <= $limit) {
                $code = $prefix . $n;
                $n++;

                if (mb_strlen($code) > 24) break;
                if (isset($taken[mb_strtolower($code)])) {
                    $skipped[] = $code;
                    continue;
                }

                Position::create([
                    'tenant_id'  => $tenant->id,
                    'zone'       => $zone,
                    'code'       => $code,
                    'label'      => $code,
                    'capacity'   => $cap,
                    'status'     => 'available',
                    'sort_order' => $sort,
                ]);

                $taken[mb_strtolower($code)] = true;
                $sort++;
                $created++;
            }

            $this->declareZone($tenant->id, $zone);
        });

        return response()->json($this->planPayload($tenant->id) + [
            'created'       => $created,
            'skipped'       => count($skipped),
            'skipped_codes' => array_values($skipped),
        ]);
    }

    /** One table. */
    public function planTableAdd(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'zone'     => 'required|string|max:48',
            'code'     => 'required|string|max:24',
            'label'    => 'nullable|string|max:80',
            'capacity' => 'required|integer|min:1|max:99',
        ]);

        $zone = trim($data['zone']);
        $code = trim($data['code']);

        if ($zone === '' || strcasecmp($zone, self::RESERVED_ZONE) === 0) {
            return response()->json(['message' => 'That name is reserved.'], 422);
        }
        if ($code === '') {
            return response()->json(['message' => 'A table needs a code.'], 422);
        }
        if ($this->codeTaken($tenant->id, $code)) {
            return response()->json(['message' => 'Table ' . $code . ' already exists.'], 422);
        }

        Position::create([
            'tenant_id'  => $tenant->id,
            'zone'       => $zone,
            'code'       => $code,
            'label'      => trim((string) ($data['label'] ?? '')) ?: $code,
            'capacity'   => (int) $data['capacity'],
            'status'     => 'available',
            'sort_order' => $this->nextSortOrder($tenant->id),
        ]);

        $this->declareZone($tenant->id, $zone);

        return response()->json($this->planPayload($tenant->id));
    }

    /** Edit one table. Only the keys that were sent are touched. */
    public function planTableUpdate(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'id'       => 'required|integer',
            'code'     => 'nullable|string|max:24',
            'label'    => 'nullable|string|max:80',
            'capacity' => 'nullable|integer|min:1|max:99',
            'zone'     => 'nullable|string|max:48',
        ]);

        $pos   = Position::where('tenant_id', $tenant->id)->findOrFail($data['id']);
        $patch = [];

        if (($data['code'] ?? null) !== null) {
            $code = trim($data['code']);
            if ($code === '') {
                return response()->json(['message' => 'A table needs a code.'], 422);
            }
            if ($this->codeTaken($tenant->id, $code, $pos->id)) {
                return response()->json(['message' => 'Table ' . $code . ' already exists.'], 422);
            }
            $patch['code'] = $code;
        }

        if (($data['label'] ?? null) !== null)    $patch['label']    = trim($data['label']);
        if (($data['capacity'] ?? null) !== null) $patch['capacity'] = (int) $data['capacity'];

        if (($data['zone'] ?? null) !== null) {
            $zone = trim($data['zone']);
            if ($zone === '' || strcasecmp($zone, self::RESERVED_ZONE) === 0) {
                return response()->json(['message' => 'That name is reserved.'], 422);
            }
            $patch['zone'] = $zone;
        }

        if (count($patch)) {
            $pos->update($patch);
            if (isset($patch['zone'])) $this->declareZone($tenant->id, $patch['zone']);
        }

        return response()->json($this->planPayload($tenant->id));
    }

    /**
     * Delete one table.
     *
     * Refused while somebody is sitting at it, and the refusal NAMES the bill —
     * "there is an open bill" sends a manager hunting the floor for which one.
     */
    public function planTableRemove(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate(['id' => 'required|integer']);

        $pos = Position::where('tenant_id', $tenant->id)->findOrFail($data['id']);
        $occ = $this->activeOccupancy($tenant->id, $pos->id);

        if ($occ) {
            $owed = $this->unpaidTotal($occ->session_data ?? []);
            return response()->json([
                'message'      => 'Table ' . ($pos->label ?: $pos->code) . ' has an open bill ('
                                    . ($occ->label ?: ('#' . $occ->id)) . ', '
                                    . number_format($owed, 2) . ' outstanding). Settle or close it first.',
                'occupancy_id' => $occ->id,
                'unpaid_total' => $owed,
            ], 422);
        }

        $pos->delete();

        return response()->json($this->planPayload($tenant->id));
    }

    /** Display order, as dragged. Ids not owned by this tenant are ignored. */
    public function planReorder(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'ids'   => 'present|array',
            'ids.*' => 'required|integer',
        ]);

        $ids = array_values(array_unique(array_map('intval', $data['ids'])));

        DB::transaction(function () use ($tenant, $ids) {
            $i = 0;
            foreach ($ids as $id) {
                $i++;
                Position::where('tenant_id', $tenant->id)->where('id', $id)->update(['sort_order' => $i]);
            }
        });

        return response()->json($this->planPayload($tenant->id));
    }

    /**
     * Which lanes this store runs.
     *
     * Store settings, gated like service_mode and for the same reason: whether
     * the house takes delivery orders is a property of the business, not of the
     * till someone happens to be standing at.
     */
    public function planLanes(Request $request): JsonResponse
    {
        $data = $request->validate([
            'takeaway' => 'required|boolean',
            'delivery' => 'required|boolean',
        ]);

        $takeaway = (bool) $data['takeaway'];
        $delivery = (bool) $data['delivery'];

        Setting::updateOrCreate(['key' => 'lane_takeaway'], ['value' => $takeaway ? '1' : '0']);
        Setting::updateOrCreate(['key' => 'lane_delivery'], ['value' => $delivery ? '1' : '0']);

        return response()->json(['takeaway' => $takeaway, 'delivery' => $delivery]);
    }

    /* ── helpers ─────────────────────────────────────────────────────────── */

    /*
    | THE MONEY ON A LINE IS COMPUTED IN EXACTLY ONE PLACE
    | ----------------------------------------------------
    | Before modifiers, `price * qty` appeared in saveOrder and again in merge,
    | and they were already the same expression written twice. Adding a signed
    | delta to it in one of them and not the other would produce a floor screen
    | and a register that quietly disagree about what a table owes. So the
    | arithmetic lives here, once, and every caller asks.
    */

    /** A line's unit price after its modifiers move it. Signed: deltas may reduce. */
    private function lineUnitPrice(array $line): float
    {
        $unit = (float) ($line['price'] ?? 0);
        foreach (($line['mods'] ?? []) as $mod) {
            $unit += (float) ($mod['price_delta'] ?? 0);
        }
        return round($unit, 4);
    }

    /** Stamp the derived unit price onto the line so readers never re-derive it. */
    private function priceLine(array $line): array
    {
        $line['mods']       = array_values($line['mods'] ?? []);
        $line['unit_price'] = $this->lineUnitPrice($line);
        return $line;
    }

    private function lineTotal(array $line): float
    {
        return round($this->lineUnitPrice($line) * (float) ($line['qty'] ?? 0), 2);
    }

    private function cartTotal(array $cart): float
    {
        $total = 0.0;
        foreach ($cart as $line) $total += $this->lineTotal((array) $line);
        return round($total, 2);
    }

    /**
     * How a line is addressed by a split.
     *
     * `line_id` when the caller gives one, otherwise the product id it has
     * always carried. Two rows that share a key settle together — which is the
     * right default for the same dish ordered twice, and the reason a client
     * that needs to split them apart should send distinct `line_id`s.
     */
    private function lineKey(array $line): string
    {
        return (string) ($line['line_id'] ?? $line['id'] ?? '');
    }

    private function unpaidLines(array $cart): array
    {
        return array_values(array_filter($cart, fn ($l) => empty($l['paid_sale_id'])));
    }

    private function paidLines(array $cart): array
    {
        return array_values(array_filter($cart, fn ($l) => !empty($l['paid_sale_id'])));
    }

    /**
     * Money banked against this table that no line can account for.
     *
     * A covers or amount split has no rows to stamp, so the amount is the only
     * record that it was paid. Line splits are skipped here because their rows
     * already carry the stamp — counting both would halve the bill twice.
     */
    private function offLinePaid(array $session): float
    {
        $paid = 0.0;
        foreach (($session['settled_parts'] ?? []) as $part) {
            if (($part['mode'] ?? '') === 'lines') continue;
            $paid += (float) ($part['amount'] ?? 0);
        }
        return round($paid, 2);
    }

    /** What the table still owes: unpaid lines, less anything paid off the lines. */
    private function unpaidTotal(array $session): float
    {
        $owed = $this->cartTotal($this->unpaidLines($session['cart'] ?? [])) - $this->offLinePaid($session);
        return round(max(0, $owed), 2);
    }

    /**
     * A settled line is neither editable nor deletable.
     *
     * saveOrder takes the WHOLE cart from a handheld that may have been showing
     * the table before someone paid their share. A client that omits a stamped
     * line — or re-prices one — must not be able to un-sell it, so stamped rows
     * are taken from the stored session, anything the client sent as a stamp is
     * discarded, and a row the client dropped is put back where it was.
     */
    private function preservePaidLines(array $submitted, array $stored): array
    {
        $paid = [];
        foreach ($stored as $line) {
            if (!empty($line['paid_sale_id'])) $paid[$this->lineKey($line)] = $line;
        }

        $out = [];
        foreach ($submitted as $line) {
            unset($line['paid_sale_id']);
            $key = $this->lineKey($line);
            if (isset($paid[$key])) {
                $out[] = $paid[$key];
                unset($paid[$key]);
                continue;
            }
            $out[] = $line;
        }
        foreach ($paid as $line) $out[] = $line;

        return array_values($out);
    }

    private function activeOccupancy(int $tenantId, int $positionId): ?Occupancy
    {
        return Occupancy::where('tenant_id', $tenantId)
            ->where('position_id', $positionId)
            ->whereNull('closed_at')
            ->first();
    }

    private function ownedOccupancy(int $tenantId, int $id): Occupancy
    {
        return Occupancy::where('tenant_id', $tenantId)->whereNull('closed_at')->findOrFail($id);
    }

    /**
     * 'counter' is the parked-cart pseudo position the occupancy migration
     * creates, one per tenant, to hang parked carts off. It is not a seat and
     * it has never belonged on a floor plan; see seedIfEmpty() for the full
     * zone vocabulary.
     */
    private const RESERVED_ZONE = 'counter';

    /**
     * The areas of this floor.
     *
     * The DECLARED list (`settings.floor_zones`, written by the builder) unioned
     * with the zones actually in use. Two sources because neither alone is
     * enough: a zone is only a string on `positions`, so an area with no tables
     * yet has nowhere to live but the settings row — and a settings row that was
     * never written, or was lost, must not make a floor full of tables vanish.
     *
     * Takeaway and delivery are NOT in here. They are not places on a floor;
     * the terminal adds those tabs from `lane_takeaway` / `lane_delivery`.
     */
    private function zones(int $tenantId): array
    {
        $inUse = Position::where('tenant_id', $tenantId)
            ->where('zone', '!=', self::RESERVED_ZONE)
            ->select('zone')->distinct()->pluck('zone')->all();

        $out = [];
        foreach (array_merge($this->declaredZones($tenantId), $inUse) as $z) {
            $z = trim((string) $z);
            if ($z === '' || strcasecmp($z, self::RESERVED_ZONE) === 0) continue;
            // Case-insensitive de-dup; the first spelling seen wins, so a
            // declared "Terrace" is not shadowed by a stray "terrace" on a row.
            $key = mb_strtolower($z);
            if (!isset($out[$key])) $out[$key] = $z;
        }

        $zones = array_values($out);
        // Alphabetical, because floorState() groups by zone the same way and a
        // tab strip in one order over a list in another reads as a bug.
        sort($zones, SORT_NATURAL | SORT_FLAG_CASE);

        return $zones;
    }

    /**
     * EVERYTHING THE FLOOR SCREEN POLLS, IN FOUR QUERIES.
     *
     * This runs on a fifteen-second timer on every device in the building, so
     * the query count is a fixed cost and not a per-table one: positions with
     * their open occupancy and its server, the lane tickets with theirs, ONE
     * `whereIn('occupancy_id', ...)` that fetches the kitchen statuses for
     * every open bill at once, and the pass counter. Asking the work_orders
     * table per position would be an N+1 that multiplies by the size of the
     * restaurant AND by the number of handhelds on the floor.
     *
     * Returns { positions, tickets, zones, kitchen }. Callers that only ever
     * wanted `positions` still find it there, unchanged.
     */
    private function floorState(int $tenantId): array
    {
        $positions = Position::with(['activeOccupancy.user'])
            ->where('tenant_id', $tenantId)
            ->where('zone', '!=', self::RESERVED_ZONE)
            ->orderBy('zone')->orderBy('sort_order')->orderBy('id')
            ->get();

        /* A NULL position_id means a lane ticket and nothing else: the column
           was NOT NULL until the migration that introduced them. */
        $tickets = Occupancy::with('user')
            ->where('tenant_id', $tenantId)
            ->whereNull('position_id')
            ->whereNull('closed_at')
            ->orderBy('opened_at')->orderBy('id')
            ->get();

        $occIds = [];
        foreach ($positions as $p) {
            if ($p->activeOccupancy) $occIds[] = (int) $p->activeOccupancy->id;
        }
        foreach ($tickets as $t) $occIds[] = (int) $t->id;

        $kitchen = $this->kitchenStatuses($tenantId, $occIds);

        $shapedPositions = [];
        foreach ($positions as $p) {
            $occ = $p->activeOccupancy;
            $shapedPositions[] = $this->shape($p, $occ, $occ ? ($kitchen[(int) $occ->id] ?? []) : []);
        }

        $shapedTickets = [];
        foreach ($tickets as $t) {
            $shapedTickets[] = $this->ticketShape($t, $kitchen[(int) $t->id] ?? []);
        }

        return [
            'positions' => $shapedPositions,
            'tickets'   => $shapedTickets,
            'zones'     => $this->zones($tenantId),
            'kitchen'   => WorkOrder::where('tenant_id', $tenantId)
                               ->whereIn('status', ['pending', 'preparing'])
                               ->count(),
        ];
    }

    private function shape(?Position $pos, ?Occupancy $occ, ?array $kitchen = null): array
    {
        if (!$pos) return [];
        $s = $occ?->session_data ?? [];

        $status = $occ ? 'open'
            : (in_array($pos->status, ['reserved', 'cleaning'], true) ? $pos->status : 'available');

        $cart = $s['cart'] ?? [];
        $unsent = 0;
        foreach ($cart as $l) if (empty($l['sent'])) $unsent++;

        $unpaid = $this->unpaidTotal($s);
        $paid   = round($this->cartTotal($this->paidLines($cart)) + $this->offLinePaid($s), 2);

        $derived = $this->derivedState($pos, $occ, $kitchen);

        return [
            'id'           => $pos->id,
            'kind'         => 'position',
            'zone'         => $pos->zone,
            'code'         => $pos->code,
            'label'        => $pos->label ?: $pos->code,
            'capacity'     => (int) $pos->capacity,
            'sort_order'   => (int) $pos->sort_order,
            /* `status` is what it always was — the POSITION's own flag, plus
               'open' when something is on it. `state` below is the derived
               ladder and is the key anything new should be reading. Both are
               published because changing what an existing key means is how a
               screen that was working starts lying. */
            'status'       => $status,

            'state'        => $derived['state'],
            'state_since'  => $derived['state_since'],

            'occupancy_id' => $occ?->id,
            'opened_at'    => $occ?->opened_at?->toIso8601String(),
            'order_type'   => $s['order_type'] ?? 'dine_in',
            'covers'       => (int) ($s['covers'] ?? 0),
            'server'       => $this->serverOf($occ),

            /* order_total IS THE UNPAID TOTAL.
               Every existing reader of this key wants the same thing: the floor
               screen prints it on the card and sums it into "due on the floor",
               and close() refuses on it. All three are asking "what would be
               lost if this table went away right now", and money a split has
               already banked is not part of that answer. Both halves are also
               published separately so a card can show "1,200 of 3,000 paid"
               without doing arithmetic of its own. */
            'order_total'    => $unpaid,
            'paid_total'     => $paid,
            'unpaid_total'   => $unpaid,
            'pending_settle' => $s['pending_settle'] ?? null,

            'lines'        => count($cart),
            'unsent'       => $unsent,
            'note'         => $s['note'] ?? '',
            'cart'         => $cart,

            'check_dropped_at' => $s['check_dropped_at'] ?? null,
        ];
    }

    /* ── THE STATE LADDER ────────────────────────────────────────────────
    |
    | WHAT A TABLE IS DOING IS DERIVED, NEVER STORED.
    |
    | A `state` column is a column somebody has to remember to write. Every
    | table-service product that has one has the same bug: a waiter fires an
    | order from a handheld that loses signal, the write lands, the state update
    | does not, and the floor shows "seated" over a table whose mains are on the
    | pass. There is nothing to reconcile here because there is nothing stored —
    | the cart, the send stamp, the check stamp and the kitchen's own ticket
    | statuses already say everything, and this reads them in priority order.
    |
    |   cleaning       position flagged cleaning, nothing open on it
    |   reserved       position flagged reserved, nothing open on it
    |   free           nothing open on it
    |   check_dropped  the bill went down and something is still unpaid
    |   seated         open, nothing ordered yet
    |   ordered        at least one line has not been fired
    |   in_kitchen     everything fired, and a ticket is not yet served/cancelled
    |   served         everything fired, and every ticket is served/cancelled
    |
    | check_dropped outranks everything below it on purpose: a table waiting to
    | pay is the one a manager has to see, whatever the kitchen is doing.
    |
    | `state_since` is when the CURRENT state began, so a screen can age it
    | without a second source: check_dropped_at, sent_at, opened_at or the
    | position's updated_at, and null for free — an empty table has not been
    | anything since anything.
    */
    private function derivedState(?Position $pos, ?Occupancy $occ, ?array $kitchen = null): array
    {
        if (!$occ) {
            $status = (string) ($pos?->status ?? '');
            if ($status === 'cleaning' || $status === 'reserved') {
                return ['state' => $status, 'state_since' => $pos?->updated_at?->toIso8601String()];
            }
            return ['state' => 'free', 'state_since' => null];
        }

        $s      = $occ->session_data ?? [];
        $cart   = $s['cart'] ?? [];
        $opened = $occ->opened_at?->toIso8601String();
        $sentAt = $s['sent_at'] ?? null;

        if (!empty($s['check_dropped_at']) && $this->unpaidTotal($s) > 0) {
            return ['state' => 'check_dropped', 'state_since' => (string) $s['check_dropped_at']];
        }

        if (!count($cart)) {
            return ['state' => 'seated', 'state_since' => $opened];
        }

        foreach ($cart as $line) {
            if (empty($line['sent'])) {
                return ['state' => 'ordered', 'state_since' => $opened];
            }
        }

        /* Everything is fired. What the kitchen has done with it decides, and
           the statuses are normally handed in already — floorState() fetches
           every open bill's in one query. The lookup below is the single-card
           path (one mutation, one table) and never runs on the poll. */
        $statuses = $kitchen;
        if ($statuses === null) {
            $byOcc    = $this->kitchenStatuses((int) $occ->tenant_id, [(int) $occ->id]);
            $statuses = $byOcc[(int) $occ->id] ?? [];
        }

        foreach ($statuses as $st) {
            if (!in_array($st, ['served', 'cancelled'], true)) {
                // sent_at can be missing on a table that was merged into: the
                // lines arrived already fired. opened_at is then the honest
                // floor for "how long has this been like this".
                return ['state' => 'in_kitchen', 'state_since' => $sentAt ?: $opened];
            }
        }

        return ['state' => 'served', 'state_since' => $sentAt ?: $opened];
    }

    /**
     * Every open bill's kitchen ticket statuses in ONE query, keyed by
     * occupancy id. Only the two columns the ladder reads — a floor poll has no
     * business dragging every ticket's item JSON across the wire.
     */
    private function kitchenStatuses(int $tenantId, array $occupancyIds): array
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', $occupancyIds))));
        if (!count($ids)) return [];

        $out  = [];
        $rows = WorkOrder::where('tenant_id', $tenantId)
            ->whereIn('occupancy_id', $ids)
            ->get(['occupancy_id', 'status']);

        foreach ($rows as $wo) {
            $out[(int) $wo->occupancy_id][] = (string) $wo->status;
        }

        return $out;
    }

    /** Who opened it. Two initials so a floor card can carry a server at a glance. */
    private function serverOf(?Occupancy $occ): ?array
    {
        $user = $occ?->user;
        if (!$user) return null;

        $name = (string) ($user->name ?? '');

        return [
            'id'       => $user->id,
            'name'     => $name,
            'initials' => $this->initials($name),
        ];
    }

    private function initials(?string $name): string
    {
        $parts = preg_split('/\s+/', trim((string) $name), -1, PREG_SPLIT_NO_EMPTY);
        if (!is_array($parts) || !count($parts)) return '';

        if (count($parts) === 1) {
            return mb_strtoupper(mb_substr($parts[0], 0, 2));
        }

        return mb_strtoupper(mb_substr($parts[0], 0, 1) . mb_substr($parts[count($parts) - 1], 0, 1));
    }

    /**
     * One shaped card for whatever this occupancy is.
     *
     * A table comes back under `position` exactly as it always did; a lane
     * ticket comes back under `ticket`. Before lanes existed every one of these
     * endpoints could assume a position, and shape() returns [] without one —
     * which would have made a takeaway order that saves fine look like it
     * vanished.
     */
    private function cardFor(Occupancy $occ): array
    {
        return $occ->position_id
            ? ['position' => $this->shape($occ->position, $occ)]
            : ['ticket'   => $this->ticketShape($occ)];
    }

    /**
     * A lane ticket, shaped for the floor screen's ticket rail.
     *
     * `id` is prefixed so it cannot collide with a position id — the two live
     * in one selection model on the screen and integer 7 is both a table and a
     * ticket. The money keys are the same keys, computed by the same helpers,
     * as a table's: a takeaway bag that totals differently from a table with
     * the same cart is a bug waiting to be argued about at the till.
     */
    private function ticketShape(Occupancy $occ, ?array $kitchen = null): array
    {
        $s    = $occ->session_data ?? [];
        $cart = $s['cart'] ?? [];

        $unsent = 0;
        foreach ($cart as $l) if (empty($l['sent'])) $unsent++;

        $unpaid = $this->unpaidTotal($s);
        $paid   = round($this->cartTotal($this->paidLines($cart)) + $this->offLinePaid($s), 2);

        $derived = $this->derivedState(null, $occ, $kitchen);
        $code    = (string) ($occ->label ?: ('#' . $occ->id));
        $name    = trim((string) ($s['customer_name'] ?? ''));

        return [
            'id'           => 't' . $occ->id,
            'occupancy_id' => $occ->id,
            'kind'         => 'ticket',
            'order_type'   => $s['order_type'] ?? 'takeaway',
            'code'         => $code,
            'label'        => $name !== '' ? $name : $code,

            'state'        => $derived['state'],
            'state_since'  => $derived['state_since'],
            'opened_at'    => $occ->opened_at?->toIso8601String(),

            'order_total'    => $unpaid,
            'paid_total'     => $paid,
            'unpaid_total'   => $unpaid,
            'pending_settle' => $s['pending_settle'] ?? null,

            'lines'  => count($cart),
            'unsent' => $unsent,
            'note'   => $s['note'] ?? '',
            'cart'   => $cart,

            'customer_name' => (string) ($s['customer_name'] ?? ''),
            'phone'         => (string) ($s['phone'] ?? ''),
            'address'       => (string) ($s['address'] ?? ''),

            'check_dropped_at' => $s['check_dropped_at'] ?? null,
            'server'           => $this->serverOf($occ),
        ];
    }

    /**
     * TA-014 / DL-003 — sequential per tenant per day.
     *
     * Derived from a count rather than a sequence table: a sequence is a row
     * somebody has to reset at midnight and a lock every ticket contends on,
     * for a number whose only job is to be sayable across a counter. Two
     * devices opening a bag in the same second would land on the same count,
     * so the candidate is walked forward until it is actually free — the
     * collision costs one cheap query and never a duplicate ticket number.
     */
    private function nextTicketNumber(int $tenantId, string $orderType): string
    {
        $prefix = $orderType === 'delivery' ? 'DL' : 'TA';
        $today  = now()->toDateString();

        $base = Occupancy::where('tenant_id', $tenantId)
            ->whereNull('position_id')
            ->whereDate('opened_at', $today)
            ->where('session_data->order_type', $orderType)
            ->count();

        for ($i = 0; $i <= 500; $i++) {
            $code = $prefix . '-' . str_pad((string) ($base + 1 + $i), 3, '0', STR_PAD_LEFT);

            $taken = Occupancy::where('tenant_id', $tenantId)
                ->whereNull('position_id')
                ->whereDate('opened_at', $today)
                ->where('label', $code)
                ->exists();

            if (!$taken) return $code;
        }

        return $prefix . '-' . now()->format('His');
    }

    /* ── FLOOR PLAN STORAGE ──────────────────────────────────────────────── */

    private function settingValue(int $tenantId, string $key): ?string
    {
        $row = Setting::where('tenant_id', $tenantId)->where('key', $key)->first();

        return $row ? (string) $row->value : null;
    }

    /** The areas the builder has declared, empty ones included. */
    private function declaredZones(int $tenantId): array
    {
        $raw = $this->settingValue($tenantId, 'floor_zones');
        if ($raw === null) return [];

        $list = json_decode($raw, true);
        if (!is_array($list)) return [];

        $out = [];
        foreach ($list as $z) {
            $z = trim((string) $z);
            if ($z !== '') $out[] = $z;
        }

        return $out;
    }

    private function saveDeclaredZones(array $zones): void
    {
        $seen = [];
        $out  = [];

        foreach ($zones as $z) {
            $z = trim((string) $z);
            if ($z === '' || strcasecmp($z, self::RESERVED_ZONE) === 0) continue;

            $key = mb_strtolower($z);
            if (isset($seen[$key])) continue;

            $seen[$key] = true;
            $out[]      = $z;
        }

        Setting::updateOrCreate(['key' => 'floor_zones'], ['value' => json_encode(array_values($out))]);
    }

    /** Make sure a zone a table was just put into is on the declared list too. */
    private function declareZone(int $tenantId, string $zone): void
    {
        $declared = $this->declaredZones($tenantId);
        foreach ($declared as $z) {
            if (strcasecmp($z, $zone) === 0) return;
        }

        $declared[] = $zone;
        $this->saveDeclaredZones($declared);
    }

    private function zonesWithCounts(int $tenantId): array
    {
        $counts = Position::where('tenant_id', $tenantId)
            ->where('zone', '!=', self::RESERVED_ZONE)
            ->select('zone', DB::raw('COUNT(*) as aggregate_count'))
            ->groupBy('zone')
            ->pluck('aggregate_count', 'zone')
            ->all();

        $out = [];
        foreach ($this->zones($tenantId) as $zone) {
            $out[] = ['name' => $zone, 'count' => (int) ($counts[$zone] ?? 0)];
        }

        return $out;
    }

    /**
     * The builder's list. Deliberately NOT shape() — the builder needs to know
     * which tables cannot be touched, not what is on their bill, and shipping a
     * whole cart per table to a settings screen is a page that gets slower
     * every time the restaurant gets busier.
     */
    private function planPositions(int $tenantId): array
    {
        $open = [];
        foreach (
            Occupancy::where('tenant_id', $tenantId)
                ->whereNull('closed_at')
                ->whereNotNull('position_id')
                ->pluck('position_id') as $pid
        ) {
            $open[(int) $pid] = true;
        }

        $out = Position::where('tenant_id', $tenantId)
            ->where('zone', '!=', self::RESERVED_ZONE)
            ->orderBy('zone')->orderBy('sort_order')->orderBy('id')
            ->get()
            ->map(fn (Position $p) => [
                'id'            => $p->id,
                'zone'          => $p->zone,
                'code'          => $p->code,
                'label'         => $p->label ?: $p->code,
                'capacity'      => (int) $p->capacity,
                'sort_order'    => (int) $p->sort_order,
                'status'        => $p->status,
                'has_open_bill' => isset($open[(int) $p->id]),
            ])
            ->values()->all();

        return $out;
    }

    /** What every plan mutation answers with: the rebuilt plan. */
    private function planPayload(int $tenantId): array
    {
        return [
            'zones'     => $this->zonesWithCounts($tenantId),
            'positions' => $this->planPositions($tenantId),
        ];
    }

    /**
     * Codes are unique PER TENANT and it is enforced here, because there is no
     * unique index on (tenant_id, code) to enforce it — see the note in the
     * floor-plan migration for why one was not added to live data.
     */
    private function codeTaken(int $tenantId, string $code, ?int $exceptId = null): bool
    {
        $q = Position::where('tenant_id', $tenantId)->where('code', $code);
        if ($exceptId !== null) $q->where('id', '!=', $exceptId);

        return $q->exists();
    }

    private function nextSortOrder(int $tenantId): int
    {
        return ((int) Position::where('tenant_id', $tenantId)->max('sort_order')) + 1;
    }

    /**
     * A brand-new tenant gets a floor to look at rather than an empty page.
     *
     * ONE ZONE VOCABULARY, TWO SCREENS
     * --------------------------------
     * The restaurant dashboard used to demand zone = 'dining' and seed its own
     * five tables when it found none — so a tenant who opened the floor screen
     * first ended up with this seeder's tables AND five more, two T1s and two
     * T2s on one floor. That seeder is gone, and the rule is now:
     *
     *   'counter'  is RESERVED. It is the parked-cart pseudo position created
     *              by the occupancy migration and it is not a seat; no floor
     *              screen shows it.
     *   everything else is seating, whatever it is called — 'dining' from the
     *              legacy restaurant_tables backfill, or the human zone names
     *              below. Both screens read the same set.
     *
     * Which is why the emptiness test ignores 'counter': a tenant whose only
     * position is the parked-cart slot has no floor, and used to get none.
     */
    private function seedIfEmpty(int $tenantId): void
    {
        if (Position::where('tenant_id', $tenantId)->where('zone', '!=', self::RESERVED_ZONE)->exists()) return;

        /* AND THE BUILDER ALWAYS WINS.
           A tenant who has used the floor builder has declared a floor even
           when it is momentarily empty — an area they just created with no
           tables on it yet, or a demo floor they deliberately cleared out.
           Re-seeding twelve tables under either is the seeder fighting the
           user, and it would do it on every visit. A saved zone list, or the
           one-time marker stamped below, stops it for good. */
        if ($this->settingValue($tenantId, 'floor_zones') !== null) return;
        if ($this->settingValue($tenantId, 'floor_seeded') !== null) return;

        $seed = [
            ['zone' => 'Main hall', 'n' => 6, 'cap' => 4],
            ['zone' => 'Window',    'n' => 3, 'cap' => 2],
            ['zone' => 'Terrace',   'n' => 3, 'cap' => 6],
        ];
        $i = 0;
        foreach ($seed as $z) {
            for ($k = 1; $k <= $z['n']; $k++) {
                $i++;
                Position::create([
                    'tenant_id'   => $tenantId,
                    'zone'        => $z['zone'],
                    'code'        => 'T' . $i,
                    'label'       => 'T' . $i,
                    'capacity'    => $z['cap'],
                    'status'      => 'available',
                    'sort_order'  => $i,
                    'source_type' => 'restaurant_table',
                ]);
            }
        }

        // Once, ever. Deleting every demo table must not bring them back.
        Setting::updateOrCreate(['key' => 'floor_seeded'], ['value' => '1']);
    }
}
