<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Growth Engine V2 — Schema Foundation
 * ────────────────────────────────────────────────────────────────────────────
 * The V1 Growth Engine emitted fire-and-forget rows into `ai_recommendations`
 * with no identity, no lifecycle and no memory. Every nightly run either
 * duplicated a signal or silently skipped it, and nothing ever recorded
 * whether a recommendation turned out to be TRUE. That made the engine
 * impossible to improve: there was no feedback signal to learn from.
 *
 * V2 introduces four ideas:
 *
 *   1. SIGNAL IDENTITY   — every insight has a deterministic `signal_key`, so
 *                          the same real-world condition maps to the same row
 *                          across runs. Re-running is idempotent; the engine
 *                          can run every hour without spamming the owner.
 *
 *   2. LIFECYCLE         — open → acted / dismissed / snoozed / resolved /
 *                          expired. Dismissals are remembered, so a signal the
 *                          owner rejected does not come back tomorrow.
 *
 *   3. OUTCOMES          — every signal is graded AFTER the fact (hit / miss),
 *                          with the realised rupee value attached. This is the
 *                          raw material the engine matures on.
 *
 *   4. MEMORY            — rolling per-tenant statistics (`growth_brain_stats`),
 *                          daily KPI snapshots (`growth_metric_snapshots`) and
 *                          pre-computed customer/product intelligence give the
 *                          brains history instead of a single-point-in-time view.
 *
 * Strictly MySQL (per project policy). All tenant-scoped tables carry tenant_id.
 */
