<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
|==============================================================================
| STEP 5 — tenant_modules
|==============================================================================
|
| WHAT THIS TABLE IS
| ------------------
| The answer to "which of the 46 modules does THIS business use?"
|
| It is deliberately NOT the answer to "what did they pay for". That stays in
| tenant_plan_overrides + plans, and the two must never be conflated:
|
|     ENTITLEMENT  = what they bought      (plans)          — money
|     CONFIGURATION = what they switched on (tenant_modules) — free, always
|
| Under the usage-based billing model every module is included on every plan,
| so in practice entitlement stops gating modules entirely — but keeping the
| tables separate is what makes that a one-line policy change rather than a
| rewrite.
|
| WHY THERE IS NO FOREIGN KEY ON module_key
| -----------------------------------------
| Module keys live in config/modules.php, not in a table. That is on purpose:
| the registry is code, it is reviewed in pull requests, and it is validated by
| ModuleRegistryIntegrityTest. A modules table would mean two sources of truth
| that drift.
|
| WHY 'source' MATTERS
| --------------------
| When a customer asks "why is Inventory on?", the answer is in this column:
|   system  — backfilled from what they already had. Never surprise them.
|   preset  — they picked a template.
|   ai      — the builder proposed it and they approved it.
|   user    — they toggled it themselves.
| Without this you cannot tell a deliberate choice from a migration artefact,
| and support becomes guesswork.
|
| THE BACKFILL IS THE DANGEROUS PART — read the down() note too.
|==============================================================================
*/

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_modules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('module_key', 64);

            // Disabling HIDES. It never deletes. Re-enabling restores everything,
            // which is why this is a boolean and not a row you remove.
            $table->boolean('enabled')->default(true);

            $table->enum('source', ['preset', 'ai', 'user', 'system'])->default('system');

            // Per-module settings for later (V1.2 field-level config). Nullable
            // and unused today — present so adding it later is not a migration
            // against a large table.
            $table->json('config')->nullable();

            $table->timestamps();

            $table->unique(['tenant_id', 'module_key']);
            $table->index(['tenant_id', 'enabled']);
        });

        /*
        |----------------------------------------------------------------------
        | BACKFILL — every existing tenant keeps exactly what they have today
        |----------------------------------------------------------------------
        | ACCEPTANCE CRITERION FROM THE BUILD PLAN, WORD FOR WORD:
        |
        |     "existing tenant nav/routes/permissions/reports BYTE-IDENTICAL
        |      before and after."
        |
        | So we enable EVERYTHING for every existing tenant. Not "what we think
        | they use" — everything. A customer who logs in the day after this
        | deploys must not be able to tell it happened.
        |
        | Narrowing their system is a product decision they make in the builder,
        | on their own time. It is not a migration's decision to make at 3am.
        |
        | Note ModuleService also fails OPEN for any tenant with zero rows here,
        | so even if this backfill misses a tenant (created mid-deploy, say),
        | nobody is locked out. Two independent safety rails, because being
        | wrong here means every customer loses their software at once.
        */
        $moduleKeys = array_keys(config('modules', []));

        if (empty($moduleKeys) || !Schema::hasTable('tenants')) {
            return;
        }

        $now = now();

        DB::table('tenants')->select('id')->orderBy('id')->chunk(200, function ($tenants) use ($moduleKeys, $now) {
            $rows = [];

            foreach ($tenants as $tenant) {
                foreach ($moduleKeys as $key) {
                    $rows[] = [
                        'tenant_id'  => $tenant->id,
                        'module_key' => $key,
                        'enabled'    => true,
                        'source'     => 'system',
                        'config'     => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            foreach (array_chunk($rows, 500) as $batch) {
                DB::table('tenant_modules')->insertOrIgnore($batch);
            }
        });
    }

    /*
    | Dropping this table returns every tenant to "no configuration", which
    | ModuleService reads as "everything enabled". That is the correct rollback:
    | a failed deploy gives customers MORE of their software, never less.
    */
    public function down(): void
    {
        Schema::dropIfExists('tenant_modules');
    }
};
