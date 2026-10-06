/* ==========================================================================
   Register settings — the map of the workspace
   ==========================================================================
   Categories (the sidebar) and the search index (every setting, by the words
   people actually type). The `sid` of each entry is the `sid` of the <Row>
   that renders it, so search lands ON the setting and flashes it.
   ========================================================================== */

import {
    LayoutGrid, ShoppingBasket, MonitorSmartphone, MousePointerClick, Receipt,
    UtensilsCrossed, ChefHat, Printer, Boxes, Landmark, Wallet, Cable, Keyboard,
} from 'lucide-react';

export const GROUPS = [
    { id: 'register',   label: 'This register' },
    { id: 'restaurant', label: 'Restaurant & café' },
    { id: 'business',   label: 'Whole business' },
    { id: 'devices',    label: 'Devices & keys' },
];

export const CATEGORIES = [
    { id: 'layout',     group: 'register',   icon: LayoutGrid,         label: 'Screen layout',       hint: 'Where everything sits' },
    { id: 'catalog',    group: 'register',   icon: ShoppingBasket,     label: 'Product buttons',     hint: 'How products look' },
    { id: 'screen',     group: 'register',   icon: MonitorSmartphone,  label: 'Text & display',      hint: 'Size, theme, easy reading' },
    { id: 'buttons',    group: 'register',   icon: MousePointerClick,  label: 'Top bar buttons',     hint: 'Shortcuts on the top bar' },
    { id: 'checkout',   group: 'register',   icon: Receipt,            label: 'Checkout & returns',  hint: 'Bill, discounts, refunds' },
    { id: 'restaurant', group: 'restaurant', icon: UtensilsCrossed,    label: 'Tables & floor',      hint: 'Floor views and dining', restaurant: true },
    { id: 'kitchen',    group: 'restaurant', icon: ChefHat,            label: 'Kitchen tickets',     hint: 'Where orders are sent', restaurant: true },
    { id: 'receipts',   group: 'business',   icon: Printer,            label: 'Receipts',            hint: 'What the slip shows' },
    { id: 'stock',      group: 'business',   icon: Boxes,              label: 'Stock & prices',      hint: 'Overselling, low stock' },
    { id: 'money',      group: 'business',   icon: Landmark,           label: 'Tax & rounding',      hint: 'Rates, decimals, rounding' },
    { id: 'cash',       group: 'business',   icon: Wallet,             label: 'Cash & security',     hint: 'Drawer, shifts, passcode' },
    { id: 'hardware',   group: 'devices',    icon: Cable,              label: 'Hardware',            hint: 'Printers, drawer, scale' },
    { id: 'keys',       group: 'devices',    icon: Keyboard,           label: 'Keyboard shortcuts',  hint: 'Every key, and a tester' },
];

/* Old tab ids still arrive from the register ('?' opens 'keys', the printer
   light opens 'hardware'); a few were renamed. */
export const TAB_ALIASES = {
    counter: 'buttons',
    display: 'screen',
    selling: 'checkout',
    service: 'restaurant',
    tables: 'restaurant',
};

