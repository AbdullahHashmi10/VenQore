<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\WebhookLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * SupportController — V1 Platform Owner Inbox
 *
 * Routes (all under /admin — protected by SuperAdminMiddleware):
 *   GET  /admin/tickets               → list
 *   GET  /admin/tickets/{ticket}      → show thread
 *   POST /admin/tickets/{ticket}/reply→ reply
 *   POST /admin/tickets/{ticket}/status → update status
 *   GET  /admin/webhooks              → webhook log viewer
 *   POST /admin/feature-flags/{tenant}→ toggle feature for a store
 */
class SupportController extends Controller
{
    // ── Ticket Inbox ───────────────────────────────────────────────────────

    public function tickets(Request $request): Response
    {
        $status = $request->get('status', 'open');

        $tickets = SupportTicket::with(['tenant:id,name', 'submittedBy:id,name,email'])
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->orderByRaw("FIELD(priority, 'urgent','high','normal','low')")
            ->orderBy('created_at', 'desc')
            ->paginate(30);

        return Inertia::render('SuperAdmin/Dashboard', [
            'tab'            => 'support',
            'tickets'        => $tickets->items(),
            'tickets_total'  => $tickets->total(),
            'open_count'     => SupportTicket::whereIn('status', ['open', 'in_progress'])->count(),
            'active_filter'  => $status,
        ]);
    }

    public function showTicket(SupportTicket $ticket): \Symfony\Component\HttpFoundation\Response
    {
        $ticket->load(['tenant:id,name', 'submittedBy:id,name,email', 'replies.author:id,name']);
        return response()->json($ticket);
    }

    public function reply(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $request->validate(['body' => 'required|string|min:2|max:5000']);

        SupportTicketReply::create([
            'ticket_id'    => $ticket->id,
            'author_id'    => auth()->id(),
            'body'         => $request->body,
            'is_platform_owner' => true,
        ]);

        // Auto-update status to in_progress if open
        if ($ticket->status === 'open') {
            $ticket->update(['status' => 'in_progress']);
        }

        return back()->with('success', 'Reply sent.');
    }

    public function updateTicketStatus(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $request->validate(['status' => 'required|in:open,in_progress,resolved,closed']);
        $ticket->update([
            'status'      => $request->status,
            'resolved_at' => in_array($request->status, ['resolved', 'closed']) ? now() : null,
        ]);
        return back()->with('success', 'Ticket status updated.');
    }

    // ── Webhook Log ────────────────────────────────────────────────────────

    public function webhooks(): \Symfony\Component\HttpFoundation\Response
    {
        $logs = [];
        try {
            $logs = \App\Models\WebhookLog::latest()->take(100)->get()->map(fn ($w) => [
                'id'         => $w->id,
                'event_type' => $w->event_type,
                'status'     => $w->status,
                'store_name' => $w->store_name,
                'plan'       => $w->plan,
                'error'      => $w->error,
                'created_at' => $w->created_at->toIso8601String(),
            ]);
        } catch (\Throwable) {}
        return response()->json($logs);
    }

    // ── Feature Flags ──────────────────────────────────────────────────────

    public function toggleFeatureFlag(Request $request, \App\Models\Tenant $tenant): RedirectResponse
    {
        $request->validate([
            'feature' => 'required|string|in:woocommerce,api_access,growth_engine,multi_branch,advanced_reports',
            'enabled' => 'required|boolean',
        ]);

        // plan_limits is a JSON column storing per-tenant overrides
        $overrides = $tenant->plan_limits ?? [];
        if ($request->enabled) {
            $overrides[$request->feature] = true;
        } else {
            $overrides[$request->feature] = false;
        }

        $tenant->update(['plan_limits' => $overrides]);

        return back()->with('success', "Feature '{$request->feature}' " . ($request->enabled ? 'enabled' : 'disabled') . " for {$tenant->name}.");
    }
}
