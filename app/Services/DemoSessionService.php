<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Str;

class DemoSessionService
{
    /**
     * Spin up a new demo session for a visitor.
     * 
     * @return Tenant Returns the cloned demo tenant instance.
     */
    public static function create(): Tenant
    {
        $master = Tenant::where('is_golden_master', true)->first();
        if (!$master) {
            throw new \Exception("Golden Master tenant is not seeded or missing.");
        }

        $slug = 'demo-' . strtolower(Str::random(8));

        // Use the Cloner to duplicate data
        $newTenant = TenantCloner::cloneFrom($master, [
            'slug'               => $slug,
            'is_demo'            => true,
            'is_golden_master'   => false,
            'demo_expires_at'    => now()->addHours(2),
            'demo_session_token' => Str::uuid()->toString(),
        ]);

        return $newTenant;
    }
}
