<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = app('current.tenant')->id;
        
        // Build unified transactions from multiple sources
        $transactions = collect();

        // 1. Sales (from sales table)
        if (DB::getSchemaBuilder()->hasTable('sales')) {
            $sales = DB::table('sales')
                ->where('sales.tenant_id', $tenantId)
                ->leftJoin('parties', 'sales.party_id', '=', 'parties.id')
                ->leftJoin('payments', 'sales.id', '=', 'payments.sale_id')
                ->select([
                    'sales.id',
                    'sales.created_at as date',
                    DB::raw("CASE WHEN sales.status = 'returned' THEN 'return' ELSE 'sale' END as type"),
                    'sales.reference_number as reference',
                    'sales.notes as description',
                    'sales.party_id',
                    DB::raw('parties.name as party_name'),
                    DB::raw('parties.phone as party_phone'),
                    'sales.subtotal',
                    'sales.tax',
                    'sales.discount',
                    'sales.total as amount',
                    'sales.round_off',
                    'sales.payment_status',
                    'sales.payment_method',
                    DB::raw('COALESCE(SUM(payments.amount), 0) as amount_paid'),
                    DB::raw("(SELECT COUNT(*) FROM sale_items WHERE sale_items.sale_id = sales.id) as item_count"),
                ])
                ->groupBy(
                    'sales.id',
                    'sales.created_at',
                    'sales.reference_number',
                    'sales.notes',
                    'sales.party_id',
                    'parties.name',
                    'parties.phone',
                    'sales.subtotal',
                    'sales.tax',
                    'sales.discount',
                    'sales.total',
                    'sales.round_off',
                    'sales.payment_status',
                    'sales.payment_method'
                )
                ->get()
                ->map(function ($t) {
                    $t->party = $t->party_name ? ['name' => $t->party_name, 'phone' => $t->party_phone] : null;
                    $t->balance_due = max(0, $t->amount - $t->amount_paid);
                    $t->debit = $t->amount;
                    $t->credit = 0;
                    return $t;
                });

            $transactions = $transactions->merge($sales);
        }

        // 2. Fallback Sales (from invoices table)
        if ($transactions->isEmpty() || !DB::getSchemaBuilder()->hasTable('sales')) {
            $invoiceSales = DB::table('invoices')
                ->where('invoices.tenant_id', $tenantId)
                ->leftJoin('parties', 'invoices.party_id', '=', 'parties.id')
                ->where('invoices.type', 'sale')
                ->select([
                    'invoices.id',
                    'invoices.created_at as date',
                    DB::raw("'sale' as type"),
                    'invoices.invoice_number as reference',
                    DB::raw('NULL as description'),
                    'invoices.party_id',
                    'parties.name as party_name',
                    DB::raw('NULL as party_phone'),
                    'invoices.subtotal',
                    'invoices.tax_amount as tax',
                    'invoices.discount_amount as discount',
                    'invoices.total_amount as amount',
                    DB::raw('0 as round_off'),
                    'invoices.status as payment_status',
                    DB::raw("NULL as payment_method"),
                    'invoices.paid_amount as amount_paid',
                    DB::raw('0 as item_count'),
                ])
                ->get()
                ->map(function ($t) {
                    $t->party = $t->party_name ? ['name' => $t->party_name, 'phone' => null] : null;
                    $t->balance_due = max(0, ($t->amount ?? 0) - ($t->amount_paid ?? 0));
                    $t->debit = $t->amount;
                    $t->credit = 0;
                    return $t;
                });

            $transactions = $transactions->merge($invoiceSales);
        }

        // 3. Purchases (from invoices table)
        $purchases = DB::table('invoices')
            ->where('invoices.tenant_id', $tenantId)
            ->leftJoin('parties', 'invoices.party_id', '=', 'parties.id')
            ->where('invoices.type', 'purchase')
            ->select([
                'invoices.id',
                'invoices.created_at as date',
                DB::raw("'purchase' as type"),
                'invoices.invoice_number as reference',
                DB::raw('NULL as description'),
                'invoices.party_id',
                'parties.name as party_name',
                'parties.phone as party_phone',
                'invoices.subtotal',
                'invoices.tax_amount as tax',
                'invoices.discount_amount as discount',
                'invoices.total_amount as amount',
                DB::raw('0 as round_off'),
                'invoices.status as payment_status',
                DB::raw("NULL as payment_method"),
                'invoices.paid_amount as amount_paid',
                DB::raw('0 as item_count'),
            ])
            ->get()
            ->map(function ($t) {
                $t->party = $t->party_name ? ['name' => $t->party_name, 'phone' => $t->party_phone] : null;
                $t->balance_due = max(0, ($t->amount ?? 0) - ($t->amount_paid ?? 0));
                $t->debit = 0;
                $t->credit = $t->amount;
                return $t;
            });

        $transactions = $transactions->merge($purchases);

        // 4. Expenses
        if (DB::getSchemaBuilder()->hasTable('expenses')) {
            $expenses = DB::table('expenses')
                ->where('tenant_id', $tenantId)
                ->select([
                    'id',
                    'date',
                    DB::raw("'expense' as type"),
                    'reference',
                    'description',
                    DB::raw('NULL as party_id'),
                    DB::raw('NULL as party_name'),
                    DB::raw('NULL as party_phone'),
                    DB::raw('0 as subtotal'),
                    DB::raw('0 as tax'),
                    DB::raw('0 as discount'),
                    'amount',
                    DB::raw('0 as round_off'),
                    DB::raw("'paid' as payment_status"),
                    'payment_method',
                    'amount as amount_paid',
                    DB::raw('0 as item_count'),
                ])
                ->get()
                ->map(function ($t) {
                    $t->party = null;
                    $t->balance_due = 0;
                    $t->debit = $t->amount;
                    $t->credit = 0;
                    return $t;
                });

            $transactions = $transactions->merge($expenses);
        }

        // 5. Payments
        if (DB::getSchemaBuilder()->hasTable('payments')) {
            $payments = DB::table('payments')
                ->where('payments.tenant_id', $tenantId)
                ->leftJoin('parties', 'payments.party_id', '=', 'parties.id')
                ->select([
                    'payments.id',
                    'payments.date',
                    DB::raw("CASE WHEN payments.type = 'in' THEN 'payment_in' ELSE 'payment_out' END as type"),
                    'payments.reference',
                    'payments.notes as description',
                    'payments.party_id',
                    'parties.name as party_name',
                    'parties.phone as party_phone',
                    DB::raw('0 as subtotal'),
                    DB::raw('0 as tax'),
                    DB::raw('0 as discount'),
                    'payments.amount',
                    DB::raw('0 as round_off'),
                    DB::raw("'completed' as payment_status"),
                    'payments.method as payment_method',
                    'payments.amount as amount_paid',
                    DB::raw('0 as item_count'),
                ])
                ->get()
                ->map(function ($t) {
                    $t->party = $t->party_name ? ['name' => $t->party_name, 'phone' => $t->party_phone] : null;
                    $t->balance_due = 0;
                    $t->debit = $t->type == 'payment_out' ? $t->amount : 0;
                    $t->credit = $t->type == 'payment_in' ? $t->amount : 0;
                    return $t;
                });

            $transactions = $transactions->merge($payments);
        }

        // Sort by date descending
        $paginatedTransactions = $transactions->sortByDesc('date')->values();
        
        // Manual pagination for the combined collection
        $page = \Illuminate\Pagination\Paginator::resolveCurrentPage() ?: 1;
        $perPage = 200;
        $total = $paginatedTransactions->count();
        $items = $paginatedTransactions->forPage($page, $perPage)->values();

        $paginator = new \Illuminate\Pagination\LengthAwarePaginator($items, $total, $perPage, $page, [
            'path' => \Illuminate\Pagination\Paginator::resolveCurrentPath(),
            'query' => $request->query(),
        ]);

        if ($request->wantsJson()) {
            return response()->json($paginator);
        }

        // Calculate stats (on full collection)
        $stats = [
            'total_debit' => $transactions->sum('debit'),
            'total_credit' => $transactions->sum('credit'),
            'net_flow' => $transactions->sum('credit') - $transactions->sum('debit'),
            'count' => $total,
            'total_tax' => $transactions->sum('tax'),
            'total_discount' => $transactions->sum('discount'),
            'total_balance_due' => $transactions->sum('balance_due'),
        ];

        return Inertia::render('Transactions/TransactionsList', [
            'transactions' => $paginator,
            'stats' => $stats
        ]);
    }
}
