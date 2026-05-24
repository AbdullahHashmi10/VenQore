import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { formatCurrency, formatNumber, getCurrencySymbol } from '@/Utils/format';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    ScanBarcode,
    MinusCircle,
    PlusCircle,
    Trash,
    Trash2,
    ShoppingCart,
    Receipt,
    Printer,
    Package,
    Plus,
    X,
    Search,
    User,
    Check,
    Pause,
    Clock,
    Archive,
    CreditCard,
    Wifi,
    WifiOff,
    RefreshCcw,
    Database,
    Warehouse
} from 'lucide-react';
import axios from 'axios';
import { useWorkspace } from '@/Contexts/WorkspaceContext';
import { useOfflineSync } from '@/Hooks/useOfflineSync';
import PrintService from '@/Utils/PrintService';
import { getProductPrice, shouldStopNegativeStock } from '@/Utils/settings';

import Toast from '@/Components/Toast';
import AlertModal from '@/Components/AlertModal';
import ConfirmModal from '@/Components/ConfirmModal';
import InputModal from '@/Components/InputModal';
import PaymentModal from '@/Components/Pos/PaymentModal';

import FormModal from '@/Components/FormModal';
import QuickPartyModal from '@/Components/QuickPartyModal';
import ProductModal from '@/Components/ProductModal';
import { UserPlus, PackagePlus, AlertCircle } from 'lucide-react'; // Icons for buttons
import SmartCombobox from '@/Components/SmartCombobox';
import AsyncProductCombobox from '@/Components/AsyncProductCombobox';
import AsyncPartyCombobox from '@/Components/AsyncPartyCombobox';

