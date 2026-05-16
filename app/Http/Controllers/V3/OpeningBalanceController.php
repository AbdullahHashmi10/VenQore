<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Http\Requests\V3\StoreOpeningBalanceRequest;
use App\Services\V3\AccountingService;
use App\Services\V3\FifoService;
use Illuminate\Support\Facades\DB;

class OpeningBalanceController extends Controller
{
    public function __construct(
        private AccountingService $accounting,
        private FifoService       $fifo
    ) {}

    public function store(StoreOpeningBalanceRequest $request)
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated) {

            // ── 1. Post financial account opening balances ────────────
            // Each entry is balanced against 7000 Opening Balance Equity
            foreach ($validated['entries'] as $entry) {
                $amount = (float) $entry['amount'];
                $side   = $entry['side']; // 'debit' or 'credit'

                // The real account line
                $realLine = [
                    'account_code' => $entry['account_code'],
                    'debit'        => $side === 'debit'  ? $amount : 0,
                    'credit'       => $side === 'credit' ? $amount : 0,
                ];

                // 7000 is always the mirror
                $balancingLine = [
                    'account_code' => '7000',
                    'debit'        => $side === 'credit' ? $amount : 0,
                    'credit'       => $side === 'debit'  ? $amount : 0,
                ];

                if (!empty($entry['party_id'])) {
                    $realLine['party_id'] = $entry['party_id'];
                }

                $this->accounting->createEntry([
                    'date'     => $validated['entry_date'],
                    'reference_type' => 'opening_balance',
                    'reference'   => $entry['account_code'],
                    'description'    => "Opening balance — account {$entry['account_code']}",
                    'party_id'       => $entry['party_id'] ?? null,
                ], [$realLine, $balancingLine]);
            }

            // ── 2. Post inventory opening stock ───────────────────────
            if (!empty($validated['stock_entries'])) {
                foreach ($validated['stock_entries'] as $stockEntry) {
                    $qty      = (float) $stockEntry['qty'];
                    $unitCost = (float) $stockEntry['unit_cost'];
                    $total    = round($qty * $unitCost, 2);

                    // Hard block: zero cost opening stock (S-055)
                    // App layer check — DB constraint is the final guard
                    if ($unitCost <= 0) {
                        throw new \InvalidArgumentException(
                            "Opening stock for product {$stockEntry['product_id']} " .
                            "has zero unit cost. This is blocked by S-055. " .
                            "Every opening batch must have a known cost."
                        );
                    }

                    // Create the inventory batch
                    $this->fifo->receiveBatch(
                        productId:   $stockEntry['product_id'],
                        warehouseId: $stockEntry['warehouse_id'],
                        qty:         $qty,
                        unitCost:    $unitCost,
                        batchType:   'opening'
                    );

                    // DR 1100 Inventory / CR 7000 Opening Balance Equity
                    $this->accounting->createEntry([
                        'date'     => $validated['entry_date'],
                        'reference_type' => 'opening_balance',
                        'reference'   => $stockEntry['product_id'],
                        'description'    => "Opening stock — product {$stockEntry['product_id']}",
                    ], [
                        ['account_code' => '1100', 'debit'  => $total, 'credit' => 0],
                        ['account_code' => '7000', 'debit'  => 0,      'credit' => $total],
                    ]);
                }
            }
        });

        // Check 7000 balance after posting — warn if non-zero
        $balance7000 = $this->get7000Balance();

        if (abs($balance7000) > 0.01) {
            return redirect()->back()->with([
                'success' => 'Opening balances posted.',
                'warning' => "Account 7000 currently has a balance of Rs. " .
                             number_format($balance7000, 2) .
                             ". Post remaining entries to bring it to zero.",
                'balance_7000' => $balance7000,
            ]);
        }

        return redirect()->back()
            ->with('success', 'Opening balances posted. Account 7000 nets to zero. ✓');
    }

    // Returns current net balance of account 7000
    // Called after every opening balance post so frontend can show the running total
    public function status()
    {
        $balance = $this->get7000Balance();

        $entries = DB::table('journal_entries')->where('journal_entries.tenant_id', app('current.tenant')->id)
            ->where('reference_type', 'opening_balance')
            ->orderBy('date')
            ->orderBy('created_at')
            ->select('id', 'date as entry_date', 'description', 'reference', 'party_id')
            ->get();

        return response()->json([
            'balance_7000'    => $balance,
            'is_balanced'     => abs($balance) <= 0.01,
            'entries_count'   => $entries->count(),
            'entries'         => $entries,
        ]);
    }

    private function get7000Balance(): float
    {
        $account = DB::table('accounts')->where('accounts.tenant_id', app('current.tenant')->id)->where('code', '7000')->first();
        if (!$account) return 0.00;

        $row = DB::table('journal_items')->where('journal_items.tenant_id', app('current.tenant')->id)
            ->join('journal_entries',
                'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_items.account_id', $account->id)
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('SUM(debit) as dr, SUM(credit) as cr')
            ->first();

        // 7000 is credit-normal equity — balance = credit - debit
        return round((float)($row->cr ?? 0) - (float)($row->dr ?? 0), 2);
    }
}
