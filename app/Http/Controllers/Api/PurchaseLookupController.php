<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * A party's recent purchases.
 *
 * `debit_notes.purchase_id` has been a column since the table was made and was
 * never once written, because the screen had no way to ask which bill the note
 * was about. This is that way.
 */
class PurchaseLookupController extends Controller
{
    public function forParty(Request $request, string $party)
    {
        $tenantId = app('current.tenant')->id;

        /* `purchases` has `reference`, not `reference_number`, and it is not
           soft-deleted — the first version of this query named both and threw
           SQLSTATE[42S22] on every call, which the caller swallowed into an
           empty list. */
        $rows = DB::table('purchases')
            ->where('purchases.tenant_id', $tenantId)
            ->where('purchases.party_id', $party)
            ->orderByDesc('purchases.purchase_date')
            ->limit(25)
            ->get([
                'purchases.id',
                'purchases.reference as reference',
                'purchases.invoice_number',
                'purchases.purchase_date as date',
                'purchases.total',
            ]);

        return response()->json($rows);
    }
}