const POSInterface = ({ settings, recalledSale, bankAccounts = [], warehouses = [] }) => {
    const { auth, store } = usePage().props;
    const {
        posSessions,
        currentPosId,
        setCurrentPosId,
        addPosSession,
        updatePosSession,
        removePosSession
    } = useWorkspace();
    // [VOT] UI State & Standard Hooks
    const [toasts, setToasts] = useState([]);
    const [alertState, setAlertState] = useState({ show: false, title: '', message: '', type: 'info' });
    const [confirmState, setConfirmState] = useState({ show: false, title: '', message: '', onConfirm: () => { } });
    const [inputState, setInputState] = useState({ show: false, title: '', placeholder: '', onSubmit: () => { } });
    
    // UI Helpers
    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };
    const showAlert = (title, message, type = 'error') => setAlertState({ show: true, title, message, type });
    const showConfirm = (title, message, onConfirm, isDangerous = false) => setConfirmState({ show: true, title, message, onConfirm, isDangerous });
    const showInput = (title, placeholder, onSubmit) => setInputState({ show: true, title, placeholder, onSubmit });

    // Core POS State
    const [sales, setSales] = useState(() => {
        return posSessions.length > 0 ? posSessions : [{ id: Date.now(), type: 'pos', cart: [], cashReceived: '', searchTerm: '', customer: null, discountType: 'fixed', discountValue: 0 }];
    });
    const [activeSaleId, setActiveSaleId] = useState(() => {
        return currentPosId || sales[0].id;
    });

    const activeSale = sales.find(s => s.id === activeSaleId) || sales[0];

    const updateActiveSale = (updates) => {
        setSales(prev => prev.map(sale =>
            sale.id === activeSaleId ? { ...sale, ...updates } : sale
        ));
        updatePosSession(activeSaleId, updates);
    };

    // Handle Recalled Sale (from Edit button)
    useEffect(() => {
        if (recalledSale) {
            const mappedCart = recalledSale.items.map(item => ({
                cartItemId: `${item.product_id}-${item.product_variant_id || ''}`,
                id: item.product_id,
                variant_id: item.product_variant_id,
                name: item.product.name + (item.product_variant ? ` (${item.product_variant.sku})` : ''),
                price: parseFloat(item.unit_price),
                original_price: parseFloat(item.unit_price), // Price might have changed, but recalling uses sold price
                discount: 0, // Discount extraction depends on schema, assuming net price for now
                qty: parseFloat(item.quantity),
                freeQuantity: parseFloat(item.free_quantity || 0),
                stock: 9999, // Warning: Stock might be inaccurate without fetch, but we let it pass for edits
                image: item.product.image_path,
                category: item.product.category?.name || 'General'
            }));

            const saleSession = {
                id: `RECALL-${recalledSale.id}`,
                type: 'pos',
                cart: mappedCart,
                cashReceived: '',
                searchTerm: '',
                customer: recalledSale.customer ? {
                    id: recalledSale.customer.id,
                    name: recalledSale.customer.name,
                    phone: recalledSale.customer.phone
                } : null,
                is_recall: true, // Flag to indicate editing
                original_sale_id: recalledSale.id
            };

            addPosSession(saleSession);
            addToast(`Recalled Sale #${recalledSale.reference_number}`, 'info');
        }
    }, [recalledSale]);

    // State
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [variantModalOpen, setVariantModalOpen] = useState(false);
    const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [lastSale, setLastSale] = useState(null); // For receipt
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

    // Feature State
    const [lastAddedItemId, setLastAddedItemId] = useState(null); // For "Type number to qty" feature
    const [showOverpaymentModal, setShowOverpaymentModal] = useState(false);
    const [overpaymentDetails, setOverpaymentDetails] = useState({ amount: 0, customerName: '' });
    const [pendingPaymentData, setPendingPaymentData] = useState(null);
    const [showQuickPartyModal, setShowQuickPartyModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [searchQueryForProduct, setSearchQueryForProduct] = useState('');

    // Warehouse State
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(() => {
        const def = warehouses.find(w => w.is_default) || warehouses[0];
        return def?.id || null;
    });

    // Parked Sales State
    const [parkedSales, setParkedSales] = useState([]);
    const [parkedDropdownOpen, setParkedDropdownOpen] = useState(false);

    const [parkingBill, setParkingBill] = useState(false);

    // Customer Search State
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [initialCustomers, setInitialCustomers] = useState([]);
    const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);

    // Payment Method State (Default: CASH)
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [selectedBankAccountId, setSelectedBankAccountId] = useState(bankAccounts.length > 0 ? bankAccounts[0].id : null);
    const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
    const [showQuickAccountModal, setShowQuickAccountModal] = useState(false);
    const [creatingAccount, setCreatingAccount] = useState(false);

    // Print Settings State
    const [printOnComplete, setPrintOnComplete] = useState(() => {
        const saved = localStorage.getItem('pos_print_on_complete');
        return saved ? JSON.parse(saved) : true; // Default: print enabled
    });

    // Senior Mode State (default: ON)
    const [seniorMode, setSeniorMode] = useState(true);


    // Item Discount Modal State
    const [itemDiscountModal, setItemDiscountModal] = useState({ show: false, item: null, discType: 'fixed', discValue: '' });

    // Converter Modal State (Price / Qty / Total)
    const [converterModal, setConverterModal] = useState({ show: false, item: null, mode: 'price', price: '', qty: '', total: '' });

    // Open Item Discount Modal
    const openItemDiscountModal = (item) => {
        const currentOriginal = item.original_price || item.price;
        setItemDiscountModal({ show: true, item, discType: 'fixed', discValue: item.discount > 0 ? String(item.discount) : '', originalPrice: currentOriginal });
    };

    // Global Sync Listener
    useEffect(() => {
        const handleSync = () => {
            // 1. Refresh global props for the product grid
            router.reload({ 
                only: ['products', 'categories'], 
                preserveState: true, 
                preserveScroll: true 
            });

            // 2. Refresh active cart items
            refreshCartItems();
        };

        window.addEventListener('amd:product-updated', handleSync);
        window.addEventListener('storage', (e) => {
            if (e.key === 'amd_product_latest_change') handleSync();
        });

        return () => {
            window.removeEventListener('amd:product-updated', handleSync);
        };
    }, [activeSale?.cart]);

    const refreshCartItems = async () => {
        if (!activeSale?.cart?.length) return;
        const productsToRefresh = activeSale.cart.map(i => i.id);
        
        try {
            const response = await axios.get(route('store.inventory.search', { store_slug: store?.slug }), { 
                params: { ids: productsToRefresh } 
            });
            const latestProducts = response.data || [];
            
            const newCart = activeSale.cart.map(item => {
                const latest = latestProducts.find(p => p.id === item.id);
                if (latest) {
                    // PROTECT: If this is a recalled sale (historical), keep current prices
                    const shouldUpdatePrice = !activeSale.is_recall;
                    const newPrice = shouldUpdatePrice ? parseFloat(latest.price || latest.selling_price || 0) : (item.original_price || item.price);
                    
                    return {
                        ...item,
                        price: (shouldUpdatePrice && item.discount > 0) ? newPrice - item.discount : (shouldUpdatePrice ? newPrice : item.price),
                        original_price: shouldUpdatePrice ? newPrice : (item.original_price || item.price),
                        stock: parseFloat(latest.stock_quantity || latest.stock || 0)
                    };
                }
                return item;
            });
            updateActiveSale({ cart: newCart });
        } catch (error) {
            console.error("Failed to refresh cart items", error);
        }
    };

    // Apply Item Discount
    const applyItemDiscount = () => {
        const { item, discType, discValue, originalPrice } = itemDiscountModal;
        const val = parseFloat(discValue);
        if (isNaN(val) || val < 0) { addToast('Enter a valid discount', 'error'); return; }
        const discountAmount = discType === 'percentage' ? (originalPrice * val) / 100 : val;
        if (discountAmount > originalPrice) { addToast('Discount cannot exceed item price', 'error'); return; }
        const newCart = activeSale.cart.map(i =>
            i.cartItemId === item.cartItemId ? { ...i, price: originalPrice - discountAmount, discount: discountAmount, original_price: originalPrice } : i
        );
        updateActiveSale({ cart: newCart });
        setItemDiscountModal({ show: false, item: null, discType: 'fixed', discValue: '' });
        addToast(`Discount of ${discType === 'percentage' ? val + '%' : formatCurrency(val, store || settings)} applied`, 'success');
    };

    // Open Converter Modal
    const openConverterModal = (item) => {
        const price = item.original_price || item.price;
        setConverterModal({ show: true, item, mode: 'price', price: String(price), qty: String(item.qty), total: String(price * item.qty) });
    };

    // Handle Converter field changes
    const handleConverterChange = (field, rawValue) => {
        setConverterModal(prev => {
            const val = parseFloat(rawValue) || 0;
            let next = { ...prev, [field]: rawValue };
            if (field === 'total') {
                if (prev.mode === 'price') {
                    const qty = parseFloat(prev.qty) || 1;
                    next.price = qty > 0 ? String(+(val / qty).toFixed(4)) : prev.price;
                } else {
                    const price = parseFloat(prev.price) || 0;
                    next.qty = price > 0 ? String(+(val / price).toFixed(4)) : prev.qty;
                }
            } else if (field === 'price') {
                const qty = parseFloat(prev.qty) || 1;
                next.total = String(+(val * qty).toFixed(2));
            } else if (field === 'qty') {
                const price = parseFloat(prev.price) || 0;
                next.total = String(+(val * price).toFixed(2));
            }
            return next;
        });
    };

    // Apply Converter Changes
    const applyConverter = () => {
        const { item, price, qty } = converterModal;
        const newPrice = parseFloat(price);
        const newQty = parseFloat(qty);
        if (isNaN(newPrice) || newPrice < 0 || isNaN(newQty) || newQty <= 0) { addToast('Invalid values', 'error'); return; }
        // Stock check
        const allowNegative = !shouldStopNegativeStock(settings);
        if (newQty > item.stock && !item.has_manufacturing_rule && !allowNegative) { addToast('Not enough stock!', 'error'); return; }
        const newCart = activeSale.cart.map(i =>
            i.cartItemId === item.cartItemId ? { ...i, price: newPrice, original_price: newPrice, qty: newQty, discount: 0 } : i
        );
        updateActiveSale({ cart: newCart });
        setConverterModal({ show: false, item: null, mode: 'price', price: '', qty: '', total: '' });
        addToast('Item updated', 'success');
    };


    // Offline Sync Configuration
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [offlineSales, setOfflineSales] = useState([]);
    const [showSyncHub, setShowSyncHub] = useState(false);

    const {
        isSyncing,
        pendingCount,
        lastSyncTime,
        saveOfflineSale,
        syncPendingSales,
        getPendingSales,
        deletePendingSale
    } = useOfflineSync();

    useEffect(() => {
        const handleStatusChange = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);

        // Listen for CSRF mismatch events from bootstrap.js
        const handleCsrfMismatch = () => {
             addToast('Security token refreshed. Please try saving again.', 'warning');
        };
        window.addEventListener('amd:csrf-mismatch', handleCsrfMismatch);

        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
            window.removeEventListener('amd:csrf-mismatch', handleCsrfMismatch);
        };
    }, []);


    const handleRecallOfflineSale = async (offlineSale) => {
        try {
            const newId = Math.max(...sales.map(s => s.id), 1000) + 1;
            setSales(prev => [...prev, {
                id: newId,
                cart: offlineSale.data.cart || [],
                cashReceived: '',
                searchTerm: '',
                customer: offlineSale.data.party_id ? { id: offlineSale.data.party_id, name: offlineSale.data.customer_name || 'Walk-in' } : null,
                isFromOffline: true
            }]);
            setActiveSaleId(newId);
            await deletePendingSale(offlineSale.id);
            setOfflineSales(prev => prev.filter(s => s.id !== offlineSale.id));
            setShowSyncHub(false);
            addToast('Offline sale loaded back to cart', 'success');
        } catch (error) {
            console.error("Error recalling offline sale:", error);
            addToast('Failed to recall offline sale', 'error');
        }
    };

    const loadOfflineSales = async () => {
        const sales = await getPendingSales();
        setOfflineSales(sales);
    };

    const searchInputRef = useRef(null);
    const parkedDropdownRef = useRef(null);
    const customerDropdownRef = useRef(null);

    // Sync local sales to context
    useEffect(() => {
        sales.forEach(sale => {
            const existing = posSessions.find(s => s.id === sale.id);
            if (existing) {
                updatePosSession(sale.id, sale);
            } else {
                // This might happen if a new sale is created locally
            }
        });
    }, [sales]);

    useEffect(() => {
        if (currentPosId && currentPosId !== activeSaleId) {
            setActiveSaleId(currentPosId);
        }
    }, [currentPosId]);

    // Persist print settings
    useEffect(() => {
        localStorage.setItem('pos_print_on_complete', JSON.stringify(printOnComplete));
    }, [printOnComplete]);

    // Persist Senior Mode (session storage, resets on logout)
    useEffect(() => {
        sessionStorage.setItem('pos_senior_mode', JSON.stringify(seniorMode));
    }, [seniorMode]);

    // Category filter state  
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    // Customer search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (customerSearchTerm.length >= 2) {
                searchCustomers(customerSearchTerm);
            } else {
                setCustomerResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [customerSearchTerm]);


    // --- CART RESCUE (CRASH AIRBAG) ---
    // 1. Recover on Mount
    useEffect(() => {
        const savedCart = localStorage.getItem('pos_cart');
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                if (Array.isArray(parsedCart) && parsedCart.length > 0) {
                    // Only restore if current cart is empty to avoid overwriting or conflicts
                    // We assume the first active sale is the one to target on reload
                    if (activeSale && activeSale.cart && activeSale.cart.length === 0) {
                        updateActiveSale({ cart: parsedCart });
                        addToast('🛒 Cart Rescue activated! Previous items restored.', 'success');
                    }
                }
            } catch (e) {
                console.error("Cart Rescue parse failed", e);
            }
        }
    }, []); // Run once on mount

    // 2. Save on Change
    useEffect(() => {
        // We only save the ACTIVE cart. 
        if (activeSale && activeSale.cart) {
            // Optimization: Only save if there are items, OR if we want to save empty state (to clear it)
            // User requested "On Add Item", implying mainly when not empty.
            if (activeSale.cart.length > 0) {
                localStorage.setItem('pos_cart', JSON.stringify(activeSale.cart));
            } else {
                // If cart is empty, we should probably clear the rescue storage so we don't restore old junk later?
                // The user logic was "On Checkout Success: remove". 
                // But if I delete items manually to 0, I probably want that persisted too?
                // For safety, let's just save whatever is there, even empty (which is valid state).
                // Actually, if we save empty [], then on reload it won't trigger restoration (length > 0 check).
                // But we don't want to overwrite a valid rescue with empty array if the user just cleared...
                // Let's stick to user request: "every time an item is added". 
                // Saving the array is safest.
                localStorage.setItem('pos_cart', JSON.stringify(activeSale.cart));
            }
        }
    }, [activeSale?.cart]);

    const createNewSale = () => {
        const newSession = addPosSession({ discountType: 'fixed', discountValue: 0 });
        setSales(prev => [...prev, newSession]);
        setActiveSaleId(newSession.id);
    };

    const closeSale = async (e, id) => {
        e.stopPropagation();
        if (sales.length === 1) {
            const s = sales.find(s => s.id === id);
            if (s && s.cart.length > 0) {
                const confirmed = await window.confirm("Closing this last tab will discard current items and exit. Continue?");
                if (!confirmed) return;
            }
            // Remove session and navigate away
            removePosSession(id);
            // PROBLEM 3 FIX: Return to dashboard (role-appropriate) instead of sales index
            router.visit(route('store.dashboard', { store_slug: store?.slug }));
            return;
        }

        const newSales = sales.filter(s => s.id !== id);
        setSales(newSales);
        removePosSession(id);
        if (activeSaleId === id) {
            setActiveSaleId(newSales[newSales.length - 1].id);
        }
    };

    // Search Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeSale.searchTerm.length >= 2) {
                performSearch(activeSale.searchTerm);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [activeSale.searchTerm]);

    const performSearch = async (query) => {
        setIsSearching(true);
        try {
            const response = await axios.get(route('store.pos.search', { store_slug: store?.slug }), { params: { q: query } });
            setSearchResults(response.data.data || response.data || []);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleProductSelect = (product) => {
        if ((product.available_stock ?? product.stock_quantity ?? 0) <= 0 && (!product.has_manufacturing_rule)) {
            if (!window.confirm(`Warning: ${product.reserved_quantity || 0} units are reserved for pre-orders. Available: ${product.available_stock || 0}. Selling this will put reservations into backorder. Continue?`)) {
                updateActiveSale({ searchTerm: '' });
                setSearchResults([]);
                if (searchInputRef.current) searchInputRef.current.focus();
                return;
            }
        }

        if (product.variants && product.variants.length > 0) {
            setSelectedProductForVariant(product);
            setVariantModalOpen(true);
        } else {
            addToCart(product);
        }
        updateActiveSale({ searchTerm: '' });
        setSearchResults([]);
        if (searchInputRef.current) searchInputRef.current.focus();
    };

    const addToCart = (product, variant = null) => {
        const currentCart = activeSale.cart;
        // Unique ID for cart item (product_id + variant_id)
        const cartItemId = variant ? `${product.id}-${variant.id}` : `${product.id}`;

        const existing = currentCart.find(item => item.cartItemId === cartItemId);
        let newCart;

        const price = variant ? getProductPrice(variant, 1, settings) : getProductPrice(product, 1, settings);
        const name = variant ? `${product.name} (${variant.sku})` : product.name;
        const stock = variant ? variant.stock_quantity : product.stock_quantity;

        if (existing) {
            const newQty = existing.qty + 1;

            // Stock Validation Logic
            // BYPASS: Products with manufacturing rules can always be sold (auto-manufactured on-the-fly)
            const canAutoManufacture = product.has_manufacturing_rule === true;

            if (newQty > stock && !canAutoManufacture) {
                // If setting is undefined, null, or '1' -> BLOCK
                // Only if setting is explicitly '0' or false -> ALLOW
                const allowNegative = !shouldStopNegativeStock(settings);

                if (!allowNegative) {
                    alert('Not enough stock! Action blocked.');
                    return;
                } else {
                    // Allowed but warn
                    addToast(`Warning: ${name} stock will be negative!`, 'warning');
                }
            } else if (newQty > stock && canAutoManufacture) {
                // Product has manufacturing rule - will be auto-manufactured
                addToast(`🏭 ${name} will be auto-manufactured`, 'info');
            }
            newCart = currentCart.map(item => item.cartItemId === cartItemId ? { ...item, qty: newQty } : item);
        } else {
            // Stock Validation Logic
            // BYPASS: Products with manufacturing rules can always be sold (auto-manufactured on-the-fly)
            const canAutoManufacture = product.has_manufacturing_rule === true;

            if (stock < 1 && !canAutoManufacture) {
                // If setting is undefined, null, or '1' -> BLOCK
                // Only if setting is explicitly '0' or false -> ALLOW
                const allowNegative = !shouldStopNegativeStock(settings);

                if (!allowNegative) {
                    alert('Out of stock! Action blocked.');
                    return;
                } else {
                    // Allowed but warn
                    addToast(`Warning: ${name} stock is out (Qty: ${stock})!`, 'warning');
                }
            } else if (stock < 1 && canAutoManufacture) {
                // Product has manufacturing rule - will be auto-manufactured
                addToast(`🏭 ${name} will be auto-manufactured from ingredients`, 'info');
            }
            newCart = [...currentCart, {
                cartItemId,
                id: product.id,
                variant_id: variant ? variant.id : null,
                name,
                price,
                original_price: price,
                discount: 0,
                qty: 1,
                freeQuantity: 0,
                stock: stock,
                has_manufacturing_rule: product.has_manufacturing_rule || false, // Store for updateQty checks
                image: product.image_url || product.image_path || null, // Robust image path mapping
                category: product.category?.name || 'General',
                wholesale_price: product.wholesale_price,
                wholesale_min_quantity: product.wholesale_min_quantity
            }];
        }
        updateActiveSale({ cart: newCart });
        setLastAddedItemId(cartItemId);
        setVariantModalOpen(false);
        setSelectedProductForVariant(null);
    };

    const handleSearchInputKeyDown = async (e) => {
        if (e.key !== 'Enter') return;

        const val = activeSale.searchTerm.trim();
        if (!val) return;

        // Check for Quantity Shortcut (Number only, and shorter than typical barcode)
        // Safety: If it's a number, we check if it's a product. If not, we treat as Qty.
        // If it IS a product (e.g. barcode "6"), we add the product.

        setIsSearching(true);
        try {
            // Check for exact match first
            const response = await axios.get(route('store.inventory.search', { store_slug: store?.slug }), { params: { query: val } });
            const results = response.data;

            // Should we prioritize Exact Match?
            const exactMatch = results.find(p => p.sku === val || p.barcode === val);

            if (exactMatch) {
                handleProductSelect(exactMatch);
            } else if (results.length === 1) {
                // Formatting loose match
                handleProductSelect(results[0]);
            } else if (results.length === 0 && /^\d+$/.test(val) && lastAddedItemId) {
                // NO PRODUCT FOUND, INPUT IS NUMERIC, HAS LAST ITEM
                // Treat as Quantity Update
                const qty = parseInt(val);
                if (qty > 0) {
                    const newCart = activeSale.cart.map(item =>
                        item.cartItemId === lastAddedItemId ? { ...item, qty: qty } : item
                    );
                    updateActiveSale({ cart: newCart, searchTerm: '' });
                    addToast(`Updated quantity to ${qty}`, 'success');
                }
            } else {
                // Ambiguous or no results
                if (results.length > 0) {
                    setSearchResults(results);
                } else {
                    addToast('No product found', 'warning');
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const removeFromCart = (cartItemId) => {
        const newCart = activeSale.cart.filter(item => item.cartItemId !== cartItemId);
        updateActiveSale({ cart: newCart });
    };

    const updateQty = (cartItemId, delta) => {
        const newCart = activeSale.cart.map(item => {
            if (item.cartItemId === cartItemId) {
                const newQty = Math.max(1, item.qty + delta);

                // Stock Check
                // BYPASS: Products with manufacturing rules can always be sold
                const canAutoManufacture = item.has_manufacturing_rule === true;

                if (newQty > item.stock && !canAutoManufacture) {
                    // If setting is undefined, null, or '1' -> BLOCK
                    // Only if setting is explicitly '0' or false -> ALLOW
                    const allowNegative = !shouldStopNegativeStock(settings);

                    if (!allowNegative) {
                        alert('Not enough stock! Action blocked.');
                        return item; // Do not update
                    } else {
                        // Only warn if increasing quantity
                        if (delta > 0) {
                            addToast(`Warning: Selling ${item.name} beyond stock!`, 'warning');
                        }
                    }
                    addToast(`🏭 ${item.name} will be auto-manufactured`, 'info');
                }

                // Recalculate Price based on Quantity (Wholesale Logic)
                const newPrice = getProductPrice(item, newQty, settings);

                return { ...item, qty: newQty, price: newPrice };
            }
            return item;
        });
        updateActiveSale({ cart: newCart });
    };

    const updateFreeQty = (cartItemId, delta) => {
        const newCart = activeSale.cart.map(item => {
            if (item.cartItemId === cartItemId) {
                const newQty = Math.max(0, (item.freeQuantity || 0) + delta);
                return { ...item, freeQuantity: newQty };
            }
            return item;
        });
        updateActiveSale({ cart: newCart });
    };

    // Calculations
    // Calculations
    const taxRate = parseFloat(settings?.default_tax_rate || 0);

    // Subtotal includes free items (gross sales value)
    const subtotal = activeSale.cart.reduce((acc, item) => acc + ((item.key_price || item.price) * (item.qty + (item.freeQuantity || 0))), 0);

    // Calculate discounts
    const freeItemDiscounts = activeSale.cart.reduce((acc, item) => acc + ((item.freeQuantity || 0) * (item.key_price || item.price)), 0);
    const itemDiscounts = activeSale.cart.reduce((acc, item) => acc + (item.discount || 0), 0);

    // Global Discount Calculation
    let globalDiscount = 0;
    if (activeSale.discountType === 'percentage') {
        globalDiscount = (subtotal * (activeSale.discountValue || 0)) / 100;
    } else {
        globalDiscount = parseFloat(activeSale.discountValue !== undefined ? activeSale.discountValue : (activeSale.discount || 0));
    }

    const totalDiscounts = freeItemDiscounts + itemDiscounts + globalDiscount;

    const taxableAmount = Math.max(0, subtotal - totalDiscounts);
    const taxAmount = (taxableAmount * taxRate) / 100;
    const cartTotal = taxableAmount + taxAmount;

    const changeDue = activeSale.cashReceived ? parseFloat(activeSale.cashReceived) - cartTotal : 0;

    const handleCheckoutClick = () => {
        if (activeSale.cart.length === 0) return;

        // Auto-complete if amount is already tendered
        const tendered = parseFloat(activeSale.cashReceived || 0);

        // If amount is sufficient, skip the popup
        if (tendered > 0 && tendered >= cartTotal) {
            const paymentData = {
                totalPaid: tendered,
                change: tendered - cartTotal,
                payments: [{
                    method: paymentMethod || 'cash',
                    amount: tendered,
                    account_id: ['bank', 'card', 'online'].includes(paymentMethod) ? selectedBankAccountId : null
                }],
                notes: '',
                printReceipt: printOnComplete
            };

            handlePaymentComplete(paymentData);
            return;
        }

        setPaymentModalOpen(true);
    };

    const handlePaymentComplete = (paymentData) => {
        setPaymentModalOpen(false);
        const paid = paymentData.totalPaid;
        const total = cartTotal;
        const excess = paid - total;

        if (excess > 0 && activeSale.customer && activeSale.customer.id) {
            setOverpaymentDetails({ amount: excess, customerName: activeSale.customer.name });
            setPendingPaymentData(paymentData);
            setShowOverpaymentModal(true);
            return;
        }

        processCheckout(paymentData, false);
    };

    const processCheckout = async (paymentData, addToLedger = false) => {
        setProcessingPayment(true);

        const payload = {
            items: activeSale.cart.map(item => ({
                product_id: item.id,
                variant_id: item.variant_id,
                quantity: item.qty,
                free_quantity: item.freeQuantity || 0,
                price: item.price
            })),
            customer_id: activeSale.customer?.id || null,
            payment_method: 'split',
            warehouse_id: selectedWarehouseId,
            payments: paymentData.payments,
            amount_paid: paymentData.totalPaid,
            tax: taxAmount,
            discount: globalDiscount,
            notes: paymentData.notes,
            add_to_ledger: addToLedger, // PASSED FLAG
            source: 'pos',
            is_dropship: false,
        };

        try {
            let responseData;

            if (isOnline) {
                const response = await axios.post(route('store.sales.store', { store_slug: store?.slug }), payload);
                responseData = response.data;
            } else {
                throw new Error("Offline");
            }

            if (responseData.success) {
                finalizeSale(responseData, paymentData);
            }
        } catch (error) {
            console.log("Online checkout failed, trying offline...", error);

            // Save to offline queue
            const offlineSaved = await saveOfflineSale(payload);

            if (offlineSaved) {
                const offlineResponse = {
                    success: true,
                    reference: 'OFFLINE-' + Date.now(),
                    created_at: new Date().toISOString(),
                    is_offline: true
                };
                finalizeSale(offlineResponse, paymentData);
            } else {
                showAlert('Checkout Failed', 'Could not save sale offline. Please check device storage.', 'error');
            }
        } finally {
            setProcessingPayment(false);
            setShowOverpaymentModal(false); // Close overpayment modal if open
        }
    };

    const finalizeSale = (data, paymentData) => {
        setLastSale({
            ...data,
            cart: activeSale.cart,
            total: cartTotal,
            cash: paymentData.totalPaid,
            change: paymentData.change
        });

        // Clear Cart Rescue
        localStorage.removeItem('pos_cart');

        // Clear current sale
        updateActiveSale({ cart: [], cashReceived: '', searchTerm: '', customer: null });

        // Auto-print if enabled
        if (paymentData.printReceipt) {
            // Build sale object for printing
            const saleForPrint = {
                ...data,
                items: activeSale.cart,
                total: cartTotal,
                amount_paid: paymentData.totalPaid,
                change: paymentData.change,
                customer: activeSale.customer,
                tax: taxAmount
            };
            // Use configured default print type (thermal or regular)
            const printType = settings?.default_print_type || 'thermal';
            setTimeout(() => PrintService.quickPrint(saleForPrint, printType), 500);
        }

        // Show notifications
        let message = 'Reference: ' + data.reference;
        if (data.is_offline) {
            message += '\n\n⚠️ Saved Offline. Will sync when online.';
            addToast('Sale saved offline', 'warning');
        } else {
            if (data.manufacturing_notifications && data.manufacturing_notifications.length > 0) {
                message += '\n\n📦 Auto-Manufacturing:\n' + data.manufacturing_notifications.join('\n');
            }
            showAlert('Sale Completed!', message, 'success');

            // Auto-close after 3 seconds to speed up workflow
            setTimeout(() => {
                setAlertState(prev => {
                    // Only auto-close if the specific success modal is still open
                    if (prev.show && prev.title === 'Sale Completed!') {
                        return { ...prev, show: false };
                    }
                    return prev;
                });
                if (searchInputRef.current) searchInputRef.current.focus();
            }, 3000);
        }
    };

    // Customer search function
    const searchCustomers = async (query) => {
        try {
            const response = await axios.get(route('store.customers.search', { store_slug: store?.slug }), {
                params: { search: query }
            });
            setCustomerResults(response.data || []);
        } catch (error) {
            console.error("Customer search error:", error);
            setCustomerResults([]);
        }
    };

    // Select customer
    const selectCustomer = (customer) => {
        let updates = { customer };

        // Apply default discount if available
        if (customer.default_discount && parseFloat(customer.default_discount) > 0) {
            updates.discountType = 'percentage';
            updates.discountValue = parseFloat(customer.default_discount);
            addToast(`Applied ${customer.default_discount}% Customer Discount`, 'success');
        } else {
            // Reset if no discount (optional, but cleaner)
            updates.discountType = 'fixed';
            updates.discountValue = 0;
        }

        updateActiveSale(updates);
        setCustomerSearchTerm('');
        setCustomerResults([]);
        setCustomerDropdownOpen(false);
    };

    // Load initial customers for suggestions
    useEffect(() => {
        const loadInitialCustomers = async () => {
            try {
                const response = await axios.get(route('store.customers.search', { store_slug: store?.slug }), { params: { search: '' } });
                setInitialCustomers((response.data || []).slice(0, 50));
            } catch (error) {
                console.error('Failed to load initial customers:', error);
            }
        };
        loadInitialCustomers();
    }, []);

    // Print receipt function
    const printReceipt = (type = null) => {
        const printType = type || settings?.default_print_type || 'thermal';
        if (lastSale) {
            PrintService.quickPrint(lastSale, printType);
        } else {
            addToast('No recent sale to print!', 'warning');
        }
    };

    // Keyboard shortcuts Engine (Option B)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check if user is typing in a modal or input (except search)
            const isInput = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
            const isSearchInput = e.target === searchInputRef.current;

            // Global Shortcuts (Always active)
            if (e.key === 'F1') {
                e.preventDefault();
                searchInputRef.current?.focus();
                return;
            }

            // NAVIGATION
            if (e.key === 'F11') {
                e.preventDefault();
                setCustomerDropdownOpen(true);
                // We'll need a way to focus the customer search input once it's open
                return;
            }

            if (e.ctrlKey && e.key.toLowerCase() === 't') {
                e.preventDefault();
                createNewSale();
                return;
            }

            if (e.ctrlKey && e.key.toLowerCase() === 'w') {
                e.preventDefault();
                closeSale(e, activeSaleId);
                return;
            }

            if (e.ctrlKey && e.key === 'Tab') {
                e.preventDefault();
                const currentIndex = sales.findIndex(s => s.id === activeSaleId);
                let nextIndex;
                if (e.shiftKey) { // CTRL + SHIFT + TAB
                    nextIndex = (currentIndex - 1 + sales.length) % sales.length;
                } else { // CTRL + TAB
                    nextIndex = (currentIndex + 1) % sales.length;
                }
                setActiveSaleId(sales[nextIndex].id);
                return;
            }

            // ITEM ACTIONS (Target lastAddedItemId or last item in cart)
            const targetItem = activeSale.cart.find(i => i.cartItemId === lastAddedItemId) || activeSale.cart[activeSale.cart.length - 1];

            if (targetItem) {
                if (e.key === 'F2') {
                    e.preventDefault();
                    showInput(`Qty: ${targetItem.name}`, 'Enter new quantity', (val) => {
                        const qty = parseFloat(val);
                        if (!isNaN(qty) && qty > 0) {
                            const newCart = activeSale.cart.map(i =>
                                i.cartItemId === targetItem.cartItemId ? { ...i, qty: qty } : i
                            );
                            updateActiveSale({ cart: newCart });
                            addToast(`Quantity updated to ${qty}`, 'success');
                        }
                    });
                }

                if (e.key === 'F3') {
                    e.preventDefault();
                    const currentOriginal = targetItem.original_price || targetItem.price;
                    showInput(`Discount: ${targetItem.name}`, `Enter discount amount (Max: ${currentOriginal})`, (val) => {
                        const discountAmount = parseFloat(val);
                        if (!isNaN(discountAmount) && discountAmount >= 0 && discountAmount <= currentOriginal) {
                            const newCart = activeSale.cart.map(i =>
                                i.cartItemId === targetItem.cartItemId ? {
                                    ...i,
                                    price: currentOriginal - discountAmount,
                                    discount: discountAmount,
                                    original_price: currentOriginal
                                } : i
                            );
                            updateActiveSale({ cart: newCart });
                        }
                    });
                }

                if (e.key === 'F4') {
                    e.preventDefault();
                    removeFromCart(targetItem.cartItemId);
                    addToast(`Removed ${targetItem.name}`, 'info');
                }

                if (e.key === 'F5') {
                    e.preventDefault();
                    showInput(`Price: ${targetItem.name}`, 'Enter new unit price', (val) => {
                        const newPrice = parseFloat(val);
                        if (!isNaN(newPrice) && newPrice >= 0) {
                            const newCart = activeSale.cart.map(i =>
                                i.cartItemId === targetItem.cartItemId ? { ...i, price: newPrice, original_price: newPrice, discount: 0 } : i
                            );
                            updateActiveSale({ cart: newCart });
                        }
                    });
                }

                if (e.key === 'F6') {
                    e.preventDefault();
                    addToast('Change Unit feature coming soon!', 'info');
                }
            }

            // TRANSACTION ACTIONS
            if (e.key === 'F7') {
                e.preventDefault();
                showInput('Override Tax (%)', 'Enter tax percentage', (val) => {
                    const rate = parseFloat(val);
                    if (!isNaN(rate)) {
                        updateActiveSale({ taxRate: rate });
                        addToast(`Tax rate set to ${rate}%`, 'success');
                    }
                });
            }

            if (e.key === 'F8') {
                e.preventDefault();
                showInput('Additional Charges', 'Enter charge amount', (val) => {
                    const charge = parseFloat(val); if (!isNaN(charge)) { updateActiveSale({ additionalCharges: charge }); addToast(`Additional charge of ${formatCurrency(charge, store || settings)} added`, 'success');
                    }
                });
            }

            if (e.key === 'F9') {
                e.preventDefault();
                showInput('Apply Bill Discount', 'Enter discount amount', (val) => {
                    const disc = parseFloat(val);
                    if (!isNaN(disc)) {
                        updateActiveSale({ discount: disc });
                        addToast(`Bill discount of ${formatCurrency(disc, store || settings)} applied`, 'success');
                    }
                });
            }

            if (e.key === 'F10') {
                e.preventDefault();
                addToast('Loyalty points system not configured.', 'warning');
            }

            if (e.key === 'F12') {
                e.preventDefault();
                showInput('Sale Remarks', 'Enter internal notes for this sale', (val) => {
                    updateActiveSale({ remarks: val });
                });
            }

            if (e.ctrlKey && e.key.toLowerCase() === 'r') {
                e.preventDefault();
                showConfirm('Reset Tab', 'This will clear all items and customer data. Continue?', () => {
                    updateActiveSale({ cart: [], customer: null, discount: 0, remarks: '', additionalCharges: 0, taxRate: null });
                    addToast('Tab reset successfully.', 'info');
                }, true);
            }

            if (e.ctrlKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                // Toggle a breakup view (using existing summary or dedicated modal)
                showAlert('Bill Breakup', `
                    Subtotal: ${formatCurrency(subtotal, store || settings)}
                    Discount: ${formatCurrency(totalDiscounts, store || settings)}
                    Taxable: ${formatCurrency(taxableAmount, store || settings)}
                    Tax: ${formatCurrency(taxAmount, store || settings)}
                    --------------------
                    Total: ${formatCurrency(cartTotal, store || settings)}
                `, 'info');
            }

            // SAVE ACTIONS
            if (e.ctrlKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                if (activeSale.cart.length > 0) {
                    // Quick Save (No print)
                    const paymentData = {
                        totalPaid: cartTotal,
                        change: 0,
                        payments: [{ method: paymentMethod || 'cash', amount: cartTotal }],
                        notes: activeSale.remarks || '',
                        printReceipt: false
                    };
                    processCheckout(paymentData, false);
                }
            }

            if (e.ctrlKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                if (activeSale.cart.length > 0) {
                    // Quick Save & Print
                    const paymentData = {
                        totalPaid: cartTotal,
                        change: 0,
                        payments: [{ method: paymentMethod || 'cash', amount: cartTotal }],
                        notes: activeSale.remarks || '',
                        printReceipt: true
                    };
                    processCheckout(paymentData, false);
                }
            }

            if (e.ctrlKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                if (activeSale.cart.length > 0) {
                    // Save and immediately create new tab
                    const paymentData = {
                        totalPaid: cartTotal,
                        change: 0,
                        payments: [{ method: paymentMethod || 'cash', amount: cartTotal }],
                        notes: activeSale.remarks || '',
                        printReceipt: printOnComplete
                    };
                    processCheckout(paymentData, false).then(() => createNewSale());
                }
            }

            // OTHER ACTIONS
            if (e.ctrlKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                setShowQuickPartyModal(true);
            }

            if (e.altKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                } else {
                    if (document.exitFullscreen) document.exitFullscreen();
                }
            }

            // Move to first/last row
            if (e.ctrlKey && e.key === '1') {
                e.preventDefault();
                if (activeSale.cart.length > 0) {
                    setLastAddedItemId(activeSale.cart[0].cartItemId);
                    addToast(`Selected ${activeSale.cart[0].name}`, 'info');
                }
            }
            if (e.ctrlKey && e.key === '9') {
                e.preventDefault();
                if (activeSale.cart.length > 0) {
                    const lastIdx = activeSale.cart.length - 1;
                    setLastAddedItemId(activeSale.cart[lastIdx].cartItemId);
                    addToast(`Selected ${activeSale.cart[lastIdx].name}`, 'info');
                }
            }

            // ESC: Clear search or escape modals
            if (e.key === 'Escape') {
                if (activeSale.searchTerm) {
                    updateActiveSale({ searchTerm: '' });
                } else {
                    setSearchResults([]);
                    setCustomerDropdownOpen(false);
                    setParkedDropdownOpen(false);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [activeSale, sales, lastSale, lastAddedItemId, paymentMethod]);

    // Load parked sales from backend
    const loadParkedSales = async () => {
        try {
            const response = await axios.get(route('store.sales.parked', { store_slug: store?.slug }));
            setParkedSales(response.data.parked_sales || []);
        } catch (error) {
            console.error("Error loading parked sales:", error);
        }
    };

    // Park (Hold) current bill
    const handleParkBill = async () => {
        if (activeSale.cart.length === 0) {
            showAlert('Empty Cart', 'Cart is empty! Nothing to park.', 'warning');
            return;
        }

        const processPark = async (customerName) => {
            setParkingBill(true);
            try {
                const response = await axios.post(route('store.sales.park', { store_slug: store?.slug }), {
                    cart_data: activeSale.cart,
                    customer_name: customerName || 'Walk-in Customer'
                });

                if (response.data.success) {
                    // Close the current tab
                    closeSale({ stopPropagation: () => { } }, activeSaleId);
                    // Reload parked sales list
                    await loadParkedSales();
                    addToast('Bill parked successfully!', 'success');
                }
            } catch (error) {
                console.error("Error parking bill:", error);
                addToast('Failed to park bill: ' + (error.response?.data?.message || error.message), 'error');
            } finally {
                setParkingBill(false);
            }
        };

        showInput('Park Bill', 'Enter customer name (optional):', processPark);
    };

    // Recall a parked sale
    const handleRecallSale = async (parkedSaleId) => {
        try {
            const response = await axios.get(route('store.sales.recall', { store_slug: store?.slug, id: parkedSaleId }));

            if (response.data.success) {
                const parkedData = response.data.parked_sale;

                // Create a new tab with the parked cart
                const newId = Math.max(...sales.map(s => s.id), 1000) + 1;
                setSales(prev => [...prev, {
                    id: newId,
                    cart: parkedData.cart_data,
                    cashReceived: '',
                    searchTerm: '',
                    customer: parkedData.customer_name ? { name: parkedData.customer_name } : null,
                    parkedSaleId: parkedData.id // Track which parked sale this is
                }]);
                setActiveSaleId(newId);

                // Close the dropdown
                setParkedDropdownOpen(false);

                addToast(`Loaded parked sale for ${parkedData.customer_name}`, 'success');
            }
        } catch (error) {
            if (error.response?.status === 410) {
                showAlert('Expired', 'This parked sale has expired!', 'error');
                loadParkedSales(); // Refresh the list
            } else {
                console.error("Error recalling sale:", error);
                addToast('Failed to recall sale: ' + (error.response?.data?.message || error.message), 'error');
            }
        }
    };

    // Delete a parked sale
    const handleDeleteParked = async (parkedSaleId, e) => {
        e.stopPropagation();

        showConfirm('Delete Parked Sale', 'Are you sure you want to delete this parked sale?', async () => {
            try {
                await axios.delete(route('store.sales.parked.delete', { store_slug: store?.slug, id: parkedSaleId }));
                await loadParkedSales();
                addToast('Parked sale deleted', 'success');
            } catch (error) {
                console.error("Error deleting parked sale:", error);
                addToast('Failed to delete: ' + (error.response?.data?.message || error.message), 'error');
            }
        }, true);
    };

    // Load categories
    const loadCategories = async () => {
        try {
            const response = await axios.get(route('store.pos.categories', { store_slug: store?.slug }));
            setCategories(response.data.data || response.data || []);
        } catch (error) {
            console.error("Error loading categories:", error);
            setCategories([]);
        }
    };

    // Load products by category (or featured if no category)
    const fetchCategoryProducts = async (catId) => {
        setIsLoadingProducts(true);
        try {
            let response;
            if (catId) {
                response = await axios.get(route('store.pos.search', { store_slug: store?.slug }), {
                    params: { category_id: catId, q: '' }
                });
            } else {
                response = await axios.get(route('store.pos.featured', { store_slug: store?.slug }));
            }
            setCategoryProducts(response.data.data || response.data || []);
        } catch (error) {
            console.error("Error loading category products:", error);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    // Load products when category changes (or on mount/reset)
    useEffect(() => {
        fetchCategoryProducts(selectedCategory);
    }, [selectedCategory]);

    // Load parked sales and categories on mount
    useEffect(() => {
        loadParkedSales();
        loadCategories();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (parkedDropdownRef.current && !parkedDropdownRef.current.contains(event.target)) {
                setParkedDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate time remaining for parked sales
    const getTimeRemaining = (expiresAt) => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diffMs = expiry - now;

        if (diffMs <= 0) return 'Expired';

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    // Auto-Fill Cash Logic (Admin Setting)
    // Auto-Fill Cash Logic (Always Active)
    useEffect(() => {
        if (activeSale.cart.length > 0) {
            updateActiveSale({ cashReceived: cartTotal });
        }
    }, [cartTotal]);

    return (
        <>
            <div className="h-full w-full flex flex-col animate-in fade-in zoom-in-95 duration-300">
            {/* TOP BAR */}
            <div className="h-10 flex items-end gap-1 shrink-0 px-2 select-none">
                {sales.map(sale => (
                    <div
                        key={sale.id}
                        onClick={() => setActiveSaleId(sale.id)}
                        className={`
                            group relative min-w-[160px] max-w-[240px] h-9 px-4 rounded-t-xl flex items-center justify-between cursor-pointer transition-all duration-200
                            ${activeSaleId === sale.id
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 font-bold shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-10 h-10 pb-1'
                                : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 mb-1'
                            }
                        `}
                    >
                        <span className="text-xs truncate flex-1">Sale #{sale.id}</span>
                        <button
                            onClick={(e) => closeSale(e, sale.id)}
                            className={`ml-1 flex items-center justify-center w-5 h-5 rounded-md transition-all ${activeSaleId === sale.id
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 opacity-100'
                                    : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600'
                                }`}
                        >
                            <X size={10} strokeWidth={3} />
                        </button>
                        {activeSaleId === sale.id && (
                            <div className="absolute -bottom-1 left-0 right-0 h-2 bg-white dark:bg-slate-900 z-20"></div>
                        )}
                    </div>
                ))}
                <button onClick={createNewSale} className="h-8 w-8 mb-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center transition-colors">
                    <Plus size={18} />
                </button>

                {/* Parked Sales & Status - Side by Side */}
                <div className="ml-auto mr-2 relative flex items-center gap-2" ref={parkedDropdownRef}>
                    <button
                        onClick={() => {
                            setParkedDropdownOpen(!parkedDropdownOpen);
                            if (!parkedDropdownOpen) loadParkedSales();
                        }}
                        className="h-8 px-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 flex items-center gap-2 transition-colors text-xs font-bold"
                    >
                        <Pause size={14} />
                        <span>Parked ({parkedSales.length})</span>
                    </button>

                    {/* Offline Indicator */}
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isOnline ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                        <span>{isOnline ? 'Online' : 'Offline'}</span>
                    </div>

                    {/* Sync Indicator */}
                    {pendingCount > 0 && (
                        <button
                            onClick={() => { setShowSyncHub(true); loadOfflineSales(); }}
                            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-bounce hover:bg-amber-200 transition-colors"
                        >
                            <Clock size={14} />
                            <span>{pendingCount} Offline Sales</span>
                        </button>
                    )}

                    {parkedDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden">
                            <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Parked Sales</h3>
                            </div>
                            {parkedSales.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-xs">
                                    No parked sales found.
                                </div>
                            ) : (
                                <div className="max-h-64 overflow-y-auto">
                                    {parkedSales.map(parked => (
                                        <div
                                            key={parked.id}
                                            onClick={() => handleRecallSale(parked.id)}
                                            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-800 dark:text-white text-sm">
                                                        {parked.customer_name || 'Walk-in Customer'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {parked.items_count} {parked.items_count === 1 ? 'item' : 'items'} · {formatCurrency(parked.total || 0, store || settings)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteParked(parked.id, e)}
                                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-slate-400 hover:text-red-600 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <Clock size={12} className="text-amber-500" />
                                                <span className={`font-medium ${getTimeRemaining(parked.expires_at).includes('Expired') ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
                                                    {getTimeRemaining(parked.expires_at).includes('Expired')
                                                        ? 'Expired'
                                                        : `Expires in ${getTimeRemaining(parked.expires_at)}`
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN WORKSPACE */}
            <div className="flex-1 flex gap-6 min-h-0 bg-white dark:bg-slate-900 rounded-b-3xl rounded-tr-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden z-0 relative">

                {/* LEFT: Transaction List */}
                <div className="flex-1 flex flex-col min-w-0 relative">
                    {/* Search Bar */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50/50 dark:bg-slate-800/30 relative z-20">
                        <button
                            onClick={() => { setSearchQueryForProduct(activeSale.searchTerm); setShowProductModal(true); }}
                            className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-500 transition-colors"
                            title="Quick Add Product"
                        >
                            <PackagePlus size={20} />
                        </button>
                        <div className="flex-1 relative">
                            {/* <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /> */}
                            <AsyncProductCombobox
                                defaultOptions={categoryProducts}
                                value={activeSale.searchTerm}
                                onQueryChange={(val) => updateActiveSale({ searchTerm: val })}
                                onSelect={(product) => handleProductSelect(product)}
                                placeholder="Scan Barcode or Search Item..."
                                onKeyDown={handleSearchInputKeyDown}
                                inputClassName="pl-11 h-12 text-lg font-bold"
                                onCreateNew={() => { setSearchQueryForProduct(activeSale.searchTerm); setShowProductModal(true); }}
                                hideCostAndMargin={true}
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                                <ScanBarcode size={20} />
                            </div>
                        </div>
                    </div>

                    {/* SPLIT VIEW Container */}
                    <div className="flex-1 flex overflow-hidden">

                        {/* LEFT STRIP: Vertical Category List */}
                        <div className="w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 flex flex-col overflow-y-auto custom-scrollbar">
                            <div className="p-4 space-y-2">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 px-2">Categories</h3>
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`w-full p-4 rounded-2xl font-bold text-left transition-all relative overflow-hidden group ${selectedCategory === null
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <span className="relative z-10">All Items</span>
                                    {selectedCategory === null && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white"></div>}
                                </button>
                                {categories.filter(cat => cat.products_count > 0).map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`w-full p-4 pr-10 rounded-2xl font-bold text-left transition-all relative overflow-hidden group ${selectedCategory === cat.id
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <div className="relative z-10 flex justify-between items-center">
                                            <span className="text-sm truncate mr-2">{cat.name}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${selectedCategory === cat.id ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                {cat.products_count}
                                            </span>
                                        </div>
                                        {selectedCategory === cat.id && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white"></div>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT AREA: Product Grid */}
                        <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">

                            {/* Product Header & Senior Mode */}
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
                                <h2 className="font-black text-xl text-slate-800 dark:text-white uppercase tracking-tighter">
                                    {selectedCategory ? (categories.find(c => c.id === selectedCategory)?.name || 'Category') : 'All Products'}
                                </h2>

                                {/* Senior Mode Toggle - HIDDEN AS PER USER REQUEST */}
                                {/* <div className="flex items-center gap-2">...</div> */}
                            </div>

                            {/* Grid Content */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                {isLoadingProducts ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                        <p className="font-bold text-sm">Loading products...</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
                                        {selectedCategory && categoryProducts.length === 0 ? (
                                            <div className="col-span-full py-20 text-center">
                                                <Archive className="mx-auto text-slate-300 mb-4" size={48} />
                                                <p className="text-slate-500 font-bold">No products in this category</p>
                                            </div>
                                        ) : (
                                            categoryProducts.map(product => (
                                                <button
                                                    key={product.id}
                                                    onClick={() => handleProductSelect(product)}
                                                    className={`group bg-white dark:bg-slate-800 rounded-[2rem] border-2 border-transparent hover:border-indigo-500 transition-all shadow-sm hover:shadow-xl text-left relative overflow-hidden active:scale-95 flex flex-col ${seniorMode ? 'p-6 min-h-[200px]' : 'p-4 min-h-[160px]'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-auto w-full">
                                                        <div className={`rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden ${seniorMode ? 'w-16 h-16 text-3xl' : 'w-14 h-14 text-2xl'}`}>
                                                            {product.image_url || product.image_path ? (
                                                                <img src={product.image_url || product.image_path} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Package className="text-slate-400" size={seniorMode ? 32 : 24} />
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`font-black text-sky-500 dark:text-sky-400 ${seniorMode ? 'text-lg' : 'text-sm'}`}>
                                                                {formatCurrency(product.price || product.selling_price || 0, store || settings)}
                                                            </p>
                                                            <p className={`font-bold ${product.stock_quantity > 0 ? 'text-emerald-500' : 'text-red-500'} ${seniorMode ? 'text-xs' : 'text-[10px]'}`}>
                                                                Qty: {formatNumber(product.stock_quantity || 0, 0)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4">
                                                        <h4 className={`font-black text-slate-800 dark:text-white leading-tight mb-1 whitespace-normal break-words w-full ${seniorMode ? 'text-lg' : 'text-sm'}`}>{product.name}</h4>
                                                        <p className={`text-slate-400 font-bold uppercase tracking-widest ${seniorMode ? 'text-xs' : 'text-[10px]'}`}>{product.category?.name || product.category_name || 'General'}</p>
                                                    </div>
                                                    {product.variants && product.variants.length > 0 && (
                                                        <div className="absolute top-2 right-2 flex gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                                        </div>
                                                    )}
                                                </button>
                                            ))
                                        )}
                                        {/* Show instructional message if no category selected AND no products loaded */}
                                        {!selectedCategory && categoryProducts.length === 0 && (
                                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                                                <div className="w-20 h-20 rounded-[2.5rem] bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                                    <Search size={32} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-black text-lg text-slate-600 dark:text-white">Start Selling</p>
                                                    <p className="text-sm font-medium">Select a category or browse all items</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar - Shortcuts Strip */}
                    <div className="bg-slate-900 border-t border-slate-800 flex items-center px-4 py-2 gap-4 overflow-x-auto text-[10px] font-bold text-slate-400 no-scrollbar">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="bg-slate-700 text-white px-1.5 py-0.5 rounded">F1</span>
                            <span>Search</span>
                        </div>
                        <div className="w-px h-3 bg-slate-700"></div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="bg-slate-700 text-white px-1.5 py-0.5 rounded">F2</span>
                            <span>Qty</span>
                        </div>
                        <div className="w-px h-3 bg-slate-700"></div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="bg-slate-700 text-white px-1.5 py-0.5 rounded">F3</span>
                            <span>Item Disc</span>
                        </div>
                        <div className="w-px h-3 bg-slate-700"></div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="bg-slate-700 text-white px-1.5 py-0.5 rounded">F4</span>
                            <span>Remove</span>
                        </div>
                        <div className="w-px h-3 bg-slate-700"></div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="bg-slate-700 text-white px-1.5 py-0.5 rounded">F5</span>
                            <span>Price</span>
                        </div>
                        <div className="w-px h-3 bg-slate-700"></div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="bg-slate-700 text-white px-1.5 py-0.5 rounded">F11</span>
                            <span>Customer</span>
                        </div>
                        <div className="w-px h-3 bg-slate-700"></div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="bg-slate-700 text-white px-1.5 py-0.5 rounded">^S</span>
                            <span>Save</span>
                        </div>
                        <div className="w-px h-3 bg-slate-700"></div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="bg-slate-700 text-white px-1.5 py-0.5 rounded">^P</span>
                            <span>Print</span>
                        </div>
                        <div className="w-px h-3 bg-slate-700"></div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="bg-slate-700 text-white px-1.5 py-0.5 rounded">Alt+Z</span>
                            <span>Fullscr</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Cart & Payment Panel */}
                <div className="w-[450px] shrink-0 flex flex-col bg-slate-50 dark:bg-slate-900/80 border-l border-slate-100 dark:border-slate-800">

                    {/* Cart Header */}
                    <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <ShoppingCart size={20} className="text-indigo-600" />
                            CURRENT ORDER
                        </h3>
                        <span className={`px-2 py-0.5 rounded-lg font-black text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400`}>
                            {activeSale.cart.length} ITEMS • {activeSale.cart.reduce((sum, item) => sum + item.qty + (item.freeQuantity || 0), 0)} QTY
                        </span>
                    </div>

                    {/* Cart List (Moved from Left) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                        {activeSale.cart.map((item, index) => (
                            <div key={item.cartItemId} className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative group overflow-hidden pl-10">
                                <div className="absolute top-1/2 -translate-y-1/2 left-3 w-5 h-5 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                                    {index + 1}
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-xl shrink-0">
                                        <Package size={24} className="text-indigo-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-black text-slate-900 dark:text-white text-sm truncate pr-6">{item.name}</h4>
                                            <button
                                                onClick={() => removeFromCart(item.cartItemId)}
                                                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            {/* Price button — opens Item Discount modal */}
                                            <button
                                                onClick={() => openItemDiscountModal(item)}
                                                className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex flex-col items-end min-w-[60px]"
                                            >
                                                {item.discount > 0 ? (
                                                    <>
                                                        <span className="line-through text-[10px] text-slate-400 opacity-70">{formatCurrency(item.original_price, store || settings)}</span>
                                                        <span>{formatCurrency(item.price, store || settings)}</span>
                                                    </>
                                                ) : (
                                                    formatCurrency(item.price, store || settings)
                                                )}
                                            </button>
                                            {/* Converter button — opens Price/Qty/Total editor */}
                                            <button
                                                onClick={() => openConverterModal(item)}
                                                title="Edit Price / Qty / Total"
                                                className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all"
                                            >
                                                ⇄
                                            </button>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">{item.category}</span>
                                                {item.discount > 0 && <span className="text-xs font-black text-emerald-500">Disc: {formatCurrency(item.discount, store || settings)}</span>}
                                                {/* Negative Stock Warning Badge */}
                                                {item.qty > item.stock && (
                                                    <span className="text-[10px] font-black text-red-500 bg-red-100 dark:bg-red-900/30 px-1 py-0.5 rounded mt-0.5 animate-pulse">
                                                        ⚠️ Over Stock ({item.stock})
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-end justify-between gap-y-3 mt-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl">
                                                    <button
                                                        onClick={() => updateQty(item.cartItemId, -1)}
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 text-slate-500 transition-all border border-transparent active:scale-90"
                                                    >
                                                        <MinusCircle size={18} />
                                                    </button>
                                                    <span className="w-10 text-center font-black text-sm text-slate-900 dark:text-white">
                                                        {item.qty}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQty(item.cartItemId, 1)}
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 text-slate-500 transition-all border border-transparent active:scale-90"
                                                    >
                                                        <PlusCircle size={18} />
                                                    </button>
                                                </div>

                                                {/* Free Qty Controls */}
                                                <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 p-1 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                                                    <button
                                                        onClick={() => updateFreeQty(item.cartItemId, -1)}
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-slate-900 text-emerald-600 dark:text-emerald-400 transition-all active:scale-90"
                                                    >
                                                        <MinusCircle size={18} />
                                                    </button>
                                                    <div className="flex flex-col items-center w-10">
                                                        <span className="font-black text-sm text-emerald-700 dark:text-emerald-400 leading-none">
                                                            {item.freeQuantity || 0}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-emerald-500 uppercase leading-none">FREE</span>
                                                    </div>
                                                    <button
                                                        onClick={() => updateFreeQty(item.cartItemId, 1)}
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-slate-900 text-emerald-600 dark:text-emerald-400 transition-all active:scale-90"
                                                    >
                                                        <PlusCircle size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className={`text-right ml-auto ${seniorMode ? 'scale-110 origin-right' : ''} transition-transform`}>
                                                <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1 text-right">Line Total</p>
                                                <p className="font-black text-slate-900 dark:text-white text-sm">
                                                    {formatCurrency(item.price * item.qty, store || settings)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {activeSale.cart.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-40 py-20">
                                <ShoppingCart size={64} strokeWidth={1} className="mb-4" />
                                <p className="font-black text-lg">Your cart is empty</p>
                                <p className="text-sm">Start adding products to create a sale</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Payment & Summary Panel */}
                <div className="w-96 shrink-0 bg-slate-900 text-white flex flex-col shadow-2xl relative overflow-hidden border-l border-slate-800">
                    <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-10 pointer-events-none"></div>

                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Receipt className="text-emerald-400" /> Payment Details
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">Transaction ID: #{activeSale.id}</p>
                    </div>

                    <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                        {/* Summary Block - Compact */}
                        <div className="space-y-2 bg-white/5 p-3 rounded-xl">
                            <div className="flex justify-between text-slate-400 text-xs">
                                <span>Subtotal</span>
                                <span className="text-white">{formatCurrency(subtotal, store || settings)}</span>
                            </div>
                            {totalDiscounts > 0 && (
                                <div className="flex justify-between text-emerald-400 text-xs font-bold">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(totalDiscounts, store || settings)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-slate-400 text-xs">
                                <span>Tax ({taxRate}%)</span>
                                <span className="text-white">{formatCurrency(taxAmount, store || settings)}</span>
                            </div>
                            <div className="h-px bg-white/10 my-1"></div>
                            <div className={`flex justify-between font-bold text-emerald-400 ${seniorMode ? 'text-2xl' : 'text-xl'}`}>
                                <span>Total</span>
                                <span>{formatCurrency(cartTotal, store || settings)}</span>
                            </div>
                        </div>

                        {/* Customer Search Row - Full Width to prevent clipping */}
                        <div className="relative z-[60]">
                            {customerDropdownOpen ? (
                                <div className="animate-in slide-in-from-top-2 duration-200">
                                    <AsyncPartyCombobox
                                        defaultOptions={initialCustomers}
                                        selectedItem={activeSale.customer}
                                        onSelect={(customer) => {
                                            selectCustomer(customer);
                                            setCustomerDropdownOpen(false);
                                        }}
                                        className="h-full"
                                        inputClassName="bg-white/5 border-white/5 text-white placeholder-slate-500 focus:ring-emerald-500/50 h-14"
                                        placeholder="Search Customer (Name, Phone)..."
                                        onQueryChange={(val) => setCustomerSearchTerm(val)}
                                        onCreateNew={() => setShowQuickPartyModal(true)}
                                        addNewLabel="Add New Customer"
                                        type="customer"
                                        onEdit={(customer) => {
                                            setEditingCustomer(customer);
                                            setShowQuickPartyModal(true);
                                        }}
                                    />
                                    <button 
                                        onClick={() => setCustomerDropdownOpen(false)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setCustomerDropdownOpen(true)}
                                    className="w-full bg-white/5 p-4 rounded-xl text-left hover:bg-white/10 transition-all border border-white/5 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-black text-slate-500 block mb-0.5">Customer / Party</label>
                                            <span className="text-sm font-bold text-white">
                                                {activeSale.customer?.name || 'Walk-in Customer'}
                                            </span>
                                        </div>
                                    </div>
                                    <Search size={18} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                </button>
                            )}
                        </div>

                        {/* Discount & Payment Method Row */}
                        <div className="flex gap-2">
                            {/* Discount Button */}
                            <div className="flex-1">
                                <button
                                    onClick={() => {
                                        showInput('Apply Discount', 'Enter fixed discount amount', (val) => {
                                            const disc = parseFloat(val);
                                            if (!isNaN(disc)) {
                                                updateActiveSale({ discountType: 'fixed', discountValue: disc });
                                                addToast(`Discount of ${formatCurrency(disc, store || settings)} applied`, 'success');
                                            }
                                        });
                                    }}
                                    className="w-full bg-white/5 p-3 rounded-xl text-left hover:bg-white/10 transition-colors border border-white/5 h-16 flex flex-col justify-center"
                                >
                                    <label className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Discount</label>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold">%</div>
                                        <span className="text-xs font-bold text-white truncate">
                                            {activeSale.discountType === 'percentage'
                                                ? `${activeSale.discountValue}% (${formatCurrency(globalDiscount, store || settings)})`
                                                : formatCurrency(globalDiscount, store || settings)
                                            }
                                        </span>
                                    </div>
                                </button>
                            </div>

                            {/* Payment Method Selector */}
                            <div className="flex-1">
                                <div className="group relative h-full">
                                    <button 
                                        onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
                                        className="w-full bg-white/5 p-3 rounded-xl text-left hover:bg-white/10 transition-colors border border-white/5 h-16 flex flex-col justify-center"
                                    >
                                        <label className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Method</label>
                                        <div className="flex items-center gap-1.5">
                                            <CreditCard size={14} className="text-indigo-400 shrink-0" />
                                            <span className="text-xs font-bold text-white uppercase truncate">{paymentMethod}</span>
                                        </div>
                                    </button>
                                    {/* Dropdown - Click to toggle */}
                                    {paymentDropdownOpen && (
                                        <div className="absolute bottom-full right-0 mb-2 w-32 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-[70] animate-in slide-in-from-bottom-2 duration-200">
                                            {['cash', 'credit', 'bank', 'card', 'online'].map(method => {
                                                // Restricted: Credit only for registered customers
                                                if (method === 'credit' && !activeSale.customer) return null;
                                                
                                                return (
                                                    <button
                                                        key={method}
                                                        onClick={() => {
                                                            setPaymentMethod(method);
                                                            setPaymentDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-slate-700 ${paymentMethod === method ? 'text-emerald-400' : 'text-slate-300'}`}
                                                    >
                                                        {method.toUpperCase()}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bank Account Selector (Conditional for Bank/Card/Online) */}
                        {['bank', 'card', 'online'].includes(paymentMethod) && (
                            bankAccounts.length > 0 ? (
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="flex justify-between items-center mb-2 px-1">
                                        <label className="text-[10px] uppercase font-black text-slate-500 block">Deposit To Account</label>
                                        <button 
                                            onClick={() => setShowQuickAccountModal(true)}
                                            className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                                        >
                                            + Add New
                                        </button>
                                    </div>
                                    <select 
                                        value={selectedBankAccountId}
                                        onChange={(e) => setSelectedBankAccountId(e.target.value)}
                                        className="w-full bg-slate-800/50 border-white/5 rounded-xl py-2.5 px-3 text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
                                        style={{ backgroundImage: 'none' }} // Remove default arrow for cleaner look
                                    >
                                        {bankAccounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 animate-in shake duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle size={14} className="text-rose-500" />
                                        <span className="text-[10px] uppercase font-black text-rose-500">No Bank Accounts Found</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mb-3 leading-tight">
                                        You need at least one bank/online account to receive digital payments.
                                    </p>
                                    <button 
                                        onClick={() => setShowQuickAccountModal(true)}
                                        className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-rose-500/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} /> 
                                        <span>Create Bank Account</span>
                                    </button>
                                </div>
                            )
                        )}

                        {/* Payment Button - Replaces Cash Calculator */}
                        {/* Payment Input Section - Restored "Fill in value" option */}
                        <div className="space-y-3 mb-2">
                            <div className="bg-white/10 p-4 rounded-xl border border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs uppercase font-bold text-slate-400">Amount Tendered</label>
                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                        Cash
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-lg">{getCurrencySymbol(store || settings)}</span>
                                    <input
                                        type="number"
                                        value={activeSale.cashReceived}
                                        onChange={(e) => updateActiveSale({ cashReceived: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-8 pr-4 text-2xl font-bold text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all no-spinner"
                                        disabled={activeSale.cart.length === 0}
                                    />
                                    {/* Quick Exact Button */}
                                    <button
                                        onClick={() => updateActiveSale({ cashReceived: cartTotal })}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 px-2 py-1 rounded transition-colors border border-slate-600"
                                    >
                                        Exact
                                    </button>
                                </div>
                            </div>

                            {/* Change Display */}
                            <div className={`p-4 rounded-xl border transition-colors ${changeDue >= 0
                                ? 'bg-emerald-500/10 border-emerald-500/20'
                                : 'bg-red-500/10 border-red-500/20'
                                }`}>
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs font-bold uppercase ${changeDue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {changeDue >= 0 ? 'Change Due' : 'Shortage'}
                                    </span>
                                    <span className={`text-2xl font-black ${changeDue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatCurrency(Math.abs(changeDue), store || settings)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-black/20 backdrop-blur-sm space-y-3">
                        {/* Print Settings Toggle */}
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-400">Auto-print on complete</span>
                            <button
                                onClick={() => setPrintOnComplete(!printOnComplete)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${printOnComplete ? 'bg-emerald-500' : 'bg-slate-600'}`}
                            >
                                <div className={`absolute top-1 ${printOnComplete ? 'right-1' : 'left-1'} w-4 h-4 bg-white rounded-full transition-all`}></div>
                            </button>
                        </div>

                        <button
                            onClick={handleCheckoutClick}
                            disabled={processingPayment || activeSale.cart.length === 0}
                            className={`w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 active:scale-95 transition-all ${processingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {printOnComplete ? (
                                <><Printer size={20} /> {processingPayment ? 'Processing...' : 'Complete & Print'}</>
                            ) : (
                                <><Check size={20} /> {processingPayment ? 'Processing...' : 'Complete Sale'}</>
                            )}
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={handleParkBill}
                                disabled={parkingBill || activeSale.cart.length === 0}
                                className={`flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all ${parkingBill ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Pause size={18} /> {parkingBill ? 'Parking...' : 'Hold'}
                            </button>

                            <button
                                onClick={() => updateActiveSale({ cart: [], cashReceived: '' })}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                                <X size={18} /> Cancel
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Variant Selection Modal */}
            {variantModalOpen && selectedProductForVariant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Select Variant</h3>
                            <button onClick={() => setVariantModalOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="p-4 max-h-96 overflow-y-auto">
                            {selectedProductForVariant.variants.map(variant => (
                                <div
                                    key={variant.id}
                                    onClick={() => addToCart(selectedProductForVariant, variant)}
                                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer border border-slate-100 dark:border-slate-700 mb-2 flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-bold">{variant.sku}</p>
                                        <p className="text-xs text-slate-500">
                                            {/* Display attributes if available, else just SKU */}
                                            {variant.attributes ? JSON.stringify(variant.attributes) : 'Variant'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-indigo-600">{formatCurrency(variant.price, store || settings)}</p>
                                        <p className="text-xs text-slate-500">Stock: {variant.stock_quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {/* UI Modals */}
            <Toast toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

            <AlertModal
                show={alertState.show}
                onClose={() => setAlertState(prev => ({ ...prev, show: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />

            <ConfirmModal
                show={confirmState.show}
                onClose={() => setConfirmState(prev => ({ ...prev, show: false }))}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                isDangerous={confirmState.isDangerous}
            />

            <InputModal
                show={inputState.show}
                onClose={() => setInputState(prev => ({ ...prev, show: false }))}
                title={inputState.title}
                placeholder={inputState.placeholder}
                onSubmit={inputState.onSubmit}
            />

            <PaymentModal
                isOpen={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                totalAmount={cartTotal}
                onComplete={handlePaymentComplete}
                currency={store?.currency_code || settings?.currency || 'PKR'}
                bankAccounts={bankAccounts}
                customer={activeSale.customer}
            />

            {/* Quick Bank Account Modal */}
            {showQuickAccountModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">Create <span className="text-indigo-400">Bank Account</span></h3>
                                <p className="text-xs text-slate-400">Add a ledger to receive digital payments</p>
                            </div>
                            <button onClick={() => setShowQuickAccountModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Account Name</label>
                                <input 
                                    id="quick-acc-name"
                                    type="text" 
                                    placeholder="e.g. Meezan Bank, HBL Shop" 
                                    className="w-full bg-slate-800 border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Type</label>
                                    <select id="quick-acc-type" className="w-full bg-slate-800 border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50 outline-none">
                                        <option value="checking">Checking</option>
                                        <option value="savings">Savings</option>
                                        <option value="cash">Branch Cash</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Bank Name</label>
                                    <input 
                                        id="quick-acc-bank"
                                        type="text" 
                                        placeholder="Optional" 
                                        className="w-full bg-slate-800 border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white/5 border-t border-white/5 flex gap-3">
                            <button 
                                onClick={() => setShowQuickAccountModal(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-xs text-slate-400 hover:bg-white/5 transition-colors"
                            >
                                CANCEL
                            </button>
                            <button 
                                onClick={async () => {
                                    setCreatingAccount(true);
                                    const name = document.getElementById('quick-acc-name').value;
                                    const type = document.getElementById('quick-acc-type').value;
                                    const bank = document.getElementById('quick-acc-bank').value;
                                    
                                    if (!name) {
                                        addToast('Account name is required', 'error');
                                        setCreatingAccount(false);
                                        return;
                                    }

                                    try {
                                        await axios.post(route('store.bank-accounts.store', { store_slug: store?.slug }), {
                                            name,
                                            account_type: type,
                                            bank_name: bank,
                                            opening_balance: 0
                                        });
                                        addToast('Account created successfully!', 'success');
                                        setShowQuickAccountModal(false);
                                        router.reload({ only: ['bankAccounts'] });
                                    } catch (e) {
                                        addToast('Failed to create account', 'error');
                                    } finally {
                                        setCreatingAccount(false);
                                    }
                                }}
                                disabled={creatingAccount}
                                className="flex-[2] py-3 rounded-xl font-black text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {creatingAccount ? (
                                    <>
                                        <RefreshCcw size={14} className="animate-spin" />
                                        <span>CREATING...</span>
                                    </>
                                ) : (
                                    <span>CREATE ACCOUNT</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW MODALS */}
            <QuickPartyModal
                isOpen={showQuickPartyModal}
                onClose={() => { setShowQuickPartyModal(false); setEditingCustomer(null); }}
                editingParty={editingCustomer}
                onSuccess={(newCustomer) => {
                    updateActiveSale({ customer: newCustomer });
                    setShowQuickPartyModal(false);
                    setEditingCustomer(null);
                    addToast(`Customer ${newCustomer.name} ${editingCustomer ? 'updated' : 'created'}!`, 'success');
                }}
            />

            <ProductModal
                isOpen={showProductModal}
                onClose={() => setShowProductModal(false)}
                initialName={searchQueryForProduct}
                onSuccess={(newProduct) => {
                    addToCart(newProduct);
                    setShowProductModal(false);
                    addToast(`Product ${newProduct.name} added!`, 'success');
                }}
            />

            <FormModal
                isOpen={showOverpaymentModal}
                onClose={() => setShowOverpaymentModal(false)}
                title="Overpayment Detected"
                size="sm"
            >
                <div className="p-4">
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">
                            Use Excess Amount
                        </h3>
                        <div className="text-3xl font-black text-emerald-500 my-2">
                            {formatCurrency(overpaymentDetails.amount, store || settings)}
                        </div>
                        <p className="text-xs text-slate-400">
                            Customer paid extra. Choose action:
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => processCheckout(pendingPaymentData, false)}
                            className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                        >
                            Return Change
                        </button>
                        <button
                            onClick={() => processCheckout(pendingPaymentData, true)}
                            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-colors flex items-center justify-center gap-2"
                        >
                            Add to Ledger
                        </button>
                    </div>
                </div>
            </FormModal>

            {/* â”€â”€ Item Discount Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {itemDiscountModal.show && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Apply Item Discount</h3>
                            <p className="text-xs text-slate-400 mt-1 truncate">{itemDiscountModal.item?.name}</p>
                        </div>

                        {/* % / Rs Toggle */}
                        <div className="flex gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                            <button
                                onClick={() => setItemDiscountModal(p => ({ ...p, discType: 'fixed' }))}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${itemDiscountModal.discType === 'fixed' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
                            >
                                {getCurrencySymbol(store || settings)} Fixed
                            </button>
                            <button
                                onClick={() => setItemDiscountModal(p => ({ ...p, discType: 'percentage' }))}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${itemDiscountModal.discType === 'percentage' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
                            >
                                % Percent
                            </button>
                        </div>

                        <div className="relative">
                            <input
                                autoFocus
                                type="number"
                                min="0"
                                max={itemDiscountModal.discType === 'percentage' ? 100 : itemDiscountModal.originalPrice}
                                value={itemDiscountModal.discValue}
                                onChange={e => setItemDiscountModal(p => ({ ...p, discValue: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && applyItemDiscount()}
                                placeholder={itemDiscountModal.discType === 'percentage' ? 'Enter % (e.g. 10)' : `Max: ${formatCurrency(itemDiscountModal.originalPrice, store || settings)}`}
                                className="w-full px-4 py-3 pr-12 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-lg font-bold focus:ring-2 focus:ring-indigo-400 outline-none"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                                {itemDiscountModal.discType === 'percentage' ? '%' : (getCurrencySymbol(store || settings))}
                            </span>
                        </div>

                        {/* Preview */}
                        {itemDiscountModal.discValue && !isNaN(parseFloat(itemDiscountModal.discValue)) && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-3 text-sm flex justify-between">
                                <span className="text-slate-500">Discounted price</span>
                                <span className="font-black text-indigo-600 dark:text-indigo-400">
                                    {formatCurrency(
                                        itemDiscountModal.originalPrice - (
                                            itemDiscountModal.discType === 'percentage'
                                                ? (itemDiscountModal.originalPrice * parseFloat(itemDiscountModal.discValue)) / 100
                                                : parseFloat(itemDiscountModal.discValue)
                                        ),
                                        store || settings
                                    )}
                                </span>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setItemDiscountModal({ show: false, item: null, discType: 'fixed', discValue: '' })}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={applyItemDiscount}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* â”€â”€ Converter Modal (Price / Qty / Total) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {converterModal.show && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Edit Item Values</h3>
                            <p className="text-xs text-slate-400 mt-1 truncate">{converterModal.item?.name}</p>
                        </div>

                        {/* Mode toggle: what does Total changing affect? */}
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">When Total changes, recalculate:</p>
                            <div className="flex gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                                <button
                                    onClick={() => setConverterModal(p => ({ ...p, mode: 'price' }))}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${converterModal.mode === 'price' ? 'bg-white dark:bg-slate-600 shadow text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}
                                >
                                    {getCurrencySymbol(store || settings)} Price
                                </button>
                                <button
                                    onClick={() => setConverterModal(p => ({ ...p, mode: 'qty' }))}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${converterModal.mode === 'qty' ? 'bg-white dark:bg-slate-600 shadow text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}
                                >
                                    # Qty
                                </button>
                            </div>
                        </div>

                        {/* Fields */}
                        {[
                            { label: 'Unit Price', field: 'price', icon: (getCurrencySymbol(store || settings)), color: 'indigo' },
                            { label: 'Quantity', field: 'qty', icon: '#', color: 'emerald' },
                            { label: 'Total', field: 'total', icon: (getCurrencySymbol(store || settings)), color: 'amber' },
                        ].map(({ label, field, icon, color }) => (
                            <div key={field}>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{label}</label>
                                <div className="relative">
                                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-black text-sm text-${color}-500`}>{icon}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={converterModal[field]}
                                        onChange={e => handleConverterChange(field, e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && applyConverter()}
                                        className={`w-full pl-8 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white font-bold text-base focus:ring-2 focus:ring-${color}-400 outline-none`}
                                    />
                                </div>
                            </div>
                        ))}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setConverterModal({ show: false, item: null, mode: 'price', price: '', qty: '', total: '' })}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={applyConverter}
                                className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Printable Receipt */}

        </div>

        {/* --- OFFLINE SYNC HUB MODAL --- */}
        {showSyncHub && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className={`bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 ${seniorMode ? 'text-lg' : ''}`}>
                    {/* Header */}
                    <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                                <Database size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white leading-tight">Sync Hub</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium font-mono uppercase tracking-widest">{pendingCount} Pending Sales</p>
                            </div>
                        </div>
                        <button onClick={() => setShowSyncHub(false)} className="w-10 h-10 rounded-full hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {!isOnline && (
                            <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                                    <WifiOff size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-red-800 dark:text-red-300">Working Offline</p>
                                    <p className="text-sm text-red-600/80 dark:text-red-400/80">You are currently offline. Sales will be safely stored here until your connection returns.</p>
                                </div>
                            </div>
                        )}

                        {offlineSales.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 mx-auto mb-4">
                                    <Check size={40} />
                                </div>
                                <p className="text-slate-400 font-bold">All sales are synced!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {offlineSales.map(sale => (
                                    <div key={sale.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-900/40 bg-slate-50/50 dark:bg-slate-900/30 transition-all group">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 tracking-tighter">OFFLINE</span>
                                                    <span className="font-black text-slate-800 dark:text-white">{sale.data.customer_name || 'Walk-in Customer'}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                                    <span className="flex items-center gap-1.5"><ShoppingCart size={14} className="text-indigo-400" /> {sale.data.cart?.length || 0} Items</span>
                                                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><CreditCard size={14} /> {formatCurrency(sale.data.total_amount || 0, store || settings)}</span>
                                                    <span className="flex items-center gap-1.5 text-slate-400"><Clock size={14} /> {new Date(sale.created_at).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleRecallOfflineSale(sale)}
                                                    className="h-9 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-xs font-bold transition-all shadow-sm"
                                                >
                                                    Recall to Cart
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        showConfirm('Delete Offline Sale', 'This will permanently erase this sale from local storage. Are you sure?', async () => {
                                                            await deletePendingSale(sale.id);
                                                            setOfflineSales(prev => prev.filter(s => s.id !== sale.id));
                                                        }, true);
                                                    }}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50 transition-all shadow-sm"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <div className="text-xs text-slate-400 font-bold">
                            {lastSyncTime ? `Last checked: ${lastSyncTime.toLocaleTimeString()}` : 'Syncing enabled'}
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => syncPendingSales()}
                                disabled={isSyncing || !isOnline}
                                className={`px-6 h-12 rounded-2xl flex items-center gap-2 font-black transition-all ${
                                    isSyncing || !isOnline 
                                    ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 cursor-not-allowed' 
                                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0'
                                }`}
                            >
                                <RefreshCcw size={18} className={isSyncing ? 'animate-spin' : ''} />
                                <span>{isSyncing ? 'SYNCING...' : 'FORCE SYNC NOW'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
    );
};

export default function Pos({ settings, bankAccounts, recalledSale }) {
    return (
        <OneGlanceLayout title="Point of Sale" activeMenu="Dashboard" defaultCollapsed={true} hideHeader={true}>
            <Head title="POS" />
            <POSInterface settings={settings} recalledSale={recalledSale} bankAccounts={bankAccounts} />
        </OneGlanceLayout>
    );
}

