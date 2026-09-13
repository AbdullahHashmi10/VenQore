<?php

namespace App\Support;

use App\Exceptions\ApprovalRequiredException;
use Illuminate\Support\Facades\DB;

/**
 * S-011 / S-044 for the legacy POS checkout (POST /s/{store}/sales,
 * SaleController@store — the endpoint Pos.jsx and NewPos.jsx call).
 *
 * The V3 sale route enforces both money rules (StoreSaleRequest +
 * V3 SaleService); the POS checkout enforced neither. This applies the SAME
 * rules through the SAME helper ({@see ManagerApproval}):
 *
 *   • Any `approved_by` must be a verified manager approval: an active
 *     owner/admin/manager of THIS store, plus their PIN unless they are the
 *     person ringing the sale (ManagerApproval::check).
 *   • S-044 — a line whose discount % is above the actor's role limit
 *     (discount_limits: store row, then global default; none = no limit)
 *     needs an approval, and the approver's own limit must cover it.
 *   • S-011 — a line whose recognised revenue is below the FIFO cost of the
 *     stock it will consume needs an approval. On V3 an owner/admin/manager
 *     approves their own below-cost sale by sending their own id with no
 *     PIN; at the till their signed-in session IS that approval, so it is
 *     applied implicitly (no PIN, no extra round trip) and their id is still
 *     stamped as approved_by on the journal entry. A cashier always needs a
 *     manager + PIN. Free (promotional) quantity is not priced, so — like
 *     V3's is_promotional rows — it is left out of the comparison.
 *
 * Legacy-payload mapping:
 *   discount %  = (row discount + the line's share of the order discount)
 *                 / (paid qty × unit price) × 100
 *   revenue     = the line's taxable net after both discounts, ex-tax
 *   cost        = FIFO cost of the paid qty, projected read-only from the
 *                 batches FifoService::deductStock() would consume (same
 *                 order, same per-batch rounding, same shortfall costing);
 *                 for service / stock-disabled lines the cost_price the
 *                 controller books instead.
 *
 * Nothing here writes to the database (ManagerApproval's PIN rate limiter
 * lives in the cache).
 */
final class PosSaleApprovalGuard
{
    /**
     * @param  array<int, array{index:int, product_id:string|int, name:?string, type:?string, cost_price:float|int|string|null,
     *                         paid_qty:float, free_qty:float, gross:float, discount:float, revenue:float}>  $lines
     * @return string|null  the verified approver id to stamp on the journal entry, or null when none was sent
     *
     * @throws ApprovalRequiredException
     */
    public static function authorize(
        array $lines,
        int|string $tenantId,
        int|string|null $actorId,
        int|string|null $approvedBy,
        ?string $pin,
        int|string $warehouseId,
        bool $stockEnabled
    ): ?string {
        $approvedBy = ($approvedBy === null || $approvedBy === '') ? null : (string) $approvedBy;

        // 1. Any approval sent must be a real one (V3 StoreSaleRequest).
        $approvalError = null;
        if ($approvedBy !== null) {
            $approvalError = ManagerApproval::check($approvedBy, $pin, $tenantId, $actorId);
        }
        $approvalValid = $approvedBy !== null && $approvalError === null;
        // A rejected approval counts as no approval, so the 422 still says
        // what needed approving (V3 stops at the approved_by error alone).
        $approver = $approvalValid ? $approvedBy : null;

        $problems = [];

        // 2. S-044 — discount over the actor's role limit.
        $actorRole   = DB::table('tenant_users')->where('tenant_id', $tenantId)->where('user_id', $actorId)->value('role');
        $actorLimit  = ManagerApproval::discountLimit($actorRole, $tenantId);
        $approverLimit = $approvalValid
            ? ManagerApproval::discountLimit(ManagerApproval::roleOf($approvedBy, $tenantId), $tenantId)
            : null;

        if ($actorLimit !== null) {
            foreach ($lines as $line) {
                $pct = self::discountPercent($line);
                if ($pct <= $actorLimit) {
                    continue;
                }
                if ($approver === null) {
                    $problems[] = self::discountProblem($line, $pct, $actorLimit, null,
                        "Discount {$pct}% on {$line['name']} exceeds your role limit of {$actorLimit}%. Manager approval is required (S-044).");
                } elseif ($approverLimit !== null && $pct > $approverLimit) {
                    $problems[] = self::discountProblem($line, $pct, $actorLimit, $approverLimit,
                        "Discount {$pct}% on {$line['name']} exceeds the approver's own limit of {$approverLimit}% (S-044).");
                }
            }
        }

        // 3. S-011 — below FIFO cost without an approval.
        $belowCost = [];
        if ($approver === null) {
            $costs = self::projectedPaidCosts($lines, $tenantId, $warehouseId, $stockEnabled);
            foreach ($lines as $line) {
                $problem = self::belowCostProblem($line, $costs[$line['index']] ?? 0.0);
                if ($problem !== null) {
                    $belowCost[] = $problem;
                }
            }
        }

        // An owner/admin/manager ringing their own sale approves its below-cost
        // lines with their session (V3: approved_by = self, no PIN).
        $selfApproves = $approvedBy === null && $belowCost !== []
            && in_array(ManagerApproval::roleOf($actorId, $tenantId), ManagerApproval::ROLES, true);
        if (!$selfApproves) {
            $problems = array_merge($problems, $belowCost);
        }

        if ($approvalError === null && $problems === []) {
            return $selfApproves ? (string) $actorId : $approvedBy;
        }

        throw self::exception($problems, $approvalError);
    }

