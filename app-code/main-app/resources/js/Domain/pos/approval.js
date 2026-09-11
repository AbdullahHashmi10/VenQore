/**
 * Manager approval on POS checkout (S-011 below-cost / S-044 over-limit
 * discount). POST /s/{store}/sales answers 422 with
 *   { code: 'approval_required', reason, reasons, approval_error, lines, message }
 * when a sale needs an approval it does not carry (or carries a bad one).
 * The POS then asks an owner/admin/manager to approve and resubmits the SAME
 * payload with approved_by + approval_pin.
 *
 * Pure helpers only — no React, no network — so they are unit-tested.
 */

export const APPROVAL_REQUIRED = 'approval_required';

/** Returns the approval request from an axios error, or null if it is anything else. */
export function parseApprovalRequired(error) {
    const res = error?.response;
    if (!res || res.status !== 422) return null;
    const d = res.data || {};
    if (d.code !== APPROVAL_REQUIRED) return null;

    const reasons = Array.isArray(d.reasons) && d.reasons.length
        ? d.reasons
        : (d.reason && d.reason !== 'invalid_approval' ? [d.reason] : []);

    return {
        reason: d.reason || null,
        reasons,
        message: d.message || 'Manager approval is required.',
        approvalError: d.approval_error || null,
        lines: Array.isArray(d.lines) ? d.lines : [],
    };
}

/** Highest discount % in the request that the approver's own limit must cover (0 if none). */
export function requiredDiscountPercent(info) {
    return (info?.lines || [])
        .filter((l) => l.reason === 'discount_limit')
        .reduce((max, l) => Math.max(max, Number(l.discount_percent) || 0), 0);
}

/**
 * Decorates the approver list for the picker:
 *   needsPin  — anyone other than the signed-in user must type their PIN
 *   disabled  — why this person cannot approve this sale (null = can)
 */
export function approverOptions(approvers, info) {
    const needPct = requiredDiscountPercent(info);
    return (approvers || []).map((a) => {
        const limit = a.discount_limit === null || a.discount_limit === undefined ? null : Number(a.discount_limit);
        let disabled = null;
        if (!a.is_self && !a.has_pin) disabled = 'No PIN set';
        else if (limit !== null && needPct > limit) disabled = `Own limit ${limit}%`;
        return { ...a, needsPin: !a.is_self, disabled };
    });
}

/** Human lines explaining what needs approval. `money` formats an amount. */
export function describeApprovalLines(info, money = (n) => String(n)) {
    return (info?.lines || []).map((l) => {
        const name = l.name || 'Item';
        if (l.reason === 'below_cost') {
            return `${name}: sells for ${money(l.revenue)}, below its cost of ${money(l.cost)}`;
        }
        if (l.reason === 'discount_limit') {
            const own = l.approver_limit !== null && l.approver_limit !== undefined
                ? ` (approver's own limit ${l.approver_limit}%)`
                : ` (your limit ${l.limit}%)`;
            return `${name}: ${l.discount_percent}% discount${own}`;
        }
        return name;
    });
}

/** The checkout payload with the approval attached (unchanged when there is none). */
export function withApproval(payload, approval) {
    if (!approval || approval.approvedBy === undefined || approval.approvedBy === null || approval.approvedBy === '') {
        return payload;
    }
    const out = { ...payload, approved_by: String(approval.approvedBy) };
    if (approval.pin) out.approval_pin = String(approval.pin);
    return out;
}
