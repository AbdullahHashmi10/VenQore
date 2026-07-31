<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SmartCapture learning memory.
 *
 * Every time a user confirms or corrects what the AI read on the review screen,
 * the mapping "this wording -> this product/party/category" is remembered
 * against the STORE (tenant), not the individual user, so the whole team
 * benefits and the scan gets sharper with every document.
 *
 * On the next scan these aliases are (a) fed to the model as this store's
 * confirmed vocabulary and (b) applied server-side as an exact-match shortcut
 * before fuzzy matching runs.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('smart_capture_aliases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');

            // What kind of thing was resolved: product | party | expense_category
            $table->string('kind', 16);

            // Disambiguates within a kind: 'customer' / 'supplier' for parties,
            // empty string otherwise. Kept non-null so the unique index works
            // (MySQL treats NULLs as distinct, which would allow duplicates).
            $table->string('scope', 16)->default('');

            // Normalized lookup key (lowercased, punctuation stripped,
            // local numerals folded to Western digits).
            $table->string('source_key', 160);

            // What the AI actually read, kept verbatim for auditing and for
            // showing "learned from: <original wording>" in the UI.
            $table->string('source_text', 191);

            // The record the user picked.
            $table->uuid('target_id');
            $table->string('target_label', 191);

            // Strength of the memory. Incremented atomically on every reuse.
            $table->unsignedInteger('hits')->default(1);
            $table->timestamp('last_used_at')->nullable();

            // Attribution, so a bad lesson can be traced and undone.
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();

            $table->timestamps();

            // One memory per store per wording per kind.
            $table->unique(['tenant_id', 'kind', 'scope', 'source_key'], 'sc_alias_unique');

            // Ranking query: strongest, most recent aliases for a store.
            $table->index(['tenant_id', 'kind', 'hits'], 'sc_alias_rank');

            // Lets us clean up aliases when a product/party is deleted.
            $table->index(['tenant_id', 'target_id'], 'sc_alias_target');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('smart_capture_aliases');
    }
};
