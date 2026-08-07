<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PartnerSupportController extends Controller
{
    public function index()
    {
        return Inertia::render('Marketing/PartnerSupport');
    }

    public function startChat(Request $request)
    {
        $validated = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'email'           => ['required', 'email', 'max:255'],
            'message'         => ['nullable', 'string', 'max:5000'],
            'purchase_source' => ['required', 'string', 'max:255'],
            'trial_status'    => ['required', 'string', 'in:started,not_started'],
            'attachment'      => ['required', 'file', 'mimes:jpg,jpeg,png,pdf,zip,txt,doc,docx', 'max:10240'], // max 10MB
        ]);

        // Upload attachment if exists
        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $fileName = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/attachments'), $fileName);
            $attachmentPath = '/uploads/attachments/' . $fileName;
        }

        // Find existing open/in-progress ticket for this email under source = 'partner_desk'
        $ticket = SupportTicket::withoutTenantScope()
            ->where('requester_email', $validated['email'])
            ->where('source', 'partner_desk')
            ->whereIn('status', ['open', 'in_progress'])
            ->first();

        // Construct initial greeting message or reply body
        $desc = "Platform Purchased From: " . $validated['purchase_source'] . "\n"
              . "Trial Status: " . ($validated['trial_status'] === 'started' ? 'Started (Extra 30 Days Eligible)' : 'Not Started (45 Days Access Eligible)') . "\n\n"
              . "Additional Details: " . ($validated['message'] ?? 'None provided.');

        if (!$ticket) {
            $ticket = SupportTicket::create([
                'tenant_id'       => null,
                'submitted_by'    => null,
                'subject'         => 'Digital Product License Support Request',
                'message'         => $desc,
                'status'          => 'open',
                'priority'        => 'high',
                'requester_email' => $validated['email'],
                'requester_name'  => $validated['name'],
                'source'          => 'partner_desk',
                'purchase_source' => $validated['purchase_source'],
                'trial_status'    => $validated['trial_status'],
                'attachment_path' => $attachmentPath,
            ]);
            
            // Add initial message as reply for consistency
            SupportTicketReply::create([
                'ticket_id'         => $ticket->id,
                'author_id'         => null,
                'body'              => $desc,
                'is_platform_owner' => false,
            ]);
        } else {
            // Update details on the existing ticket
            $ticket->update([
                'purchase_source' => $validated['purchase_source'],
                'trial_status'    => $validated['trial_status'],
                'attachment_path' => $attachmentPath ?: $ticket->attachment_path,
            ]);

            // Add message as reply
            SupportTicketReply::create([
                'ticket_id'         => $ticket->id,
                'author_id'         => null,
                'body'              => "NEW VERIFICATION REQUEST SUBMITTED:\n\n" . $desc,
                'is_platform_owner' => false,
            ]);
        }

        $ticket->load('replies');

        return response()->json([
            'success' => true,
            'ticket'  => $ticket,
        ]);
    }

    public function getMessages($ticket_id)
    {
        $ticket = SupportTicket::withoutTenantScope()
            ->where('source', 'partner_desk')
            ->findOrFail($ticket_id);

        $ticket->load('replies');

        return response()->json([
            'success' => true,
            'ticket'  => $ticket,
        ]);
    }

    public function reply(Request $request, $ticket_id)
    {
        $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $ticket = SupportTicket::withoutTenantScope()
            ->where('source', 'partner_desk')
            ->findOrFail($ticket_id);

        // Append reply
        $reply = SupportTicketReply::create([
            'ticket_id'         => $ticket->id,
            'author_id'         => null,
            'body'              => $request->body,
            'is_platform_owner' => false,
        ]);

        // Auto change status if owner replied
        if ($ticket->status === 'resolved' || $ticket->status === 'closed') {
            $ticket->update(['status' => 'in_progress', 'resolved_at' => null]);
        }

        return response()->json([
            'success' => true,
            'reply'   => $reply,
        ]);
    }
}
