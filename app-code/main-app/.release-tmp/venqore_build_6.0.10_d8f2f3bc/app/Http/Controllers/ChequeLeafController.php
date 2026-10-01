<?php

namespace App\Http\Controllers;

use App\Models\ChequeLeaf;
use App\Services\Cheque\ChequeLifecycleService;
use Illuminate\Http\Request;

class ChequeLeafController extends Controller
{
    public function __construct(
        private ChequeLifecycleService $lifecycleService
    ) {}

    /**
     * Mark an unused/available cheque leaf as void (spoiled/damaged).
     */
    public function voidUnused(Request $request, string $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $tenant = app('current.tenant');

        try {
            $leaf = $this->lifecycleService->voidChequeLeaf(
                tenant: $tenant,
                leafId: $id,
                reason: $validated['reason'],
                user: $request->user()
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "Cheque leaf {$leaf->display_serial_number} marked as void.",
                    'leaf'    => $leaf,
                ]);
            }

            return back()->with('success', "Cheque leaf {$leaf->display_serial_number} marked as void.");
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Stop payment on an issued cheque leaf and reverse its financial posting.
     */
    public function stopIssued(Request $request, string $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $tenant = app('current.tenant');

        try {
            $leaf = $this->lifecycleService->stopChequeLeaf(
                tenant: $tenant,
                leafId: $id,
                reason: $validated['reason'],
                user: $request->user()
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "Payment stopped on cheque {$leaf->display_serial_number}.",
                    'leaf'    => $leaf,
                ]);
            }

            return back()->with('success', "Payment stopped on cheque {$leaf->display_serial_number}.");
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Mark an issued cheque leaf as cleared.
     */
    public function clearIssued(Request $request, string $id)
    {
        $validated = $request->validate([
            'clear_date' => 'nullable|date',
        ]);

        $tenant = app('current.tenant');

        try {
            $leaf = $this->lifecycleService->clearChequeLeaf(
                tenant: $tenant,
                leafId: $id,
                clearDate: $validated['clear_date'] ?? null,
                user: $request->user()
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "Cheque {$leaf->display_serial_number} marked as cleared.",
                    'leaf'    => $leaf,
                ]);
            }

            return back()->with('success', "Cheque {$leaf->display_serial_number} marked as cleared.");
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Record a bounce on an issued cheque and reverse its financial posting.
     */
    public function bounceIssued(Request $request, string $id)
    {
        $validated = $request->validate([
            'reason'      => 'required|string|max:255',
            'bounce_date' => 'nullable|date',
        ]);

        $tenant = app('current.tenant');

        try {
            $leaf = $this->lifecycleService->bounceChequeLeaf(
                tenant: $tenant,
                leafId: $id,
                reason: $validated['reason'],
                bounceDate: $validated['bounce_date'] ?? null,
                user: $request->user()
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "Cheque {$leaf->display_serial_number} recorded as bounced. Financial transaction reversed.",
                    'leaf'    => $leaf,
                ]);
            }

            return back()->with('success', "Cheque {$leaf->display_serial_number} recorded as bounced.");
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
