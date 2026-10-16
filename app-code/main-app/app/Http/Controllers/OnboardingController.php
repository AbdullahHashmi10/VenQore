<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    /**
     * Update the current onboarding step for the active store.
     */
    public function updateStep(Request $request)
    {
        $request->validate([
            'step' => 'nullable|string|max:50',
        ]);

        if (app()->bound('current.tenant')) {
            /** @var \App\Models\Tenant $tenant */
            $tenant = app('current.tenant');
            $tenant->onboarding_step = $request->step;
            
            $done = $tenant->onboarding_steps_done ?? [];
            if ($request->step === 'invoice_congratulations') {
                if (!in_array('invoice', $done)) $done[] = 'invoice';
                if (!in_array('sale', $done)) $done[] = 'sale';
                $tenant->onboarding_steps_done = $done;
            } elseif ($request->step === 'pos_congratulations') {
                if (!in_array('pos', $done)) $done[] = 'pos';
                if (!in_array('sale', $done)) $done[] = 'sale';
                $tenant->onboarding_steps_done = $done;
            } elseif ($request->step === 'purchase_congratulations') {
                if (!in_array('purchase', $done)) $done[] = 'purchase';
                $tenant->onboarding_steps_done = $done;
            } elseif ($request->step === 'expense_congratulations') {
                if (!in_array('expense', $done)) $done[] = 'expense';
                $tenant->onboarding_steps_done = $done;
            } elseif ($request->step === 'congratulations') {
                if (!in_array('inventory', $done)) $done[] = 'inventory';
                $tenant->onboarding_steps_done = $done;
            }

            if ($request->completed_step) {
                $done = $tenant->onboarding_steps_done ?? [];
                if (!in_array($request->completed_step, $done)) {
                    $done[] = $request->completed_step;
                    $tenant->onboarding_steps_done = $done;
                }
            }

            if ($request->step === 'completed' || $request->step === 'skipped' || $tenant->is_demo) {
                $tenant->onboarding_completed = true;
                $tenant->onboarding_step = 'completed';
            }
            $tenant->save();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'onboarding_step' => $tenant->onboarding_step,
                ]);
            }

            return back()->with('success', 'Onboarding step updated.');
        }

        if ($request->wantsJson()) {
            return response()->json(['error' => 'No store context found.'], 400);
        }

        return redirect()->route('hub')->with('error', 'No store context found.');
    }
}
