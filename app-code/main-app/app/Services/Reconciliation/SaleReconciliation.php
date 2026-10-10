<?php

namespace App\Services\Reconciliation;

use App\Support\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Read-only reconciliation of one store's money records (sale reliability
 * plan §5). It never writes and never repairs: every difference is reported
 * for a person to decide. Amounts are compared in exact paisa (the
 * database's DECIMAL sums, never floats), with no tolerance.
 *
 * Sale checks that depend on the exact calculation (components, revenue
 * lines, the sale's journal and its payment rows) run on sales posted by it
 * (calculation_version ≥ 2); older sales were posted by the legacy
 * arithmetic and are only checked for having exactly one live journal.
 */
class SaleReconciliation
{
    /** @var array<string, array{severity: string, label: string, items: array}> */
    private array $findings = [];

    private const LABELS = [
        'ledger.unbalanced_entry'     => ['blocker', 'Journal entry whose debits and credits differ'],
        'ledger.trial_balance'        => ['blocker', 'Store trial balance does not balance'],
        'sale.no_journal'             => ['blocker', 'Posted sale with no live journal entry'],
        'sale.duplicate_journal'      => ['blocker', 'Sale posted to the books more than once'],
        'sale.cancelled_not_reversed' => ['blocker', 'Cancelled sale whose journal entry is still live'],
        'sale.components'             => ['blocker', 'Invoice total is not the sum of its parts'],
        'sale.revenue_lines'          => ['blocker', 'Line revenue does not add up to the sale revenue'],
        'sale.journal_revenue'        => ['blocker', 'Revenue posted differs from the sale revenue'],
        'sale.journal_total'          => ['blocker', 'Amount posted as owed/received differs from the invoice total'],
        'sale.payments'               => ['blocker', 'Payment rows written with the sale differ from the money posted'],
        'sale.returned_over'          => ['blocker', 'More returned than was sold on a line'],
        'purchase.returned_over'      => ['blocker', 'More returned to the supplier than was bought on a line'],
        'commerce.completed_without_sale' => ['blocker', 'Completed online order with no sale'],
        'commerce.total_mismatch'     => ['blocker', 'Online order total differs from its sale'],
        'fbr.needs_person'            => ['warning', 'FBR report rejected or given up'],
        'fbr.waiting'                 => ['warning', 'FBR report still waiting after an hour'],
        'till.queue_stuck'            => ['warning', 'Till holding unsent or unresolved sales for over an hour'],
    ];

    public function run(int|string $tenantId, string $from, string $to): array
    {
        $this->findings = [];
        $t = (string) $tenantId;

        $this->ledger($t, $from, $to);
        $this->sales($t, $from, $to);
        $this->returns($t);
        $this->commerce($t, $from, $to);
        $this->outbox($t);
        $this->tills($t);

        $out = [];
        foreach ($this->findings as $key => $items) {
            [$severity, $label] = self::LABELS[$key];
            $out[] = ['check' => $key, 'severity' => $severity, 'label' => $label, 'count' => count($items), 'items' => $items];
        }
        return $out;
    }

    private function add(string $check, array $item): void
    {
        $this->findings[$check][] = $item;
    }

    private static function m($decimal): int
    {
        return Money::parseMinor((string) ($decimal ?? '0'), 'amount', false);
    }

    private function ledger(string $t, string $from, string $to): void
    {
        $rows = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('je.tenant_id', $t)->whereBetween('je.date', [$from, $to])
            ->groupBy('je.id', 'je.reference_type', 'je.reference', 'je.date')
            ->selectRaw('je.id, je.reference_type, je.reference, je.date, SUM(ji.debit) dr, SUM(ji.credit) cr')
            ->get();
        foreach ($rows as $r) {
            if (self::m($r->dr) !== self::m($r->cr)) {
                $this->add('ledger.unbalanced_entry', ['entry' => $r->id, 'type' => $r->reference_type, 'reference' => $r->reference, 'date' => $r->date,
                    'debits' => Money::toString(self::m($r->dr)), 'credits' => Money::toString(self::m($r->cr))]);
            }
        }

        $tb = DB::table('journal_items as ji')->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('je.tenant_id', $t)->where('je.is_reversed', 0)
            ->selectRaw('COALESCE(SUM(ji.debit),0) dr, COALESCE(SUM(ji.credit),0) cr')->first();
        if (self::m($tb->dr) !== self::m($tb->cr)) {
            $this->add('ledger.trial_balance', ['debits' => Money::toString(self::m($tb->dr)), 'credits' => Money::toString(self::m($tb->cr))]);
        }
    }

    private function sales(string $t, string $from, string $to): void
    {
        // Return documents (rows with original_sale_id) are not sales: their
        // own entries are checked by the ledger checks above.
        $sales = DB::table('sales')->where('tenant_id', $t)->whereNull('deleted_at')->whereNull('original_sale_id')
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
            ->get(['id', 'reference_number', 'status', 'calculation_version', 'net_sales', 'total_tax', 'delivery_charge', 'extra_charge_value',
                   'service_charge', 'tip_amount', 'round_off', 'invoice_total', 'created_at', 'posted_at']);
        if ($sales->isEmpty()) {
            return;
        }

        foreach ($sales->chunk(500) as $chunk) {
            $ids = $chunk->pluck('id')->all();
            // A sale's entry is linked by its id (current code) or, in older
            // data and some paths, by its reference number: accept both.
            $refToId = [];
            foreach ($chunk as $c) {
                $refToId[$c->id] = $c->id;
                if ($c->reference_number) {
                    $refToId[$c->reference_number] = $c->id;
                }
            }
            $refs = array_keys($refToId);

            $entries = DB::table('journal_entries')->where('tenant_id', $t)->where('reference_type', 'sale')
                ->whereIn('reference', $refs)->get(['id', 'reference', 'is_reversed'])
                ->groupBy(fn ($e) => $refToId[$e->reference] ?? $e->reference);
            $undone = DB::table('journal_entries')->where('tenant_id', $t)->where('is_reversed', 0)
                ->whereIn('reference_type', ['sale_return', 'reversal'])->whereIn('source_id', $ids)
                ->pluck('source_id')->flip();
            $returnDocs = DB::table('sales')->where('tenant_id', $t)->whereIn('original_sale_id', $ids)->pluck('original_sale_id')->flip();

            $lines = DB::table('journal_items as ji')->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
                ->join('accounts as a', 'a.id', '=', 'ji.account_id')
                ->where('je.tenant_id', $t)->where('je.reference_type', 'sale')->where('je.is_reversed', 0)->whereIn('je.reference', $refs)
                ->groupBy('je.reference', 'a.code')
                ->selectRaw('je.reference, a.code, SUM(ji.debit) dr, SUM(ji.credit) cr')
                ->get()->groupBy(fn ($l) => $refToId[$l->reference] ?? $l->reference);

            $revenueLines = DB::table('sale_items')->whereIn('sale_id', $ids)->whereNull('deleted_at')
                ->groupBy('sale_id')->selectRaw('sale_id, SUM(revenue_amount) rev, COUNT(revenue_amount) n, COUNT(*) total')->get()->keyBy('sale_id');

            // Payment rows written with the sale (within minutes of it); later
            // collections against the receivable are other documents.
            $payments = DB::table('payments as p')->join('sales as s', 's.id', '=', 'p.sale_id')
                ->where('p.tenant_id', $t)->whereIn('p.sale_id', $ids)
                ->where('p.type', 'in')->where('p.method', '!=', 'credit')
                ->where(fn ($q) => $q->whereNull('p.reference')->orWhere('p.reference', 'not like', 'REVERSAL%'))
                ->whereRaw('p.created_at <= DATE_ADD(s.created_at, INTERVAL 5 MINUTE)')
                ->groupBy('p.sale_id')->selectRaw('p.sale_id, SUM(p.amount) amt')->get()->keyBy('sale_id');
            $withRows = DB::table('payments')->where('tenant_id', $t)->whereIn('sale_id', $ids)->distinct()->pluck('sale_id')->flip();

            foreach ($chunk as $s) {
                $ref = ['sale' => $s->id, 'reference' => $s->reference_number];
                $own = $entries->get($s->id, collect());
                $live = $own->where('is_reversed', 0)->count();

                if ($s->status === 'cancelled') {
                    // A full cancellation marks the sale entry reversed. A sale
                    // that was partly returned first is cancelled by posting the
                    // remainder as a return instead, so only a live entry with
                    // nothing at all undoing it is a difference.
                    if ($live > 0 && ! $undone->has($s->id) && ! $returnDocs->has($s->id)) {
                        $this->add('sale.cancelled_not_reversed', $ref);
                    }
                    continue;
                }
                if ($s->status !== 'posted' && $s->status !== 'returned') {
                    continue; // drafts, pending approval: nothing posted yet
                }
                if ($live === 0 && $s->status === 'returned') {
                    continue; // a till return document (posted as a sale_return entry)
                }
                if ($live === 0) {
                    $this->add('sale.no_journal', $ref);
                    continue;
                }
                if ($live > 1) {
                    $this->add('sale.duplicate_journal', $ref + ['entries' => $live]);
                }

                if ((int) $s->calculation_version < 2) {
                    continue;
                }

                $invoice = self::m($s->invoice_total);
                $net = self::m($s->net_sales);
                $parts = $net + self::m($s->total_tax) + self::m($s->delivery_charge) + self::m($s->extra_charge_value)
                    + self::m($s->service_charge) + self::m($s->tip_amount) + self::m($s->round_off);
                if ($parts !== $invoice) {
                    $this->add('sale.components', $ref + ['invoice_total' => Money::toString($invoice), 'parts' => Money::toString($parts)]);
                }

                $rl = $revenueLines->get($s->id);
                if ($rl && (int) $rl->n === (int) $rl->total && self::m($rl->rev) !== $net) {
                    $this->add('sale.revenue_lines', $ref + ['net_sales' => Money::toString($net), 'lines' => Money::toString(self::m($rl->rev))]);
                }

                $byCode = [];
                foreach ($lines->get($s->id, collect()) as $l) {
                    $byCode[$l->code] = [self::m($l->dr), self::m($l->cr)];
                }
                $rev = ($byCode['4000'][1] ?? 0) - ($byCode['4000'][0] ?? 0);
                if ($rev !== $net) {
                    $this->add('sale.journal_revenue', $ref + ['net_sales' => Money::toString($net), 'posted' => Money::toString($rev)]);
                }
                // What the customer paid or owes for this invoice: every debit
                // except cost of goods and round-off expense, less any advance
                // kept on account (2050 at the till, 2060 in the engine).
                $owed = 0;
                $money = 0;
                foreach ($byCode as $code => [$dr, $cr]) {
                    if (in_array((string) $code, ['5000', '5900'], true)) {
                        continue;
                    }
                    $owed += $dr;
                    if ((string) $code !== '1200') {
                        $money += $dr;
                    }
                }
                $owed -= ($byCode['2050'][1] ?? 0) + ($byCode['2060'][1] ?? 0); // advance kept on account
                if ($owed !== $invoice) {
                    $this->add('sale.journal_total', $ref + ['invoice_total' => Money::toString($invoice), 'posted' => Money::toString($owed)]);
                }

                // Only sales that write payment rows (the till does, one per
                // tender line including credit; the invoice engine keeps the
                // ledger as the only record and writes none).
                $paid = self::m($payments->get($s->id)->amt ?? '0');
                if ($withRows->has($s->id) && $paid !== $money) {
                    $this->add('sale.payments', $ref + ['payment_rows' => Money::toString($paid), 'money_posted' => Money::toString($money)]);
                }
            }
        }
    }

    private function returns(string $t): void
    {
        foreach (DB::table('sale_items as si')->join('sales as s', 's.id', '=', 'si.sale_id')->where('s.tenant_id', $t)
            ->whereNull('si.deleted_at')->whereNull('s.original_sale_id')->where('si.quantity', '>', 0)
            ->whereRaw('COALESCE(si.returned_quantity, 0) > si.quantity + COALESCE(si.free_quantity, 0) + 0.00005')
            ->limit(500)->get(['si.id', 's.reference_number', 'si.quantity', 'si.returned_quantity']) as $r) {
            $this->add('sale.returned_over', ['line' => $r->id, 'reference' => $r->reference_number, 'sold' => $r->quantity, 'returned' => $r->returned_quantity]);
        }
        if (Schema::hasColumn('purchase_items', 'returned_qty')) {
            foreach (DB::table('purchase_items as pi')->join('purchases as p', 'p.id', '=', 'pi.purchase_id')->where('pi.tenant_id', $t)
                ->whereRaw('pi.returned_qty > pi.qty + 0.00005')->limit(500)->get(['pi.id', 'p.invoice_number', 'pi.qty', 'pi.returned_qty']) as $r) {
                $this->add('purchase.returned_over', ['line' => $r->id, 'bill' => $r->invoice_number, 'bought' => $r->qty, 'returned' => $r->returned_qty]);
            }
        }
    }

    private function commerce(string $t, string $from, string $to): void
    {
        if (! Schema::hasTable('commerce_orders')) {
            return;
        }
        $orders = DB::table('commerce_orders as o')->leftJoin('sales as s', 's.id', '=', 'o.sale_id')
            ->where('o.tenant_id', $t)->where('o.status', 'completed')
            ->whereBetween(DB::raw('DATE(COALESCE(o.completed_at, o.updated_at))'), [$from, $to])
            ->get(['o.id', 'o.public_number', 'o.total', 'o.sale_id', 's.id as sid', 's.invoice_total', 's.tenant_id as stid']);
        foreach ($orders as $o) {
            $ref = ['order' => $o->id, 'number' => $o->public_number];
            if (! $o->sale_id || ! $o->sid || (string) $o->stid !== $t) {
                $this->add('commerce.completed_without_sale', $ref);
            } elseif (self::m($o->total) !== self::m($o->invoice_total)) {
                $this->add('commerce.total_mismatch', $ref + ['order_total' => Money::toString(self::m($o->total)), 'sale_total' => Money::toString(self::m($o->invoice_total))]);
            }
        }
    }

    private function outbox(string $t): void
    {
        if (! Schema::hasTable('fbr_outbox')) {
            return;
        }
        foreach (DB::table('fbr_outbox')->where('tenant_id', $t)->whereIn('status', ['rejected', 'dead'])->limit(500)->get() as $r) {
            $this->add('fbr.needs_person', ['sale' => $r->sale_id, 'status' => $r->status, 'attempts' => (int) $r->attempts, 'error' => $r->last_error]);
        }
        foreach (DB::table('fbr_outbox')->where('tenant_id', $t)->whereIn('status', ['pending', 'failed', 'sending'])
            ->where('created_at', '<', now()->subHour())->limit(500)->get() as $r) {
            $this->add('fbr.waiting', ['sale' => $r->sale_id, 'status' => $r->status, 'attempts' => (int) $r->attempts, 'next_attempt_at' => $r->next_attempt_at]);
        }
    }

    private function tills(string $t): void
    {
        if (! Schema::hasTable('pos_queue_telemetry')) {
            return;
        }
        foreach (DB::table('pos_queue_telemetry')->where('tenant_id', $t)->where('unresolved', '>', 0)
            ->where('oldest_unresolved_at', '<', now()->subHour())->get() as $r) {
            $this->add('till.queue_stuck', ['device' => $r->device_id, 'unresolved' => (int) $r->unresolved, 'counts' => json_decode($r->counts, true),
                'oldest_since' => (string) $r->oldest_unresolved_at, 'last_report' => (string) $r->reported_at]);
        }
    }
}