    /**
     * Safety net after the real FIFO deduction: the pre-check projected the
     * cost, this re-checks it against what was actually consumed (another
     * till may have sold the cheap batch in between, or auto-manufacturing
     * produced stock at a different cost). Only relevant without approval.
     *
     * @param  array{index:int, product_id:string|int, name:?string, paid_qty:float, revenue:float}  $line
     * @param  array<int, array{qty_taken:float|int|string, unit_cost:float|int|string, total_cost:float|int|string}>|null  $deductions  null = cost_price costing
     * @return string|null  the approver to stamp (unchanged, or the owner/admin/manager actor who self-approves)
     *
     * @throws ApprovalRequiredException
     */
    public static function assertPostedCostCovered(
        array $line,
        ?array $deductions,
        float $flatCost,
        ?string $approvedBy,
        int|string $tenantId,
        int|string|null $actorId
    ): ?string {
        if ($approvedBy !== null) {
            return $approvedBy;
        }
        $cost = $deductions === null ? round($flatCost, 2) : self::paidCost($deductions, (float) $line['paid_qty']);
        $problem = self::belowCostProblem($line, $cost);
        if ($problem === null) {
            return null;
        }
        if (in_array(ManagerApproval::roleOf($actorId, $tenantId), ManagerApproval::ROLES, true)) {
            return (string) $actorId;
        }
        throw self::exception([$problem], null);
    }

    /** Effective discount % on the paid part of a line, 2 dp. */
    public static function discountPercent(array $line): float
    {
        $gross = (float) $line['gross'];
        if ($gross <= 0) {
            return 0.0;
        }
        return round(((float) $line['discount'] / $gross) * 100, 2);
    }

    // ── internals ────────────────────────────────────────────────────────

