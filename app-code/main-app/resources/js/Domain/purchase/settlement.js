/**
 * Where a purchase stands, as the purchase Show screen displays it.
 *
 * The server sends `settlement` — PaymentService::purchaseSettlementSummary(),
 * the same reading the payment badge, the purchase list and the Payments
 * screen's auto-allocation use: total, paid (at the counter + allocated),
 * returned (debit notes / purchase returns) and outstanding.
 *
 * The screen used to work outstanding out for itself as total − paid, which
 * ignored returns: a bill with goods sent back showed the returned value as
 * still owed while its badge said "paid".
 *
 * Pure helpers only — no React, no network — so they are unit-tested.
 */

const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

/**
 * @param {object} args
 * @param {object} args.purchase       the purchase row (needs `total`)
 * @param {object|null} args.settlement the server's settlement summary, if sent
 * @param {number} args.paidAmount     legacy prop, used only when no summary came
 * @returns {{ total: number, paid: number, returned: number, outstanding: number }}
 */
export function purchaseStanding({ purchase = {}, settlement = null, paidAmount = 0 } = {}) {
    const total = num(settlement?.total ?? purchase?.total);

    if (settlement && settlement.outstanding !== undefined && settlement.outstanding !== null) {
        return {
            total,
            paid: round2(Math.min(num(settlement.paid), total)),
            returned: round2(num(settlement.returned)),
            outstanding: round2(Math.max(0, num(settlement.outstanding))),
        };
    }

    // No summary from the server (an old cached page): the best that can be
    // said without the ledger, and never negative.
    const paid = num(paidAmount);
    return {
        total,
        paid: round2(Math.min(paid, total)),
        returned: 0,
        outstanding: round2(Math.max(0, total - paid)),
    };
}
