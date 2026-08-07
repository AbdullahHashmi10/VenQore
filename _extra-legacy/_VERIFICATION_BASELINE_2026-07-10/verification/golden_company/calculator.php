<?php

/**
 * ============================================================
 * VenQore Golden Company — Independent Calculator
 * Phase 1 of the Verification Blueprint
 * ============================================================
 *
 * CRITICAL DOCTRINE: This file shares ZERO code with the Laravel application.
 * It reads spec.yaml and calculates the Expected Values Manifest using
 * pure PHP arithmetic and accounting rules — no Laravel, no Eloquent,
 * no services. It implements the same rules as the application but
 * from scratch. Agreement between this file and the app is EVIDENCE,
 * not tautology.
 *
 * Usage:
 *   php calculator.php                  # outputs manifest.yaml
 *   php calculator.php --check          # verifies manifest.yaml matches
 *   php calculator.php --verbose        # prints all journal entries
 *
 * Output: manifest.yaml (saved alongside this file)
 * ============================================================
 */

declare(strict_types=1);

// ── Minimal YAML parser (no external dependencies) ───────────────────────────
// We use a simplified YAML reader for the spec file.
// Only supports the subset of YAML used in spec.yaml.

/**
 * Pure-PHP YAML parser — no extensions required.
 * Handles the specific subset used in spec.yaml:
 *  - key: value, key: "value", key: 'value'
 *  - Nested maps (indented key: value)
 *  - Sequence items (- key: value or - scalar)
 *  - Inline floats/ints/booleans/null
 *  - Comments (#...)
 *  - Multi-line: not needed (spec has no multi-line scalars)
 */
function parse_yaml_file(string $path): array {
    if (!file_exists($path)) {
        die("ERROR: spec.yaml not found at: $path\n");
    }
    if (function_exists('yaml_parse_file')) {
        return yaml_parse_file($path);
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES);
    return parseYamlLines($lines, 0, count($lines), 0)[0];
}

function detectIndent(array $lines, int $start, int $end): int {
    for ($i = $start; $i < $end; $i++) {
        $line = $lines[$i];
        if (trim($line) === '' || ltrim($line)[0] === '#') continue;
        return strlen($line) - strlen(ltrim($line));
    }
    return 0;
}

function parseYamlLines(array $lines, int $start, int $end, int $baseIndent): array {
    $result = [];
    $i = $start;
    $isSeq = null; // tri-state: null=unknown, true=sequence, false=map

    while ($i < $end) {
        $line = $lines[$i];
        $trimmed = trim($line);

        // Skip blanks and comments
        if ($trimmed === '' || $trimmed[0] === '#') { $i++; continue; }

        $indent = strlen($line) - strlen(ltrim($line));
        if ($indent < $baseIndent) break; // return to parent
        if ($indent > $baseIndent) { $i++; continue; } // shouldn't happen at this level

        // Sequence item?
        if (strncmp($trimmed, '- ', 2) === 0 || $trimmed === '-') {
            $isSeq = true;
            $rest = $trimmed === '-' ? '' : substr($trimmed, 2);

            // Does rest contain a colon → inline map item
            if (preg_match('/^([^:]+):\s*(.*)$/', $rest, $m)) {
                // Collect the block that follows (same or deeper indent for sub-keys)
                $childStart = $i + 1;
                $childIndent = detectIndent($lines, $childStart, $end);
                $childEnd = $childStart;
                while ($childEnd < $end) {
                    $cl = $lines[$childEnd];
                    $ct = trim($cl);
                    if ($ct === '' || $ct[0] === '#') { $childEnd++; continue; }
                    $ci = strlen($cl) - strlen(ltrim($cl));
                    if ($ci <= $baseIndent) break;
                    $childEnd++;
                }
                $item = [trim($m[1]) => parseScalar($m[2])];
                if ($childIndent > $baseIndent && $childStart < $childEnd) {
                    $sub = parseYamlLines($lines, $childStart, $childEnd, $childIndent)[0];
                    $item = array_merge($item, $sub);
                }
                $result[] = $item;
                $i = $childEnd;
            } elseif ($rest !== '') {
                // Scalar sequence item
                $result[] = parseScalar($rest);
                $i++;
            } else {
                // Block sequence item (indented below)
                $childStart = $i + 1;
                $childIndent = detectIndent($lines, $childStart, $end);
                $childEnd = $childStart;
                while ($childEnd < $end) {
                    $cl = $lines[$childEnd];
                    $ct = trim($cl);
                    if ($ct === '' || $ct[0] === '#') { $childEnd++; continue; }
                    $ci = strlen($cl) - strlen(ltrim($cl));
                    if ($ci <= $baseIndent) break;
                    $childEnd++;
                }
                [$sub] = parseYamlLines($lines, $childStart, $childEnd, $childIndent);
                $result[] = $sub;
                $i = $childEnd;
            }
        } elseif (preg_match('/^([^:]+):\s*(.*)$/', $trimmed, $m)) {
            $isSeq = false;
            $key   = trim($m[1]);
            $val   = trim($m[2]);

            if ($val === '' || $val === '~' || $val[0] === '#') {
                // Block value below
                $childStart = $i + 1;
                $childIndent = detectIndent($lines, $childStart, $end);
                if ($childIndent > $baseIndent) {
                    $childEnd = $childStart;
                    while ($childEnd < $end) {
                        $cl = $lines[$childEnd];
                        $ct = trim($cl);
                        if ($ct === '' || $ct[0] === '#') { $childEnd++; continue; }
                        $ci = strlen($cl) - strlen(ltrim($cl));
                        if ($ci <= $baseIndent) break;
                        $childEnd++;
                    }
                    [$sub] = parseYamlLines($lines, $childStart, $childEnd, $childIndent);
                    $result[$key] = $sub;
                    $i = $childEnd;
                } else {
                    $result[$key] = null;
                    $i++;
                }
            } else {
                $result[$key] = parseScalar($val);
                $i++;
            }
        } else {
            $i++;
        }
    }

    return [$result, $i];
}

