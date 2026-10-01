<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * What a party's position with this shop actually is, read from the ledger.
 *
 * `parties.current_balance` is a cached figure that several code paths write
 * and none of them agree on: PartyController recomputes it, opening balances
 * seed it, and its sign means the opposite thing for a customer and for a
 * supplier. Reading it on a document screen is how a purchase from a customer
 * came to show their balance going UP when the shop had just taken on a debt
 * to them.
 *
 * The journal is the only thing that knows. This reads it:
 *
 *     1200  Accounts Receivable      debit  − credit  = they owe the shop
 *     1450  Advances to Suppliers    debit  − credit  = they owe the shop goods
 *     2000  Accounts Payable         credit − debit   = the shop owes them
 *     2050  Customer Credit Balances credit − debit   = the shop owes them
 *     2060  Customer Advances        credit − debit   = the shop owes them
 *
 * The last three were missing and each of them hid real money. A customer who
 * overpaid had the change kept on their account in 2050 and their balance went
 * on reading zero, so the next invoice asked them for the full amount. A
 * deposit paid to a supplier sat in 1450 and the supplier's balance still said
 * the whole bill was owed. Money the shop was holding, or had already handed
 * over, simply did not appear.
 *
 * and returns ONE signed figure from the shop's point of view:
 *
 *     net  >  0   they owe the shop
 *     net  <  0   the shop owes them
 *
 * Both sides come back separately as well, because a party who is both a
 * customer and a supplier genuinely has two balances and a statement should be
 * able to show them apart.
 */
class PartyBalanceController extends Controller
{
    public function __invoke(Request $request, string $party)
    {
        if (! app()->bound('current.tenant')) {
            return response()->json(['message' => 'No store in scope.'], 403);
        }

        $tenantId = app('current.tenant')->id;

        $side = function (string $code, string $expr) use ($tenantId, $party) {
            return (float) (DB::table('journal_items as ji')
                ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                ->where('a.tenant_id', $tenantId)
                ->where('a.code', $code)
                ->where('je.tenant_id', $tenantId)
                ->where('je.is_reversed', 0)
                /* The party may be named on the entry or on the individual
                   line — both are used in this codebase, so both are counted,
                   and the line wins where it is set. */
                ->where(function ($q) use ($party) {
                    $q->where('ji.party_id', $party)
                      ->orWhere(function ($q2) use ($party) {
                          $q2->whereNull('ji.party_id')->where('je.party_id', $party);
                      });
                })
                ->selectRaw($expr . ' as net')
                ->value('net') ?? 0);
        };

        $dr = 'COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0)';
        $cr = 'COALESCE(SUM(ji.credit),0) - COALESCE(SUM(ji.debit),0)';

        /* What they owe the shop: the bills they have not paid, plus anything
           the shop has prepaid them and not yet received. */
        $receivable = round($side('1200', $dr) + $side('1450', $dr), 2);

        /* What the shop owes them: bills of theirs not yet paid, credit held on
           their account, and deposits taken against goods not yet delivered. */
        $payable = round($side('2000', $cr) + $side('2050', $cr) + $side('2060', $cr), 2);

        return response()->json([
            'party_id'   => $party,
            'receivable' => $receivable,
            'payable'    => $payable,
            'net'        => round($receivable - $payable, 2),
        ]);
    }
}
