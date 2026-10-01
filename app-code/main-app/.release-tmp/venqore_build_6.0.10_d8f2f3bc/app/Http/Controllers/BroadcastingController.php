<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Symfony\Component\HttpFoundation\Response;

class BroadcastingController extends Controller
{
    /**
     * Authenticate the user for the channel.
     */
    public function authenticate(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('BroadcastingController@authenticate called', [
            'user' => auth()->id(),
            'channel' => $request->input('channel_name'),
        ]);

        // 1. Verify user is authenticated
        if (!auth()->check()) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $channelName = $request->input('channel_name');
        
        // 2. Extra defense-in-depth: parsing tenant/store ID from channel name if present
        if ($channelName) {
            $matched = false;
            $tenantId = null;

            if (preg_match('/^private-store\.(\d+)\.terminal/', $channelName, $matches)) {
                $tenantId = (int)$matches[1];
                $matched = true;
            } elseif (preg_match('/^private-agent\.inbox\.(\d+)/', $channelName, $matches)) {
                $tenantId = (int)$matches[1];
                $matched = true;
            }

            if ($matched && $tenantId) {
                // Verify active membership for multi-tenant isolation boundary
                $hasMembership = auth()->user()->memberships()
                    ->where('tenant_id', $tenantId)
                    ->where('status', 'active')
                    ->exists();

                if (!$hasMembership && !auth()->user()->isPlatformAdmin() && !auth()->user()->isPlatformStaff()) {
                    return response()->json(['error' => 'Forbidden. Tenant mismatch.'], 403);
                }
            }
        }

        // 3. Delegate to Laravel's default broadcasting authentication
        return Broadcast::auth($request);
    }
}
