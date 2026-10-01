<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Engines\AccountingService;
use App\Models\ApprovalDocument;
use App\Models\TenantUser;
use App\Services\Approval\ApprovalExecutionEngine;
use App\Services\Approval\ApprovalPolicyResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class FundController extends Controller
{
    public function __construct(private AccountingService $accounting) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type'             => ['required', 'in:drawing,injection'],
            'description'      => ['required', 'string', 'max:500'],
            'transaction_date' => ['required', 'date', 'before_or_equal:today'],
            'amount'           => ['required', 'numeric', 'min:0.01'],
            'payment_method'   => ['required', 'in:cash,bank'],
            'passcode'         => ['required', 'string', 'size:6'],
        ]);

        // Direction gate: route middleware uses OR semantics, so enforce per action type.
        $user      = auth()->user();
        $isDrawing = $validated['type'] === 'drawing';
        if ($isDrawing && !$user->hasPermission('finance.owner_drawings')) {
            return redirect()->back()->with('error', 'You do not have permission to record owner drawings.');
        }
        if (!$isDrawing && !$user->hasPermission('finance.capital_add')) {
            return redirect()->back()->with('error', 'You do not have permission to record capital injections.');
        }

        $tenant      = app('current.tenant');
        $docType     = $isDrawing ? ApprovalDocument::TYPE_OWNER_DRAWINGS : ApprovalDocument::TYPE_CAPITAL_INJECTION;
        $description = ($isDrawing ? 'Owner drawing' : 'Capital injection') . ' — ' . $validated['description'];

        // ── Approval interception ──────────────────────────────────────────────
        $policy = resolve(ApprovalPolicyResolver::class)->resolve(
            tenant:       $tenant,
            user:         $user,
            documentType: $docType,
            amount:       (float) $validated['amount'],
        );
        if ($policy['requires_approval']) {
            $doc = resolve(ApprovalExecutionEngine::class)->submit(
                tenant:         $tenant,
                maker:          $user,
                documentType:   $docType,
                payload:        array_diff_key($validated, ['passcode' => '']),
                amount:         (float) $validated['amount'],
                description:    $description,
                idempotencyKey: $request->header('Idempotency-Key'),
            );
            return redirect()->back()->with('info',
                ($isDrawing ? 'Drawing' : 'Capital injection') .
                ' submitted for approval (ref: ' . $doc->document_number . ').'
            );
        }

        // ── Direct path: verify PIN then post ─────────────────────────────────
        $membership = TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', Auth::id())
            ->first();
        if (!$membership || !$membership->security_pin || !Hash::check($request->input('passcode', ''), $membership->security_pin)) {
            return redirect()->back()->with('error', 'Incorrect security PIN. Action blocked.');
        }

        $cashAccount = $validated['payment_method'] === 'bank' ? '1010' : '1000';

        // B14 Drawing:   DR 3000 (Drawings) / CR 1000/1010 (Cash/Bank)
        // B15 Injection: DR 1000/1010 (Cash/Bank) / CR 3000 (Owner's Capital)
        $lines = $isDrawing
            ? [
                ['account_code' => '3000',       'debit'  => $validated['amount'], 'credit' => 0],
                ['account_code' => $cashAccount, 'debit'  => 0, 'credit' => $validated['amount']],
              ]
            : [
                ['account_code' => $cashAccount, 'debit'  => $validated['amount'], 'credit' => 0],
                ['account_code' => '3000',       'debit'  => 0, 'credit' => $validated['amount']],
              ];

        $this->accounting->createEntry([
            'date'           => $validated['transaction_date'],
            'reference_type' => $isDrawing ? 'owner_drawing' : 'capital_injection',
            'reference'      => Str::uuid()->toString(),
            'description'    => $description,
        ], $lines);

        return redirect()->back()->with('success',
            $isDrawing ? 'Drawing posted.' : 'Capital injection posted.'
        );
    }
}
