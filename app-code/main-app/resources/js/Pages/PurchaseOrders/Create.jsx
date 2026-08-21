import React, { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PurchaseModuleTabs from '@/Components/PurchaseModuleTabs';
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
import ProductModal from '@/Components/ProductModal';
import QuickPartyModal from '@/Components/QuickPartyModal';
import AsyncProductCombobox from '@/Components/AsyncProductCombobox';
import AsyncPartyCombobox from '@/Components/AsyncPartyCombobox';
import WheelInput from '@/Components/WheelInput';

const CreatePurchaseOrder = ({ purchaseOrder }) => {
    const { settings, auth, store } = usePage().props;
    const isSeniorMode = settings?.senior_mode === '1';
    const showMarginPercent = settings?.show_margin_percentage === '1';
    const isAdmin = auth.user?.role === 'admin';

    const {
        activePurchases,
        currentPurchaseId,
        setCurrentPurchaseId,
        addPurchase,
        removePurchase,
        updatePurchase
    } = useWorkspace();

    const { showAlert, showConfirm } = useAlert();

    // --- EDIT MODE LOGIC ---
    const isEditMode = !!purchaseOrder;
    const [editState, setEditState] = useState(null);

    useEffect(() => {
        if (purchaseOrder) {
            setEditState({
                id: purchaseOrder.id,
                invoiceNumber: purchaseOrder.reference_number,
                supplier: purchaseOrder.supplier,
                items: (purchaseOrder.items || []).map(i => ({
                    id: i.id,
                    product: i.product,
                    name: i.product?.name || i.name || 'Unknown Item',
                    quantity: parseFloat(i.quantity) || 1,
                    originalQuantity: parseFloat(i.quantity) || 0,
                    price: parseFloat(i.unit_cost) || 0,
                    cost: parseFloat(i.unit_cost) || 0,
                    discount: 0,
                    discountType: 'fixed',
                    received_qty: i.received_quantity
                })),
                date: purchaseOrder.order_date || new Date().toISOString().split('T')[0],
                notes: purchaseOrder.notes || '',
                amountPaid: (purchaseOrder.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0),
                paymentMethod: purchaseOrder.method || 'cash',
                discount: parseFloat(purchaseOrder.discount) || 0,
                tax: parseFloat(purchaseOrder.tax) || 0,
                delivery_charge: parseFloat(purchaseOrder.delivery_charge) || 0,
                extra_charge_value: parseFloat(purchaseOrder.extra_charge_value) || 0,
                status: purchaseOrder.status,
                isReceived: purchaseOrder.status === 'received',
                is_tax_inclusive: purchaseOrder.is_tax_inclusive || false,
                expectedDeliveryDate: purchaseOrder.expected_delivery_date,
                warehouseId: purchaseOrder.warehouse_id,
            });
        }
    }, [purchaseOrder]);

    const isReadOnly = isEditMode && (purchaseOrder?.status === 'received');

    const currentPurchase = isEditMode
        ? (editState || { items: [], supplier: null, amountPaid: 0 })
        : (activePurchases.find(p => p.id === currentPurchaseId) || activePurchases[0]);

    // Ensure we have a valid purchase if visiting Create page
    useEffect(() => {
        if (!isEditMode && !currentPurchase) {
            addPurchase();
        }
    }, [isEditMode, currentPurchase, addPurchase]);

    // Update current purchase helper
    const patchPurchase = (data) => {
        if (isEditMode) {
            setEditState(prev => ({ ...prev, ...data }));
        } else {
            updatePurchase(currentPurchase.id, data);
        }
    };

    // Quick Add Modals State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productModalMode, setProductModalMode] = useState('create');
    const [editingProduct, setEditingProduct] = useState(null);
    const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
    const [editingParty, setEditingParty] = useState(null);

    // Data for Product Modal
    const [categories, setCategories] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [accounts, setAccounts] = useState([]);

    // Global Sync Listener
    useEffect(() => {
        const handleSync = () => {
            router.reload({ 
                only: ['products', 'categories', 'warehouses'], 
                preserveState: true, 
                preserveScroll: true 
            });
            refreshPurchaseOrderItems();
        };
        window.addEventListener('amd:product-updated', handleSync);
        window.addEventListener('storage', (e) => {
            if (e.key === 'amd_product_latest_change') handleSync();
        });
        return () => window.removeEventListener('amd:product-updated', handleSync);
    }, [currentPurchase?.items]);

    const refreshPurchaseOrderItems = async () => {
        if (!currentPurchase?.items?.length) return;
        const productsToRefresh = currentPurchase.items.filter(i => i.product?.id).map(i => i.product.id);
        if (!productsToRefresh.length) return;

        try {
            const response = await axios.get(route("store.inventory.search", {
                store_slug: store.slug
            }), { params: { ids: productsToRefresh } });
            const latestProducts = response.data || [];
            const newItems = currentPurchase.items.map(item => {
                if (!item.product?.id) return item;
                const latest = latestProducts.find(p => p.id === item.product.id);
                if (latest) {
                    // PROTECT: Don't auto-update costs on historical/finalized records
                    const isFinalized = isEditMode || ['received', 'completed'].includes(currentPurchase.status);
                    
                    return {
                        ...item,
                        product: latest,
                        price: !isFinalized ? parseFloat(latest.cost || latest.cost_price || 0) : item.price,
                        available_stock: parseFloat(latest.stock_quantity || 0),
                        cost: !isFinalized ? parseFloat(latest.cost || latest.cost_price || 0) : item.cost
                    };
                }
                return item;
            });
            patchPurchase({ items: newItems });
        } catch (error) {
            console.error("Failed to refresh purchase order items", error);
        }
    };

    useEffect(() => {
        // Fetch data for Product Modal if needed
        const fetchData = async () => {
            try {
                const [catRes, wareRes, accRes, banksRes] = await Promise.all([
                    axios.get(route('store.api.categories', { store_slug: store.slug })),
                    axios.get(route('store.api.warehouses', { store_slug: store.slug })),
                    axios.get(route('store.accounting.accounts.api', { store_slug: store.slug, type: 'asset' })),
                    axios.get(route('store.api.bank-accounts', { store_slug: store.slug }))
                ]);
                setCategories(catRes.data);
                setWarehouses(wareRes.data);

                // Process Accounts
                const rawAccounts = accRes.data?.data || accRes.data || [];
                const bankAccounts = banksRes.data || [];

                // 1. Cash (Find by code '1000' or Name, don't hardcode ID 1)
                const realCashAccount = rawAccounts.find(a => a.code === '1000' || a.name === 'Cash on Hand');
                const cashAccount = {
                    id: realCashAccount?.id || '', // Safe fallback to empty string if missing (backend validation will catch it)
                    name: realCashAccount?.name || 'Cash in Hand',
                    type: 'cash'
                };

                // 2. Cheque (Static)
                const chequeAccount = { id: 'CHEQUE', name: 'Cheque', type: 'cheque' };

                // 3. Bank Accounts (from separate table, mapped to proper structure)
                // We use a property 'isBank' to handle them specially if needed,
                // BUT for the Payment Account ID, we need a valid Chart of Accounts ID.
                // Assuming 'Bank Account' (ID 2) is the Generic GL Account for banks.
                const generalBankAccount = rawAccounts.find(a => a.name === 'Bank Account' || a.code === '1010');
                const bankGLId = generalBankAccount?.id; // Use actual ID or undefined

                const mappedBankAccounts = bankAccounts.map(b => ({
                    id: `BANK_${b.id} `, // Unique ID for Dropdown Key
                    isBank: true,
                    realAccountId: bankGLId, // The ID to send to backend (GL Account)
                    bankReferenceId: b.id,   // The specific bank ID
                    name: `${b.name} ${b.bank_name ? `(${b.bank_name})` : ''} `,
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
                ? route("store.inventory.store", {
                store_slug: store.slug
            })
                : (editingProduct?.id ? route("store.inventory.update", [store.slug, editingProduct.id]) : "");

            const response = await axios.post(url, data);

            if (response.data) {
                setIsProductModalOpen(false);
                showAlert({
                    title: 'Success',
                    message: `Product ${productModalMode === 'create' ? 'created' : 'updated'} successfully.`,
                    type: 'success'
                });

                // If created, auto-select it if in quick entry
                if (productModalMode === 'create' && showQuickEntry) {
                    setQuickEntry(prev => ({ ...prev, name: data.name }));
                    handleQuickSearch(data.name);
                }
                if (productModalMode === 'edit') {
                    handleQuickSearch(quickEntry.name);
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
    const [supplierSearch, setSupplierSearch] = useState('');
    const [supplierResults, setSupplierResults] = useState([]);
    const [initialSuppliers, setInitialSuppliers] = useState([]);
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [productResults, setProductResults] = useState([]);
    const [initialProducts, setInitialProducts] = useState([]);
    const [activeItemIndex, setActiveItemIndex] = useState(null);
    const [saving, setSaving] = useState(false);

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
    const [quickResults, setQuickResults] = useState([]);

    // Scanning Mode State
    const [isScanning, setIsScanning] = useState(false);
    const [scanBuffer, setScanBuffer] = useState('');
    const [scannedItems, setScannedItems] = useState([]);

    // Profit Sneak Peek State (Removed)
    const [quickSelectedIndex, setQuickSelectedIndex] = useState(-1);
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastPurchaseId, setLastPurchaseId] = useState(null);

    // Per-item Total recalculation mode ('price' or 'qty')
    const [itemTotalModes, setItemTotalModes] = useState({});
    const getItemTotalMode = (id) => itemTotalModes[id] || 'price';
    const toggleItemTotalMode = (id) => setItemTotalModes(prev => ({ ...prev, [id]: prev[id] === 'qty' ? 'price' : 'qty' }));

    // UI Enhancement State
    const [textSize, setTextSize] = useState(1);
    const [showTextSizeMenu, setShowTextSizeMenu] = useState(false);
    const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

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

    // Load initial suppliers for suggestions
    useEffect(() => {
        const loadInitialSuppliers = async () => {
            try {
                const response = await axios.get(route('store.suppliers.search', { store_slug: store.slug }), { params: { search: '' } });
                setInitialSuppliers((response.data || []).slice(0, 50));
            } catch (error) {
                console.error('Failed to load initial suppliers:', error);
            }
        };
        loadInitialSuppliers();
    }, []);

    // Load initial products for suggestions
    useEffect(() => {
        const loadInitialProducts = async () => {
            try {
                const response = await axios.get(route("store.inventory.search", {
                    store_slug: store.slug
                }), { params: { query: '' } });
                setInitialProducts((response.data || []).slice(0, 50));
            } catch (error) {
                console.error('Failed to load initial products:', error);
            }
        };
        loadInitialProducts();
    }, []);



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
    }, [isSeniorMode, currentPurchase]);

    // Search suppliers
    useEffect(() => {
        if (supplierSearch.length < 2) {
            setSupplierResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const response = await axios.get(route('store.suppliers.search', { store_slug: store.slug }), { params: { search: supplierSearch } });
                setSupplierResults(response.data || []);
            } catch (error) {
                console.error('Supplier search error:', error);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [supplierSearch]);

    // Search products
    const searchProducts = async (query, index) => {
        if (query.length < 2) {
            setProductResults([]);
            return;
        }
        try {
            const response = await axios.get(route("store.inventory.search", {
                store_slug: store.slug
            }), { params: { query } });
            setProductResults(response.data || []);
            setActiveItemIndex(index);
        } catch (error) {
            console.error('Product search error:', error);
        }
    };

    // Item Management
    const addItem = () => {
        const newItems = [...currentPurchase.items, { id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: 'fixed' }];
        patchPurchase({ items: newItems });
    };

    const removeItem = (id) => {
        const newItems = currentPurchase.items.filter(item => item.id !== id);
        patchPurchase({ items: newItems.length ? newItems : [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: 'fixed' }] });
    };

    const updateItem = (id, field, value) => {
        const newItems = currentPurchase.items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        patchPurchase({ items: newItems });
    };

    const selectProduct = (product, itemId) => {
        const updatedItems = currentPurchase.items.map(item =>
            item.id === itemId ? {
                ...item,
                product,
                // FOR PURCHASE: Price is COST
                price: parseFloat(product.cost || product.cost_price || 0),
                name: product.name,
                // We might keep cost field redundant or use it to show 'Previous Cost'
                cost: parseFloat(product.cost || product.cost_price || 0),
                available_stock: parseFloat(product.stock_quantity || 0), // Current Stock
                originalQuantity: 0
            } : item
        );

        // Check if this was the last item-if so, add a new empty row automatically
        const lastItem = updatedItems[updatedItems.length - 1];
        if (lastItem.id === itemId) {
            updatedItems.push({ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: 'fixed' });
        }

        patchPurchase({ items: updatedItems });
        setProductResults([]);
        setActiveItemIndex(null);
    };

    // Quick Entry Logic
    const handleQuickSearch = async (query) => {
        setQuickEntry(prev => ({ ...prev, name: query }));
        if (query.length < 2) {
            setQuickResults([]);
            setQuickSelectedIndex(-1);
            return;
        }
        try {
            const response = await axios.get(route("store.inventory.search", {
                store_slug: store.slug
            }), { params: { query } });
            setQuickResults(response.data || []);
            setQuickSelectedIndex(response.data?.length > 0 ? 0 : -1);
        } catch (error) {
            console.error('Quick search error:', error);
        }
    };

    const selectQuickProduct = (product) => {
        setQuickEntry(prev => ({
            ...prev,
            product,
            name: product.name,
            price: parseFloat(product.cost || product.cost_price || 0), // PURCHASE PRICE
            cost: parseFloat(product.cost || product.cost_price || 0)
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
        const firstItem = currentPurchase.items[0];
        let newItems;
        if (currentPurchase.items.length === 1 && !firstItem.product && !firstItem.name) {
            newItems = [newItem];
        } else {
            newItems = [...currentPurchase.items, newItem];
        }

        patchPurchase({ items: newItems });

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
                const response = await axios.get(route("store.inventory.search", {
                    store_slug: store.slug
                }), { params: { query: scanBuffer } });
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
                                price: parseFloat(product.cost || product.cost_price || 0), // PURCHASE PRICE
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
        patchPurchase({ items: [...currentPurchase.items, ...scannedItems] });
        setScannedItems([]);
        setIsScanning(false);
    };



    // Drag and Drop Handlers
    const handleDragStart = (e, index) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        const items = [...currentPurchase.items];
        const draggedItem = items[draggedItemIndex];
        items.splice(draggedItemIndex, 1);
        items.splice(index, 0, draggedItem);

        patchPurchase({ items });
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

    const handleTotalChange = (item, newTotalStr) => {
        const newTotal = parseFloat(newTotalStr);
        if (isNaN(newTotal) || newTotal < 0) return;
        const mode = getItemTotalMode(item.id);
        const qty = parseFloat(item.quantity) || 1;
        const disc = item.discount || 0;
        const discType = item.discountType;
        if (mode === 'price') {
            const newPrice = discType === 'percent'
                ? newTotal / (qty * (1 - disc / 100))
                : (newTotal + disc) / qty;
            updateItem(item.id, 'price', Math.max(0, parseFloat(newPrice.toFixed(4))));
        } else {
            const price = parseFloat(item.price) || 0;
            const effectivePrice = discType === 'percent' ? price * (1 - disc / 100) : price;
            const newQty = effectivePrice > 0 ? newTotal / effectivePrice : 0;
            updateItem(item.id, 'quantity', Math.max(0, parseFloat(newQty.toFixed(4))));
        }
    };

    const subtotal = currentPurchase?.items?.reduce((sum, item) => sum + ((item.quantity + (item.freeQuantity || 0)) * item.price), 0) || 0;
    const totalCost = subtotal;

    const itemDiscounts = currentPurchase?.items?.reduce((sum, item) => {
        const sub = item.quantity * item.price;
        const discountVal = item.discountType === 'percent' ? (sub * (item.discount / 100)) : (item.discount || 0);
        const freeItemValue = (item.freeQuantity || 0) * item.price;
        return sum + discountVal + freeItemValue;
    }, 0) || 0;

    const afterItemDiscounts = subtotal - itemDiscounts;

    // Use the simple discount field (flat amount)
    const invoiceDiscount = parseFloat(currentPurchase?.discount) || 0;
    const afterDiscount = afterItemDiscounts - invoiceDiscount;

    // Tax is a percentage
    const taxAmount = afterDiscount * ((parseFloat(currentPurchase?.tax) || 0) / 100);

    const deliveryCharge = parseFloat(currentPurchase?.delivery_charge) || 0;
    const extraCharge = parseFloat(currentPurchase?.extra_charge_value) || 0;

    const grandTotal = afterDiscount + taxAmount + deliveryCharge + extraCharge;
    const balanceDue = grandTotal - (parseFloat(currentPurchase?.amountPaid) || 0);
    const profit = 0; // Purchase has no profit

    // Alert System


    // VALIDATION
    const [supplierError, setSupplierError] = useState(false);
    const [invalidItems, setInvalidItems] = useState([]);
    const [showOverpaymentModal, setShowOverpaymentModal] = useState(false);
    const [overpaymentDetails, setOverpaymentDetails] = useState({ amount: 0, customerName: '' });
    const [printPreviewOpen, setPrintPreviewOpen] = useState(false); // For "Print"

    const validateInputs = () => {
        let isValid = true;
        let newInvalidItems = [];

        // Check Supplier
        if (!currentPurchase.supplier || typeof currentPurchase.supplier === 'string' || !currentPurchase.supplier.id) {
            setSupplierError(true);
            isValid = false;
        } else {
            setSupplierError(false);
        }

        // Check Items
        currentPurchase.items.forEach((item, index) => {
            if ((item.name && !item.product) || (item.name && item.product && !item.product.id)) {
                newInvalidItems.push(index);
                isValid = false;
            }
        });
        setInvalidItems(newInvalidItems);

        return isValid;
    };

    const handleSave = async (shouldPrint = false) => {
        if (!validateInputs()) {
            showAlert({
                title: 'Validation Error',
                message: 'Please resolve the highlighted errors (Unregistered Supplier or Products).',
                type: 'error'
            });
            return;
        }

        if (!currentPurchase.supplier) {
            showAlert({ title: 'Supplier Required', message: 'Please select a supplier.', type: 'warning' });
            return;
        }

        processPurchase(shouldPrint);
    };

    const processPurchase = async (shouldPrint = false) => {
        setSaving(true);
        try {
            const payload = {
                supplier_id: currentPurchase.supplier.id,
                warehouse_id: currentPurchase.warehouseId || warehouses?.[0]?.id,
                order_date: currentPurchase.date,
                expected_delivery_date: currentPurchase.expectedDeliveryDate,
                items: currentPurchase.items.filter(i => i.product).map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    unit_cost: item.price,
                    discount: item.discount,
                    discount_type: item.discountType,
                    tax: item.tax || 0
                })),
                notes: currentPurchase.notes,
                is_tax_inclusive: currentPurchase.is_tax_inclusive || false,
                amount_paid: currentPurchase.amountPaid,
                payment_method: currentPurchase.paymentMethod,
                discount: invoiceDiscount,
                tax: taxAmount,
                delivery_charge: deliveryCharge,
                extra_charge_value: extraCharge,
                status: currentPurchase.isReceived ? 'received' : 'ordered'
            };

            const url = isEditMode
                ? route('store.purchase-orders.update', currentPurchase.id)
                : route('store.purchase-orders.store', { store_slug: store.slug });

            const response = await axios[isEditMode ? 'put' : 'post'](url, payload);

            if (response.data) {
                // Global Sync Trigger (PO might receive items immediately if isReceived is true)
                window.dispatchEvent(new CustomEvent('amd:product-updated'));
                localStorage.setItem('amd_product_latest_change', Date.now().toString());

                setLastPurchaseId(response.data.id || (isEditMode ? currentPurchase.id : 'new'));
                setShowSuccessModal(true);
                if (shouldPrint) {
                    showAlert({ title: 'Info', message: 'Printing not configured for PO yet.', type: 'info' });
                }
            }
        } catch (error) {
            console.error(error);
            showAlert({
                title: 'Order Failed',
                message: error.response?.data?.message || 'Failed to save purchase order.',
                type: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    // Main Entry Point
    const initiateSave = (print = false) => {
        handleSave(print);
    };

    const [tempPrintIntent, setTempPrintIntent] = useState(false);



    // Safe Loading State (After all hooks)
    // Safe Loading State (After all hooks)
    if (!currentPurchase || (isEditMode && !editState)) {
        return (
            <div className="flex h-screen items-center justify-center bg-app">
                <p className="text-ink-muted animate-pulse">Initializing Purchase Order...</p>
            </div>
        );
    }

    return (
        <OneGlanceLayout title={isEditMode ? `Edit Purchase Order #${editState?.invoiceNumber || ''}` : "New Purchase Order"} activeMenu="Purchases" fullScreen={false} hideHeader={true} noPadding={true}>
            <Head title={isEditMode ? "Edit Purchase Order" : "New Purchase Order"} />
            <div className={`h-full flex-1 flex flex-col bg-sunken dark:bg-void-800 transition-all duration-slower ${isSeniorMode ? 'text-[20px] senior-mode' : ''}`}>
                <style>{`
                    .senior-mode input, .senior-mode button, .senior-mode p, .senior-mode span, .senior-mode td, .senior-mode th {
                        font-size: 1.25rem !important;
                    }
                    .senior-mode .text-emerald-400, .senior-mode .text-emerald-500 {
                        color: rgb(var(--vq-emerald-600)) !important;
                        font-weight: 900 !important;
                    }
                    .senior-mode .text-brand-400, .senior-mode .text-brand-500 {
                        color: rgb(var(--vq-blue-600)) !important;
                        font-weight: 900 !important;
                    }
                    .senior-mode .bg-neutral-900, .senior-mode .bg-void-700 {
                        background-color: #ffffff !important;
                        color: #000000 !important;
                        border: 2px solid #000000 !important;
                    }
                    .hide-scrollbar::-webkit-scrollbar { display: none; }
                    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                    /* Hide number input spinner arrows — scroll-wheel still works */
                    input[type="number"]::-webkit-outer-spin-button,
                    input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
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
                    <div className={`flex-1 bg-surface rounded-2xl shadow-2xl border border-line flex flex-col overflow-hidden min-h-[400px] lg:min-h-0 ${isReadOnly ? 'pointer-events-none opacity-85 select-none' : ''}`}>
                        {isReadOnly && (
                            <div className="bg-brand-600 text-white font-bold text-xs px-4 py-2.5 text-center flex items-center justify-center gap-2 shrink-0">
                                <Info size={14} /> This Purchase Order has been received and is read-only.
                            </div>
                        )}
                        {/* TABS BAR - Now inside left section (Desktop Only) */}
                        <div className="hidden lg:flex items-center gap-1 px-3 pt-2 pb-0 overflow-x-auto hide-scrollbar border-b border-line bg-sunken/50 dark:bg-surface shrink-0">
                            {activePurchases.map((purchase, idx) => (
                                <div
                                    key={purchase.id}
                                    onClick={() => setCurrentPurchaseId(purchase.id)}
                                    className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-all min-w-[100px] max-w-[160px] relative group text-xs
                                    ${currentPurchaseId === purchase.id
                                            ? 'bg-surface text-brand-600'
                                            : 'bg-sunken/50 dark:bg-surface text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover'
                                        }
`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${currentPurchaseId === purchase.id ? 'bg-brand-500 animate-pulse' : 'bg-neutral-400'}`}></div>
                                    <span className="text-xs font-bold truncate">
                                        {purchase.supplier?.name || `PO #${idx + 1}`}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const proceed = () => {
                                                removePurchase(purchase.id);
                                                if (activePurchases.length === 1) router.visit(route('store.purchase-orders.index', { store_slug: store.slug }));
                                            };

                                            if (activePurchases.length === 1 && purchase.items.length > 1) {
                                                showConfirm({
                                                    title: 'Discard Order?',
                                                    message: 'You have unsaved items. Discarding will lose this data.',
                                                    type: 'error',
                                                    confirmLabel: 'Discard',
                                                    onConfirm: proceed
                                                });
                                            } else {
                                                proceed();
                                            }
                                        }}
                                        className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 transition-all"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => addPurchase()}
                                className="px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-all shadow-lg active:scale-95 shrink-0"
                                title="New Tab"
                            >
                                <Plus size={12} />
                            </button>
                        </div>

                        {/* TOP ACTION BAR - Mobile View (Compact & Premium) */}
                        <div className="flex lg:hidden flex-col gap-1.5 p-1.5 bg-void-800 border-b border-neutral-800/80 shrink-0">
                            {/* Row 1: Back (Left), Purchase Pill (Center), Settings (Right) */}
                            <div className="flex items-center justify-between w-full relative">
                                <button
                                    onClick={() => router.visit(route('store.purchase-orders.index', { store_slug: store?.slug }))}
                                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-800 text-ink-muted border border-neutral-700 shadow-sm"
                                    title="Go Back"
                                >
                                    <ArrowLeft size={14} />
                                </button>
                                
                                <button
                                    className="flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-900/30 border border-brand-800 rounded-full text-1xs font-bold text-brand-400 max-w-[60%] shadow-sm active:scale-95 transition-all"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse shrink-0"></span>
                                    <span className="truncate">
                                        {currentPurchase.supplier?.name || `PO #${activePurchases.findIndex(inv => inv.id === currentPurchase.id) + 1}`}
                                    </span>
                                </button>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        onClick={() => setShowSettingsDrawer(true)}
                                        className="flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-800 text-ink-muted border border-neutral-700 shadow-sm hover:text-white"
                                        title="Settings"
                                    >
                                        <Settings size={13} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Are you sure you want to cancel and discard this purchase order?")) {
                                                removePurchase(currentPurchase.id);
                                                router.visit(route('store.purchase-orders.index', { store_slug: store.slug }));
                                            }
                                        }}
                                        className="flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-800 text-red-400 hover:text-red-500 border border-neutral-700 shadow-sm active:scale-95 transition-all"
                                        title="Cancel PO"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Row 2: Customer Search (Left), Payment & Term Controls (Right) */}
                            <div className="flex items-center gap-1.5 w-full">
                                <div className="relative flex-1 min-w-0">
                                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted z-10 pointer-events-none">
                                        <User size={13} />
                                    </div>
                                    {currentPurchase.supplier ? (
                                        <div className="relative">
                                            <div className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-7 pr-7 py-1.5 flex items-center justify-between shadow-sm min-h-[36px]">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-neutral-200 text-xs truncate leading-tight">{currentPurchase.supplier.name}</p>
                                                    <p className="text-3xs text-ink-muted leading-none">{currentPurchase.supplier.phone || 'No Phone'}</p>
                                                </div>
                                                <button
                                                    onClick={() => { patchPurchase({ supplier: null }); setSupplierSearch(''); }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-red-500 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <AsyncPartyCombobox
                                                type="all"
                                                selectedItem={currentPurchase.supplier}
                                                onSelect={(supplier) => {
                                                    patchPurchase({ supplier });
                                                    setSupplierError(false);
                                                }}
                                                onCreateNew={() => setIsPartyModalOpen(true)}
                                                onEdit={(supplier) => {
                                                    setEditingParty(supplier);
                                                    setIsPartyModalOpen(true);
                                                }}
                                                placeholder="Search Party..."
                                                addNewLabel="Create Party"
                                                inputClassName={`h-9 min-h-[36px] text-xs py-1.5 ${supplierError ? '!border-red-500 !ring-red-500/20' : ''}`}
                                            />
                                            {supplierError && (
                                                <p className="absolute -bottom-2 left-3.5 bg-red-600 text-white text-4xs font-bold uppercase px-1.5 py-0.5 rounded shadow-md z-20 animate-pulse">
                                                    Please select supplier
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Compact Credit/Cash toggle & wallet */}
                                <div className="flex items-center gap-1 shrink-0">
                                    {/* Expected status button */}
                                    <button
                                        type="button"
                                        onClick={() => patchPurchase({ isReceived: !currentPurchase.isReceived })}
                                        className={`flex items-center justify-center w-[36px] h-[36px] rounded-lg border ${currentPurchase.isReceived ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-neutral-800 text-ink-muted border-neutral-700'}`}
                                    >
                                        <Package size={13} />
                                    </button>

                                    <div className="flex items-center gap-0.5 bg-neutral-800 rounded-lg p-0.5 border border-neutral-700 h-[36px]">
                                        <button
                                            type="button"
                                            onClick={() => patchPurchase({ paymentMethod: 'credit' })}
                                            className={`px-2 py-1 rounded text-2xs font-bold transition-all ${currentPurchase.paymentMethod === 'credit' ? 'bg-emerald-600 text-white shadow-sm' : 'text-ink-muted'}`}
                                        >
                                            CREDIT
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => patchPurchase({ paymentMethod: 'cash' })}
                                            className={`px-2 py-1 rounded text-2xs font-bold transition-all ${currentPurchase.paymentMethod === 'cash' ? 'bg-orange-655 text-white shadow-sm' : 'text-ink-muted'}`}
                                        >
                                            CASH
                                        </button>
                                    </div>
                                    
                                    <div className="relative group/accounts-mobile shrink-0 h-[36px]">
                                        <button type="button" className="flex items-center justify-center w-9 h-[36px] rounded-lg bg-neutral-800 text-brand-400 border border-neutral-700 shadow-sm active:scale-95">
                                            <Wallet size={13} />
                                        </button>
                                        <div className="absolute right-0 top-full pt-1 z-50 hidden group-hover/accounts-mobile:block">
                                            <div className="bg-neutral-800 rounded-lg shadow-xl border border-neutral-700 overflow-hidden w-36 p-1">
                                                <div className="p-1 border-b border-neutral-700 bg-neutral-900/50">
                                                    <p className="text-4xs font-bold text-ink-muted uppercase">Pay From</p>
                                                </div>
                                                <div className="max-h-32 overflow-y-auto custom-scrollbar p-0.5">
                                                    {accounts.map(acc => (
                                                        <button
                                                            key={acc.id}
                                                            type="button"
                                                            onClick={() => {
                                                                if (acc.isBank) {
                                                                    patchPurchase({
                                                                        paymentAccountId: acc.realAccountId,
                                                                        selectedBankName: acc.name,
                                                                        paymentReference: `Paid from: ${acc.name}`
                                                                    });
                                                                } else {
                                                                    patchPurchase({
                                                                        paymentAccountId: acc.id,
                                                                        selectedBankName: null,
                                                                        paymentReference: ''
                                                                    });
                                                                }
                                                            }}
                                                            className={`w-full text-left px-1.5 py-0.5 rounded text-3xs font-bold transition-colors flex items-center justify-between ${(currentPurchase.paymentAccountId || 1) === acc.id ? 'bg-brand-900/20 text-brand-400' : 'text-neutral-300 hover:bg-interactive-hover'}`}
                                                        >
                                                            <span className="truncate">{acc.name}</span>
                                                            {(currentPurchase.paymentAccountId || 1) === acc.id && <CheckCircle2 size={9} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* TOP ACTION BAR - Desktop View (Hidden on Mobile) */}
                        <div className="hidden lg:flex px-3 py-2 border-b border-line items-center justify-between gap-3 bg-sunken/50 dark:bg-surface shrink-0">
                            {/* Left-Quick Entry & Scan Mode */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setShowQuickEntry(!showQuickEntry);
                                        if (!showQuickEntry) {
                                            setTimeout(() => document.getElementById('quick-entry-input')?.focus(), 50);
                                        }
                                    }}
                                    className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all border ${showQuickEntry ? 'bg-brand-600 text-white border-brand-500 shadow-lg ' : 'bg-surface text-ink-muted border-line hover:bg-interactive-hover'}`}
                                    title="Toggle Quick Add (Alt+Q)"
                                >
                                    <Zap size={20} className={showQuickEntry ? 'fill-current' : ''} />
                                </button>
                                <button
                                    onClick={() => setIsScanning(true)}
                                    className="flex items-center gap-2 px-5 py-3 bg-surface text-ink-secondary rounded-2xl hover:bg-interactive-hover transition-all border border-line shadow-sm"
                                    title="Scanning Mode"
                                >
                                    <ScanBarcode size={20} />
                                    <span className="text-sm font-bold">Scan</span>
                                </button>
                            </div>

                            {/* Center-Supplier Search */}
                            <div className="relative flex-1 max-w-xl">
                                <AsyncPartyCombobox
                                    type="all"
                                    selectedItem={currentPurchase.supplier}
                                    onSelect={(supplier) => {
                                        patchPurchase({ supplier });
                                        setSupplierError(false);
                                    }}
                                    onCreateNew={() => setIsPartyModalOpen(true)}
                                    onEdit={(supplier) => {
                                        setEditingParty(supplier);
                                        setIsPartyModalOpen(true);
                                    }}
                                    placeholder="Search Party (Name/Phone)..."
                                    addNewLabel="Create New Party"
                                />
                                {supplierError && (
                                    <p className="absolute -bottom-5 left-2 text-2xs font-bold text-red-500 animate-pulse">
                                        Please select a supplier
                                    </p>
                                )}
                            </div>

                            {/* Right-Credit/Cash Toggle */}
                            <div className="flex items-center gap-2">
                                {/* Received Status Toggle */}
                                <button
                                    onClick={() => patchPurchase({ isReceived: !currentPurchase.isReceived })}
                                    className={`px-3 py-1.5 rounded-lg text-2xs font-bold flex items-center gap-1.5 transition-all ${currentPurchase.isReceived
                                        ? 'bg-emerald-500 text-white shadow '
                                        : 'bg-sunken text-ink-muted hover:bg-interactive-hover'
                                        }`}
                                    title="Toggle Received Status"
                                >
                                    <Package size={12} /> {currentPurchase.isReceived ? 'RECEIVED' : 'ORDERED'}
                                </button>

                                <div className="flex items-center gap-0.5 bg-sunken rounded-xl p-1 border border-line">
                                    <button
                                        onClick={() => patchPurchase({ paymentMethod: 'credit' })}
                                        className={`px-3 py-1.5 rounded-lg text-2xs font-bold flex items-center gap-1.5 transition-all ${currentPurchase.paymentMethod === 'credit'
                                            ? 'bg-emerald-500 text-white shadow '
                                            : 'text-ink-muted hover:text-ink-secondary'
                                            }`}
                                    >
                                        <CreditCard size={12} /> CREDIT
                                    </button>
                                    <button
                                        onClick={() => patchPurchase({ paymentMethod: 'cash' })}
                                        className={`px-3 py-1.5 rounded-lg text-2xs font-bold flex items-center gap-1.5 transition-all ${currentPurchase.paymentMethod === 'cash'
                                            ? 'bg-orange-500 text-white shadow shadow-orange-500/20'
                                            : 'text-ink-muted hover:text-ink-secondary'
                                            }`}
                                    >
                                        <Banknote size={12} /> CASH
                                    </button>
                                </div>

                                {/* Payment Account Dropdown */}
                                <div className="relative group/accounts">
                                    <button
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sunken text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-all border border-line text-2xs font-bold min-w-[120px] justify-between"
                                    >
                                        <span className="flex items-center gap-1.5 truncate">
                                            <Wallet size={12} className="text-brand-500" />
                                            {currentPurchase.selectedBankName || accounts.find(a => a.id === (currentPurchase.paymentAccountId || 1))?.name || 'Cash in Hand'}
                                        </span>
                                        <ChevronRight size={12} className="rotate-90 text-ink-muted" />
                                    </button>

                                    <div className="absolute top-full pt-2 right-0 w-48 z-50 overflow-hidden hidden group-hover/accounts:block animate-in fade-in slide-in-from-top-2">
                                        <div className="bg-surface rounded-xl shadow-xl border border-line overflow-hidden">
                                            <div className="p-2 border-b border-line bg-app">
                                                <p className="text-2xs font-bold text-ink-muted uppercase">Pay From</p>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                                                {accounts.map(acc => (
                                                    <button
                                                        key={acc.id}
                                                        onClick={() => {
                                                            if (acc.isBank) {
                                                                patchPurchase({
                                                                    paymentAccountId: acc.realAccountId,
                                                                    selectedBankName: acc.name,
                                                                    paymentReference: `Paid from: ${acc.name}`
                                                                });
                                                            } else {
                                                                patchPurchase({
                                                                    paymentAccountId: acc.id,
                                                                    selectedBankName: null, // Clear explicit bank name
                                                                    paymentReference: ''
                                                                });
                                                            }
                                                        }}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${(currentPurchase.paymentAccountId || 1) === acc.id
                                                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                                                            : 'text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover'
                                                            }`}
                                                    >
                                                        <span>{acc.name}</span>
                                                        {(currentPurchase.paymentAccountId || 1) === acc.id && <CheckCircle2 size={12} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Text Size Toggle */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowTextSizeMenu(!showTextSizeMenu)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all border text-2xs font-bold ${textSize > 1
                                            ? 'bg-purple-500 text-white border-purple-500 shadow '
                                            : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                                            }`}
                                        title="Change Text Size"
                                    >
                                        <Type size={12} /> Aa+ {textSize > 1 && `(${textSize})`}
                                    </button>

                                    {showTextSizeMenu && (
                                        <div className="absolute top-full mt-2 right-0 w-32 bg-surface rounded-xl shadow-xl border border-line z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            {[1, 2, 3, 4, 5].map((size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => { setTextSize(size); setShowTextSizeMenu(false); }}
                                                    className={`w-full text-left px-4 py-3 text-xs font-bold hover: bg-sunken dark: hover: bg-neutral-700 transition-colors ${textSize === size ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'text-ink-secondary'}`}
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
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sunken text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-all border border-line text-2xs font-bold"
                                    title="Quick Settings"
                                >
                                    <Settings size={12} />
                                </button>
                            </div>
                        </div>

                        {/* ITEMS AREA CONTAINER */}
                        <div className="flex-1 overflow-y-auto hide-scrollbar px-2 py-2">
                            <table className="hidden md:table w-full border-separate border-spacing-y-1.5">
                                <thead>
                                    <tr className="text-left text-xs font-bold text-ink-muted uppercase tracking-wide">
                                        <th className="pb-2 w-8"></th>
                                        <th className="pb-2 pl-3 w-10 text-center">#</th>
                                        <th className="pb-2">Item Description</th>
                                        <th className="pb-2 w-20 text-center">Qty</th>
                                        <th className="pb-2 w-20 text-center text-xs text-emerald-600">Free</th>
                                        <th className="pb-2 w-28 text-right">Price</th>
                                        <th className="pb-2 w-32 text-right">Discount</th>
                                        <th className="pb-2 w-28 text-right">Total</th>
                                        <th className="pb-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {showQuickEntry && (
                                        <tr className="bg-gradient-to-r from-brand-50/50 to-purple-50/50 dark:from-brand-900/10 dark:to-purple-900/10 border border-brand-200 dark:border-brand-800/50 rounded-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-normal">
                                            <td className="py-3"></td>
                                            <td className="py-3 pl-3">
                                                <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                                                    <Zap size={16} className="text-brand-600" />
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
                                                    className="w-16 bg-surface border border-brand-200 dark:border-brand-900/30 rounded-lg text-center text-sm font-bold py-2 focus:ring-2 ring-brand-500/20 outline-none"
                                                />
                                            </td>
                                            <td className="py-3 text-center">
                                                <input
                                                    type="number"
                                                    value={quickEntry.freeQuantity || ''}
                                                    placeholder="0"
                                                    onChange={(e) => setQuickEntry(prev => ({ ...prev, freeQuantity: parseFloat(e.target.value) || 0 }))}
                                                    onFocus={() => setQuickResults([])}
                                                    className="w-16 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 py-2 focus:ring-2 ring-emerald-500/20 outline-none placeholder-emerald-300"
                                                />
                                            </td>
                                            <td className="py-3 text-right">
                                                <input
                                                    type="number"
                                                    value={quickEntry.price}
                                                    onChange={(e) => setQuickEntry(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                                    onFocus={() => setQuickResults([])}
                                                    onKeyDown={(e) => e.key === 'Enter' && addQuickItem()}
                                                    className="w-24 bg-surface border border-brand-200 dark:border-brand-900/30 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-brand-500/20 outline-none"
                                                />
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <input
                                                        ref={discountRef}
                                                        type="number"
                                                        value={quickEntry.discount}
                                                        onChange={(e) => setQuickEntry(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                                                        onFocus={() => setQuickResults([])}
                                                        onKeyDown={(e) => e.key === 'Enter' && addQuickItem()}
                                                        className="w-20 bg-surface border border-brand-200 dark:border-brand-900/30 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-brand-500/20 outline-none"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            setQuickResults([]);
                                                            setQuickEntry(prev => ({ ...prev, discountType: prev.discountType === 'fixed' ? 'percent' : 'fixed' }));
                                                        }}
                                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${quickEntry.discountType === 'percent' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'}`}
                                                    >
                                                        {quickEntry.discountType === 'percent' ? '%' : (getCurrencySymbol())}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-3 text-right">
                                                <button
                                                    onClick={addQuickItem}
                                                    className="w-8 h-8 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all shadow flex items-center justify-center active:scale-90"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </td>
                                            <td className="py-3 pr-3"></td>
                                        </tr>
                                    )}

                                    {/* EXISTING ITEMS (Desktop Table Rows) */}
                                    {currentPurchase.items.map((item, idx) => (
                                        <tr
                                            key={item.id}
                                            className={`group animate-in fade-in duration-normal ${draggedItemIndex === idx ? 'opacity-50' : ''}`}
                                            draggable
                                            onDragStart={(e) => {}}
                                            onDragOver={(e) => handleDragOver(e, idx)}
                                            onDragEnd={handleDragEnd}
                                        >
                                            {/* Drag Handle - Strict */}
                                            <td
                                                className="bg-app rounded-l-xl py-3 pl-2 cursor-ns-resize group-active:cursor-grabbing"
                                                onMouseDown={(e) => {
                                                    e.currentTarget.parentElement.setAttribute('draggable', 'true');
                                                }}
                                                onMouseUp={(e) => {
                                                    e.currentTarget.parentElement.setAttribute('draggable', 'false');
                                                }}
                                            >
                                                <GripVertical size={16} className="text-neutral-300 hover:text-ink-muted transition-colors" />
                                            </td>
                                            {/* Row Number */}
                                            <td className="bg-app py-3 text-sm font-bold text-ink-muted text-center">
                                                {idx + 1}
                                            </td>
                                            {/* Product Name */}
                                            <td className="bg-app py-3 relative">
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
                                                    placeholder="Search product..."
                                                    addNewLabel="Add New Product"
                                                    hideCostAndMargin={!isAdmin}
                                                />
                                            </td>
                                            {/* Quantity */}
                                            <td className="bg-app py-3 text-center align-middle">
                                                <div className="relative flex flex-col items-center">
                                                    <WheelInput
                                                        type="number"
                                                        value={item.quantity ?? 1}
                                                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                        onFocus={(e) => {
                                                            e.target.select();
                                                            setActiveItemIndex(null);
                                                            setProductResults([]);
                                                        }}
                                                        className="w-16 bg-sunken border border-line dark:border-line rounded-lg text-center text-sm font-bold py-2 focus:ring-2 ring-brand-500/20 transition-all no-spinner"
                                                    />
                                                    {item.product && (
                                                        <span className={`absolute -bottom-4 text-2xs font-bold whitespace-nowrap ${item.available_stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                                            (Avail: {item.available_stock || 0})
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Free Quantity */}
                                            <td className="bg-app py-3 text-center align-middle">
                                                <WheelInput
                                                    type="number"
                                                    value={item.freeQuantity || ''}
                                                    placeholder="0"
                                                    onChange={(e) => updateItem(item.id, 'freeQuantity', parseFloat(e.target.value) || 0)}
                                                    className="w-16 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30 rounded-lg text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 py-2 focus:ring-2 ring-emerald-500/20 transition-all placeholder-emerald-300/50 no-spinner"
                                                />
                                            </td>
                                            {/* Price */}
                                            <td className="bg-app py-3 text-right align-middle">
                                                <WheelInput
                                                    type="number"
                                                    value={item.price ?? 0}
                                                    onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                                    onFocus={(e) => {
                                                        e.target.select();
                                                        setActiveItemIndex(null);
                                                        setProductResults([]);
                                                    }}
                                                    className="w-24 bg-sunken border border-line dark:border-line rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-brand-500/20 transition-all no-spinner"
                                                />
                                            </td>
                                            {/* Discount */}
                                            <td className="bg-app py-3 text-right align-middle">
                                                <div className="flex items-center justify-end gap-2">
                                                    <WheelInput
                                                        type="number"
                                                        value={item.discount ?? 0}
                                                        onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                                        className="w-20 bg-sunken border border-line dark:border-line rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-brand-500/20 transition-all no-spinner"
                                                    />
                                                    <button
                                                        onClick={() => updateItem(item.id, 'discountType', item.discountType === 'fixed' ? 'percent' : 'fixed')}
                                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${item.discountType === 'percent' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-secondary'}`}
                                                    >
                                                        {item.discountType === 'percent' ? '%' : (getCurrencySymbol())}
                                                    </button>
                                                </div>
                                            </td>
                                            {/* Total - Editable with mode toggle */}
                                            <td className="bg-app py-3 pr-3 align-middle">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => toggleItemTotalMode(item.id)}
                                                        title={getItemTotalMode(item.id) === 'price' ? 'Recalculates: Price  (click → Qty mode)' : 'Recalculates: Qty  (click → Price mode)'}
                                                        className={`w-7 h-7 rounded-md text-2xs font-bold transition-all shrink-0 border flex items-center justify-center ${
                                                            getItemTotalMode(item.id) === 'price'
                                                                ? 'bg-brand-600 text-white border-brand-500 shadow '
                                                                : 'bg-emerald-600 text-white border-emerald-500 shadow '
                                                        }`}
                                                    >
                                                        {getItemTotalMode(item.id) === 'price' ? (getCurrencySymbol()) : '#'}
                                                    </button>
                                                    <WheelInput
                                                        type="number"
                                                        value={parseFloat(calculateLineTotal(item).toFixed(2))}
                                                        onChange={(e) => handleTotalChange(item, e.target.value)}
                                                        onFocus={(e) => e.target.select()}
                                                        className="w-24 bg-sunken border border-brand-300 dark:border-brand-600 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-brand-500/30 transition-all text-ink no-spinner"
                                                    />
                                                </div>
                                            </td>
                                            {/* Delete */}
                                            <td className="bg-app rounded-r-xl py-3 pr-3 align-middle">
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Mobile View - Items Card List (Mobile Only) */}
                            <div className="md:hidden flex flex-col gap-2">
                                {showQuickEntry && (
                                    <div className="bg-brand-50/30 dark:bg-brand-900/10 p-3 rounded-xl border border-brand-200/50 dark:border-brand-800/50 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-normal">
                                        <div className="flex items-center gap-2">
                                            <span className="text-brand-600"><Zap size={16} /></span>
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
                                                    hideCostAndMargin={!isAdmin}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-3xs font-bold text-ink-muted uppercase">Qty</span>
                                                <input
                                                    type="number"
                                                    value={quickEntry.quantity}
                                                    onChange={(e) => setQuickEntry(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                                                    className="w-full bg-surface border border-brand-200 dark:border-brand-900/30 rounded-lg text-center text-xs font-bold py-1.5 focus:ring-2 ring-brand-500/20"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-3xs font-bold text-ink-muted uppercase">Free</span>
                                                <input
                                                    type="number"
                                                    value={quickEntry.freeQuantity || ''}
                                                    onChange={(e) => setQuickEntry(prev => ({ ...prev, freeQuantity: parseFloat(e.target.value) || 0 }))}
                                                    className="w-full bg-surface border border-brand-200 dark:border-brand-900/30 rounded-lg text-center text-xs font-bold py-1.5 focus:ring-2 ring-brand-500/20"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-3xs font-bold text-ink-muted uppercase">Price</span>
                                                <input
                                                    type="number"
                                                    value={quickEntry.price}
                                                    onChange={(e) => setQuickEntry(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                                    className="w-full bg-surface border border-brand-200 dark:border-brand-900/30 rounded-lg text-right text-xs font-bold py-1.5 px-2 focus:ring-2 ring-brand-500/20"
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <button
                                                    onClick={addQuickItem}
                                                    className="w-full h-[32px] bg-brand-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 active:scale-95"
                                                >
                                                    <Plus size={12} /> Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentPurchase.items.length === 0 ? (
                                    <div className="bg-surface rounded-xl p-8 text-center border border-line">
                                        <Package size={32} className="mx-auto text-ink-muted mb-2" />
                                        <p className="text-xs font-bold text-ink-secondary">No items added to note</p>
                                    </div>
                                ) : (
                                    currentPurchase.items.map((item, idx) => (
                                        <div key={item.id} className="bg-surface p-2.5 rounded-xl border border-line shadow-sm flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <span className="w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-2xs font-bold text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
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
                                                            inputClassName="!h-[34px] !py-1 !text-xs !pl-9"
                                                            hideCostAndMargin={!isAdmin}
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-1 text-ink-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shrink-0 ml-2"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {item.product && (
                                                <div className="grid grid-cols-12 gap-1.5 mt-1 items-end">
                                                    {/* Qty */}
                                                    <div className="col-span-3 flex flex-col gap-0.5">
                                                        <span className="text-3xs font-bold text-ink-muted uppercase">Qty</span>
                                                        <WheelInput
                                                            type="number"
                                                            value={item.quantity ?? 1}
                                                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                            className="w-full bg-app border border-line rounded-lg text-center text-xs font-bold py-1 focus:ring-1 ring-brand-500/20 outline-none no-spinner"
                                                        />
                                                    </div>

                                                    {/* Price */}
                                                    <div className="col-span-3 flex flex-col gap-0.5">
                                                        <span className="text-3xs font-bold text-ink-muted uppercase">Price</span>
                                                        <WheelInput
                                                            type="number"
                                                            value={item.price ?? 0}
                                                            onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                                            className="w-full bg-app border border-line rounded-lg text-right text-xs font-bold py-1 px-1.5 focus:ring-1 ring-brand-500/20 outline-none no-spinner"
                                                        />
                                                    </div>

                                                    {/* Discount */}
                                                    <div className="col-span-3 flex flex-col gap-0.5">
                                                        <span className="text-3xs font-bold text-ink-muted uppercase">Disc</span>
                                                        <div className="flex items-center gap-0.5 bg-app border border-line rounded-lg pr-0.5">
                                                            <WheelInput
                                                                type="number"
                                                                value={item.discount ?? 0}
                                                                onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                                                className="w-full bg-transparent border-none text-right text-xs font-bold py-1 pl-1 pr-0.5 focus:ring-0 outline-none no-spinner"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => updateItem(item.id, 'discountType', item.discountType === 'fixed' ? 'percent' : 'fixed')}
                                                                className={`w-3.5 h-3.5 rounded text-4xs font-bold transition-all flex items-center justify-center shrink-0 ${item.discountType === 'percent' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'}`}
                                                            >
                                                                {item.discountType === 'percent' ? '%' : (getCurrencySymbol())}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Total */}
                                                    <div className="col-span-3 flex flex-col gap-0.5 text-right">
                                                        <span className="text-3xs font-bold text-ink-muted uppercase">Total</span>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleItemTotalMode(item.id)}
                                                                className={`w-5 h-5 rounded text-4xs font-bold transition-all shrink-0 border flex items-center justify-center ${
                                                                    getItemTotalMode(item.id) === 'price'
                                                                        ? 'bg-brand-600 dark:bg-brand-500 text-white border-brand-600 dark:border-brand-500'
                                                                        : 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500'
                                                                }`}
                                                            >
                                                                {getItemTotalMode(item.id) === 'price' ? (getCurrencySymbol()) : '#'}
                                                            </button>
                                                            <WheelInput
                                                                type="number"
                                                                value={parseFloat(calculateLineTotal(item).toFixed(2))}
                                                                onChange={(e) => handleTotalChange(item, e.target.value)}
                                                                className="w-full bg-app border border-line rounded-lg text-right text-xs font-bold py-1 px-1 focus:ring-1 ring-brand-500/20 text-ink outline-none no-spinner"
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
                        <div className="shrink-0 px-4 py-2 border-t border-line bg-surface flex justify-center">
                            <button
                                onClick={addItem}
                                className="px-5 py-2 flex items-center justify-center gap-1.5 text-brand-600 dark:text-brand-400 font-bold text-xs hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl border border-dashed border-brand-200 dark:border-brand-800 transition-all active:scale-95 shadow-sm"
                            >
                                <Plus size={14} /> ADD NEW ITEM
                            </button>
                        </div>

                        {/* MOBILE STICKY CHECKOUT PANEL (Mobile Only) */}
                        <div className="lg:hidden flex flex-col shrink-0">
                            {/* Row 1: Compact financial input fields */}
                            <div className="grid grid-cols-4 gap-1.5 px-3 py-1.5 bg-app border-t border-line shrink-0">
                                <div>
                                    <span className="text-4xs text-ink-muted font-bold block mb-0.5 uppercase">Discount</span>
                                    <input
                                        type="number"
                                        value={currentPurchase.discount ?? 0}
                                        onChange={(e) => patchPurchase({ discount: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-sunken border border-line rounded-lg px-1.5 h-9 text-ink text-xs font-bold text-right outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <span className="text-4xs text-ink-muted font-bold block mb-0.5 uppercase">Paid</span>
                                    <input
                                        type="number"
                                        value={currentPurchase.amountPaid ?? 0}
                                        onChange={(e) => patchPurchase({ amountPaid: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-sunken border border-line rounded-lg px-1.5 h-9 text-ink text-xs font-bold text-right outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <span className="text-4xs text-ink-muted font-bold block mb-0.5 uppercase">Bal Due</span>
                                    <div className={`w-full bg-sunken rounded-lg px-1.5 h-9 text-xs font-bold text-right border ${balanceDue > 0 ? 'text-red-500 border-red-500/20' : 'text-emerald-500 border-emerald-500/20'} flex items-center justify-end`}>
                                        {formatCurrency(balanceDue, store)}
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Cancel (25%) & Complete Return (75%) */}
                            <div className="flex items-center gap-2 px-2 py-1.5 bg-surface border-t border-line shrink-0">
                                <button
                                    onClick={() => {
                                        if (window.confirm("Are you sure you want to cancel and discard this purchase order?")) {
                                            removePurchase(currentPurchase.id);
                                            router.visit(route('store.purchase-orders.index', { store_slug: store.slug }));
                                        }
                                    }}
                                    className="w-1/4 py-3.5 border border-red-200 dark:border-red-800 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95 transition-all text-center flex items-center justify-center"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => initiateSave(false)}
                                    disabled={saving}
                                    className="w-3/4 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    <CheckCircle2 size={16} />
                                    {saving ? 'SAVING...' : `CONFIRM ORDER (${formatCurrency(grandTotal, store)})`}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SECTION - Side Info Panel */}
                    <div className="hidden lg:flex w-full lg:w-80 bg-void-700 flex-col overflow-hidden rounded-2xl shadow-2xl border border-neutral-800 shrink-0">

                        {/* Customer Summary Section-Text Size Responsive */}
                        <div className="p-4 border-b border-neutral-800/50 bg-neutral-900/30 shrink-0">
                            {currentPurchase.supplier ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 ${textSize >= 4 ? 'w-16 h-16 text-xl' : textSize >= 3 ? 'w-14 h-14 text-lg' : 'w-12 h-12 text-lg'}`}>
                                            {currentPurchase.supplier.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-white font-bold truncate ${textSize >= 4 ? 'text-lg' : textSize >= 3 ? 'text-base' : 'text-sm'}`}>{currentPurchase.supplier.name}</p>
                                            <p className={`text-ink-muted font-medium ${textSize >= 4 ? 'text-sm' : textSize >= 3 ? 'text-xs' : 'text-2xs'}`}>{currentPurchase.supplier.phone || 'No Phone'}</p>
                                        </div>
                                        <button
                                            onClick={() => { patchPurchase({ supplier: null }); setSupplierSearch(''); }}
                                            className="text-ink-secondary hover:text-red-400 p-1.5 hover:bg-red-400/10 rounded-lg transition-all shrink-0"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    {/* Balance & Address */}
                                    <div className={`space-y-1 bg-neutral-800 / 30 rounded-lg p-2 ${textSize >= 3 ? 'text-sm' : 'text-xs'}`}>
                                        <div className="flex justify-between items-center">
                                            <span className="text-ink-muted font-medium">Balance:</span>
                                            <span className={`font-bold ${currentPurchase.supplier.current_balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {currentPurchase.supplier.current_balance >= 0 ? (getCurrencySymbol()) + ' ' : '-' + (getCurrencySymbol()) + ''}{Math.abs(currentPurchase.supplier.current_balance || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="text-ink-muted font-medium shrink-0">Address:</span>
                                            <span className={`text-right ${currentPurchase.supplier.address ? 'text-neutral-300' : 'text-ink-secondary italic'}`}>
                                                {currentPurchase.supplier.address || 'Not set'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4 border border-dashed border-neutral-700 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-neutral-800/50 flex items-center justify-center mx-auto mb-2 text-ink-muted">
                                        <User size={20} />
                                    </div>
                                    <p className={`text-ink-muted font-bold ${textSize >= 3 ? 'text-sm' : 'text-xs'}`}>No Supplier Selected</p>
                                </div>
                            )}
                        </div>

                        {/* Invoice Details Section-Scrollable */}
                        <div className="flex-1 p-3 space-y-3 overflow-y-auto hide-scrollbar">
                            {/* Invoice # & Date Row */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-3xs text-ink-muted font-bold uppercase block mb-1">Po #</label>
                                    <input
                                        type="text"
                                        value={currentPurchase.invoiceNumber || ''}
                                        onChange={(e) => patchPurchase({ invoiceNumber: e.target.value })}
                                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-2 py-1.5 text-white text-2xs font-bold focus:ring-2 ring-brand-500/20 focus:border-brand-500 transition-all"
                                        placeholder="PO-000001"
                                    />
                                </div>
                                <div>
                                    <label className="text-3xs text-ink-muted font-bold uppercase block mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={currentPurchase.date || ''}
                                        onChange={(e) => patchPurchase({ date: e.target.value })}
                                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-2 py-1.5 text-white text-2xs font-bold focus:ring-2 ring-brand-500/20 focus:border-brand-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Terms Row */}
                            <div>
                                <label className="text-3xs text-ink-muted font-bold uppercase block mb-1">Terms</label>
                                <select
                                    value={currentPurchase.paymentTerms || 'net30'}
                                    onChange={(e) => patchPurchase({ paymentTerms: e.target.value })}
                                    className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-2 py-1.5 text-white text-2xs font-bold focus:ring-2 ring-brand-500/20 focus:border-brand-500 transition-all"
                                >
                                    <option value="immediate">Immediate</option>
                                    <option value="net7">Net 7</option>
                                    <option value="net15">Net 15</option>
                                    <option value="net30">Net 30</option>
                                    <option value="net60">Net 60</option>
                                </select>
                            </div>
                            
                            {/* Tax Inclusive Toggle */}
                            <div className="flex items-center justify-between p-2 mt-2 bg-brand-900/20 rounded-lg border border-brand-800/30">
                                <label htmlFor="is_tax_inclusive" className="text-xs text-brand-300 font-bold cursor-pointer">
                                    Prices Include Tax
                                </label>
                                <input
                                    type="checkbox"
                                    id="is_tax_inclusive"
                                    checked={currentPurchase.is_tax_inclusive ?? false}
                                    onChange={(e) => patchPurchase({ is_tax_inclusive: e.target.checked })}
                                    className="rounded border-neutral-600 bg-neutral-800 text-brand-500 shadow-sm focus:ring-brand-500 cursor-pointer"
                                />
                            </div>

                            {/* CHEQUE DETAILS-Conditional */}
                            {currentPurchase.paymentAccountId === 'CHEQUE' && (
                                <div className="grid grid-cols-2 gap-2 p-2 bg-brand-500/10 rounded-lg border border-brand-500/30 animate-in slide-in-from-top-2">
                                    <div className="col-span-2">
                                        <p className="text-2xs text-brand-400 font-bold uppercase mb-2 flex items-center gap-1">
                                            <Wallet size={12} /> CHEQUE DETAILS
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-3xs text-ink-muted font-bold uppercase block mb-1">Cheque No</label>
                                        <input
                                            type="text"
                                            value={currentPurchase.paymentReference || ''}
                                            onChange={(e) => patchPurchase({ paymentReference: e.target.value })}
                                            className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-2 py-1.5 text-white text-2xs font-bold focus:ring-2 ring-brand-500/20 focus:border-brand-500 transition-all placeholder-slate-600"
                                            placeholder="XXXXXX"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-3xs text-ink-muted font-bold uppercase block mb-1">Cheque Date</label>
                                        <input
                                            type="date"
                                            value={currentPurchase.chequeDate || new Date().toISOString().split('T')[0]}
                                            onChange={(e) => patchPurchase({ chequeDate: e.target.value })}
                                            className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-2 py-1.5 text-white text-2xs font-bold focus:ring-2 ring-brand-500/20 focus:border-brand-500 transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Financial Summary-Bigger */}
                            <div className="space-y-2 pt-3 border-t border-neutral-800/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-ink-muted font-bold">Subtotal</span>
                                    <span className="text-white font-bold text-base">{formatCurrency(subtotal, store)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-ink-muted font-bold">Item Discounts</span>
                                    <span className="text-red-400 font-bold text-sm">- {formatCurrency(itemDiscounts, store)}</span>
                                </div>
                            </div>

                            {/* Discount Row */}
                            <div className="flex items-center justify-between bg-neutral-800/30 rounded-xl p-3 border border-neutral-700/50">
                                <span className="text-xs text-ink-muted font-bold">Invoice Discount</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-ink-muted text-xs">{getCurrencySymbol()}</span>
                                    <input
                                        type="number"
                                        value={currentPurchase.discount ?? 0}
                                        onChange={(e) => patchPurchase({ discount: parseFloat(e.target.value) || 0 })}
                                        className="w-20 bg-neutral-700/50 border border-neutral-600/50 rounded-lg px-2 py-1.5 text-white font-bold text-sm text-right focus:ring-2 ring-brand-500/20 transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Tax Row */}
                            <div className="flex items-center justify-between bg-neutral-800/30 rounded-xl p-3 border border-neutral-700/50">
                                <span className="text-xs text-ink-muted font-bold">Tax</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={currentPurchase.tax ?? 0}
                                        onChange={(e) => patchPurchase({ tax: parseFloat(e.target.value) || 0 })}
                                        className="w-16 bg-neutral-700/50 border border-neutral-600/50 rounded-lg px-2 py-1.5 text-white font-bold text-sm text-right focus:ring-2 ring-brand-500/20 transition-all"
                                        placeholder="0"
                                    />
                                    <span className="text-ink-muted text-xs">%</span>
                                </div>
                            </div>

                            {/* Delivery Charge Row-Conditional */}
                            {showDeliveryCharges && (
                                <div className="flex items-center justify-between p-2 hover:bg-interactive-hover rounded-lg transition-colors group">
                                    <span className="text-xs text-ink-muted font-bold group-hover:text-ink-muted">Delivery Charges</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-ink-secondary text-2xs">{getCurrencySymbol()}</span>
                                        <input
                                            type="number"
                                            value={currentPurchase.delivery_charge ?? 0}
                                            onChange={(e) => patchPurchase({ delivery_charge: parseFloat(e.target.value) || 0 })}
                                            className="w-20 bg-transparent border-b border-dashed border-neutral-700 hover:border-brand-500 transition-all text-xs font-bold text-neutral-300 text-right focus:ring-0 focus:border-brand-500"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Extra Charge Row(s)-Supports multiple fields when enabled */}
                            {showExtraField && (
                                <>
                                    {!enableMultipleExtras ? (
                                        /* Single Extra Field Mode */
                                        (<div className="flex items-center justify-between p-2 hover:bg-interactive-hover rounded-lg transition-colors group">
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    value={currentPurchase.extra_charge_label ?? ''}
                                                    onChange={(e) => patchPurchase({ extra_charge_label: e.target.value })}
                                                    className="bg-transparent border-none p-0 text-xs text-ink-muted font-bold w-20 group-hover:text-ink-muted focus:ring-0"
                                                    placeholder="Extra"
                                                />
                                                <span className="text-2xs text-ink-secondary">{"\u270E"}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-ink-secondary text-2xs">{getCurrencySymbol()}</span>
                                                <input
                                                    type="number"
                                                    value={currentPurchase.extra_charge_value ?? 0}
                                                    onChange={(e) => patchPurchase({ extra_charge_value: parseFloat(e.target.value) || 0 })}
                                                    className="w-20 bg-transparent border-b border-dashed border-neutral-700 hover:border-brand-500 transition-all text-xs font-bold text-neutral-300 text-right focus:ring-0 focus:border-brand-500"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>)
                                    ) : (
                                        /* Multiple Extra Fields Mode */
                                        (<div className="space-y-1">
                                            {(currentPurchase.extraFields || [{ id: 1, label: '', value: 0 }]).map((field, idx) => (
                                                <div key={field.id || idx} className="flex items-center justify-between p-2 hover:bg-interactive-hover rounded-lg transition-colors group">
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="text"
                                                            value={field.label ?? ''}
                                                            onChange={(e) => {
                                                                const updated = [...(currentPurchase.extraFields || [{ id: 1, label: '', value: 0 }])];
                                                                updated[idx] = { ...updated[idx], label: e.target.value };
                                                                patchPurchase({ extraFields: updated });
                                                            }}
                                                            className="bg-transparent border-none p-0 text-xs text-ink-muted font-bold w-20 group-hover:text-ink-muted focus:ring-0"
                                                            placeholder={`Extra ${idx + 1}`}
                                                        />
                                                        <span className="text-2xs text-ink-secondary">{"\u270E"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-ink-secondary text-2xs">{getCurrencySymbol()}</span>
                                                        <input
                                                            type="number"
                                                            value={field.value ?? 0}
                                                            onChange={(e) => {
                                                                const updated = [...(currentPurchase.extraFields || [{ id: 1, label: '', value: 0 }])];
                                                                updated[idx] = { ...updated[idx], value: parseFloat(e.target.value) || 0 };
                                                                patchPurchase({ extraFields: updated });
                                                            }}
                                                            className="w-16 bg-transparent border-b border-dashed border-neutral-700 hover:border-brand-500 transition-all text-xs font-bold text-neutral-300 text-right focus:ring-0 focus:border-brand-500"
                                                            placeholder="0"
                                                        />
                                                        {(currentPurchase.extraFields || []).length > 1 && (
                                                            <button
                                                                onClick={() => {
                                                                    const updated = (currentPurchase.extraFields || []).filter((_, i) => i !== idx);
                                                                    patchPurchase({ extraFields: updated });
                                                                }}
                                                                className="text-ink-secondary hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {(currentPurchase.extraFields || []).length < 10 && (
                                                <button
                                                    onClick={() => {
                                                        const current = currentPurchase.extraFields || [{ id: 1, label: '', value: 0 }];
                                                        patchPurchase({ extraFields: [...current, { id: Date.now(), label: '', value: 0 }] });
                                                    }}
                                                    className="w-full text-center text-2xs text-brand-400 hover:text-brand-300 font-bold py-1 hover:bg-brand-900/20 rounded-lg transition-all"
                                                >
                                                    + Add Extra Field
                                                </button>
                                            )}
                                        </div>)
                                    )}
                                </>
                            )}

                            {/* Amount Paid Row */}
                            <div className="flex items-center justify-between bg-emerald-900/20 rounded-xl p-3 border border-emerald-800/30">
                                <span className="text-xs text-emerald-400 font-bold">Amount Paid</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-emerald-600 text-xs">{getCurrencySymbol()}</span>
                                    <input
                                        type="number"
                                        value={currentPurchase.amountPaid ?? 0}
                                        onChange={(e) => patchPurchase({ amountPaid: parseFloat(e.target.value) || 0 })}
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
                                    {formatCurrency(balanceDue, store)}
                                </span>
                            </div>
                        </div>

                        {/* GRAND TOTAL & SAVE-Compact */}
                        <div className="p-3 bg-neutral-900 space-y-2 shrink-0 border-t border-neutral-800">
                            <div className="flex justify-between items-center">
                                <span className="text-2xs text-ink-muted font-bold uppercase">Total</span>
                                <span className="text-2xl font-bold text-white">{formatCurrency(grandTotal, store)}</span>
                            </div>
                            <div className="space-y-2">
                                <button
                                    onClick={() => initiateSave(false)}
                                    disabled={saving || isReadOnly}
                                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    <CheckCircle2 size={16} />
                                    {saving ? 'SAVING...' : (isReadOnly ? 'ORDER RECEIVED' : (isEditMode ? 'UPDATE ORDER' : 'COMPLETE ORDER'))}
                                </button>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            if (isReadOnly) {
                                                window.open(route("store.purchase-orders.print", [store.slug, currentPurchase.id]), '_blank');
                                            } else {
                                                initiateSave(true);
                                            }
                                        }}
                                        disabled={saving}
                                        className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                    >
                                        <Printer size={16} />
                                        {saving ? '...' : 'PRINT ORDER'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (isEditMode) {
                                                router.visit(route('store.purchase-orders.index', { store_slug: store.slug }));
                                                return;
                                            }
                                            showConfirm({
                                                title: 'Cancel Order?',
                                                message: 'Discard this order? Items will be lost.',
                                                type: 'warning',
                                                confirmLabel: 'Yes, Discard',
                                                onConfirm: () => {
                                                    removePurchase(currentPurchase.id);
                                                    router.visit(route('store.purchase-orders.index', { store_slug: store.slug }));
                                                }
                                            });
                                        }}
                                        className="flex-1 py-3 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-red-500/20 active:scale-95"
                                    >
                                        <X size={16} /> CANCEL
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
            {/* INLINE PROFIT DISPLAY-Shows when holding Margin button */}
            {
                false && (
                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-normal">
                        <div className="bg-neutral-900/95 backdrop-blur-lg rounded-2xl px-8 py-4 shadow-2xl border border-neutral-700 flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${profit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                    <TrendingUp size={24} className={profit >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                                </div>
                                <div>
                                    <p className="text-xs text-ink-muted font-bold uppercase">Profit Margin</p>
                                    <p className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatCurrency(profit, store)}
                                    </p>
                                </div>
                            </div>
                            {grandTotal > 0 && (
                                <div className="border-l border-neutral-700 pl-6">
                                    <p className="text-xs text-ink-muted font-bold uppercase">Margin %</p>
                                    <p className={`text-xl font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {((profit / grandTotal) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            )}
                            <p className="text-xs text-ink-muted italic">↓ Drag down for details</p>
                        </div>
                    </div>
                )
            }
            {/* SUCCESS MODAL */}
            <FormModal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    removePurchase(currentPurchase.id);
                }}
                title="Order Completed!"
                subtitle="Your purchase order has been saved successfully"
                size="md"
            >
                <div className="flex flex-col items-center py-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-6 animate-bounce">
                        <CheckCircle2 size={48} className="text-emerald-500" />
                    </div>

                    <h3 className="text-xl font-bold text-ink mb-2">Transaction Successful</h3>
                    <p className="text-ink-muted text-sm mb-8">The purchase order has been generated and stock updated.</p>

                    <div className="grid grid-cols-1 gap-3 w-full">
                        <button
                            onClick={() => {
                                window.open(route('store.purchase-orders.print', lastPurchaseId), '_blank');
                            }}
                            className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl "
                        >
                            <Printer size={20} /> PRINT ORDER
                        </button>

                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                removePurchase(currentPurchase.id);
                            }}
                            className="w-full py-4 bg-sunken text-ink-secondary rounded-2xl font-bold hover:bg-interactive-hover transition-all"
                        >
                            NEW ORDER
                        </button>
                    </div>
                </div>
            </FormModal>
            {/* SCANNING MODAL */}
            {
                isScanning && (
                    <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-md z-drawer flex items-center justify-center p-4">
                        <div className="bg-surface rounded-2xl shadow-2xl border border-line w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-slow">
                            <div className="p-8 border-b border-line flex items-center justify-between bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-800/50 dark:to-neutral-900">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-xl ">
                                        <ScanBarcode size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-ink">Scanning Mode</h2>
                                        <p className="text-sm text-ink-muted font-bold">Scan items one after another</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsScanning(false)} className="p-4 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-2xl transition-all">
                                    <X size={28} className="text-ink-muted" />
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
                                        className="w-full py-8 px-10 bg-app border-4 border-brand-100 dark:border-brand-900/30 rounded-xl text-3xl font-bold text-center focus:ring-8 ring-brand-500/10 placeholder-slate-200 transition-all"
                                    />
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                                    </div>
                                </div>

                                <div className="max-h-80 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                                    {scannedItems.length === 0 ? (
                                        <div className="text-center py-16 border-4 border-dashed border-line rounded-2xl">
                                            <Package size={64} className="mx-auto text-neutral-200 mb-4" />
                                            <p className="text-ink-muted font-bold text-lg">No items scanned yet</p>
                                        </div>
                                    ) : (
                                        scannedItems.map((item, idx) => (
                                            <div key={item.id} className="flex items-center justify-between p-5 bg-app rounded-2xl border-2 border-line animate-in slide-in-from-bottom-2 duration-normal">
                                                <div className="flex items-center gap-5">
                                                    <span className="w-10 h-10 rounded-full bg-sunken flex items-center justify-center text-xs font-bold text-ink-muted shadow-sm">{idx + 1}</span>
                                                    <div>
                                                        <p className="font-bold text-ink text-lg">
                                                            {item.name}
                                                            {item.quantity > 1 && <span className="ml-2 text-emerald-500 text-base">x{item.quantity}</span>}
                                                        </p>
                                                        <p className="text-sm text-brand-500 font-bold">
                                                            {item.quantity} @ {getCurrencySymbol()} {item.price.toLocaleString()} = {getCurrencySymbol()} {(item.quantity * item.price).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setScannedItems(prev => prev.filter(i => i.id !== item.id))} className="p-3 text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                                                    <Trash2 size={24} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="p-8 bg-app flex items-center justify-between border-t border-line">
                                <p className="text-base font-bold text-ink-muted uppercase tracking-widest">Total: <span className="text-brand-600">{scannedItems.length} items</span></p>
                                <div className="flex gap-4">
                                    <button onClick={() => setScannedItems([])} className="px-8 py-4 text-sm font-bold text-ink-muted hover:text-red-500 transition-colors uppercase tracking-widest">Clear All</button>
                                    <button
                                        onClick={confirmScan}
                                        className="bg-brand-600 text-white px-12 py-4 rounded-2xl font-bold shadow-xl hover:bg-brand-700 transition-all active:scale-95 uppercase tracking-widest"
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
                false && (
                    <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm z-drawer flex items-center justify-center p-4">
                        <div className="bg-surface rounded-2xl shadow-2xl border border-line w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-normal flex flex-col max-h-[80vh]">
                            {/* Header */}
                            <div className="p-4 border-b border-line flex justify-between items-center bg-app shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <TrendingUp className="text-emerald-600" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-ink">Profit Analysis</h3>
                                        <p className="text-xs text-ink-muted">Per-item breakdown</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { /* setShowProfitModal(false); setProfitLocked(false); setShowProfit(false); */ }}
                                    className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl transition-all"
                                >
                                    <X size={20} className="text-ink-muted" />
                                </button>
                            </div>

                            {/* Items Table */}
                            <div className="flex-1 overflow-y-auto p-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-2xs font-bold text-ink-muted uppercase border-b border-line">
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
                                        {currentPurchase.items.filter(item => item.product).map((item, idx) => {
                                            const cost = (item.cost || item.product?.cost || item.product?.cost_price || 0);
                                            const lineTotal = calculateLineTotal(item);
                                            const lineCost = cost * item.quantity;
                                            const lineProfit = lineTotal - lineCost;
                                            const marginPercent = lineTotal > 0 ? (lineProfit / lineTotal * 100).toFixed(1) : 0;

                                            return (
                                                <tr key={item.id} className="border-b border-line hover:bg-interactive-hover dark:hover:bg-interactive-hover">
                                                    <td className="py-2 pl-2 text-ink-muted text-xs">{idx + 1}</td>
                                                    <td className="py-2">
                                                        <p className="font-bold text-ink text-xs">{item.product?.name || item.name}</p>
                                                        <p className="text-2xs text-ink-muted">{item.product?.sku || 'N/A'}</p>
                                                    </td>
                                                    <td className="py-2 text-center text-xs">{item.quantity}</td>
                                                    <td className="py-2 text-right text-xs text-ink-muted">{getCurrencySymbol()} {cost.toLocaleString()}</td>
                                                    <td className="py-2 text-right text-xs">{getCurrencySymbol()} {item.price.toLocaleString()}</td>
                                                    <td className="py-2 text-right">
                                                        <span className={`text-xs font-bold ${parseFloat(marginPercent) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                            {marginPercent}%
                                                        </span>
                                                    </td>
                                                    <td className="py-2 text-right pr-2">
                                                        <span className={`text-xs font-bold ${lineProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {getCurrencySymbol()} {lineProfit.toLocaleString()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {currentPurchase.items.filter(item => item.product).length === 0 && (
                                    <div className="text-center py-8 text-ink-muted">
                                        <p className="text-sm">No products added yet</p>
                                    </div>
                                )}
                            </div>

                            {/* Summary Footer */}
                            <div className="p-4 bg-app border-t border-line shrink-0">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-surface rounded-xl p-3 border border-line">
                                        <p className="text-2xs text-ink-muted font-bold uppercase mb-1">Total Cost</p>
                                        <p className="text-lg font-bold text-ink-secondary">{getCurrencySymbol()} {totalCost.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-surface rounded-xl p-3 border border-line">
                                        <p className="text-2xs text-ink-muted font-bold uppercase mb-1">Total Revenue</p>
                                        <p className="text-lg font-bold text-ink">{formatCurrency(grandTotal, store)}</p>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                                        <p className="text-2xs text-emerald-600 font-bold uppercase mb-1">Net Profit</p>
                                        <p className={`text-lg font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {formatCurrency(profit, store)}
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
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-drawer animate-in fade-in duration-normal"
                            onClick={() => setShowSettingsDrawer(false)}
                        />
                        {/* Drawer */}
                        <div className="fixed top-0 right-0 h-full w-80 bg-surface shadow-2xl z-drawer animate-in slide-in-from-right duration-slow flex flex-col">
                            {/* Header */}
                            <div className="p-4 border-b border-line flex items-center justify-between bg-app">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-sunken flex items-center justify-center">
                                        <Settings size={20} className="text-ink-secondary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-ink">Quick Settings</h3>
                                        <p className="text-xs text-ink-muted">Invoice preferences</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowSettingsDrawer(false)}
                                    className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl transition-all"
                                >
                                    <X size={20} className="text-ink-muted" />
                                </button>
                            </div>

                            {/* Settings Content */}
                            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                                {/* Display Settings */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wide">Display</h4>

                                    {/* Large Text Mode */}
                                    <div className="flex items-center justify-between p-3 bg-app rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <Type size={18} className="text-purple-500" />
                                            <div>
                                                <p className="text-sm font-bold text-ink-secondary dark:text-white">Large Text</p>
                                                <p className="text-xs text-ink-muted">Bigger fonts for better visibility</p>
                                            </div>
                                        </div>
                                        <div className="flex bg-sunken rounded-lg p-1">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setTextSize(s)}
                                                    className={`w-7 h-6 rounded-md text-xs font-bold transition-all ${textSize === s ? 'bg-purple-500 text-white shadow-sm' : 'text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Show Quick Entry */}
                                    <div className="flex items-center justify-between p-3 bg-app rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <Zap size={18} className="text-brand-500" />
                                            <div>
                                                <p className="text-sm font-bold text-ink-secondary dark:text-white">Quick Entry</p>
                                                <p className="text-xs text-ink-muted">Fast product entry row</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowQuickEntry(!showQuickEntry)}
                                            className={`w-12 h-6 rounded-full transition-all ${showQuickEntry ? 'bg-brand-500' : 'bg-sunken'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${showQuickEntry ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Invoice Settings */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wide">Permanent Defaults</h4>

                                    {/* Permanent Delivery */}
                                    <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl space-y-2 border border-brand-100 dark:border-brand-800/50">
                                        <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase">Default Delivery</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-ink-muted text-xs font-bold">{getCurrencySymbol()}</span>
                                            <input
                                                type="number"
                                                value={defaultDelivery}
                                                onChange={(e) => setDefaultDelivery(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-surface border border-line rounded-lg px-2 py-1.5 text-sm font-bold text-ink-secondary dark:text-white"
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
                                                className="w-full bg-surface border border-line rounded-lg px-2 py-1.5 text-xs font-bold text-ink-secondary dark:text-white"
                                                placeholder="Field Name (e.g. Service)"
                                            />
                                            <div className="flex items-center gap-2">
                                                <span className="text-ink-muted text-xs font-bold">{getCurrencySymbol()}</span>
                                                <input
                                                    type="number"
                                                    value={defaultExtraValue}
                                                    onChange={(e) => setDefaultExtraValue(parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-surface border border-line rounded-lg px-2 py-1.5 text-sm font-bold text-ink-secondary dark:text-white"
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
                                                    <p className="text-sm font-bold text-ink-secondary dark:text-white">Multiple Extra Fields</p>
                                                    <p className="text-2xs text-ink-muted">Add up to 10 custom charges</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setEnableMultipleExtras(!enableMultipleExtras)}
                                                className={`w-12 h-6 rounded-full transition-all ${enableMultipleExtras ? 'bg-amber-500' : 'bg-sunken'}`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${enableMultipleExtras ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>

                                    </div>

                                    {/* Show/Hide Fields */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wide">Show/Hide Fields</h4>

                                        {/* Show Delivery Charges Toggle */}
                                        <div className="flex items-center justify-between p-3 bg-app rounded-xl">
                                            <div>
                                                <p className="text-sm font-bold text-ink-secondary dark:text-white">Delivery Charges</p>
                                                <p className="text-2xs text-ink-muted">Show delivery charges field</p>
                                            </div>
                                            <button
                                                onClick={() => setShowDeliveryCharges(!showDeliveryCharges)}
                                                className={`w-12 h-6 rounded-full transition-all ${showDeliveryCharges ? 'bg-brand-500' : 'bg-sunken'}`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${showDeliveryCharges ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>

                                        {/* Show Extra Field Toggle */}
                                        <div className="flex items-center justify-between p-3 bg-app rounded-xl">
                                            <div>
                                                <p className="text-sm font-bold text-ink-secondary dark:text-white">Extra Field</p>
                                                <p className="text-2xs text-ink-muted">Show extra charge field(s)</p>
                                            </div>
                                            <button
                                                onClick={() => setShowExtraField(!showExtraField)}
                                                className={`w-12 h-6 rounded-full transition-all ${showExtraField ? 'bg-brand-500' : 'bg-sunken'}`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${showExtraField ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Invoice Logic */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wide">Invoice Logic</h4>

                                        {/* Default Payment Method */}
                                        <div className="p-3 bg-app rounded-xl space-y-2">
                                            <p className="text-sm font-bold text-ink-secondary dark:text-white">Payment Method</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => patchPurchase({ paymentMethod: 'credit' })}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentPurchase.paymentMethod === 'credit'
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-sunken text-ink-secondary border border-line dark:border-line'
                                                        }`}
                                                >
                                                    Credit
                                                </button>
                                                <button
                                                    onClick={() => patchPurchase({ paymentMethod: 'cash' })}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentPurchase.paymentMethod === 'cash'
                                                        ? 'bg-orange-500 text-white'
                                                        : 'bg-sunken text-ink-secondary border border-line dark:border-line'
                                                        }`}
                                                >
                                                    Cash
                                                </button>
                                            </div>
                                        </div>

                                        {/* Default Tax */}
                                        <div className="p-3 bg-app rounded-xl space-y-2">
                                            <p className="text-sm font-bold text-ink-secondary dark:text-white">Default Tax Rate</p>
                                            <div className="flex gap-2">
                                                {[0, 5, 10, 17].map(rate => (
                                                    <button
                                                        key={rate}
                                                        onClick={() => patchPurchase({ tax: rate })}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentPurchase.tax === rate
                                                            ? 'bg-brand-500 text-white'
                                                            : 'bg-sunken text-ink-secondary border border-line dark:border-line'
                                                            }`}
                                                    >
                                                        {rate}%
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Payment Terms */}
                                        <div className="p-3 bg-app rounded-xl space-y-2">
                                            <p className="text-sm font-bold text-ink-secondary dark:text-white">Payment Terms</p>
                                            <select
                                                value={currentPurchase.paymentTerms || 'net30'}
                                                onChange={(e) => patchPurchase({ paymentTerms: e.target.value })}
                                                className="w-full bg-sunken border border-line dark:border-line rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 ring-brand-500/20"
                                            >
                                                <option value="immediate">Immediate</option>
                                                <option value="net7">Net 7 Days</option>
                                                <option value="net15">Net 15 Days</option>
                                                <option value="net30">Net 30 Days</option>
                                                <option value="net60">Net 60 Days</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-line bg-app">
                                <button
                                    onClick={() => setShowSettingsDrawer(false)}
                                    className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-ink rounded-xl font-bold text-sm hover:opacity-90 transition-all"
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
                initialName={supplierSearch}
                editingParty={editingParty}
                onSuccess={(newParty) => {
                    patchPurchase({ supplier: newParty });
                    setSupplierSearch('');
                    setEditingParty(null);
                }}
            />
            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                mode={productModalMode}
                product={editingProduct}
                initialName={productModalMode === 'create' ? (showQuickEntry ? quickEntry.name : (activeItemIndex !== null ? currentPurchase.items[activeItemIndex]?.name : '')) : ''}
                categories={categories}
                warehouses={warehouses}
                onSubmit={handleProductSubmit}
            />
            {/* OVERPAYMENT MODAL-Removed for Purchase Orders */}
            {/* {
                showOverpaymentModal && (
                    ...
                )
            } */}
        </OneGlanceLayout >
    );
};

export default CreatePurchaseOrder;
