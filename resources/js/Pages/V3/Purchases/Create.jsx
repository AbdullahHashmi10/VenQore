import PurchaseForm from './PurchaseForm';

/**
 * V3 CONSOLIDATION Phase 2 — this page is now a thin wrapper around the shared
 * PurchaseForm so Create and Edit cannot drift apart.
 */
export default function PurchaseCreate({ suppliers, products, warehouses, expenseCategories = [] }) {
    return (
        <PurchaseForm
            mode="create"
            suppliers={suppliers}
            products={products}
            warehouses={warehouses}
            expenseCategories={expenseCategories}
        />
    );
}
