<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * qr_menus — Free Tools program: QR Menu Generator.
 *
 * PLATFORM-LEVEL TABLE. No tenant_id — menus are created anonymously by
 * public visitors to /tools/qr-menu-generator, exactly like tool_leads/
 * tool_usages. This is the ONE free tool in the program that needs real
 * persistence: every other tool is stateless request-in/PDF-out, but a QR
 * code printed onto a table tent has to keep resolving to the SAME menu
 * content for weeks or months after it's generated, so the menu content
 * has to live somewhere durable between requests.
 *
 * Ownership without accounts: there is no user auth on this tool, so we
 * cannot verify "this visitor owns this menu" the normal way. Instead we
 * hand out two independent random tokens at creation time:
 *   - `slug`       — public, goes into the QR code URL, safe to expose.
 *   - `edit_token` — secret, shown ONCE at creation, is the only way back
 *                    in to edit. Whoever holds this string can edit the
 *                    menu. This is a deliberate v1 simplification (no
 *                    accounts = no real ownership auth) documented here
 *                    and in QrMenuService/QrMenuToolController — NOT a
 *                    security gap being papered over silently. A lost
 *                    edit_token means a lost-forever menu; there is no
 *                    recovery path in v1.
 *
 * No expiry/pruning logic ships in v1 — `last_viewed_at` is tracked so a
 * future cleanup job can identify stale/abandoned menus (e.g. not viewed
 * in 12 months) without having to guess from created_at alone. Tradeoff:
 * unbounded row growth over time; acceptable for v1 given this is a
 * lightweight JSON-blob table, revisit if it becomes a real volume problem.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qr_menus', function (Blueprint $table) {
            $table->id();

            $table->string('slug', 32)->unique();
            $table->string('edit_token', 64)->unique();

            $table->string('restaurant_name');
            $table->text('logo_base64')->nullable();
            $table->string('theme_color', 7)->default('#4f46e5');
            $table->string('currency', 8)->default('USD');

            // menu_data shape: [{ name: string, items: [{ name, description, price }] }, ...]
            $table->json('menu_data');

            $table->timestamp('last_viewed_at')->nullable();
            $table->unsignedInteger('view_count')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qr_menus');
    }
};
