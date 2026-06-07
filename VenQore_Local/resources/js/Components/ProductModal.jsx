import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm, usePage, router } from '@inertiajs/react';
import { X, Save, Clock, FileText, ArrowUpRight, ArrowDownLeft, Box, DollarSign, Image, Upload, ChevronDown, Check, RefreshCw, Trash2, Plus, Edit, ExternalLink } from 'lucide-react';
import PremiumButton from '@/Components/PremiumButton';
import axios from 'axios';
import PremiumSelect from '@/Components/PremiumSelect';
import PasscodeModal from '@/Components/PasscodeModal';
import { Lock as LockIcon, Unlock } from 'lucide-react';

const StatCard = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center border border-slate-100 dark:border-slate-600">
            {icon}
        </div>
    </div>
);



const PREMADE_BASE_UNITS = ['pcs', 'kg', 'ltr', 'm', 'g', 'oz', 'lb'];
const PREMADE_SECONDARY_UNITS = ['box', 'carton', 'pack', 'dozen', 'crate', 'bundle', 'roll'];

export default function ProductModal({ product, onClose, isOpen, mode = 'view', warehouses = [], categories = [], attributes = [], onSubmit, initialName = '' }) {
    const [activeTab, setActiveTab] = useState('details');
    const [isNewCategory, setIsNewCategory] = useState(false);
    const isEditable = mode === 'create' || mode === 'edit';
    const { settings, store } = usePage().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        name: product?.name || initialName || '',
        sku: product?.sku || '',
        category_id: product?.category_id || '',
        new_category_name: '',
        base_unit: '',
        secondary_unit: '',
        conversion_rate: '',
        unit: product?.unit || 'pcs',
        stock: product?.stock ?? product?.stock_quantity ?? 0,
        price: product?.price || 0,
        cost_price: product?.cost_price || product?.cost || 0,
        min_stock_alert: product?.min_stock_alert || 5,
        description: product?.description || '',
        short_description: product?.short_description || '',
        main_image: null,
        main_image_preview: product?.image || null,
        gallery_images: [],
        existing_images: product?.images || [],
        deleted_images: [],
        variants: product?.variants || [],
        barcodes: product?.barcodes || [],
        warehouse_id: product?.stocks?.[0]?.warehouse_id || warehouses?.[0]?.id || '',
        batch_number: '',
        expiry_date: '',
    });

    const [isStockUnlocked, setIsStockUnlocked] = useState(false);
    const [showPasscodeModal, setShowPasscodeModal] = useState(false);


    const [customStats, setCustomStats] = useState(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState(null);
    const [variantForm, setVariantForm] = useState({
        variant_name: '',
        sku: '',
        price: '',
        cost_price: '',
        stock: 0,
        barcode: '',
        attributes: {},
    });
    const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
    const [editingBarcode, setEditingBarcode] = useState(null);
    const [barcodeForm, setBarcodeForm] = useState({
        barcode: '',
        barcode_type: 'EAN13',
        is_primary: false,
        description: '',
    });

    const [reservations, setReservations] = useState([]);
    const [loadingReservations, setLoadingReservations] = useState(false);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [quickViewHistory, setQuickViewHistory] = useState(null);
    const [loadingQuickView, setLoadingQuickView] = useState(false);
    // Track last product id for which history was fetched, to avoid refetching unnecessarily
    const historyFetchedFor = useRef(null);

    useEffect(() => {
        if (activeTab === 'reservations' && product?.id) {
            fetchReservations();
        }
        if (activeTab === 'history' && product?.id && historyFetchedFor.current !== product.id) {
            fetchHistory();
        }
    }, [activeTab, product]);

    const fetchReservations = async () => {
        setLoadingReservations(true);
        try {
            const res = await axios.get(route('store.inventory.reservations', { store_slug: store?.slug, product: product.id }));
            setReservations(res.data);
        } catch (error) {
            console.error("Failed to fetch reservations", error);
        } finally {
            setLoadingReservations(false);
        }
    };

    useEffect(() => {
        if (isOpen && mode === 'create') {
            reset();
            setIsNewCategory(false);
            setData(data => ({
                ...data,
                name: product?.name || initialName || '',
                unit: 'pcs',
                warehouse_id: warehouses?.[0]?.id || ''
            }));
        } else if (isOpen && product) {
            setIsNewCategory(false);
            // Reset history cache when a different product is opened
            if (historyFetchedFor.current !== product.id) {
                setHistory([]);
                historyFetchedFor.current = null;
            }
            setData({
                name: product.name || '',
                sku: product.sku || '',
                category_id: product.category_id || '',
                new_category_name: '',
                base_unit: '',
                secondary_unit: '',
                conversion_rate: '',
                unit: product.unit || 'pcs',
                stock: product.stock ?? product.stock_quantity ?? 0,
                price: product.price || 0,
                cost_price: product.cost_price || product.cost || 0,
                min_stock_alert: product.min_stock_alert || 5,
                description: product.description || '',
                short_description: product.short_description || '',
                main_image: null,
                main_image_preview: product.image || null,
                gallery_images: [],
                existing_images: product.images || [],
                deleted_images: [],
                warehouse_id: product?.stocks?.[0]?.warehouse_id || warehouses?.[0]?.id || '',
                barcodes: product.barcodes || [], // Added back
                variants: product.variants || [],   // Added back
            });
            setIsStockUnlocked(false);
        }
    }, [product, mode, isOpen, initialName]);

    const fetchCustomStats = async () => {
        if (!dateRange.start || !dateRange.end) return;
        try {
            const response = await axios.get(route('store.inventory.stats', { store_slug: store?.slug, product: product.id }), {
                params: { start_date: dateRange.start, end_date: dateRange.end }
            });
            setCustomStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const generateSKU = () => {
        const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        const prefix = data.name ? data.name.substring(0, 3).toUpperCase() : 'PRD';
        setData('sku', `${prefix}-${random}`);
    };

    const handleMainImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData(data => ({
                ...data,
                main_image: file,
                main_image_preview: URL.createObjectURL(file)
            }));
        }
    };

    const handleGalleryUpload = (e) => {
        const files = Array.from(e.target.files);
        const total = files.length + data.gallery_images.length + data.existing_images.length;
        if (total > 9) {
            alert('You can upload up to 9 gallery items.');
            return;
        }
        setData('gallery_images', [...data.gallery_images, ...files]);
    };

    const removeGalleryImage = (index) => {
        const newImages = [...data.gallery_images];
        newImages.splice(index, 1);
        setData('gallery_images', newImages);
    };

    const removeExistingImage = (id) => {
        setData(data => ({
            ...data,
            existing_images: data.existing_images.filter(img => img.id !== id),
            deleted_images: [...data.deleted_images, id]
        }));
    };

    const handleAddVariant = () => {
        setEditingVariant(null);
        setVariantForm({
            variant_name: '',
            sku: '',
            price: data.price || '',
            cost_price: data.cost_price || '',
            stock: 0,
            barcode: '',
            attributes: {},
        });
        setIsVariantModalOpen(true);
    };

    const handleEditVariant = (variant) => {
        setEditingVariant(variant);
        const attrObj = {};
        variant.attributes?.forEach(attr => {
            attrObj[attr.attribute_id] = attr.value;
        });
        setVariantForm({
            variant_name: variant.name,
            sku: variant.sku || '',
            price: variant.price || '',
            cost_price: variant.cost_price || '',
            stock: variant.stock || 0,
            barcode: variant.barcode || '',
            attributes: attrObj,
        });
        setIsVariantModalOpen(true);
    };

    const handleSaveVariant = () => {
        // Build variant name from attributes
        const attrValues = Object.entries(variantForm.attributes)
            .map(([attrId, value]) => value)
            .filter(Boolean)
            .join(' - ');

        const newVariant = {
            id: editingVariant?.id || Date.now(),
            name: variantForm.variant_name || attrValues || 'Unnamed Variant',
            sku: variantForm.sku,
            price: parseFloat(variantForm.price) || 0,
            cost_price: parseFloat(variantForm.cost_price) || 0,
            stock: parseInt(variantForm.stock) || 0,
            barcode: variantForm.barcode,
            is_active: true,
            attributes: Object.entries(variantForm.attributes).map(([attrId, value]) => ({
                attribute_id: parseInt(attrId),
                attribute_name: attributes.find(a => a.id === parseInt(attrId))?.name || '',
                value: value,
            })).filter(attr => attr.value),
        };

        if (editingVariant) {
            setData('variants', data.variants.map(v => v.id === editingVariant.id ? newVariant : v));
        } else {
            setData('variants', [...data.variants, newVariant]);
        }
        setIsVariantModalOpen(false);
    };

    const handleDeleteVariant = (variantId) => {
        if (confirm('Are you sure you want to delete this variant?')) {
            setData('variants', data.variants.filter(v => v.id !== variantId));
        }
    };

    const handleAddBarcode = () => {
        setEditingBarcode(null);
        setBarcodeForm({
            barcode: '',
            barcode_type: 'EAN13',
            is_primary: (data.barcodes?.length || 0) === 0, // First barcode is primary
            description: '',
        });
        setIsBarcodeModalOpen(true);
    };

    const handleEditBarcode = (barcode) => {
        setEditingBarcode(barcode);
        setBarcodeForm({
            barcode: barcode.barcode,
            barcode_type: barcode.type,
            is_primary: barcode.is_primary,
            description: barcode.description || '',
        });
        setIsBarcodeModalOpen(true);
    };

    const handleSaveBarcode = () => {
        const newBarcode = {
            id: editingBarcode?.id || Date.now(),
            barcode: barcodeForm.barcode,
            type: barcodeForm.barcode_type,
            is_primary: barcodeForm.is_primary,
            description: barcodeForm.description,
            is_active: true,
        };

        // If setting as primary, unset other primary barcodes
        let updatedBarcodes = data.barcodes || [];
        if (newBarcode.is_primary) {
            updatedBarcodes = updatedBarcodes.map(bc => ({ ...bc, is_primary: false }));
        }

        if (editingBarcode) {
            setData('barcodes', updatedBarcodes.map(bc => bc.id === editingBarcode.id ? newBarcode : bc));
        } else {
            setData('barcodes', [...updatedBarcodes, newBarcode]);
        }
        setIsBarcodeModalOpen(false);
    };

    const handleDeleteBarcode = (barcodeId) => {
        if (confirm('Are you sure you want to delete this barcode?')) {
            setData('barcodes', (data.barcodes || []).filter(bc => bc.id !== barcodeId));
        }
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();

        if (onSubmit) {
            // Custom submission handler (e.g. for Quick Add via Axios)
            const submissionData = {};
            // Rebuild object without stock if in edit mode
            Object.keys(data).forEach(key => {
                if (mode === 'edit' && key === 'stock') return;
                submissionData[key] = data[key];
            });

            onSubmit(submissionData, (errors) => {
                // Handle errors from callback if needed
            });
            return;
        }

        if (mode === 'create') {
            post(route('store.inventory.store', { store_slug: store?.slug }), {
                forceFormData: true,
                onSuccess: (page) => {
                    // Global Sync Trigger
                    window.dispatchEvent(new CustomEvent('amd:product-updated'));
                    localStorage.setItem('amd_product_latest_change', Date.now().toString());

                    // Call the onSuccess callback if present
                    if (onSuccess) {
                        const newProduct = page.props.flash?.product || page.props.product;
                        onSuccess(newProduct);
                    }
                    
                    onClose();
                },
            });
        } else {
            // For updates with files, we MUST use POST with _method="PUT" because
            // PHP/Laravel cannot read files from native PUT requests due to standard limitations.
            post(route('store.inventory.update', { store_slug: store?.slug, product: product.id }), {
                forceFormData: true,
                transform: (data) => {
                    const transformed = { _method: 'PUT' };
                    // Whitelist style rebuild. Only Omit stock if NOT unlocked.
                    Object.keys(data).forEach(key => {
                        if (key === 'stock' && !isStockUnlocked) return;
                        transformed[key] = data[key];
                    });
                    return transformed;
                },
                onSuccess: (page) => {
                    // Global Sync Trigger
                    window.dispatchEvent(new CustomEvent('amd:product-updated'));
                    localStorage.setItem('amd_product_latest_change', Date.now().toString());

                    if (onSuccess) {
                        const updatedProduct = page.props.flash?.product || page.props.product;
                        onSuccess(updatedProduct);
                    }

                    onClose();
                },
            });
        }
    };



    const renderInventorySection = () => (
        <section>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Box size={16} className="text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Inventory</h3>
                </div>
                {mode === 'edit' && !isStockUnlocked && (
                    <button 
                        type="button"
                        onClick={() => setShowPasscodeModal(true)}
                        className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all uppercase tracking-tight"
                    >
                        <LockIcon size={12} /> Unlock Stock
                    </button>
                )}
                {mode === 'edit' && isStockUnlocked && (
                    <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg flex items-center gap-1.5 uppercase tracking-tight animate-pulse">
                        <Unlock size={12} /> Stock Editable
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Warehouse</label>
                        {isEditable ? (
                            <PremiumSelect
                                value={data.warehouse_id}
                                onChange={(val) => setData('warehouse_id', val)}
                                options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                                placeholder="Select Warehouse"
                            />
                        ) : (
                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300">
                                {warehouses.find(w => w.id === data.warehouse_id)?.name || 'Main Store'}
                            </div>
                        )}
                    </div>

                    {/* Improved Stock Breakdown */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Stock Status</label>
                        {mode === 'create' || isStockUnlocked ? (
                            <div className="relative group">
                                <input
                                    type="number"
                                    value={data.stock}
                                    onChange={(e) => setData('stock', e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border text-slate-800 dark:text-white font-medium focus:ring-2 ring-indigo-500/20 outline-none transition-all ${isStockUnlocked ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/10' : 'border-slate-200 dark:border-slate-700'}`}
                                    placeholder={isStockUnlocked ? "Enter New Stock Count" : "Initial Stock"}
                                    autoFocus={isStockUnlocked}
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center relative group">
                                    <span className="block text-[10px] text-slate-400 uppercase">Total</span>
                                    <span className="block text-sm font-bold text-slate-700 dark:text-white">
                                        {product?.stock ?? product?.stock_quantity ?? 0}
                                    </span>
                                    {isEditable && (
                                        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-slate-400 border border-white dark:border-slate-900" title="Read Only"></div>
                                    )}
                                </div>
                                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 text-center">
                                    <span className="block text-[10px] text-amber-600 dark:text-amber-400 uppercase">Reserved</span>
                                    <span className="block text-sm font-bold text-amber-700 dark:text-amber-300">
                                        {product?.reserved_stock ?? product?.reserved_quantity ?? 0}
                                    </span>
                                </div>
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center">
                                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 uppercase">Available</span>
                                    <span className="block text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                        {product?.available_stock ?? ((product?.stock ?? product?.stock_quantity ?? 0) - (product?.reserved_stock ?? product?.reserved_quantity ?? 0))}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Low Stock Alert</label>
                        <input
                            type="number"
                            value={data.min_stock_alert}
                            onChange={(e) => setData('min_stock_alert', e.target.value)}
                            disabled={!isEditable}
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-60"
                        />
                    </div>
                </div>
                {(props.settings?.batch_tracking_enabled === '1' || props.settings?.batch_tracking_enabled === true) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Batch Number</label>
                            <input
                                type="text"
                                value={data.batch_number}
                                onChange={e => setData('batch_number', e.target.value)}
                                disabled={!isEditable}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-60"
                                placeholder="Optional"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Expiry Date</label>
                            <input
                                type="date"
                                value={data.expiry_date}
                                onChange={e => setData('expiry_date', e.target.value)}
                                disabled={!isEditable}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-60"
                            />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );

    const renderReservationsTab = () => (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Active Reservations</h3>
                    <p className="text-xs text-slate-500">Stock held in active Pre-Sales</p>
                </div>
            </div>

            {loadingReservations ? (
                <div className="p-12 text-center">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-sm text-slate-500">Loading reservation details...</p>
                </div>
            ) : reservations.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-bold text-slate-500">
                            <tr>
                                <th className="p-4 pl-6">Date</th>
                                <th className="p-4">Order #</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4 text-right pr-6">Qty Held</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900">
                            {reservations.map((res) => (
                                <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 pl-6 text-slate-600 dark:text-slate-400">{res.date}</td>
                                    <td className="p-4 font-medium text-indigo-600 dark:text-indigo-400">{res.order_number}</td>
                                    <td className="p-4 font-medium text-slate-800 dark:text-white">{res.customer}</td>
                                    <td className="p-4 text-right pr-6 font-bold text-amber-600 dark:text-amber-400">{res.quantity_reserved}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Box className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No active reservations.</p>
                    <p className="text-xs text-slate-400 mt-1">This product is not currently held in any pre-sales.</p>
                </div>
            )}
        </div>
    );

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await axios.get(route('store.inventory.history', { store_slug: store?.slug, product: product.id }));
            setHistory(res.data);
            historyFetchedFor.current = product.id;
        } catch (error) {
            console.error('Failed to fetch history', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleHistoryClick = async (item) => {
        // Single click — open quick view popup
        setQuickViewHistory({ _loading: true, type: item.type, invoice_number: item.invoice_number });
        setLoadingQuickView(true);
        try {
            let res;
            if (item.type === 'Sale' || item.type === 'Return') {
                res = await axios.get(route('store.sales.show', { store_slug: store?.slug, sale: item.transaction_id }), { headers: { 'X-Inertia': true, 'Accept': 'application/json' } });
                setQuickViewHistory({ ...res.data?.props?.sale ?? res.data, type: item.type, _route: item.route });
            } else {
                res = await axios.get(route('store.purchases.show', { store_slug: store?.slug, purchase: item.transaction_id }), { headers: { 'X-Inertia': true, 'Accept': 'application/json' } });
                setQuickViewHistory({ ...res.data?.props?.invoice ?? res.data?.props?.purchase ?? res.data, type: 'Purchase', _route: item.route });
            }
        } catch (err) {
            // Fallback: show basic info from the list row
            setQuickViewHistory({ ...item, _fallback: true });
        } finally {
            setLoadingQuickView(false);
        }
    };

    const handleHistoryDoubleClick = (item) => {
        // Double click — open editor
        setQuickViewHistory(null);
        if (item.type === 'Sale' || item.type === 'Return') {
            router.visit(route('store.sales.edit', { store_slug: store?.slug, sale: item.transaction_id }));
        } else {
            router.visit(route('store.purchases.show', { store_slug: store?.slug, purchase: item.transaction_id }));
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            {data.main_image_preview ? (
                                <img src={data.main_image_preview} alt={data.name} className="w-full h-full object-cover" />
                            ) : (
                                <Box size={24} className="text-slate-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{mode === 'create' ? 'Add New Product' : data.name}</h2>
                            <p className="text-sm text-slate-500 font-medium">{mode === 'create' ? 'Enter product details' : `SKU: ${data.sku}`}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto">
                    {['details', 'reservations', 'extra', 'variants', ...(mode !== 'create' ? ['history', 'purchase_stats'] : [])].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap capitalize ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            {tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-slate-900/30">

                    {/* DETAILS TAB */}
                    {activeTab === 'details' && (
                        <div className="p-8 space-y-8">

                            {/* Basic Info */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FileText size={16} className="text-indigo-500" /> Basic Info
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Product Name</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            disabled={!isEditable}
                                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-60"
                                        />
                                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">SKU</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={data.sku}
                                                onChange={e => setData('sku', e.target.value)}
                                                disabled={!isEditable}
                                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-60"
                                            />
                                            {isEditable && (
                                                <button
                                                    onClick={generateSKU}
                                                    className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                                    title="Generate SKU"
                                                >
                                                    <RefreshCw size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Category Selection */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Category</label>
                                        <PremiumSelect
                                            options={categories}
                                            value={isNewCategory ? 'new' : data.category_id}
                                            onChange={(val) => {
                                                setIsNewCategory(false);
                                                setData('category_id', val);
                                            }}
                                            onAddNew={() => {
                                                setIsNewCategory(true);
                                                setData('category_id', '');
                                            }}
                                            addNewLabel="Create New Category"
                                            placeholder="Select Category"
                                            disabled={!isEditable}
                                        />
                                    </div>

                                    {/* New Category Fields */}
                                    {isNewCategory && (
                                        <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-indigo-500 mb-1.5">New Category Name</label>
                                                <input
                                                    type="text"
                                                    value={data.new_category_name}
                                                    onChange={e => setData('new_category_name', e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900 text-slate-800 dark:text-white font-bold focus:ring-2 ring-indigo-500/20 outline-none"
                                                    placeholder="e.g. Beverages"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Base Unit</label>
                                                <PremiumSelect
                                                    options={PREMADE_BASE_UNITS.map(u => ({ id: u, name: u }))}
                                                    value={data.base_unit}
                                                    onChange={(val) => setData('base_unit', val)}
                                                    placeholder="e.g. pcs"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Secondary Unit (Scale)</label>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <PremiumSelect
                                                            options={PREMADE_SECONDARY_UNITS.map(u => ({ id: u, name: u }))}
                                                            value={data.secondary_unit}
                                                            onChange={(val) => setData('secondary_unit', val)}
                                                            placeholder="e.g. box"
                                                        />
                                                    </div>
                                                    <div className="relative w-32">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">=</span>
                                                        <input
                                                            type="number"
                                                            value={data.conversion_rate}
                                                            onChange={e => setData('conversion_rate', e.target.value)}
                                                            className="w-full pl-6 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-2 ring-indigo-500/20 outline-none"
                                                            placeholder="12"
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1 ml-1">
                                                    1 {data.secondary_unit || 'Box'} = {data.conversion_rate || 12} {data.base_unit || 'Pcs'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Unit</label>
                                        <PremiumSelect
                                            options={PREMADE_BASE_UNITS.map(u => ({ id: u, name: u }))}
                                            value={data.unit}
                                            onChange={(val) => setData('unit', val)}
                                            placeholder="e.g. pcs, kg, box"
                                            disabled={!isEditable}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Pricing */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <DollarSign size={16} className="text-emerald-500" /> Pricing
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Cost Price</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{settings?.currency_symbol || 'Rs'}</span>
                                            <input
                                                type="number"
                                                value={data.cost_price}
                                                onChange={e => setData('cost_price', e.target.value)}
                                                disabled={!isEditable}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-60"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Selling Price</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{settings?.currency_symbol || 'Rs'}</span>
                                            <input
                                                type="number"
                                                value={data.price}
                                                onChange={e => setData('price', e.target.value)}
                                                disabled={!isEditable}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-60"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Profit Card */}
                                <div className="mt-6 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="flex items-center justify-between relative z-10">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Profit Margin</p>
                                            <p className="text-3xl font-bold text-white">
                                                {data.price > 0 ? Math.round(((data.price - data.cost_price) / data.price) * 100) : 0}%
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Profit / Unit</p>
                                            <p className="text-2xl font-bold text-emerald-400">{settings?.currency_symbol || 'Rs'} {(data.price - data.cost_price).toLocaleString()}</p>
                                        </div>
                                    </div>

                                </div>
                            </section>

                            {renderInventorySection()}

                            {/* Barcodes Section */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Box size={16} className="text-indigo-500" /> Barcodes
                                    </h3>
                                    {isEditable && (
                                        <button
                                            onClick={handleAddBarcode}
                                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                                        >
                                            <Plus size={14} />
                                            Add Barcode
                                        </button>
                                    )}
                                </div>

                                {data.barcodes && data.barcodes.length > 0 ? (
                                    <div className="grid gap-2">
                                        {data.barcodes.map((barcode) => (
                                            <div key={barcode.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <code className="text-sm font-mono font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-700 px-2 py-1 rounded">
                                                        {barcode.barcode}
                                                    </code>
                                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                        {barcode.type}
                                                    </span>
                                                    {barcode.is_primary && (
                                                        <span className="text-xs font-bold text-green-600 dark:text-green-400">
                                                            ⭐ PRIMARY
                                                        </span>
                                                    )}
                                                    {barcode.description && (
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            · {barcode.description}
                                                        </span>
                                                    )}
                                                </div>
                                                {isEditable && (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleEditBarcode(barcode)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors">
                                                            <Edit size={14} />
                                                        </button>
                                                        <button onClick={() => handleDeleteBarcode(barcode.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">No barcodes added yet</p>
                                        {isEditable && (
                                            <button onClick={handleAddBarcode} className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                                                + Add your first barcode
                                            </button>
                                        )}
                                    </div>
                                )}
                            </section>
                        </div>
                    )}

                    {/* EXTRA DETAILS TAB */}
                    {activeTab === 'extra' && (
                        <div className="p-8 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={16} className="text-indigo-500" /> Additional Info
                                </h3>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Short Description</label>
                                    <input
                                        type="text"
                                        placeholder="Brief summary (e.g. 100% Cotton T-Shirt)"
                                        value={data.short_description}
                                        onChange={e => setData('short_description', e.target.value)}
                                        disabled={!isEditable}
                                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-60"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Full Description</label>
                                    <textarea
                                        rows="4"
                                        placeholder="Detailed product description..."
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        disabled={!isEditable}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 ring-indigo-500/20 outline-none transition-all resize-none disabled:opacity-60"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <Image size={16} className="text-indigo-500" /> Media Gallery
                                </h3>

                                {/* Main Image Section */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                                        Main Image <span className="text-indigo-500">(Required, Image Only)</span>
                                    </label>
                                    <div className="flex gap-4 items-start">
                                        <div className="relative w-40 h-40 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group bg-slate-50 dark:bg-slate-800/50">
                                            {data.main_image_preview ? (
                                                <>
                                                    <img src={data.main_image_preview} alt="Main" className="w-full h-full object-cover" />
                                                    {isEditable && (
                                                        <button
                                                            onClick={() => setData(d => ({ ...d, main_image: null, main_image_preview: null }))}
                                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                isEditable && (
                                                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleMainImageUpload}
                                                            className="hidden"
                                                        />
                                                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                            <Upload size={18} />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Upload Main</span>
                                                    </label>
                                                )
                                            )}
                                        </div>
                                        <div className="flex-1 text-xs text-slate-500 leading-relaxed pt-2">
                                            <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Thumbnail</p>
                                            <p>This image will be displayed on the product list and will be optimized for fast loading.</p>
                                            <p className="mt-1 text-amber-500">Supported: JPG, PNG, WEBP</p>
                                            {errors.main_image && <p className="text-red-500 text-xs mt-2 font-bold animate-pulse">{errors.main_image}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Gallery Section */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                                        Gallery <span className="text-slate-400">(Max 9 additional items, Images or Videos)</span>
                                    </label>

                                    {isEditable && (
                                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group relative mb-4">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*,video/*"
                                                onChange={handleGalleryUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                <Upload size={18} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                Add Gallery Media
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                                        {/* Existing Gallery Images */}
                                        {data.existing_images.map((img) => (
                                            <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                                                {img.type === 'video' ? (
                                                    <video src={img.url} className="w-full h-full object-cover" controls />
                                                ) : (
                                                    <img src={img.url} alt="Gallery" className="w-full h-full object-cover" />
                                                )}
                                                {isEditable && (
                                                    <button
                                                        onClick={() => removeExistingImage(img.id)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        {/* New Gallery Images */}
                                        {data.gallery_images.map((file, index) => (
                                            <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                                                {file.type.startsWith('video') ? (
                                                    <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                                                )}
                                                <button
                                                    onClick={() => removeGalleryImage(index)}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RESERVATIONS TAB */}
                    {activeTab === 'reservations' && renderReservationsTab()}

                    {/* VARIANTS TAB */}
                    {activeTab === 'variants' && (
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Product Variants</h3>
                                    <p className="text-sm text-slate-500 mt-1">Manage different variations of this product (e.g., Size, Color)</p>
                                </div>
                                {isEditable && (
                                    <PremiumButton onClick={handleAddVariant} className="px-4 py-2">
                                        <Plus size={16} />
                                        Add Variant
                                    </PremiumButton>
                                )}
                            </div>

                            {/* Available Attributes */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Available Attributes</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {attributes.map(attr => (
                                        <div key={attr.id} className="px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                                            {attr.name}
                                            <span className="ml-2 text-[10px] text-slate-400">
                                                ({attr.options?.length || 0} options)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Existing Variants */}
                            {data.variants && data.variants.length > 0 ? (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Existing Variants ({data.variants.length})</h4>
                                    <div className="grid gap-4">
                                        {data.variants.map((variant) => (
                                            <div key={variant.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h5 className="font-bold text-slate-800 dark:text-white">{variant.name}</h5>
                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${variant.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                                                                {variant.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {variant.attributes?.map((attr, idx) => (
                                                                <span key={idx} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded text-xs font-medium">
                                                                    {attr.attribute_name}: {attr.value}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                                            <div>
                                                                <span className="text-slate-500 dark:text-slate-400">SKU:</span>
                                                                <span className="ml-1 font-medium text-slate-700 dark:text-slate-300">{variant.sku || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-500 dark:text-slate-400">Price:</span>
                                                                <span className="ml-1 font-bold text-emerald-600 dark:text-emerald-400">Rs {variant.price?.toLocaleString() || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-500 dark:text-slate-400">Cost:</span>
                                                                <span className="ml-1 font-medium text-slate-700 dark:text-slate-300">Rs {variant.cost_price?.toLocaleString() || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-500 dark:text-slate-400">Stock:</span>
                                                                <span className="ml-1 font-bold text-slate-800 dark:text-white">{variant.stock || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {isEditable && (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleEditVariant(variant)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                                                                <Edit size={16} />
                                                            </button>
                                                            <button onClick={() => handleDeleteVariant(variant.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <Box size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">No variants yet</p>
                                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Click "Add Variant" to create product variations</p>
                                </div>
                            )}
                        </div>
                    )}


                    {/* HISTORY TAB */}
                    {activeTab === 'history' && mode !== 'create' && (
                        <div className="p-0 relative">
                            {loadingHistory ? (
                                <div className="p-16 text-center">
                                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
                                    <p className="text-sm text-slate-500">Loading transaction history...</p>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="p-16 text-center bg-slate-50 dark:bg-slate-800/50">
                                    <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">No transaction history found</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Sales and purchases will appear here once recorded.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="px-8 py-3 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30">
                                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                                            <span className="font-bold">Click</span> a row to preview · <span className="font-bold">Double-click</span> to open editor
                                        </p>
                                    </div>
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                                            <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                                <th className="p-4 pl-8">Type</th>
                                                <th className="p-4">Ref #</th>
                                                <th className="p-4">Party / Customer</th>
                                                <th className="p-4">Date</th>
                                                <th className="p-4 text-center">Qty</th>
                                                <th className="p-4 text-right">Price/Unit</th>
                                                <th className="p-4 text-right pr-8">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {history.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className={`hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors cursor-pointer group ${quickViewHistory?.invoice_number === item.invoice_number
                                                            ? 'ring-2 ring-inset ring-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                                                            : ''
                                                        }`}
                                                    onClick={() => handleHistoryClick(item)}
                                                    onDoubleClick={() => handleHistoryDoubleClick(item)}
                                                    title="Click to preview · Double-click to edit"
                                                >
                                                    <td className="p-4 pl-8">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${item.type === 'Sale'
                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                                : item.type === 'Return'
                                                                    ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800'
                                                                    : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
                                                            }`}>
                                                            {item.type === 'Sale'
                                                                ? <ArrowUpRight size={10} className="inline mr-1" />
                                                                : item.type === 'Return'
                                                                    ? <RefreshCw size={10} className="inline mr-1" />
                                                                    : <ArrowDownLeft size={10} className="inline mr-1" />
                                                            }
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                                                        {item.invoice_number}
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                        {item.party}
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-500 font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={14} /> {item.date}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center font-bold text-slate-800 dark:text-white">
                                                        {item.qty}
                                                    </td>
                                                    <td className="p-4 text-right text-sm text-slate-500">
                                                        {settings?.currency_symbol || 'Rs'} {Number(item.price).toLocaleString()}
                                                    </td>
                                                    <td className="p-4 pr-6 text-right font-bold text-slate-800 dark:text-white">
                                                        <span>{settings?.currency_symbol || 'Rs'} {Number(item.total).toLocaleString()}</span>
                                                        <ExternalLink size={12} className="inline ml-2 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* ── QUICK VIEW POPUP ── */}
                                    {quickViewHistory && (
                                        <div
                                            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                                            onClick={() => setQuickViewHistory(null)}
                                        >
                                            <div
                                                className="w-full max-w-2xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {/* Popup Header */}
                                                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 shrink-0">
                                                    <div className="flex items-center gap-3">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                {quickViewHistory.type === 'Sale' ? 'Sale Preview' : 'Purchase Preview'}
                                                            </p>
                                                            <h3 className={`text-xl font-black ${quickViewHistory.type === 'Sale' ? 'text-emerald-600' : 'text-indigo-600'
                                                                }`}>
                                                                {quickViewHistory.invoice_number || quickViewHistory.reference_number || '...'}
                                                            </h3>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${quickViewHistory.type === 'Sale'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                            }`}>
                                                            {quickViewHistory.type === 'Sale'
                                                                ? <ArrowUpRight size={10} className="inline mr-1" />
                                                                : <ArrowDownLeft size={10} className="inline mr-1" />
                                                            }
                                                            {quickViewHistory.type}
                                                        </span>
                                                        {quickViewHistory.payment_status && (
                                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${quickViewHistory.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                                    quickViewHistory.payment_status === 'partial' ? 'bg-amber-100 text-amber-700' :
                                                                        'bg-red-100 text-red-700'
                                                                }`}>{quickViewHistory.payment_status}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {/* Open Full Page */}
                                                        <button
                                                            onClick={() => {
                                                                setQuickViewHistory(null);
                                                                const id = quickViewHistory.id || quickViewHistory.transaction_id;
                                                                if (quickViewHistory.type === 'Sale') router.visit(route('store.sales.show', { store_slug: store?.slug, sale: id }));
                                                                else router.visit(route('store.purchases.show', { store_slug: store?.slug, purchase: id }));
                                                            }}
                                                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                                                        >
                                                            <ExternalLink size={13} /> Open Full
                                                        </button>
                                                        {/* Edit */}
                                                        {quickViewHistory.type === 'Sale' && (
                                                            <button
                                                                onClick={() => {
                                                                    setQuickViewHistory(null);
                                                                    router.visit(route('store.sales.edit', { store_slug: store?.slug, sale: quickViewHistory.id || quickViewHistory.transaction_id }));
                                                                }}
                                                                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                                                            >
                                                                <ExternalLink size={13} /> Edit
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setQuickViewHistory(null)}
                                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Popup Body */}
                                                <div className="flex-1 overflow-auto p-4">
                                                    {loadingQuickView ? (
                                                        <div className="py-16 text-center">
                                                            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
                                                            <p className="text-sm text-slate-500">Fetching details...</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Info Cards */}
                                                            <div className="grid grid-cols-3 gap-3 mb-4">
                                                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                                        {quickViewHistory.type === 'Sale' ? 'Customer' : 'Supplier'}
                                                                    </p>
                                                                    <p className="font-bold text-slate-800 dark:text-white text-sm">
                                                                        {quickViewHistory.party?.name || quickViewHistory.customer?.name || quickViewHistory.party || 'N/A'}
                                                                    </p>
                                                                </div>
                                                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date</p>
                                                                    <p className="font-bold text-slate-800 dark:text-white text-sm">
                                                                        {quickViewHistory.date || (quickViewHistory.created_at ? new Date(quickViewHistory.created_at).toLocaleDateString() : 'N/A')}
                                                                    </p>
                                                                </div>
                                                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                                                    <p className="text-[10px] font-bold text-indigo-500 uppercase mb-1">Total</p>
                                                                    <p className="font-black text-indigo-600 text-lg">
                                                                        {settings?.currency_symbol || 'Rs'} {Number(quickViewHistory.total || 0).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Items Table */}
                                                            {(quickViewHistory.items || quickViewHistory.invoice_items) && (
                                                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                                                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                                                                        <p className="text-xs font-bold text-slate-500 uppercase">
                                                                            Items ({(quickViewHistory.items || quickViewHistory.invoice_items)?.length || 0})
                                                                        </p>
                                                                    </div>
                                                                    <div className="max-h-64 overflow-auto">
                                                                        <table className="w-full text-sm">
                                                                            <thead className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                                                                <tr>
                                                                                    <th className="text-left p-3 text-[10px] font-bold text-slate-400 uppercase">Item</th>
                                                                                    <th className="text-center p-3 text-[10px] font-bold text-slate-400 uppercase">Qty</th>
                                                                                    <th className="text-right p-3 text-[10px] font-bold text-slate-400 uppercase">Rate</th>
                                                                                    <th className="text-right p-3 text-[10px] font-bold text-slate-400 uppercase">Total</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                                {(quickViewHistory.items || quickViewHistory.invoice_items || []).map((itm, idx) => (
                                                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                                                        <td className="p-3">
                                                                                            <p className="font-semibold text-slate-800 dark:text-white">{itm.product?.name || itm.name || 'Unknown'}</p>
                                                                                            {itm.product?.sku && <p className="text-[10px] text-slate-400 font-mono">{itm.product.sku}</p>}
                                                                                        </td>
                                                                                        <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">{itm.quantity}</td>
                                                                                        <td className="p-3 text-right text-slate-500">{settings?.currency_symbol || 'Rs'} {Number(itm.unit_price || itm.price || 0).toLocaleString()}</td>
                                                                                        <td className="p-3 text-right font-bold text-slate-800 dark:text-white">{settings?.currency_symbol || 'Rs'} {Number(itm.line_total || itm.subtotal || (itm.quantity * (itm.unit_price || itm.price || 0))).toLocaleString()}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Fallback for when items not available */}
                                                            {!quickViewHistory.items && !quickViewHistory.invoice_items && (
                                                                <div className="text-center py-8 text-slate-400">
                                                                    <p className="text-sm">Line item details not available in preview.</p>
                                                                    <button
                                                                        onClick={() => {
                                                                            const id = quickViewHistory.id || quickViewHistory.transaction_id;
                                                                            setQuickViewHistory(null);
                                                                            if (quickViewHistory.type === 'Sale') router.visit(route('store.sales.show', { store_slug: store?.slug, sale: id }));
                                                                            else router.visit(route('store.purchases.show', { store_slug: store?.slug, purchase: id }));
                                                                        }}
                                                                        className="mt-2 text-indigo-600 text-xs font-bold underline"
                                                                    >Open full page instead</button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* PURCHASE STATS TAB */}
                    {activeTab === 'purchase_stats' && mode !== 'create' && (
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatCard title="Purchased Today" value={product.purchased_day || 0} icon={<Box size={20} className="text-indigo-500" />} />
                                <StatCard title="Purchased This Month" value={product.purchased_month || 0} icon={<Box size={20} className="text-indigo-500" />} />
                                <StatCard title="Purchased This Year" value={product.purchased_year || 0} icon={<Box size={20} className="text-indigo-500" />} />
                                <StatCard title="Last Purchased Qty" value={product.last_purchased_qty || 0} icon={<Box size={20} className="text-indigo-500" />} />
                                <StatCard title="Opening Stock" value={product.opening_stock || 0} icon={<Box size={20} className="text-emerald-500" />} />
                                <StatCard title="Current Stock" value={product.stock || 0} icon={<Box size={20} className="text-amber-500" />} />
                            </div>

                            {/* Custom Range Stats */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Clock size={16} className="text-indigo-500" /> Custom Date Range
                                </h3>
                                <div className="flex flex-wrap items-end gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Start Date</label>
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 ring-indigo-500/20 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">End Date</label>
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 ring-indigo-500/20 outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={fetchCustomStats}
                                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                                    >
                                        Calculate
                                    </button>
                                </div>

                                {customStats && (
                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                        <StatCard title="Purchased Qty" value={customStats.purchased_qty} icon={<Box size={20} className="text-indigo-500" />} />
                                        <StatCard title="Total Cost" value={`Rs ${customStats.total_cost.toLocaleString()}`} icon={<DollarSign size={20} className="text-emerald-500" />} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {isEditable && (
                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 z-10">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={processing}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 active:scale-95 transition-all"
                        >
                            <Save size={18} />
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>

            <PasscodeModal 
                isOpen={showPasscodeModal}
                onClose={() => setShowPasscodeModal(false)}
                onSuccess={() => {
                    setShowPasscodeModal(false);
                    setIsStockUnlocked(true);
                    addToast('Inventory field unlocked for manual adjustment', 'success');
                }}
                settings={settings}
            />

            {/* Variant Modal */}
            {isVariantModalOpen && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsVariantModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editingVariant ? 'Edit Variant' : 'Add New Variant'}
                            </h3>
                            <button onClick={() => setIsVariantModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Attributes Selection */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Select Attributes</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {attributes.map(attr => (
                                        <div key={attr.id}>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{attr.name}</label>
                                            {attr.type === 'select' ? (
                                                <PremiumSelect
                                                    options={attr.options?.map(opt => ({ id: opt, name: opt })) || []}
                                                    value={variantForm.attributes[attr.id] || ''}
                                                    onChange={(val) => setVariantForm({ ...variantForm, attributes: { ...variantForm.attributes, [attr.id]: val } })}
                                                    placeholder="None"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={variantForm.attributes[attr.id] || ''}
                                                    onChange={(e) => setVariantForm({ ...variantForm, attributes: { ...variantForm.attributes, [attr.id]: e.target.value } })}
                                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 ring-indigo-500/20 outline-none"
                                                    placeholder={`Enter ${attr.name}`}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Variant Name */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Variant Name (Optional)</label>
                                <input
                                    type="text"
                                    value={variantForm.variant_name}
                                    onChange={(e) => setVariantForm({ ...variantForm, variant_name: e.target.value })}
                                    placeholder="Auto-generated from attributes"
                                    className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                                />
                            </div>

                            {/* SKU & Barcode */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">SKU</label>
                                    <input
                                        type="text"
                                        value={variantForm.sku}
                                        onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                                        placeholder="e.g., PRD-001-RED-L"
                                        className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Barcode</label>
                                    <input
                                        type="text"
                                        value={variantForm.barcode}
                                        onChange={(e) => setVariantForm({ ...variantForm, barcode: e.target.value })}
                                        placeholder="Optional"
                                        className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Price & Cost */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Selling Price</label>
                                    <input
                                        type="number"
                                        value={variantForm.price}
                                        onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                                        placeholder="0"
                                        className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Cost Price</label>
                                    <input
                                        type="number"
                                        value={variantForm.cost_price}
                                        onChange={(e) => setVariantForm({ ...variantForm, cost_price: e.target.value })}
                                        placeholder="0"
                                        className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Stock */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Stock Quantity</label>
                                <input
                                    type="number"
                                    value={variantForm.stock}
                                    onChange={(e) => setVariantForm({ ...variantForm, stock: e.target.value })}
                                    placeholder="0"
                                    className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setIsVariantModalOpen(false)}
                                    className="px-6 py-2.5 rounded-lg font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <PremiumButton onClick={handleSaveVariant} className="px-6 py-2.5">
                                    <Save size={16} />
                                    {editingVariant ? 'Update Variant' : 'Add Variant'}
                                </PremiumButton>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Barcode Modal */}
            {isBarcodeModalOpen && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsBarcodeModalOpen(false)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editingBarcode ? 'Edit Barcode' : 'Add New Barcode'}
                            </h3>
                            <button onClick={() => setIsBarcodeModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Barcode Input */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Barcode Number</label>
                                <input
                                    type="text"
                                    value={barcodeForm.barcode}
                                    onChange={(e) => setBarcodeForm({ ...barcodeForm, barcode: e.target.value })}
                                    placeholder="e.g., 1234567890123"
                                    className="w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-lg focus:ring-2 ring-indigo-500/20 outline-none"
                                />
                            </div>

                            {/* Barcode Type */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Barcode Type</label>
                                <PremiumSelect
                                    options={[
                                        { id: 'EAN13', name: 'EAN-13 (13 digits)' },
                                        { id: 'EAN8', name: 'EAN-8 (8 digits)' },
                                        { id: 'UPC', name: 'UPC (12 digits)' },
                                        { id: 'CODE128', name: 'Code 128' },
                                        { id: 'CODE39', name: 'Code 39' },
                                        { id: 'QR', name: 'QR Code' },
                                    ]}
                                    value={barcodeForm.barcode_type}
                                    onChange={(val) => setBarcodeForm({ ...barcodeForm, barcode_type: val })}
                                    placeholder="Select Type"
                                />
                            </div>

                            {/* Primary Checkbox */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="is_primary"
                                    checked={barcodeForm.is_primary}
                                    onChange={(e) => setBarcodeForm({ ...barcodeForm, is_primary: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <label htmlFor="is_primary" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    Set as Primary Barcode ⭐
                                </label>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description (Optional)</label>
                                <input
                                    type="text"
                                    value={barcodeForm.description}
                                    onChange={(e) => setBarcodeForm({ ...barcodeForm, description: e.target.value })}
                                    placeholder="e.g., Flavor: Chocolate, Size: Large"
                                    className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 ring-indigo-500/20 outline-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setIsBarcodeModalOpen(false)}
                                    className="px-6 py-2.5 rounded-lg font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <PremiumButton onClick={handleSaveBarcode} className="px-6 py-2.5">
                                    <Save size={16} />
                                    {editingBarcode ? 'Update Barcode' : 'Add Barcode'}
                                </PremiumButton>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>,
        document.body
    );
}
