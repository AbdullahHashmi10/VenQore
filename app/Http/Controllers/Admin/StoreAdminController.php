<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TenantUser;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * StoreAdminController
 *
 * Handles the store-level "Admin Panel" pages.
 * These are the old perfected Admin Panel pages now scoped to /s/{store_slug}/admin/*
 * Requires TenantMiddleware — always operating in context of one store.
 */
class StoreAdminController extends Controller
{
    /**
     * Admin Home — store health overview.
     * Route: store.admin.home → GET /s/{store_slug}/admin/
     */
    public function home(): Response
    {
        $tenant     = app('current.tenant');
        $membership = app('current.membership');

        // Owners and admins only
        if (!in_array($membership->role, ['owner', 'admin'])) {
            abort(403);
        }

        $staffCount = TenantUser::where('tenant_id', $tenant->id)->where('status', 'active')->count();

        return Inertia::render('Admin/Dashboard', [
            'tenant'      => [
                'name'       => $tenant->name,
                'plan'       => $tenant->plan,
                'status'     => $tenant->status,
                'trial_ends' => $tenant->trial_ends_at,
            ],
            'staff_count' => $staffCount,
        ]);
    }

    /**
     * Executive Dashboard — same page as the old Admin/ExecutiveDashboard.jsx.
     * Route: store.admin.dashboard → GET /s/{store_slug}/admin/dashboard
     */
    public function dashboard(): Response
    {
        $membership = app('current.membership');

        if (!in_array($membership->role, ['owner', 'admin'])) {
            abort(403);
        }

        return Inertia::render('Admin/ExecutiveDashboard');
    }

    /**
     * Staff Attendance & Summaries — old Admin/StaffSummaries.jsx.
     * Route: store.admin.attendance → GET /s/{store_slug}/admin/attendance
     */
    public function attendance(): Response
    {
        $tenant     = app('current.tenant');
        $membership = app('current.membership');

        if (!in_array($membership->role, ['owner', 'admin'])) {
            abort(403);
        }

        $members = TenantUser::where('tenant_id', $tenant->id)
            ->with('user:id,name,email')
            ->orderBy('role')
            ->get()
            ->map(fn($m) => [
                'id'           => $m->id,
                'name'         => $m->user?->name,
                'email'        => $m->user?->email,
                'role'         => $m->role,
                'display_name' => $m->display_name,
                'status'       => $m->status,
                'joined_at'    => $m->joined_at,
            ]);

        return Inertia::render('Admin/StaffSummaries', [
            'members' => $members,
        ]);
    }
}
