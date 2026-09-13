import React, { useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PageHeader from '@/Components/PageHeader';
import { FormField, FormInput, FormSelect, PrimaryButton, SecondaryButton } from '@/Components/FormModal';
import { Factory, Package } from 'lucide-react';
import axios from 'axios';
import AsyncProductCombobox from '@/Components/AsyncProductCombobox';
import { bomRequirements, bomsForProduct, buildProductionRunPayload, localIsoDate } from '@/Domain/production/runPayload';
import { useTermText } from '@/lib/terms';

/*
 * New Production Run.
 *
 * Posts to store.production.store = V3 ProductionRunController@store, whose
 * contract is {bom_id, warehouse_id, planned_qty, run_date} (see
 * Domain/production/runPayload). A run is made FROM a bill of materials, so
 * the operator picks the product and the screen picks its active BOM, loaded
 * from GET /s/{store}/inventory/production/boms.
 */
export default function CreateProductionRun({ products = [], warehouses = [] }) {
    const { store } = usePage().props;
    const tt = useTermText();
    const [loading, setLoading] = useState(false);
    const [boms, setBoms] = useState([]);
    const [bomsLoading, setBomsLoading] = useState(true);
    const [bomsError, setBomsError] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [formData, setFormData] = useState(() => ({
        product_id: '',
        bom_id: '',
        planned_qty: 1,
        warehouse_id: warehouses.length === 1 ? String(warehouses[0].id) : '',
        run_date: localIsoDate(),
    }));
    const [errors, setErrors] = useState({});

    useEffect(() => {
        let cancelled = false;
        axios.get(`/s/${store?.slug}/inventory/production/boms`)
            .then((res) => { if (!cancelled) setBoms(res.data?.boms || []); })
            .catch(() => { if (!cancelled) setBomsError('Could not load bills of materials.'); })
            .finally(() => { if (!cancelled) setBomsLoading(false); });
        return () => { cancelled = true; };
    }, [store?.slug]);

    const productBoms = useMemo(() => bomsForProduct(boms, formData.product_id), [boms, formData.product_id]);
    const selectedBom = boms.find((b) => b.id === formData.bom_id) || null;
    const requirements = bomRequirements(selectedBom, formData.planned_qty);

    const selectProduct = (product) => {
        setSelectedProduct(product);
        const own = bomsForProduct(boms, product.id);
        setFormData((prev) => ({ ...prev, product_id: product.id, bom_id: own.length ? own[0].id : '' }));
    };

    const selectBom = (bomId) => {
        const bom = boms.find((b) => b.id === bomId);
        setFormData((prev) => ({ ...prev, bom_id: bomId, product_id: bom ? bom.product_id : prev.product_id }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            await axios.post(route('store.production.store', { store_slug: store?.slug }), buildProductionRunPayload(formData));

            // Global Sync Trigger (Production affects finished goods and raw materials)
            window.dispatchEvent(new CustomEvent('amd:product-updated'));
            localStorage.setItem('amd_product_latest_change', Date.now().toString());

            router.visit(route('store.production.index', { store_slug: store?.slug }));
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
            } else {
                alert(error.response?.data?.message || 'An error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    const noBomForProduct = !!formData.product_id && !bomsLoading && productBoms.length === 0;

    return (
        <OneGlanceLayout title="New Production Run">
            <Head title="New Production Run" />

            <div className="h-full flex flex-col gap-6 overflow-auto">
                <PageHeader
                    title="New Production Run"
                    subtitle="Create a new manufacturing batch"
                    icon={Factory}
                    breadcrumbs={[
                        { label: 'Inventory' },
                        { label: 'Production', href: route('store.production.index', { store_slug: store?.slug }) },
                        { label: 'New Run' }
                    ]}
                />

                <div className="grid grid-cols-3 gap-6">
                    {/* Form Card */}
                    <div className="col-span-2 bg-surface rounded-2xl border border-line p-6 relative overflow-hidden">
                        {/* Background Effect */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            {/* Product Selection */}
                            <FormField label={tt('Product to Manufacture')} required>
                                <AsyncProductCombobox
                                    selectedItem={selectedProduct || products.find(p => p.id === formData.product_id)}
                                    onSelect={(product) => {
                                        if (product) {
                                            selectProduct(product);
                                        } else {
                                            setSelectedProduct(null);
                                            setFormData((prev) => ({ ...prev, product_id: '', bom_id: '' }));
                                        }
                                    }}
                                    placeholder="Search product..."
                                />
                            </FormField>

                            <FormField
                                label="Bill of Materials"
                                required
                                error={errors.bom_id?.[0] || bomsError || (noBomForProduct ? 'This product has no active bill of materials.' : undefined)}
                            >
                                <FormSelect
                                    value={formData.bom_id}
                                    onChange={(e) => selectBom(e.target.value)}
                                    placeholder={bomsLoading ? 'Loading…' : 'Select bill of materials'}
                                >
                                    {productBoms.map(b => (
                                        <option key={b.id} value={b.id}>{`${b.product_name || 'Product'} — v${b.version}`}</option>
                                    ))}
                                </FormSelect>
                            </FormField>

                            <div className="grid grid-cols-3 gap-4">
                                <FormField label="Quantity to Produce" required error={errors.planned_qty?.[0]}>
                                    <FormInput
                                        type="number"
                                        min="0.0001"
                                        step="any"
                                        value={formData.planned_qty}
                                        onChange={(e) => setFormData({ ...formData, planned_qty: e.target.value })}
                                    />
                                </FormField>

                                <FormField label="Warehouse" required error={errors.warehouse_id?.[0]}>
                                    <FormSelect
                                        value={formData.warehouse_id}
                                        onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                                        placeholder="Select warehouse"
                                    >
                                        {warehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </FormSelect>
                                </FormField>

                                <FormField label="Run Date" required error={errors.run_date?.[0]}>
                                    <FormInput
                                        type="date"
                                        max={localIsoDate()}
                                        value={formData.run_date}
                                        onChange={(e) => setFormData({ ...formData, run_date: e.target.value })}
                                    />
                                </FormField>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-line">
                                <SecondaryButton onClick={() => router.visit(route('store.production.index', { store_slug: store?.slug }))}>
                                    Cancel
                                </SecondaryButton>
                                <PrimaryButton type="submit" loading={loading} disabled={!formData.bom_id}>
                                    Start Production
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>

                    {/* BOM Preview */}
                    <div className="bg-surface rounded-2xl border border-line p-6">
                        <h3 className="font-semibold text-lg text-ink mb-4 flex items-center gap-2">
                            <Package size={18} />
                            Materials Needed
                        </h3>

                        {selectedBom ? (
                            <div className="space-y-3">
                                {requirements.map((ing) => (
                                    <div key={ing.product_id} className="flex items-center justify-between p-3 bg-app rounded-lg">
                                        <div>
                                            <p className="font-medium text-ink">{ing.name}</p>
                                            <p className="text-xs text-ink-muted">{ing.sku}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-brand-600">{ing.required}</p>
                                            <p className="text-xs text-ink-muted">needed</p>
                                        </div>
                                    </div>
                                ))}
                                {requirements.length === 0 && (
                                    <p className="text-sm text-ink-muted">No components defined</p>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-ink-muted">
                                <Package size={32} className="mx-auto mb-2 opacity-50" />
                                <p>Select a bill of materials to see its components</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