    /**
     * Projected FIFO cost of each line's PAID qty, keyed by line index.
     * Mirrors FifoService::deductStock() read-only: batches with stock,
     * oldest first (created_at, seq), each take costed round(take × unit, 2);
     * a shortfall is costed at the newest batch's unit cost, else the
     * product's cost_price. Lines of the same product share one queue, and a
     * line's paid qty is taken before its free qty.
     *
     * @return array<int, float>
     */
    private static function projectedPaidCosts(array $lines, int|string $tenantId, int|string $warehouseId, bool $stockEnabled): array
    {
        $queues = [];
        $costs  = [];

        foreach ($lines as $line) {
            $paidQty = (float) $line['paid_qty'];
            $allQty  = $paidQty + (float) $line['free_qty'];

            if (!$stockEnabled || ($line['type'] ?? null) === 'service') {
                // The controller books cost_price × qty for these (no batches).
                $costs[$line['index']] = round((float) ($line['cost_price'] ?? 0) * $paidQty, 2);
                continue;
            }

            $pid = (string) $line['product_id'];
            if (!isset($queues[$pid])) {
                $queues[$pid] = [
                    'batches'  => DB::table('inventory_batches')
                        ->where('tenant_id', $tenantId)
                        ->where('product_id', $line['product_id'])
                        ->where('warehouse_id', $warehouseId)
                        ->where('remaining_qty', '>', 0)
                        ->orderBy('created_at', 'ASC')
                        ->orderBy('seq', 'ASC')
                        ->get(['remaining_qty', 'unit_cost'])
                        ->map(fn ($b) => ['left' => (float) $b->remaining_qty, 'unit_cost' => (float) $b->unit_cost])
                        ->all(),
                    'shortfall_cost' => null,
                ];
            }

            $deductions = [];
            $remaining  = $allQty;
            foreach ($queues[$pid]['batches'] as &$batch) {
                if ($remaining <= 0) break;
                if ($batch['left'] <= 0) continue;
                $take = min($remaining, $batch['left']);
                $batch['left'] -= $take;
                $deductions[] = ['qty_taken' => $take, 'unit_cost' => $batch['unit_cost'], 'total_cost' => round($take * $batch['unit_cost'], 2)];
                $remaining -= $take;
            }
            unset($batch);

            if ($remaining > 0) {
                if ($queues[$pid]['shortfall_cost'] === null) {
                    $newest = DB::table('inventory_batches')
                        ->where('tenant_id', $tenantId)
                        ->where('product_id', $line['product_id'])
                        ->where('warehouse_id', $warehouseId)
                        ->orderBy('created_at', 'DESC')
                        ->value('unit_cost');
                    $queues[$pid]['shortfall_cost'] = $newest !== null ? (float) $newest : (float) ($line['cost_price'] ?? 0);
                }
                $unit = $queues[$pid]['shortfall_cost'];
                $deductions[] = ['qty_taken' => $remaining, 'unit_cost' => $unit, 'total_cost' => round($remaining * $unit, 2)];
            }

            $costs[$line['index']] = self::paidCost($deductions, $paidQty);
        }

        return $costs;
    }

    /** Cost of the first $paidQty units of a deduction list (paid qty is taken before free qty). */
    private static function paidCost(array $deductions, float $paidQty): float
    {
        $cost = 0.0;
        $remaining = $paidQty;
        foreach ($deductions as $d) {
            if ($remaining <= 0) break;
            $qty  = (float) $d['qty_taken'];
            $take = min($remaining, $qty);
            $cost += ($take >= $qty) ? (float) $d['total_cost'] : round($take * (float) $d['unit_cost'], 2);
            $remaining -= $take;
        }
        return round($cost, 2);
    }

    private static function belowCostProblem(array $line, float $cost): ?array
    {
        $revenue = round((float) $line['revenue'], 2);
        $cost    = round($cost, 2);
        if ((float) $line['paid_qty'] <= 0 || !($revenue < $cost)) {
            return null;
        }
        return [
            'reason'     => 'below_cost',
            'index'      => $line['index'],
            'product_id' => $line['product_id'],
            'name'       => $line['name'],
            'revenue'    => $revenue,
            'cost'       => $cost,
            'message'    => "{$line['name']} is priced at {$revenue}, below its FIFO cost of {$cost}. Manager approval is required (S-011).",
        ];
    }

    private static function discountProblem(array $line, float $pct, float $limit, ?float $approverLimit, string $message): array
    {
        return [
            'reason'           => 'discount_limit',
            'index'            => $line['index'],
            'product_id'       => $line['product_id'],
            'name'             => $line['name'],
            'discount_percent' => $pct,
            'limit'            => $limit,
            'approver_limit'   => $approverLimit,
            'message'          => $message,
        ];
    }

    private static function exception(array $problems, ?string $approvalError): ApprovalRequiredException
    {
        $reasons = array_values(array_unique(array_column($problems, 'reason')));

        $errors = [];
        if ($approvalError !== null) {
            $errors['approved_by'][] = $approvalError;
        }
        foreach ($problems as $p) {
            $field = $p['reason'] === 'below_cost' ? "items.{$p['index']}.price" : "items.{$p['index']}.discount";
            $errors[$field][] = $p['message'];
        }

        $message = $approvalError ?? ($problems[0]['message'] ?? 'Manager approval is required.');

        return new ApprovalRequiredException($message, [
            'reason'         => $reasons[0] ?? 'invalid_approval',
            'reasons'        => $reasons,
            'approval_error' => $approvalError,
            'lines'          => array_map(fn ($p) => array_diff_key($p, ['message' => true]), $problems),
            'errors'         => $errors,
        ]);
    }
}
