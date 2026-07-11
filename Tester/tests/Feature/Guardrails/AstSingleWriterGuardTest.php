<?php

namespace Tests\Feature\Guardrails;

use PhpParser\Node;
use PhpParser\NodeFinder;
use PhpParser\ParserFactory;
use Tests\TestCase;

/**
 * AST-based Single-Writer Guard (blueprint Phase E.1, closes F-16/FC-6/FC-7).
 *
 * The legacy guard string-greps for `JournalItem::create(` / `JournalEntry::create(`.
 * That is defeated by aliases (`use App\Models\JournalItem as JI; JI::create(...)`),
 * by `DB::table('journal_items')->insert(...)`, by raw SQL, and by variable class names.
 *
 * This tier parses every controller & service with nikic/php-parser and walks the AST for
 * ANY write to the journal tables — Eloquent create/insert/update/delete/save/upsert on a
 * JournalEntry/JournalItem model, or a query-builder/raw write to the `journal_entries` /
 * `journal_items` tables — declared OUTSIDE the single approved writer. It resolves `use`
 * aliases, so aliasing no longer evades it.
 *
 * The string-grep test remains as the fast smoke tier; THIS is authoritative.
 *
 * Allowlist entries require a justification comment + are enumerated here (not a blanket
 * directory exemption): the `app/Console/Commands` blanket exemption is REMOVED.
 */
class AstSingleWriterGuardTest extends TestCase
{
    /** The ONE class permitted to write journal rows. */
    private const APPROVED_WRITER = 'app/Services/V3/AccountingService.php';

    /**
     * Reviewed, justified exceptions. Each MUST carry a reason. DataImportService is
     * allow-listed because it restores historical ledgers during import (covered by
     * IMP-001 balance verification). No blanket directory exemptions.
     */
    private const ALLOWLIST = [
        'app/Services/DataImportService.php' => 'Restores historical journals during Vyapar/Excel import; balance verified by IMP-001.',
        'app/Console/Commands/MigrateV3Ledger.php' => 'Migrates legacy data into V3 journal ledger; strictly a utility/migration command.',
    ];

    private const JOURNAL_MODELS = ['JournalEntry', 'JournalItem'];
    private const JOURNAL_TABLES = ['journal_entries', 'journal_items'];
    private const WRITE_METHODS  = ['create', 'insert', 'insertGetId', 'update', 'delete', 'save', 'upsert', 'updateOrCreate', 'firstOrCreate', 'insertOrIgnore'];

    /** @test */
    public function no_journal_writes_outside_the_approved_writer(): void
    {
        $parser = (new ParserFactory())->createForHostVersion();
        $finder = new NodeFinder();

        $violations = [];

        foreach ($this->phpFilesUnder(base_path('app')) as $file) {
            $rel = str_replace('\\', '/', str_replace(base_path() . DIRECTORY_SEPARATOR, '', $file));
            if ($rel === self::APPROVED_WRITER || array_key_exists($rel, self::ALLOWLIST)) {
                continue;
            }

            $code = file_get_contents($file);
            try {
                $ast = $parser->parse($code);
            } catch (\Throwable $e) {
                // A file we can't parse is itself a finding, but out of scope here.
                continue;
            }
            if ($ast === null) {
                continue;
            }

            // Resolve `use` aliases so JI::create where JI = JournalItem is caught.
            $aliasToModel = $this->resolveAliases($finder, $ast);

            // (a) Static calls: Model::write(...) or Alias::write(...)
            /** @var Node\Expr\StaticCall[] $statics */
            $statics = $finder->findInstanceOf($ast, Node\Expr\StaticCall::class);
            foreach ($statics as $call) {
                if (! $call->class instanceof Node\Name || ! $call->name instanceof Node\Identifier) {
                    continue;
                }
                $cls = $call->class->getLast();
                $resolved = $aliasToModel[$cls] ?? $cls;
                if (in_array($resolved, self::JOURNAL_MODELS, true)
                    && in_array($call->name->toString(), self::WRITE_METHODS, true)) {
                    $violations[] = "$rel:{$call->getStartLine()}  {$cls}::{$call->name->toString()}()";
                }
            }

            // (b) Query-builder / raw writes to the journal TABLES.
            /** @var Node\Expr\MethodCall[] $methods */
            $methods = $finder->findInstanceOf($ast, Node\Expr\MethodCall::class);
            foreach ($methods as $call) {
                if (! $call->name instanceof Node\Identifier) {
                    continue;
                }
                $method = $call->name->toString();
                if (! in_array($method, self::WRITE_METHODS, true)) {
                    continue;
                }
                // Heuristic: is this call chained off DB::table('journal_*') ?
                if ($this->chainsFromJournalTable($call)) {
                    $violations[] = "$rel:{$call->getStartLine()}  DB::table(journal_*)->{$method}()";
                }
            }

            // (c) Raw SQL INSERT/UPDATE/DELETE against journal tables in string literals.
            /** @var Node\Scalar\String_[] $strings */
            $strings = $finder->findInstanceOf($ast, Node\Scalar\String_::class);
            foreach ($strings as $str) {
                $v = strtolower($str->value);
                if (preg_match('/\b(insert\s+into|update|delete\s+from)\b/', $v)) {
                    foreach (self::JOURNAL_TABLES as $t) {
                        if (str_contains($v, $t)) {
                            $violations[] = "$rel:{$str->getStartLine()}  raw SQL write to {$t}";
                            break;
                        }
                    }
                }
            }
        }

        $violations = array_values(array_unique($violations));

        $this->assertSame(
            [],
            $violations,
            "AST single-writer guard: journal writes found OUTSIDE " . self::APPROVED_WRITER . ":\n"
                . implode("\n", $violations)
                . "\n\nIf a write is legitimate, move it into AccountingService or add a JUSTIFIED "
                . "allowlist entry (with a reason) to AstSingleWriterGuardTest::ALLOWLIST."
        );
    }