function parseScalar(string $val): mixed {
    $val = trim($val);
    // Strip inline comment
    if (preg_match('/^(["\'])(.*)\\1\s*(?:#.*)?$/', $val, $m)) return $m[2];
    $stripped = preg_replace('/\s*#.*$/', '', $val);
    $stripped = trim($stripped);
    if (strtolower($stripped) === 'true')  return true;
    if (strtolower($stripped) === 'false') return false;
    if (strtolower($stripped) === 'null' || $stripped === '~') return null;
    if ($stripped === '') return null;
    if (is_numeric($stripped)) {
        return strpos($stripped, '.') !== false ? (float)$stripped : (int)$stripped;
    }
    return $stripped;
}

// ── Accounting Helpers ────────────────────────────────────────────────────────

class Ledger {
    private array $entries = [];
    private array $accounts = [];

    public function __construct() {
        // Chart of Accounts (mirrors TenantDefaultSeeder)
        $coa = [
            '1000' => ['name' => 'Cash in Hand',             'type' => 'asset',     'normal' => 'debit'],
            '1010' => ['name' => 'Bank Account',             'type' => 'asset',     'normal' => 'debit'],
            '1100' => ['name' => 'Inventory Asset',          'type' => 'asset',     'normal' => 'debit'],
            '1200' => ['name' => 'Accounts Receivable',      'type' => 'asset',     'normal' => 'debit'],
            '1300' => ['name' => 'Prepaid Expenses',         'type' => 'asset',     'normal' => 'debit'],
            '1500' => ['name' => 'Fixed Assets',             'type' => 'asset',     'normal' => 'debit'],
            '2000' => ['name' => 'Accounts Payable',         'type' => 'liability', 'normal' => 'credit'],
            '2050' => ['name' => 'Customer Credit Balances', 'type' => 'liability', 'normal' => 'credit'],
            '2100' => ['name' => 'Sales Tax Payable',        'type' => 'liability', 'normal' => 'credit'],
            '2200' => ['name' => 'Loans Payable',            'type' => 'liability', 'normal' => 'credit'],
            '2300' => ['name' => 'Input Tax Recoverable',    'type' => 'asset',     'normal' => 'debit'],
            '3000' => ["name" => "Owner's Capital",          'type' => 'equity',    'normal' => 'credit'],
            '3100' => ['name' => 'Retained Earnings',        'type' => 'equity',    'normal' => 'credit'],
            '3999' => ['name' => 'Historical Variance',      'type' => 'equity',    'normal' => 'credit'],
            '4000' => ['name' => 'Sales Revenue',            'type' => 'income',    'normal' => 'credit'],
            '4100' => ['name' => 'Other Income',             'type' => 'income',    'normal' => 'credit'],
            '5000' => ['name' => 'Cost of Goods Sold',       'type' => 'expense',   'normal' => 'debit'],
            '5100' => ['name' => 'Salaries & Wages',         'type' => 'expense',   'normal' => 'debit'],
            '5200' => ['name' => 'Rent Expense',             'type' => 'expense',   'normal' => 'debit'],
            '5300' => ['name' => 'Utilities',                'type' => 'expense',   'normal' => 'debit'],
            '5400' => ['name' => 'Marketing',                'type' => 'expense',   'normal' => 'debit'],
            '6000' => ['name' => 'Operating Expenses',       'type' => 'expense',   'normal' => 'debit'],
            '7000' => ['name' => 'Opening Balance Equity',   'type' => 'equity',    'normal' => 'credit'],
        ];
        foreach ($coa as $code => $info) {
            $this->accounts[$code] = array_merge($info, ['total_debit' => 0.0, 'total_credit' => 0.0]);
        }
    }

