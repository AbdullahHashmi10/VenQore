import { describe, it, expect } from 'vitest';
import {
    APPROVAL_REQUIRED,
    approverOptions,
    describeApprovalLines,
    parseApprovalRequired,
    requiredDiscountPercent,
    withApproval,
} from '../../Domain/pos/approval';

const err = (status, data) => ({ response: { status, data } });

const belowCost = {
    success: false,
    code: APPROVAL_REQUIRED,
    reason: 'below_cost',
    reasons: ['below_cost'],
    approval_error: null,
    message: 'Widget is priced at 100, below its FIFO cost of 120.',
    lines: [{ reason: 'below_cost', index: 0, product_id: 'p1', name: 'Widget', revenue: 100, cost: 120 }],
};

const overLimit = {
    success: false,
    code: APPROVAL_REQUIRED,
    reason: 'discount_limit',
    reasons: ['discount_limit'],
    approval_error: "The approver's PIN is missing or incorrect.",
    lines: [
        { reason: 'discount_limit', index: 0, name: 'Widget', discount_percent: 8, limit: 5, approver_limit: null },
        { reason: 'discount_limit', index: 1, name: 'Gadget', discount_percent: 30, limit: 5, approver_limit: null },
    ],
};

describe('parseApprovalRequired', () => {
    it('recognises the approval_required 422', () => {
        const info = parseApprovalRequired(err(422, belowCost));
        expect(info.reason).toBe('below_cost');
        expect(info.reasons).toEqual(['below_cost']);
        expect(info.approvalError).toBeNull();
        expect(info.lines).toHaveLength(1);
    });

    it('carries the rejected-approval message', () => {
        expect(parseApprovalRequired(err(422, overLimit)).approvalError).toMatch(/PIN/);
    });

    it('ignores every other error', () => {
        expect(parseApprovalRequired(err(422, { success: false, errors: { customer_id: ['x'] } }))).toBeNull();
        expect(parseApprovalRequired(err(403, { code: APPROVAL_REQUIRED }))).toBeNull();
        expect(parseApprovalRequired(err(500, belowCost))).toBeNull();
        expect(parseApprovalRequired(new Error('Network Error'))).toBeNull();
        expect(parseApprovalRequired(null)).toBeNull();
    });

    it('falls back to reason when reasons is missing, but never lists invalid_approval', () => {
        expect(parseApprovalRequired(err(422, { code: APPROVAL_REQUIRED, reason: 'discount_limit' })).reasons).toEqual(['discount_limit']);
        expect(parseApprovalRequired(err(422, { code: APPROVAL_REQUIRED, reason: 'invalid_approval' })).reasons).toEqual([]);
    });
});

describe('requiredDiscountPercent', () => {
    it('is the largest over-limit discount', () => {
        expect(requiredDiscountPercent(parseApprovalRequired(err(422, overLimit)))).toBe(30);
    });
    it('is 0 for below-cost only', () => {
        expect(requiredDiscountPercent(parseApprovalRequired(err(422, belowCost)))).toBe(0);
    });
});

describe('approverOptions', () => {
    const approvers = [
        { user_id: '1', name: 'Me', role: 'manager', is_self: true, has_pin: false, discount_limit: 50 },
        { user_id: '2', name: 'Owner', role: 'owner', is_self: false, has_pin: true, discount_limit: null },
        { user_id: '3', name: 'No Pin', role: 'manager', is_self: false, has_pin: false, discount_limit: 50 },
        { user_id: '4', name: 'Tight', role: 'manager', is_self: false, has_pin: true, discount_limit: 20 },
    ];

    it('asks for a PIN from anyone but the signed-in user', () => {
        const opts = approverOptions(approvers, parseApprovalRequired(err(422, belowCost)));
        expect(opts.map((o) => o.needsPin)).toEqual([false, true, true, true]);
        expect(opts.map((o) => o.disabled)).toEqual([null, null, 'No PIN set', null]);
    });

    it("disables approvers whose own limit does not cover the discount", () => {
        const opts = approverOptions(approvers, parseApprovalRequired(err(422, overLimit)));
        expect(opts.find((o) => o.user_id === '4').disabled).toBe('Own limit 20%');
        expect(opts.find((o) => o.user_id === '2').disabled).toBeNull(); // owner: no limit
        expect(opts.find((o) => o.user_id === '1').disabled).toBeNull(); // 50 ≥ 30
    });

    it('copes with no list', () => {
        expect(approverOptions(undefined, null)).toEqual([]);
    });
});

describe('describeApprovalLines', () => {
    it('explains each line', () => {
        const money = (v) => `Rs ${v}`;
        expect(describeApprovalLines(parseApprovalRequired(err(422, belowCost)), money))
            .toEqual(['Widget: sells for Rs 100, below its cost of Rs 120']);
        expect(describeApprovalLines(parseApprovalRequired(err(422, overLimit)))[0])
            .toBe('Widget: 8% discount (your limit 5%)');
        expect(describeApprovalLines({ lines: [{ reason: 'discount_limit', name: 'X', discount_percent: 60, limit: 5, approver_limit: 50 }] })[0])
            .toBe("X: 60% discount (approver's own limit 50%)");
    });
});

describe('withApproval', () => {
    const payload = { items: [{ product_id: 'p1' }], amount_paid: 100 };

    it('attaches approver and PIN without mutating the payload', () => {
        const out = withApproval(payload, { approvedBy: 7, pin: '246810' });
        expect(out).toEqual({ ...payload, approved_by: '7', approval_pin: '246810' });
        expect(payload).not.toHaveProperty('approved_by');
    });

    it('omits the PIN when the approver is the signed-in user', () => {
        expect(withApproval(payload, { approvedBy: '7', pin: '' })).toEqual({ ...payload, approved_by: '7' });
    });

    it('leaves the payload alone without an approval', () => {
        expect(withApproval(payload, null)).toBe(payload);
        expect(withApproval(payload, { approvedBy: '' })).toBe(payload);
    });
});
