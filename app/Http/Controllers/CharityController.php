<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Setting;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CharityController extends Controller
{
    /**
     * Get charity stats for header
     */
    public function stats()
    {
        $todayTotal = Expense::whereDate('date', Carbon::today())
            ->whereHas('expenseCategory', function ($q) {
                $q->where('name', 'Charity/Donations');
            })
            ->sum('amount');

        $monthTotal = Expense::whereMonth('date', Carbon::now()->month)
            ->whereYear('date', Carbon::now()->year)
            ->whereHas('expenseCategory', function ($q) {
                $q->where('name', 'Charity/Donations');
            })
            ->sum('amount');

        return response()->json([
            'today' => $todayTotal,
            'month' => $monthTotal,
            'default_amount' => Setting::where('key', 'charity_default_amount')->value('value') ?? 10,
            'enabled' => Setting::where('key', 'charity_enabled')->value('value') === '1'
        ]);
    }

    /**
     * Quick add charity
     */
    public function add(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1'
        ]);

        // Find or create charity category
        $category = ExpenseCategory::firstOrCreate(
            ['name' => 'Charity/Donations'],
            [
                'group' => 'Miscellaneous',
                'icon' => 'HeartHandshake',
                'color' => 'rose',
                'sort_order' => 50
            ]
        );

        // Create expense
        $expense = Expense::create([
            'date' => now()->toDateString(),
            'expense_category_id' => $category->id,
            'category' => 'Charity/Donations',
            'amount' => $validated['amount'],
            'payment_method' => 'cash',
            'description' => 'Charity donation'
        ]);

        // Deduct from cash
        $cashAccount = \App\Models\Account::where('code', '1000')->first();
        if ($cashAccount) {
            $cashAccount->decrement('balance', $validated['amount']);
        }

        // Get updated stats
        $todayTotal = Expense::whereDate('date', Carbon::today())
            ->where('expense_category_id', $category->id)
            ->sum('amount');

        return response()->json([
            'success' => true,
            'message' => 'Charity added: Rs ' . number_format($validated['amount']),
            'today_total' => $todayTotal
        ]);
    }

    /**
     * Update default amount
     */
    public function updateDefault(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1'
        ]);

        Setting::updateOrCreate(
            ['key' => 'charity_default_amount'],
            ['value' => $validated['amount']]
        );

        return response()->json([
            'success' => true,
            'new_default' => $validated['amount']
        ]);
    }
}
