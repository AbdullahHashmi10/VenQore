<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * New Experience — presentation-layer preference storage.
 *
 * Two tables, both of which describe *how a person wants to look at VenQore*
 * and neither of which holds a single business fact. That separation is the
 * whole design: a corrupted row here costs a user their card arrangement, and
 * nothing else. Nothing in accounting, inventory or the ledger reads from
 * either table.
 *
 * `user_preferences` is deliberately generic (a namespaced key holding JSON)
 * rather than a wide `appearance` table with a column per dial. The dials are
 * expected to change — a font option gets added, a density level gets dropped —
 * and none of those changes should require a migration on a production database
 * that is already carrying several hundred stores.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('user_preferences')) {
            Schema::create('user_preferences', function (Blueprint $t) {
                $t->id();

                $t->unsignedBigInteger('user_id')->index();

                // Nullable on purpose. A null tenant_id is the user's account-wide
                // default, which is what makes "I always want Midnight" work for
                // someone who owns four stores without them setting it four times.
                $t->unsignedBigInteger('tenant_id')->nullable()->index();

                $t->string('key', 64);

                // longText rather than a json column: MariaDB 10.5 implements JSON
                // as LONGTEXT with a CHECK constraint anyway, and being explicit
                // keeps the schema identical across the MySQL/MariaDB split noted
                // in CLAUDE.md instead of depending on driver-specific mapping.
                $t->longText('value')->nullable();

                $t->timestamps();

                $t->unique(['user_id', 'tenant_id', 'key'], 'user_preferences_scope_unique');
            });
        }

        if (! Schema::hasTable('dashboard_layouts')) {
            Schema::create('dashboard_layouts', function (Blueprint $t) {
                $t->id();

                $t->unsignedBigInteger('tenant_id')->index();
                $t->unsignedBigInteger('user_id')->index();

                // Which dashboard this layout belongs to. Only 'workspace' exists
                // today; the column is here so a second configurable surface does
                // not need a schema change, and because a layout keyed only by
                // user would silently collide the day one is added.
                $t->string('dashboard_key', 40)->default('workspace');

                // [{ widget, x, y, w, h, size }] — positions and sizes only.
                // No metric values, no cached figures, no anything a downgrade or
                // a permission change could turn into a data leak.
                $t->longText('layout')->nullable();

                $t->timestamps();

                $t->unique(['tenant_id', 'user_id', 'dashboard_key'], 'dashboard_layouts_scope_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('dashboard_layouts');
        Schema::dropIfExists('user_preferences');
    }
};
