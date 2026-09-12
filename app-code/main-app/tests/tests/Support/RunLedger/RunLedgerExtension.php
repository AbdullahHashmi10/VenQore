<?php

namespace Tests\Support\RunLedger;

use PHPUnit\Event\Test\ConsideredRisky;
use PHPUnit\Event\Test\ConsideredRiskySubscriber;
use PHPUnit\Event\Test\Errored;
use PHPUnit\Event\Test\ErroredSubscriber;
use PHPUnit\Event\Test\Failed;
use PHPUnit\Event\Test\FailedSubscriber;
use PHPUnit\Event\Test\MarkedIncomplete;
use PHPUnit\Event\Test\MarkedIncompleteSubscriber;
use PHPUnit\Event\Test\Passed;
use PHPUnit\Event\Test\PassedSubscriber;
use PHPUnit\Event\Test\Prepared;
use PHPUnit\Event\Test\PreparedSubscriber;
use PHPUnit\Event\Test\Skipped;
use PHPUnit\Event\Test\SkippedSubscriber;
use PHPUnit\Event\TestRunner\ExecutionFinished;
use PHPUnit\Event\TestRunner\ExecutionFinishedSubscriber;
use PHPUnit\Event\TestRunner\ExecutionStarted;
use PHPUnit\Event\TestRunner\ExecutionStartedSubscriber;
use PHPUnit\Runner\Extension\Extension;
use PHPUnit\Runner\Extension\Facade;
use PHPUnit\Runner\Extension\ParameterCollection;
use PHPUnit\TextUI\Configuration\Configuration;

/**
 * RunLedgerExtension — PHPUnit 11 extension that turns every run into an
 * append-only Run Ledger record under Tester/VerificationCenter/runs/.
 *
 * Registered in Tester/phpunit.xml <extensions>. Closes audit FC-5's
 * evidentiary gap: "it passes" becomes a queryable artifact, not a claim.
 */
final class RunLedgerExtension implements Extension
{
    public function bootstrap(Configuration $configuration, Facade $facade, ParameterCollection $parameters): void
    {
        $facade->registerSubscribers(
            new class implements ExecutionStartedSubscriber {
                public function notify(ExecutionStarted $event): void
                {
                    RunLedgerCollector::runStarted();
                }
            },
            new class implements PreparedSubscriber {
                public function notify(Prepared $event): void
                {
                    RunLedgerCollector::testPrepared($event->test());
                }
            },
            new class implements PassedSubscriber {
                public function notify(Passed $event): void
                {
                    RunLedgerCollector::record($event->test(), 'passed');
                }
            },
            new class implements FailedSubscriber {
                public function notify(Failed $event): void
                {
                    RunLedgerCollector::record($event->test(), 'failed', $event->throwable()->message());
                }
            },
            new class implements ErroredSubscriber {
                public function notify(Errored $event): void
                {
                    RunLedgerCollector::record($event->test(), 'errored', $event->throwable()->message());
                }
            },
            new class implements SkippedSubscriber {
                public function notify(Skipped $event): void
                {
                    RunLedgerCollector::record($event->test(), 'skipped', $event->message());
                }
            },
            new class implements MarkedIncompleteSubscriber {
                public function notify(MarkedIncomplete $event): void
                {
                    RunLedgerCollector::record($event->test(), 'incomplete', $event->throwable()->message());
                }
            },
            new class implements ConsideredRiskySubscriber {
                public function notify(ConsideredRisky $event): void
                {
                    RunLedgerCollector::record($event->test(), 'risky', $event->message());
                }
            },
            new class implements ExecutionFinishedSubscriber {
                public function notify(ExecutionFinished $event): void
                {
                    RunLedgerCollector::write();
                }
            },
        );
    }
}
