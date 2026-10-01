<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Launch fix: ensure the platform owner passes isPlatformSuperAdmin()
        // so plan-price editing works on production. Targets the single owner
        // account by email; safe to run repeatedly (idempotent).
        DB::table('users')
            ->where('email', 'owner@venqore.com')
            ->update([
                'is_platform_admin' => 1,
                'platform_role'     => 'platform_owner',
            ]);
    }

    public function down(): void
    {
        // No-op: do not un-promote the owner on rollback.
    }
};