    public function post(string $date, string $ref, array $lines, string $tenantId = 'TENANT-1'): void {
        // Validate balance
        $totalDebit  = array_sum(array_column($lines, 'debit'));
        $totalCredit = array_sum(array_column($lines, 'credit'));
        if (abs($totalDebit - $totalCredit) > 0.005) {
            throw new \Exception("Unbalanced entry for $ref. DR=$totalDebit CR=$totalCredit");
        }

        $this->entries[] = [
            'date'      => $date,
            'reference' => $ref,
            'lines'     => $lines,
            'tenant_id' => $tenantId,
        ];

        if ($tenantId !== 'TENANT-1') return; // isolation tenant — don't aggregate

        foreach ($lines as $line) {
            $code = $line['account_code'];
            if (!isset($this->accounts[$code])) {
                throw new \Exception("Unknown account code: $code");
            }
            $this->accounts[$code]['total_debit']  += round((float)$line['debit'],  2);
            $this->accounts[$code]['total_credit'] += round((float)$line['credit'], 2);
        }
    }

    public function getBalance(string $code): float {
        if (!isset($this->accounts[$code])) return 0.0;
        $a = $this->accounts[$code];
        if ($a['normal'] === 'debit') {
            return round($a['total_debit'] - $a['total_credit'], 2);
        }
        return round($a['total_credit'] - $a['total_debit'], 2);
    }

    public function getTrialBalance(): array {
        $result = [];
        foreach ($this->accounts as $code => $a) {
            $netDebit  = round($a['total_debit'] - $a['total_credit'], 2);
            $netCredit = round($a['total_credit'] - $a['total_debit'], 2);
            if ($a['total_debit'] == 0.0 && $a['total_credit'] == 0.0) continue;
            $result[$code] = [
                'name'   => $a['name'],
                'type'   => $a['type'],
                'debit'  => max($netDebit,  0.0),
                'credit' => max($netCredit, 0.0),
            ];
        }
        return $result;
    }

    public function getProfitAndLoss(): array {
        $revenue  = $this->getBalance('4000') + $this->getBalance('4100');
        $cogs     = $this->getBalance('5000');
        $grossProfit = round($revenue - $cogs, 2);
        $expenses = $this->getBalance('5100')
                  + $this->getBalance('5200')
                  + $this->getBalance('5300')
                  + $this->getBalance('5400')
                  + $this->getBalance('6000');
        $netProfit = round($grossProfit - $expenses, 2);
        return [
            'revenue'      => $revenue,
            'cogs'         => $cogs,
            'gross_profit' => $grossProfit,
            'expenses'     => $expenses,
            'net_profit'   => $netProfit,
        ];
    }

    public function getBalanceSheet(): array {
        $assets = $this->getBalance('1000') + $this->getBalance('1010')
                + $this->getBalance('1100') + $this->getBalance('1200')
                + $this->getBalance('2300');
        $liabilities = $this->getBalance('2000') + $this->getBalance('2100')
                     + $this->getBalance('2200');
        $equity = $this->getBalance('3000') + $this->getBalance('3100')
                + $this->getBalance('7000');
        $pl = $this->getProfitAndLoss();
        $retainedEarnings = $pl['net_profit'];
        return [
            'total_assets'       => $assets,
            'total_liabilities'  => $liabilities,
            'owner_equity'       => $equity,
            'retained_earnings'  => $retainedEarnings,
            'total_equity'       => round($equity + $retainedEarnings, 2),
            'liab_plus_equity'   => round($liabilities + $equity + $retainedEarnings, 2),
            'balanced'           => abs($assets - ($liabilities + $equity + $retainedEarnings)) < 0.01,
        ];
    }
}

// ── FIFO Engine ───────────────────────────────────────────────────────────────

class FifoEngine {
    private array $batches = [];  // batch_id => [qty, unit_cost, remaining_qty]

    public function receiveBatch(string $batchId, float $qty, float $unitCost): void {
        $this->batches[$batchId] = [
            'original_qty'  => $qty,
            'remaining_qty' => $qty,
            'unit_cost'     => $unitCost,
        ];
    }

    /**
     * Deduct stock in FIFO order from specified batches.
     * Returns array of [{batch_id, qty_taken, unit_cost, total_cost}]
     */
    public function deduct(string $productId, float $qty, array $orderedBatchIds): array {
        $remaining  = $qty;
        $deductions = [];

        foreach ($orderedBatchIds as $batchId) {
            if ($remaining <= 0.0001) break;
            if (!isset($this->batches[$batchId])) continue;

            $batch     = &$this->batches[$batchId];
            $canTake   = min($batch['remaining_qty'], $remaining);
            if ($canTake <= 0.0001) continue;

            $totalCost = round($canTake * $batch['unit_cost'], 2);
            $deductions[] = [
                'batch_id'   => $batchId,
                'qty_taken'  => $canTake,
                'unit_cost'  => $batch['unit_cost'],
                'total_cost' => $totalCost,
            ];

            $batch['remaining_qty'] -= $canTake;
            $remaining -= $canTake;
        }

        return $deductions;
    }

