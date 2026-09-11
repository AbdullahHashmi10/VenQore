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

    /**
     * Paired terminals for this store (2026-09-10).
     */
    public function terminals()
    {
        $terminals = \App\Models\Terminal::where('tenant_id', app('current.tenant')->id)
            ->orderByDesc('last_heartbeat_at')
            ->get(['id', 'name', 'status', 'last_heartbeat_at', 'paired_at', 'ip_address']);

        return response()->json(['success' => true, 'terminals' => $terminals]);
    }

    /**
     * Disconnect a terminal: its device secret stops working immediately and
     * it must be paired again with a new code.
     */
    public function revoke(string $id)
    {
        $terminal = \App\Models\Terminal::where('tenant_id', app('current.tenant')->id)->findOrFail($id);
        $terminal->forceFill([
            'device_secret_hash'      => null,
            'device_secret_issued_at' => null,
            'tenant_id'               => null,
            'paired_at'               => null,
            'status'                  => 'CLOSED',
        ])->save();

        \Illuminate\Support\Facades\Log::info('Terminal disconnected by store', ['terminal_id' => $id, 'user_id' => Auth::id()]);

        return response()->json(['success' => true]);
    }
}
