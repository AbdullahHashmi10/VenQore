<?php

namespace App\Http\Controllers;

use App\Models\TenantUser;
use App\Support\PostLoginRedirect;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Tells the phone app who is signed in and where they can go: the customer side (marketplace and
 * orders) and every store they belong to, each opening on the page its role belongs on.
 * A person with no store is offered "create your own store", never a dashboard that does not exist.
 */
class AppContextController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $stores = TenantUser::where('user_id', $user->id)
            ->where('status', 'active')
            ->with('tenant')
            ->get()
            ->filter(fn ($m) => $m->tenant && in_array($m->tenant->status, ['trial', 'active', 'suspended'], true))
            ->map(fn ($m) => [
                'name' => $m->tenant->name,
                'slug' => $m->tenant->slug,
                'role' => $m->isPosStaff() ? 'cashier' : (string) $m->role,
                'home' => PostLoginRedirect::homeUrl($m),
            ])
            ->values();

        return response()->json([
            'user' => ['name' => $user->name, 'email' => $user->email],
            'customer_home' => '/my-orders',
            'orders' => '/my-orders',
            'stores' => $stores,
            'create_store' => '/new-store',
        ]);
    }
}