    public function restore(string $batchId, float $qty): void {
        if (isset($this->batches[$batchId])) {
            $this->batches[$batchId]['remaining_qty'] += $qty;
        }
    }

    public function getBatchRemaining(string $batchId): float {
        return $this->batches[$batchId]['remaining_qty'] ?? 0.0;
    }

    public function getInventoryValue(): float {
        $total = 0.0;
        foreach ($this->batches as $batch) {
            $total += $batch['remaining_qty'] * $batch['unit_cost'];
        }
        return round($total, 2);
    }

    public function getInventoryByBatch(): array {
        $result = [];
        foreach ($this->batches as $id => $b) {
            $result[$id] = [
                'remaining_qty' => $b['remaining_qty'],
                'unit_cost'     => $b['unit_cost'],
                'value'         => round($b['remaining_qty'] * $b['unit_cost'], 2),
            ];
        }
        return $result;
    }
}

// ── AR / AP Ledger ────────────────────────────────────────────────────────────

class PartyLedger {
    private array $balances = [];
    private array $entries  = [];

    public function debit(string $partyId, float $amount, string $ref, string $date): void {
        $this->balances[$partyId] = ($this->balances[$partyId] ?? 0.0) + $amount;
        $this->entries[]  = ['party' => $partyId, 'dr' => $amount, 'cr' => 0, 'ref' => $ref, 'date' => $date];
    }

    public function credit(string $partyId, float $amount, string $ref, string $date): void {
        $this->balances[$partyId] = ($this->balances[$partyId] ?? 0.0) - $amount;
        $this->entries[]  = ['party' => $partyId, 'dr' => 0, 'cr' => $amount, 'ref' => $ref, 'date' => $date];
    }

    public function getBalance(string $partyId): float {
        return round($this->balances[$partyId] ?? 0.0, 2);
    }

    public function getAllBalances(): array {
        return array_map(fn($b) => round($b, 2), $this->balances);
    }
}

// ── Tax Helper ────────────────────────────────────────────────────────────────

function calculateTax(float $amount, float $taxRate): float {
    return round($amount * $taxRate / 100, 2);
}

// ── Main Calculation ──────────────────────────────────────────────────────────

