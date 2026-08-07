<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * SupportInboxController
 *
 * Provides a unified triage queue across all ticket sources:
 *   - V1 / manual tickets (source = null or 'manual')
 *   - Vena Chat escalations (source = 'vena_chat')
 *   - Digital Hub chats (source = 'digital_hub')
 *
 * All routes sit under the platform. prefix (SuperAdmin middleware).
 */
class SupportInboxController extends Controller
{
    /**
     * Return paginated unified ticket list for the platform dashboard.
     * Data is injected into the platform.dashboard view as `tickets`.
     */
    public function unifiedList(Request $request): array
    {
        $query = SupportTicket::withoutGlobalScopes()
            ->with(['tenant:id,name,slug'])
            ->latest();

        if ($request->filled('ticket_status') && $request->ticket_status !== 'all') {
            $query->where('status', $request->ticket_status);
        }

        if ($request->filled('ticket_source') && $request->ticket_source !== 'all') {
            $source = $request->ticket_source;
            if ($source === 'v1') {
                $query->whereIn('source', [null, 'manual'])->orWhereNull('source');
            } else {
                $query->where('source', $source);
            }
        }

        return [
            'tickets'        => $query->paginate(20)->withQueryString(),
            'ticket_filters' => $request->only(['ticket_status', 'ticket_source']),
        ];
    }

    /**
     * GET /VenQore/support/tickets/{ticket}
     * Returns ticket details + replies as JSON (consumed by the slide-over drawer).
     */
    public function show(SupportTicket $ticket): JsonResponse
    {
        $ticket->load([
            'tenant:id,name,slug',
            'replies' => fn ($q) => $q->with('author:id,name')->orderBy('created_at'),
        ]);

        return response()->json($ticket);
    }

    /**
     * POST /VenQore/support/tickets/{ticket}/reply
     * Adds a staff reply to a ticket.
     */
    public function reply(Request $request, SupportTicket $ticket): RedirectResponse|JsonResponse
    {
        $data = $request->validate([
            'body' => 'required|string|max:10000',
        ]);

        SupportTicketReply::create([
            'ticket_id'          => $ticket->id,
            'author_id'          => auth()->id(),
            'body'               => $data['body'],
            'is_platform_owner'  => true,
        ]);

        // Bump status to in_progress if still open
        if ($ticket->status === 'open') {
            $ticket->update(['status' => 'in_progress']);
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Reply sent.');
    }

    /**
     * POST /VenQore/support/tickets/{ticket}/status
     * Updates the ticket status.
     */
    public function updateStatus(Request $request, SupportTicket $ticket): RedirectResponse|JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed',
        ]);

        $ticket->update([
            'status'      => $data['status'],
            'resolved_at' => in_array($data['status'], ['resolved', 'closed']) ? now() : null,
        ]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Ticket status updated.');
    }

    /**
     * POST /VenQore/support/vena-tickets/{ticket}/status
     * Alias for Vena chat ticket status updates (SupportView uses a separate route name).
     */
    public function updateVenaStatus(Request $request, SupportTicket $ticket): RedirectResponse|JsonResponse
    {
        abort_if($ticket->source !== 'vena_chat', 404);
        return $this->updateStatus($request, $ticket);
    }
}
