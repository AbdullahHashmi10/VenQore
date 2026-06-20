<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class BankAccountController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        if (!app()->bound('current.tenant')) {
            return response()->json([], 403);
        }
        $tenantId = app('current.tenant')->id;
        return response()->json(\Illuminate\Support\Facades\DB::table('bank_accounts')->where('tenant_id', $tenantId)->get());
    }
}
