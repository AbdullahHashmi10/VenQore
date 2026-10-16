<?php

namespace App\Http\Controllers;

use App\Services\Push\FcmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The phone app registers (or removes) its notification address for the signed-in person.
 * The person is always the logged-in user; the body only carries the phone's own token.
 */
class DeviceTokenController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'token' => ['required', 'string', 'min:20', 'max:4096'],
            'platform' => ['nullable', 'in:android,ios'],
            'app_version' => ['nullable', 'string', 'max:40'],
        ]);

        FcmService::remember((int) $request->user()->id, $v['token'], $v['platform'] ?? 'android', $v['app_version'] ?? null);

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $v = $request->validate(['token' => ['required', 'string', 'max:4096']]);
        FcmService::forget((int) $request->user()->id, $v['token']);

        return response()->json(['ok' => true]);
    }
}
