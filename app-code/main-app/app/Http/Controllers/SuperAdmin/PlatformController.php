<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Platform;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlatformController extends Controller
{
    public function index()
    {
        $platforms = Platform::withCount('plans')->get();

        return Inertia::render('SuperAdmin/Platforms/Index', [
            'platforms' => $platforms,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:100',
            'slug'      => 'required|string|unique:platforms,slug|max:100|regex:/^[a-z0-9_]+$/',
            'type'      => 'required|in:subscription,ltd,hybrid',
            'is_active' => 'boolean',
            'config'    => 'nullable|array',
        ]);

        Platform::create($validated);

        return back()->with('success', "Platform \"{$validated['name']}\" added. Create plans for it under Plans → select this platform.");
    }

    public function update(Request $request, Platform $platform)
    {
        // Slug is not updateable — it's used as a reference in plans and redemption logic
        $validated = $request->validate([
            'name'      => 'string|max:100',
            'is_active' => 'boolean',
            'config'    => 'nullable|array',
        ]);

        $platform->update($validated);

        return back()->with('success', "Platform updated.");
    }
}
