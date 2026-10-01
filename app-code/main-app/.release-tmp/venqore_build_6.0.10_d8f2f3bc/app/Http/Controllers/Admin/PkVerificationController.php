<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PkVerification;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class PkVerificationController extends Controller
{
    /**
     * Submit a CNIC verification request.
     */
    public function submit(Request $request)
    {
        $request->validate([
            'tenant_id'   => 'required|exists:tenants,id',
            'cnic'        => 'required|string|regex:/^[0-9]{5}-?[0-9]{7}-?[0-9]{1}$/',
            'phone'       => 'required|string|max:30',
            'image_front' => 'required|image|max:5120', // Max 5MB
            'image_back'  => 'required|image|max:5120',
        ]);

        $cleanCnic = str_replace('-', '', $request->cnic);
        $cnicHash = hash('sha256', $cleanCnic);

        // Enforce uniqueness: One account/tenant per ID card.
        // This check is deliberately cross-tenant, so it must bypass the tenant scope.
        $exists = PkVerification::withoutTenantScope()
            ->where('cnic_hash', $cnicHash)
            ->where('tenant_id', '!=', $request->tenant_id)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'cnic' => ['This CNIC has already been registered to another store.']
            ]);
        }

        $tenant = Tenant::findOrFail($request->tenant_id);

        // Store private images securely (not public)
        $frontPath = $request->file('image_front')->store('private/cnics');
        $backPath = $request->file('image_back')->store('private/cnics');

        PkVerification::updateOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'user_id'          => Auth::id(),
                'cnic_hash'        => $cnicHash,
                'phone'            => $request->phone,
                'image_front_path' => $frontPath,
                'image_back_path'  => $backPath,
                'status'           => 'pending',
                'reviewed_by'      => null,
                'reviewed_at'      => null,
                'rejection_reason' => null,
            ]
        );

        return back()->with('success', 'CNIC verification submitted successfully. We are reviewing it.');
    }

    /**
     * Approve verification request.
     */
    public function approve($id)
    {
        $verification = PkVerification::withoutTenantScope()->findOrFail($id);

        $verification->update([
            'status'      => 'approved',
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        return redirect()->route('platform.dashboard')->with('success', 'CNIC verification request approved.');
    }

    /**
     * Reject verification request.
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $verification = PkVerification::withoutTenantScope()->findOrFail($id);

        $verification->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->reason,
            'reviewed_by'      => Auth::id(),
            'reviewed_at'      => now(),
        ]);

        return redirect()->route('platform.dashboard')->with('success', 'CNIC verification request rejected.');
    }

    /**
     * Download/Preview secure private image.
     */
    public function downloadImage($id, $side)
    {
        // Enforce is_platform_admin
        if (! Auth::user()->is_platform_admin) {
            abort(403, 'Unauthorized');
        }

        $verification = PkVerification::withoutTenantScope()->findOrFail($id);

        $path = $side === 'front' ? $verification->image_front_path : $verification->image_back_path;

        if (! Storage::exists($path)) {
            abort(404, 'File not found');
        }

        $file = Storage::get($path);
        $mime = Storage::mimeType($path);

        return response($file, 200)->header('Content-Type', $mime);
    }
}
