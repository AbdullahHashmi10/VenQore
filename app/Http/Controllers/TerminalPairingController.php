<?php

namespace App\Http\Controllers;

use App\Models\TerminalPairingToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * TerminalPairingController — L032
 *
 * Authenticated, tenant-scoped endpoints for issuing and revoking one-time
 * terminal pairing tokens. A new terminal presents the issued token on its
 * first heartbeat to prove it is authorized to bind to this tenant.
 */
class TerminalPairingController extends Controller
{
    /**
     * Issue a new single-use pairing token for the current tenant.
     */
    public function store(Request $request)
    {
        $request->validate([
            'label'        => 'nullable|string|max:100',
            'ttl_minutes'  => 'nullable|integer|min:1|max:1440',
        ]);

        $token = TerminalPairingToken::create([
            'tenant_id'  => app('current.tenant')->id,
            'token'      => TerminalPairingToken::generateToken(),
            'label'      => $request->input('label'),
            'expires_at' => now()->addMinutes((int) $request->input('ttl_minutes', 60)),
            'created_by' => Auth::id(),
        ]);

        return response()->json([
            'success'    => true,
            'token'      => $token->token,
            'label'      => $token->label,
            'expires_at' => $token->expires_at?->toIso8601String(),
        ], 201);
    }

    /**
     * List active (unused, unexpired) pairing tokens for the current tenant.
     */
    public function index()
    {
        $tokens = TerminalPairingToken::whereNull('used_at')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->latest()
            ->get(['id', 'token', 'label', 'expires_at', 'created_at']);

        return response()->json(['success' => true, 'tokens' => $tokens]);
    }

    /**
     * Revoke (delete) a pairing token before it is used.
     */
    public function destroy(string $id)
    {
        $token = TerminalPairingToken::whereNull('used_at')->findOrFail($id);
        $token->delete();

        return response()->json(['success' => true]);
    }
}
