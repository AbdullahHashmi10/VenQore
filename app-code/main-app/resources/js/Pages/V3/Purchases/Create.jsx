import React from 'react';
import { usePage, router } from '@inertiajs/react';
import PurchaseForm from './PurchaseForm';
import PurchaseTourGuide from '@/Components/PurchaseTourGuide';

/**
 * V3 CONSOLIDATION Phase 2 — this page is now a thin wrapper around the shared
 * PurchaseForm so Create and Edit cannot drift apart.
 */
export default function PurchaseCreate({ suppliers, products, warehouses, expenseCategories = [] }) {
    const { store, onboarding_metrics } = usePage().props;
    const isTourActive = ['purchase_tour', 'purchase_tour_sidebar', 'purchase_tour_start'].includes(store?.onboarding_step)
        || (!store?.onboarding_completed && !onboarding_metrics?.has_purchases);

    return (
        <>
            <PurchaseForm
                mode="create"
                suppliers={suppliers}
                products={products}
                warehouses={warehouses}
                expenseCategories={expenseCategories}
                onSaved={(res) => {
                    if (isTourActive) {
                        router.post(
                            route('store.onboarding.step', { store_slug: store?.slug }),
                            { step: 'purchase_congratulations' },
                            {
                                preserveScroll: true,
                                onSuccess: () => {
                                    router.reload({ only: ['store'] });
                                }
                            }
                        );
                    } else {
                        router.visit(route('store.v3.purchases.index', { store_slug: store?.slug }));
                    }
                }}
            />
            <PurchaseTourGuide store={store} suppliers={suppliers} />
        </>
    );
}