return new class extends Migration {
    public function up(): void
    {
        // ─────────────────────────────────────────────────────────────────
        // 1. ai_recommendations — from "alert row" to "tracked signal"
        // ─────────────────────────────────────────────────────────────────
        if (Schema::hasTable('ai_recommendations')) {
            // The V1 `type` column was an ENUM locked to 4 values
            // (retention/forecast/churn/recovery). V2 emits ~20 insight types,
            // so it has to become a string first.
            if (Schema::hasColumn('ai_recommendations', 'type')) {
                Schema::table('ai_recommendations', function (Blueprint $t) {
                    $t->string('type', 48)->default('retention')->change();
                });
            }
            if (Schema::hasColumn('ai_recommendations', 'priority')) {
                Schema::table('ai_recommendations', function (Blueprint $t) {
                    $t->string('priority', 16)->default('medium')->change();
                });
            }

            Schema::table('ai_recommendations', function (Blueprint $t) {
                if (!Schema::hasColumn('ai_recommendations', 'brain')) {
                    // 'customer' | 'inventory' | 'cash'
                    $t->string('brain', 24)->default('customer')->after('tenant_id');
                }
                if (!Schema::hasColumn('ai_recommendations', 'signal_key')) {
                    // Deterministic identity: sha1(tenant|type|subject-id|bucket)
                    $t->string('signal_key', 191)->nullable()->after('type');
                }
                if (!Schema::hasColumn('ai_recommendations', 'confidence')) {
                    // 0–100. How sure the brain is. Drives ranking + suppression.
                    $t->decimal('confidence', 5, 2)->default(50)->after('priority');
                }
                if (!Schema::hasColumn('ai_recommendations', 'impact_score')) {
                    // Composite ranking score = f(money at stake, confidence,
                    // urgency, historical precision of this insight type).
                    $t->decimal('impact_score', 12, 4)->default(0)->after('confidence');
                }
                if (!Schema::hasColumn('ai_recommendations', 'status')) {
                    // open | acted | dismissed | snoozed | resolved | expired
                    $t->string('status', 16)->default('open')->after('impact_score');
                }
                if (!Schema::hasColumn('ai_recommendations', 'evidence')) {
                    // The numbers behind the claim, so the owner can audit it.
                    $t->json('evidence')->nullable()->after('data');
                }
                if (!Schema::hasColumn('ai_recommendations', 'first_seen_at')) {
                    $t->timestamp('first_seen_at')->nullable();
                }
                if (!Schema::hasColumn('ai_recommendations', 'last_generated_at')) {
                    $t->timestamp('last_generated_at')->nullable();
                }
                if (!Schema::hasColumn('ai_recommendations', 'seen_count')) {
                    // How many runs have re-confirmed this signal. A signal that
                    // keeps re-confirming is more real than a one-off blip.
                    $t->unsignedInteger('seen_count')->default(1);
                }
                if (!Schema::hasColumn('ai_recommendations', 'acted_at')) {
                    $t->timestamp('acted_at')->nullable();
                }
                if (!Schema::hasColumn('ai_recommendations', 'dismissed_at')) {
                    $t->timestamp('dismissed_at')->nullable();
                }
                if (!Schema::hasColumn('ai_recommendations', 'snoozed_until')) {
                    $t->timestamp('snoozed_until')->nullable();
                }
                if (!Schema::hasColumn('ai_recommendations', 'resolved_at')) {
                    $t->timestamp('resolved_at')->nullable();
                }
                // ── Outcome grading (the maturing loop) ──────────────────
                if (!Schema::hasColumn('ai_recommendations', 'outcome')) {
                    // pending | hit | miss | unclear
                    $t->string('outcome', 16)->default('pending');
                }
                if (!Schema::hasColumn('ai_recommendations', 'outcome_checked_at')) {
                    $t->timestamp('outcome_checked_at')->nullable();
                }
                if (!Schema::hasColumn('ai_recommendations', 'outcome_due_at')) {
                    // When the prediction becomes gradeable (e.g. "will churn
                    // within 14 days" is gradeable 14 days from now).
                    $t->timestamp('outcome_due_at')->nullable();
                }
                if (!Schema::hasColumn('ai_recommendations', 'outcome_value')) {
                    // Realised rupees attributable to this signal.
                    $t->decimal('outcome_value', 20, 4)->default(0);
                }
                if (!Schema::hasColumn('ai_recommendations', 'outcome_note')) {
                    $t->string('outcome_note', 255)->nullable();
                }
                if (!Schema::hasColumn('ai_recommendations', 'deleted_at')) {
                    $t->softDeletes();
                }
            });

            // ── Indexes ──────────────────────────────────────────────────
            // V1 had ZERO composite indexes here. Every dashboard load did a
            // filesort over the whole table.
            // ── Retire V1 rows ───────────────────────────────────────────
            // Every existing row was produced by the V1 brains, which read the
            // `invoices` table filtered to `type = 'sale'` — a filter that
            // matched nothing, because every writer of that table sets
            // 'purchase'. Any rows that DO exist are therefore either from
            // seeded demo data or from the handful of code paths that wrote
            // purchase invoices, and none of them carry a signal_key, an
            // impact score or a gradeable outcome.
            //
            // They are marked 'expired' rather than deleted: the owner's
            // read/dismiss history stays intact and auditable, but the V2
            // feed starts clean instead of mixing in stale, un-rankable rows
            // whose `type` values are not in the new catalog.
            \Illuminate\Support\Facades\DB::table('ai_recommendations')
                ->whereNull('signal_key')
                ->update(['status' => 'expired', 'outcome' => 'unclear']);

            $this->addIndex('ai_recommendations', ['tenant_id', 'status', 'impact_score'], 'ai_rec_feed_idx');
            $this->addIndex('ai_recommendations', ['tenant_id', 'signal_key'], 'ai_rec_signal_idx');
            $this->addIndex('ai_recommendations', ['tenant_id', 'brain', 'type'], 'ai_rec_brain_idx');
            $this->addIndex('ai_recommendations', ['outcome', 'outcome_due_at'], 'ai_rec_outcome_idx');
        }

        // ─────────────────────────────────────────────────────────────────
        // 2. customer_analytics — from 7 columns to a real RFM profile
        // ─────────────────────────────────────────────────────────────────
        if (Schema::hasTable('customer_analytics')) {
            if (Schema::hasColumn('customer_analytics', 'status')) {
                Schema::table('customer_analytics', function (Blueprint $t) {
                    $t->string('status', 24)->default('active')->change();
                });
            }

            Schema::table('customer_analytics', function (Blueprint $t) {
                $cols = [
                    // ── RFM ──────────────────────────────────────────────
                    'recency_days'            => fn () => $t->unsignedInteger('recency_days')->nullable(),
                    'frequency_90d'           => fn () => $t->unsignedInteger('frequency_90d')->default(0),
                    'monetary_90d'            => fn () => $t->decimal('monetary_90d', 20, 4)->default(0),
                    'rfm_r'                   => fn () => $t->unsignedTinyInteger('rfm_r')->default(0),
                    'rfm_f'                   => fn () => $t->unsignedTinyInteger('rfm_f')->default(0),
                    'rfm_m'                   => fn () => $t->unsignedTinyInteger('rfm_m')->default(0),
                    'segment'                 => fn () => $t->string('segment', 32)->nullable(),
                    // ── Profitability (V1 knew revenue but never margin) ──
                    'total_margin'            => fn () => $t->decimal('total_margin', 20, 4)->default(0),
                    'margin_pct'              => fn () => $t->decimal('margin_pct', 8, 4)->default(0),
                    // ── Prediction quality ───────────────────────────────
                    'order_interval_stddev'   => fn () => $t->decimal('order_interval_stddev', 10, 2)->nullable(),
                    'prediction_confidence'   => fn () => $t->decimal('prediction_confidence', 5, 2)->default(0),
                    // ── Trend ────────────────────────────────────────────
                    'trend'                   => fn () => $t->string('trend', 16)->nullable(),
                    'trend_pct'               => fn () => $t->decimal('trend_pct', 10, 2)->default(0),
                    // ── Behaviour ────────────────────────────────────────
                    'distinct_products'       => fn () => $t->unsignedInteger('distinct_products')->default(0),
                    'basket_size_avg'         => fn () => $t->decimal('basket_size_avg', 10, 2)->default(0),
                    'preferred_dow'           => fn () => $t->unsignedTinyInteger('preferred_dow')->nullable(),
                    'preferred_hour'          => fn () => $t->unsignedTinyInteger('preferred_hour')->nullable(),
                    'returns_count'           => fn () => $t->unsignedInteger('returns_count')->default(0),
                    'first_order_date'        => fn () => $t->date('first_order_date')->nullable(),
                    'lifetime_days'           => fn () => $t->unsignedInteger('lifetime_days')->default(0),
                    'predicted_clv'           => fn () => $t->decimal('predicted_clv', 20, 4)->default(0),
                    'outstanding_balance'     => fn () => $t->decimal('outstanding_balance', 20, 4)->default(0),
                    'last_computed_at'        => fn () => $t->timestamp('last_computed_at')->nullable(),
                ];
                foreach ($cols as $name => $make) {
                    if (!Schema::hasColumn('customer_analytics', $name)) {
                        $make();
                    }
                }
            });

            $this->addIndex('customer_analytics', ['tenant_id', 'status'], 'cust_analytics_status_idx');
            $this->addIndex('customer_analytics', ['tenant_id', 'segment'], 'cust_analytics_segment_idx');
            $this->addIndex('customer_analytics', ['tenant_id', 'predicted_next_order'], 'cust_analytics_next_idx');
        }

        // ─────────────────────────────────────────────────────────────────
        // 3. product_analytics — the inventory brain's memory (NEW)
        //    V1 had no product-level intelligence at all. It could only ever
        //    see "this customer might reorder"; it could never see velocity,
        //    dead stock, margin erosion or days-of-cover.
        // ─────────────────────────────────────────────────────────────────
        if (!Schema::hasTable('product_analytics')) {
            Schema::create('product_analytics', function (Blueprint $t) {
                $t->uuid('id')->primary();
                $t->unsignedBigInteger('tenant_id')->index();
                $t->uuid('product_id');

                // Velocity (units/day) over multiple windows so trend is visible
                $t->decimal('velocity_7d', 14, 4)->default(0);
                $t->decimal('velocity_30d', 14, 4)->default(0);
                $t->decimal('velocity_90d', 14, 4)->default(0);
                $t->decimal('velocity_trend_pct', 10, 2)->default(0);

                $t->decimal('qty_sold_30d', 16, 4)->default(0);
                $t->decimal('revenue_30d', 20, 4)->default(0);
                $t->decimal('margin_30d', 20, 4)->default(0);
                $t->decimal('margin_pct_30d', 8, 4)->default(0);
                $t->decimal('margin_pct_prev_30d', 8, 4)->default(0);

                $t->decimal('current_stock', 16, 4)->default(0);
                $t->decimal('stock_value', 20, 4)->default(0);
                // NULL = never runs out at current velocity (i.e. dead stock)
                $t->decimal('days_of_cover', 12, 2)->nullable();
                $t->date('projected_stockout_date')->nullable();
                $t->date('last_sold_date')->nullable();
                $t->date('last_purchased_date')->nullable();
                $t->unsignedInteger('days_since_last_sale')->nullable();

                $t->unsignedInteger('distinct_buyers_90d')->default(0);
                $t->decimal('return_rate_90d', 8, 4)->default(0);
                $t->decimal('avg_discount_pct_30d', 8, 4)->default(0);

                // dead | slow | steady | fast | rising | falling
                $t->string('movement_class', 24)->nullable();
                // ABC classification by revenue contribution
                $t->char('abc_class', 1)->nullable();

                $t->timestamp('last_computed_at')->nullable();
                $t->timestamps();

                $t->unique(['tenant_id', 'product_id'], 'product_analytics_unique');
                $t->index(['tenant_id', 'movement_class'], 'product_analytics_move_idx');
                $t->index(['tenant_id', 'days_of_cover'], 'product_analytics_cover_idx');
            });
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. growth_brain_stats — per-tenant, per-insight-type precision.
        //    THIS is what makes the engine mature. Each row is the running
        //    track record of one insight type for one tenant, and it feeds
        //    directly back into ranking + auto-tuned thresholds.
        // ─────────────────────────────────────────────────────────────────
        if (!Schema::hasTable('growth_brain_stats')) {
            Schema::create('growth_brain_stats', function (Blueprint $t) {
                $t->uuid('id')->primary();
                $t->unsignedBigInteger('tenant_id')->index();
                $t->string('brain', 24);
                $t->string('insight_type', 48);

                $t->unsignedInteger('generated_count')->default(0);
                $t->unsignedInteger('acted_count')->default(0);
                $t->unsignedInteger('dismissed_count')->default(0);
                $t->unsignedInteger('ignored_count')->default(0);
                $t->unsignedInteger('hit_count')->default(0);
                $t->unsignedInteger('miss_count')->default(0);

                // hit / (hit + miss). The honesty metric.
                $t->decimal('precision_pct', 6, 2)->default(0);
                // acted / generated. The usefulness metric.
                $t->decimal('engagement_pct', 6, 2)->default(0);
                // Rupees the owner actually recovered because of this type.
                $t->decimal('realised_value', 20, 4)->default(0);

                // Multiplier applied to this type's threshold. Rises when the
                // type is accurate + engaged, falls when it is noisy.
                $t->decimal('sensitivity', 6, 3)->default(1.000);
                // Auto-suppression: too noisy → stop showing until it recovers.
                $t->boolean('is_muted')->default(false);
                $t->timestamp('muted_until')->nullable();
                $t->string('mute_reason', 255)->nullable();

                // Free-form learned parameters per type (e.g. tuned z-scores)
                $t->json('learned_params')->nullable();

                $t->timestamp('last_generated_at')->nullable();
                $t->timestamp('last_tuned_at')->nullable();
                $t->timestamps();

                $t->unique(['tenant_id', 'insight_type'], 'growth_brain_stats_unique');
            });
        }

        // ─────────────────────────────────────────────────────────────────
        // 5. growth_metric_snapshots — a daily KPI time-series per tenant.
        //    Without history a "brain" can only compare today against a
        //    hardcoded constant. With it, the engine can detect anomalies
        //    against the tenant's OWN baseline — which is the whole game.
        // ─────────────────────────────────────────────────────────────────
        if (!Schema::hasTable('growth_metric_snapshots')) {
            Schema::create('growth_metric_snapshots', function (Blueprint $t) {
                $t->uuid('id')->primary();
                $t->unsignedBigInteger('tenant_id');
                $t->date('snapshot_date');

                $t->decimal('revenue', 20, 4)->default(0);
                $t->decimal('gross_margin', 20, 4)->default(0);
                $t->decimal('margin_pct', 8, 4)->default(0);
                $t->decimal('cogs', 20, 4)->default(0);
                $t->decimal('discount_given', 20, 4)->default(0);
                $t->unsignedInteger('order_count')->default(0);
                $t->decimal('avg_order_value', 20, 4)->default(0);
                $t->decimal('avg_basket_size', 10, 2)->default(0);
                $t->unsignedInteger('unique_customers')->default(0);
                $t->unsignedInteger('new_customers')->default(0);
                $t->unsignedInteger('returning_customers')->default(0);
                $t->decimal('returns_value', 20, 4)->default(0);
                $t->decimal('receivables_outstanding', 20, 4)->default(0);
                $t->decimal('payables_outstanding', 20, 4)->default(0);
                $t->decimal('cash_collected', 20, 4)->default(0);
                $t->decimal('inventory_value', 20, 4)->default(0);
                $t->unsignedInteger('stockout_count')->default(0);
                $t->json('extras')->nullable();
                $t->timestamps();

                $t->unique(['tenant_id', 'snapshot_date'], 'growth_snapshot_unique');
                $t->index(['tenant_id', 'snapshot_date'], 'growth_snapshot_lookup_idx');
            });
        }

        // ─────────────────────────────────────────────────────────────────
        // 6. growth_runs — observability + incremental scheduling.
        //    Lets the scheduler skip tenants with no new activity (the whole
        //    reason V1 "stressed the server"), and gives support a log of
        //    what ran, how long it took and what it produced.
        // ─────────────────────────────────────────────────────────────────
        if (!Schema::hasTable('growth_runs')) {
            Schema::create('growth_runs', function (Blueprint $t) {
                $t->uuid('id')->primary();
                $t->unsignedBigInteger('tenant_id')->index();
                $t->string('mode', 16)->default('deep');   // light | deep | manual
                $t->string('status', 16)->default('running'); // running|success|failed|skipped
                $t->timestamp('started_at')->nullable();
                $t->timestamp('finished_at')->nullable();
                $t->unsignedInteger('duration_ms')->default(0);
                $t->unsignedInteger('signals_created')->default(0);
                $t->unsignedInteger('signals_updated')->default(0);
                $t->unsignedInteger('signals_resolved')->default(0);
                $t->unsignedInteger('customers_analysed')->default(0);
                $t->unsignedInteger('products_analysed')->default(0);
                // High-water mark: latest sale timestamp seen. Next run skips
                // the tenant entirely if nothing newer exists.
                $t->timestamp('data_watermark')->nullable();
                $t->text('error')->nullable();
                $t->json('brain_timings')->nullable();
                $t->timestamps();

                $t->index(['tenant_id', 'status', 'created_at'], 'growth_runs_lookup_idx');
            });
        }

        // ─────────────────────────────────────────────────────────────────
        // 7. growth_signal_events — the interaction audit trail.
        //    "It should keep track of things": every view, click, act,
        //    dismiss and snooze is recorded, and that stream is what the
        //    tuner reads to decide which insight types the owner cares about.
        // ─────────────────────────────────────────────────────────────────
        if (!Schema::hasTable('growth_signal_events')) {
            Schema::create('growth_signal_events', function (Blueprint $t) {
                $t->uuid('id')->primary();
                $t->unsignedBigInteger('tenant_id')->index();
                $t->uuid('recommendation_id')->nullable();
                $t->string('insight_type', 48)->nullable();
                // shown | opened | acted | dismissed | snoozed | outcome_hit |
                // outcome_miss | expired
                $t->string('event', 32);
                $t->unsignedBigInteger('user_id')->nullable();
                $t->decimal('value', 20, 4)->default(0);
                $t->json('meta')->nullable();
                $t->timestamps();

                $t->index(['tenant_id', 'insight_type', 'event'], 'growth_events_type_idx');
                $t->index(['recommendation_id'], 'growth_events_rec_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('growth_signal_events');
        Schema::dropIfExists('growth_runs');
        Schema::dropIfExists('growth_metric_snapshots');
        Schema::dropIfExists('growth_brain_stats');
        Schema::dropIfExists('product_analytics');

        foreach ([
            'ai_rec_feed_idx', 'ai_rec_signal_idx', 'ai_rec_brain_idx', 'ai_rec_outcome_idx',
        ] as $idx) {
            $this->dropIndex('ai_recommendations', $idx);
        }
        foreach ([
            'cust_analytics_status_idx', 'cust_analytics_segment_idx', 'cust_analytics_next_idx',
        ] as $idx) {
            $this->dropIndex('customer_analytics', $idx);
        }

        // Columns are intentionally left in place on rollback: dropping them
        // would destroy accumulated outcome history, which is unrecoverable.
    }

    /**
     * Add an index only if it does not already exist.
     * Uses information_schema because Laravel has no hasIndex() helper.
     */
    private function addIndex(string $table, array $columns, string $name): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }
        foreach ($columns as $col) {
            if (!Schema::hasColumn($table, $col)) {
                return;
            }
        }
        if ($this->indexExists($table, $name)) {
            return;
        }
        Schema::table($table, function (Blueprint $t) use ($columns, $name) {
            $t->index($columns, $name);
        });
    }

    private function dropIndex(string $table, string $name): void
    {
        if (Schema::hasTable($table) && $this->indexExists($table, $name)) {
            Schema::table($table, function (Blueprint $t) use ($name) {
                $t->dropIndex($name);
            });
        }
    }

    private function indexExists(string $table, string $name): bool
    {
        $rows = \Illuminate\Support\Facades\DB::select(
            'SELECT INDEX_NAME FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1',
            [$table, $name]
        );
        return count($rows) > 0;
    }
};
