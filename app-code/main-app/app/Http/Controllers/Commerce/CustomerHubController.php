<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\TenantUser;
use App\Services\Commerce\CustomerHub;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * The customer's own page: every order and loyalty balance across all stores, for the signed-in person.
 * Signed-out visitors go to the order lookup (order number + phone), which still works without an account.
 */
class CustomerHubController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return redirect('/order-lookup');
        }

        $hub = CustomerHub::forUser($user);
        $hasStore = TenantUser::where('user_id', $user->id)->where('status', 'active')->exists();

        return Inertia::render('Commerce/MyOrders', [
            'name' => $user->name,
            'email' => $user->email,
            'verified' => $hub['verified'],
            'orders' => $hub['orders'],
            'loyalty' => $hub['loyalty'],
            'hasStore' => $hasStore,
        ])->withViewData(['noindex' => true]);
    }
}
