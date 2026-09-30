<?php

namespace App\Http\Controllers;

use App\Models\BankAccount;
use App\Models\ChequeBook;
use App\Models\ChequeLeaf;
use App\Models\Party;
use App\Models\ReceivedCheque;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChequeReportController extends Controller
{
    /**
     * Outgoing Cheque Register report with CSV export.
     */
    public function outgoingRegister(Request $request)
    {
        $tenant = app('current.tenant');
        $query = ChequeLeaf::where('tenant_id', $tenant->id)
            ->whereIn('status', [
                ChequeLeaf::STATUS_ISSUED,
                ChequeLeaf::STATUS_CLEARED,
                ChequeLeaf::STATUS_BOUNCED,
                ChequeLeaf::STATUS_STOPPED,
                ChequeLeaf::STATUS_VOID,
                ChequeLeaf::STATUS_RESERVED,
            ])
            ->with(['bankAccount', 'chequeBook', 'party', 'payment']);

        if ($request->filled('bank_account_id')) {
            $query->where('bank_account_id', $request->bank_account_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('from_date') && $request->filled('to_date')) {
            $query->whereBetween('cheque_date', [$request->from_date, $request->to_date]);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('display_serial_number', 'like', "%{$search}%")
                  ->orWhere('cheque_number', 'like', "%{$search}%")
                  ->orWhereHas('party', fn ($p) => $p->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->query('export') === 'csv') {
            return $this->exportOutgoingCsv($query->orderBy('cheque_date', 'desc')->get());
        }

        $leaves = $query->orderBy('cheque_date', 'desc')->paginate(50)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($leaves);
        }

        $bankAccounts = BankAccount::where('tenant_id', $tenant->id)->orderBy('name')->get();

        return Inertia::render('ChequeBooks/Reports/OutgoingRegister', [
            'leaves'       => $leaves,
            'bankAccounts' => $bankAccounts,
            'filters'      => $request->only(['bank_account_id', 'status', 'from_date', 'to_date', 'search']),
        ]);
    }

    /**
     * Incoming Cheque Register report with CSV export.
     */
    public function incomingRegister(Request $request)
    {
        $tenant = app('current.tenant');
        $query = ReceivedCheque::where('tenant_id', $tenant->id)
            ->with(['party', 'depositBankAccount', 'payment']);

        if ($request->filled('deposit_bank_account_id')) {
            $query->where('deposit_bank_account_id', $request->deposit_bank_account_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('party_id')) {
            $query->where('party_id', $request->party_id);
        }

        if ($request->filled('from_date') && $request->filled('to_date')) {
            $query->whereBetween('cheque_date', [$request->from_date, $request->to_date]);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('cheque_number', 'like', "%{$search}%")
                  ->orWhere('bank_name', 'like', "%{$search}%")
                  ->orWhereHas('party', fn ($p) => $p->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->query('export') === 'csv') {
            return $this->exportIncomingCsv($query->orderBy('cheque_date', 'desc')->get());
        }

        $cheques = $query->orderBy('cheque_date', 'desc')->paginate(50)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($cheques);
        }

        $bankAccounts = BankAccount::where('tenant_id', $tenant->id)->orderBy('name')->get();
        $parties = Party::where('tenant_id', $tenant->id)->where('type', 'customer')->orderBy('name')->get();

        return Inertia::render('ChequeBooks/Reports/IncomingRegister', [
            'cheques'      => $cheques,
            'bankAccounts' => $bankAccounts,
            'parties'      => $parties,
            'filters'      => $request->only(['deposit_bank_account_id', 'status', 'party_id', 'from_date', 'to_date', 'search']),
        ]);
    }

    /**
     * Chequebook Utilization Report.
     */
    public function utilization(Request $request)
    {
        $tenant = app('current.tenant');
        $books = ChequeBook::where('tenant_id', $tenant->id)
            ->with('bankAccount')
            ->withCount([
                'leaves as total_leaves_count',
                'leaves as available_leaves_count' => fn ($q) => $q->where('status', ChequeLeaf::STATUS_AVAILABLE),
                'leaves as reserved_leaves_count'  => fn ($q) => $q->where('status', ChequeLeaf::STATUS_RESERVED),
                'leaves as issued_leaves_count'    => fn ($q) => $q->where('status', ChequeLeaf::STATUS_ISSUED),
                'leaves as cleared_leaves_count'   => fn ($q) => $q->where('status', ChequeLeaf::STATUS_CLEARED),
                'leaves as bounced_leaves_count'   => fn ($q) => $q->where('status', ChequeLeaf::STATUS_BOUNCED),
                'leaves as stopped_leaves_count'   => fn ($q) => $q->where('status', ChequeLeaf::STATUS_STOPPED),
                'leaves as void_leaves_count'      => fn ($q) => $q->where('status', ChequeLeaf::STATUS_VOID),
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($book) {
                $used = $book->total_leaves_count - $book->available_leaves_count;
                $utilizationPct = $book->total_leaves_count > 0 ? round(($used / $book->total_leaves_count) * 100, 1) : 0;
                $book->used_leaves_count = $used;
                $book->utilization_percentage = $utilizationPct;
                return $book;
            });

        if ($request->wantsJson()) {
            return response()->json($books);
        }

        return Inertia::render('ChequeBooks/Reports/Utilization', [
            'books' => $books,
        ]);
    }

    /**
     * Post-dated Cheque Report.
     */
    public function postDated(Request $request)
    {
        $tenant = app('current.tenant');
        $today = now()->toDateString();

        $outgoing = ChequeLeaf::where('tenant_id', $tenant->id)
            ->where('cheque_date', '>', $today)
            ->whereIn('status', [ChequeLeaf::STATUS_ISSUED, ChequeLeaf::STATUS_RESERVED])
            ->with(['bankAccount', 'party'])
            ->orderBy('cheque_date', 'asc')
            ->get();

        $incoming = ReceivedCheque::where('tenant_id', $tenant->id)
            ->where('cheque_date', '>', $today)
            ->whereIn('status', [ReceivedCheque::STATUS_RECEIVED, ReceivedCheque::STATUS_DEPOSITED])
            ->with(['party', 'depositBankAccount'])
            ->orderBy('cheque_date', 'asc')
            ->get();

        if ($request->wantsJson()) {
            return response()->json([
                'outgoing' => $outgoing,
                'incoming' => $incoming,
            ]);
        }

        return Inertia::render('ChequeBooks/Reports/PostDated', [
            'outgoing' => $outgoing,
            'incoming' => $incoming,
        ]);
    }

    private function exportOutgoingCsv($leaves): StreamedResponse
    {
        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="outgoing_cheque_register_' . now()->format('Y-m-d') . '.csv"',
        ];

        return response()->stream(function () use ($leaves) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Cheque Number', 'Bank Account', 'Payee / Party', 'Cheque Date', 'Amount', 'Status', 'Issue Date', 'Clear Date', 'Status Reason']);

            foreach ($leaves as $leaf) {
                fputcsv($handle, [
                    $leaf->display_serial_number,
                    $leaf->bankAccount?->name ?? '',
                    $leaf->party?->name ?? '',
                    $leaf->cheque_date ?? '',
                    $leaf->amount ?? '0.00',
                    $leaf->status,
                    $leaf->issue_date ?? '',
                    $leaf->clear_date ?? '',
                    $leaf->status_reason ?? '',
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    private function exportIncomingCsv($cheques): StreamedResponse
    {
        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="incoming_cheque_register_' . now()->format('Y-m-d') . '.csv"',
        ];

        return response()->stream(function () use ($cheques) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Cheque Number', 'Bank Name', 'Branch', 'Customer / Party', 'Cheque Date', 'Amount', 'Status', 'Deposit Bank', 'Deposit Date', 'Clear Date', 'Status Reason']);

            foreach ($cheques as $cheque) {
                fputcsv($handle, [
                    $cheque->cheque_number,
                    $cheque->bank_name,
                    $cheque->branch ?? '',
                    $cheque->party?->name ?? '',
                    $cheque->cheque_date,
                    $cheque->amount,
                    $cheque->status,
                    $cheque->depositBankAccount?->name ?? '',
                    $cheque->deposit_date ?? '',
                    $cheque->clear_date ?? '',
                    $cheque->status_reason ?? '',
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