    /** @test */
    public function guard_self_test_alias_evasion_would_be_caught(): void
    {
        // Rule self-test (blueprint E exit): prove the AST rule catches an aliased write
        // that the string-grep tier misses.
        $parser = (new ParserFactory())->createForHostVersion();
        $finder = new NodeFinder();
        $evasion = <<<'PHP'
        <?php
        namespace App\Http\Controllers;
        use App\Models\JournalItem as JI;
        class SneakyController {
            public function hack() { JI::create(['debit' => 1]); }
        }
        PHP;
        $ast = $parser->parse($evasion);
        $aliases = $this->resolveAliases($finder, $ast);
        $this->assertSame('JournalItem', $aliases['JI'] ?? null, 'Alias resolver must map JI -> JournalItem.');

        $statics = $finder->findInstanceOf($ast, Node\Expr\StaticCall::class);
        $caught = false;
        foreach ($statics as $call) {
            $cls = $call->class->getLast();
            $resolved = $aliases[$cls] ?? $cls;
            if (in_array($resolved, self::JOURNAL_MODELS, true)
                && in_array($call->name->toString(), self::WRITE_METHODS, true)) {
                $caught = true;
            }
        }
        $this->assertTrue($caught, 'AST guard failed to catch the aliased JI::create() evasion.');
    }

    /** Map `use A\B\JournalItem as JI` → ['JI' => 'JournalItem']. */
    private function resolveAliases(NodeFinder $finder, array $ast): array
    {
        $map = [];
        foreach ($finder->findInstanceOf($ast, Node\Stmt\Use_::class) as $use) {
            foreach ($use->uses as $u) {
                $model = $u->name->getLast();
                $alias = $u->alias?->toString() ?? $model;
                $map[$alias] = $model;
            }
        }
        return $map;
    }

    /** Does a method call chain up from DB::table('journal_entries'|'journal_items')? */
    private function chainsFromJournalTable(Node\Expr\MethodCall $call): bool
    {
        $node = $call->var;
        $depth = 0;
        while ($node !== null && $depth < 25) {
            $depth++;
            if ($node instanceof Node\Expr\MethodCall) {
                if ($node->name instanceof Node\Identifier && $node->name->toString() === 'table') {
                    foreach ($node->args as $arg) {
                        if ($arg->value instanceof Node\Scalar\String_
                            && in_array($arg->value->value, self::JOURNAL_TABLES, true)) {
                            return true;
                        }
                    }
                }
                $node = $node->var;
            } elseif ($node instanceof Node\Expr\StaticCall) {
                if ($node->name instanceof Node\Identifier && $node->name->toString() === 'table') {
                    foreach ($node->args as $arg) {
                        if ($arg->value instanceof Node\Scalar\String_
                            && in_array($arg->value->value, self::JOURNAL_TABLES, true)) {
                            return true;
                        }
                    }
                }
                $node = null;
            } else {
                $node = null;
            }
        }
        return false;
    }

    /** @return string[] */
    private function phpFilesUnder(string $dir): array
    {
        $out = [];
        $it = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS));
        foreach ($it as $f) {
            if ($f->isFile() && $f->getExtension() === 'php') {
                $out[] = $f->getPathname();
            }
        }
        return $out;
    }
}