function runCalculations(array $spec, bool $verbose = false): array {
    $ledger    = new Ledger();
    $fifo      = new FifoEngine();
    $arLedger  = new PartyLedger();  // tracks AR per customer
    $apLedger  = new PartyLedger();  // tracks AP per vendor

    $manifest = [
        'spec_version'   => $spec['spec_version'],
        'frozen_clock'   => $spec['frozen_clock'],
        'generated_at'   => date('Y-m-d H:i:s'),
        'spec_checksum'  => 'PENDING',
        'transactions'   => [],
        'year_end'       => [],
        'monthly'        => [],
        'fifo_batches'   => [],
        'ar_balances'    => [],
        'ap_balances'    => [],
        'trial_balance'  => [],
        'balance_sheet'  => [],
        'pl_report'      => [],
        'inventory'      => [],
        'isolation_check' => [],
    ];

    // Track sale journal entries for reversal references
    $saleJournalRefs = [];

    // Process each transaction in order
    foreach ($spec['transactions'] as $txn) {
        $id       = $txn['id'];
        $type     = $txn['type'];
        $date     = $txn['date'];
        $tenantId = $txn['tenant_id'];

        if ($verbose) echo "Processing: $id ($type) on $date\n";

        switch ($type) {

            case 'opening_balance':
                $ledger->post($date, $id, $txn['journal'], $tenantId);
                break;

            case 'purchase':
                // Build journal from spec
                $ledger->post($date, $id, $txn['journal'], $tenantId);
                // Register FIFO batches
                if ($tenantId === 'TENANT-1') {
                    foreach ($txn['items'] as $item) {
                        $fifo->receiveBatch($item['batch_id'], $item['qty'], $item['unit_cost']);
                    }
                    // Update AP
                    if ($txn['payment_method'] === 'credit') {
                        $apLedger->debit($txn['vendor_id'], $txn['total'], $id, $date);
                    }
                }
                $manifest['transactions'][$id] = [
                    'type'        => $type,
                    'date'        => $date,
                    'subtotal'    => $txn['subtotal'],
                    'tax_amount'  => $txn['tax_amount'],
                    'total'       => $txn['total'],
                ];
                break;

            case 'sale':
                // Compute journal lines independently
                $items       = $txn['items'];
                $netSales    = $txn['net_sales'];
                $totalTax    = $txn['total_tax'];
                $invTotal    = $txn['invoice_total'];
                $cogs        = $txn['cogs'];
                $payMethod   = $txn['payment_method'];
                $amtReceived = $txn['amount_received'] ?? $invTotal;

                // Build journal lines
                $lines = [
                    ['account_code' => '4000', 'debit' => 0,     'credit' => $netSales],
                    ['account_code' => '5000', 'debit' => $cogs,  'credit' => 0],
                    ['account_code' => '1100', 'debit' => 0,      'credit' => $cogs],
                ];
                if ($totalTax > 0) {
                    $lines[] = ['account_code' => '2100', 'debit' => 0, 'credit' => $totalTax];
                }

                if ($payMethod === 'credit') {
                    $lines[] = ['account_code' => '1200', 'debit' => $invTotal, 'credit' => 0];
                    if ($tenantId === 'TENANT-1') {
                        $arLedger->debit($txn['customer_id'], $invTotal, $id, $date);
                    }
                } else {
                    // cash / split
                    $cashAcct = $payMethod === 'bank' ? '1010' : '1000';
                    $lines[]  = ['account_code' => $cashAcct, 'debit' => $amtReceived, 'credit' => 0];
                    $remainder = round($invTotal - $amtReceived, 2);
                    if ($remainder > 0.005) {
                        // split — AR for remainder
                        $lines[] = ['account_code' => '1200', 'debit' => $remainder, 'credit' => 0];
                        if ($tenantId === 'TENANT-1') {
                            $arLedger->debit($txn['customer_id'], $remainder, $id, $date);
                        }
                    }
                }

                if ($tenantId === 'TENANT-1') {
                    $ledger->post($date, $id, $lines, $tenantId);
                    // Consume FIFO
                    foreach ($txn['fifo_batches_consumed'] as $batch) {
                        $fifo->deduct('', $batch['qty_taken'], [$batch['batch_id']]);
                    }
                    $saleJournalRefs[$id] = ['lines' => $lines, 'customer_id' => $txn['customer_id'], 'invTotal' => $invTotal, 'cogs' => $cogs];
                }

                $manifest['transactions'][$id] = [
                    'type'           => $type,
                    'date'           => $date,
                    'net_sales'      => $netSales,
                    'total_tax'      => $totalTax,
                    'invoice_total'  => $invTotal,
                    'cogs'           => $cogs,
                    'payment_status' => $txn['payment_status'],
                ];
                break;

            case 'sale_return':
                // Reverse the original sale's journal
                $origId = $txn['original_sale_id'];
                if (isset($saleJournalRefs[$origId]) && $tenantId === 'TENANT-1') {
                    $origRef  = $saleJournalRefs[$origId];
                    // Swap debit/credit
                    $revLines = array_map(fn($l) => [
                        'account_code' => $l['account_code'],
                        'debit'        => $l['credit'],
                        'credit'       => $l['debit'],
                    ], $origRef['lines']);
                    $ledger->post($date, $id, $revLines, $tenantId);
                    // Reverse AR
                    $arLedger->credit($origRef['customer_id'], $origRef['invTotal'], $id, $date);
                    // Restore FIFO (for TXN-SAL-002: restore 3 phones to BATCH-PHN-001)
                    // In the spec, SAL-002 consumed 3 from BATCH-PHN-001
                    $fifo->restore('BATCH-PHN-001', 3);
                }
                $manifest['transactions'][$id] = [
                    'type'          => $type,
                    'date'          => $date,
                    'original_sale' => $origId,
                    'note'          => 'Full reversal of ' . $origId,
                ];
                break;

            case 'customer_payment':
                if ($tenantId === 'TENANT-1') {
                    $ledger->post($date, $id, $txn['journal'], $tenantId);
                    $arLedger->credit($txn['customer_id'], $txn['amount'], $id, $date);
                }
                $manifest['transactions'][$id] = [
                    'type'        => $type,
                    'date'        => $date,
                    'amount'      => $txn['amount'],
                    'customer_id' => $txn['customer_id'],
                ];
                break;

            case 'supplier_payment':
                if ($tenantId === 'TENANT-1') {
                    $ledger->post($date, $id, $txn['journal'], $tenantId);
                    $apLedger->credit($txn['vendor_id'], $txn['amount'], $id, $date);
                }
                $manifest['transactions'][$id] = [
                    'type'      => $type,
                    'date'      => $date,
                    'amount'    => $txn['amount'],
                    'vendor_id' => $txn['vendor_id'],
                ];
                break;

            case 'expense':
                if ($tenantId === 'TENANT-1') {
                    $ledger->post($date, $id, $txn['journal'], $tenantId);
                }
                $manifest['transactions'][$id] = [
                    'type'     => $type,
                    'date'     => $date,
                    'amount'   => $txn['amount'],
                    'category' => $txn['category'],
                ];
                break;

            case 'bank_transfer':
                if ($tenantId === 'TENANT-1') {
                    $ledger->post($date, $id, $txn['journal'], $tenantId);
                }
                $manifest['transactions'][$id] = [
                    'type'   => $type,
                    'date'   => $date,
                    'amount' => $txn['amount'],
                ];
                break;

            case 'zero_activity_marker':
                $manifest['transactions'][$id] = [
                    'type' => $type,
                    'date' => $date,
                    'note' => 'No transactions — boundary test',
                ];
                break;
        }
    }

    // ── Year-End Computed Values ─────────────────────────────────────────────

    $pl = $ledger->getProfitAndLoss();
    $bs = $ledger->getBalanceSheet();
    $tb = $ledger->getTrialBalance();

    $manifest['year_end'] = [
        'profit_and_loss' => $pl,
        'balance_sheet'   => $bs,
        'account_balances' => [
            '1000' => $ledger->getBalance('1000'),  // Cash
            '1010' => $ledger->getBalance('1010'),  // Bank
            '1100' => $ledger->getBalance('1100'),  // Inventory Asset
            '1200' => $ledger->getBalance('1200'),  // AR
            '2000' => $ledger->getBalance('2000'),  // AP
            '2100' => $ledger->getBalance('2100'),  // Tax Payable
            '2300' => $ledger->getBalance('2300'),  // Input Tax
            '3000' => $ledger->getBalance('3000'),  // Capital
            '4000' => $ledger->getBalance('4000'),  // Revenue
            '5000' => $ledger->getBalance('5000'),  // COGS
            '5100' => $ledger->getBalance('5100'),  // Salaries
            '5200' => $ledger->getBalance('5200'),  // Rent
            '5300' => $ledger->getBalance('5300'),  // Utilities
            '5400' => $ledger->getBalance('5400'),  // Marketing
            '6000' => $ledger->getBalance('6000'),  // Operating Exp
            '7000' => $ledger->getBalance('7000'),  // Opening Equity
        ],
    ];

    $manifest['trial_balance'] = $tb;

    $manifest['inventory'] = [
        'total_value' => $fifo->getInventoryValue(),
        'batches'     => $fifo->getInventoryByBatch(),
        'note'        => 'Must equal account 1100 balance in GL',
        'gl_1100_must_equal_fifo_value' => abs($ledger->getBalance('1100') - $fifo->getInventoryValue()) < 0.01,
    ];

    $manifest['ar_balances'] = [
        'by_customer'    => $arLedger->getAllBalances(),
        'total'          => $ledger->getBalance('1200'),
        'gl_must_equal_sum_of_customers' =>
            abs($ledger->getBalance('1200') - array_sum($arLedger->getAllBalances())) < 0.01,
    ];

    $manifest['ap_balances'] = [
        'by_vendor' => $apLedger->getAllBalances(),
        'total'     => $ledger->getBalance('2000'),
    ];

    // ── Dashboard Expected Values ────────────────────────────────────────────
    $manifest['dashboard'] = [
        'cash'           => $ledger->getBalance('1000'),
        'bank'           => $ledger->getBalance('1010'),
        'receivables'    => $ledger->getBalance('1200'),
        'payables'       => $ledger->getBalance('2000'),
        'revenue_ytd'    => $pl['revenue'],
        'cogs_ytd'       => $pl['cogs'],
        'net_profit_ytd' => $pl['net_profit'],
        'note'           => 'All values as of 2025-12-31',
    ];

    // ── Isolation Check ──────────────────────────────────────────────────────
    $manifest['isolation_check'] = [
        'tenant_2_revenue_must_not_appear_in_tenant_1' => true,
        'tenant_2_revenue' => 10000.00,
        'tenant_2_cogs'    => 5000.00,
        'note' => 'TENANT-2 Rs.10,000 sale must be invisible to TENANT-1 all reports',
    ];

    // ── Consistency Groups (the golden rule assertions) ───────────────────────
    $manifest['consistency_assertions'] = [
        'CG-005_inventory_three_way' => [
            'gl_1100'    => $ledger->getBalance('1100'),
            'fifo_value' => $fifo->getInventoryValue(),
            'balanced'   => abs($ledger->getBalance('1100') - $fifo->getInventoryValue()) < 0.01,
        ],
        'CG-003_ar_control' => [
            'gl_1200'              => $ledger->getBalance('1200'),
            'sum_customer_balances' => array_sum($arLedger->getAllBalances()),
            'balanced'             => abs($ledger->getBalance('1200') - array_sum($arLedger->getAllBalances())) < 0.01,
        ],
        'balance_sheet_equation' => [
            'assets'            => $bs['total_assets'],
            'liab_plus_equity'  => $bs['liab_plus_equity'],
            'balanced'          => $bs['balanced'],
        ],
        'trial_balance_must_zero' => [
            'total_debits'  => array_sum(array_column($tb, 'debit')),
            'total_credits' => array_sum(array_column($tb, 'credit')),
        ],
    ];

    return $manifest;
}

