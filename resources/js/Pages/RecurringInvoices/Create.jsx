import React, { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { shouldStopNegativeStock } from '@/Utils/settings';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import SellModuleTabs from '@/Components/SellModuleTabs';
import FormModal from '@/Components/FormModal';
import {
    Plus,
    Trash2,
    Save,
    Printer,
    User,
    Package,
    X,
    ChevronRight,
    ChevronLeft,
    CreditCard,
    Banknote,
    Percent,
    DollarSign,
    Info,
    ScanBarcode,
    Zap,
    Eye,
    EyeOff,
    CheckCircle2,
    Search,
    TrendingUp,
    GripVertical,
    Settings,
    Type,
    ArrowLeftRight,
    Wallet,
    Edit,
    ArrowLeft,
    ChevronDown
} from 'lucide-react';
import axios from 'axios';
import { useWorkspace } from '@/Contexts/WorkspaceContext';
import { useAlert } from '@/Contexts/AlertContext';

import PrintService from '@/Utils/PrintService';
import ProductModal from '@/Components/ProductModal';
import QuickPartyModal from '@/Components/QuickPartyModal';
import AsyncProductCombobox from '@/Components/AsyncProductCombobox';
import AsyncPartyCombobox from '@/Components/AsyncPartyCombobox';
import WheelInput from '@/Components/WheelInput';
import InvoiceTourGuide from '@/Components/InvoiceTourGuide';

const CreateRecurringInvoice = ({ customers = [], warehouses: initialWarehouses = [], products = [] }) => {
    const { settings, auth, store } = usePage().props;
    const isSeniorMode = settings?.senior_mode === '1';
    const showMarginPercent = settings?.show_margin_percentage === '1';
    const isAdmin = auth.user?.role === 'admin' || auth.user?.role === 'owner' || auth.user?.role === 'platform_admin';

    // --- RECURRING MODE STATE ---
    const isEditMode = false;
    const [editState, setEditState] = useState(null);

    const [activeInvoices, setActiveInvoices] = useState([
        {
            id: 'temp-recurring',
            customer: null,
            items: [{ id: Date.now(), product: null, quantity: 1, freeQuantity: 0, price: 0, discount: 0, discountType: 'fixed' }],
            paymentMethod: 'cash',
            amountPaid: 0,
            discount: 0,
            tax: 0,
            delivery_charge: 0,
            extra_charge_value: 0,
            warehouse_id: initialWarehouses[0]?.id || '',
            frequency: 'monthly',
            next_run_date: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
            status: 'active'
        }
    ]);
    const [currentInvoiceId, setCurrentInvoiceId] = useState('temp-recurring');

    const addInvoice = (defaults = {}) => {
        const id = Date.now().toString();
        setActiveInvoices(prev => [...prev, {
            id,
            customer: null,
            items: [{ id: Date.now(), product: null, quantity: 1, freeQuantity: 0, price: 0, discount: 0, discountType: 'fixed' }],
            paymentMethod: 'cash',
            amountPaid: 0,
            discount: 0,
            tax: 0,
            delivery_charge: 0,
            extra_charge_value: 0,
            warehouse_id: initialWarehouses[0]?.id || '',
            frequency: 'monthly',
            next_run_date: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
            status: 'active',
            ...defaults
        }]);
        setCurrentInvoiceId(id);
    };

    const removeInvoice = (id) => {
        setActiveInvoices(prev => {
            const filtered = prev.filter(inv => inv.id !== id);
            if (filtered.length === 0) {
                return [{
                    id: 'temp-recurring',
                    customer: null,
                    items: [{ id: Date.now(), product: null, quantity: 1, freeQuantity: 0, price: 0, discount: 0, discountType: 'fixed' }],
                    paymentMethod: 'cash',
                    amountPaid: 0,
                    discount: 0,
                    tax: 0,
                    delivery_charge: 0,
                    extra_charge_value: 0,
                    warehouse_id: initialWarehouses[0]?.id || '',
                    frequency: 'monthly',
                    next_run_date: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
                    status: 'active'
                }];
            }
            return filtered;
        });
        if (currentInvoiceId === id) {
            const remaining = activeInvoices.filter(inv => inv.id !== id);
            if (remaining.length > 0) {
                setCurrentInvoiceId(remaining[0].id);
            }
        }
    };

    const updateInvoice = (id, data) => {
        setActiveInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...data } : inv));
    };

    const currentInvoice = activeInvoices.find(inv => inv.id === currentInvoiceId) || activeInvoices[0];

    const patchInvoice = (data) => {
        updateInvoice(currentInvoice.id, data);
    };

    // Quick Add Modals State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productModalMode, setProductModalMode] = useState('create');
    const [editingProduct, setEditingProduct] = useState(null);
    const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
    const [editingParty, setEditingParty] = useState(null);

    // Data for Product Modal
    const [categories, setCategories] = useState([]);
    const [warehouses, setWarehouses] = useState(initialWarehouses);
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        const handleSync = () => {
            // 1. Refresh global props (for dropdowns etc)
            router.reload({ 
                only: ['products', 'categories', 'warehouses'], 
                preserveState: true, 
                preserveScroll: true 
            });

            // 2. Refresh specifically added items in the current invoice
            refreshInvoiceItems();
        };

        window.addEventListener('amd:product-updated', handleSync);
        window.addEventListener('storage', (e) => {
            if (e.key === 'amd_product_latest_change') handleSync();
        });

        return () => {
            window.removeEventListener('amd:product-updated', handleSync);
        };
    }, [currentInvoice?.items]);

    const refreshInvoiceItems = async () => {
        if (!currentInvoice?.items?.length) return;
        const productsToRefresh = currentInvoice.items.filter(i => i.product?.id).map(i => i.product.id);
        if (!productsToRefresh.length) return;

        try {
            // Fetch latest data for these products
            const response = await axios.get(route('store.inventory.search', { store_slug: store?.slug }), { 
                params: { ids: productsToRefresh } 
            });
            const latestProducts = response.data || [];
            
            const newItems = currentInvoice.items.map(item => {
                if (!item.product?.id) return item;
                const latest = latestProducts.find(p => p.id === item.product.id);
                if (latest) {
                    // PROTECT: Don't auto-update prices on historical/finalized records
                    const isFinalized = isEditMode || ['completed', 'partial'].includes(currentInvoice.status);
                    
                    return {
                        ...item,
                        product: latest,
                        price: !isFinalized ? parseFloat(latest.price || latest.selling_price || 0) : item.price,
                        available_stock: parseFloat(latest.available_stock || 0),
                        cost: !isFinalized ? parseFloat(latest.cost || latest.cost_price || 0) : item.cost
                    };
                }
                return item;
            });
            patchInvoice({ items: newItems });
        } catch (error) {
            console.error("Failed to refresh invoice items", error);
        }
    };

    useEffect(() => {
        // Fetch data for Product Modal if needed
        const fetchData = async () => {
            try {
                const [catRes, wareRes, accRes, banksRes] = await Promise.all([
                    axios.get(route('store.api.categories', { store_slug: store?.slug })),
                    axios.get(route('store.api.warehouses', { store_slug: store?.slug })),
                    axios.get(route('store.accounting.accounts.api', { store_slug: store?.slug, type: 'asset' })),
                    axios.get(route('store.api.bank-accounts', { store_slug: store?.slug }))
                ]);
                setCategories(catRes.data);
                setWarehouses(wareRes.data);

                // Process Accounts
                const rawAccounts = accRes.data?.data || accRes.data || [];
                const bankAccounts = banksRes.data || [];

                // 1. Cash (Force ID 1 as primary 'Cash in Hand')
                const cashAccount = { id: 1, name: 'Cash in Hand', type: 'cash' };

                // 2. Cheque (Static)
                const chequeAccount = { id: 'CHEQUE', name: 'Cheque', type: 'cheque' };

                // 3. Bank Accounts (from separate table, mapped to proper structure)
                // We use a property 'isBank' to handle them specially if needed,
                // BUT for the Payment Account ID, we need a valid Chart of Accounts ID.
                // Assuming 'Bank Account' (ID 2) is the Generic GL Account for banks.
                const generalBankAccount = rawAccounts.find(a => a.name === 'Bank Account' || a.code === '1010');
                const bankGLId = generalBankAccount?.id || 2;

                const mappedBankAccounts = bankAccounts.map(b => ({
                    id: `BANK_${b.id}`, // Unique ID for Dropdown Key
                    isBank: true,
                    realAccountId: bankGLId, // The ID to send to backend (GL Account)
                    bankReferenceId: b.id,   // The specific bank ID
                    name: `${b.name} ${b.bank_name ? `(${b.bank_name})` : ''}`,
                    type: 'bank'
                }));

                // 4. Other Assets (Filtered)
                const otherAccounts = rawAccounts.filter(a =>
                    a.id !== 1 && // Not Cash
                    a.id !== bankGLId && // Not generic Bank GL
                    a.name !== 'Cash on Hand' &&
                    a.name !== 'Cheques in Hand' &&
                    a.name !== 'Inventory' &&
                    a.name !== 'Accounts Receivable'
                );

                const finalAccounts = [
                    cashAccount,
                    chequeAccount,
                    ...mappedBankAccounts,
                    ...otherAccounts
                ];

                setAccounts(finalAccounts);
            } catch (error) {
                console.error("Failed to fetch modal data", error);
                // Fallback for critical Cash/Cheque options even if API fails
                setAccounts([
                    { id: 1, name: 'Cash in Hand', type: 'cash' },
                    { id: 'CHEQUE', name: 'Cheque', type: 'cheque' }
                ]);
            }
        };
        fetchData();
    }, []);

    const handleProductSubmit = async (data, onError) => {
        try {
            const url = productModalMode === 'create'
                ? route('store.inventory.store', { store_slug: store?.slug })
                : (editingProduct?.id ? route('store.inventory.update', { store_slug: store?.slug, id: editingProduct.id }) : '');

            const response = await axios.post(url, data);

            if (response.data) {
                // Global Sync Trigger
                window.dispatchEvent(new CustomEvent('amd:product-updated'));
                localStorage.setItem('amd_product_latest_change', Date.now().toString());

                setIsProductModalOpen(false);
                showAlert({
                    title: 'Success',
                    message: `Product ${productModalMode === 'create' ? 'created' : 'updated'} successfully.`,
                    type: 'success'
                });

                // If created, auto-select it if in quick entry
                if (productModalMode === 'create' && showQuickEntry) {
                    setQuickEntry(prev => ({ ...prev, name: data.name }));
                }
            }
        } catch (error) {
            console.error(error);
            if (onError && error.response?.data?.errors) {
                onError(error.response.data.errors);
            } else {
                showAlert({
                    title: 'Error',
                    message: 'Failed to save product.',
                    type: 'error'
                });
            }
        }
    };

    // Removed the old 'currentInvoice' declaration as it is now above

    // Local state for UI interactions
    const [customerSearch, setCustomerSearch] = useState('');
    const [productResults, setProductResults] = useState([]);
    const [quickResults, setQuickResults] = useState([]);
    const [activeItemIndex, setActiveItemIndex] = useState(null);
    const [saving, setSaving] = useState(false);
    
    // Auto Scroll Items Ref
    const itemsContainerRef = useRef(null);
    const prevItemsLengthRef = useRef(currentInvoice.items.length);

    useEffect(() => {
        if (currentInvoice.items.length > prevItemsLengthRef.current) {
            if (itemsContainerRef.current) {
                setTimeout(() => {
                    itemsContainerRef.current.scrollTo({
                        top: itemsContainerRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        }
        prevItemsLengthRef.current = currentInvoice.items.length;
    }, [currentInvoice.items.length]);

    // Quick Entry State
    const [showQuickEntry, setShowQuickEntry] = useState(false);
    const [quickEntry, setQuickEntry] = useState({
        product: null,
        name: '',
        quantity: 1,
        freeQuantity: 0,
        price: 0,
        discount: 0,
        discountType: 'fixed'
    });

    // Scanning Mode State
    const [isScanning, setIsScanning] = useState(false);
    const [scanBuffer, setScanBuffer] = useState('');
    const [scannedItems, setScannedItems] = useState([]);

    // Profit Sneak Peek State
    const [showProfit, setShowProfit] = useState(false);
    const [profitLocked, setProfitLocked] = useState(false);
    const [showProfitModal, setShowProfitModal] = useState(false);
    const [quickSelectedIndex, setQuickSelectedIndex] = useState(-1);
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastSaleId, setLastSaleId] = useState(null);

    // Per-row total recalculation mode: 'price' = back-calc price, 'qty' = back-calc qty
    const [itemTotalModes, setItemTotalModes] = useState({});
    const getItemTotalMode = (itemId) => itemTotalModes[itemId] || 'price';
    const toggleItemTotalMode = (itemId) => {
        setItemTotalModes(prev => ({
            ...prev,
            [itemId]: (prev[itemId] || 'price') === 'price' ? 'qty' : 'price'
        }));
    };
    const handleTotalChange = (item, newTotalStr) => {
        const newTotal = parseFloat(newTotalStr) || 0;
        const mode = getItemTotalMode(item.id);
        // Compute current discount amount so we know what "paid" total maps to
        const discountVal = item.discountType === 'percent'
            ? (item.quantity * item.price) * ((item.discount || 0) / 100)
            : (item.discount || 0);
        // newTotal = qty * price - discount
        // => gross = newTotal + discount
        if (mode === 'price') {
            // Keep Qty fixed, recalc Price
            const qty = item.quantity || 1;
            // We solve: qty * newPrice - discountOnNewPrice = newTotal
            // For percent discount: qty * newPrice * (1 - disc/100) = newTotal  => newPrice = newTotal / (qty * (1-disc/100))
            // For fixed discount: qty * newPrice - disc = newTotal => newPrice = (newTotal + disc) / qty
            let newPrice;
            if (item.discountType === 'percent') {
                const factor = 1 - ((item.discount || 0) / 100);
                newPrice = factor > 0 ? newTotal / (qty * factor) : newTotal / qty;
            } else {
                newPrice = (newTotal + (item.discount || 0)) / qty;
            }
            updateItem(item.id, 'price', Math.max(0, parseFloat(newPrice.toFixed(4))));
        } else {
            // Keep Price fixed, recalc Qty
            const price = item.price || 1;
            let newQty;
            if (item.discountType === 'percent') {
                const factor = 1 - ((item.discount || 0) / 100);
                newQty = factor > 0 ? newTotal / (price * factor) : newTotal / price;
            } else {
                newQty = (newTotal + (item.discount || 0)) / price;
            }
            updateItem(item.id, 'quantity', Math.max(0, parseFloat(newQty.toFixed(4))));
        }
    };

    // UI Enhancement State
    const [textSize, setTextSize] = useState(1);
    const [showTextSizeMenu, setShowTextSizeMenu] = useState(false);
    const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
    const [showMobileSalesModal, setShowMobileSalesModal] = useState(false);

    // Global Defaults for Charges (Persisted)
    const [defaultDelivery, setDefaultDelivery] = useState(() => parseFloat(localStorage.getItem('amd_default_delivery')) || 0);
    const [defaultExtraLabel, setDefaultExtraLabel] = useState(() => localStorage.getItem('amd_default_extra_label') || 'Extra');
    const [defaultExtraValue, setDefaultExtraValue] = useState(() => parseFloat(localStorage.getItem('amd_default_extra_value')) || 0);
    const [enableMultipleExtras, setEnableMultipleExtras] = useState(() => localStorage.getItem('amd_enable_multiple_extras') === '1');
    const [showDeliveryCharges, setShowDeliveryCharges] = useState(() => localStorage.getItem('amd_show_delivery') !== '0');
    const [showExtraField, setShowExtraField] = useState(() => localStorage.getItem('amd_show_extra') !== '0');

    // Persistence Effects
    useEffect(() => {
        localStorage.setItem('amd_default_delivery', defaultDelivery.toString());
    }, [defaultDelivery]);
    useEffect(() => {
        localStorage.setItem('amd_default_extra_label', defaultExtraLabel);
    }, [defaultExtraLabel]);
    useEffect(() => {
        localStorage.setItem('amd_default_extra_value', defaultExtraValue.toString());
    }, [defaultExtraValue]);
    useEffect(() => {
        localStorage.setItem('amd_enable_multiple_extras', enableMultipleExtras ? '1' : '0');
    }, [enableMultipleExtras]);
    useEffect(() => {
        localStorage.setItem('amd_show_delivery', showDeliveryCharges ? '1' : '0');
    }, [showDeliveryCharges]);
    useEffect(() => {
        localStorage.setItem('amd_show_extra', showExtraField ? '1' : '0');
    }, [showExtraField]);

    const quantityRef = useRef(null);
    const discountRef = useRef(null);
    const startY = useRef(0);

    // Search hooks removed in favor of Async components



    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey && e.key === 'q') {
                e.preventDefault();
                document.getElementById('quick-entry-input')?.focus();
            }
            if (isSeniorMode) {
                if (e.key === 'F1') {
                    e.preventDefault();
                    document.getElementById('quick-entry-input')?.focus();
                }
                if (e.key === ' ') {
                    // Only trigger if not in an input
                    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                        handleSave();
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSeniorMode, currentInvoice]);

    // Async search handled by components

    // Product search handled by AsyncProductCombobox 

    // Item Management
    const addItem = () => {
        const newItems = [...currentInvoice.items, { id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: 'fixed' }];
        patchInvoice({ items: newItems });
    };

    const removeItem = (id) => {
        const newItems = currentInvoice.items.filter(item => item.id !== id);
        patchInvoice({ items: newItems.length ? newItems : [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: 'fixed' }] });
    };

    const updateItem = (id, field, value) => {
        const newItems = currentInvoice.items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        patchInvoice({ items: newItems });
    };

    const selectProduct = (product, itemId) => {
        if ((product.available_stock ?? product.stock_quantity ?? 0) <= 0 && (!product.has_manufacturing_rule)) {
            if (!window.confirm(`Warning: ${product.reserved_quantity || 0} units are reserved for pre-orders. Available: ${product.available_stock || 0}. Selling this will put reservations into backorder. Continue?`)) {
                return;
            }
        }

        const updatedItems = currentInvoice.items.map(item =>
            item.id === itemId ? {
                ...item,
                product,
                price: parseFloat(product.price || product.selling_price || 0),
                name: product.name,
                cost: parseFloat(product.cost || product.cost_price || 0),
                available_stock: parseFloat(product.available_stock || 0),
                originalQuantity: 0 // Reset original quantity as this is a new product selection
            } : item
        );

        // Check if this was the last item - if so, add a new empty row automatically
        const lastItem = updatedItems[updatedItems.length - 1];
        if (lastItem.id === itemId) {
            updatedItems.push({ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: 'fixed' });
        }

        patchInvoice({ items: updatedItems });
        setProductResults([]);
        setActiveItemIndex(null);
    };

    // Quick Search handled by AsyncProductCombobox

    const selectQuickProduct = (product) => {
        if ((product.available_stock ?? product.stock_quantity ?? 0) <= 0 && (!product.has_manufacturing_rule)) {
            if (!window.confirm(`Warning: ${product.reserved_quantity || 0} units are reserved for pre-orders. Available: ${product.available_stock || 0}. Selling this will put reservations into backorder. Continue?`)) {
                return;
            }
        }

        setQuickEntry(prev => ({
            ...prev,
            product,
            name: product.name,
            price: product.price || product.selling_price || 0,
            cost: product.cost || product.cost_price || 0
        }));
        setQuickResults([]);
        setQuickSelectedIndex(-1);
        // Focus quantity after a short delay to ensure state update
        setTimeout(() => quantityRef.current?.focus(), 50);
    };

    const handleQuickKeyDown = (e) => {
        if (quickResults.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setQuickSelectedIndex(prev => (prev + 1) % quickResults.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setQuickSelectedIndex(prev => (prev - 1 + quickResults.length) % quickResults.length);
            } else if (e.key === 'Enter' && quickSelectedIndex >= 0) {
                e.preventDefault();
                selectQuickProduct(quickResults[quickSelectedIndex]);
            }
        } else if (e.key === 'Enter' && quickEntry.name) {
            // If no results but name exists, maybe focus quantity?
            quantityRef.current?.focus();
        }
    };

    const addQuickItem = () => {
        if (!quickEntry.product && !quickEntry.name) return;

        const newItem = {
            id: Date.now(),
            product: quickEntry.product,
            name: quickEntry.name,
            quantity: quickEntry.quantity || 1,
            freeQuantity: quickEntry.freeQuantity || 0,
            price: quickEntry.price || 0,
            discount: quickEntry.discount || 0,
            discountType: quickEntry.discountType,
            cost: quickEntry.product?.cost || quickEntry.product?.cost_price || 0
        };

        // Check if the first item is empty and replace it, otherwise append
        const firstItem = currentInvoice.items[0];
        let newItems;
        if (currentInvoice.items.length === 1 && !firstItem.product && !firstItem.name) {
            newItems = [newItem];
        } else {
            newItems = [...currentInvoice.items, newItem];
        }

        patchInvoice({ items: newItems });

        // Reset Quick Entry
        setQuickEntry({
            product: null,
            name: '',
            quantity: 1,
            freeQuantity: 0,
            price: 0,
            discount: 0,
            discountType: 'fixed'
        });
        setQuickResults([]);
        setQuickSelectedIndex(-1);

        // Focus back to search for next item
        document.getElementById('quick-entry-input')?.focus();
    };

    // Scanning Logic
    const handleScan = async (e) => {
        if (e.key === 'Enter' && scanBuffer) {

            // PRIORITY CHECK: Quantity Shortcut
            // If the input is a small number (<= 3 digits) and we have items,
            // assume the user wants to set the quantity of the last scanned item.
            // This prevents accidental scanning of products with short barcodes (e.g. "11", "6").
            const isNumeric = /^\d+$/.test(scanBuffer);
            const isShort = scanBuffer.length <= 3;

            if (isNumeric && isShort && scannedItems.length > 0) {
                const qty = parseInt(scanBuffer);
                if (qty > 0) {
                    setScannedItems(prev => {
                        const newItems = [...prev];
                        const lastIdx = newItems.length - 1;
                        // Replace quantity (User said "replace with 6", "type 15 change to 15")
                        newItems[lastIdx] = { ...newItems[lastIdx], quantity: qty };
                        return newItems;
                    });
                    setScanBuffer('');
                    return; // Stop execution (do not search)
                }
            }

            try {
                // 1. Try to find the product
                const response = await axios.get(route('store.inventory.search', { store_slug: store?.slug }), { params: { query: scanBuffer } });
                const results = response.data;
                const product = results && results.length > 0 ? results[0] : null;

                if (product) {
                    setScannedItems(prev => {
                        const existingIndex = prev.findIndex(item => item.product.id === product.id);
                        if (existingIndex >= 0) {
                            // Item exists: Move to end and increment quantity (Bubbling)
                            const newItems = [...prev];
                            const existingItem = newItems[existingIndex];
                            newItems.splice(existingIndex, 1);
                            newItems.push({
                                ...existingItem,
                                quantity: existingItem.quantity + 1 // Add 1 (Scan again behavior)
                            });
                            return newItems;
                        } else {
                            // New Item: Add to end
                            return [...prev, {
                                id: Date.now(),
                                product,
                                name: product.name,
                                quantity: 1,
                                price: product.price || product.selling_price || 0,
                                discount: 0,
                                discountType: 'fixed',
                                cost: product.cost || product.cost_price || 0
                            }];
                        }
                    });
                } else {
                    // If not found and wasn't caught by shortcut (e.g. large number that isn't a product)
                    // We could treat as qty, but safer to just ignore or log
                    console.log("Unknown barcode.");
                }
                setScanBuffer('');
            } catch (error) {
                console.error('Scan error:', error);
                setScanBuffer('');
            }
        }
    };

    const confirmScan = () => {
        patchInvoice({ items: [...currentInvoice.items, ...scannedItems] });
        setScannedItems([]);
        setIsScanning(false);
    };

    // Profit Sneak Peek Handlers
    const handleProfitDown = (e) => {
        setShowProfit(true);
        startY.current = e.clientY;

        const onMove = (moveEvent) => {
            const diff = moveEvent.clientY - startY.current; // Drag DOWN = positive
            if (diff > 50) { // Threshold for lock and show modal
                setProfitLocked(true);
                setShowProfitModal(true); // Open the full modal
                window.removeEventListener('mousemove', onMove);
            }
        };

        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const handleProfitUp = () => {
        if (!profitLocked) {
            setShowProfit(false);
        }
    };

    // Drag and Drop Handlers
    const handleDragStart = (e, index) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        const items = [...currentInvoice.items];
        const draggedItem = items[draggedItemIndex];
        items.splice(draggedItemIndex, 1);
        items.splice(index, 0, draggedItem);

        patchInvoice({ items });
        setDraggedItemIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedItemIndex(null);
    };

    // Calculations
    const calculateLineTotal = (item) => {
        const sub = item.quantity * item.price;
        const disc = item.discountType === 'percent' ? (sub * (item.discount / 100)) : (item.discount || 0);
        return sub - disc;
    };

    const subtotal = currentInvoice?.items?.reduce((sum, item) => sum + ((item.quantity + (item.freeQuantity || 0)) * item.price), 0) || 0;
    const totalCost = currentInvoice?.items?.reduce((sum, item) => sum + ((item.quantity + (item.freeQuantity || 0)) * (item.cost || 0)), 0) || 0;

    const itemDiscounts = currentInvoice?.items?.reduce((sum, item) => {
        const sub = item.quantity * item.price;
        const discountVal = item.discountType === 'percent' ? (sub * (item.discount / 100)) : (item.discount || 0);
        const freeItemValue = (item.freeQuantity || 0) * item.price;
        return sum + discountVal + freeItemValue;
    }, 0) || 0;

    const afterItemDiscounts = subtotal - itemDiscounts;

    // Use the simple discount field (flat amount)
    const invoiceDiscount = parseFloat(currentInvoice?.discount) || 0;
    const afterDiscount = afterItemDiscounts - invoiceDiscount;

    // Tax is a percentage
    const taxAmount = afterDiscount * ((parseFloat(currentInvoice?.tax) || 0) / 100);

    const deliveryCharge = parseFloat(currentInvoice?.delivery_charge) || 0;
    const extraCharge = parseFloat(currentInvoice?.extra_charge_value) || 0;

    const rawGrandTotal = afterDiscount + taxAmount + deliveryCharge + extraCharge;
    const grandTotal = settings?.round_off_total === '1' ? Math.round(rawGrandTotal) : rawGrandTotal;

    // Auto-Fill Amount Paid (POS Mode)
    useEffect(() => {
        if (settings?.pos_auto_fill_cash === '1' && !isEditMode && currentInvoice?.paymentMethod === 'cash') {
            // Only update if the amountPaid was previously equal to the OLD grandTotal (syncing) 
            // OR if it's currently 0. This prevents fighting the user if they typed a partial amount.
            // For simplicity in this iteration: If it's a cash sale default and not edited, we sync.
            // We'll trust the user wants it to match.
            if (activeInvoices.length === 1) { // Only do this for single invoice flow to be safe or just check current
                patchInvoice({ amountPaid: grandTotal });
            } else {
                patchInvoice({ amountPaid: grandTotal });
            }
        }
    }, [grandTotal, settings?.pos_auto_fill_cash, currentInvoice?.paymentMethod]);
    const balanceDue = grandTotal - (parseFloat(currentInvoice?.amountPaid) || 0);
    const profit = grandTotal - totalCost;
    const colsCount = 3 + (showDeliveryCharges ? 1 : 0) + (showExtraField ? 1 : 0);

    // Alert System
    const { showAlert, showConfirm } = useAlert();

    // VALIDATION & OVERPAYMENT STATE
    const [customerError, setCustomerError] = useState(false);
    const [invalidItems, setInvalidItems] = useState([]);
    const [showOverpaymentModal, setShowOverpaymentModal] = useState(false);
    const [overpaymentDetails, setOverpaymentDetails] = useState({ amount: 0, customerName: '' });
    const [printPreviewOpen, setPrintPreviewOpen] = useState(false); // For "Print Sale"

    const validateInputs = () => {
        let isValid = true;
        let newInvalidItems = [];

        // Check Customer - Allow if it's a valid object.
        // If "Walk-In" is manually typed without selecting, it fails (as desired).
        // User must select the "Walk-In Customer" from dropdown or create it.
        if (!currentInvoice.customer || typeof currentInvoice.customer === 'string' || !currentInvoice.customer.id) {
            setCustomerError(true);
            isValid = false;
        } else {
            setCustomerError(false);
        }

        // Check Items
        currentInvoice.items.forEach((item, index) => {
            if ((item.name && !item.product) || (item.name && item.product && !item.product.id)) {
                newInvalidItems.push(index);
                isValid = false;
            }
        });
        setInvalidItems(newInvalidItems);

        return isValid;
    };

        const handleSave = async () => {
        initiateSave();
    };

    const processSale = async () => {
        const validItems = currentInvoice.items.filter(item => item.product);

        setSaving(true);
        try {
            const payload = {
                customer_id: currentInvoice.customer?.id || null,
                warehouse_id: currentInvoice.warehouse_id || null,
                frequency: currentInvoice.frequency || 'monthly',
                next_run_date: currentInvoice.next_run_date || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
                status: currentInvoice.status || 'active',
                items: validItems.map(item => ({
                    product_id: item.product.id,
                    qty: item.quantity,
                    quantity: item.quantity,
                    price: item.price,
                    unit_price: item.price,
                    freeQuantity: item.freeQuantity || 0,
                    free_qty: item.freeQuantity || 0,
                    discount: item.discount || 0,
                    discountType: item.discountType || 'fixed',
                    discount_percent: item.discountType === 'percent' ? item.discount : 0,
                    discount_type: item.discountType,
                    name: item.name || item.product?.name
                }))
            };

            const response = await axios.post(route('store.recurring-invoices.store', { store_slug: store?.slug }), payload);

            if (response.data) {
                localStorage.setItem('amd_product_latest_change', Date.now().toString());
                showAlert({ title: 'Success', message: 'Recurring invoice template created successfully.', type: 'success' });
                router.visit(route('store.recurring-invoices.index', { store_slug: store?.slug }));
            } else {
                showAlert({
                    title: 'Transaction Failed',
                    message: 'Unknown error',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error(error);
            showAlert({
                title: 'System Error',
                message: error.response?.data?.message || 'Failed to save recurring invoice template.',
                type: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    // Main Entry Point
    const initiateSave = () => {
        const isInputValid = validateInputs();
        if (!isInputValid) {
            showAlert({ title: 'Validation Error', message: 'Please fix highlighted errors.', type: 'error' });
            return;
        }

        if (!currentInvoice.customer) {
            showAlert({
                title: 'Customer Required',
                message: 'Please select a customer before processing.',
                type: 'warning'
            });
            return;
        }

        if (!currentInvoice.warehouse_id) {
            showAlert({
                title: 'Warehouse Required',
                message: 'Please select a warehouse for the template.',
                type: 'warning'
            });
            return;
        }

        processSale();
    };



    // Safe Loading State (After all hooks)
    if (!currentInvoice || (isEditMode && !editState)) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <p className="text-slate-500 animate-pulse">Initializing Invoice...</p>
            </div>
        );
    }

    return (
        <OneGlanceLayout title={isEditMode ? `Edit Sale #${editState?.invoiceNumber || ''}` : "Add Sale"} activeMenu="Sales" fullScreen={false} hideHeader={true} noPadding={true}>
            <Head title={isEditMode ? "Edit Sale" : "Add Sale"} />

            <div className={`h-full flex-1 flex flex-col bg-slate-50 dark:bg-[#0f121d] transition-all duration-500 ${isSeniorMode ? 'text-[20px] senior-mode' : ''}`}>
                <style>{`
                    .senior-mode input, .senior-mode button, .senior-mode p, .senior-mode span, .senior-mode td, .senior-mode th {
                        font-size: 1.25rem !important;
                    }
                    .senior-mode .text-emerald-400, .senior-mode .text-emerald-500 {
                        color: #059669 !important;
                        font-weight: 900 !important;
                    }
                    .senior-mode .text-indigo-400, .senior-mode .text-indigo-500 {
                        color: #2563eb !important;
                        font-weight: 900 !important;
                    }
                    .senior-mode .bg-slate-900, .senior-mode .bg-[#1a1f2e] {
                        background-color: #ffffff !important;
                        color: #000000 !important;
                        border: 2px solid #000000 !important;
                    }
                    .hide-scrollbar::-webkit-scrollbar { display: none; }
                    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                    /* Hide number input spinner arrows — scroll-wheel still works */
                    input[type="number"]::-webkit-outer-spin-button,
                    input[type="number"]::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    input[type="number"] { -moz-appearance: textfield; }
                    
                    /* Text Scaling System */
                    .text-scale-2 { font-size: 1.05em !important; }
                    .text-scale-3 { font-size: 1.15em !important; }
                    .text-scale-4 { font-size: 1.25em !important; }
                    .text-scale-5 { font-size: 1.4em !important; }
                    
                    [class*="text-scale-"] input, 
                    [class*="text-scale-"] select, 
                    [class*="text-scale-"] button:not(.w-7) { 
                        height: auto !important;
                        padding-top: 0.6em !important;
                        padding-bottom: 0.6em !important;
                    }
                    
                    .text-scale-2 .text-xs { font-size: 0.85rem !important; }
                    .text-scale-3 .text-xs { font-size: 0.95rem !important; }
                    .text-scale-4 .text-xs { font-size: 1.05rem !important; }
                    .text-scale-5 .text-xs { font-size: 1.15rem !important; }
                `}</style>



                <div className={`flex-1 flex flex-col lg:flex-row gap-2 min-h-0 px-2 pb-0 pt-2 lg:overflow-hidden overflow-y-auto text-scale-${textSize}`}>
                    {/* LEFT SECTION - Main Workspace (Tabs + Items) */}
                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden min-h-[400px] lg:min-h-0">
                        {/* TABS BAR - Now inside left section */}
                        <div className="hidden lg:flex items-center gap-1 px-3 pt-2 pb-0 overflow-x-auto hide-scrollbar border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
                            {activeInvoices.map((inv, idx) => (
                                <div
                                    key={inv.id}
                                    onClick={() => setCurrentInvoiceId(inv.id)}
                                    className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-all min-w-[100px] max-w-[160px] relative group text-xs
                                    ${currentInvoiceId === inv.id
                                            ? 'bg-white dark:bg-slate-900 text-indigo-600'
                                            : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}
                                `}
                                >
                                    <div className={`w-2 h-2 rounded-full ${currentInvoiceId === inv.id ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                    <span className="text-xs font-bold truncate">
                                        {inv.customer?.name || `Template #${idx + 1}`}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const proceed = () => {
                                                removeInvoice(inv.id);
                                                if (activeInvoices.length === 1) router.visit(route('store.recurring-invoices.index', { store_slug: store?.slug }));
                                            };

                                            if (activeInvoices.length === 1 && inv.items.length > 1) {
                                                showConfirm({
                                                    title: 'Discard Template?',
                                                    message: 'You have unsaved items. Discarding will lose this data.',
                                                    type: 'error',
                                                    confirmLabel: 'Discard',
                                                    onConfirm: proceed
                                                });
                                            } else {
                                                proceed();
                                            }
                                        }}
                                        className={`ml-auto flex items-center justify-center w-5 h-5 rounded-md transition-all ${currentInvoiceId === inv.id
                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 opacity-100'
                                                : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600'
                                            }`}
                                    >
                                        <X size={10} strokeWidth={3} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => addInvoice({
                                    delivery_charge: defaultDelivery,
                                    extra_charge_value: defaultExtraValue,
                                    extra_charge_label: defaultExtraLabel
                                })}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 shrink-0"
                                title="New Tab"
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                        {/* TOP ACTION BAR - Desktop View (Hidden on Mobile) */}
                        <div className="hidden lg:flex px-3 py-2 border-b border-slate-100 dark:border-slate-800 items-center gap-3 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
                            {/* Left - Quick Entry & Scan Mode */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setShowQuickEntry(!showQuickEntry);
                                        if (!showQuickEntry) {
                                            setTimeout(() => document.getElementById('quick-entry-input')?.focus(), 50);
                                        }
                                    }}
                                    className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all border ${showQuickEntry ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                                    title="Toggle Quick Add (Alt+Q)"
                                >
                                    <Zap size={20} className={showQuickEntry ? 'fill-current' : ''} />
                                </button>
                                <button
                                    onClick={() => setIsScanning(true)}
                                    className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-50 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                                    title="Scanning Mode"
                                >
                                    <ScanBarcode size={20} />
                                    <span className="text-sm font-bold">Scan</span>
                                </button>
                            </div>

                            {/* Center - Customer Search */}
                            <div id="tour-invoice-customer" className="relative flex-1 max-w-xl">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <User size={18} />
                                </div>
                                {currentInvoice.customer ? (
                                    <div className="relative">
                                        <div className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-10 py-3.5 flex items-center justify-between shadow-sm">
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white text-sm">{currentInvoice.customer.name}</p>
                                                <p className="text-xs text-slate-500">{currentInvoice.customer.phone || 'No Phone'}</p>
                                            </div>
                                            <button
                                                onClick={() => { patchInvoice({ customer: null }); setCustomerSearch(''); }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                            <User size={18} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <AsyncPartyCombobox
                                            type="all"
                                            selectedItem={currentInvoice.customer}
                                            onSelect={(customer) => {
                                                patchInvoice({ customer });
                                                setCustomerError(false);
                                            }}
                                            onCreateNew={() => setIsPartyModalOpen(true)}
                                            onEdit={(customer) => {
                                                setEditingParty(customer);
                                                setIsPartyModalOpen(true);
                                            }}
                                            placeholder="Search Party (Name/Phone)..."
                                            addNewLabel="Create New Party"
                                        />
                                        {/* Error Message */}
                                        {customerError && (
                                            <p className="absolute -bottom-5 left-2 text-[10px] font-bold text-red-500 animate-pulse">
                                                Please select a registered customer
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right - Credit/Cash Toggle + Profit */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                                    <button
                                        onClick={() => patchInvoice({ paymentMethod: 'credit' })}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 transition-all ${currentInvoice.paymentMethod === 'credit'
                                            ? 'bg-emerald-500 text-white shadow shadow-emerald-500/20'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <CreditCard size={12} /> CREDIT
                                    </button>
                                    <button
                                        onClick={() => patchInvoice({ paymentMethod: 'cash' })}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 transition-all ${currentInvoice.paymentMethod === 'cash'
                                            ? 'bg-orange-500 text-white shadow shadow-orange-500/20'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <Banknote size={12} /> CASH
                                    </button>
                                </div>

                                {/* Payment Account Dropdown */}
                                <div className="relative group/accounts">
                                    <button
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 text-[10px] font-black min-w-[120px] justify-between"
                                    >
                                        <span className="flex items-center gap-1.5 truncate">
                                            <Wallet size={12} className="text-indigo-500" />
                                            {currentInvoice.selectedBankName || accounts.find(a => a.id === (currentInvoice.paymentAccountId || 1))?.name || 'Cash in Hand'}
                                        </span>
                                        <ChevronRight size={12} className="rotate-90 text-slate-400" />
                                    </button>

                                    <div className="absolute top-full pt-2 right-0 w-48 z-50 overflow-hidden hidden group-hover/accounts:block animate-in fade-in slide-in-from-top-2">
                                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                                            <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Deposit To</p>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                                                {accounts.map(acc => (
                                                    <button
                                                        key={acc.id}
                                                        onClick={() => {
                                                            if (acc.isBank) {
                                                                patchInvoice({
                                                                    paymentAccountId: acc.realAccountId,
                                                                    selectedBankName: acc.name,
                                                                    paymentReference: `Deposited to: ${acc.name}`
                                                                });
                                                            } else {
                                                                patchInvoice({
                                                                    paymentAccountId: acc.id,
                                                                    selectedBankName: null,
                                                                    paymentReference: ''
                                                                });
                                                            }
                                                        }}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${(currentInvoice.paymentAccountId || 1) === acc.id
                                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                            }`}
                                                    >
                                                        <span>{acc.name}</span>
                                                        {(currentInvoice.paymentAccountId || 1) === acc.id && <CheckCircle2 size={12} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {showMarginPercent && (
                                    <button
                                        onMouseDown={handleProfitDown}
                                        onMouseUp={handleProfitUp}
                                        onMouseLeave={handleProfitUp}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all border border-emerald-200 dark:border-emerald-800 text-[10px] font-black select-none"
                                    >
                                        <TrendingUp size={12} /> MARGIN
                                    </button>
                                )}
                                {/* Text Size Toggle */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowTextSizeMenu(!showTextSizeMenu)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all border text-[10px] font-black ${textSize > 1
                                            ? 'bg-purple-500 text-white border-purple-500 shadow shadow-purple-500/20'
                                            : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                                            }`}
                                        title="Change Text Size"
                                    >
                                        <Type size={12} /> Aa+ {textSize > 1 && `(${textSize})`}
                                    </button>

                                    {showTextSizeMenu && (
                                        <div className="absolute top-full mt-2 right-0 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            {[1, 2, 3, 4, 5].map((size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => { setTextSize(size); setShowTextSizeMenu(false); }}
                                                    className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${textSize === size ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'text-slate-600 dark:text-slate-300'}`}
                                                >
                                                    {size === 1 ? 'Normal' : size === 2 ? 'Large' : size === 3 ? 'Larger' : size === 4 ? 'Senior' : 'Max'}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Quick Settings */}
                                <button
                                    onClick={() => setShowSettingsDrawer(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 text-[10px] font-black"
                                    title="Quick Settings"
                                >
                                    <Settings size={12} />
                                </button>
                            </div>
                        </div>

                        {/* TOP ACTION BAR - Mobile View (Compact & Premium) */}
                        <div className="flex lg:hidden flex-col gap-1.5 p-1.5 bg-[#0f121d] border-b border-slate-800/80 shrink-0">
                            {/* Row 1: Back (Left), Sale Pill (Center), Settings (Right) */}
                            <div className="flex items-center justify-between w-full relative">
                                <button
                                    onClick={() => router.visit(route('store.recurring-invoices.index', { store_slug: store?.slug }))}
                                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 shadow-sm"
                                    title="Go Back"
                                >
                                    <ArrowLeft size={14} />
                                </button>
                                
                                <button
                                    onClick={() => setShowMobileSalesModal(true)}
                                    className="flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-900/30 border border-indigo-800 rounded-full text-[11px] font-black text-indigo-400 max-w-[60%] shadow-sm active:scale-95 transition-all"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0"></span>
                                    <span className="truncate">
                                        {currentInvoice.customer?.name || `Template #${activeInvoices.findIndex(inv => inv.id === currentInvoice.id) + 1}`}
                                    </span>
                                    <ChevronDown size={11} className="text-indigo-400 shrink-0" />
                                </button>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        onClick={() => setShowSettingsDrawer(true)}
                                        className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 shadow-sm hover:text-white"
                                        title="Settings"
                                    >
                                        <Settings size={13} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Are you sure you want to cancel and discard this template?")) {
                                                removeInvoice(currentInvoice.id);
                                                if (activeInvoices.length === 1) {
                                                    router.visit(route('store.recurring-invoices.index', { store_slug: store?.slug }));
                                                }
                                            }
                                        }}
                                        className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-red-400 hover:text-red-500 border border-slate-700 shadow-sm active:scale-95 transition-all"
                                        title="Cancel Template"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>                            {/* Row 2: Customer Search (Left), Payment & Term Controls (Right) */}
                            <div className="flex items-center gap-1.5 w-full">
                                <div id="tour-invoice-customer-mobile" className="relative flex-1 min-w-0">
                                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
                                        <User size={13} />
                                    </div>
                                    {currentInvoice.customer ? (
                                        <div className="relative">
                                            <div className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-7 py-1.5 flex items-center justify-between shadow-sm min-h-[36px]">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-slate-200 text-xs truncate leading-tight">{currentInvoice.customer.name}</p>
                                                    <p className="text-[9px] text-slate-500 leading-none">{currentInvoice.customer.phone || 'No Phone'}</p>
                                                </div>
                                                <button
                                                    onClick={() => { patchInvoice({ customer: null }); setCustomerSearch(''); }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <AsyncPartyCombobox
                                                type="all"
                                                selectedItem={currentInvoice.customer}
                                                onSelect={(customer) => {
                                                    patchInvoice({ customer });
                                                    setCustomerError(false);
                                                }}
                                                onCreateNew={() => setIsPartyModalOpen(true)}
                                                onEdit={(customer) => {
                                                    setEditingParty(customer);
                                                    setIsPartyModalOpen(true);
                                                }}
                                                placeholder="Search Party..."
                                                addNewLabel="Create Party"
                                                inputClassName={`h-9 min-h-[36px] text-xs py-1.5 ${customerError ? '!border-red-500 !ring-red-500/20' : ''}`}
                                            />
                                            {customerError && (
                                                <p className="absolute -bottom-2 left-3.5 bg-red-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-md z-20 animate-pulse">
                                                    Please select customer
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Compact Credit/Cash toggle & wallet */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <div className="flex items-center gap-0.5 bg-slate-800 rounded-lg p-0.5 border border-slate-700 h-[36px]">
                                        <button
                                            onClick={() => patchInvoice({ paymentMethod: 'credit' })}
                                            className={`px-2 py-1 rounded text-[10px] font-black transition-all ${currentInvoice.paymentMethod === 'credit' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'}`}
                                        >
                                            CREDIT
                                        </button>
                                        <button
                                            onClick={() => patchInvoice({ paymentMethod: 'cash' })}
                                            className={`px-2 py-1 rounded text-[10px] font-black transition-all ${currentInvoice.paymentMethod === 'cash' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500'}`}
                                        >
                                            CASH
                                        </button>
                                    </div>
                                    
                                    <div className="relative group/accounts-mobile shrink-0 h-[36px]">
                                        <button className="flex items-center justify-center w-9 h-[36px] rounded-lg bg-slate-800 text-indigo-400 border border-slate-700 shadow-sm active:scale-95">
                                            <Wallet size={13} />
                                        </button>
                                        <div className="absolute right-0 top-full pt-1 z-50 hidden group-hover/accounts-mobile:block">
                                            <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden w-36 p-1">
                                                <div className="p-1 border-b border-slate-700 bg-slate-900/50">
                                                    <p className="text-[8px] font-bold text-slate-500 uppercase">Deposit To</p>
                                                </div>
                                                <div className="max-h-32 overflow-y-auto custom-scrollbar p-0.5">
                                                    {accounts.map(acc => (
                                                        <button
                                                            key={acc.id}
                                                            onClick={() => {
                                                                if (acc.isBank) {
                                                                    patchInvoice({
                                                                        paymentAccountId: acc.realAccountId,
                                                                        selectedBankName: acc.name,
                                                                        paymentReference: `Deposited to: ${acc.name}`
                                                                    });
                                                                } else {
                                                                    patchInvoice({
                                                                        paymentAccountId: acc.id,
                                                                        selectedBankName: null,
                                                                        paymentReference: ''
                                                                    });
                                                                }
                                                            }}
                                                            className={`w-full text-left px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors flex items-center justify-between ${(currentInvoice.paymentAccountId || 1) === acc.id ? 'bg-indigo-900/20 text-indigo-455' : 'text-slate-300 hover:bg-slate-700'}`}
                                                        >
                                                            <span className="truncate">{acc.name}</span>
                                                            {(currentInvoice.paymentAccountId || 1) === acc.id && <CheckCircle2 size={9} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ITEMS AREA CONTAINER */}
                        <div ref={itemsContainerRef} className="flex-1 overflow-y-auto hide-scrollbar px-2 py-2">
                            {/* Desktop View Table */}
                            <table className="hidden md:table w-full border-separate border-spacing-y-1.5">
                                <thead>
                                    <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide">
                                        <th className="pb-2 w-8"></th>
                                        <th className="pb-2 pl-3 w-10 text-center">#</th>
                                        <th className="pb-2">Item Description</th>
                                        <th className="pb-2 w-20 text-center">Qty</th>
                                        <th className="pb-2 w-20 text-center text-xs text-emerald-600">Free</th>
                                        <th className="pb-2 w-28 text-right">Price</th>
                                        {settings?.billing_type !== 'lite' && <th className="pb-2 w-32 text-right">Discount</th>}
                                        <th className="pb-2 w-28 text-right">Total</th>
                                        <th className="pb-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {showQuickEntry && (
                                        <tr className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 border border-indigo-200 dark:border-indigo-800/50 rounded-xl overflow-hidden">
                                            <td className="py-3"></td>
                                            <td className="py-3 pl-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                                    <Zap size={16} className="text-indigo-600" />
                                                </div>
                                            </td>
                                            <td className="py-3 relative">
                                                <AsyncProductCombobox
                                                    selectedItem={quickEntry.product}
                                                    onSelect={selectQuickProduct}
                                                    onCreateNew={(name) => {
                                                        setProductModalMode('create');
                                                        setEditingProduct({ name });
                                                        setIsProductModalOpen(true);
                                                    }}
                                                    onEdit={(product) => {
                                                        setEditingProduct(product);
                                                        setProductModalMode('edit');
                                                        setIsProductModalOpen(true);
                                                    }}
                                                    placeholder="Quick Add Product..."
                                                    addNewLabel="Add New Product"
                                                    hideCostAndMargin={!isAdmin}
                                                />
                                            </td>
                                            <td className="py-3 text-center">
                                                <input
                                                    ref={quantityRef}
                                                    type="number"
                                                    value={quickEntry.quantity}
                                                    onChange={(e) => setQuickEntry(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') discountRef.current?.focus();
                                                    }}
                                                    onFocus={() => setQuickResults([])}
                                                    className="w-16 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/30 rounded-lg text-center text-sm font-bold py-2 focus:ring-2 ring-indigo-500/20 outline-none"
                                                />
                                            </td>
                                            <td className="py-3 text-center">
                                                <input
                                                    type="number"
                                                    value={quickEntry.freeQuantity || ''}
                                                    placeholder="0"
                                                    onChange={(e) => setQuickEntry(prev => ({ ...prev, freeQuantity: parseFloat(e.target.value) || 0 }))}
                                                    onFocus={() => setQuickResults([])}
                                                    className="w-16 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 py-2 focus:ring-2 ring-emerald-500/20 outline-none"
                                                />
                                            </td>
                                            <td className="py-3 text-right">
                                                <input
                                                    type="number"
                                                    value={quickEntry.price}
                                                    onChange={(e) => setQuickEntry(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                                    onFocus={() => setQuickResults([])}
                                                    onKeyDown={(e) => e.key === 'Enter' && addQuickItem()}
                                                    className="w-24 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/30 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/20 outline-none"
                                                />
                                            </td>
                                            {settings?.billing_type !== 'lite' && (
                                                <td className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <input
                                                            ref={discountRef}
                                                            type="number"
                                                            value={quickEntry.discount}
                                                            onChange={(e) => setQuickEntry(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                                                            onFocus={() => setQuickResults([])}
                                                            onKeyDown={(e) => e.key === 'Enter' && addQuickItem()}
                                                            className="w-20 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/30 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/20 outline-none"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                setQuickResults([]);
                                                                setQuickEntry(prev => ({ ...prev, discountType: prev.discountType === 'fixed' ? 'percent' : 'fixed' }));
                                                            }}
                                                            className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${quickEntry.discountType === 'percent' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                                                        >
                                                            {quickEntry.discountType === 'percent' ? '%' : (getCurrencySymbol(store || settings))}
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="py-3 text-right">
                                                <button
                                                    onClick={addQuickItem}
                                                    className="w-8 h-8 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow shadow-indigo-500/30 flex items-center justify-center active:scale-90"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </td>
                                            <td className="py-3 pr-3"></td>
                                        </tr>
                                    )}

                                    {currentInvoice.items.map((item, idx) => (
                                        <tr
                                            key={item.id}
                                            className={`group animate-in fade-in duration-200 ${draggedItemIndex === idx ? 'opacity-50' : ''}`}
                                            draggable
                                            onDragStart={(e) => { e.currentTarget.parentElement.setAttribute('draggable', 'true'); }}
                                            onDragOver={(e) => handleDragOver(e, idx)}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <td
                                                className="bg-slate-50 dark:bg-slate-800/50 rounded-l-xl py-3 pl-2 cursor-ns-resize group-active:cursor-grabbing"
                                                onMouseDown={(e) => { e.currentTarget.parentElement.setAttribute('draggable', 'true'); }}
                                                onMouseUp={(e) => { e.currentTarget.parentElement.setAttribute('draggable', 'false'); }}
                                            >
                                                <GripVertical size={16} className="text-slate-300 hover:text-slate-500 transition-colors" />
                                            </td>
                                            <td className="bg-slate-50 dark:bg-slate-800/50 py-3 text-sm font-bold text-slate-400 text-center">
                                                {idx + 1}
                                            </td>
                                            <td className="bg-slate-50 dark:bg-slate-800/50 py-3 relative px-2">
                                                <AsyncProductCombobox
                                                    selectedItem={item.product}
                                                    onSelect={(product) => selectProduct(product, item.id)}
                                                    onCreateNew={(name) => {
                                                        setEditingProduct({ name });
                                                        setProductModalMode('create');
                                                        setIsProductModalOpen(true);
                                                    }}
                                                    onEdit={(product) => {
                                                        setEditingProduct(product);
                                                        setProductModalMode('edit');
                                                        setIsProductModalOpen(true);
                                                    }}
                                                    placeholder="Search item..."
                                                    addNewLabel="Add New Product"
                                                    hideCostAndMargin={!isAdmin}
                                                />
                                            </td>
                                            <td className="bg-slate-50 dark:bg-slate-800/50 py-3 text-center align-middle">
                                                <div className="relative flex flex-col items-center">
                                                    <WheelInput
                                                        type="number"
                                                        value={item.quantity ?? 1}
                                                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                        onWheel={(e) => {
                                                            e.preventDefault();
                                                            const delta = e.deltaY < 0 ? 1 : -1;
                                                            updateItem(item.id, 'quantity', Math.max(1, (parseFloat(item.quantity) || 0) + delta));
                                                        }}
                                                        onFocus={(e) => {
                                                            e.target.select();
                                                            setActiveItemIndex(null);
                                                            setProductResults([]);
                                                        }}
                                                        className="w-16 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-center text-sm font-bold py-2 focus:ring-2 ring-indigo-500/20 transition-all no-spinner"
                                                    />
                                                    {item.product && (
                                                        <span className={`absolute -bottom-4 text-[10px] font-bold whitespace-nowrap ${item.available_stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                                            (Avail: {item.available_stock || 0})
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="bg-slate-50 dark:bg-slate-800/50 py-3 text-center align-middle">
                                                <WheelInput
                                                    type="number"
                                                    value={item.freeQuantity || ''}
                                                    placeholder="0"
                                                    onChange={(e) => updateItem(item.id, 'freeQuantity', parseFloat(e.target.value) || 0)}
                                                    onWheel={(e) => {
                                                        e.preventDefault();
                                                        const delta = e.deltaY < 0 ? 1 : -1;
                                                        updateItem(item.id, 'freeQuantity', Math.max(0, (parseFloat(item.freeQuantity) || 0) + delta));
                                                    }}
                                                    className="w-16 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30 rounded-lg text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 py-2 focus:ring-2 ring-emerald-500/20 transition-all placeholder-emerald-300/50 no-spinner"
                                                />
                                            </td>
                                            <td className="bg-slate-50 dark:bg-slate-800/50 py-3 text-right align-middle">
                                                <WheelInput
                                                    type="number"
                                                    value={item.price ?? 0}
                                                    onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                                    onWheel={(e) => {
                                                        e.preventDefault();
                                                        const delta = e.deltaY < 0 ? 1 : -1;
                                                        const step = item.price >= 100 ? 10 : 1;
                                                        updateItem(item.id, 'price', Math.max(0, (parseFloat(item.price) || 0) + (delta * step)));
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.select();
                                                        setActiveItemIndex(null);
                                                        setProductResults([]);
                                                    }}
                                                    className="w-24 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/20 transition-all no-spinner"
                                                />
                                            </td>
                                            {settings?.billing_type !== 'lite' && (
                                                <td className="bg-slate-50 dark:bg-slate-800/50 py-3 text-right align-middle">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <WheelInput
                                                            type="number"
                                                            value={item.discount ?? 0}
                                                            onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                                            onWheel={(e) => {
                                                                e.preventDefault();
                                                                const delta = e.deltaY < 0 ? 1 : -1;
                                                                const step = item.discountType === 'percent' ? 1 : (item.price >= 100 ? 5 : 1);
                                                                updateItem(item.id, 'discount', Math.max(0, (parseFloat(item.discount) || 0) + (delta * step)));
                                                            }}
                                                            className="w-20 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/20 transition-all no-spinner"
                                                        />
                                                        <button
                                                            onClick={() => updateItem(item.id, 'discountType', item.discountType === 'fixed' ? 'percent' : 'fixed')}
                                                            className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${item.discountType === 'percent' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                                                        >
                                                            {item.discountType === 'percent' ? '%' : (getCurrencySymbol(store || settings))}
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="bg-slate-50 dark:bg-slate-800/50 py-3 pr-3 align-middle">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => toggleItemTotalMode(item.id)}
                                                        className={`w-7 h-7 rounded-md text-[10px] font-black transition-all shrink-0 border flex items-center justify-center ${
                                                            getItemTotalMode(item.id) === 'price'
                                                                ? 'bg-indigo-600 text-white border-indigo-500 shadow shadow-indigo-500/30'
                                                                : 'bg-emerald-600 text-white border-emerald-500 shadow shadow-emerald-500/30'
                                                        }`}
                                                    >
                                                        {getItemTotalMode(item.id) === 'price' ? (getCurrencySymbol(store || settings)) : '#'}
                                                    </button>
                                                    <WheelInput
                                                        type="number"
                                                        value={parseFloat(calculateLineTotal(item).toFixed(2))}
                                                        onChange={(e) => handleTotalChange(item, e.target.value)}
                                                        onWheel={(e) => {
                                                            e.preventDefault();
                                                            const delta = e.deltaY < 0 ? 1 : -1;
                                                            const currentTotal = calculateLineTotal(item);
                                                            const step = currentTotal >= 100 ? 10 : 1;
                                                            handleTotalChange(item, String(Math.max(0, currentTotal + (delta * step))));
                                                        }}
                                                        onFocus={(e) => e.target.select()}
                                                        className="w-24 bg-white dark:bg-slate-700 border border-indigo-300 dark:border-indigo-600 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/30 transition-all text-slate-800 dark:text-white no-spinner"
                                                    />
                                                </div>
                                             </td>
                                            <td className="bg-slate-50 dark:bg-slate-800/50 rounded-r-xl py-3 pr-3 align-middle">
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Mobile View - Items Card List */}
                            <div className="md:hidden flex flex-col gap-2">
                                {showQuickEntry && (
                                    <div className="bg-indigo-50/30 dark:bg-indigo-900/10 p-3 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex items-center gap-2">
                                            <span className="text-indigo-600"><Zap size={16} /></span>
                                            <div className="flex-1">
                                                <AsyncProductCombobox
                                                    selectedItem={quickEntry.product}
                                                    onSelect={selectQuickProduct}
                                                    onCreateNew={(name) => {
                                                        setProductModalMode('create');
                                                        setEditingProduct({ name });
                                                        setIsProductModalOpen(true);
                                                    }}
                                                    onEdit={(product) => {
                                                        setEditingProduct(product);
                                                        setProductModalMode('edit');
                                                        setIsProductModalOpen(true);
                                                    }}
                                                    placeholder="Quick Add Product..."
                                                    addNewLabel="Add Product"
                                                    hideCostAndMargin={true}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Qty</span>
                                                <input
                                                    type="number"
                                                    value={quickEntry.quantity}
                                                    onChange={(e) => setQuickEntry(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                                                    className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/30 rounded-lg text-center text-xs font-bold py-1.5 focus:ring-2 ring-indigo-500/20"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Price</span>
                                                <input
                                                    type="number"
                                                    value={quickEntry.price}
                                                    onChange={(e) => setQuickEntry(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                                    className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/30 rounded-lg text-right text-xs font-bold py-1.5 px-2 focus:ring-2 ring-indigo-500/20"
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <button
                                                    onClick={addQuickItem}
                                                    className="w-full h-[32px] bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-1 text-xs font-bold active:scale-95"
                                                >
                                                    <Plus size={14} /> Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentInvoice.items.length === 0 ? (
                                    <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800">
                                        <FileText size={32} className="mx-auto text-slate-400 mb-2" />
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-350">No items added to invoice</p>
                                    </div>
                                ) : (
                                    currentInvoice.items.map((item, idx) => (
                                        <div key={item.id} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-[10px] font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="flex-1">
                                                        <AsyncProductCombobox
                                                            selectedItem={item.product}
                                                            onSelect={(product) => selectProduct(product, item.id)}
                                                            onCreateNew={(name) => {
                                                                setEditingProduct({ name });
                                                                setProductModalMode('create');
                                                                setIsProductModalOpen(true);
                                                            }}
                                                            onEdit={(product) => {
                                                                setEditingProduct(product);
                                                                setProductModalMode('edit');
                                                                setIsProductModalOpen(true);
                                                            }}
                                                            placeholder="Select Product..."
                                                            addNewLabel="Add Product"
                                                            hideCostAndMargin={true}
                                                            inputClassName="!h-[34px] !py-1 !text-xs !pl-9"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shrink-0 ml-2"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {item.product && (
                                                <div className="grid grid-cols-12 gap-1.5 mt-1 items-end">
                                                    {/* Qty */}
                                                    <div className="col-span-3 flex flex-col gap-0.5">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Qty</span>
                                                        <WheelInput
                                                            type="number"
                                                            value={item.quantity ?? 1}
                                                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-xs font-bold py-1 focus:ring-1 ring-indigo-500/20 outline-none"
                                                        />
                                                    </div>

                                                    {/* Price */}
                                                    <div className="col-span-3 flex flex-col gap-0.5">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Price</span>
                                                        <WheelInput
                                                            type="number"
                                                            value={item.price ?? 0}
                                                            onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-right text-xs font-bold py-1 px-1.5 focus:ring-1 ring-indigo-500/20 outline-none"
                                                        />
                                                    </div>

                                                    {/* Discount (Conditional) */}
                                                    {settings?.billing_type !== 'lite' && (
                                                        <div className="col-span-3 flex flex-col gap-0.5">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Disc</span>
                                                            <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pr-0.5">
                                                                <WheelInput
                                                                    type="number"
                                                                    value={item.discount ?? 0}
                                                                    onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                                                    className="w-full bg-transparent border-none text-right text-xs font-bold py-1 pl-1 pr-0.5 focus:ring-0 outline-none"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateItem(item.id, 'discountType', item.discountType === 'fixed' ? 'percent' : 'fixed')}
                                                                    className={`w-3.5 h-3.5 rounded text-[8px] font-black transition-all flex items-center justify-center shrink-0 ${item.discountType === 'percent' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-550'}`}
                                                                >
                                                                    {item.discountType === 'percent' ? '%' : (getCurrencySymbol(store || settings))}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Total + Conversion mode toggle */}
                                                    <div className={`${settings?.billing_type !== 'lite' ? 'col-span-3' : 'col-span-6'} flex flex-col gap-0.5 text-right`}>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Total</span>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleItemTotalMode(item.id)}
                                                                className={`w-5 h-5 rounded text-[8px] font-black transition-all shrink-0 border flex items-center justify-center ${
                                                                    getItemTotalMode(item.id) === 'price'
                                                                        ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500'
                                                                        : 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500'
                                                                }`}
                                                            >
                                                                {getItemTotalMode(item.id) === 'price' ? (getCurrencySymbol(store || settings)) : '#'}
                                                            </button>
                                                            <WheelInput
                                                                type="number"
                                                                value={parseFloat(calculateLineTotal(item).toFixed(2))}
                                                                onChange={(e) => handleTotalChange(item, e.target.value)}
                                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-right text-xs font-extrabold py-1 px-1 focus:ring-1 ring-indigo-500/20 text-slate-800 dark:text-white outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* STICKY ADD BUTTON */}
                        <div className="shrink-0 px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-center">
                            <button
                                onClick={addItem}
                                className="px-5 py-2 flex items-center justify-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800 transition-all active:scale-95 shadow-sm"
                            >
                                <Plus size={14} /> ADD NEW ITEM
                            </button>
                        </div>

                        {/* MOBILE STICKY CHECKOUT PANEL (Mobile Only) */}
                        <div className="lg:hidden flex flex-col shrink-0">
                            {/* Row 1: Compact financial input fields */}
                            <div className={`grid gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 ${
                                colsCount === 5 ? 'grid-cols-5' : colsCount === 4 ? 'grid-cols-4' : 'grid-cols-3'
                            }`}>
                                <div>
                                    <span className="text-[8px] text-slate-400 font-bold block mb-0.5 uppercase">Discount</span>
                                    <input
                                        type="number"
                                        value={currentInvoice.discount ?? 0}
                                        onChange={(e) => patchInvoice({ discount: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-lg px-1.5 h-9 text-slate-800 dark:text-white text-xs font-bold text-right outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                {showDeliveryCharges && (
                                    <div>
                                        <span className="text-[8px] text-slate-400 font-bold block mb-0.5 uppercase">Delivery</span>
                                        <input
                                            type="number"
                                            value={currentInvoice.delivery_charge ?? 0}
                                            onChange={(e) => patchInvoice({ delivery_charge: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-lg px-1.5 h-9 text-slate-800 dark:text-white text-xs font-bold text-right outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                )}
                                {showExtraField && (
                                    <div>
                                        <span className="text-[8px] text-slate-400 font-bold block mb-0.5 uppercase">Extra</span>
                                        <input
                                            type="number"
                                            value={currentInvoice.extra_charge_value ?? 0}
                                            onChange={(e) => patchInvoice({ extra_charge_value: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-lg px-1.5 h-9 text-slate-800 dark:text-white text-xs font-bold text-right outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                )}
                                <div>
                                    <span className="text-[8px] text-slate-400 font-bold block mb-0.5 uppercase">Paid</span>
                                    <input
                                        type="number"
                                        value={currentInvoice.amountPaid ?? 0}
                                        onChange={(e) => patchInvoice({ amountPaid: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-lg px-1.5 h-9 text-slate-800 dark:text-white text-xs font-bold text-right outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <span className="text-[8px] text-slate-400 font-bold block mb-0.5 uppercase">Bal Due</span>
                                    <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-lg px-1.5 h-9 text-xs font-extrabold text-right border ${balanceDue > 0 ? 'text-red-500 border-red-500/20' : 'text-emerald-500 border-emerald-500/20'} flex items-center justify-end`}>
                                        {formatCurrency(balanceDue, store || settings)}
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Cancel (25%) & Complete Sale (75%) */}
                            <div className="flex items-center gap-2 px-2 py-1.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                                <button
                                    onClick={() => {
                                        if (window.confirm("Are you sure you want to cancel and discard this template?")) {
                                            removeInvoice(currentInvoice.id);
                                            if (activeInvoices.length === 1) {
                                                router.visit(route('store.recurring-invoices.index', { store_slug: store?.slug }));
                                            }
                                        }
                                    }}
                                    className="w-1/4 py-3.5 border border-red-200 dark:border-red-800 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95 transition-all text-center flex items-center justify-center"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => initiateSave()}
                                    disabled={saving}
                                    className="w-3/4 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-50"
                                >
                                    <CheckCircle2 size={16} />
                                    {saving ? 'SAVING...' : `SAVE TEMPLATE (${formatCurrency(grandTotal, store || settings)})`}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SECTION - Side Info Panel */}
                    <div className="hidden lg:flex w-full lg:w-80 bg-[#1a1d2e] flex-col overflow-hidden rounded-2xl shadow-2xl border border-slate-800 shrink-0">

                        {/* Customer Summary Section - Text Size Responsive */}
                        <div className="p-4 border-b border-slate-800/50 bg-slate-900/30 shrink-0">
                            {currentInvoice.customer ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 ${textSize >= 4 ? 'w-16 h-16 text-xl' : textSize >= 3 ? 'w-14 h-14 text-lg' : 'w-12 h-12 text-lg'}`}>
                                            {currentInvoice.customer.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-white font-bold truncate ${textSize >= 4 ? 'text-lg' : textSize >= 3 ? 'text-base' : 'text-sm'}`}>{currentInvoice.customer.name}</p>
                                            <p className={`text-slate-400 font-medium ${textSize >= 4 ? 'text-sm' : textSize >= 3 ? 'text-xs' : 'text-[10px]'}`}>{currentInvoice.customer.phone || 'No Phone'}</p>
                                        </div>
                                        <button
                                            onClick={() => { patchInvoice({ customer: null }); setCustomerSearch(''); }}
                                            className="text-slate-600 hover:text-red-400 p-1.5 hover:bg-red-400/10 rounded-lg transition-all shrink-0"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    {/* Balance & Address */}
                                    <div className={`space-y-1 bg-slate-800/30 rounded-lg p-2 ${textSize >= 3 ? 'text-sm' : 'text-xs'}`}>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-medium">Balance:</span>
                                            <span className={`font-black ${currentInvoice.customer.current_balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {currentInvoice.customer.current_balance >= 0 ? getCurrencySymbol(store || settings) : `-${getCurrencySymbol(store || settings)}`} {Math.abs(currentInvoice.customer.current_balance || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="text-slate-500 font-medium shrink-0">Address:</span>
                                            <span className={`text-right ${currentInvoice.customer.address ? 'text-slate-300' : 'text-slate-600 italic'}`}>
                                                {currentInvoice.customer.address || 'Not set'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4 border border-dashed border-slate-700 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-2 text-slate-500">
                                        <User size={20} />
                                    </div>
                                    <p className={`text-slate-400 font-bold ${textSize >= 3 ? 'text-sm' : 'text-xs'}`}>No Customer Selected</p>
                                </div>
                            )}
                        </div>

                        {/* Invoice Details Section - Scrollable */}
                        <div className="flex-1 p-3 space-y-3 overflow-y-auto hide-scrollbar">
                            {/* Invoice # & Date Row */}
                            {/* Warehouse & Billing Frequency Row */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Warehouse</label>
                                    <select
                                        value={currentInvoice.warehouse_id || ''}
                                        onChange={(e) => patchInvoice({ warehouse_id: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-[10px] font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    >
                                        <option value="">Select Warehouse</option>
                                        {warehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Billing Frequency</label>
                                    <select
                                        value={currentInvoice.frequency || 'monthly'}
                                        onChange={(e) => patchInvoice({ frequency: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-[10px] font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                            </div>

                            {/* Next Run Date & Status Row */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Next Run Date</label>
                                    <input
                                        type="date"
                                        value={currentInvoice.next_run_date || ''}
                                        onChange={(e) => patchInvoice({ next_run_date: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-[10px] font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Status</label>
                                    <select
                                        value={currentInvoice.status || 'active'}
                                        onChange={(e) => patchInvoice({ status: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-[10px] font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    >
                                        <option value="active">Active</option>
                                        <option value="paused">Paused</option>
                                    </select>
                                </div>
                            </div>

                            {/* CHEQUE DETAILS - Conditional */}
                            {currentInvoice.paymentAccountId === 'CHEQUE' && (
                                <div className="grid grid-cols-2 gap-2 p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/30 animate-in slide-in-from-top-2">
                                    <div className="col-span-2">
                                        <p className="text-[10px] text-indigo-400 font-black uppercase mb-2 flex items-center gap-1">
                                            <Wallet size={12} /> CHEQUE DETAILS
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Cheque No</label>
                                        <input
                                            type="text"
                                            value={currentInvoice.paymentReference || ''}
                                            onChange={(e) => patchInvoice({ paymentReference: e.target.value })}
                                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-[10px] font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-600"
                                            placeholder="XXXXXX"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Cheque Date</label>
                                        <input
                                            type="date"
                                            value={currentInvoice.chequeDate || new Date().toISOString().split('T')[0]}
                                            onChange={(e) => patchInvoice({ chequeDate: e.target.value })}
                                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-[10px] font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Financial Summary - Bigger */}
                            <div className="space-y-2 pt-3 border-t border-slate-800/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-400 font-bold">Subtotal</span>
                                    <span className="text-white font-bold text-base">{formatCurrency(subtotal, store || settings)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-400 font-bold">Item Discounts</span>
                                    <span className="text-red-400 font-bold text-sm">- {formatCurrency(itemDiscounts, store || settings)}</span>
                                </div>
                            </div>

                            {/* Discount Row */}
                            <div className="flex items-center justify-between bg-slate-800/30 rounded-xl p-3 border border-slate-700/50">
                                <span className="text-xs text-slate-400 font-bold">Invoice Discount</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 text-xs">{getCurrencySymbol(store || settings)}</span>
                                    <input
                                        type="number"
                                        value={currentInvoice.discount ?? 0}
                                        onChange={(e) => patchInvoice({ discount: parseFloat(e.target.value) || 0 })}
                                        className="w-20 bg-slate-700/50 border border-slate-600/50 rounded-lg px-2 py-1.5 text-white font-bold text-sm text-right focus:ring-2 ring-indigo-500/20 transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Tax Row */}
                            <div className="flex items-center justify-between bg-slate-800/30 rounded-xl p-3 border border-slate-700/50">
                                <span className="text-xs text-slate-400 font-bold">Tax</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={currentInvoice.tax ?? 0}
                                        onChange={(e) => patchInvoice({ tax: parseFloat(e.target.value) || 0 })}
                                        className="w-16 bg-slate-700/50 border border-slate-600/50 rounded-lg px-2 py-1.5 text-white font-bold text-sm text-right focus:ring-2 ring-indigo-500/20 transition-all"
                                        placeholder="0"
                                    />
                                    <span className="text-slate-500 text-xs">%</span>
                                </div>
                            </div>

                            {/* Delivery Charge Row - Conditional */}
                            {showDeliveryCharges && (
                                <div className="flex items-center justify-between p-2 hover:bg-slate-800/20 rounded-lg transition-colors group">
                                    <span className="text-xs text-slate-500 font-bold group-hover:text-slate-400">Delivery Charges</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-600 text-[10px]">{getCurrencySymbol(store || settings)}</span>
                                        <input
                                            type="number"
                                            value={currentInvoice.delivery_charge ?? 0}
                                            onChange={(e) => patchInvoice({ delivery_charge: parseFloat(e.target.value) || 0 })}
                                            className="w-20 bg-transparent border-b border-dashed border-slate-700 hover:border-indigo-500 transition-all text-xs font-bold text-slate-300 text-right focus:ring-0 focus:border-indigo-500"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Extra Charge Row(s) - Supports multiple fields when enabled */}
                            {showExtraField && (
                                <>
                                    {!enableMultipleExtras ? (
                                        /* Single Extra Field Mode */
                                        <div className="flex items-center justify-between p-2 hover:bg-slate-800/20 rounded-lg transition-colors group">
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    value={currentInvoice.extra_charge_label ?? ''}
                                                    onChange={(e) => patchInvoice({ extra_charge_label: e.target.value })}
                                                    className="bg-transparent border-none p-0 text-xs text-slate-500 font-bold w-20 group-hover:text-slate-400 focus:ring-0"
                                                    placeholder="Extra"
                                                />
                                                <span className="text-[10px] text-slate-700">✎</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-600 text-[10px]">{getCurrencySymbol(store || settings)}</span>
                                                <input
                                                    type="number"
                                                    value={currentInvoice.extra_charge_value ?? 0}
                                                    onChange={(e) => patchInvoice({ extra_charge_value: parseFloat(e.target.value) || 0 })}
                                                    className="w-20 bg-transparent border-b border-dashed border-slate-700 hover:border-indigo-500 transition-all text-xs font-bold text-slate-300 text-right focus:ring-0 focus:border-indigo-500"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        /* Multiple Extra Fields Mode */
                                        <div className="space-y-1">
                                            {(currentInvoice.extraFields || [{ id: 1, label: '', value: 0 }]).map((field, idx) => (
                                                <div key={field.id || idx} className="flex items-center justify-between p-2 hover:bg-slate-800/20 rounded-lg transition-colors group">
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="text"
                                                            value={field.label ?? ''}
                                                            onChange={(e) => {
                                                                const updated = [...(currentInvoice.extraFields || [{ id: 1, label: '', value: 0 }])];
                                                                updated[idx] = { ...updated[idx], label: e.target.value };
                                                                patchInvoice({ extraFields: updated });
                                                            }}
                                                            className="bg-transparent border-none p-0 text-xs text-slate-500 font-bold w-20 group-hover:text-slate-400 focus:ring-0"
                                                            placeholder={`Extra ${idx + 1}`}
                                                        />
                                                        <span className="text-[10px] text-slate-700">✎</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-600 text-[10px]">{getCurrencySymbol(store || settings)}</span>
                                                        <input
                                                            type="number"
                                                            value={field.value ?? 0}
                                                            onChange={(e) => {
                                                                const updated = [...(currentInvoice.extraFields || [{ id: 1, label: '', value: 0 }])];
                                                                updated[idx] = { ...updated[idx], value: parseFloat(e.target.value) || 0 };
                                                                patchInvoice({ extraFields: updated });
                                                            }}
                                                            className="w-16 bg-transparent border-b border-dashed border-slate-700 hover:border-indigo-500 transition-all text-xs font-bold text-slate-300 text-right focus:ring-0 focus:border-indigo-500"
                                                            placeholder="0"
                                                        />
                                                        {(currentInvoice.extraFields || []).length > 1 && (
                                                            <button
                                                                onClick={() => {
                                                                    const updated = (currentInvoice.extraFields || []).filter((_, i) => i !== idx);
                                                                    patchInvoice({ extraFields: updated });
                                                                }}
                                                                className="text-slate-600 hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {(currentInvoice.extraFields || []).length < 10 && (
                                                <button
                                                    onClick={() => {
                                                        const current = currentInvoice.extraFields || [{ id: 1, label: '', value: 0 }];
                                                        patchInvoice({ extraFields: [...current, { id: Date.now(), label: '', value: 0 }] });
                                                    }}
                                                    className="w-full text-center text-[10px] text-indigo-400 hover:text-indigo-300 font-bold py-1 hover:bg-indigo-900/20 rounded-lg transition-all"
                                                >
                                                    + Add Extra Field
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Amount Paid Row */}
                            <div id="tour-invoice-paid" className="flex items-center justify-between bg-emerald-900/20 rounded-xl p-3 border border-emerald-800/30">
                                <span className="text-xs text-emerald-400 font-bold">Amount Paid</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-emerald-600 text-xs">{getCurrencySymbol(store || settings)}</span>
                                    <input
                                        type="number"
                                        value={currentInvoice.amountPaid ?? 0}
                                        onChange={(e) => patchInvoice({ amountPaid: parseFloat(e.target.value) || 0 })}
                                        onFocus={(e) => e.target.select()}
                                        className="w-24 bg-emerald-800/30 border border-emerald-700/50 rounded-lg px-2 py-1.5 text-emerald-400 font-bold text-sm text-right focus:ring-2 ring-emerald-500/20 transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Balance Due Row */}
                            <div className={`flex items-center justify-between rounded-xl p-3 border ${balanceDue > 0 ? 'bg-red-900/20 border-red-800/30' : 'bg-emerald-900/20 border-emerald-800/30'}`}>
                                <span className={`text-xs font-bold ${balanceDue > 0 ? 'text-red-400' : 'text-emerald-400'}`}>Balance Due</span>
                                <span className={`font-bold text-base ${balanceDue > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {formatCurrency(balanceDue, store || settings)}
                                </span>
                            </div>
                        </div>

                        {/* GRAND TOTAL & SAVE - Compact */}
                        <div className="p-3 bg-slate-900 space-y-2 shrink-0 border-t border-slate-800">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Total</span>
                                <span className="text-2xl font-black text-white">{formatCurrency(grandTotal, store || settings)}</span>
                            </div>
                            <div className="space-y-2">
                                <button
                                    id="tour-invoice-complete"
                                    onClick={() => initiateSave()}
                                    disabled={saving}
                                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    <CheckCircle2 size={16} />
                                    {saving ? 'SAVING...' : 'SAVE TEMPLATE'}
                                </button>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            showConfirm({
                                                title: 'Cancel Template?',
                                                message: 'Discard this template? Items will be lost.',
                                                type: 'warning',
                                                confirmLabel: 'Yes, Discard',
                                                onConfirm: () => {
                                                    removeInvoice(currentInvoice.id);
                                                    router.visit(route('store.recurring-invoices.index', { store_slug: store?.slug }));
                                                }
                                            });
                                        }}
                                        className="w-full py-3 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-red-500/20 active:scale-95"
                                    >
                                        <X size={16} /> CANCEL
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {/* INLINE PROFIT DISPLAY - Shows when holding Margin button */}
            {
                showProfit && !showProfitModal && (
                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200">
                        <div className="bg-slate-900/95 backdrop-blur-lg rounded-2xl px-8 py-4 shadow-2xl border border-slate-700 flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${profit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                    <TrendingUp size={24} className={profit >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Profit Margin</p>
                                    <p className={`text-2xl font-black ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatCurrency(profit, store || settings)}
                                    </p>
                                </div>
                            </div>
                            {grandTotal > 0 && (
                                <div className="border-l border-slate-700 pl-6">
                                    <p className="text-xs text-slate-400 font-bold uppercase">Margin %</p>
                                    <p className={`text-xl font-black ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {((profit / grandTotal) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            )}
                            <p className="text-xs text-slate-500 italic">↓ Drag down for details</p>
                        </div>
                    </div>
                )
            }

            {/* SUCCESS MODAL */}
            <FormModal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    removeInvoice(currentInvoice.id);
                }}
                title="Sale Completed!"
                subtitle="Your invoice has been saved successfully"
                size="md"
            >
                <div className="flex flex-col items-center py-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-6 animate-bounce">
                        <CheckCircle2 size={48} className="text-emerald-500" />
                    </div>

                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Transaction Successful</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">The receipt has been generated and stock updated.</p>

                    <div className="grid grid-cols-1 gap-3 w-full">
                        <button
                            onClick={() => {
                                window.open(route('store.sales.print', { store_slug: store?.slug, sale: lastSaleId }), '_blank');
                            }}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20"
                        >
                            <Printer size={20} /> PRINT RECEIPT
                        </button>

                        <button
                            id="tour-new-transaction"
                            onClick={() => {
                                setShowSuccessModal(false);
                                removeInvoice(currentInvoice.id);
                                if (store?.onboarding_step === 'invoice_tour') {
                                    router.reload({ only: ['store'] });
                                }
                            }}
                            className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-200 transition-all"
                        >
                            NEW TRANSACTION
                        </button>
                    </div>
                </div>
            </FormModal>
            {/* SCANNING MODAL */}
            {
                isScanning && (
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/20">
                                        <ScanBarcode size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Scanning Mode</h2>
                                        <p className="text-sm text-slate-500 font-bold">Scan items one after another</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsScanning(false)} className="p-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
                                    <X size={28} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="relative">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Scan Barcode Now..."
                                        value={scanBuffer}
                                        onChange={(e) => setScanBuffer(e.target.value)}
                                        onKeyDown={handleScan}
                                        className="w-full py-8 px-10 bg-slate-50 dark:bg-slate-800 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-[32px] text-3xl font-black text-center focus:ring-8 ring-indigo-500/10 placeholder-slate-200 transition-all"
                                    />
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                                    </div>
                                </div>

                                <div className="max-h-80 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                                    {scannedItems.length === 0 ? (
                                        <div className="text-center py-16 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[40px]">
                                            <Package size={64} className="mx-auto text-slate-200 mb-4" />
                                            <p className="text-slate-400 font-black text-lg">No items scanned yet</p>
                                        </div>
                                    ) : (
                                        scannedItems.map((item, idx) => (
                                            <div key={item.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-2 duration-200">
                                                <div className="flex items-center gap-5">
                                                    <span className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-xs font-black text-slate-400 shadow-sm">{idx + 1}</span>
                                                    <div>
                                                        <p className="font-black text-slate-800 dark:text-white text-lg">
                                                            {item.name}
                                                            {item.quantity > 1 && <span className="ml-2 text-emerald-500 text-base">x{item.quantity}</span>}
                                                        </p>
                                                        <p className="text-sm text-indigo-500 font-black">
                                                            {item.quantity} @ {getCurrencySymbol(store || settings)} {item.price.toLocaleString()} = {getCurrencySymbol(store || settings)} {(item.quantity * item.price).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setScannedItems(prev => prev.filter(i => i.id !== item.id))} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                                                    <Trash2 size={24} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                                <p className="text-base font-black text-slate-500 uppercase tracking-widest">Total: <span className="text-indigo-600">{scannedItems.length} items</span></p>
                                <div className="flex gap-4">
                                    <button onClick={() => setScannedItems([])} className="px-8 py-4 text-sm font-black text-slate-500 hover:text-red-500 transition-colors uppercase tracking-widest">Clear All</button>
                                    <button
                                        onClick={confirmScan}
                                        className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest"
                                    >
                                        Add to Invoice
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* PROFIT ANALYSIS MODAL */}
            {
                showProfitModal && (
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                            {/* Header */}
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <TrendingUp className="text-emerald-600" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Profit Analysis</h3>
                                        <p className="text-xs text-slate-500">Per-item breakdown</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setShowProfitModal(false); setProfitLocked(false); setShowProfit(false); }}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            {/* Items Table */}
                            <div className="flex-1 overflow-y-auto p-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                                            <th className="pb-2 pl-2">#</th>
                                            <th className="pb-2">Product</th>
                                            <th className="pb-2 text-center">Qty</th>
                                            <th className="pb-2 text-right">Cost</th>
                                            <th className="pb-2 text-right">Price</th>
                                            <th className="pb-2 text-right">Margin</th>
                                            <th className="pb-2 text-right pr-2">Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentInvoice.items.filter(item => item.product).map((item, idx) => {
                                            const cost = (item.cost || item.product?.cost || item.product?.cost_price || 0);
                                            const lineTotal = calculateLineTotal(item);
                                            const lineCost = cost * item.quantity;
                                            const lineProfit = lineTotal - lineCost;
                                            const marginPercent = lineTotal > 0 ? (lineProfit / lineTotal * 100).toFixed(1) : 0;

                                            return (
                                                <tr key={item.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="py-2 pl-2 text-slate-400 text-xs">{idx + 1}</td>
                                                    <td className="py-2">
                                                        <p className="font-bold text-slate-800 dark:text-white text-xs">{item.product?.name || item.name}</p>
                                                        <p className="text-[10px] text-slate-400">{item.product?.sku || 'N/A'}</p>
                                                    </td>
                                                    <td className="py-2 text-center text-xs">{item.quantity}</td>
                                                    <td className="py-2 text-right text-xs text-slate-500">{getCurrencySymbol(store || settings)} {cost.toLocaleString()}</td>
                                                    <td className="py-2 text-right text-xs">{getCurrencySymbol(store || settings)} {item.price.toLocaleString()}</td>
                                                    <td className="py-2 text-right">
                                                        <span className={`text-xs font-bold ${parseFloat(marginPercent) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                            {marginPercent}%
                                                        </span>
                                                    </td>
                                                    <td className="py-2 text-right pr-2">
                                                        <span className={`text-xs font-bold ${lineProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {getCurrencySymbol(store || settings)} {lineProfit.toLocaleString()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {currentInvoice.items.filter(item => item.product).length === 0 && (
                                    <div className="text-center py-8 text-slate-400">
                                        <p className="text-sm">No products added yet</p>
                                    </div>
                                )}
                            </div>

                            {/* Summary Footer */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Cost</p>
                                        <p className="text-lg font-bold text-slate-600">{getCurrencySymbol(store || settings)} {totalCost.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Revenue</p>
                                        <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(grandTotal, store || settings)}</p>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                                        <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Net Profit</p>
                                        <p className={`text-lg font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {formatCurrency(profit, store || settings)}
                                            {grandTotal > 0 && (
                                                <span className="text-xs ml-1 opacity-70">({((profit / grandTotal) * 100).toFixed(1)}%)</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* SETTINGS DRAWER */}
            {
                showSettingsDrawer && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[90] animate-in fade-in duration-200"
                            onClick={() => setShowSettingsDrawer(false)}
                        />
                        {/* Drawer */}
                        <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-[100] animate-in slide-in-from-right duration-300 flex flex-col">
                            {/* Header */}
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <Settings size={20} className="text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">Quick Settings</h3>
                                        <p className="text-xs text-slate-500">Invoice preferences</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowSettingsDrawer(false)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            {/* Settings Content */}
                            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                                {/* Invoice Details */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Invoice Details</h4>
                                    
                                    {/* Invoice # */}
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5">
                                        <p className="text-sm font-bold text-slate-700 dark:text-white">Invoice #</p>
                                        <input
                                            type="text"
                                            value={currentInvoice.invoiceNumber || ''}
                                            onChange={(e) => patchInvoice({ invoiceNumber: e.target.value })}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 ring-indigo-500/20 outline-none"
                                            placeholder="INV-XXXXXX"
                                        />
                                    </div>

                                    {/* Date */}
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5">
                                        <p className="text-sm font-bold text-slate-700 dark:text-white">Invoice Date</p>
                                        <input
                                            type="date"
                                            value={currentInvoice.date || ''}
                                            onChange={(e) => patchInvoice({ date: e.target.value })}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 ring-indigo-500/20 outline-none"
                                        />
                                    </div>

                                    {/* Payment Terms */}
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5">
                                        <p className="text-sm font-bold text-slate-700 dark:text-white">Payment Terms</p>
                                        <select
                                            value={currentInvoice.paymentTerms || 'net30'}
                                            onChange={(e) => patchInvoice({ paymentTerms: e.target.value })}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 ring-indigo-500/20 outline-none"
                                        >
                                            <option value="immediate">Immediate</option>
                                            <option value="net7">7 Days</option>
                                            <option value="net15">15 Days</option>
                                            <option value="net30">30 Days</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Display Settings */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Display</h4>

                                    {/* Large Text Mode */}
                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <Type size={18} className="text-purple-500" />
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 dark:text-white">Large Text</p>
                                                <p className="text-xs text-slate-500">Bigger fonts for better visibility</p>
                                            </div>
                                        </div>
                                        <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setTextSize(s)}
                                                    className={`w-7 h-6 rounded-md text-xs font-bold transition-all ${textSize === s ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Show Quick Entry */}
                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <Zap size={18} className="text-indigo-500" />
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 dark:text-white">Quick Entry</p>
                                                <p className="text-xs text-slate-500">Fast product entry row</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowQuickEntry(!showQuickEntry)}
                                            className={`w-12 h-6 rounded-full transition-all ${showQuickEntry ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${showQuickEntry ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Invoice Settings */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Permanent Defaults</h4>

                                    {/* Permanent Delivery */}
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl space-y-2 border border-indigo-100 dark:border-indigo-800/50">
                                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">Default Delivery</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400 text-xs font-bold">{getCurrencySymbol(store || settings)}</span>
                                            <input
                                                type="number"
                                                value={defaultDelivery}
                                                onChange={(e) => setDefaultDelivery(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 dark:text-white"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    {/* Permanent Extra */}
                                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl space-y-2 border border-purple-100 dark:border-purple-800/50">
                                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Default Extra Field</p>
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={defaultExtraLabel}
                                                onChange={(e) => setDefaultExtraLabel(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 dark:text-white"
                                                placeholder="Field Name (e.g. Service)"
                                            />
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400 text-xs font-bold">{getCurrencySymbol(store || settings)}</span>
                                                <input
                                                    type="number"
                                                    value={defaultExtraValue}
                                                    onChange={(e) => setDefaultExtraValue(parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 dark:text-white"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        {/* Multiple Extra Fields Toggle */}
                                        <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                                                    <Plus size={16} className="text-amber-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-white">Multiple Extra Fields</p>
                                                    <p className="text-[10px] text-slate-500">Add up to 10 custom charges</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setEnableMultipleExtras(!enableMultipleExtras)}
                                                className={`w-12 h-6 rounded-full transition-all ${enableMultipleExtras ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${enableMultipleExtras ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>

                                    </div>

                                    {/* Show/Hide Fields */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Show/Hide Fields</h4>

                                        {/* Show Delivery Charges Toggle */}
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 dark:text-white">Delivery Charges</p>
                                                <p className="text-[10px] text-slate-500">Show delivery charges field</p>
                                            </div>
                                            <button
                                                onClick={() => setShowDeliveryCharges(!showDeliveryCharges)}
                                                className={`w-12 h-6 rounded-full transition-all ${showDeliveryCharges ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${showDeliveryCharges ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>

                                        {/* Show Extra Field Toggle */}
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 dark:text-white">Extra Field</p>
                                                <p className="text-[10px] text-slate-500">Show extra charge field(s)</p>
                                            </div>
                                            <button
                                                onClick={() => setShowExtraField(!showExtraField)}
                                                className={`w-12 h-6 rounded-full transition-all ${showExtraField ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${showExtraField ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Invoice Logic */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Invoice Logic</h4>

                                        {/* Default Payment Method */}
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
                                            <p className="text-sm font-bold text-slate-700 dark:text-white">Payment Method</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => patchInvoice({ paymentMethod: 'credit' })}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentInvoice.paymentMethod === 'credit'
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                                                        }`}
                                                >
                                                    Credit
                                                </button>
                                                <button
                                                    onClick={() => patchInvoice({ paymentMethod: 'cash' })}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentInvoice.paymentMethod === 'cash'
                                                        ? 'bg-orange-500 text-white'
                                                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                                                        }`}
                                                >
                                                    Cash
                                                </button>
                                            </div>
                                        </div>

                                        {/* Default Tax */}
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
                                            <p className="text-sm font-bold text-slate-700 dark:text-white">Default Tax Rate</p>
                                            <div className="flex gap-2">
                                                {[0, 5, 10, 17].map(rate => (
                                                    <button
                                                        key={rate}
                                                        onClick={() => patchInvoice({ tax: rate })}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentInvoice.tax === rate
                                                            ? 'bg-indigo-500 text-white'
                                                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                                                            }`}
                                                    >
                                                        {rate}%
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                <button
                                    onClick={() => setShowSettingsDrawer(false)}
                                    className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </>
                )
            }

            {/* QUICK ADD MODALS */}
            <QuickPartyModal
                isOpen={isPartyModalOpen}
                onClose={() => { setIsPartyModalOpen(false); setEditingParty(null); }}
                type="all"
                initialName={customerSearch}
                editingParty={editingParty}
                onSuccess={(newParty) => {
                    patchInvoice({ customer: newParty });
                    setCustomerSearch('');
                    setEditingParty(null);
                }}
            />

            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                mode={productModalMode}
                product={editingProduct}
                initialName={productModalMode === 'create' ? (showQuickEntry ? quickEntry.name : (activeItemIndex !== null ? currentInvoice.items[activeItemIndex]?.name : '')) : ''}
                categories={categories}
                warehouses={warehouses}
                onSubmit={handleProductSubmit}
            />

            {/* OVERPAYMENT MODAL - Midnight Nebula Theme */}
            {
                showOverpaymentModal && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                            onClick={() => setShowOverpaymentModal(false)}
                        />
                        {/* Modal */}
                        <div className="fixed inset-0 flex items-center justify-center z-[210] p-4">
                            <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700/50">
                                {/* Header - Orange Midnight Nebula Style */}
                                <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 dark:from-amber-600 dark:via-orange-700 dark:to-orange-900 p-6 overflow-hidden">
                                    {/* Midnight Nebula ambient glows */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/20 via-transparent to-red-500/20"></div>
                                    <div className="absolute top-0 left-0 w-40 h-40 bg-yellow-400/40 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/4"></div>
                                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-500/30 rounded-full blur-3xl translate-y-1/2 translate-x-1/4"></div>

                                    {/* Glass icon - Midnight Nebula style */}
                                    <div className="relative flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                                            <CreditCard size={26} className="text-white drop-shadow-lg" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white drop-shadow-sm">Overpayment Detected</h3>
                                            <p className="text-white/80 text-sm font-medium">Customer paid extra</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-5 bg-gradient-to-b from-white to-slate-50 dark:from-[#1a1d2e] dark:to-[#0f121d]">
                                    <div className="text-center py-2">
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 font-medium">
                                            {overpaymentDetails.customerName} paid
                                        </p>
                                        <p className="text-5xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                                            {formatCurrency(overpaymentDetails.amount, store || settings)}
                                        </p>
                                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-2 font-medium">more than the total</p>
                                    </div>

                                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-100 dark:border-amber-800/30">
                                        <p className="text-sm text-amber-700 dark:text-amber-300 text-center font-medium">
                                            What would you like to do with this extra amount?
                                        </p>
                                    </div>

                                    {/* Options */}
                                    <div className="grid gap-3">
                                        {/* Option 1: Give Change */}
                                        <button
                                            onClick={() => {
                                                setShowOverpaymentModal(false);
                                                processSale(false, tempPrintIntent);
                                            }}
                                            className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700/50 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all group text-left flex items-center gap-4"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform border border-amber-200 dark:border-amber-800/50">
                                                <ArrowLeftRight size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-800 dark:text-white">Give Change</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    Return {formatCurrency(overpaymentDetails.amount, store || settings)} to customer
                                                </p>
                                            </div>
                                        </button>

                                        {/* Option 2: Credit to Ledger */}
                                        <button
                                            onClick={() => {
                                                setShowOverpaymentModal(false);
                                                processSale(true, tempPrintIntent);
                                            }}
                                            className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700/50 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all group text-left flex items-center gap-4"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform border border-emerald-200 dark:border-emerald-800/50">
                                                <Wallet size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-800 dark:text-white">Credit to Ledger</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    Save {formatCurrency(overpaymentDetails.amount, store || settings)} to {overpaymentDetails.customerName}'s account
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-4 bg-slate-100/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700/50">
                                    <button
                                        onClick={() => setShowOverpaymentModal(false)}
                                        className="w-full py-2.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold text-sm transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )
            }
            {/* MOBILE SALES CARD MODAL */}
            {showMobileSalesModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                            <span className="text-sm font-black text-white">Active Sales Sessions</span>
                            <button
                                onClick={() => setShowMobileSalesModal(false)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        {/* Body / Card Grid */}
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 gap-2.5">
                            {activeInvoices.map((inv, idx) => {
                                const isCurrent = inv.id === currentInvoice.id;
                                const itemCount = inv.items.filter(i => i.product || i.name).length;
                                const invTotal = inv.items.reduce((sum, item) => sum + ((item.quantity + (item.freeQuantity || 0)) * item.price), 0);
                                
                                return (
                                    <div
                                        key={inv.id}
                                        onClick={() => {
                                            setCurrentInvoiceId(inv.id);
                                            setShowMobileSalesModal(false);
                                        }}
                                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                            isCurrent
                                                ? 'bg-indigo-950/30 border-indigo-500 text-indigo-400 shadow shadow-indigo-500/10'
                                                : 'bg-slate-800/40 border-slate-850 hover:border-slate-750 text-slate-350'
                                        }`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-indigo-500 animate-pulse' : 'bg-slate-650'}`}></span>
                                                <p className="font-extrabold text-xs text-white truncate">
                                                    {inv.customer?.name || `Template #${idx + 1}`}
                                                </p>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-1">
                                                {itemCount} {itemCount === 1 ? 'item' : 'items'} • {formatCurrency(invTotal, store || settings)}
                                            </p>
                                        </div>
                                        
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const proceed = () => {
                                                    removeInvoice(inv.id);
                                                    if (activeInvoices.length === 1) {
                                                        router.visit(route('store.recurring-invoices.index', { store_slug: store?.slug }));
                                                    }
                                                };

                                                if (activeInvoices.length === 1 && inv.items.length > 1) {
                                                    showConfirm({
                                                        title: 'Discard Template?',
                                                        message: 'You have unsaved items.',
                                                        type: 'error',
                                                        confirmLabel: 'Discard',
                                                        onConfirm: proceed
                                                    });
                                                } else {
                                                    proceed();
                                                }
                                            }}
                                            className="p-1 rounded-md text-slate-550 hover:text-red-400 hover:bg-slate-800/80 transition-colors shrink-0"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                );
                            })}

                            {/* Add New Sale Card */}
                            <button
                                onClick={() => {
                                    addInvoice({
                                        delivery_charge: defaultDelivery,
                                        extra_charge_value: defaultExtraValue,
                                        extra_charge_label: defaultExtraLabel
                                    });
                                    setShowMobileSalesModal(false);
                                }}
                                className="p-3.5 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:text-white hover:border-slate-500 transition-all flex items-center justify-center gap-2 text-xs font-bold bg-slate-800/10"
                            >
                                <Plus size={14} /> Add New Sale
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <InvoiceTourGuide store={store} />
        </OneGlanceLayout >
    );
};

export default CreateRecurringInvoice;
