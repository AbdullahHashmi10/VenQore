/**
 * sectorCatalog — the 85 business types VenQore can be assembled for, in five
 * sectors. The TYPES come from config/business_types.php (exported to
 * resources/js/Data/businessTypes.json by `php artisan vq:business-types:export`)
 * — the same catalogue the builder's search and matcher use, so the site can
 * never list a business the builder does not understand. Only the sector pitch
 * and module proof live here. The count shown anywhere on the site is COMPUTED
 * (BUSINESS_TYPE_COUNT) — never typed.
 *
 * `modules` are the registry keys (config/modules.php) that unlock each
 * sector; they are shown as proof, so keep them in step with the registry.
 */

import catalogue from '@/Data/businessTypes.json';

const typesFor = (sector) =>
    catalogue.types
        .filter((t) => t.sector === sector)
        .map((t) => (t.note ? { key: t.key, name: t.name, note: t.note } : { key: t.key, name: t.name }));

export const SECTORS = [
    {
        key: 'services',
        name: 'Services, repairs & field trades',
        short: 'Services & trades',
        pitch: 'Job cards, quotations, recurring invoices, staff time and tool checkout — for businesses that sell hours and expertise, with or without stock.',
        modules: ['services', 'invoicing', 'quotations', 'recurring_invoices', 'staff_attendance', 'service jobs & calendar', 'tool checkout'],
        types: typesFor('services'),
    },
    {
        key: 'retail',
        name: 'Retail & merchandising',
        short: 'Retail',
        pitch: 'A fast barcode till with variants, batches and expiry, serials, units of measure and marketplace sync — counted properly at closing time.',
        modules: ['pos', 'inventory', 'barcodes & labels', 'variants', 'batches & expiry', 'serials', 'units of measure', 'marketplace sync'],
        types: typesFor('retail'),
    },
    {
        key: 'food',
        name: 'Food, beverage & hospitality',
        short: 'Food & hospitality',
        pitch: 'Table service, park-and-recall orders, kitchen tickets and recipes that draw ingredients out of stock, so food cost is a real number.',
        modules: ['pos', 'table service', 'park & recall', 'cookbook (recipes)', 'production runs'],
        types: typesFor('food'),
    },
    {
        key: 'wholesale',
        name: 'Wholesale, trade & B2B distribution',
        short: 'Wholesale & B2B',
        pitch: 'Sales orders, proposals, price tiers, khata credit and multi-location stock with transfers — for businesses that sell to other businesses on terms.',
        modules: ['sales orders', 'B2B proposals', 'pricing tiers', 'khata credit', 'multi-location', 'stock transfers', 'accounting workspace'],
        types: typesFor('wholesale'),
    },
    {
        key: 'manufacturing',
        name: 'Light manufacturing & assembly',
        short: 'Light manufacturing',
        pitch: 'Recipes and bills of materials, production runs, composite items, landed cost and purchase orders — raw material in, finished goods out, at real cost.',
        modules: ['cookbook', 'production runs', 'composite items', 'landed cost', 'purchase orders'],
        types: typesFor('manufacturing'),
    },
];

export const BUSINESS_TYPE_COUNT = SECTORS.reduce((n, s) => n + s.types.length, 0);
export const SECTOR_COUNT = SECTORS.length;
/** "85+" — rounded down to the nearest 5 so the claim never overstates the list. */
export const BUSINESS_TYPE_CLAIM = `${Math.floor(BUSINESS_TYPE_COUNT / 5) * 5}+`;
