<?php

namespace App\Http\Controllers;

use App\Models\UserPreference;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

/** Per-account navigation layout (dock vs side rail, rail label style). Stored account-wide in user_preferences. */
class NavPreferenceController extends Controller
{
    public function update(Request $request)
    {
        $v = $request->validate([
            'mode' => ['nullable', 'in:dock,rail'],
            'labels' => ['nullable', 'in:beside,below'],
        ]);

        $user = $request->user();
        try {
            if ($user && Schema::hasTable('user_preferences')) {
                $current = UserPreference::resolve($user->id, null, 'nav') ?? [];
                UserPreference::put($user->id, null, 'nav', array_merge($current, array_filter($v, fn ($x) => $x !== null)));
            }
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->noContent();
    }
}
