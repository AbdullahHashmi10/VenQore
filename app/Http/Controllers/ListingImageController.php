<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessListingImageJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ListingImageController extends Controller
{
    public function process(Request $request): JsonResponse
    {
        if (!app()->bound('current.tenant')) {
            return response()->json(['error' => 'No tenant context.'], 403);
        }

        $tenant = app('current.tenant');

        $request->validate([
            'image' => 'required|image|max:10240',
        ]);

        $path = $request->file('image')->store("tenants/{$tenant->id}/listing_uploads", 'local');

        ProcessListingImageJob::dispatch($tenant->id, $path);

        return response()->json([
            'message' => 'Listing image processing queued.',
            'path'    => $path,
        ]);
    }
}
