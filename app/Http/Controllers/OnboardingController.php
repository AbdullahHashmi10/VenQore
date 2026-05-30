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
