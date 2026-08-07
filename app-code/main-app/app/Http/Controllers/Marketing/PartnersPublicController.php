<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use App\Models\ContactSubmission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

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

        ContactSubmission::create([
            'name'       => $validated['name'],
            'email'      => $validated['email'],
            'company'    => $validated['company'],
            'subject'    => 'Partnership Inquiry: ' . $validated['partnership_type'],
            'message'    => $validated['message'],
            'source'     => 'partners_page',
            'ip_address' => $request->ip(),
        ]);

        try {
            Mail::raw(
                "New Partnership Inquiry received!\n\n" .
                "Name: {$validated['name']}\n" .
                "Email: {$validated['email']}\n" .
                "Company: {$validated['company']}\n" .
                "Type: {$validated['partnership_type']}\n\n" .
                "Message:\n{$validated['message']}",
                function ($message) use ($validated) {
                    $message->to('founder@venqore.com')
                        ->subject('Partnership Inquiry: ' . $validated['partnership_type'])
                        ->from('noreply@venqore.com', 'VenQore Partnerships');
                }
            );
        } catch (\Throwable $e) {
            Log::warning('Could not send partnership email: ' . $e->getMessage());
        }

        return back()->with('success', 'Thank you! Your partnership inquiry has been routed to our founding team.');
    }
}
