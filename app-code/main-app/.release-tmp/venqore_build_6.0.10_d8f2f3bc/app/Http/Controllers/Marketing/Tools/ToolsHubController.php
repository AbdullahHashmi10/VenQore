<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * ToolsHubController — /tools index page, and the shared signed-download
 * endpoint used by every tool for artifacts too large to attach directly
 * (plan §4.6 storage contract: storage/app/tools/{uuid}.{ext}, 24h expiry,
 * pruned by the tools:prune-artifacts scheduled command).
 */
class ToolsHubController extends Controller
{
    public function index()
    {
        return Inertia::render('Marketing/Tools/Index', [
            'toolGroups' => \App\Support\ToolRegistry::groups(),
        ]);
    }

    /**
     * Signed, expiring download of a generated artifact. Route is protected
     * by the `signed` middleware — see routes/web.php `tools.download`.
     */
    public function download(Request $request, string $uuid): StreamedResponse
    {
        abort_unless($request->hasValidSignature(), 403);

        $disk = Storage::disk('local');
        $path = "tools/{$uuid}";

        // We don't know the extension from the UUID alone; look for any match.
        $matches = collect($disk->files('tools'))->filter(
            fn ($file) => str_starts_with(basename($file), $uuid)
        );

        abort_if($matches->isEmpty(), 404);

        $fullPath = $matches->first();

        return $disk->download($fullPath);
    }
}
