<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|==============================================================================
| STEP 10 — tenant_config_versions
|==============================================================================
|
| AI safety rule 10: "Every configuration operation is versioned and revertible."
|
| WHAT MAKES A VERSION TABLE WORTH HAVING
| ---------------------------------------
| Most of them are write-only. Somebody adds a snapshot column, nobody ever
| builds the restore path, and the first time a customer needs it you discover
| the blob does not contain enough to rebuild anything.
|
| So this table stores the FULL resolved state, not a diff:
|   - every enabled module key
|   - the terminology overrides in force
|   - the dashboard card layout
|
| Restoring is then "write this state", not "replay these operations backwards"
| — which is the difference between an undo that works and an undo that mostly
| works.
|
| WHY 'reason' AND 'actor' ARE NOT OPTIONAL
| -----------------------------------------
| Six months from now, someone will ask why their Inventory module went away on
| a Tuesday. Without these two columns the answer is a shrug. With them it is
| "the AI builder proposed it and you approved it on 14 March".
|==============================================================================
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_config_versions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');

            // Monotonic per tenant. Version 1 is the state at first configuration.
            $table->unsignedInteger('version');

            // THE FULL RESOLVED STATE — not a diff. See the note above.
            $table->json('modules');            // enabled module keys
            $table->json('terminology')->nullable();
            $table->json('dashboard')->nullable();

            // Who did this and why. preset | ai | user | system | restore
            $table->string('source', 16)->default('user');
            $table->string('reason', 255)->nullable();
            $table->unsignedBigInteger('actor_id')->nullable();

            // Set when this version was created BY restoring an earlier one, so
            // the history reads honestly instead of looking like a fresh choice.
            $table->unsignedInteger('restored_from')->nullable();

            $table->timestamps();

            $table->unique(['tenant_id', 'version']);
            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_config_versions');
    }
};
