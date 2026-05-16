<?php
namespace App\Console;

use Illuminate\Support\Facades\DB;
use App\Models\Party;

$parties = Party::all();
foreach ($parties as $party) {
    if (!$party) continue;
    $id = $party->id;

    $sales = DB::table('sales')
        ->select([
            'created_at as date',
            DB::raw("CASE WHEN status = 'returned' THEN 0 ELSE (total) END as debit"),  
            DB::raw("CASE WHEN status = 'returned' THEN (total) ELSE 0 END as credit")
        ])
        ->where('party_id', $id)
        ->whereIn('status', ['posted', 'returned'])
        ->get();

    $purchases = DB::table('invoices')
        ->select([
            'created_at as date',
            DB::raw("0 as debit"),
            DB::raw("total_amount as credit")
        ])
        ->where('party_id', $id)
        ->where('type', 'purchase')
        ->get();

    $payments = DB::table('payments')
        ->leftJoin('sales', 'payments.sale_id', '=', 'sales.id')
        ->select([
            'payments.date as date',
            DB::raw("CASE WHEN payments.type = 'out' THEN ABS(payments.amount) ELSE 0 END as debit"),
            DB::raw("CASE WHEN payments.type = 'in' THEN ABS(payments.amount) ELSE 0 END as credit")
        ])
        ->where(function($q) use ($id) {
            $q->where('payments.party_id', $id)
              ->orWhere('sales.party_id', $id);
        })
        ->get();

    $transactions = collect([])->concat($sales)->concat($purchases)->concat($payments)->sortBy('date')->values();

    $obAmount = abs($party->opening_balance ?? 0);
    $isReceivable = $party->opening_balance_type === 'receivable';
    $debit = 0;
    $credit = 0;

    if ($obAmount != 0) {
        if ($isReceivable) { 
            $debit = $obAmount; 
        } else { 
            $credit = $obAmount; 
        }
    }

    $runningBalance = $debit - $credit;

    foreach ($transactions as $t) {
        $runningBalance += $t->debit - $t->credit;
    }

    $party->timestamps = false;
    $party->current_balance = $runningBalance;
    $party->save();
}

echo "Done rebuilding party balances.\n";
