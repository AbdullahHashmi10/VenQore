/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  siteMap — the ONE list of public links.                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * The header mega-menus, the mobile sheet and the footer all read from here.
 * Before this file existed the same links were typed out by hand in sixteen
 * places (fifteen V6 pages + MarketingLayout) and had already drifted — the
 * footer on V6 pages had no Pricing, no Solutions, no Free tools and no
 * Partners, so a visitor on /about could not reach /tools at all.
 *
 * Point, never copy: add a public page here and it appears everywhere.
 * Counts in descriptions must match V6_PUBLIC_PAGE_REGISTER.md §5.
 */

import { BUSINESS_TYPE_CLAIM } from './sectorCatalog';

export const NAV_PRODUCT = [
    {
        heading: 'Build',
        links: [
            { label: 'Blueprint', href: '/blueprint', desc: 'Describe it. Approve the plan.' },
            { label: 'See a build', href: '/onboarding', desc: 'Four minutes, start to live.' },
            { label: 'Watch it assemble', href: '/features', desc: 'Only the modules you use, switched on.' },
        ],
    },
    {
        heading: 'Run',
        links: [
            { label: 'The register', href: '/pos', desc: 'A till you compose yourself.' },
            { label: 'Documents', href: '/documents', desc: 'Thirteen types, one editor.' },
            { label: 'VenSynQ', href: '/vensynq', desc: 'Sell in five places, count once.' },
        ],
    },
    {
        heading: 'Know',
        links: [
            { label: 'The dashboard', href: '/dashboard-preview', desc: '58 readings, self-assembling.' },
            { label: 'The Reckoner', href: '/reckoner', desc: 'One place a number is defined.' },
            { label: 'Core Ledger', href: '/ledger', desc: 'One engine. Every number.' },
        ],
    },
];

export const NAV_PRODUCT_FOOT = {
    label: 'SmartCapture — a photo in, a posted transaction out',
    href: '/smartcapture',
};

export const SOLUTIONS = [
    { label: 'Grocery & supermarket', href: '/solutions/grocery', desc: 'Fast checkout, real margins.' },
    { label: 'Wholesale & distribution', href: '/solutions/wholesale', desc: 'Credit terms and price tiers.' },
    { label: 'Pharmacy', href: '/solutions/pharmacy', desc: 'Batch and expiry that hold the line.' },
    { label: 'Apparel & fashion', href: '/solutions/clothing', desc: 'Size and colour, counted properly.' },
    { label: 'Electronics & hardware', href: '/solutions/electronics-store', desc: 'Serial and IMEI, tracked to the unit.' },
    { label: 'Multi-branch chains', href: '/solutions/multi-store', desc: 'One truth across every location.' },
];

export const COMPARE = [
    { label: 'VenQore vs Square', href: '/compare/venqore-vs-square' },
    { label: 'VenQore vs Vyapar', href: '/compare/venqore-vs-vyapar' },
    { label: 'All comparisons', href: '/compare' },
];

export const RESOURCES = [
    { label: 'Free tools', href: '/tools', desc: 'Invoices, barcodes, calculators — free.' },
    { label: 'Documentation', href: '/docs', desc: 'Guides and technical references.' },
    { label: 'Help centre', href: '/help', desc: 'Step-by-step feature workflows.' },
    { label: 'Blog', href: '/blog', desc: 'Retail and accounting playbooks.' },
    { label: 'Live demo', href: '/demo', desc: 'Try it with sample data.' },
    { label: 'Roadmap', href: '/roadmap', desc: 'What ships next, in public.' },
];

export const COMPANY = [
    { label: 'About', href: '/about', desc: 'Mission, architecture and principles.' },
    { label: 'Security', href: '/security', desc: 'Isolation, roles and the record.' },
    { label: 'Contact', href: '/contact', desc: 'A person answers this one.' },
    { label: 'Partners', href: '/partners', desc: 'Resell and implement VenQore.' },
    { label: 'Newsletter', href: '/subscribe', desc: 'What changed, monthly.' },
];

