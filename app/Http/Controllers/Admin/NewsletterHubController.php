<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NewsletterHubController extends Controller
{
    public function index()
    {
        $cloudCount = NewsletterSubscriber::whereIn('interest', ['cloud', 'both'])->count();
        $digitalCount = NewsletterSubscriber::whereIn('interest', ['digital', 'both'])->count();

        return Inertia::render('SuperAdmin/NewsletterHub/Index', [
            'stats' => [
                'cloud_count'   => $cloudCount,
                'digital_count' => $digitalCount,
                'total_count'   => NewsletterSubscriber::count(),
            ]
        ]);
    }

    public function subscribers()
    {
        $subscribers = NewsletterSubscriber::latest()->get();
        
        $cloudList = $subscribers->filter(fn($s) => in_array($s->interest, ['cloud', 'both']))->values();
        $digitalList = $subscribers->filter(fn($s) => in_array($s->interest, ['digital', 'both']))->values();

        return response()->json([
            'success' => true,
            'cloud'   => $cloudList,
            'digital' => $digitalList,
            'all'     => $subscribers,
        ]);
    }
}
