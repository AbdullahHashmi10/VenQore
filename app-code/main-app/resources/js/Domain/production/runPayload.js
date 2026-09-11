/**
 * Contract of the New Production Run screen (Pages/Inventory/Production/Create.jsx).
 *
 * The screen posts to route store.production.store, which is
 * App\Http\Controllers\V3\ProductionRunController@store:
 *   bom_id (required), warehouse_id (required), planned_qty (required, > 0),
 *   run_date (required, not in the future).
 * The screen used to send {product_id, quantity, recipe_id}, so every submit
 * failed validation. tests/tests/Feature/Hardening/ProductionScreenContractTest.php
 * posts exactly this shape.
 */

export const PRODUCTION_RUN_FIELDS = ['bom_id', 'warehouse_id', 'planned_qty', 'run_date'];

/** YYYY-MM-DD in the operator's local calendar. */
export function localIsoDate(d = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The exact body the screen sends. */
export function buildProductionRunPayload(form, today = new Date()) {
    return {
        bom_id: form.bom_id ? String(form.bom_id) : '',
        warehouse_id: form.warehouse_id ? String(form.warehouse_id) : '',
        planned_qty: Number(form.planned_qty) || 0,
        run_date: form.run_date || localIsoDate(today),
    };
}

/** Active BOMs that make the given product (all of them when no product is chosen). */
export function bomsForProduct(boms, productId) {
    const list = Array.isArray(boms) ? boms : [];
    if (!productId) return list;
    return list.filter((b) => String(b.product_id) === String(productId));
}

/** Component requirements for a run of `plannedQty` (by-products are outputs, not inputs). */
export function bomRequirements(bom, plannedQty) {
    const qty = Number(plannedQty) || 0;
    return (bom?.items || [])
        .filter((i) => !i.is_byproduct)
        .map((i) => ({ ...i, required: Math.round(Number(i.qty_per_unit) * qty * 10000) / 10000 }));
}