/** Top-level header items. `menu` renders a mega panel; `href` alone is a plain link. */
export const HEADER_NAV = [
    { key: 'product', label: 'Product', href: '/blueprint', menu: 'product' },
    { key: 'solutions', label: 'Solutions', href: '/solutions', menu: 'solutions' },
    { key: 'features', label: 'Features', href: '/features' },
    { key: 'pricing', label: 'Pricing', href: '/pricing' },
    { key: 'resources', label: 'Resources', href: '/tools', menu: 'resources' },
    { key: 'company', label: 'Company', href: '/about', menu: 'company' },
];

export const FOOTER_COLUMNS = [
    {
        heading: 'Product',
        links: [
            { label: 'Blueprint', href: '/blueprint' },
            { label: 'Features', href: '/features' },
            { label: 'Pricing', href: '/pricing' },
            { label: 'The register', href: '/pos' },
            { label: 'Documents', href: '/documents' },
            { label: 'Dashboard', href: '/dashboard-preview' },
            { label: 'SmartCapture', href: '/smartcapture' },
            { label: 'The Reckoner', href: '/reckoner' },
            { label: 'Core Ledger', href: '/ledger' },
            { label: 'VenSynQ', href: '/vensynq' },
        ],
    },
    {
        heading: 'Solutions',
        links: [
            ...SOLUTIONS.map(({ label, href }) => ({ label, href })),
            { label: `All ${BUSINESS_TYPE_CLAIM} business types`, href: '/solutions#business-types' },
            { label: 'Compare VenQore', href: '/compare' },
        ],
    },
    {
        heading: 'Resources',
        links: [
            { label: 'Free tools', href: '/tools' },
            { label: 'Documentation', href: '/docs' },
            { label: 'Help centre', href: '/help' },
            { label: 'Blog', href: '/blog' },
            { label: 'Live demo', href: '/demo' },
            { label: 'See a build', href: '/onboarding' },
            { label: 'Roadmap', href: '/roadmap' },
            { label: 'Known issues', href: '/known-issues' },
        ],
    },
    {
        heading: 'Company',
        links: [
            { label: 'About', href: '/about' },
            { label: 'Security', href: '/security' },
            { label: 'Contact', href: '/contact' },
            { label: 'Partners', href: '/partners' },
            { label: 'Newsletter', href: '/subscribe' },
            { label: 'Digital products', href: '/digital-products' },
            { label: 'Sign in', href: '/login' },
        ],
    },
];

export const LEGAL = [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Cookies', href: '/privacy#cookies' },
    { label: 'Refund policy', href: '/refund-policy' },
];

export const CONTACT = {
    whatsapp: { href: 'https://wa.me/923091999489', label: 'WhatsApp +92 309 1999489' },
    email: { href: 'mailto:hello@venqore.com', label: 'hello@venqore.com' },
};

export const PRIMARY_CTA = { label: 'Start building', href: '/build-workspace' };

/** Every href above, flattened — used by the link audit and the mobile sheet. */
export const ALL_LINKS = [
    ...NAV_PRODUCT.flatMap((g) => g.links),
    NAV_PRODUCT_FOOT,
    ...SOLUTIONS,
    ...COMPARE,
    ...RESOURCES,
    ...COMPANY,
    ...FOOTER_COLUMNS.flatMap((c) => c.links),
    ...LEGAL,
];

/**
 * Is `href` the page being viewed (or its section)? `/solutions/pharmacy`
 * lights up Solutions; `/` only matches itself.
 */
export function isCurrent(href, path) {
    if (!href || !path) return false;
    const clean = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
    const target = href.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
    if (target === '/') return clean === '/';
    return clean === target || clean.startsWith(`${target}/`);
}

/** Which top-level menu owns the current path — for aria-current on the trigger. */
export function activeTopKey(path) {
    const inGroup = (links) => links.some((l) => isCurrent(l.href, path));
    if (inGroup(NAV_PRODUCT.flatMap((g) => g.links)) || isCurrent(NAV_PRODUCT_FOOT.href, path)) return 'product';
    if (isCurrent('/solutions', path) || isCurrent('/compare', path)) return 'solutions';
    if (isCurrent('/features', path)) return 'features';
    if (isCurrent('/pricing', path)) return 'pricing';
    if (inGroup(RESOURCES) || isCurrent('/known-issues', path)) return 'resources';
    if (inGroup(COMPANY) || isCurrent('/digital-products', path) || isCurrent('/partner-support', path)) return 'company';
    return null;
}