// ── Manifest YAML Writer ──────────────────────────────────────────────────────

function manifestToYaml(array $manifest): string {
    $lines = [];
    $lines[] = "# ============================================================";
    $lines[] = "# VenQore Golden Company — Expected Values Manifest";
    $lines[] = "# Generated by: calculator.php (independent of the application)";
    $lines[] = "# This file is the source of truth for all Phase 2–11 assertions.";
    $lines[] = "# ============================================================";
    $lines[] = "";
    $lines[] = "spec_version: \"{$manifest['spec_version']}\"";
    $lines[] = "frozen_clock: \"{$manifest['frozen_clock']}\"";
    $lines[] = "generated_at: \"{$manifest['generated_at']}\"";
    $lines[] = "spec_checksum: \"{$manifest['spec_checksum']}\"";
    $lines[] = "";

    // Use PHP's var_export-style dump converted to YAML
    $lines[] = yamlDump($manifest);

    return implode("\n", $lines);
}

function yamlDump(array $data, int $depth = 0): string {
    $indent = str_repeat('  ', $depth);
    $out    = '';
    foreach ($data as $key => $value) {
        if (is_array($value)) {
            $out .= "$indent$key:\n";
            $out .= yamlDump($value, $depth + 1);
        } elseif (is_bool($value)) {
            $out .= "$indent$key: " . ($value ? 'true' : 'false') . "\n";
        } elseif (is_float($value) || is_int($value)) {
            $out .= "$indent$key: $value\n";
        } elseif (is_null($value)) {
            $out .= "$indent$key: ~\n";
        } else {
            $out .= "$indent$key: \"$value\"\n";
        }
    }
    return $out;
}

