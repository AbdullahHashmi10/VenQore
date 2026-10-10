/**
 * The 12 characterisation carts (FOH plan, Phase 0).
 * Pure data: cart lines use today's cart-line shape (see Pos.jsx addToCart).
 * `price` is the net unit price after a line discount; `original_price` is gross.
 */
const line = (id, name, price, qty, extra = {}) => ({
    cartItemId: `${id}-`, id, variant_id: null, name, price, original_price: price, discount: 0,
    qty, freeQuantity: 0, stock: 9999, category: 'General', ...extra,
});

export const CASES = [
    {
        id: '01-plain', name: '01 plain cart',
        cart: [line(1, 'Tea', 100, 2), line(2, 'Biscuit', 50, 3)],
        local: { pos_enable_tax: 'false' },
    },
    {
        id: '02-percent-discount', name: '02 percentage discount on cart',
        cart: [line(1, 'Tea', 100, 2), line(2, 'Biscuit', 50, 3)],
        sale: { discountType: 'percentage', discountValue: 10 },
        local: { pos_enable_tax: 'false' },
    },
    {
        id: '03-fixed-discount', name: '03 fixed discount on cart',
        cart: [line(1, 'Tea', 100, 2), line(2, 'Biscuit', 50, 3)],
        sale: { discountType: 'fixed', discountValue: 37.5 },
        local: { pos_enable_tax: 'false' },
    },
    {
        id: '04-line-discount', name: '04 line discount',
        cart: [line(1, 'Tea', 90, 2, { original_price: 100, discount: 10 }), line(2, 'Biscuit', 50, 3)],
        local: { pos_enable_tax: 'false' },
    },
    {
        id: '05-free-qty', name: '05 free quantity',
        cart: [line(1, 'Tea', 100, 2, { freeQuantity: 1 }), line(2, 'Biscuit', 50, 3)],
        local: { pos_enable_tax: 'false', pos_enable_free_qty: 'true' },
    },
    {
        id: '06-tax-inclusive', name: '06 inclusive tax 18%',
        cart: [line(1, 'Tea', 118, 2), line(2, 'Biscuit', 59, 3)],
        sale: { taxRate: 18, taxInclusive: true },
    },
    {
        id: '07-tax-exclusive', name: '07 exclusive tax 18% with discount',
        cart: [line(1, 'Tea', 100, 2), line(2, 'Biscuit', 50, 3)],
        sale: { taxRate: 18, taxInclusive: false, discountType: 'percentage', discountValue: 5 },
    },
    {
        id: '08-rounding', name: '08 rounding on (whole units)',
        cart: [line(1, 'Tea', 33.33, 3), line(2, 'Biscuit', 12.49, 7)],
        sale: { taxRate: 17, taxInclusive: false },
        local: { pos_round_off: 'true' },
        settings: { round_off_total: '0' },
    },
    {
        id: '09-service-and-tip', name: '09 service charge + tip settings are ignored at the counter till (tables live in Front of House)',
        cart: [line(1, 'Karahi', 1800, 1), line(2, 'Naan', 40, 4)],
        sale: { taxRate: 16, taxInclusive: false, tipAmount: 150 },
        settings: { service_charge_percent: '10', service_mode: 'tables' },
    },
    {
        id: '10-delivery-fee', name: '10 delivery fee as additional charge',
        cart: [line(1, 'Burger', 450, 2)],
        sale: { additionalCharges: 120, additionalChargesLabel: 'Delivery fee', delivery_charge: 120 },
        local: { pos_enable_tax: 'false' },
    },
    {
        id: '11-variant-modifier', name: '11 variant + modifier line',
        // Shape produced by Pos.jsx addToCart(product, variant, mods) since the 6 Oct add-on fix:
        // price = original_price = base + sum(price_delta) (the full unit price), basePrice = base,
        // mods = the picked options. Before the fix original_price was the base alone, so the
        // add-ons were shown on the line but left out of the total and the saved sale.
        cart: [line(5, 'Pizza (Large)', 1650, 1, {
            cartItemId: '5-9-31.32', variant_id: 9, original_price: 1650, basePrice: 1500,
            mods: [{ id: 31, name: 'Extra cheese', price_delta: 100 }, { id: 32, name: 'Olives', price_delta: 50 }],
        })],
        local: { pos_enable_tax: 'false' },
    },
    {
        id: '12-weighed', name: '12 weighed (fractional qty)',
        cart: [line(8, 'Rice (kg)', 210, 1.375, { unit: 'kg' })],
        sale: { taxRate: 5, taxInclusive: true },
    },
    {
        id: '13-addon-discount-tax', name: '13 add-on line with line discount, 2 qty, exclusive tax 10%',
        cart: [
            line(5, 'Pizza (Large)', 1550, 2, {
                cartItemId: '5-9-31.32', variant_id: 9, original_price: 1650, basePrice: 1500, discount: 100,
                mods: [{ id: 31, name: 'Extra cheese', price_delta: 100 }, { id: 32, name: 'Olives', price_delta: 50 }],
            }),
            line(2, 'Naan', 40, 3),
        ],
        sale: { taxRate: 10, taxInclusive: false },
    },
];
