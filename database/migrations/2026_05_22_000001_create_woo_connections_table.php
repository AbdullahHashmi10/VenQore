<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ─── woo_connections ──────────────────────────────────────────────────
        // One record per WooCommerce site connected to a VenQore store.
        Schema::create('woo_connections', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->index();
            $table->string('name');                           // User-given label, e.g. "Main Site"
            $table->string('site_url');                      // WordPress site URL
            $table->string('uuid')->unique();                // Used in webhook URLs (not the PK)
            $table->text('consumer_key');                    // Encrypted WooCommerce REST API key
            $table->text('consumer_secret');                 // Encrypted
            $table->text('webhook_secret')->nullable();      // Encrypted — for signature verification
            $table->text('api_token')->nullable();           // Encrypted — token given to the plugin
            $table->enum('priority_source', ['venqore', 'woocommerce', 'manual'])->default('venqore');
            $table->boolean('auto_stage_new_products')->default(true);
            $table->json('sync_fields')->nullable();         // Which fields are active for sync
            $table->enum('status', ['active', 'paused', 'error', 'pending'])->default('pending');
            $table->timestamp('last_synced_at')->nullable();
            $table->string('billing_subscription_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['tenant_id', 'status']);
        });

        // ─── woo_product_links ────────────────────────────────────────────────
        // Maps a VenQore product to a WooCommerce product. SKU is the binding key.
        Schema::create('woo_product_links', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('connection_id');
            $table->string('venqore_product_id');            // UUID FK to products table
            $table->unsignedBigInteger('woo_product_id');   // WooCommerce product ID
            $table->string('sku');                           // The binding key — set once, never changes
            $table->enum('sync_status', ['synced', 'conflict', 'pending', 'staged', 'ignored'])->default('pending');
            $table->json('conflict_data')->nullable();       // Stores both sides when conflict detected
            $table->json('synced_fields')->nullable();       // Field-level last sync snapshot
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->foreign('connection_id')->references('id')->on('woo_connections')->onDelete('cascade');
            $table->index(['connection_id', 'sync_status']);
            $table->index('sku');
            $table->unique(['connection_id', 'venqore_product_id']);
            $table->unique(['connection_id', 'woo_product_id']);
        });

        // ─── woo_sync_queue ───────────────────────────────────────────────────
        // All pending sync operations, staged or awaiting processing.
        Schema::create('woo_sync_queue', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('connection_id');
            $table->enum('direction', ['to_woo', 'from_woo']);
            $table->unsignedBigInteger('product_link_id')->nullable(); // null for new/unlinked products
            $table->json('payload');                                    // Full product data snapshot
            $table->enum('status', ['staged', 'approved', 'processing', 'done', 'failed'])->default('staged');
            $table->enum('triggered_by', ['webhook', 'manual', 'scheduler'])->default('webhook');
            $table->text('error_message')->nullable();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('process_after')->nullable();             // For retry back-off
            $table->timestamps();

            $table->foreign('connection_id')->references('id')->on('woo_connections')->onDelete('cascade');
            $table->foreign('product_link_id')->references('id')->on('woo_product_links')->onDelete('set null');
            $table->index(['connection_id', 'status']);
            $table->index(['status', 'process_after']);
        });

        // ─── woo_sync_logs ────────────────────────────────────────────────────
        // Append-only audit log of every sync event.
        Schema::create('woo_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('connection_id');
            $table->unsignedBigInteger('product_link_id')->nullable();
            $table->string('action');                       // e.g. price_updated, product_created, conflict_flagged
            $table->enum('direction', ['to_woo', 'from_woo', 'internal'])->default('internal');
            $table->json('before')->nullable();             // State before change
            $table->json('after')->nullable();              // State after change
            $table->string('performed_by')->default('system'); // 'system' or user_id string
            $table->timestamps();

            $table->foreign('connection_id')->references('id')->on('woo_connections')->onDelete('cascade');
            $table->foreign('product_link_id')->references('id')->on('woo_product_links')->onDelete('set null');
            $table->index(['connection_id', 'created_at']);
            $table->index(['product_link_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('woo_sync_logs');
        Schema::dropIfExists('woo_sync_queue');
        Schema::dropIfExists('woo_product_links');
        Schema::dropIfExists('woo_connections');
    }
};