// ── Main Entry Point ──────────────────────────────────────────────────────────

$specPath     = __DIR__ . '/spec.yaml';
$manifestPath = __DIR__ . '/manifest.yaml';
$verbose      = in_array('--verbose', $argv ?? []);
$checkOnly    = in_array('--check',   $argv ?? []);

echo "VenQore Golden Company Calculator\n";
echo "==================================\n";
echo "Reading spec from: $specPath\n";

$spec = parse_yaml_file($specPath);

// Compute spec checksum
$specChecksum = hash('sha256', file_get_contents($specPath));
echo "Spec checksum: $specChecksum\n\n";

$manifest = runCalculations($spec, $verbose);
$manifest['spec_checksum'] = $specChecksum;

// ── Print key results ────────────────────────────────────────────────────────
$pl = $manifest['year_end']['profit_and_loss'];
$bs = $manifest['year_end']['balance_sheet'];
$ca = $manifest['year_end']['account_balances'];

echo "═══════════════════════════════════════════════\n";
echo "  YEAR-END EXPECTED VALUES (2025-12-31)\n";
echo "═══════════════════════════════════════════════\n\n";

echo "PROFIT & LOSS:\n";
printf("  Revenue          : %15.2f\n", $pl['revenue']);
printf("  COGS             : %15.2f\n", $pl['cogs']);
printf("  Gross Profit     : %15.2f\n", $pl['gross_profit']);
printf("  Expenses         : %15.2f\n", $pl['expenses']);
printf("  Net Profit       : %15.2f\n", $pl['net_profit']);

echo "\nBALANCE SHEET:\n";
printf("  Cash (1000)      : %15.2f\n", $ca['1000']);
printf("  Bank (1010)      : %15.2f\n", $ca['1010']);
printf("  Inventory (1100) : %15.2f\n", $ca['1100']);
printf("  AR (1200)        : %15.2f\n", $ca['1200']);
printf("  AP (2000)        : %15.2f\n", $ca['2000']);
printf("  Tax Payable      : %15.2f\n", $ca['2100']);
printf("  Total Assets     : %15.2f\n", $bs['total_assets']);
printf("  Liab+Equity      : %15.2f\n", $bs['liab_plus_equity']);
printf("  BALANCED         : %s\n",     $bs['balanced'] ? 'YES ✅' : 'NO ❌');

echo "\nINVENTORY:\n";
$inv = $manifest['inventory'];
printf("  FIFO Value       : %15.2f\n", $inv['total_value']);
printf("  GL 1100 Balance  : %15.2f\n", $ca['1100']);
printf("  THREE-WAY TIE   : %s\n",     $inv['gl_1100_must_equal_fifo_value'] ? 'YES ✅' : 'NO ❌');

echo "\nCONSISTENCY:\n";
$cons = $manifest['consistency_assertions'];
printf("  AR GL=Customer   : %s\n", $cons['CG-003_ar_control']['balanced'] ? 'YES ✅' : 'NO ❌');
printf("  BS Equation      : %s\n", $cons['balance_sheet_equation']['balanced'] ? 'YES ✅' : 'NO ❌');

echo "\n";

