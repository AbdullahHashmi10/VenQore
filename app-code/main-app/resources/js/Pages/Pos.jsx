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
    Truck,
    Clock,
    Archive,
    CreditCard,
    Wifi,
    WifiOff,
    RefreshCcw,
    Database,
    Warehouse,
    ChevronLeft,
    ChevronRight,
    History
} from 'lucide-react';
import axios from 'axios';
import { useWorkspace } from '@/Contexts/WorkspaceContext';
import { useOfflineSync } from '@/Hooks/useOfflineSync';
import PrintService from '@/Utils/PrintService';
import { getProductPrice, shouldStopNegativeStock, roundTotal } from '@/Utils/settings';
import { db } from '@/Utils/db';
import { useAMDStation } from '@/Utils/AMDStation';

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
import PosTourGuide from '@/Components/PosTourGuide';

const POSInterface = ({ settings, recalledSale, bankAccounts = [], warehouses = [] }) => {
    const { auth, store } = usePage().props;
    const userRole = auth.user?.role;
    const userPerms = auth.user?.permissions || [];
    const hasDiscountPerm = userRole === 'owner' || userRole === 'admin' || userRole === 'manager' || userPerms.some(p => p === 'pos.discounts' || p.startsWith('pos.discounts.'));
    const posReturnMode = settings?.pos_return_mode || 'reference';
    const posReturnWindow = settings?.pos_return_window ? parseInt(settings.pos_return_window) : null;
    const posReturnWindowBehavior = settings?.pos_return_window_behavior || 'warn';
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
    const { isConnected: isStationConnected } = useAMDStation();
    const [alertState, setAlertState] = useState({ show: false, title: '', message: '', type: 'info' });
    const [confirmState, setConfirmState] = useState({ show: false, title: '', message: '', onConfirm: () => { } });
    const [inputState, setInputState] = useState({ show: false, title: '', placeholder: '', onSubmit: () => { } });
    const [activeMobileTab, setActiveMobileTab] = useState('catalog');
    
    // UI Helpers
    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };
    const showAlert = (title, message, type = 'error') => setAlertState({ show: true, title, message, type });
    const showConfirm = (title, message, onConfirm, isDangerous = false) => setConfirmState({ show: true, title, message, onConfirm, isDangerous });
    const showInput = (title, placeholder, onSubmit) => setInputState({ show: true, title, placeholder, onSubmit });

    // Categories Scroll Helper
    const categoryScrollRef = useRef(null);
    const handleCategoryWheel = (e) => {
        if (categoryScrollRef.current) {
            categoryScrollRef.current.scrollLeft += e.deltaY;
        }
    };
    const scrollCategories = (direction) => {
        if (categoryScrollRef.current) {
            const offset = direction === 'left' ? -180 : 180;
            categoryScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
        }
    };

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
            const mappedCart = recalledSale.items.map(item => {
                const itemDiscount = parseFloat(item.discount_amount || item.discount || 0);
                const unitPrice = parseFloat(item.unit_price || 0);
                return {
                    cartItemId: `${item.product_id}-${item.product_variant_id || ''}`,
                    id: item.product_id,
                    variant_id: item.product_variant_id,
                    name: item.product.name + (item.product_variant ? ` (${item.product_variant.sku})` : ''),
                    price: unitPrice - itemDiscount, // Net price
                    original_price: unitPrice, // Gross price
                    discount: itemDiscount, // Row discount
                    qty: parseFloat(item.quantity),
                    freeQuantity: parseFloat(item.free_quantity || 0),
                    stock: 9999,
                    image: item.product.image_path,
                    category: item.product.category?.name || 'General'
                };
            });

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
                discountValue: parseFloat(recalledSale.global_discount || 0),
                discountType: 'fixed',
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

    // Recent Invoices feature state
    const [recentInvoices, setRecentInvoices] = useState([]);
    const [showRecentInvoices, setShowRecentInvoices] = useState(false);
    const [loadingRecent, setLoadingRecent] = useState(false);

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
    const [taxDropdownOpen, setTaxDropdownOpen] = useState(false);
    const [bankAccountDropdownOpen, setBankAccountDropdownOpen] = useState(false);
    const [showQuickAccountModal, setShowQuickAccountModal] = useState(false);
    const [creatingAccount, setCreatingAccount] = useState(false);

    // Print Settings State
    const [printOnComplete, setPrintOnComplete] = useState(() => {
        const saved = localStorage.getItem('pos_print_on_complete');
        return saved ? JSON.parse(saved) : true; // Default: print enabled
    });

    // Senior Mode State — DRAGNET-FIX: initialize from DB-backed settings prop first.
    // Previously only used sessionStorage (default: false), so a user who enabled
    // Senior Mode in the main app (stored in DB) would get normal-size POS text.
    // Now: DB setting is the source of truth; sessionStorage acts as a per-session override.
    const [seniorMode, setSeniorMode] = useState(() => {
        const sessionOverride = sessionStorage.getItem('pos_senior_mode');
        if (sessionOverride !== null) {
            // User has toggled it in this session — respect that choice
            return JSON.parse(sessionOverride);
        }
        // Fall back to the DB-backed Inertia prop (same source as all other pages)
        return settings?.senior_mode === '1' || settings?.senior_mode === true;
    });

    const [returnMode, setReturnMode] = useState(false);
    const [returnSaleRef, setReturnSaleRef] = useState('');
    const [returnSaleId, setReturnSaleId] = useState(null);
    const [returnSaleLoading, setReturnSaleLoading] = useState(false);
    const [returnProcessing, setReturnProcessing] = useState(false);




    // Free Quantity Visibility State (default: OFF)
    const [showFreeQty, setShowFreeQty] = useState(false);


    // Item Discount Modal State
    const [itemDiscountModal, setItemDiscountModal] = useState({ show: false, item: null, discType: 'fixed', discValue: '' });

    // Converter Modal State (Price / Qty / Total)
    const [converterModal, setConverterModal] = useState({ show: false, item: null, mode: 'price', price: '', qty: '', total: '' });

    // Global Discount Modal State
    const [globalDiscountModal, setGlobalDiscountModal] = useState({ show: false, type: 'fixed', value: '' });

    // Global Discount Preset Custom Values State
    const [discountPresets, setDiscountPresets] = useState(() => {
        const saved = localStorage.getItem('pos_discount_presets');
        return saved ? JSON.parse(saved) : [5, 7, 10];
    });

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
        syncErrors,
        checkPending,
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
        // Always re-sync the badge count from DB so it matches the list shown in the modal.
        // Without this, the badge can show a stale number (e.g. "1") while the list is empty.
        await checkPending();
    };

    const searchInputRef = useRef(null);
    const parkedDropdownRef = useRef(null);
    const recentDropdownRef = useRef(null);
    const customerDropdownRef = useRef(null);
    const cartListRef = useRef(null);
    const cashReceivedInputRef = useRef(null);

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

    // Persist Senior Mode (session storage, resets on logout) and scale html root font size
    useEffect(() => {
        sessionStorage.setItem('pos_senior_mode', JSON.stringify(seniorMode));
        if (seniorMode) {
            document.documentElement.style.fontSize = '125%'; // 25% scale increase
        } else {
            document.documentElement.style.fontSize = '100%';
        }
        return () => {
            document.documentElement.style.fontSize = '';
        };
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


    const loadRecentInvoices = async () => {
        setLoadingRecent(true);
        try {
            const res = await fetch('/api/pos/recent-sales', {
                headers: { 'Accept': 'application/json' }
            });
            const data = await res.json();
            if (data.status === 'success') {
                setRecentInvoices(data.data);
            }
        } catch (e) {
            console.error(e);
            addToast('Failed to fetch recent invoices', 'error');
        } finally {
            setLoadingRecent(false);
        }
    };

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
            if (isOnline) {
                const response = await axios.get(route('store.pos.search', { store_slug: store?.slug }), { params: { q: query } });
                setSearchResults(response.data.data || response.data || []);
            } else {
                const lowerQuery = query.toLowerCase();
                const results = await db.products
                    .filter(p => 
                        (p.name && p.name.toLowerCase().includes(lowerQuery)) ||
                        (p.sku && p.sku.toLowerCase().includes(lowerQuery)) ||
                        (p.barcode && p.barcode.includes(query))
                    )
                    .limit(50)
                    .toArray();
                setSearchResults(results);
            }
        } catch (error) {
            console.error("Search error:", error);
            try {
                const lowerQuery = query.toLowerCase();
                const results = await db.products
                    .filter(p => 
                        (p.name && p.name.toLowerCase().includes(lowerQuery)) ||
                        (p.sku && p.sku.toLowerCase().includes(lowerQuery)) ||
                        (p.barcode && p.barcode.includes(query))
                    )
                    .limit(50)
                    .toArray();
                setSearchResults(results);
            } catch (localError) {
                console.error("Local search failed:", localError);
            }
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
                    showAlert(
                        'Not Enough Stock',
                        `Cannot add more "${name}" — available stock is ${stock} unit(s). ` +
                        `Negative stocking is currently disabled. To allow selling beyond available stock, ` +
                        `enable "Allow Negative Stock" in Settings.`,
                        'warning'
                    );
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
                    showAlert(
                        'Out of Stock',
                        `"${name}" has no remaining stock. ` +
                        `Negative stocking is currently disabled. To allow selling beyond available stock, ` +
                        `enable "Allow Negative Stock" in Settings.`,
                        'warning'
                    );
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

        // If it looks like a barcode (no spaces, min 4 chars), try optimized exact barcode/SKU lookup first
        if (val.length >= 4 && !/\s/.test(val)) {
            setIsSearching(true);
            try {
                if (isOnline) {
                    const response = await axios.get(route('store.pos.barcode', { store_slug: store?.slug, code: val }));
                    if (response.data.found) {
                        const product = response.data.product;
                        const variantId = response.data.variant_id;
                        if (variantId && product.variants) {
                            const variant = product.variants.find(v => v.id === variantId);
                            addToCart(product, variant);
                        } else {
                            handleProductSelect(product);
                        }
                        updateActiveSale({ searchTerm: '' });
                        setIsSearching(false);
                        return;
                    }
                } else {
                    const exactMatch = await db.products
                        .filter(p => p.sku === val || p.barcode === val)
                        .first();
                    if (exactMatch) {
                        handleProductSelect(exactMatch);
                        updateActiveSale({ searchTerm: '' });
                        setIsSearching(false);
                        return;
                    }
                }
            } catch (err) {
                console.error("Barcode exact match lookup failed, falling back to general search:", err);
            } finally {
                setIsSearching(false);
            }
        }

        // Check for Quantity Shortcut (Number only, and shorter than typical barcode)
        // Safety: If it's a number, we check if it's a product. If not, we treat as Qty.
        // If it IS a product (e.g. barcode "6"), we add the product.

        setIsSearching(true);
        try {
            let results = [];
            if (isOnline) {
                // Check for exact match first
                const response = await axios.get(route('store.inventory.search', { store_slug: store?.slug }), { params: { query: val } });
                results = response.data;
            } else {
                results = await db.products
                    .filter(p => p.sku === val || p.barcode === val)
                    .toArray();
            }

            // Should we prioritize Exact Match?
            const exactMatch = results.find(p => p.sku === val || p.barcode === val);

            if (exactMatch) {
                handleProductSelect(exactMatch);
            } else if (results.length === 1) {
                // Formatting loose match
                handleProductSelect(results[0]);
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
            try {
                const results = await db.products
                    .filter(p => p.sku === val || p.barcode === val)
                    .toArray();
                const exactMatch = results.find(p => p.sku === val || p.barcode === val);
                if (exactMatch) {
                    handleProductSelect(exactMatch);
                } else if (results.length === 1) {
                    handleProductSelect(results[0]);
                } else {
                    addToast('No product found (offline)', 'warning');
                }
            } catch (err) {
                console.error("Local scan lookup failed:", err);
            }
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
                        showAlert(
                            'Not Enough Stock',
                            `Cannot increase "${item.name}" quantity — only ${item.stock} unit(s) in stock. ` +
                            `Negative stocking is currently disabled. To allow selling beyond available stock, ` +
                            `enable "Allow Negative Stock" in Settings.`,
                            'warning'
                        );
                        return item; // Do not update
                    } else {
                        // Only warn if increasing quantity
                        if (delta > 0) {
                            addToast(`Warning: Selling ${item.name} beyond stock!`, 'warning');
                        }
                    }
                    // Note: stray auto-manufacture toast removed — this block is for !canAutoManufacture
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
    const parsedTaxRates = (() => {
        try {
            return settings?.tax_rates ? (typeof settings.tax_rates === 'string' ? JSON.parse(settings.tax_rates) : settings.tax_rates) : [
                { id: 1, name: 'GST 18%', rate: 18, type: 'percentage' },
                { id: 2, name: 'VAT 5%', rate: 5, type: 'percentage' }
            ];
        } catch (e) {
            return [];
        }
    })();

    const taxRate = activeSale.taxRate !== undefined ? activeSale.taxRate : parseFloat(settings?.default_tax_rate || 0);
    const taxInclusive = activeSale.taxInclusive !== undefined ? activeSale.taxInclusive : false;

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
    const taxAmount = taxInclusive 
        ? taxableAmount - (taxableAmount / (1 + taxRate / 100))
        : (taxableAmount * taxRate) / 100;
    const rawCartTotal = taxInclusive ? taxableAmount : taxableAmount + taxAmount;
    const cartTotal = roundTotal(rawCartTotal, settings);

    const changeDue = activeSale.cashReceived ? parseFloat(activeSale.cashReceived) - cartTotal : 0;

    const handleCheckoutClick = () => {
        if (activeSale.cart.length === 0) return;

        // If no amount is typed, block checkout and focus the Amount Tendered input
        const rawTendered = activeSale.cashReceived;
        if (!rawTendered || parseFloat(rawTendered) <= 0) {
            addToast('Please enter the Amount Tendered first', 'warning');
            
            // Highlight and focus input
            if (cashReceivedInputRef.current) {
                cashReceivedInputRef.current.focus();
                cashReceivedInputRef.current.select();
                
                // Add temporary shake animation class if element is available
                const container = document.getElementById('tour-pos-paid');
                if (container) {
                    container.classList.add('animate-shake', 'ring-2', 'ring-rose-500');
                    setTimeout(() => {
                        container.classList.remove('animate-shake', 'ring-2', 'ring-rose-500');
                    }, 500);
                }
            }
            return;
        }

        const tendered = parseFloat(rawTendered);

        const paymentData = {
            totalPaid: tendered,
            change: Math.max(0, tendered - cartTotal),
            payments: [{
                method: paymentMethod || 'cash',
                amount: tendered,
                account_id: ['bank', 'card', 'online'].includes(paymentMethod) ? selectedBankAccountId : null
            }],
            notes: '',
            printReceipt: printOnComplete
        };

        handlePaymentComplete(paymentData);
    };

    const handleTenderedKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // If empty, auto-fill Exact value, else checkout what was entered
            const rawTendered = activeSale.cashReceived;
            if (!rawTendered || parseFloat(rawTendered) <= 0) {
                updateActiveSale({ cashReceived: cartTotal });
                // Timeout to allow state update before processing
                setTimeout(() => {
                    handleCheckoutClick();
                }, 50);
            } else {
                handleCheckoutClick();
            }
        }
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

        // Clamp cash payment lines to avoid sending change excess to the backend,
        // preventing journal imbalances for walk-in cash payments.
        let remainingInvoiceTotal = cartTotal;
        const adjustedPayments = (paymentData.payments || []).map(p => {
            const isCash = p.method === 'cash';
            const originalAmount = parseFloat(p.amount) || 0;
            
            if (isCash) {
                // Cash payment cannot record a debit larger than the remaining invoice balance
                const cashPortion = Math.min(originalAmount, remainingInvoiceTotal);
                remainingInvoiceTotal = Math.max(0, remainingInvoiceTotal - cashPortion);
                return { ...p, amount: cashPortion };
            } else {
                remainingInvoiceTotal = Math.max(0, remainingInvoiceTotal - originalAmount);
                return p;
            }
        });

        const payload = {
            items: activeSale.cart.map(item => ({
                product_id: item.id,
                variant_id: item.variant_id,
                quantity: item.qty,
                free_quantity: item.freeQuantity || 0,
                price: item.original_price || item.price,
                discount: item.discount || 0,
                discount_type: item.discountType || 'fixed'
            })),
            customer_id: activeSale.customer?.id || null,
            payment_method: 'split',
            warehouse_id: selectedWarehouseId,
            payments: adjustedPayments,
            amount_paid: cartTotal, // Always count cartTotal as net paid internally
            tax: taxAmount,
            tax_rate: taxRate,
            tax_inclusive: taxInclusive,
            discount: globalDiscount,
            notes: paymentData.notes,
            add_to_ledger: addToLedger,
            source: 'pos',
            is_dropship: activeSale.is_dropship || false,
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

        // Refresh product catalog to show updated stock quantities
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('amd:refresh-products'));
        }, 1000);

        // Auto-print if enabled
        if (paymentData.printReceipt) {
            // Build sale object for printing — include `id` from `sale_id` so that
            // PrintService.quickPrint can fetch the full sale (with live ledger balance)
            // from the server before rendering the receipt.
            const saleForPrint = {
                ...data,
                id: data.sale_id || data.id,   // ← ensures quickPrint fetches fresh server data
                items: activeSale.cart,
                total: cartTotal,
                amount_paid: paymentData.totalPaid,
                change: paymentData.change,
                customer: activeSale.customer,
                tax: taxAmount
            };
            // Use configured default print type (thermal or regular)
            const printType = settings?.default_print_type || 'thermal';
            setTimeout(() => PrintService.quickPrint(saleForPrint, printType, settings), 500);
        }


        // Show notifications
        let message = '';
        if (data.is_offline) {
            message = 'Reference: ' + data.reference + '\n\n⚠️ Saved Offline. Will sync when online.';
            addToast('Sale saved offline', 'warning');
        } else {
            // Count total number of items in the cart (sum of quantities of all lines)
            const totalItemsCount = activeSale.cart.reduce((acc, item) => acc + (item.qty + (item.freeQuantity || 0)), 0);
            
            const messageElement = (
                <div className="flex flex-col gap-5 py-3">
                    <div className="bg-neutral-950 p-6 rounded-2xl border-2 border-neutral-800 shadow-2xl flex flex-col items-center justify-center">
                        <span className="text-sm font-bold text-ink-muted uppercase block tracking-widest mb-2">
                            Amount Paid
                        </span>
                        <span className="text-5xl font-bold text-emerald-400 dark:text-emerald-400 block animate-pulse whitespace-nowrap">
                            {formatCurrency(paymentData.totalPaid, store || settings)}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-950 p-4 rounded-2xl border-2 border-neutral-800 flex flex-col items-center justify-center">
                            <span className="text-1xs font-bold text-ink-muted uppercase block tracking-wider mb-1.5">
                                Change Due
                            </span>
                            <span className="text-2xl font-bold text-brand-400 block whitespace-nowrap">
                                {formatCurrency(paymentData.change, store || settings)}
                            </span>
                        </div>
                        <div className="bg-neutral-950 p-4 rounded-2xl border-2 border-neutral-800 text-center">
                            <span className="text-1xs font-bold text-ink-muted uppercase block tracking-wider mb-1.5">
                                Total Items
                            </span>
                            <span className="text-2xl font-bold text-white block">
                                {totalItemsCount}
                            </span>
                        </div>
                    </div>

                    {data.manufacturing_notifications && data.manufacturing_notifications.length > 0 && (
                        <div className="mt-2 text-left bg-amber-500/15 p-3 rounded-xl border border-amber-500/30 text-xs text-amber-400">
                            <span className="font-bold block mb-1">📦 Auto-Manufacturing:</span>
                            {data.manufacturing_notifications.join('\n')}
                        </div>
                    )}
                </div>
            );
            
            if (store?.onboarding_step === 'pos_tour') {
                router.post(
                    route('store.onboarding.step', { store_slug: store?.slug }),
                    { step: 'pos_congratulations' },
                    { preserveScroll: true }
                );
            } else {
                showAlert('Sale Completed!', messageElement, 'success');

                // Let Enter key dismiss this alert instantly for the next sale
                const handleEnterDismiss = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        setAlertState(prev => {
                            if (prev.show && prev.title === 'Sale Completed!') {
                                return { ...prev, show: false };
                            }
                            return prev;
                        });
                        document.removeEventListener('keydown', handleEnterDismiss);
                        if (searchInputRef.current) searchInputRef.current.focus();
                    }
                };
                document.addEventListener('keydown', handleEnterDismiss);

                // Auto-close after 30 seconds (30000ms) to allow cashier/customer time to inspect
                setTimeout(() => {
                    setAlertState(prev => {
                        // Only auto-close if the specific success modal is still open
                        if (prev.show && prev.title === 'Sale Completed!') {
                            return { ...prev, show: false };
                        }
                        return prev;
                    });
                    document.removeEventListener('keydown', handleEnterDismiss);
                    if (searchInputRef.current) searchInputRef.current.focus();
                }, 30000);
            }
        }
    };

    // Customer search function
    const searchCustomers = async (query) => {
        try {
            if (isOnline) {
                const response = await axios.get(route('store.customers.search', { store_slug: store?.slug }), {
                    params: { search: query }
                });
                setCustomerResults(response.data || []);
            } else {
                throw new Error("Offline");
            }
        } catch (error) {
            console.error("Customer search error, falling back locally:", error);
            try {
                const lowerQuery = query.toLowerCase();
                const localCustomers = await db.customers
                    .filter(c => 
                        (c.name && c.name.toLowerCase().includes(lowerQuery)) ||
                        (c.phone && c.phone.includes(query))
                    )
                    .toArray();
                setCustomerResults(localCustomers);
            } catch (localError) {
                console.error("Local customer search failed:", localError);
                setCustomerResults([]);
            }
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
                if (isOnline) {
                    const response = await axios.get(route('store.customers.search', { store_slug: store?.slug }), { params: { search: '' } });
                    setInitialCustomers((response.data || []).slice(0, 50));
                } else {
                    throw new Error("Offline");
                }
            } catch (error) {
                console.error('Failed to load initial customers, falling back locally:', error);
                try {
                    const localCustomers = await db.customers.limit(50).toArray();
                    setInitialCustomers(localCustomers);
                } catch (localError) {
                    console.error("Local initial customers load failed:", localError);
                }
            }
        };
        loadInitialCustomers();
    }, [isOnline]);

    // Print receipt function
    const printReceipt = (type = null) => {
        const printType = type || settings?.default_print_type || 'thermal';
        if (lastSale) {
            PrintService.quickPrint(lastSale, printType, settings);
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
            if (isOnline) {
                const response = await axios.get(route('store.pos.categories', { store_slug: store?.slug }));
                setCategories(response.data.data || response.data || []);
            } else {
                throw new Error("Offline");
            }
        } catch (error) {
            console.error("Error loading categories, extracting locally:", error);
            try {
                const localProducts = await db.products.toArray();
                const categoriesMap = {};
                localProducts.forEach(p => {
                    if (p.category) {
                        const catId = p.category.id || p.category_id;
                        const catName = p.category.name || p.category_name || 'General';
                        categoriesMap[catId] = {
                            id: catId,
                            name: catName,
                            products_count: (categoriesMap[catId]?.products_count || 0) + 1,
                            product_count: (categoriesMap[catId]?.product_count || 0) + 1
                        };
                    }
                });
                const sorted = Object.values(categoriesMap).sort((a, b) => {
                    if (a.name === 'Phones') return -1;
                    if (b.name === 'Phones') return 1;
                    return a.name.localeCompare(b.name);
                });
                setCategories(sorted);
            } catch (localError) {
                console.error("Failed to load local categories:", localError);
                setCategories([]);
            }
        }
    };

    // Load products by category (or featured if no category)
    const fetchCategoryProducts = async (catId) => {
        setIsLoadingProducts(true);
        try {
            if (isOnline) {
                let response;
                if (catId) {
                    response = await axios.get(route('store.pos.search', { store_slug: store?.slug }), {
                        params: { category_id: catId, q: '' }
                    });
                } else {
                    response = await axios.get(route('store.pos.featured', { store_slug: store?.slug }));
                }
                const productsArray = Array.isArray(response.data)
                    ? response.data
                    : (response.data && Array.isArray(response.data.data) ? response.data.data : []);
                setCategoryProducts(productsArray);
            } else {
                throw new Error("Offline");
            }
        } catch (error) {
            console.error("Error loading category products, falling back locally:", error);
            try {
                let localProducts = [];
                if (catId) {
                    localProducts = await db.products
                        .filter(p => p.category_id === catId || (p.category && p.category.id === catId))
                        .toArray();
                } else {
                    localProducts = await db.products.limit(50).toArray();
                }
                setCategoryProducts(localProducts);
            } catch (localError) {
                console.error("Failed to load local products:", localError);
                setCategoryProducts([]);
            }
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const lookupSaleForReturn = async () => {
        if (!returnSaleRef.trim()) return;
        setReturnSaleLoading(true);
        try {
            const response = await axios.get(route('store.sales.lookup', { store_slug: store?.slug }), {
                params: { ref: returnSaleRef.trim() },
                headers: { 'Accept': 'application/json' },
            });
            const sale = response.data;
            if (!sale || !sale.id) {
                addToast(`Sale "${returnSaleRef}" not found.`, 'error');
                setReturnSaleId(null);
                return;
            }
            if (!sale.items || sale.items.length === 0) {
                addToast('Sale found but has no items.', 'error');
                setReturnSaleId(null);
                return;
            }
            setReturnSaleId(sale.id);
            // Load sale items into cart
            const mappedCart = sale.items.map(item => ({
                cartItemId: Date.now() + Math.random(),
                id: item.product_id,
                sale_item_id: item.id,
                name: item.product?.name || 'Unknown Product',
                price: parseFloat(item.unit_price),
                qty: parseFloat(item.quantity),
                freeQuantity: parseFloat(item.free_quantity || 0),
                unit: item.product?.unit || 'pcs',
                tax_rate: parseFloat(item.tax_rate || 0),
                discount: parseFloat(item.discount || 0),
                original_price: parseFloat(item.unit_price),
            }));
            updateActiveSale({ cart: mappedCart, customer: sale.customer || null });
            addToast(`Sale #${returnSaleRef} loaded for return`, 'info');
        } catch (err) {
            console.error('Return lookup error:', err?.response?.status, err?.response?.data, err?.message);
            addToast('Error looking up sale: ' + (err?.response?.data?.message || err?.message || 'Unknown error'), 'error');
            setReturnSaleId(null);
        } finally {
            setReturnSaleLoading(false);
        }
    };

    // Load products when category changes (or on mount/reset)
    useEffect(() => {
        fetchCategoryProducts(selectedCategory);
    }, [selectedCategory, isOnline]);

    useEffect(() => {
        const handleRefresh = () => {
            // Re-fetch featured/all products to update stock display
            fetchCategoryProducts(selectedCategory);
        };
        window.addEventListener('amd:refresh-products', handleRefresh);
        return () => window.removeEventListener('amd:refresh-products', handleRefresh);
    }, [selectedCategory]);

    // Load parked sales and categories on mount
    useEffect(() => {
        loadParkedSales();
        loadCategories();
    }, []);

    // Global Keyboard Auto-Focus on Search input when not focused elsewhere
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            const activeElement = document.activeElement;
            const isInputFocused = activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' || 
                activeElement.isContentEditable
            );

            // Capture printable keys (length 1) when no input is focused, excluding modifiers/functional keys
            if (!isInputFocused && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                const searchInput = document.querySelector('#tour-pos-product input');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    // Cart Auto-Scroll to Bottom on New Item Addition
    useEffect(() => {
        if (cartListRef.current) {
            cartListRef.current.scrollTo({
                top: cartListRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [activeSale.cart.length]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (parkedDropdownRef.current && !parkedDropdownRef.current.contains(event.target)) {
                setParkedDropdownOpen(false);
            }
            if (recentDropdownRef.current && !recentDropdownRef.current.contains(event.target)) {
                setShowRecentInvoices(false);
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

    // Auto-Fill Cash Logic — respects pos_auto_fill_cash setting and only fills when payment method is 'cash'
    useEffect(() => {
        const isEnabled = settings?.pos_auto_fill_cash === '1' || settings?.pos_auto_fill_cash === true || settings?.pos_auto_fill_cash === 1;
        if (isEnabled && paymentMethod === 'cash' && activeSale.cart.length > 0) {
            updateActiveSale({ cashReceived: cartTotal });
        }
    }, [cartTotal, paymentMethod, settings?.pos_auto_fill_cash]);

    return (
        <>
            <div className="h-full w-full flex flex-col pl-3 pr-0 pb-0 pt-3 animate-in fade-in zoom-in-95 duration-slow">
            {/* TOP BAR */}
            <div className="h-10 flex items-end gap-1 shrink-0 px-2 select-none">
                {sales.map(sale => (
                    <div
                        key={sale.id}
                        onClick={() => setActiveSaleId(sale.id)}
                        className={`
                            group relative min-w-[160px] max-w-[240px] h-9 px-4 rounded-t-xl flex items-center justify-between cursor-pointer transition-all duration-normal
                            ${activeSaleId === sale.id
                                ? 'bg-surface text-brand-600 font-bold shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-10 h-10 pb-1'
                                : 'bg-sunken/50 dark:bg-surface text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover mb-1'
                            }
`}
                    >
                        <span className="text-xs truncate flex-1">Sale #{sale.id}</span>
                        <button
                            onClick={(e) => closeSale(e, sale.id)}
                            className={`ml-1 flex items-center justify-center w-5 h-5 rounded-md transition-all ${activeSaleId === sale.id
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 opacity-100'
                                    : 'opacity-0 group-hover:opacity-100 text-ink-muted hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600'
                                }`}
                        >
                            <X size={10} strokeWidth={3} />
                        </button>
                        {activeSaleId === sale.id && (
                            <div className="absolute -bottom-1 left-0 right-0 h-2 bg-surface z-20"></div>
                        )}
                    </div>
                ))}
                <button onClick={createNewSale} className="h-8 w-8 mb-1 rounded-full hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-muted flex items-center justify-center transition-colors">
                    <Plus size={18} />
                </button>

                {/* Parked Sales & Status - Side by Side */}
                <div className="ml-auto mr-2 relative flex items-center gap-2" ref={parkedDropdownRef}>
                    {/* Senior Mode Toggle */}
                    <button
                        onClick={() => setSeniorMode(!seniorMode)}
                        className={`h-8 px-3 rounded-full flex items-center gap-1.5 transition-all text-xs font-bold border ${
                            seniorMode 
                                ? 'bg-brand-50 text-brand-600 border-brand-200 dark:bg-brand-950/40 dark:text-brand-400 dark:border-brand-800'
                                : 'bg-sunken hover:bg-interactive-hover dark:bg-surface dark:hover:bg-interactive-hover text-ink-muted border-transparent'
                        }`}
                        title="Toggle Senior Mode for larger text"
                    >
                        <span className="relative flex h-2 w-2">
                            {seniorMode && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${seniorMode ? 'bg-brand-500' : 'bg-neutral-400'}`}></span>
                        </span>
                        <span>Senior Mode</span>
                    </button>

                    {/* Return Mode Toggle */}
                    <button
                        onClick={() => {
                            const entering = !returnMode;
                            setReturnMode(entering);
                            setReturnSaleRef('');
                            setReturnSaleId(null);
                            if (entering && posReturnMode !== 'open') {
                                updateActiveSale({ cart: [], customer: null });
                            }
                        }}
                        className={`h-8 px-3 rounded-full flex items-center gap-1.5 transition-all text-xs font-bold border ${
                            returnMode
                                ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
                                : 'bg-sunken hover:bg-interactive-hover dark:bg-surface dark:hover:bg-interactive-hover text-ink-muted border-transparent'
                        }`}
                        title="Toggle Return Mode"
                    >
                        <span className="relative flex h-2 w-2">
                            {returnMode && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${returnMode ? 'bg-red-500' : 'bg-neutral-400'}`}></span>
                        </span>
                        <span>Return Mode</span>
                    </button>

                    <button
                        onClick={() => {
                            setParkedDropdownOpen(!parkedDropdownOpen);
                            if (!parkedDropdownOpen) loadParkedSales();
                        }}
                        className="h-8 px-3 rounded-full hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-muted flex items-center gap-2 transition-colors text-xs font-bold"
                    >
                        <Pause size={14} />
                        <span>Parked ({parkedSales.length})</span>
                    </button>

                    {/* Recent Invoices Toggle */}
                    <div className="relative" ref={recentDropdownRef}>
                        <button
                            onClick={() => {
                                setShowRecentInvoices(!showRecentInvoices);
                                if (!showRecentInvoices) loadRecentInvoices();
                            }}
                            className="h-8 px-3 rounded-full hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-muted flex items-center gap-2 transition-colors text-xs font-bold"
                            title="Recent Invoices"
                        >
                            <History size={14} />
                            <span>Recent</span>
                        </button>

                        {showRecentInvoices && (
                            <div className="absolute top-full right-0 mt-2 w-80 bg-surface rounded-xl shadow-2xl border border-line z-50 overflow-hidden">
                                <div className="p-3 border-b border-line bg-app flex justify-between items-center">
                                    <h3 className="font-bold text-ink text-sm">Recent Invoices</h3>
                                    {loadingRecent && <div className="animate-spin w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full"></div>}
                                </div>
                                {recentInvoices.length === 0 && !loadingRecent ? (
                                    <div className="p-8 text-center text-ink-muted text-xs">
                                        No recent invoices found.
                                    </div>
                                ) : (
                                    <div className="max-h-64 overflow-y-auto">
                                        {recentInvoices.map(sale => (
                                            <div
                                                key={sale.id}
                                                className="p-4 hover:bg-interactive-hover dark:hover:bg-interactive-hover border-b border-line last:border-0 transition-colors flex items-center justify-between"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-bold text-ink text-sm">
                                                        {sale.customer ? sale.customer.name : 'Walk-in Customer'}
                                                    </p>
                                                    <p className="text-xs text-ink-muted">
                                                        #{sale.reference_number || sale.id} · {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <p className="text-xs font-bold text-ink-secondary mt-1">
                                                        {formatCurrency(sale.total || 0, store || settings)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const printType = settings?.default_print_type || 'thermal';
                                                        PrintService.quickPrint(sale, printType, settings);
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-800/40 text-brand-600 dark:text-brand-400 transition-colors"
                                                    title="Print Receipt"
                                                >
                                                    <Printer size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Offline Indicator */}
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isOnline ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                        <span>{isOnline ? 'Online' : 'Offline'}</span>
                    </div>

                    {/* Hardware Status Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isStationConnected ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' : 'bg-sunken text-ink-muted dark:bg-surface dark:text-ink-muted'}`}>
                        <Printer size={14} />
                        <span>{isStationConnected ? 'Hardware Active' : 'No Printer Device'}</span>
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
                        <div className="absolute top-full right-0 mt-2 w-80 bg-surface rounded-xl shadow-2xl border border-line z-50 overflow-hidden">
                            <div className="p-3 border-b border-line bg-app">
                                <h3 className="font-bold text-ink text-sm">Parked Sales</h3>
                            </div>
                            {parkedSales.length === 0 ? (
                                <div className="p-8 text-center text-ink-muted text-xs">
                                    No parked sales found.
                                </div>
                            ) : (
                                <div className="max-h-64 overflow-y-auto">
                                    {parkedSales.map(parked => (
                                        <div
                                            key={parked.id}
                                            onClick={() => handleRecallSale(parked.id)}
                                            className="p-4 hover:bg-interactive-hover dark:hover:bg-interactive-hover cursor-pointer border-b border-line last:border-0 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className="font-bold text-ink text-sm">
                                                        {parked.customer_name || 'Walk-in Customer'}
                                                    </p>
                                                    <p className="text-xs text-ink-muted">
                                                        {parked.items_count} {parked.items_count === 1 ? 'item' : 'items'} · {formatCurrency(parked.total || 0, store || settings)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteParked(parked.id, e)}
                                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-ink-muted hover:text-red-600 transition-colors"
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

            {/* Mobile Tab Bar */}
            <div className="lg:hidden flex border-b border-line bg-app shrink-0">
                {[['catalog','Catalog'],['cart','Cart'],['checkout','Pay']].map(([tab, label]) => (
                    <button key={tab} onClick={() => setActiveMobileTab(tab)}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors
                            ${activeMobileTab === tab
                                ? 'text-brand-600 border-b-2 border-brand-600'
                                : 'text-ink-muted'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* MAIN WORKSPACE */}
            <div className="flex-1 flex gap-0 min-h-0 bg-app rounded-t-3xl rounded-b-none shadow-sm border border-line overflow-hidden z-0 relative">

                {/* LEFT: Transaction List */}
                <div className={`w-full lg:w-[40%] flex flex-col min-w-0 relative ${activeMobileTab !== 'catalog' ? 'hidden lg:flex' : ''}`}>
                    {/* Search Bar */}
                    <div className="h-14 px-3 border-b border-line flex items-center gap-3 bg-sunken/50 dark:bg-surface relative z-20">
                        <button
                            onClick={() => { setSearchQueryForProduct(activeSale.searchTerm); setShowProductModal(true); }}
                            className="w-9 h-9 rounded-xl bg-surface border-2 border-dashed border-line dark:border-line flex items-center justify-center text-ink-muted hover:text-brand-500 hover:border-brand-500 transition-colors shrink-0"
                            title="Quick Add Product"
                        >
                            <PackagePlus size={16} />
                        </button>
                        <div id="tour-pos-product" className="flex-1 relative">
                            <AsyncProductCombobox
                                defaultOptions={categoryProducts}
                                value={activeSale.searchTerm}
                                onQueryChange={(val) => updateActiveSale({ searchTerm: val })}
                                onSelect={(product) => handleProductSelect(product)}
                                placeholder="Scan Barcode or Search Item..."
                                onKeyDown={handleSearchInputKeyDown}
                                inputClassName="pl-9 pr-9 h-9 text-sm font-bold"
                                onCreateNew={() => { setSearchQueryForProduct(activeSale.searchTerm); setShowProductModal(true); }}
                                hideCostAndMargin={true}
                                hideSearchIcon={true}
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none z-10">
                                <ScanBarcode size={16} />
                            </div>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none z-10">
                                <Search size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Horizontal Categories Bar & Vertical Product Rows */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        
                        {/* Categories Horizontal List Wrapper */}
                        <div className="flex items-center bg-surface border-b border-line px-3 py-2 gap-2 select-none shrink-0 relative">
                            {/* Scroll Left Button */}
                            <button 
                                onClick={() => scrollCategories('left')}
                                className="w-6 h-6 rounded-full hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-muted flex items-center justify-center shrink-0 border border-line shadow-sm"
                            >
                                <ChevronLeft size={14} />
                            </button>

                            {/* Categories Horizontal List */}
                            <div 
                                ref={categoryScrollRef}
                                onWheel={handleCategoryWheel}
                                className="flex-1 flex gap-2 overflow-x-auto scrollbar-none scroll-smooth px-1"
                                style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }} // Hide scrollbars
                            >
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`px-3 py-1.5 rounded-full text-1xs font-bold transition-all shrink-0 border ${
                                        selectedCategory === null
                                            ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                                            : 'bg-sunken text-ink-secondary border-line hover:bg-interactive-hover dark:hover:bg-interactive-hover'
                                    }`}
                                >
                                    All
                                </button>
                                {categories.filter(cat => (cat.products_count > 0 || cat.product_count > 0)).map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`px-3 py-1.5 rounded-full text-1xs font-bold transition-all shrink-0 border flex items-center gap-1.5 ${
                                            selectedCategory === cat.id
                                                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                                                : 'bg-sunken text-ink-secondary border-line hover:bg-interactive-hover dark:hover:bg-interactive-hover'
                                        }`}
                                    >
                                        <span>{cat.name}</span>
                                        <span className={`text-3xs px-1 py-0.2 rounded-full shrink-0 ${
                                            selectedCategory === cat.id 
                                                ? 'bg-white/20 text-white' 
                                                : 'bg-sunken text-ink-muted'
                                        }`}>
                                            {cat.products_count ?? cat.product_count ?? 0}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Scroll Right Button */}
                            <button 
                                onClick={() => scrollCategories('right')}
                                className="w-6 h-6 rounded-full hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-muted flex items-center justify-center shrink-0 border border-line shadow-sm"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>

                        {/* Product Rows List Container */}
                        <div className="flex-1 flex flex-col bg-app overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                {isLoadingProducts ? (
                                    <div className="h-full flex flex-col items-center justify-center text-ink-muted gap-4">
                                        <div className="w-12 h-12 border-4 border-brand-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                        <p className="font-bold text-sm">Loading products...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedCategory && categoryProducts.length === 0 ? (
                                            <div className="py-20 text-center">
                                                <Archive className="mx-auto text-neutral-300 mb-4" size={48} />
                                                <p className="text-ink-muted font-bold">No products in this category</p>
                                            </div>
                                        ) : (
                                            Array.isArray(categoryProducts) && categoryProducts.map(product => (
                                                <button
                                                    key={product.id}
                                                    onClick={() => {
                                                        if (returnMode && posReturnMode !== 'open') {
                                                            addToast('In Return Mode, use the reference number to load items.', 'error');
                                                            return;
                                                        }
                                                        handleProductSelect(product);
                                                    }}
                                                    className="w-full bg-surface rounded-2xl border-2 border-transparent hover:border-brand-500 transition-all shadow-sm hover:shadow-md text-left flex items-center justify-between p-3 gap-3 active:scale-98 relative overflow-hidden"
                                                >
                                                    {/* Left Section: Image and Name */}
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className="w-12 h-12 rounded-xl bg-sunken flex items-center justify-center overflow-hidden shrink-0">
                                                            {product.image_url || product.image_path ? (
                                                                <img src={product.image_url || product.image_path} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Package className="text-ink-muted" size={20} />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <h4 className="font-bold text-ink leading-snug break-words text-lg">
                                                                {product.name}
                                                            </h4>
                                                            <span className="text-2xs text-ink-muted font-bold uppercase tracking-wider block mt-0.5">
                                                                {product.category?.name || product.category_name || 'General'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Right Section: Stock Qty and Price */}
                                                    <div className="text-right shrink-0 flex items-center gap-4">
                                                        <div>
                                                            <span className="text-4xs font-bold text-ink-muted uppercase tracking-wider block mb-0.5 leading-none">Stock</span>
                                                            <span className={`text-xs font-bold leading-none ${product.stock_quantity > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                {formatNumber(product.stock_quantity || 0, 0)}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-[75px]">
                                                            <span className="text-4xs font-bold text-ink-muted uppercase tracking-wider block mb-0.5 leading-none">Price</span>
                                                            <span className="font-bold text-sky-500 dark:text-sky-400 block leading-none text-lg">
                                                                {formatCurrency(product.price || product.selling_price || 0, store || settings)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {product.variants && product.variants.length > 0 && (
                                                        <div className="absolute top-1.5 right-1.5 flex gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></div>
                                                        </div>
                                                    )}
                                                </button>
                                            ))
                                        )}

                                        {/* Show instructional message if no category selected AND no products loaded */}
                                        {!selectedCategory && categoryProducts.length === 0 && (
                                            <div className="py-20 flex flex-col items-center justify-center text-ink-muted gap-4 opacity-50">
                                                <div className="w-20 h-20 rounded-2xl bg-sunken dark:bg-surface flex items-center justify-center">
                                                    <Search size={32} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-lg text-ink-secondary dark:text-white">Start Selling</p>
                                                    <p className="text-sm font-medium">Select a category or browse all items</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                </div>

                {/* RIGHT: Cart & Payment Panel */}
                <div className={`w-full lg:w-[40%] shrink-0 flex flex-col bg-app border-l border-line ${activeMobileTab !== 'cart' ? 'hidden lg:flex' : ''}`}>

                    {/* Cart Header */}
                    <div className="h-14 px-3 bg-sunken/50 dark:bg-surface border-b border-line flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-ink flex items-center gap-2 text-sm">
                                <ShoppingCart size={18} className="text-brand-600" />
                                CURRENT ORDER
                            </h3>
                            
                            {/* Free Qty Toggle Button */}
                            {hasDiscountPerm && (
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={showFreeQty}
                                            onChange={(e) => setShowFreeQty(e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-8 h-4 rounded-full transition-colors ${showFreeQty ? 'bg-emerald-500' : 'bg-sunken'}`}></div>
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showFreeQty ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                    <span className="text-2xs font-bold text-ink-muted">FREE QTY</span>
                                </label>
                            )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg font-bold text-2xs bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400`}>
                            {activeSale.cart.length} ITEMS • {activeSale.cart.reduce((sum, item) => sum + item.qty + (item.freeQuantity || 0), 0)} QTY
                        </span>
                    </div>

                    {returnMode && (
                        <div className="mx-3 mb-2 mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                            <p className="text-xs font-bold text-red-500 mb-2 uppercase tracking-wider">⚠ Return Mode Active</p>
                            {posReturnMode === 'open' ? (
                                <div className="space-y-2">
                                    <p className="text-2xs text-red-400 mb-2">Add items to return. Optionally enter a reference number to link to the original sale.</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={returnSaleRef}
                                            onChange={e => setReturnSaleRef(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && returnSaleRef.trim() && lookupSaleForReturn()}
                                            placeholder="Reference number (optional)..."
                                            className="flex-1 px-3 py-1.5 text-xs bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder:text-ink-muted outline-none focus:border-red-400"
                                        />
                                        {returnSaleRef.trim() && (
                                            <button
                                                onClick={lookupSaleForReturn}
                                                disabled={returnSaleLoading}
                                                className="px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                                            >
                                                {returnSaleLoading ? '...' : 'Load'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : posReturnMode === 'customer_or_reference' ? (
                                <div className="space-y-2">
                                    <p className="text-2xs text-red-400 mb-2">Search by customer or enter a reference number.</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={returnSaleRef}
                                            onChange={e => setReturnSaleRef(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && lookupSaleForReturn()}
                                            placeholder="Reference number or customer name/phone..."
                                            className="flex-1 px-3 py-1.5 text-xs bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder:text-ink-muted outline-none focus:border-red-400"
                                        />
                                        <button
                                            onClick={lookupSaleForReturn}
                                            disabled={returnSaleLoading}
                                            className={`px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 ${!returnSaleRef.trim() ? 'animate-pulse' : ''}`}
                                        >
                                            {returnSaleLoading ? '...' : 'Load'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-2xs text-red-400 mb-2">Enter the original sale reference number to load items for return.</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={returnSaleRef}
                                            onChange={e => setReturnSaleRef(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && lookupSaleForReturn()}
                                            placeholder="Enter sale reference number..."
                                            className="flex-1 px-3 py-1.5 text-xs bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder:text-ink-muted outline-none focus:border-red-400"
                                        />
                                        <button
                                            onClick={lookupSaleForReturn}
                                            disabled={returnSaleLoading}
                                            className={`px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 ${!returnSaleRef.trim() ? 'animate-pulse' : ''}`}
                                        >
                                            {returnSaleLoading ? '...' : 'Load'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cart List (Moved from Left) */}
                    <div ref={cartListRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {activeSale.cart.map((item, index) => (
                            <div key={item.cartItemId} className="bg-surface px-3 py-2.5 rounded-2xl border border-line shadow-sm flex items-center justify-between gap-3 text-xs relative group overflow-hidden">
                                {/* Left Section: Index, name, category, stock warning */}
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <span className="text-2xs font-bold text-ink-muted bg-sunken rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                                        {index + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-ink text-sm leading-snug break-words">
                                            {item.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-3xs text-ink-muted font-bold uppercase tracking-wider">
                                                {item.category}
                                            </span>
                                            {item.qty > item.stock && (
                                                <span className="text-3xs font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-1 py-0.5 rounded animate-pulse">
                                                    ⚠️ Over Stock ({item.stock})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Price & Action Buttons */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="flex flex-col items-end">
                                        {hasDiscountPerm ? (
                                            <button
                                                onClick={() => openItemDiscountModal(item)}
                                                className="text-1xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-1 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-all flex flex-col items-end min-w-[55px] leading-tight"
                                            >
                                                {item.discount > 0 ? (
                                                    <>
                                                        <span className="line-through text-3xs text-ink-muted opacity-70">{formatCurrency(item.original_price, store || settings)}</span>
                                                        <span>{formatCurrency(item.price, store || settings)}</span>
                                                    </>
                                                ) : (
                                                    formatCurrency(item.price, store || settings)
                                                )}
                                            </button>
                                        ) : (
                                            <span className="text-1xs font-bold text-ink">
                                                {formatCurrency(item.price, store || settings)}
                                            </span>
                                        )}
                                        {item.discount > 0 && (
                                            <span className="text-3xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                Disc: -{formatCurrency(item.discount, store || settings)}
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => openConverterModal(item)}
                                        title="Edit Price / Qty / Total"
                                        className="text-1xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all"
                                    >
                                        ⇄
                                    </button>
                                </div>

                                {/* Qty & Free Qty Controls */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Regular Qty */}
                                    <div className="flex items-center bg-app p-0.5 rounded-xl border border-line">
                                        <button
                                            onClick={() => updateQty(item.cartItemId, -1)}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-interactive-hover text-ink-muted transition-all active:scale-90"
                                        >
                                            <MinusCircle size={15} />
                                        </button>
                                        <span className="w-7 text-center font-bold text-xs text-ink">
                                            {item.qty}
                                        </span>
                                        <button
                                            onClick={() => updateQty(item.cartItemId, 1)}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-interactive-hover text-ink-muted transition-all active:scale-90"
                                        >
                                            <PlusCircle size={15} />
                                        </button>
                                    </div>

                                    {/* Free Qty Controls */}
                                    {hasDiscountPerm && showFreeQty && (
                                        <div className="flex items-center bg-emerald-50 dark:bg-emerald-900/20 p-0.5 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                                            <button
                                                onClick={() => updateFreeQty(item.cartItemId, -1)}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-interactive-hover text-emerald-600 dark:text-emerald-400 transition-all active:scale-90"
                                            >
                                                <MinusCircle size={15} />
                                            </button>
                                            <div className="flex flex-col items-center w-7 leading-none">
                                                <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400">
                                                    {item.freeQuantity || 0}
                                                </span>
                                                <span className="text-[7px] font-bold text-emerald-500 uppercase">FREE</span>
                                            </div>
                                            <button
                                                onClick={() => updateFreeQty(item.cartItemId, 1)}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-interactive-hover text-emerald-600 dark:text-emerald-400 transition-all active:scale-90"
                                            >
                                                <PlusCircle size={15} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Right Section: Line Total & Trash */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="text-right min-w-[75px]">
                                        <span className="text-4xs font-bold text-ink-muted uppercase tracking-wider block leading-none mb-0.5">Line Total</span>
                                        <span className="font-bold text-ink text-sm block leading-none">
                                            {formatCurrency(item.price * item.qty, store || settings)}
                                        </span>
                                        {(settings?.show_margin_percentage === '1' || settings?.show_margin_percentage === true) && item.cost_price > 0 && (
                                            <span className="text-4xs font-bold text-emerald-600 dark:text-emerald-400 block leading-none mt-0.5">
                                                Margin: {Math.round(((item.price - item.cost_price) / item.price) * 100)}%
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.cartItemId)}
                                        className="text-ink-muted hover:text-red-500 transition-colors p-1"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {activeSale.cart.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-ink-muted opacity-40 py-20">
                                <ShoppingCart size={64} strokeWidth={1} className="mb-4" />
                                <p className="font-bold text-lg">Your cart is empty</p>
                                <p className="text-sm">Start adding products to create a sale</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Payment & Summary Panel */}
                <div className={`w-full lg:w-[20%] shrink-0 bg-app text-ink flex flex-col shadow-2xl relative overflow-hidden border-l border-line ${activeMobileTab !== 'checkout' ? 'hidden lg:flex' : ''}`}>
                    <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-10 pointer-events-none"></div>

                    <div className="h-14 px-4 bg-sunken/50 dark:bg-surface border-b border-line flex items-center justify-between">
                        <h2 className="font-bold text-ink flex items-center gap-2 text-sm uppercase">
                            <Receipt size={18} className="text-emerald-600 dark:text-emerald-400" /> Payment Details
                        </h2>
                        <span className="px-2 py-0.5 rounded-lg font-bold text-2xs bg-sunken dark:bg-surface text-ink-secondary border border-line dark:border-line">
                            #{activeSale.id}
                        </span>
                    </div>

                    <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                        {/* 1. Customer Search Row - Full Width to prevent clipping (At the very top) */}
                        <div id="tour-pos-customer" className="relative z-sticky">
                            {customerDropdownOpen ? (
                                <div className="animate-in slide-in-from-top-2 duration-normal">
                                    <AsyncPartyCombobox
                                        defaultOptions={initialCustomers}
                                        selectedItem={activeSale.customer}
                                        onSelect={(customer) => {
                                            selectCustomer(customer);
                                            setCustomerDropdownOpen(false);
                                        }}
                                        className="h-full"
                                        inputClassName="bg-white dark:bg-white/5 border-line dark:border-white/5 text-ink placeholder-slate-400 dark:placeholder-slate-500 focus:ring-emerald-500/50 h-14 shadow-sm"
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
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink dark:hover:text-white"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setCustomerDropdownOpen(true)}
                                    className="w-full bg-white dark:bg-white/5 p-4 rounded-xl text-left hover:bg-interactive-hover dark:hover:bg-white/10 transition-all border border-line dark:border-white/5 shadow-sm flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 transition-transform">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <label className="text-2xs uppercase font-bold text-ink-muted block mb-0.5">Customer / Party</label>
                                            <span className="text-sm font-bold text-ink">
                                                {activeSale.customer?.name || 'Walk-in Customer'}
                                            </span>
                                        </div>
                                    </div>
                                    <Search size={18} className="text-ink-muted group-hover:text-brand-500 transition-colors" />
                                </button>
                            )}
                        </div>

                        {/* 2. Discount & Payment Method Row */}
                        <div className="flex gap-2">
                            {/* Discount Button */}
                            {hasDiscountPerm && (
                                <div className="flex-1">
                                    <button
                                        onClick={() => {
                                            setGlobalDiscountModal({
                                                show: true,
                                                type: activeSale.discountType || 'fixed',
                                                value: activeSale.discountValue ? String(activeSale.discountValue) : ''
                                            });
                                        }}
                                        className="w-full bg-white dark:bg-white/5 p-3 rounded-xl text-left hover:bg-interactive-hover dark:hover:bg-white/10 transition-colors border border-line dark:border-white/5 shadow-sm h-16 flex flex-col justify-center"
                                    >
                                        <label className="text-3xs uppercase font-bold text-ink-muted block mb-0.5">Discount</label>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-500 flex items-center justify-center text-2xs font-bold">%</div>
                                            <span className="text-xs font-bold text-ink truncate">
                                                {activeSale.discountType === 'percentage'
                                                    ? `${activeSale.discountValue}% (${formatCurrency(globalDiscount, store || settings)})`
                                                    : `${formatCurrency(globalDiscount, store || settings)}`
                                                }
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {/* Payment Method Selector */}
                            <div className="flex-1">
                                <div className="group relative h-full">
                                    <button 
                                        onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
                                        className="w-full bg-white dark:bg-white/5 p-3 rounded-xl text-left hover:bg-interactive-hover dark:hover:bg-white/10 transition-colors border border-line dark:border-white/5 shadow-sm h-16 flex flex-col justify-center"
                                    >
                                        <label className="text-3xs uppercase font-bold text-ink-muted block mb-0.5">Method</label>
                                        <div className="flex items-center gap-1.5">
                                            <CreditCard size={14} className="text-brand-600 dark:text-brand-400 shrink-0" />
                                            <span className="text-xs font-bold text-ink uppercase truncate">{paymentMethod}</span>
                                        </div>
                                    </button>
                                    {/* Dropdown - Click to toggle */}
                                    {paymentDropdownOpen && (
                                        <div className="absolute top-full right-0 mt-1 w-36 bg-surface rounded-xl shadow-2xl border border-line overflow-hidden z-sticky animate-in slide-in-from-top-2 duration-normal">
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
                                                        className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors uppercase ${paymentMethod === method ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' : 'text-ink-secondary'}`}
                                                    >
                                                        {method}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 3. Bank Account Selector (Conditional for Bank/Card/Online) */}
                        {['bank', 'card', 'online'].includes(paymentMethod) && (
                            bankAccounts.length > 0 ? (
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner animate-in fade-in slide-in-from-top-1 duration-normal">
                                    <div className="flex justify-between items-center mb-2 px-1">
                                        <label className="text-2xs uppercase font-bold text-ink-muted block">Deposit To Account</label>
                                        <button 
                                            onClick={() => setShowQuickAccountModal(true)}
                                            className="text-3xs font-bold text-brand-400 hover:text-brand-300 transition-colors"
                                        >
                                            + Add New
                                        </button>
                                    </div>
                                                                    <div className="relative">
                                        <button 
                                            type="button"
                                            onClick={() => setBankAccountDropdownOpen(!bankAccountDropdownOpen)}
                                            className="w-full bg-neutral-800/50 border border-white/5 rounded-xl py-2.5 px-3 text-xs font-bold text-white focus:ring-2 focus:ring-brand-500/50 outline-none flex items-center justify-between cursor-pointer"
                                        >
                                            <span>
                                                {bankAccounts.find(acc => String(acc.id) === String(selectedBankAccountId))?.name || 'Select Account'}
                                                {bankAccounts.find(acc => String(acc.id) === String(selectedBankAccountId))?.code ? ` (${bankAccounts.find(acc => String(acc.id) === String(selectedBankAccountId))?.code})` : ''}
                                            </span>
                                            <span className="text-ink-muted font-bold ml-1">▼</span>
                                        </button>
                                        
                                        {bankAccountDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-surface rounded-xl shadow-2xl border border-line overflow-hidden z-sticky animate-in slide-in-from-top-2 duration-normal max-h-48 overflow-y-auto">
                                                {bankAccounts.map(acc => (
                                                    <button
                                                        key={acc.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedBankAccountId(acc.id);
                                                            setBankAccountDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors ${String(selectedBankAccountId) === String(acc.id) ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' : 'text-ink-secondary'}`}
                                                    >
                                                        {acc.name} {acc.code ? `(${acc.code})` : ''}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 animate-in shake duration-slow">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle size={14} className="text-rose-500" />
                                        <span className="text-2xs uppercase font-bold text-rose-500">No Bank Accounts Found</span>
                                    </div>
                                    <p className="text-1xs text-ink-muted mb-3 leading-tight">
                                        You need at least one bank/online account to receive digital payments.
                                    </p>
                                    <button 
                                        onClick={() => setShowQuickAccountModal(true)}
                                        className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} /> 
                                        <span>Create Bank Account</span>
                                    </button>
                                </div>
                            )
                        )}

                        {/* 4. Summary Block - Now Positioned before Amount Tendered */}
                        <div className="space-y-2 bg-sunken dark:bg-white/5 p-3 rounded-xl">
                            <div className="flex justify-between text-ink-muted text-xs">
                                <span>Subtotal</span>
                                <span className="text-ink">{formatCurrency(subtotal, store || settings)}</span>
                            </div>
                            {totalDiscounts > 0 && (
                                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                    <span>
                                        Discount 
                                        {activeSale.discountType === 'percentage' && ` (${activeSale.discountValue}%)`}
                                    </span>
                                    <span>-{formatCurrency(totalDiscounts, store || settings)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-ink-muted text-xs">
                                <span>Tax</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => updateActiveSale({ taxInclusive: !taxInclusive })}
                                        className={`text-3xs font-bold uppercase px-1.5 py-0.5 rounded border transition-colors cursor-pointer mr-1 ${
                                            taxInclusive 
                                                ? 'bg-brand-50 border-brand-200 text-brand-600 dark:bg-brand-950/30 dark:border-brand-900/50 dark:text-brand-400' 
                                                : 'bg-sunken border-line text-ink-muted dark:bg-app dark:border-line'
                                        }`}
                                    >
                                        {taxInclusive ? 'Inclusive' : 'Exclusive'}
                                    </button>
                                    <div className="relative">
                                        <button 
                                            type="button"
                                            onClick={() => setTaxDropdownOpen(!taxDropdownOpen)}
                                            className="bg-transparent hover:bg-interactive-hover dark:hover:bg-white/10 px-2 py-1 rounded-lg text-ink font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                        >
                                            <span>
                                                {taxRate === 0 
                                                    ? 'None (0%)' 
                                                    : (parsedTaxRates.find(t => parseFloat(t.rate) === parseFloat(taxRate))?.name + ` (${taxRate}%)` || `${taxRate}%`)
                                                }
                                            </span>
                                            <span className="text-ink-muted text-2xs">▼</span>
                                        </button>
                                        
                                        {taxDropdownOpen && (
                                            <div className="absolute right-0 bottom-full mb-1 w-40 bg-surface rounded-xl shadow-2xl border border-line overflow-hidden z-sticky animate-in slide-in-from-bottom-2 duration-normal">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        updateActiveSale({ taxRate: 0 });
                                                        setTaxDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors ${taxRate === 0 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' : 'text-ink-secondary'}`}
                                                >
                                                    None (0%)
                                                </button>
                                                {parsedTaxRates.map((tax) => (
                                                    <button
                                                        key={tax.id}
                                                        type="button"
                                                        onClick={() => {
                                                            updateActiveSale({ taxRate: parseFloat(tax.rate) || 0 });
                                                            setTaxDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors ${parseFloat(taxRate) === parseFloat(tax.rate) ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' : 'text-ink-secondary'}`}
                                                    >
                                                        {tax.name} ({tax.rate}%)
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-ink font-bold">{formatCurrency(taxAmount, store || settings)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-ink-muted text-xs mt-2">
                                <span>Fulfillment</span>
                                <button
                                    type="button"
                                    onClick={() => updateActiveSale({ is_dropship: !(activeSale.is_dropship || false) })}
                                    className={`text-2xs font-bold uppercase px-2 py-1 rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                                        activeSale.is_dropship 
                                            ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-400' 
                                            : 'bg-sunken border-line text-ink-muted dark:bg-app dark:border-line'
                                    }`}
                                >
                                    <Truck size={12} />
                                    {activeSale.is_dropship ? 'Dropship' : 'Local Stock'}
                                </button>
                            </div>
                            <div className="h-px bg-sunken dark:bg-white/10 my-2"></div>
                            <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 text-2xl">
                                <span>Total</span>
                                <span>{formatCurrency(cartTotal, store || settings)}</span>
                            </div>
                        </div>

                        {/* 5. Amount Tendered Section with inline Split Payment button */}
                        <div className="space-y-3">
                            <div id="tour-pos-paid" className="bg-white dark:bg-white/5 p-4 rounded-xl border border-line dark:border-white/5 shadow-sm transition-all">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs uppercase font-bold text-ink-muted flex items-center gap-1.5">
                                        {returnMode ? 'AMOUNT TO REFUND' : 'Amount Tendered'}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setPaymentModalOpen(true)}
                                            className="text-3xs font-bold text-brand-600 dark:text-brand-400 hover:underline uppercase tracking-wider"
                                            title="Open multi-method split payment options"
                                        >
                                            + Split Payment
                                        </button>
                                        <span className="text-2xs bg-sunken text-ink-secondary px-1.5 py-0.5 rounded font-bold">
                                            {paymentMethod.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-500 font-bold text-lg">{getCurrencySymbol(store || settings)}</span>
                                    <input
                                        ref={cashReceivedInputRef}
                                        type="number"
                                        value={activeSale.cashReceived}
                                        onChange={(e) => updateActiveSale({ cashReceived: e.target.value })}
                                        onKeyDown={handleTenderedKeyDown}
                                        placeholder="0.00"
                                        className="w-full bg-surface border border-line rounded-lg py-3 pl-8 pr-4 text-2xl font-bold text-ink placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all no-spinner shadow-inner"
                                        disabled={activeSale.cart.length === 0}
                                    />
                                    {/* Quick Exact Button */}
                                    <button
                                        onClick={() => updateActiveSale({ cashReceived: cartTotal })}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-sunken hover:bg-interactive-hover dark:bg-surface dark:hover:bg-interactive-hover text-xs text-ink-secondary px-2 py-1 rounded transition-colors border border-line dark:border-line font-bold"
                                    >
                                        Exact
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 6. Change Display (At the very bottom of main list) */}
                        {!returnMode && (
                            <div className={`p-4 rounded-xl border transition-colors ${changeDue >= 0
                                ? 'bg-emerald-500/10 border-emerald-500/20'
                                : 'bg-red-500/10 border-red-500/20'
                                }`}>
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs font-bold uppercase ${changeDue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {changeDue >= 0 ? 'Change Due' : 'Shortage'}
                                    </span>
                                    <span className={`text-2xl font-bold ${changeDue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatCurrency(Math.abs(changeDue), store || settings)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-sunken/50 dark:bg-black/20 backdrop-blur-sm space-y-2">
                        {/* Print Settings Toggle */}
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-ink-muted">Auto-print on complete</span>
                            <button
                                onClick={() => setPrintOnComplete(!printOnComplete)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${printOnComplete ? 'bg-emerald-500' : 'bg-neutral-600'}`}
                            >
                                <div className={`absolute top-1 ${printOnComplete ? 'right-1' : 'left-1'} w-4 h-4 bg-white rounded-full transition-all`}></div>
                            </button>
                        </div>

                        {returnMode ? (
                            <button
                                onClick={async () => {
                                    if (activeSale.cart.length === 0) { addToast('No items in cart', 'error'); return; }
                                    setReturnProcessing(true);
                                    try {
                                        if (posReturnMode === 'open') {
                                            // Open return — post to PosReturnController
                                            const response = await axios.post(route('store.pos.return.store', { store_slug: store?.slug }), {
                                                items: activeSale.cart.map(i => ({
                                                    product_id: i.id,
                                                    quantity: i.qty,
                                                    price: i.price,
                                                })),
                                                refund_method: 'cash',
                                                reason: 'POS Open Return',
                                            });
                                            addToast(`Return processed — Ref: ${response.data.reference}`, 'success');
                                            setReturnMode(false);
                                            updateActiveSale({ cart: [], customer: null });
                                        } else {
                                            if (!returnSaleId) {
                                                addToast('Please load a sale using the reference number first', 'error');
                                                setReturnProcessing(false);
                                                return;
                                            }
                                            await axios.post(route('store.sales.return', { store_slug: store?.slug, sale: returnSaleId }), {
                                                refund_method: 'cash',
                                                refund_source: 'cash_drawer',
                                                reason: 'POS return',
                                                items: activeSale.cart.map(i => ({ id: i.sale_item_id || i.id, quantity: i.qty })),
                                            });
                                            addToast('Return processed successfully', 'success');
                                            setReturnMode(false);
                                            setReturnSaleId(null);
                                            setReturnSaleRef('');
                                            updateActiveSale({ cart: [], customer: null });
                                        }
                                    } catch (err) {
                                        addToast(err.response?.data?.message || 'Return failed', 'error');
                                    } finally {
                                        setReturnProcessing(false);
                                    }
                                }}
                                disabled={returnProcessing || activeSale.cart.length === 0}
                                className="w-full py-4 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-all text-sm uppercase tracking-wider"
                            >
                                {returnProcessing ? 'Processing...' : '↩ Complete Return'}
                            </button>
                        ) : (
                            <button
                                id="tour-pos-checkout"
                                onClick={handleCheckoutClick}
                                disabled={processingPayment || activeSale.cart.length === 0}
                                className={`w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg  flex items-center justify-center gap-2 active:scale-95 transition-all ${processingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="flex items-center justify-center gap-2.5 w-full">
                                    {printOnComplete ? (
                                        <><Printer size={20} /> <span>{processingPayment ? 'Processing...' : 'Complete & Print'}</span></>
                                    ) : (
                                        <><Check size={20} /> <span>{processingPayment ? 'Processing...' : 'Complete Sale'}</span></>
                                    )}
                                    <span className="px-3 py-1 rounded-lg text-sm font-bold bg-white/20 border border-white/10 shrink-0 ml-1.5">
                                        {formatCurrency(cartTotal, store || settings)}
                                    </span>
                                </div>
                            </button>
                        )}

                        <div className="flex gap-3">
                            {!returnMode && (
                                <button
                                    onClick={handleParkBill}
                                    disabled={parkingBill || activeSale.cart.length === 0}
                                    className={`flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all ${parkingBill ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Pause size={18} /> {parkingBill ? 'Parking...' : 'Hold'}
                                </button>
                            )}

                            <button
                                onClick={() => updateActiveSale({ cart: [], cashReceived: '' })}
                                className="flex-1 py-3 bg-sunken hover:bg-interactive-hover dark:bg-white/5 dark:hover:bg-white/10 text-ink-secondary rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                                <X size={18} /> Cancel
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Bottom Bar - Shortcuts Strip (Moved Outside) */}
            <div className="bg-neutral-900 dark:bg-app border-t border-neutral-800 flex items-center justify-between px-6 py-1.5 text-1xs font-bold text-ink-muted shadow-lg shrink-0 z-10 select-none">
                <div className="flex items-center gap-1.5">
                    <span className="bg-neutral-800 text-white px-1.5 py-0.5 rounded text-3xs font-mono border border-neutral-700">F1</span>
                    <span>Search</span>
                </div>
                <div className="w-px h-4 bg-neutral-800"></div>
                <div className="flex items-center gap-1.5">
                    <span className="bg-neutral-800 text-white px-1.5 py-0.5 rounded text-3xs font-mono border border-neutral-700">F2</span>
                    <span>Qty</span>
                </div>
                <div className="w-px h-4 bg-neutral-800"></div>
                <div className="flex items-center gap-1.5">
                    <span className="bg-neutral-800 text-white px-1.5 py-0.5 rounded text-3xs font-mono border border-neutral-700">F3</span>
                    <span>Item Disc</span>
                </div>
                <div className="w-px h-4 bg-neutral-800"></div>
                <div className="flex items-center gap-1.5">
                    <span className="bg-neutral-800 text-white px-1.5 py-0.5 rounded text-3xs font-mono border border-neutral-700">F4</span>
                    <span>Remove</span>
                </div>
                <div className="w-px h-4 bg-neutral-800"></div>
                <div className="flex items-center gap-1.5">
                    <span className="bg-neutral-800 text-white px-1.5 py-0.5 rounded text-3xs font-mono border border-neutral-700">F5</span>
                    <span>Price</span>
                </div>
                <div className="w-px h-4 bg-neutral-800"></div>
                <div className="flex items-center gap-1.5">
                    <span className="bg-neutral-800 text-white px-1.5 py-0.5 rounded text-3xs font-mono border border-neutral-700">F11</span>
                    <span>Customer</span>
                </div>
                <div className="w-px h-4 bg-neutral-800"></div>
                <div className="flex items-center gap-1.5">
                    <span className="bg-neutral-800 text-white px-1.5 py-0.5 rounded text-3xs font-mono border border-neutral-700">F12</span>
                    <span>Remarks</span>
                </div>
                <div className="w-px h-4 bg-neutral-800"></div>
                <div className="flex items-center gap-1.5">
                    <span className="bg-neutral-800 text-white px-1.5 py-0.5 rounded text-3xs font-mono border border-neutral-700">^S</span>
                    <span>Save</span>
                </div>
                <div className="w-px h-4 bg-neutral-800"></div>
                <div className="flex items-center gap-1.5">
                    <span className="bg-neutral-800 text-white px-1.5 py-0.5 rounded text-3xs font-mono border border-neutral-700">^P</span>
                    <span>Print</span>
                </div>
                <div className="w-px h-4 bg-neutral-800"></div>
                <div className="flex items-center gap-1.5">
                    <span className="bg-neutral-800 text-white px-1.5 py-0.5 rounded text-3xs font-mono border border-neutral-700">Alt+Z</span>
                    <span>Fullscr</span>
                </div>
            </div>

            {/* Variant Selection Modal */}
            {variantModalOpen && selectedProductForVariant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-line flex justify-between items-center">
                            <h3 className="font-bold text-lg">Select Variant</h3>
                            <button onClick={() => setVariantModalOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="p-4 max-h-96 overflow-y-auto">
                            {selectedProductForVariant.variants.map(variant => (
                                <div
                                    key={variant.id}
                                    onClick={() => addToCart(selectedProductForVariant, variant)}
                                    className="p-3 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl cursor-pointer border border-line mb-2 flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-bold">{variant.sku}</p>
                                        <p className="text-xs text-ink-muted">
                                            {/* Display attributes if available, else just SKU */}
                                            {variant.attributes ? JSON.stringify(variant.attributes) : 'Variant'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-brand-600">{formatCurrency(variant.price, store || settings)}</p>
                                        <p className="text-xs text-ink-muted">Stock: {variant.stock_quantity}</p>
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
                zIndex="z-modal"
            />

            <PaymentModal
                isOpen={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                totalAmount={cartTotal}
                onComplete={handlePaymentComplete}
                currency={store?.currency_code || settings?.currency || 'PKR'}
                bankAccounts={bankAccounts}
                customer={activeSale.customer}
                defaultPrintReceipt={printOnComplete}
            />

            {/* Custom Global Discount Preset Modal */}
            {globalDiscountModal.show && (
                <div className="fixed inset-0 z-drawer flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-normal">
                    <div className="bg-neutral-900 w-full max-w-sm rounded-2xl shadow-2xl border border-white/10 overflow-hidden text-white">
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="text-base font-bold uppercase tracking-tight">Apply <span className="text-emerald-400">Discount</span></h3>
                                <p className="text-1xs text-ink-muted">Select type and discount value</p>
                            </div>
                            <button onClick={() => setGlobalDiscountModal({ show: false, type: 'fixed', value: '' })} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                <X size={18} className="text-ink-muted hover:text-white" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Type Toggle Tabs */}
                            <div className="flex bg-neutral-800 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setGlobalDiscountModal(prev => ({ ...prev, type: 'fixed' }))}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${globalDiscountModal.type === 'fixed' ? 'bg-emerald-600 text-white shadow-md' : 'text-ink-muted hover:text-white'}`}
                                >
                                    Fixed Amount ({getCurrencySymbol(store || settings)})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGlobalDiscountModal(prev => ({ ...prev, type: 'percentage' }))}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${globalDiscountModal.type === 'percentage' ? 'bg-emerald-600 text-white shadow-md' : 'text-ink-muted hover:text-white'}`}
                                >
                                    Percentage (%)
                                </button>
                            </div>

                            {/* Preset Buttons - Visible for Percentage discount mode */}
                            {globalDiscountModal.type === 'percentage' && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-2xs uppercase font-bold text-ink-muted block">Presets (Hold to Edit)</label>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {discountPresets.map((val, idx) => {
                                            let holdTimer = null;
                                            const startHold = () => {
                                                holdTimer = setTimeout(() => {
                                                    // Trigger hold edit action
                                                    showInput(`Edit Preset #${idx + 1}`, `Enter new percentage value (current: ${val}%)`, (newVal) => {
                                                        const parsed = parseFloat(newVal);
                                                        if (!isNaN(parsed)) {
                                                            const newPresets = [...discountPresets];
                                                            newPresets[idx] = parsed;
                                                            setDiscountPresets(newPresets);
                                                            localStorage.setItem('pos_discount_presets', JSON.stringify(newPresets));
                                                            addToast(`Preset #${idx + 1} updated to ${parsed}%`, 'success');
                                                        }
                                                    });
                                                    holdTimer = null;
                                                }, 500);
                                            };
                                            const endHold = () => {
                                                if (holdTimer) {
                                                    clearTimeout(holdTimer);
                                                    setGlobalDiscountModal(prev => ({ ...prev, value: String(val) }));
                                                }
                                            };
                                            
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onMouseDown={startHold}
                                                    onMouseUp={endHold}
                                                    onTouchStart={startHold}
                                                    onTouchEnd={endHold}
                                                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${parseFloat(globalDiscountModal.value) === val ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-neutral-800/50 border-white/5 text-neutral-300 hover:bg-interactive-hover'}`}
                                                >
                                                    {val}%
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Discount Value Input field */}
                            <div>
                                <label className="text-2xs uppercase font-bold text-ink-muted block mb-1.5">
                                    {globalDiscountModal.type === 'percentage' ? 'Discount Percentage (%)' : `Discount Value (${getCurrencySymbol(store || settings)})`}
                                </label>
                                <input
                                    type="number"
                                    value={globalDiscountModal.value}
                                    onChange={(e) => setGlobalDiscountModal(prev => ({ ...prev, value: e.target.value }))}
                                    placeholder="0.00"
                                    className="w-full bg-neutral-950 border border-white/5 rounded-xl py-3 px-4 text-lg font-bold text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="p-5 bg-white/5 border-t border-white/5 flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    updateActiveSale({ discountType: 'fixed', discountValue: 0 });
                                    setGlobalDiscountModal({ show: false, type: 'fixed', value: '' });
                                    addToast('Discount cleared', 'info');
                                }}
                                className="flex-1 py-2.5 text-xs font-bold text-ink-muted hover:text-white bg-neutral-800 rounded-xl transition-all"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const parsedVal = parseFloat(globalDiscountModal.value) || 0;
                                    updateActiveSale({ discountType: globalDiscountModal.type, discountValue: parsedVal });
                                    setGlobalDiscountModal({ show: false, type: 'fixed', value: '' });
                                    addToast('Discount applied successfully', 'success');
                                }}
                                className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg "
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {/* Quick Bank Account Modal */}
            {showQuickAccountModal && (
                <div className="fixed inset-0 z-drawer flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-normal">
                    <div className="bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Create <span className="text-brand-400">Bank Account</span></h3>
                                <p className="text-xs text-ink-muted">Add a ledger to receive digital payments</p>
                            </div>
                            <button onClick={() => setShowQuickAccountModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <X size={20} className="text-ink-muted" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-2xs uppercase font-bold text-ink-muted block mb-1.5">Account Name</label>
                                <input 
                                    id="quick-acc-name"
                                    type="text" 
                                    placeholder="e.g. Meezan Bank, HBL Shop" 
                                    className="w-full bg-neutral-800 border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-white focus:ring-2 focus:ring-brand-500/50 outline-none"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-2xs uppercase font-bold text-ink-muted block mb-1.5">Type</label>
                                    <select id="quick-acc-type" className="w-full bg-neutral-800 border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-white focus:ring-2 focus:ring-brand-500/50 outline-none">
                                        <option value="checking">Checking</option>
                                        <option value="savings">Savings</option>
                                        <option value="cash">Branch Cash</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-2xs uppercase font-bold text-ink-muted block mb-1.5">Bank Name</label>
                                    <input 
                                        id="quick-acc-bank"
                                        type="text" 
                                        placeholder="Optional" 
                                        className="w-full bg-neutral-800 border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-white focus:ring-2 focus:ring-brand-500/50 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white/5 border-t border-white/5 flex gap-3">
                            <button 
                                onClick={() => setShowQuickAccountModal(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-xs text-ink-muted hover:bg-white/5 transition-colors"
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
                                className="flex-[2] py-3 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white shadow-lg transition-all flex items-center justify-center gap-2"
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
                        <h3 className="text-xl font-bold text-ink mb-1">
                            Use Excess Amount
                        </h3>
                        <div className="text-3xl font-bold text-emerald-500 my-2">
                            {formatCurrency(overpaymentDetails.amount, store || settings)}
                        </div>
                        <p className="text-xs text-ink-muted">
                            Customer paid extra. Choose action:
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => processCheckout(pendingPaymentData, false)}
                            className="w-full py-3 bg-sunken text-ink-secondary rounded-xl font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors flex items-center justify-center gap-2"
                        >
                            Return Change
                        </button>
                        <button
                            onClick={() => processCheckout(pendingPaymentData, true)}
                            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg transition-colors flex items-center justify-center gap-2"
                        >
                            Add to Ledger
                        </button>
                    </div>
                </div>
            </FormModal>

            {/* â”€â”€ Item Discount Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {itemDiscountModal.show && (
                <div className="fixed inset-0 z-command flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
                        <div>
                            <h3 className="text-lg font-bold text-ink">Apply Item Discount</h3>
                            <p className="text-xs text-ink-muted mt-1 truncate">{itemDiscountModal.item?.name}</p>
                        </div>

                        {/* % / Rs Toggle */}
                        <div className="flex gap-2 bg-sunken p-1 rounded-xl">
                            <button
                                onClick={() => setItemDiscountModal(p => ({ ...p, discType: 'fixed' }))}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${itemDiscountModal.discType === 'fixed' ? 'bg-sunken shadow text-brand-600 dark:text-brand-400' : 'text-ink-muted'}`}
                            >
                                {getCurrencySymbol(store || settings)} Fixed
                            </button>
                            <button
                                onClick={() => setItemDiscountModal(p => ({ ...p, discType: 'percentage' }))}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${itemDiscountModal.discType === 'percentage' ? 'bg-sunken shadow text-brand-600 dark:text-brand-400' : 'text-ink-muted'}`}
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
                                className="w-full px-4 py-3 pr-12 border border-line dark:border-line rounded-xl bg-sunken text-ink text-lg font-bold focus:ring-2 focus:ring-brand-400 outline-none"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted font-bold text-sm">
                                {itemDiscountModal.discType === 'percentage' ? '%' : (getCurrencySymbol(store || settings))}
                            </span>
                        </div>

                        {/* Preview */}
                        {itemDiscountModal.discValue && !isNaN(parseFloat(itemDiscountModal.discValue)) && (
                            <div className="bg-brand-50 dark:bg-brand-900/30 rounded-xl p-3 text-sm flex justify-between">
                                <span className="text-ink-muted">Discounted price</span>
                                <span className="font-bold text-brand-600 dark:text-brand-400">
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
                                className="flex-1 py-3 bg-sunken text-ink-secondary rounded-xl font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={applyItemDiscount}
                                className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg "
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* â”€â”€ Converter Modal (Price / Qty / Total) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {converterModal.show && (
                <div className="fixed inset-0 z-command flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
                        <div>
                            <h3 className="text-lg font-bold text-ink">Edit Item Values</h3>
                            <p className="text-xs text-ink-muted mt-1 truncate">{converterModal.item?.name}</p>
                        </div>

                        {/* Mode toggle: what does Total changing affect? */}
                        <div>
                            <p className="text-2xs font-bold text-ink-muted uppercase mb-2">When Total changes, recalculate:</p>
                            <div className="flex gap-2 bg-sunken p-1 rounded-xl">
                                <button
                                    onClick={() => setConverterModal(p => ({ ...p, mode: 'price' }))}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${converterModal.mode === 'price' ? 'bg-sunken shadow text-amber-600 dark:text-amber-400' : 'text-ink-muted'}`}
                                >
                                    {getCurrencySymbol(store || settings)} Price
                                </button>
                                <button
                                    onClick={() => setConverterModal(p => ({ ...p, mode: 'qty' }))}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${converterModal.mode === 'qty' ? 'bg-sunken shadow text-amber-600 dark:text-amber-400' : 'text-ink-muted'}`}
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
                                <label className="text-2xs font-bold text-ink-muted uppercase block mb-1">{label}</label>
                                <div className="relative">
                                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-${color}-500`}>{icon}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={converterModal[field]}
                                        onChange={e => handleConverterChange(field, e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && applyConverter()}
                                        className={`w-full pl-8 pr-4 py-3 border border-line dark:border-line rounded-xl bg-sunken text-ink font-bold text-base focus:ring-2 focus:ring-${color}-400 outline-none`}
                                    />
                                </div>
                            </div>
                        ))}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setConverterModal({ show: false, item: null, mode: 'price', price: '', qty: '', total: '' })}
                                className="flex-1 py-3 bg-sunken text-ink-secondary rounded-xl font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={applyConverter}
                                className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-lg "
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
            <div className="fixed inset-0 z-drawer flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-normal">
                <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-line text-lg">
                    {/* Header */}
                    <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg ">
                                <Database size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-ink leading-tight">Sync Hub</h2>
                                <p className="text-sm text-ink-muted font-medium font-mono uppercase tracking-widest">{pendingCount} Pending Sales</p>
                            </div>
                        </div>
                        <button onClick={() => setShowSyncHub(false)} className="w-10 h-10 rounded-full hover:bg-white dark:hover:bg-interactive-hover flex items-center justify-center text-ink-muted transition-colors">
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
                                <div className="w-20 h-20 rounded-full bg-app flex items-center justify-center text-neutral-300 mx-auto mb-4">
                                    <Check size={40} />
                                </div>
                                <p className="text-ink-muted font-bold">All sales are synced!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {offlineSales.map(sale => (
                                    <div key={sale.id} className="p-4 rounded-2xl border border-line hover:border-amber-200 dark:hover:border-amber-900/40 bg-surface/50 dark:bg-app transition-all group">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 rounded-md bg-surface border border-line text-2xs font-bold uppercase text-ink-muted tracking-tighter">OFFLINE</span>
                                                    <span className="font-bold text-ink">{sale.data.customer_name || 'Walk-in Customer'}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-bold text-ink-muted">
                                                    <span className="flex items-center gap-1.5"><ShoppingCart size={14} className="text-brand-400" /> {sale.data.cart?.length || 0} Items</span>
                                                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><CreditCard size={14} /> {formatCurrency(sale.data.total_amount || 0, store || settings)}</span>
                                                    <span className="flex items-center gap-1.5 text-ink-muted"><Clock size={14} /> {new Date(sale.created_at).toLocaleTimeString()}</span>
                                                    {sale.attempt_count > 0 && (
                                                        <span className="flex items-center gap-1 text-amber-500">&#9888; {sale.attempt_count} attempt{sale.attempt_count !== 1 ? 's' : ''}</span>
                                                    )}
                                                </div>
                                                {/* Show sync error message if available */}
                                                {syncErrors[sale.id] && (
                                                    <div className="mt-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40">
                                                        <p className="text-xs font-bold text-red-600 dark:text-red-400">&#9888; Sync Error: {syncErrors[sale.id]}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleRecallOfflineSale(sale)}
                                                    className="h-9 px-4 rounded-xl bg-surface border border-line text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-xs font-bold transition-all shadow-sm"
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
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface border border-line text-red-500 hover:bg-red-50 transition-all shadow-sm"
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
                    <div className="p-6 bg-app border-t border-line flex items-center justify-between">
                        <div className="text-xs text-ink-muted font-bold">
                            {lastSyncTime ? `Last checked: ${lastSyncTime.toLocaleTimeString()}` : 'Syncing enabled'}
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => syncPendingSales()}
                                disabled={isSyncing || !isOnline}
                                className={`px-6 h-12 rounded-2xl flex items-center gap-2 font-bold transition-all ${
                                    isSyncing || !isOnline 
                                    ? 'bg-sunken text-ink-muted dark:bg-surface cursor-not-allowed' 
                                    : 'bg-brand-600 text-white shadow-lg  hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0'
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
    const { store } = usePage().props;
    return (
        <OneGlanceLayout title="Point of Sale" activeMenu="Dashboard" defaultCollapsed={true} hideHeader={true} noPadding={true}>
            <Head title="POS" />
            <POSInterface settings={settings} recalledSale={recalledSale} bankAccounts={bankAccounts} />
            <PosTourGuide store={store} />
        </OneGlanceLayout>
    );
}

