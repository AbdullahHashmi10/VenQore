<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DrmLicenseController extends Controller
{
    public function validateLicense(Request $request)
    {
        $validated = $request->validate([
            'license_key'          => ['required', 'string'],
            'hardware_fingerprint' => ['required', 'string'],
        ]);

        $license = DB::table('drm_licenses')
            ->where('license_key', $validated['license_key'])
            ->first();

        if (!$license) {
            return response()->json([
                'status'  => 'error',
                'message' => 'License key not found.',
            ], 404);
        }

        if (!$license->is_active) {
            return response()->json([
                'status'  => 'error',
                'message' => 'License is inactive.',
            ], 403);
        }

        // If no hardware fingerprint is recorded, associate this one (startup registration)
        if (empty($license->hardware_fingerprint)) {
            DB::table('drm_licenses')
                ->where('id', $license->id)
                ->update([
                    'hardware_fingerprint' => $validated['hardware_fingerprint'],
                    'last_validated_at'    => now(),
                    'updated_at'           => now(),
                ]);
        } else {
            // Mismatch check
            if ($license->hardware_fingerprint !== $validated['hardware_fingerprint']) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Hardware fingerprint mismatch.',
                ], 403);
            }

            DB::table('drm_licenses')
                ->where('id', $license->id)
                ->update([
                    'last_validated_at' => now(),
                    'updated_at'        => now(),
                ]);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'License validated successfully.',
            'license' => DB::table('drm_licenses')->where('id', $license->id)->first(),
        ]);
    }
}
