/**
 * VenQore Command Center — navigation model.
 *
 * One source of truth for the grouped sidebar AND the ⌘K command palette,
 * implementing the audit's new Information Architecture (D3): one shell, five
 * intent groups + Profile. Each item points at an Inertia route name; items
 * whose backend route doesn't exist yet route to in-app "Coming Soon" pages.
 */
import {
    LayoutDashboard, Users, Store, SlidersHorizontal, UserCog, BadgeCheck,
    Boxes, Layers, Ticket, DollarSign, TrendingUp, Tag,
    Inbox, MessagesSquare, Bot, FlaskConical, Megaphone, Package,
    HeartPulse, ShieldCheck, Server, Webhook, HardDrive, ToggleRight, RefreshCw, Settings,
    KeyRound,
} from 'lucide-react';

/** Resolve a Ziggy route name safely; returns null if it doesn't exist. */
export function safeRoute(name, params) {
    try {
        if (typeof window !== 'undefined' && typeof window.route === 'function') {
            // Ziggy throws if the name is unknown — guard it.
            const has = window.route().has ? window.route().has(name) : true;
            if (has === false) return null;
            return window.route(name, params);
        }
    } catch (e) { /* fall through */ }
    return null;
}

/** Is a Ziggy route name currently active? */
export function isActive(name) {
    try {
        if (typeof window !== 'undefined' && typeof window.route === 'function') {
            return !!window.route().current(name);
        }
    } catch (e) { /* ignore */ }
    return false;
}

/**
 * Each leaf:
 *   { key, label, icon, route?: ziggyName, params?, match?: ziggyPattern,
 *     href?: hard path, badge?: 'soon'|'new'|count, desc }
 */
export const NAV_GROUPS = [
    {
        key: 'overview',
        label: null, // ungrouped, top-level
        items: [
            { key: 'overview', label: 'Overview', icon: LayoutDashboard, route: 'platform.dashboard', match: 'platform.dashboard', desc: 'KPIs, revenue vs GMV, trends & alerts' },
        ],
    },
    {
        key: 'customers',
        label: 'Customers',
        items: [
            { key: 'stores', label: 'Stores', icon: Store, route: 'platform.stores', match: 'platform.stores', desc: 'All merchant stores — suspend, extend, impersonate' },
            { key: 'users', label: 'Platform Users', icon: Users, route: 'platform.users', match: 'platform.users', desc: 'Owners, staff & platform admins' },
            { key: 'overrides', label: 'Tenant Overrides', icon: SlidersHorizontal, route: 'platform.tenants.overrides', match: 'platform.tenants.*', desc: 'Per-tenant limit overrides with expiry' },
            { key: 'impersonation', label: 'Impersonation', icon: UserCog, page: 'impersonation', desc: 'Audited session takeover log' },
            { key: 'pk-verify', label: 'PK Verifications', icon: BadgeCheck, page: 'pk-verifications', badge: 'new', desc: 'CNIC review queue for PKR pricing' },
        ],
    },
    {
        key: 'monetization',
        label: 'Monetization',
        items: [
            { key: 'platforms', label: 'Platforms', icon: Boxes, route: 'platform.platforms.index', match: 'platform.platforms.*', desc: 'Product lines that own plans' },
            { key: 'plans', label: 'Plans & Limits', icon: Layers, route: 'platform.plans.index', match: 'platform.plans.*', desc: 'Pricing, limits, trials, LTD' },
            { key: 'coupons', label: 'Coupons', icon: Ticket, route: 'platform.coupons.index', match: 'platform.coupons.*', desc: 'Discounts & promotions' },
            { key: 'revenue', label: 'Revenue', icon: DollarSign, page: 'revenue', desc: 'Paid subscription income (server-side)' },
            { key: 'gmv', label: 'Merchant GMV', icon: TrendingUp, page: 'gmv', desc: 'Merchant sales volume — not revenue' },
            { key: 'appsumo', label: 'AppSumo / LTD', icon: Tag, page: 'appsumo', badge: 'soon', desc: 'Lifetime deal codes' },
        ],
    },
    {
        key: 'operations',
        label: 'Operations',
        items: [
            { key: 'support', label: 'Support Inbox', icon: Inbox, page: 'support', desc: 'Unified V1 + Vena + Digital tickets' },
            { key: 'agent', label: 'Live Chat / Agent', icon: MessagesSquare, route: 'platform.chatbot.inbox', desc: 'Live-chat agent console' },
            { key: 'chatbot', label: 'Chatbot (Vena)', icon: Bot, route: 'platform.chatbot.settings', desc: 'AI assistant configuration' },
            { key: 'demo', label: 'Demo & Sandbox', icon: FlaskConical, page: 'demo', desc: 'Demo store status, reset & snapshots' },
            { key: 'broadcasts', label: 'Broadcasts', icon: Megaphone, route: 'platform.newsletter-hub', desc: 'Newsletter & campaigns' },
            { key: 'digital', label: 'Digital Products', icon: Package, route: 'platform.digital-hub', desc: 'Partner chats & product registry' },
        ],
    },
    {
        key: 'system',
        label: 'System',
        items: [
            { key: 'health', label: 'Health & Errors', icon: HeartPulse, route: 'platform.health.errors', match: 'platform.health.*', desc: 'Error logs & contact submissions' },
            { key: 'testing', label: 'Testing Center', icon: ShieldCheck, page: 'testing', desc: 'One-click categorized health check' },
            { key: 'jobs', label: 'Jobs & Queues', icon: Server, page: 'jobs', badge: 'soon', desc: 'Horizon queue depth & failed jobs' },
            { key: 'webhooks', label: 'Webhooks', icon: Webhook, route: 'platform.webhooks', desc: 'Integration delivery log' },
            { key: 'storage', label: 'Storage', icon: HardDrive, page: 'storage', badge: 'soon', desc: 'Per-tenant & total storage' },
            { key: 'flags', label: 'Feature Flags', icon: ToggleRight, page: 'flags', badge: 'soon', desc: 'Per-store capability switches' },
            { key: 'updates', label: 'Updates & Version', icon: RefreshCw, href: '/updater', desc: 'Run updates & view version history' },
            { key: 'settings', label: 'Platform Settings', icon: Settings, page: 'settings', desc: 'FX rates, fees, grace defaults' },
        ],
    },
    {
        key: 'account',
        label: 'Account',
        items: [
            { key: 'profile', label: 'Profile & Security', icon: KeyRound, page: 'security', desc: 'Password, login PIN, action passcode' },
        ],
    },
];

/** Flat list of every navigable item, for the command palette + search. */
export function flatNav() {
    const out = [];
    for (const g of NAV_GROUPS) {
        for (const it of g.items) {
            out.push({ ...it, group: g.label || 'Command Center' });
        }
    }
    return out;
}

/** Resolve where an item links to (real route, page param, or hard href). */
export function resolveHref(item) {
    if (item.href) return item.href;
    if (item.route) {
        const r = safeRoute(item.route, item.params);
        if (r) return r;
    }
    // Fallback: an in-app Command Center page (Coming Soon / custom views).
    const base = safeRoute('platform.dashboard') || '/VenQore';
    return `${base}?view=${item.page || item.key}`;
}
