/**
 * The ONE plan vocabulary on the frontend. Mirror of app/Support/PlanCatalog.php
 * — keep the two in step.
 *
 *   Canonical: solo → starter → core → scale → custom
 *   Legacy (old rows / props, always normalised): counter → solo,
 *   growth → core, business → scale
 *
 * Never compare a plan slug without passing it through normalizePlan() first.
 */

export const PLAN_ORDER = ['solo', 'starter', 'core', 'scale', 'custom'];

/** Tiers a customer can pick themselves (custom is sales-led). */
export const SELF_SERVE_PLANS = ['solo', 'starter', 'core', 'scale'];

export const PLAN_LABELS = {
    trial: 'Free Trial',
    solo: 'Solo',
    starter: 'Starter',
    core: 'Core',
    scale: 'Scale',
    custom: 'Custom',
    ltd: 'Lifetime Deal',
    ltd_1: 'Lifetime Tier 1',
    ltd_2: 'Lifetime Tier 2',
    ltd_3: 'Lifetime Tier 3',
};

/** List prices (USD / month) — config/pricing.php. Fallback only; prefer server props. */
export const PLAN_PRICE_USD = { solo: 0, starter: 49, core: 99, scale: 299 };

const LEGACY = { counter: 'solo', growth: 'core', business: 'scale' };
const LTD_EQUIVALENT = { ltd_1: 'starter', ltd_2: 'core', ltd_3: 'scale' };

export function normalizePlan(slug) {
    const s = String(slug ?? '').trim().toLowerCase();
    return LEGACY[s] || s;
}

/** 0 for trial/unknown, 1..n for paid tiers; LTD tiers rank as their equivalent. */
export function planRank(slug) {
    const s = normalizePlan(slug);
    const i = PLAN_ORDER.indexOf(LTD_EQUIVALENT[s] || s);
    return i === -1 ? 0 : i + 1;
}

/** Next self-serve tier up, or null at the top. Trial/unknown → 'starter' (as PlanCatalog::next). */
export function nextPlan(slug) {
    const s = LTD_EQUIVALENT[normalizePlan(slug)] || normalizePlan(slug);
    if (s === 'custom') return null;
    const i = SELF_SERVE_PLANS.indexOf(s);
    if (i === -1) return 'starter';
    return SELF_SERVE_PLANS[i + 1] || null;
}

export function planLabel(slug) {
    const s = normalizePlan(slug);
    return PLAN_LABELS[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '');
}

/** Headline limits per tier — the numbers in config/pricing.php, nothing else. */
export const PLAN_PERKS = {
    solo: ['500 products', '1 staff seat (2 till logins)', '1 till', '100 sales / month', '100 monthly AI credits'],
    starter: [
        '5,000 products',
        '1 full staff seat — till logins unlimited',
        '2 tills',
        'Unlimited sales and full history',
        '500 monthly AI credits',
        'Email support within 2 business days',
    ],
    core: [
        '25,000 products',
        '5 full staff seats',
        '6 tills',
        'Unlimited sales and full history',
        '2,000 monthly AI credits',
        'Email support within 1 business day',
    ],
    scale: [
        '250,000 products',
        '25 full staff seats',
        '20 tills',
        'Unlimited sales and full history',
        '10,000 monthly AI credits',
        'Named contact, 4 business hours',
    ],
};
