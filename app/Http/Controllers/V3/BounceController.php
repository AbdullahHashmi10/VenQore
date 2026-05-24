<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BounceController extends Controller
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function store(Request $request, string $journalEntryId)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        // Confirm this is a customer payment entry — never allow bouncing a sale
        $entry = DB::table('journal_entries')->where('journal_entries.tenant_id', app('current.tenant')->id)
            ->where('id', $journalEntryId)
            ->firstOrFail();

        if ($entry->reference_type !== 'customer_payment') {
            return back()->withErrors([
                'entry' => 'Only customer payment entries can be bounced.',
            ]);
        }

        if ($entry->is_reversed) {
            return back()->withErrors([
                'entry' => 'This payment has already been reversed.',
            ]);
        }

        // reverseEntry() handles the mirror journal + voidAllocations()
        // + badge rebuild — all in one atomic transaction.
        // Result: DR 1200 AR, CR 1000/1010 Cash — invoice reverts to unpaid/partial.
        $this->accounting->reverseEntry(
            $journalEntryId,
            'Bounced cheque: ' . $validated['reason']
        );

        return redirect()->back()
            ->with('success', 'Cheque bounced. Payment reversed and invoice reopened.');
    }
}
