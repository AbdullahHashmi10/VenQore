// Shared helpers for the Commerce MVP (public shop + merchant online store).

export const money = (n, symbol = 'Rs') => {
    const v = Number(n ?? 0);
    return `${symbol} ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const STATUS_LABEL = {
    pending: 'Waiting for confirmation',
    confirmed: 'Accepted',
    preparing: 'Being prepared',
    ready: 'Ready for pickup',
    out_for_delivery: 'Out for delivery',
    completed: 'Completed',
    rejected: 'Declined by the business',
    cancelled: 'Cancelled',
    expired: 'Expired (not accepted in time)',
};

export const PAYMENT_LABEL = {
    unpaid: 'Unpaid',
    transfer_reported: 'Transfer reported (not yet verified)',
    collected: 'Paid',
    refunded: 'Refunded',
};

export const METHOD_LABEL = { cod: 'Cash on delivery', pickup: 'Pay at pickup', bank: 'Bank transfer' };

export const STATUS_TONE = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    confirmed: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
    preparing: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
    ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    out_for_delivery: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    expired: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
};

export const DAY_LABEL = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

export const newKey = () =>
    (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;

// ── Guest cart (one business per cart). Stores ONLY item ids + quantities, never prices. ──
const CART_KEY = 'vq_commerce_cart_v1';

export const cartStore = {
    read() {
        try {
            const raw = window.localStorage.getItem(CART_KEY);
            const c = raw ? JSON.parse(raw) : null;
            return c && typeof c === 'object' && Array.isArray(c.lines) ? c : { slug: null, lines: [] };
        } catch (e) {
            return { slug: null, lines: [] };
        }
    },
    write(cart) {
        try { window.localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* storage blocked: cart lives in memory only */ }
    },
    clear() {
        try { window.localStorage.removeItem(CART_KEY); } catch (e) { /* ignore */ }
    },
};
