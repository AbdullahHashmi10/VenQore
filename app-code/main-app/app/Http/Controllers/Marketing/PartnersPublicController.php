<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use App\Mail\ContactSubmissionReceived;
use App\Models\ContactSubmission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Mail;

class PartnersPublicController extends Controller
{
    /**
     * Show the public partners/licensing page (/partners).
     */
    public function index(): Response
    {
        return Inertia::render('Marketing/Partners');
    }

    /**
     * Handle a partnership inquiry form submission.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:255'],
            'email'            => ['required', 'email', 'max:255'],
            'company'          => ['required', 'string', 'max:255'],
            'partnership_type' => ['required', 'string', 'max:100'],
            'message'          => ['required', 'string', 'max:5000'],
        ]);

        $submission = ContactSubmission::create([
            'name'       => $validated['name'],
            'email'      => $validated['email'],
            'company'    => $validated['company'],
            'subject'    => 'Partnership Inquiry: ' . $validated['partnership_type'],
            'message'    => $validated['message'],
            'source'     => 'partners_page',
            'ip_address' => $request->ip(),
        ]);

        try {
            Mail::to(config('mail.notifications.partners'))
                ->send(new ContactSubmissionReceived($submission));
        } catch (\Throwable $e) {
            report($e);
        }

        return back()->with('success', "Thanks — we've got your message and will reply to {$validated['email']}.");
    }
}
