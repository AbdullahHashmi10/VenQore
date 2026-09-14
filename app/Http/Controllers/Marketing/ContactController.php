<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use App\Mail\ContactSubmissionReceived;
use App\Models\ContactSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    /**
     * Store a contact form submission.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'email'   => ['required', 'email', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $submission = ContactSubmission::create(array_merge($validated, [
            'ip_address' => $request->ip(),
            'source'     => 'contact_page',
        ]));

        // Lead delivery is best-effort: the database row is the durable source
        // of truth and a mail transport outage must never lose the submission.
        try {
            Mail::to(config('mail.notifications.contact'))
                ->send(new ContactSubmissionReceived($submission));
        } catch (\Throwable $e) {
            report($e);
        }

        $message = "Thanks — we've got your message and will reply to {$validated['email']}.";

        // WEB-02 (2026-09-10): an explicit JSON contract for the fetch() client,
        // so "success" is only ever shown after the row above was stored.
        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'message' => $message, 'id' => $submission->id], 201);
        }

        return back()->with('success', $message);
    }
}
