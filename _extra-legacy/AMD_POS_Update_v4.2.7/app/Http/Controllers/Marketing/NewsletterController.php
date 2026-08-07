<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NewsletterController extends Controller
{
    public function index()
    {
        return Inertia::render('Marketing/Newsletter');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'email'    => ['required', 'email', 'max:255', 'unique:newsletter_subscribers,email'],
            'name'     => ['nullable', 'string', 'max:255'],
            'interest' => ['nullable', 'string', 'in:cloud,digital,both'],
        ]);

        NewsletterSubscriber::create(array_merge($validated, [
            'status'   => 'subscribed',
            'interest' => $request->input('interest', 'cloud'),
        ]));

        return back()->with('success', 'Awesome! You have successfully subscribed to the VenQore Newsletter.');
    }
}