/* [sid, category, title, extra words people might type] */
const RAW = [
    ['layout.start', 'layout', 'Starting layout', 'preset grid scan counter column stack shape template'],
    ['layout.catalog', 'layout', 'Where the product list sits', 'catalog products left right top bottom off button pane'],
    ['layout.strip-rows', 'layout', 'Rows in the product strip', 'catalog strip rows height'],
    ['layout.payment', 'layout', 'Payment panel style', 'tender pay column bar sheet total'],
    ['layout.payment-side', 'layout', 'Payment panel side', 'tender left right bottom left handed customer display'],
    ['layout.scan', 'layout', 'Scan box and Add item', 'barcode search box scanner'],
    ['layout.order', 'layout', 'Current order list', 'cart basket order column hide'],
    ['layout.widths', 'layout', 'Column widths', 'drag divider width resize reset'],
    ['catalog.shape', 'catalog', 'Product button style', 'cards rows pills big cards tiles shape'],
    ['catalog.tiles', 'catalog', 'Products per row', 'columns tiles density grid count 3 4 5 auto'],
    ['catalog.categories', 'catalog', 'Category bar', 'category tabs sidebar horizontal vertical'],
    ['catalog.sort', 'catalog', 'Product order', 'sort top selling alphabetical price newest stock'],
    ['catalog.pictures', 'catalog', 'Product pictures', 'images photos thumbnails'],
    ['catalog.stock-badge', 'catalog', 'Stock left on buttons', 'stock badge quantity left'],
    ['catalog.hide-oos', 'catalog', 'Hide sold-out products', 'out of stock hide zero'],
    ['screen.theme', 'screen', 'Light or dark', 'theme dark mode night colours appearance'],
    ['screen.large', 'screen', 'Easy-read mode', 'large text senior accessibility big buttons contrast eyesight'],
    ['screen.scale', 'screen', 'Size of everything', 'zoom scale interface bigger smaller ui'],
    ['screen.rail', 'screen', 'Menu bar on the left', 'navigation rail sidebar menu'],
    ['buttons.drawer', 'buttons', 'Open cash drawer button', 'drawer cash'],
    ['buttons.parked', 'buttons', 'Held sales button', 'parked hold recall'],
    ['buttons.recent', 'buttons', 'Recent sales button', 'recent invoices reprint'],
    ['buttons.returns', 'buttons', 'Return mode button', 'refund return'],
    ['buttons.online', 'buttons', 'Online light', 'internet offline status'],
    ['buttons.printer', 'buttons', 'Printer light', 'printer status'],
    ['buttons.keys', 'buttons', 'Shortcuts button', 'keyboard'],
    ['buttons.fullscreen', 'buttons', 'Full screen button', 'fullscreen kiosk'],
    ['buttons.kitchen', 'buttons', 'Kitchen screen button', 'kds kitchen display'],
    ['buttons.queue', 'buttons', 'Customer TV screen button', 'queue tv order ready display'],
    ['checkout.tax', 'checkout', 'Tax on sales', 'gst vat tax'],
    ['checkout.fulfilment', 'checkout', 'Delivery from stock or supplier', 'fulfilment dropship'],
    ['checkout.free', 'checkout', 'Free items (bonus quantity)', 'free bonus quantity scheme'],
    ['checkout.calc', 'checkout', 'Quick price calculator', 'converter calculator item values'],
    ['checkout.round', 'checkout', 'Round the total on this till', 'round off rounding'],
    ['checkout.autofill', 'checkout', 'Fill in the exact cash', 'auto fill cash tendered'],
    ['checkout.cash-default', 'checkout', 'Start every sale as cash', 'cash sale default payment method'],
    ['checkout.discounts', 'checkout', 'Quick discount buttons', 'discount presets percent'],
    ['checkout.returns-mode', 'checkout', 'Return mode', 'refund return credit'],
    ['checkout.return-policy', 'checkout', 'What a return needs', 'return policy receipt reference customer'],
    ['checkout.return-window', 'checkout', 'How long returns are allowed', 'return window days'],
    ['checkout.restaurant-on', 'checkout', 'Restaurant and café tools', 'restaurant cafe kitchen tables food'],
    ['rest.service', 'restaurant', 'How you serve customers', 'service style counter tables both dine in'],
    ['rest.screen', 'restaurant', 'This register shows', 'restaurant screen floor counter terminal switch'],
    ['rest.floor-view', 'restaurant', 'Table view', 'floor layout map grid list sections tables view'],
    ['rest.floor-sort', 'restaurant', 'Table order', 'sort urgent table number'],
    ['rest.floor-size', 'restaurant', 'Table card size', 'size compact large'],
    ['rest.floor-details', 'restaurant', 'Details on each table', 'money due server waiter timer'],
    ['rest.floor-place', 'restaurant', 'Tables beside the order', 'floor position full screen beside'],
    ['rest.lanes', 'restaurant', 'Takeaway and delivery', 'takeaway delivery lanes collection'],
    ['rest.service-charge', 'restaurant', 'Service charge', 'service charge percent'],
    ['rest.tip', 'restaurant', 'Tip box on the bill', 'tip gratuity'],
    ['rest.plan', 'restaurant', 'Tables and areas', 'floor plan builder tables areas zones'],
    ['kitchen.prepares', 'kitchen', 'This business prepares orders', 'kitchen tickets kot prepare cook'],
    ['kitchen.mode', 'kitchen', 'One ticket or split by station', 'combine split station routing bar grill'],
    ['kitchen.main', 'kitchen', 'Main kitchen', 'default station main kitchen printer'],
    ['kitchen.stations', 'kitchen', 'Stations', 'station bar grill fryer cold prep pasta add'],
    ['kitchen.tags', 'kitchen', 'Station names on your products', 'import products station tag'],
    ['kitchen.test', 'kitchen', 'Print a test ticket', 'test kot ticket print'],
    ['kitchen.screens', 'kitchen', 'Kitchen and customer screens', 'kds tv queue display'],
    ['receipt.type', 'receipts', 'Receipt type', 'thermal a4 paper roll'],
    ['receipt.width', 'receipts', 'Paper roll width', '58mm 80mm 2 inch 3 inch paper size'],
    ['receipt.auto', 'receipts', 'Print after every sale', 'auto print receipt'],
    ['receipt.copies', 'receipts', 'Copies', 'copies duplicate'],
    ['receipt.cut', 'receipts', 'Cut the paper', 'auto cut'],
    ['receipt.bold', 'receipts', 'Darker headings', 'bold'],
    ['receipt.columns', 'receipts', 'Extra details on each item', 'serial number units mrp description batch expiry columns'],
    ['receipt.barcode', 'receipts', 'Barcode at the bottom', 'barcode invoice number'],
    ['receipt.footer', 'receipts', 'Thank-you message', 'footer message thank you note'],
    ['receipt.feed', 'receipts', 'Blank space at the end', 'feed lines extra space'],
    ['receipt.designer', 'receipts', 'Logo and full design', 'logo header design template'],
    ['stock.track', 'stock', 'Keep track of stock', 'inventory stock maintenance'],
    ['stock.negative', 'stock', 'Sell when stock shows zero', 'negative stock oversell'],
    ['stock.low', 'stock', 'Low stock warnings', 'low stock alert'],
    ['stock.threshold', 'stock', 'What counts as low', 'threshold minimum'],
    ['stock.batch', 'stock', 'Batches and expiry dates', 'batch expiry lot'],
    ['stock.wholesale', 'stock', 'Wholesale prices', 'wholesale trade price'],
    ['stock.barcode', 'stock', 'Barcode scanning', 'barcode scanner'],
    ['money.tax-rate', 'money', 'Standard tax rate', 'tax rate gst vat percent'],
    ['money.tax-basis', 'money', 'Prices include tax?', 'inclusive exclusive tax'],
    ['money.round', 'money', 'How the bill is rounded', 'round off whole decimals'],
    ['money.decimals', 'money', 'Decimal places', 'decimals paisa cents'],
    ['money.business', 'money', 'Business details on receipts', 'business name address phone tax number ntn'],
    ['money.fbr', 'money', 'FBR tax reporting', 'fbr pos id usin pakistan'],
    ['cash.drawer-auto', 'cash', 'Open the drawer for cash sales', 'drawer kick cash'],
    ['cash.drawer-now', 'cash', 'Open the drawer now', 'drawer test open'],
    ['cash.shift', 'cash', 'Shift and end-of-day report', 'shift z report close day cash count'],
    ['cash.passcode', 'cash', 'Passcode for settings', 'passcode pin admin lock'],
    ['cash.approvals', 'cash', 'Approvals for discounts and refunds', 'approval manager pin void discount refund'],
    ['hw.status', 'hardware', 'Connection status', 'station online offline'],
    ['hw.printer', 'hardware', 'Receipt printer', 'printer default choose'],
    ['hw.test-receipt', 'hardware', 'Print a test receipt', 'test print'],
    ['hw.drawer', 'hardware', 'Cash drawer', 'drawer kick'],
    ['hw.kitchen-printers', 'hardware', 'Kitchen and bar printers', 'kitchen bar printer role'],
    ['hw.scanner', 'hardware', 'Barcode scanner', 'scanner test'],
    ['hw.scale', 'hardware', 'Weighing scale', 'scale weight'],
    ['hw.display', 'hardware', 'Customer screen', 'customer display pole second screen'],
    ['hw.card', 'hardware', 'Card machine', 'card terminal eftpos payment'],
    ['hw.sync', 'hardware', 'Sales waiting to upload', 'offline sync queue'],
    ['keys.map', 'keys', 'All shortcuts', 'keyboard f1 f2 hotkeys'],
    ['keys.test', 'keys', 'Try a key', 'test key'],
];

export const SEARCH_INDEX = RAW.map(([sid, cat, title, words]) => ({ sid, cat, title, words: `${title} ${words}`.toLowerCase() }));

export function searchSettings(q, visibleCats) {
    const terms = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return SEARCH_INDEX
        .filter(e => visibleCats.has(e.cat))
        .map(e => {
            let score = 0;
            for (const t of terms) {
                if (!e.words.includes(t)) return null;
                score += e.title.toLowerCase().includes(t) ? 3 : 1;
            }
            return { ...e, score };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 24);
}
