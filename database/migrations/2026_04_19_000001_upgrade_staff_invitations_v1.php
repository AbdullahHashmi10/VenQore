<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Upgrade staff_invitations table to V1 invitation system spec.
 * Adds: invitee_name, invitee_phone, short_code, roles (JSON), status enum,
 * approved_at, and renames single role -> roles.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staff_invitations', function (Blueprint $table) {
            // Add missing V1 columns (only if they don't exist)
            if (!Schema::hasColumn('staff_invitations', 'invitee_name')) {
                $table->string('invitee_name')->after('invited_by');
            }
            if (!Schema::hasColumn('staff_invitations', 'invitee_email')) {
                $table->string('invitee_email')->nullable()->after('invitee_name');
            }
            if (!Schema::hasColumn('staff_invitations', 'invitee_phone')) {
                $table->string('invitee_phone')->nullable()->after('invitee_email');
            }
            if (!Schema::hasColumn('staff_invitations', 'roles')) {
                $table->json('roles')->nullable()->after('email'); // replaces single 'role'
            }
            if (!Schema::hasColumn('staff_invitations', 'short_code')) {
                $table->string('short_code', 12)->nullable()->unique()->after('token');
            }
            if (!Schema::hasColumn('staff_invitations', 'status')) {
                $table->enum('status', [
                    'pending',
                    'no_account',
                    'awaiting_approval',
                    'active',
                    'expired',
                    'revoked',
                    'declined',
                ])->default('pending')->after('short_code');
            }
            if (!Schema::hasColumn('staff_invitations', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('accepted_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('staff_invitations', function (Blueprint $table) {
            $table->dropColumn(['invitee_name', 'invitee_email', 'invitee_phone', 'roles', 'short_code', 'status', 'approved_at']);
        });
    }
};
