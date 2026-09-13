import PurchaseForm from './PurchaseForm';

/**
 * V3 CONSOLIDATION Phase 2 — edit a posted purchase.
 *
 * Saving reverses the existing journal entries and re-posts them. The originals
 * are flagged `is_reversed` and kept, never mutated.
 */
export default function PurchaseEdit({
    purchase,
    items,
    landedCosts,
    suppliers,
    products,
    warehouses,
    expenseCategories = [],
}) {
    return (
        <PurchaseForm
            mode="edit"
            purchase={purchase}
            items={items}
            landedCosts={landedCosts}
            suppliers={suppliers}
            products={products}
            warehouses={warehouses}
            expenseCategories={expenseCategories}
        />
    );
}
