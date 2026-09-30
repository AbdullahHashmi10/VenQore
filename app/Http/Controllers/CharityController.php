<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Setting;
use App\Models\ApprovalDocument;
use App\Services\Approval\ApprovalExecutionEngine;
use App\Services\Approval\ApprovalPolicyResolver;
use App\Services\ExpensePostingService;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

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

    public function add(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1'
        ]);

        // Find or create charity expense category (idempotent — safe before any branch)
        $category = ExpenseCategory::firstOrCreate(
            ['name' => 'Charity/Donations'],
            [
                'group'      => 'Miscellaneous',
                'icon'       => 'HeartHandshake',
                'color'      => 'rose',
                'sort_order' => 50
            ]
        );

        $tenant = app('current.tenant');
        $user   = Auth::user();
        $amount = (float) $validated['amount'];

        // ── Approval interception — treat charity as an operating expense ──
        $policy = resolve(ApprovalPolicyResolver::class)->resolve(
            tenant:       $tenant,
            user:         $user,
            documentType: ApprovalDocument::TYPE_OPERATING_EXPENSE,
            amount:       $amount,
        );
        if ($policy['requires_approval']) {
            $doc = resolve(ApprovalExecutionEngine::class)->submit(
                tenant:       $tenant,
                maker:        $user,
                documentType: ApprovalDocument::TYPE_OPERATING_EXPENSE,
                payload:      [
                    'expense_category_id' => $category->id,
                    'amount'              => $amount,
                    'payment_method'      => 'cash',
                    'expense_date'        => now()->toDateString(),
                    'description'         => 'Charity Donation',
                    'notes'               => 'Charity Donation',
                ],
                amount:       $amount,
                description:  'Charity donation — Rs ' . number_format($amount),
                idempotencyKey: $request->header('Idempotency-Key'),
            );
            return response()->json([
                'success'     => false,
                'pending'     => true,
                'message'     => 'Charity donation submitted for approval (ref: ' . $doc->document_number . ').',
                'today_total' => Expense::whereDate('date', Carbon::today())
                    ->where('expense_category_id', $category->id)->sum('amount'),
            ]);
        }
        // ── Direct path: post atomically through ExpensePostingService ────────

        $result = resolve(ExpensePostingService::class)->post($tenant, [
            'expense_category_id' => $category->id,
            'amount'              => $amount,
            'payment_method'      => 'cash',
            'expense_date'        => now()->toDateString(),
            'description'         => 'Charity Donation',
            'notes'               => 'Charity Donation',
        ], $user);

        $todayTotal = Expense::whereDate('date', Carbon::today())
            ->where('expense_category_id', $category->id)
            ->sum('amount');

        return response()->json([
            'success'     => true,
            'message'     => 'Charity added: Rs ' . number_format($validated['amount']),
            'today_total' => $todayTotal,
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
