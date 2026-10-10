<?php

namespace Tests\Support;

use App\Services\Reconciliation\SaleReconciliation;

/**
 * Run the read-only reconciliation report over everything a test wrote,
 * BEFORE its transaction is rolled back (sale reliability plan §5: a scan of
 * an empty database proves nothing). Any blocker fails the test.
 */
trait ReconcilesBeforeRollback
{
    protected function tearDown(): void
    {
        $blockers = [];
        try {
            if (isset($this->tenant) && $this->status()->isSuccess()) {
                $blockers = array_values(array_filter(
                    app(SaleReconciliation::class)->run($this->tenant->id, '2000-01-01', now()->addYear()->toDateString()),
                    fn ($f) => $f['severity'] === 'blocker'
                ));
            }
        } finally {
            parent::tearDown(); // always roll back, even when the report fails
        }
        $this->assertSame([], $blockers, 'reconciliation found differences in what this test wrote');
    }
}