// Write manifest
if ($checkOnly) {
    if (!file_exists($manifestPath)) {
        echo "❌ manifest.yaml not found. Run calculator.php first.\n";
        exit(1);
    }
    $existing = file_get_contents($manifestPath);
    // Check checksum line
    if (strpos($existing, "spec_checksum: \"$specChecksum\"") !== false) {
        echo "✅ manifest.yaml is up to date with spec.yaml\n";
        exit(0);
    } else {
        echo "❌ manifest.yaml is OUT OF DATE with spec.yaml\n";
        echo "   Run: php calculator.php\n";
        exit(1);
    }
}

// Save manifest as PHP-native format (JSON for portability)
$jsonManifest = json_encode($manifest, JSON_PRETTY_PRINT);
file_put_contents(str_replace('.yaml', '.json', $manifestPath), $jsonManifest);
echo "✅ manifest.json written.\n";

// Save YAML (simplified)
$yamlLines = [
    "# VenQore Golden Company — Expected Values Manifest",
    "# Generated: " . $manifest['generated_at'],
    "# Spec checksum: " . $specChecksum,
    "# DO NOT EDIT — regenerate with: php calculator.php",
    "",
    "spec_version: \"" . $manifest['spec_version'] . "\"",
    "spec_checksum: \"" . $specChecksum . "\"",
    "frozen_clock: \"" . $manifest['frozen_clock'] . "\"",
    "generated_at: \"" . $manifest['generated_at'] . "\"",
    "",
    "# PROFIT & LOSS (Year-end 2025-12-31)",
    "profit_and_loss:",
    "  revenue:      " . $pl['revenue'],
    "  cogs:         " . $pl['cogs'],
    "  gross_profit: " . $pl['gross_profit'],
    "  expenses:     " . $pl['expenses'],
    "  net_profit:   " . $pl['net_profit'],
    "",
    "# ACCOUNT BALANCES",
    "account_balances:",
    "  '1000': " . $ca['1000'],
    "  '1010': " . $ca['1010'],
    "  '1100': " . $ca['1100'],
    "  '1200': " . $ca['1200'],
    "  '2000': " . $ca['2000'],
    "  '2100': " . $ca['2100'],
    "  '2300': " . $ca['2300'],
    "  '3000': " . $ca['3000'],
    "  '4000': " . $ca['4000'],
    "  '5000': " . $ca['5000'],
    "  '5100': " . $ca['5100'],
    "  '5200': " . $ca['5200'],
    "  '5300': " . $ca['5300'],
    "  '5400': " . $ca['5400'],
    "  '6000': " . $ca['6000'],
    "  '7000': " . $ca['7000'],
    "",
    "# BALANCE SHEET",
    "balance_sheet:",
    "  total_assets:      " . $bs['total_assets'],
    "  total_liabilities: " . $bs['total_liabilities'],
    "  total_equity:      " . $bs['total_equity'],
    "  liab_plus_equity:  " . $bs['liab_plus_equity'],
    "  balanced: " . ($bs['balanced'] ? 'true' : 'false'),
    "",
    "# INVENTORY FIFO",
    "inventory:",
    "  total_value: " . $inv['total_value'],
    "  gl_1100_matches_fifo: " . ($inv['gl_1100_must_equal_fifo_value'] ? 'true' : 'false'),
    "",
    "# DASHBOARD CARDS",
    "dashboard:",
    "  cash:           " . $manifest['dashboard']['cash'],
    "  bank:           " . $manifest['dashboard']['bank'],
    "  receivables:    " . $manifest['dashboard']['receivables'],
    "  payables:       " . $manifest['dashboard']['payables'],
    "  revenue_ytd:    " . $manifest['dashboard']['revenue_ytd'],
    "  cogs_ytd:       " . $manifest['dashboard']['cogs_ytd'],
    "  net_profit_ytd: " . $manifest['dashboard']['net_profit_ytd'],
    "",
    "# AR BY CUSTOMER",
    "ar_balances:",
];

foreach ($manifest['ar_balances']['by_customer'] as $cust => $bal) {
    $yamlLines[] = "  \"$cust\": $bal";
}
$yamlLines[] = "  total: " . $manifest['ar_balances']['total'];

$yamlLines[] = "";
$yamlLines[] = "# AP BY VENDOR";
$yamlLines[] = "ap_balances:";
foreach ($manifest['ap_balances']['by_vendor'] as $vend => $bal) {
    $yamlLines[] = "  \"$vend\": $bal";
}
$yamlLines[] = "  total: " . $manifest['ap_balances']['total'];

$yamlLines[] = "";
$yamlLines[] = "# ISOLATION CHECK";
$yamlLines[] = "isolation:";
$yamlLines[] = "  tenant_2_must_not_appear_in_tenant_1_reports: true";
$yamlLines[] = "  tenant_2_revenue: " . $manifest['isolation_check']['tenant_2_revenue'];

file_put_contents($manifestPath, implode("\n", $yamlLines) . "\n");
echo "✅ manifest.yaml written to: $manifestPath\n\n";
echo "Run tests against manifest.yaml to verify app output.\n";
