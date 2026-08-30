import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { formatCurrency, formatNumber, getCurrencySymbol } from '@/Utils/format';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import '@/NewPos/newpos.css';
import '@/NewPos/pos-law.css';
import '@/Pos/Table/table.css';
import { usePosLayout, PRESETS as LAYOUT_PRESETS, DEFAULT_PRESET, matchPreset } from '@/Layout/usePosLayout';
import {
    ScanBarcode,
    MinusCircle,
    PlusCircle,
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
    WifiOff,
    RefreshCcw,
    Database,
    Warehouse,
    ChevronLeft,
    ChevronRight,
    History,
    ArrowLeft,
    LayoutGrid,
    Settings,
    Users,
    Undo2,
    Percent,
    ArrowLeftRight,
    Split,
    Loader2,
    Unlock,
    Keyboard,
    Maximize2,
    Minimize2,
    AlertTriangle
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
import SetupWizardModal from '@/NewPos/SetupWizardModal';
import RegisterSettings, { DEFAULT_SURFACE } from '@/Components/Pos/RegisterSettings';

/* ── THE TABLE TERMINAL ───────────────────────────────────────────────────
   The register is one screen with two terminals. Everything restaurant-shaped
   lives in these four modules and is mounted only when the terminal is
   `table`, so a counter till carries none of it -- not a mock floor, not a
   dead settings row, not eight hard-coded tables that wrote nowhere. */
import useTableService, { serverLineToCart, ORDER_TYPES } from '@/Pos/Table/useTableService';
import FloorPane, { elapsed as tableElapsed, toneOf as tableTone } from '@/Pos/Table/FloorPane';
import TableBar, { SeatDialog, MoveSheet, NewTicketDialog } from '@/Pos/Table/TableBar';
import SplitSheet from '@/Pos/Table/SplitSheet';
import ModifierSheet from '@/Pos/Table/ModifierSheet';

const POSInterface = ({
    settings,
    recalledSale,
    bankAccounts = [],
    warehouses = [],
    occupancy = null,
    /* WHICH TERMINAL THIS IS. Layout Law §10 defines six; five of them are
       shapes of a counter till and the sixth, Table, is a different unit of
       work -- "the unit of work is the table, not the sale". Same component,
       same cart, same tender, same offline queue; the terminal decides which
       panes exist and which controls make sense. */
    terminal = 'counter',
    positions: initialPositions = [],
    tickets: initialTickets = [],
    zones: initialZones = [],
    kitchen: initialKitchen = 0,
}) => {
    const tableMode = terminal === 'table';
    const { auth, store } = usePage().props;
    const userRole = auth.user?.role;
    const userPerms = auth.user?.permissions || [];
    const hasDiscountPerm = userRole === 'owner' || userRole === 'admin' || userRole === 'manager' || userPerms.some(p => p === 'pos.discounts' || p.startsWith('pos.discounts.'));
    /* `pos.price_override` is defined in config/permissions.php and was checked
       nowhere -- the layout law's own defect list flags it, alongside
       pos.void_item and pos.refund. It gates in-place rate editing now. */
    const hasPriceOverridePerm = userRole === 'owner' || userRole === 'admin' || userRole === 'manager'
        || userPerms.some(p => p === 'pos.price_override' || p.startsWith('pos.price_override.'));
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
    /* The printer indicator claimed "hardware connected" from `isConnected`
       alone -- which only says the AMD Station bridge is running, not that a
       printer exists behind it. The hook has always returned the real printer
       list; nothing read it. A station with no printer attached now reads as
       "no printer", which is the thing the cashier actually needs to know
       before they promise someone a receipt. */
    const { isConnected: isStationConnected, printers: stationPrinters = [] } = useAMDStation();
    const printerCount = Array.isArray(stationPrinters) ? stationPrinters.length : 0;
    const printerReady = isStationConnected && printerCount > 0;
    const printerState = !isStationConnected ? 'no-station' : printerCount === 0 ? 'no-printer' : 'ready';
    const printerLabel = printerState === 'ready'
        ? `${printerCount} printer${printerCount === 1 ? '' : 's'} ready`
        : printerState === 'no-printer'
            ? 'Station running, no printer found'
            : 'No station — receipts print through the browser';
    const [alertState, setAlertState] = useState({ show: false, title: '', message: '', type: 'info' });
    const [confirmState, setConfirmState] = useState({ show: false, title: '', message: '', onConfirm: () => { } });
    const [inputState, setInputState] = useState({ show: false, title: '', placeholder: '', onSubmit: () => { } });

    /* ── THE ONE SETTINGS SURFACE ─────────────────────────────────────────
       This used to be four: a layout picker modal, a quick-settings dropdown,
       a register-settings modal and the wizard. Three of them wrote the same
       five values through three different code paths and none exposed the
       composition knobs the layout law defines, so an operator had to learn
       which of three buttons held the switch they wanted. One drawer now, one
       state pair, and `settingsTab` is how a caller opens it AT a section --
       '?' lands on Keys, a demoted pane's "why?" lands on Layout. */
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState('layout');
    const openSettings = (tab = 'layout') => { setSettingsTab(tab); setSettingsOpen(true); };
    const [showSetupWizard, setShowSetupWizard] = useState(() => {
        try {
            const done = localStorage.getItem('pos_wizard_completed');
            return !done;
        } catch (_) {
            return false;
        }
    });
    const [lastClearedCart, setLastClearedCart] = useState(null);
    // `pos_layout_variant`, `pos_catalog_placement`, `pos_tender_placement`,
    // `pos_simulated_device` and `pos_ui_scale` used to live here. All five
    // were written by the settings drawer and read by nothing — which is why
    // picking a variant appeared to do nothing at all. Layout is now one
    // decision, made by usePosLayout from the measured element. The saved
    // variant is still honoured: loadComposition() reads it as a starting
    // composition so nobody's register changes shape under them.
    const [posAutoPrint, setPosAutoPrint] = useState(() => {
        return settings?.pos_auto_print === '1' || settings?.pos_auto_print === true || localStorage.getItem('pos_auto_print') === 'true';
    });
    const [discountPresets, setDiscountPresets] = useState(() => {
        try {
            const stored = localStorage.getItem('pos_discount_presets');
            return stored ? JSON.parse(stored) : [5, 10, 15, 20];
        } catch(e) {
            return [5, 10, 15, 20];
        }
    });

    // UI Helpers
    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };
    const showAlert = (title, message, type = 'error') => setAlertState({ show: true, title, message, type });
    const showConfirm = (title, message, onConfirm, isDangerous = false) => setConfirmState({ show: true, title, message, onConfirm, isDangerous });
    const showInput = (title, placeholder, onSubmit) => setInputState({ show: true, title, placeholder, onSubmit });

    // Open Cash Drawer Trigger (Hardware pulse)
    const handleOpenCashDrawer = () => {
        try {
            if (window.AMDStation && typeof window.AMDStation.openDrawer === 'function') {
                window.AMDStation.openDrawer();
            }
            addToast('Cash drawer signal pulse sent', 'success');
        } catch(e) {
            addToast('Cash drawer trigger failed: ' + e.message, 'error');
        }
    };

    // Cart Clear with 10-Second Undo
    const handleClearCartWithUndo = () => {
        if (!activeSale.cart || activeSale.cart.length === 0) return;
        const currentCart = [...activeSale.cart];
        updateActiveSale({ cart: [], cashReceived: '' });
        setLastClearedCart({ cart: currentCart, timestamp: Date.now() });
        addToast('Cart cleared. Undo available for 10 seconds.', 'info');
        setTimeout(() => {
            setLastClearedCart(prev => (prev && Date.now() - prev.timestamp >= 9900 ? null : prev));
        }, 10000);
    };

    const handleRestoreClearedCart = () => {
        if (lastClearedCart && lastClearedCart.cart.length > 0) {
            updateActiveSale({ cart: lastClearedCart.cart });
            setLastClearedCart(null);
            addToast('Cart restored successfully!', 'success');
        }
    };

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
        const initial = posSessions.length > 0 ? posSessions : [{ id: Date.now(), type: 'pos', cart: [], cashReceived: '', searchTerm: '', customer: null, discountType: 'fixed', discountValue: 0 }];
        return initial.map(s => ({
            ...s,
            cart: Array.isArray(s?.cart) ? s.cart : []
        }));
    });
    const [activeSaleId, setActiveSaleId] = useState(() => {
        return currentPosId || sales[0]?.id || Date.now();
    });

    const rawActiveSale = sales.find(s => s.id === activeSaleId) || sales[0] || { id: activeSaleId, type: 'pos', cart: [], cashReceived: '', searchTerm: '', customer: null, discountType: 'fixed', discountValue: 0 };
    const activeSale = {
        ...rawActiveSale,
        cart: Array.isArray(rawActiveSale?.cart) ? rawActiveSale.cart : []
    };

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




    // Register Feature Toggles (Settings & LocalStorage)
    const [enableTax, setEnableTax] = useState(() => {
        const saved = localStorage.getItem('pos_enable_tax');
        if (saved !== null) return saved === 'true';
        return settings?.enable_tax !== '0' && settings?.enable_tax !== false && settings?.enable_tax !== 0;
    });

    const [enableFulfilment, setEnableFulfilment] = useState(() => {
        const saved = localStorage.getItem('pos_enable_fulfilment');
        if (saved !== null) return saved === 'true';
        return false;
    });

    const [enableFreeQty, setEnableFreeQty] = useState(() => {
        const saved = localStorage.getItem('pos_enable_free_qty');
        if (saved !== null) return saved === 'true';
        return false;
    });

    // Free Quantity Visibility State (default: OFF)
    const [showFreeQty, setShowFreeQty] = useState(false);

    const [showTopTillBtn, setShowTopTillBtn] = useState(() => {
        return localStorage.getItem('pos_show_top_till') === 'true';
    });
    const [showTopHardwareBadge, setShowTopHardwareBadge] = useState(() => {
        return localStorage.getItem('pos_show_top_hardware') === 'true';
    });

    /* ── RANK-3 OPERATIONAL SETTINGS ──────────────────────────────────────
       Five values that the old page read straight out of `settings` (or, in
       two cases, out of localStorage inside the effect that used them) with no
       control anywhere. They are state now for one reason: a setting the
       operator can see but not change is worse than one they cannot see, and
       every one of these is in the drawer.

       Order of authority is the same in all five: this device's saved choice
       first, then the store setting, then the shipped default. */
    const readLocalBool = (key, fallback) => {
        try {
            const v = localStorage.getItem(key);
            return v === null ? fallback : v === 'true' || v === '1';
        } catch (_) { return fallback; }
    };

    /* round_off_total is not a boolean in the DB -- it is 'none', a decimal
       count, or a truthy flag -- so the drawer's switch means "round at all",
       and the original precision is preserved when it is left on. */
    const defaultRoundOff = !(settings?.round_off_total === undefined
        || settings?.round_off_total === null
        || settings?.round_off_total === ''
        || settings?.round_off_total === 'none');

    const [roundOff, setRoundOffState] = useState(() => readLocalBool('pos_round_off', defaultRoundOff));
    const setRoundOff = (v) => {
        setRoundOffState(v);
        try { localStorage.setItem('pos_round_off', String(v)); } catch (_) {}
    };

    const [autoFillCash, setAutoFillCashState] = useState(() => readLocalBool(
        'pos_auto_fill_cash',
        settings?.pos_auto_fill_cash === '1' || settings?.pos_auto_fill_cash === true || settings?.pos_auto_fill_cash === 1,
    ));
    const setAutoFillCash = (v) => {
        setAutoFillCashState(v);
        try { localStorage.setItem('pos_auto_fill_cash', String(v)); } catch (_) {}
    };

    const [showMargin, setShowMarginState] = useState(() => readLocalBool(
        'pos_show_margin',
        settings?.show_margin_percentage === '1' || settings?.show_margin_percentage === true,
    ));
    const setShowMargin = (v) => {
        setShowMarginState(v);
        try { localStorage.setItem('pos_show_margin', String(v)); } catch (_) {}
    };

    const [openDrawerOnCash, setOpenDrawerOnCashState] = useState(() => readLocalBool(
        'pos_open_drawer_on_cash',
        settings?.thermal_open_drawer === '1' || settings?.thermal_open_drawer === true,
    ));
    const setOpenDrawerOnCash = (v) => {
        setOpenDrawerOnCashState(v);
        try { localStorage.setItem('pos_open_drawer_on_cash', String(v)); } catch (_) {}
    };

    /* Interface scale is applied as a CSS custom property on the terminal, and
       the layout engine is fed the scaled box -- so a pane that can no longer
       hold its own contents at 130% demotes to a button rather than clipping,
       which is the same rule large-text mode already obeys. */
    const [uiScale, setUiScaleState] = useState(() => {
        try {
            const v = parseFloat(localStorage.getItem('pos_ui_scale'));
            return Number.isFinite(v) && v >= 0.9 && v <= 1.3 ? v : 1;
        } catch (_) { return 1; }
    });
    const setUiScale = (v) => {
        const next = Math.max(0.9, Math.min(1.3, Number(v) || 1));
        setUiScaleState(next);
        try { localStorage.setItem('pos_ui_scale', String(next)); } catch (_) {}
    };

    /* ── WHICH BUTTONS SIT ON THE BAR ─────────────────────────────────────
       `pos_show_top_till` and `pos_show_top_hardware` were read on mount and
       then used by absolutely nothing -- two dead keys where somebody had
       meant to make this a choice. It is a choice now, it covers every rank-2
       control the bar can carry, and the Counter tab of the settings panel is
       where it is made. */
    const [surfaceButtons, setSurfaceButtonsState] = useState(() => {
        try {
            const raw = localStorage.getItem('pos_surface_buttons');
            return raw ? { ...DEFAULT_SURFACE, ...JSON.parse(raw) } : { ...DEFAULT_SURFACE };
        } catch (_) { return { ...DEFAULT_SURFACE }; }
    });
    const setSurfaceButtons = (next) => {
        setSurfaceButtonsState(next);
        try { localStorage.setItem('pos_surface_buttons', JSON.stringify(next)); } catch (_) {}
    };

    /* ── FULLSCREEN ───────────────────────────────────────────────────────
       Alt+Z toggled fullscreen in two separate keydown handlers and nothing
       tracked the result, so a button could not show which state it was in.
       One helper, and a state driven by the browser's own event -- because
       Esc and F11 leave fullscreen without going anywhere near our code. */
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
        sync();
        document.addEventListener('fullscreenchange', sync);
        return () => document.removeEventListener('fullscreenchange', sync);
    }, []);

    const toggleFullscreen = () => {
        try {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
            else document.exitFullscreen?.();
        } catch (_) { /* the browser said no; nothing else to do */ }
    };

    /* Counter, table service, or both. A STORE setting -- two tills in one
       restaurant must not disagree about whether there is a floor -- so it is
       written through an endpoint rather than to localStorage, and the local
       copy is optimistic so the panel does not feel laggy. */
    const [serviceMode, setServiceMode] = useState(settings?.service_mode || 'counter');

    /* The stepper was reading `settings.service_charge_percent` straight off
       the Inertia page props -- a value that cannot change without a page
       load. So every tap posted the right number to the server and then
       re-rendered the old one, and the control looked broken while working
       perfectly. It holds its own state now, optimistically, and rolls back
       if the save is refused. */
    const [serviceChargeSetting, setServiceChargeState] = useState(
        () => parseFloat(settings?.service_charge_percent || 0) || 0,
    );

    const saveServiceCharge = async (pct) => {
        const value = Math.max(0, Math.min(100, parseFloat(pct) || 0));
        const previous = serviceChargeSetting;
        setServiceChargeState(value);
        try {
            await axios.post(route('store.tables.service-charge', { store_slug: store?.slug }), { percent: value });
            addToast(value > 0 ? `Service charge set to ${value}%` : 'Service charge switched off', 'success');
        } catch (e) {
            setServiceChargeState(previous);
            addToast(e?.response?.status === 403
                ? 'You do not have permission to change the service charge.'
                : 'That service charge could not be saved.', 'error');
        }
    };

    const saveServiceMode = async (mode) => {
        const previous = serviceMode;
        setServiceMode(mode);
        try {
            await axios.post(route('store.tables.service-mode', { store_slug: store?.slug }), { mode });
            addToast(mode === 'counter' ? 'Counter service' : mode === 'tables' ? 'Table service' : 'Counter and table service', 'success');
            /* The nav reads service_mode off the page props, so without this
               the Tables entry does not appear until the next full page load
               -- and a switch whose only visible effect is delayed by a reload
               is a switch the operator concludes did nothing. */
            router.reload({ only: ['settings'], preserveScroll: true, preserveState: true });
        } catch (e) {
            setServiceMode(previous);
            addToast(e?.response?.status === 403
                ? 'You do not have permission to change the service style.'
                : 'Could not save the service style.', 'error');
        }
    };

    // Icon Rail Toggle State
    // Fullscreen by default: the rail is hidden unless the cashier asks for
    // it back. A register is the one screen in the product where the extra
    // 72px is worth more than the navigation.
    const [showRail, setShowRail] = useState(() => {
        const saved = localStorage.getItem('pos_show_rail');
        return saved ? JSON.parse(saved) : false;
    });

    /* ── LAYOUT ───────────────────────────────────────────────────────────
       One decision, from the measured element and the shop's composition.
       Nothing below this line asks how wide the window is. */
    const {
        ref: termRef, layout, comp: composition, paneCols,
        update: updateComposition, applyPreset, dragSplit, formatToFit,
    } = usePosLayout({ settings, senior: seniorMode, scale: uiScale, terminal });

    const handleWizardApply = (newPrefs) => {
        try { localStorage.setItem('pos_wizard_completed', 'true'); } catch (_) {}
        if (newPrefs?.preset) {
            applyPreset(newPrefs.preset);
        }
        if (newPrefs?.ops?.senior !== undefined) {
            setSeniorMode(Boolean(newPrefs.ops.senior));
            try { localStorage.setItem('pos_senior_mode', JSON.stringify(newPrefs.ops.senior)); } catch (_) {}
        }
        if (newPrefs?.ops?.autoPrint !== undefined) {
            setPrintOnComplete(Boolean(newPrefs.ops.autoPrint));
            try { localStorage.setItem('pos_auto_print', JSON.stringify(newPrefs.ops.autoPrint)); } catch (_) {}
        }
        if (newPrefs?.ops?.autoFillCash !== undefined) {
            // Was collected by the wizard and silently dropped here -- the toggle
            // changed local wizard state, got bundled into newPrefs, and this
            // function never read it back out. The auto-fill-cash effect above
            // now also checks this same localStorage key (matching the
            // pos_auto_print pattern immediately above it).
            try { localStorage.setItem('pos_auto_fill_cash', JSON.stringify(newPrefs.ops.autoFillCash)); } catch (_) {}
        }
        if (newPrefs?.rail !== undefined) {
            setShowRail(Boolean(newPrefs.rail));
            try { localStorage.setItem('pos_show_rail', JSON.stringify(newPrefs.rail)); } catch (_) {}
        }
        addToast('Register configured. Change any of it from the settings button, or Alt+L.', 'success');
    };

    /* Which of the six this composition currently IS. Matched on the shape a
       preset fixes -- catalog placement, tender placement, floor -- and not on
       catalog mode alone, which is what used to leave Grid, Stack, Counter and
       Table permanently unhighlighted after you picked them. */
    const currentPresetId = matchPreset(composition);

    /* The wizard still speaks the prefs shape it was written against; this is
       the adapter, and it is the ONLY place that shape survives. */
    const wizardPrefs = {
        preset: currentPresetId,
        auto: true,
        profile: 'retail',
        rail: showRail,
        ops: { senior: seniorMode, autoPrint: printOnComplete, autoFillCash },
    };

    /* Reset all — every register-scoped key this device owns, and back to the
       default composition. The store's own settings are untouched: this is a
       device reset, not an account one, and saying so matters because the two
       are easy to confuse when one button clears both. */
    const REGISTER_KEYS = [
        'pos_composition_v2', 'pos_layout_variant', 'pos_show_rail', 'pos_print_on_complete',
        'pos_enable_tax', 'pos_enable_fulfilment', 'pos_enable_free_qty', 'pos_discount_presets',
        'pos_auto_fill_cash', 'pos_auto_print', 'pos_round_off', 'pos_show_margin',
        'pos_ui_scale', 'pos_open_drawer_on_cash', 'pos_show_top_till', 'pos_show_top_hardware',
        'pos_surface_buttons',
    ];

    const handleResetRegister = () => {
        showConfirm(
            'Reset this register?',
            'Every layout and preference saved on this device goes back to its default. '
            + 'Your store settings, products and sales are not touched.',
            () => {
                try {
                    REGISTER_KEYS.forEach(k => localStorage.removeItem(k));
                    sessionStorage.removeItem('pos_senior_mode');
                } catch (_) { /* private mode */ }
                applyPreset(DEFAULT_PRESET);
                setShowRail(false);
                setSeniorMode(false);
                setUiScale(1);
                setShowMargin(false);
                setPrintOnComplete(true);
                setOpenDrawerOnCash(true);
                setAutoFillCash(true);
                setRoundOff(defaultRoundOff);
                setEnableTax(true);
                setEnableFulfilment(false);
                setEnableFreeQty(false);
                setDiscountPresets([5, 10, 15, 20]);
                setSurfaceButtonsState({ ...DEFAULT_SURFACE });
                setSettingsOpen(false);
                addToast('Register reset to defaults', 'success');
            },
            true,
        );
    };

    /* In-place line editing. A draft rather than a direct write, so a
       half-typed "1" on the way to "12" does not momentarily reprice the line
       and re-run the totals. Commit on Enter or blur; Escape restores. */
    const [qtyDraft, setQtyDraft] = useState(null);
    const [priceDraft, setPriceDraft] = useState(null);

    const commitQty = (item) => {
        if (!qtyDraft || qtyDraft.id !== item.cartItemId) return;
        const n = parseFloat(qtyDraft.value);
        setQtyDraft(null);
        if (!Number.isFinite(n) || n <= 0) return;                 /* keep what was there */
        if (n === Number(item.qty)) return;
        updateQty(item.cartItemId, n - Number(item.qty));          /* one path, so the
                                                                      negative-stock and
                                                                      auto-manufacture
                                                                      guards still run */
    };

    const commitPrice = (item) => {
        if (!priceDraft || priceDraft.id !== item.cartItemId) return;
        const n = parseFloat(priceDraft.value);
        setPriceDraft(null);
        if (!Number.isFinite(n) || n < 0) return;
        if (n === Number(item.price)) return;
        const base = Number(item.original_price ?? item.price);
        updateActiveSale({
            cart: activeSale.cart.map(l => (l.cartItemId === item.cartItemId
                ? { ...l, price: n, original_price: base, discount: Math.max(0, base - n) }
                : l)),
        });
    };

    /* ── A TABLE, HANDED OVER TO BE SETTLED ───────────────────────────────
       Table Service owns the floor; it does not own money. It sends the
       operator here with an occupancy id and this loads that table's order
       into a tab, so the tender panel, the journal posting and the offline
       queue stay in one place. On a completed sale the occupancy is closed,
       which is what frees the table -- rather than leaving a waiter to
       remember to do it on another screen. */
    const [settlingOccupancy, setSettlingOccupancy] = useState(null);
    const occupancyLoaded = useRef(false);

    useEffect(() => {
        if (!occupancy || occupancyLoaded.current) return;
        occupancyLoaded.current = true;
        /* One translator for both directions and both entry points. This used
           to be a second inline mapper that knew nothing about modifiers, so a
           table handed over from elsewhere arrived with its options silently
           dropped -- and the customer was charged the plain price for a dish
           the kitchen had cooked with extras. */
        const lines = (occupancy.cart || []).map(serverLineToCart);
        if (!lines.length) {
            addToast(`${occupancy.label || 'That table'} has nothing on it yet.`, 'warning');
            return;
        }
        updateActiveSale({ cart: lines, notes: occupancy.note || '' });
        setSettlingOccupancy(occupancy);
        addToast(`${occupancy.label || 'Table'} loaded — take the payment`, 'info');
    }, [occupancy]);

    const releaseSettledTable = async (saleId) => {
        if (!settlingOccupancy) return;
        try {
            await axios.post(route('store.tables.settled', { store_slug: store?.slug }), {
                occupancy_id: settlingOccupancy.id,
                sale_id: saleId ?? null,
            });
            addToast(`${settlingOccupancy.label || 'Table'} is free`, 'success');
        } catch (_) {
            /* The sale is already banked; a table left showing as open is a
               nuisance, not a loss. Say so rather than failing the sale. */
            addToast('Sale completed, but the table could not be released. Free it from the floor.', 'warning');
        } finally {
            setSettlingOccupancy(null);
        }
    };

    const [openSheet, setOpenSheet] = useState(null);   // 'catalog' | 'tender' | null

    /* ══════════════════════════════════════════════════════════════════════
       THE TABLE TERMINAL
       ══════════════════════════════════════════════════════════════════════
       In `counter` mode none of this exists: the hook is inert, the panes are
       not rendered, and the restaurant's controls are not on the surface to be
       read past. In `table` mode the floor becomes a rank-1 pane and the cart
       in front of the operator IS the selected table's order -- one cart, one
       tender, one offline queue, exactly as for a counter till.
       ══════════════════════════════════════════════════════════════════════ */
    /* Which lanes this shop runs. A dine-in-only room never sees a Takeaway
       tab; a dark kitchen sees only those. Both come off the same store
       settings the Floor Builder writes. */
    const lanes = {
        takeaway: String(settings?.lane_takeaway ?? '0') === '1',
        delivery: String(settings?.lane_delivery ?? '0') === '1',
    };

    const tables = useTableService({
        enabled: tableMode,
        storeSlug: store?.slug,
        initialPositions,
        initialTickets,
        initialZones,
        initialKitchen,
        lanes,
        onError: (m) => addToast(m, 'error'),
        onNotice: (m) => addToast(m, 'success'),
    });

    /* ONE CLOCK, so every card in a paint agrees what time it is and the
       alarm sort cannot disagree with the alarm ring. Ticking here rather
       than inside each tile also means the floor re-sorts as a table crosses
       its threshold, which is the moment the screen earns its keep. */
    const [floorNow, setFloorNow] = useState(() => Date.now());
    useEffect(() => {
        if (!tableMode) return undefined;
        const id = setInterval(() => setFloorNow(Date.now()), 20000);
        return () => clearInterval(id);
    }, [tableMode]);

    const [newTicketFor, setNewTicketFor] = useState(null);   /* 'takeaway' | 'delivery' */

    const openFloorPlan = () => router.visit(route('store.tables.plan', { store_slug: store?.slug }));
    const [seatFor, setSeatFor] = useState(null);      /* a free table being opened */
    const [movingTable, setMovingTable] = useState(false);
    const [splitOpen, setSplitOpen] = useState(false);
    const [splitSeed, setSplitSeed] = useState(null);
    const [modifierFor, setModifierFor] = useState(null);
    const [modifierGroups, setModifierGroups] = useState([]);
    const [modifierLoading, setModifierLoading] = useState(false);
    const loadedOccupancy = useRef(null);

    const selectedTable = tables.selected;
    const tableCovers = Number(selectedTable?.covers) || 1;
    const tableOrderType = selectedTable?.order_type || 'dine_in';

    /* Picking a table LOADS its order. This is the only crossing point between
       the floor's JSON document and the register's live cart, and it happens
       once per table -- guarded by a ref rather than by comparing carts,
       because the 15s poll rewrites `selected.cart` underneath us and a
       comparison would throw away whatever the waiter had just typed. */
    useEffect(() => {
        if (!tableMode) return;
        const t = tables.selected;
        if (!t || !t.occupancy_id) return;
        if (loadedOccupancy.current === t.occupancy_id) return;
        loadedOccupancy.current = t.occupancy_id;
        const lines = (t.cart || []).map(serverLineToCart);
        tables.prime(lines);
        updateActiveSale({ cart: lines, notes: t.note || '' });
    }, [tableMode, tables.selectedId, tables.selected?.occupancy_id]);

    /* …and every edit to it saves back, debounced. */
    useEffect(() => {
        if (!tableMode) return;
        const t = tables.selected;
        if (!t || !t.occupancy_id) return;
        if (loadedOccupancy.current !== t.occupancy_id) return;
        tables.pushOrder(t.occupancy_id, activeSale.cart, {
            covers: t.covers,
            orderType: t.order_type,
            note: activeSale.remarks || activeSale.notes || '',
        });
    }, [tableMode, activeSale.cart]);

    const backToFloor = () => {
        loadedOccupancy.current = null;
        tables.select(null);
        updateActiveSale({ cart: [], cashReceived: '', customer: null, remarks: '' });
    };

    /* One entry point for the floor, because a table's state decides what
       picking it MEANS: an empty one asks how many are sitting down, an
       occupied one opens its order, and one being cleaned does neither. */
    const pickTable = (t) => {
        if (movingTable) return;
        /* A lane ticket is always open -- there is no "seat it" step, because
           there is nothing to seat. Picking one is picking its bill. */
        if (t.kind === 'ticket') {
            if (tables.selectedId === t.id) { setOpenSheet(null); return; }
            loadedOccupancy.current = null;
            tables.select(t.id);
            setOpenSheet(null);
            return;
        }
        if (t.occupancy_id) {
            if (tables.selectedId === t.id) { setOpenSheet(null); return; }
            loadedOccupancy.current = null;
            tables.select(t.id);
            setOpenSheet(null);
            return;
        }
        if (t.status === 'cleaning') {
            addToast(`${t.label || t.code} is being cleaned. Mark it free from the floor first.`, 'warning');
            return;
        }
        setSeatFor(t);
    };

    const confirmSeat = async ({ covers, orderType }) => {
        const pos = await tables.openTable(seatFor.id, { covers, orderType });
        setSeatFor(null);
        if (pos) {
            loadedOccupancy.current = pos.occupancy_id;
            tables.prime([]);
            updateActiveSale({ cart: [], cashReceived: '', customer: null, remarks: '' });
            setOpenSheet(null);
        }
    };

    /* Firing must never send a stale order: the debounce is flushed first, so
       what the kitchen cooks is what is on the screen. */
    const fireToKitchen = async () => {
        const t = tables.selected;
        if (!t?.occupancy_id) return;
        await tables.flushOrder(t.occupancy_id, activeSale.cart, {
            covers: t.covers, orderType: t.order_type,
            note: activeSale.remarks || activeSale.notes || '',
        });
        const res = await tables.sendToKitchen(t.occupancy_id);
        if (res) {
            /* The lines are now the kitchen's. Marking them here rather than
               waiting for the next poll keeps the Fire button honest between
               the tap and the refresh. */
            updateActiveSale({ cart: activeSale.cart.map(l => ({ ...l, sent: true })) });
        }
    };

    /* Dropping the check. Not a printer call -- it records that the bill is
       with the guest, which starts the clock the floor turns into an alarm. */
    const dropCheck = async () => {
        const t = tables.selected;
        if (!t?.occupancy_id) return;
        const already = !!t.check_dropped_at;
        const res = await tables.dropCheck(t.occupancy_id, already);
        if (res) {
            addToast(already ? 'Bill taken back' : 'Bill dropped — the pay clock is running', 'info');
            if (!already && printOnComplete) {
                /* If the station prints, print it. If it does not, the state is
                   still recorded, because the thing that matters to the floor
                   is that the guest has the bill -- not that a printer agreed. */
                try { PrintService.printBill?.({ sale: activeSale, total: cartTotal, table: t }); } catch (_) {}
            }
        }
    };

    const setCovers = (n) => {
        const t = tables.selected;
        if (!t?.occupancy_id) return;
        tables.flushOrder(t.occupancy_id, activeSale.cart, {
            covers: n, orderType: t.order_type,
            note: activeSale.remarks || activeSale.notes || '',
        });
    };

    const setOrderType = (v) => {
        const t = tables.selected;
        if (!t?.occupancy_id) return;
        tables.flushOrder(t.occupancy_id, activeSale.cart, {
            covers: t.covers, orderType: v,
            note: activeSale.remarks || activeSale.notes || '',
        });
    };

    const closeSelectedTable = () => {
        const t = tables.selected;
        if (!t?.occupancy_id) return;
        const due = Number(t.order_total) || 0;
        const finish = async (force) => {
            const ok = await tables.closeTable(t.occupancy_id, force);
            if (ok) {
                loadedOccupancy.current = null;
                updateActiveSale({ cart: [], cashReceived: '', customer: null, remarks: '' });
                addToast(`${t.label || t.code} is free`, 'success');
            }
        };
        if (due > 0) {
            /* Closing a table with money on it is throwing away a bill. It is
               allowed -- a walkout is real -- but never by one tap. */
            setConfirmState({
                show: true,
                title: `Close ${t.label || t.code} with ${money(due)} unpaid?`,
                message: 'Nothing will be charged and the order will be discarded. Use Complete Sale instead if this table is paying.',
                onConfirm: () => { setConfirmState(s0 => ({ ...s0, show: false })); finish(true); },
            });
            return;
        }
        finish(false);
    };

    /* Splitting. "By item" is a genuinely separate bill and becomes a server
       part; "evenly" and "by amount" are one bill paid by several people,
       which is what the split-tender panel has always been for. Routing them
       to two different mechanisms is not an inconsistency -- they are two
       different things that restaurants both call "split". */
    const confirmSplit = async (spec) => {
        const t = tables.selected;
        if (!t?.occupancy_id) return;
        setSplitOpen(false);

        if (spec.mode === 'lines') {
            await tables.flushOrder(t.occupancy_id, activeSale.cart, {
                covers: t.covers, orderType: t.order_type,
                note: activeSale.remarks || activeSale.notes || '',
            });
            const res = await tables.split(t.occupancy_id, spec);
            if (!res) return;
            const ids = new Set(spec.line_ids);
            const part = activeSale.cart.filter(l => ids.has(l.lineId || l.cartItemId));
            updateActiveSale({ cart: part, cashReceived: '' });
            addToast(`${part.length} line${part.length === 1 ? '' : 's'} moved to this bill — take the payment`, 'info');
            return;
        }

        setSplitSeed(spec.mode === 'covers' ? { ways: spec.parts } : { amount: spec.amount });
        setPaymentModalOpen(true);
    };

    /* Modifiers. Fetched per product, cached for the session: a menu's option
       groups do not change between two taps on the same burger. */
    const modifierCache = useRef({});
    /* The options are looked up BEFORE the sheet opens, not inside it: a dish
       with no options must add on one tap, and a sheet that appears and
       vanishes again is worse than one that never appeared. The answer is
       cached per product, so the second Margherita of the night is instant. */
    const fetchModifierGroups = async (product) => {
        const cached = modifierCache.current[product.id];
        if (cached) return cached;
        try {
            const { data } = await axios.get(route('store.pos.modifiers', { store_slug: store?.slug }), {
                params: { product_id: product.id },
            });
            const groups = Array.isArray(data?.groups) ? data.groups : [];
            modifierCache.current[product.id] = groups;
            return groups;
        } catch (_) {
            /* No options endpoint, or it failed: the dish still has to be
               sellable. A missing modifier list is not a reason to refuse an
               order. */
            modifierCache.current[product.id] = [];
            return [];
        }
    };

    const addWithOptions = async (product, variant = null) => {
        if (!tableMode) { addToCart(product, variant); return; }
        const groups = await fetchModifierGroups(product);
        if (!groups.length) { addToCart(product, variant); return; }
        setModifierGroups(groups);
        setModifierLoading(false);
        setModifierFor(product);
    };

    /* ══════════════════════════════════════════════════════════════════════
       RESIZING A COLUMN
       ══════════════════════════════════════════════════════════════════════
       This is the register's answer to "how much room does each pane get?",
       and it deliberately is not a slider. A slider asks the operator to think
       in numbers about a thing they are looking at, three tabs away from it.
       The divider is on the thing itself.

       Three ways in, all editing the same value:

         pointer      drag the handle
         keyboard     focus it and use the arrows; Shift for a 5% step,
                      Home/End for the pane's floor and ceiling
         double-click reset THAT pane to the current preset's share

       A drag edits the SHARE, not a pixel width. That is why it survives a
       window resize — the shop said "give tender a third", and a third of a
       smaller screen is still a third — and why it can never starve a pane:
       the engine re-clamps against the measured floors on the very next frame
       and demotes rather than crushing.

       `atFloor` exists so the handle can SAY it has stopped. A control that
       silently refuses to move reads as broken; one that turns amber and shows
       "at its floor" reads as a rule.
       ────────────────────────────────────────────────────────────────────── */
    const panesRef = useRef(null);
    const [dragging, setDragging] = useState(null);
    const [dragInfo, setDragInfo] = useState(null);   // { key, px, pct, atFloor }

    /* The share a key currently holds, and what the engine actually gave it. */
    const shareOf = (key) => (key === 'catalog'
        ? (composition?.catalog?.size ?? 0)
        : (composition?.split?.tender ?? 0));

    const pxOf = (key) => (key === 'catalog'
        ? (layout.catalog?.px ?? 0)
        : (layout.tender?.px ?? 0));

    /* The floors, straight out of the law rather than re-guessed here. Below
       these the engine stops drawing a column at all, so they are the point
       the handle must stop at. */
    const SPLIT_BOUNDS = {
        catalog: { min: 0.12, max: 0.55 },
        tender:  { min: 0.16, max: 0.45 },
    };

    const commitShare = (key, share) => {
        const b = SPLIT_BOUNDS[key] || { min: 0, max: 0.55 };
        const clamped = Math.max(b.min, Math.min(b.max, share));
        updateComposition(prev => (key === 'catalog'
            ? { ...prev, catalog: { ...prev.catalog, size: clamped } }
            : { ...prev, split: { ...prev.split, tender: clamped } }));
        return { clamped, atFloor: clamped !== share };
    };

    const startSplitDrag = (key, edge) => (e) => {
        /* Secondary buttons and a second finger are not a resize. */
        if (e.button !== undefined && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const host = termRef.current;
        const grid = panesRef.current;
        if (!host || !grid) return;

        /* Measured against the GRID, not the terminal: the terminal carries a
           12px margin and a 56px bar, so measuring from it put every drag 12px
           away from the pointer and the handle visibly lagged the finger. */
        const rect = grid.getBoundingClientRect();
        const total = Math.max(1, rect.width);
        setDragging(key);
        host.setAttribute('data-resizing', '1');
        try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch (_) {}

        const onMove = (ev) => {
            const px = edge === 'right' ? rect.right - ev.clientX : ev.clientX - rect.left;
            const wanted = px / total;
            const { clamped, atFloor } = commitShare(key, wanted);
            setDragInfo({ key, px: Math.round(clamped * total), pct: Math.round(clamped * 100), atFloor });
        };
        const onUp = () => {
            setDragging(null);
            setDragInfo(null);
            host.removeAttribute('data-resizing');
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
    };

    /* Keyboard. `edge` matters: on a right-hand column, Left grows it. The
       arrow should move the BOUNDARY the way the eye expects, not the number. */
    const onSplitKeyDown = (key, edge) => (e) => {
        const grow = edge === 'right' ? 'ArrowLeft' : 'ArrowRight';
        const shrink = edge === 'right' ? 'ArrowRight' : 'ArrowLeft';
        const b = SPLIT_BOUNDS[key] || { min: 0, max: 0.55 };
        const step = e.shiftKey ? 0.05 : 0.01;
        let next = null;

        if (e.key === grow) next = shareOf(key) + step;
        else if (e.key === shrink) next = shareOf(key) - step;
        else if (e.key === 'Home') next = b.min;
        else if (e.key === 'End') next = b.max;
        else if (e.key === 'Enter' || e.key === ' ') { resetSplit(key)(); e.preventDefault(); return; }
        else return;

        e.preventDefault();
        const { clamped } = commitShare(key, next);
        const total = Math.max(1, panesRef.current?.getBoundingClientRect().width || 1);
        setDragInfo({ key, px: Math.round(clamped * total), pct: Math.round(clamped * 100), atFloor: clamped !== next });
        /* The read-out has to be visible for a keyboard user too, and it has to
           go away on its own — a badge that needs dismissing is a second task. */
        clearTimeout(splitReadoutTimer.current);
        splitReadoutTimer.current = setTimeout(() => setDragInfo(null), 1400);
    };

    const splitReadoutTimer = useRef(null);
    useEffect(() => () => clearTimeout(splitReadoutTimer.current), []);

    /* Double-click, or Enter on a focused handle: back to what this preset
       says this pane is worth. One pane, not all of them — resetting the whole
       composition because one column drifted is the kind of over-correction
       that stops people touching the control at all. */
    const resetSplit = (key) => () => {
        const base = LAYOUT_PRESETS.find(p => p.id === currentPresetId)?.comp;
        if (!base) return;
        const share = key === 'catalog' ? (base.catalog?.size ?? 0.2) : (base.split?.tender ?? 0.3);
        commitShare(key, share);
        addToast(`${key === 'catalog' ? 'Catalog' : 'Payment'} width reset`, 'info');
    };

    // Esc closes the top layer, and only the top layer.
    useEffect(() => {
        if (!openSheet) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') setOpenSheet(null); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [openSheet]);

    // Item Discount Modal State
    const [itemDiscountModal, setItemDiscountModal] = useState({ show: false, item: null, discType: 'fixed', discValue: '' });

    // Converter Modal State (Price / Qty / Total)
    const [converterModal, setConverterModal] = useState({ show: false, item: null, mode: 'price', price: '', qty: '', total: '' });

    // Global Discount Modal State
    const [globalDiscountModal, setGlobalDiscountModal] = useState({ show: false, type: 'fixed', value: '' });


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

    // Persist Senior Mode (session storage, resets on logout).
    // DRAGNET-FIX: this used to ALSO write document.documentElement.style.fontSize
    // directly (in percent). OneGlanceLayout.jsx independently writes the same
    // property from settings.senior_mode/isLargeText (in px) on every render where
    // its own effect deps change -- two writers on one DOM property, disagreeing
    // both in source of truth and in unit, meant either one could silently undo
    // the other. OneGlanceLayout already reads this exact sessionStorage key as
    // its per-session override (see its effect below `isLargeText`), so this
    // effect now only persists the flag; OneGlanceLayout is the single writer of
    // documentElement.style.fontSize.
    useEffect(() => {
        sessionStorage.setItem('pos_senior_mode', JSON.stringify(seniorMode));
        // Tell OneGlanceLayout (the single writer of documentElement.style.fontSize)
        // to re-read the override right now. A plain sessionStorage write does not
        // trigger a React re-render in this same tab -- the native 'storage' event
        // only fires in OTHER tabs -- so without this the toggle would only take
        // effect after the next navigation/mount.
        window.dispatchEvent(new CustomEvent('vq:pos-senior-mode-changed', { detail: { seniorMode } }));
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
        /* In a restaurant an item has to belong to a table. Adding one with no
           table picked would build an order the floor cannot see and the
           kitchen can never be told about. */
        if (tableMode && !selectedTable) {
            addToast('Pick a table first — an order has to belong to one.', 'warning');
            return;
        }
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
        } else if (tableMode) {
            addWithOptions(product);
        } else {
            addToCart(product);
        }
        updateActiveSale({ searchTerm: '' });
        setSearchResults([]);
        if (searchInputRef.current) searchInputRef.current.focus();
    };

    const addToCart = (product, variant = null, mods = null) => {
        const currentCart = activeSale.cart;
        /* Two of the same burger with different options are two LINES, not one
           line of two -- the kitchen has to cook them differently and the
           customer is charged differently. So the options are part of the
           identity, and a plain item keeps exactly the key it always had. */
        const modKey = mods && mods.length
            ? '-' + mods.map(m => m.id).sort().join('.')
            : '';
        const cartItemId = (variant ? `${product.id}-${variant.id}` : `${product.id}`) + modKey;

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
            const modDelta = (mods || []).reduce((a, m) => a + (Number(m.price_delta) || 0), 0);
            newCart = [...currentCart, {
                cartItemId,
                lineId: cartItemId,
                id: product.id,
                variant_id: variant ? variant.id : null,
                name,
                price: price + modDelta,
                original_price: price,
                basePrice: price,
                mods: mods || [],
                sent: false,
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

    const taxRate = enableTax ? (activeSale.taxRate !== undefined ? activeSale.taxRate : parseFloat(settings?.default_tax_rate || 0)) : 0;
    const taxInclusive = enableTax ? (activeSale.taxInclusive !== undefined ? activeSale.taxInclusive : false) : false;

    // Subtotal includes free items (gross sales value)
    const subtotal = activeSale.cart.reduce((acc, item) => acc + ((item.key_price || item.price) * (item.qty + (enableFreeQty ? (item.freeQuantity || 0) : 0))), 0);

    // Calculate discounts
    const freeItemDiscounts = enableFreeQty ? activeSale.cart.reduce((acc, item) => acc + ((item.freeQuantity || 0) * (item.key_price || item.price)), 0) : 0;
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
    const taxAmount = enableTax
        ? (taxInclusive 
            ? taxableAmount - (taxableAmount / (1 + taxRate / 100))
            : (taxableAmount * taxRate) / 100)
        : 0;
    const additionalCharges = parseFloat(activeSale.additionalCharges || 0);

    /* SERVICE CHARGE is the house's, and it is a percentage of what was
       actually eaten -- so it is taken on the discounted net, not on the gross
       menu price. Counter tills never charge one, which is why it is gated on
       the terminal rather than on a checkbox somebody would have to remember
       to clear.

       A TIP is not the house's money. It is typed per sale because it is the
       customer's decision, it is never a percentage of anything by default,
       and on the server it posts to a liability rather than to income. */
    const serviceChargePct = tableMode ? (parseFloat(serviceChargeSetting) || 0) : 0;
    const serviceCharge = serviceChargePct > 0
        ? Math.round(((taxableAmount * serviceChargePct) / 100) * 100) / 100
        : 0;
    const tipAmount = tableMode ? (parseFloat(activeSale.tipAmount || 0) || 0) : 0;

    const rawCartTotal = (taxInclusive ? taxableAmount : taxableAmount + taxAmount)
        + additionalCharges + serviceCharge + tipAmount;
    /* The drawer's switch decides WHETHER to round; `settings` still decides
       to what precision, so turning it on does not silently change a store
       that rounds to two decimals into one that rounds to whole units. */
    const cartTotal = roundOff ? roundTotal(rawCartTotal, settings) : parseFloat(rawCartTotal || 0);

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
            extra_charge_value: additionalCharges,
            extra_charge_label: additionalCharges > 0 ? (activeSale.additionalChargesLabel || 'Additional charge') : null,
            service_charge: serviceCharge,
            tip_amount: tipAmount,
            notes: activeSale.remarks || activeSale.notes || paymentData.notes || '',
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
            console.log("Checkout processing check:", error);
            
            // Layout Law fix (errors_as_offline): Differentiate network failure from 4xx API errors
            if (error.response && error.response.status >= 400 && error.response.status < 500) {
                const errMsg = error.response.data?.message || error.response.data?.error || 'Validation or authorization error occurred.';
                showAlert('Checkout Error', errMsg, 'error');
                setProcessingPayment(false);
                return;
            }

            // Save to offline queue for network failures
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

        /* A settled table frees itself. Doing it here rather than on the floor
           screen means it happens on the one event that actually proves the
           money was taken. */
        if (settlingOccupancy) releaseSettledTable(data.sale_id || data.id);

        /* The same event, for a table being worked in this screen rather than
           handed over from another one. `pending_settle` is what makes a split
           bill honest: the server stamps only the lines this payment covered
           and leaves the rest of the table owing. */
        if (tableMode && tables.selected?.occupancy_id) {
            const occ = tables.selected.occupancy_id;
            const part = tables.selected.pending_settle?.id || null;
            tables.markSettled(occ, data.sale_id || data.id, part).then(res => {
                if (res && res.closed) {
                    loadedOccupancy.current = null;
                    tables.select(null);
                    addToast('Table paid and free', 'success');
                } else if (res) {
                    /* Part paid. Reload what is left so the next person's
                       share is the remainder and not the whole bill again. */
                    loadedOccupancy.current = null;
                    addToast(`Part paid — ${money(res.remaining_total || 0)} still on the table`, 'info');
                }
            });
        }

        /* Pulse the cash drawer on a cash tender. AMDStation.openDrawer() and the
           thermal_open_drawer setting both existed with nothing calling them on a
           completed sale -- the drawer only ever opened from a manual button. */
        if (openDrawerOnCash && (paymentData.method === 'cash' || paymentMethod === 'cash')) {
            try {
                if (window.AMDStation && typeof window.AMDStation.openDrawer === 'function') {
                    window.AMDStation.openDrawer();
                }
            } catch (_) { /* no station: the sale still completed */ }
        }

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
                    <div className="vq-success-pop bg-neutral-950 p-6 rounded-2xl border-2 border-neutral-800 shadow-2xl flex flex-col items-center justify-center">
                        <span className="text-sm font-bold text-ink-muted uppercase block tracking-widest mb-2">
                            Amount Paid
                        </span>
                        <span
                            className="font-bold text-emerald-400 dark:text-emerald-400 block whitespace-nowrap"
                            style={{ fontSize: seniorMode ? '46px' : '38px' }}
                        >
                            {formatCurrency(paymentData.totalPaid, store || settings)}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-950 p-4 rounded-2xl border-2 border-neutral-800 flex flex-col items-center justify-center">
                            <span className="text-1xs font-bold text-ink-muted uppercase block tracking-wider mb-1.5">
                                Change Due
                            </span>
                            <span className="font-bold text-brand-400 block whitespace-nowrap" style={{ fontSize: seniorMode ? '30px' : '24px' }}>
                                {formatCurrency(paymentData.change, store || settings)}
                            </span>
                        </div>
                        <div className="bg-neutral-950 p-4 rounded-2xl border-2 border-neutral-800 text-center">
                            <span className="text-1xs font-bold text-ink-muted uppercase block tracking-wider mb-1.5">
                                Total Items
                            </span>
                            <span className="font-bold text-white block" style={{ fontSize: seniorMode ? '30px' : '24px' }}>
                                {totalItemsCount}
                            </span>
                        </div>
                    </div>

                    {data.manufacturing_notifications && data.manufacturing_notifications.length > 0 && (
                        <div className="mt-2 text-left bg-amber-500/15 p-3 rounded-xl border border-amber-500/30 text-xs text-amber-400 flex items-start gap-2">
                            <Package size={15} className="shrink-0 mt-0.5" />
                            <span><span className="font-bold">Auto-Manufacturing:</span> {data.manufacturing_notifications.join('\n')}</span>
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
                toggleFullscreen();
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

    // Global Keyboard Handler with Layout Law key_guard
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            const activeElement = document.activeElement;
            const isInputFocused = activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' || 
                activeElement.isContentEditable
            );

            // Esc always works to close top layers
            if (e.key === 'Escape') {
                setSettingsOpen(false);
                setShowSetupWizard(false);
                setPaymentModalOpen(false);
                setShowSyncHub(false);
                setParkedDropdownOpen(false);
                setShowRecentInvoices(false);
                return;
            }

            /* '?' opens the one settings surface AT the key map, rather than the
               second modal that used to duplicate it. It opens rather than
               toggles: Esc is what closes the top layer, everywhere, and a key
               that sometimes opens and sometimes closes is a key you have to
               look at the screen to use. */
            if (!isInputFocused && e.key === '?') {
                e.preventDefault();
                setSettingsTab('keys');
                setSettingsOpen(true);
                return;
            }

            /* Alt+L opens it at Layout — the shortcut the old picker advertised
               in its tooltip and never bound. Deliberately NOT bare 'L': a
               keyboard-wedge barcode scanner types its payload as keystrokes,
               and if the scan field has lost focus an 'L' inside a barcode
               would open a settings panel in the middle of a scan. */
            if (!isInputFocused && (e.key === 'l' || e.key === 'L') && e.altKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setSettingsTab('layout');
                setSettingsOpen(true);
                return;
            }

            // Key guard: suspend POS functional F-keys and shortcuts if typing in input field
            if (isInputFocused) return;

            // Functional Keyboard Map
            if (e.key === 'F1' || e.key === 'F2') {
                e.preventDefault();
                const searchInput = document.querySelector('#tour-pos-product input');
                if (searchInput) searchInput.focus();
            } else if (e.key === 'F8') {
                e.preventDefault();
                showInput('Additional Charges', 'Enter extra charge amount (e.g. 150)', (val) => {
                    const charge = parseFloat(val);
                    if (!isNaN(charge)) {
                        updateActiveSale({ additionalCharges: charge });
                        addToast(`Additional charge of ${formatCurrency(charge, store || settings)} added`, 'success');
                    }
                });
            } else if (e.key === 'F9') {
                e.preventDefault();
                showInput('Document Discount', 'Enter fixed discount amount', (val) => {
                    const disc = parseFloat(val);
                    if (!isNaN(disc)) {
                        updateActiveSale({ discountType: 'fixed', discountValue: disc });
                        addToast(`Document discount of ${formatCurrency(disc, store || settings)} applied`, 'success');
                    }
                });
            } else if (e.key === 'F10') {
                e.preventDefault();
                if (activeSale.cart.length > 0 && !processingPayment) {
                    handleCheckoutClick();
                }
            } else if (e.key === 'F11') {
                e.preventDefault();
                setShowQuickPartyModal(true);
            } else if (e.key === 'F12') {
                e.preventDefault();
                showInput('Sale Remarks / Notes', 'Enter notes for this sale', (val) => {
                    updateActiveSale({ remarks: val, notes: val });
                    addToast('Sale remarks saved', 'success');
                });
            } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                // Was `handleParkSale()`, which has never existed on this
                // component — Ctrl+S threw a ReferenceError and parked
                // nothing. The function is `handleParkBill`.
                if (activeSale.cart.length > 0) handleParkBill();
            } else if (e.ctrlKey && e.key.toLowerCase() === 't') {
                e.preventDefault();
                createNewSale();
            } else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
                e.preventDefault();
                if (sales.length > 1) {
                    setSales(prev => prev.filter(s => s.id !== activeSaleId));
                }
            } else if (e.altKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                toggleFullscreen();
            } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                // Printable single keypress focuses search input
                const searchInput = document.querySelector('#tour-pos-product input');
                if (searchInput) searchInput.focus();
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [activeSale, activeSaleId, sales, store, settings]);

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

    // Auto-Fill Cash Logic — respects pos_auto_fill_cash setting (or the POS-local
    // 'pos_auto_fill_cash' localStorage override the Setup Wizard writes -- same
    // DB-setting-or-localStorage-override pattern as pos_auto_print above) and
    // only fills when payment method is 'cash'.
    useEffect(() => {
        if (autoFillCash && paymentMethod === 'cash' && activeSale.cart.length > 0) {
            updateActiveSale({ cashReceived: cartTotal });
        }
    }, [cartTotal, paymentMethod, autoFillCash]);


    /* ══════════════════════════════════════════════════════════════════════
       RENDER PIECES

       Every pane's contents is a function rather than a block of JSX nailed
       into one position in the tree. That is the whole reason the engine can
       put the catalog in a left column, in a band across the top, or behind
       a button in a sheet without three copies of it drifting apart — which
       is exactly how the previous build ended up with a catalog that could
       scan in one place and not in another.

       A piece never asks how wide the screen is. It is TOLD what it is —
       `variant`, `tiles`, `compact` — by the engine, through the shell.
       ══════════════════════════════════════════════════════════════════════ */

    const money = (v) => formatCurrency(v, store || settings);

    /* Scan is rank 1 and therefore resident in EVERY composition. It lives in
       the catalog pane when there is a catalog COLUMN to host it, and at the
       head of the cart otherwise — including when the catalog is a band or a
       button, which is the case the old build got wrong. */
    /* Who owns the scan bar and the Add-item button. 'auto' reproduces the old
       derived behaviour -- a resident catalog column swallows it -- but it is a
       choice now, because a shop can legitimately want the bar over the order
       list WITH a catalog beside it, and a scan-led shop can want it inside the
       catalog sheet where the tiles are. */
    const scanBarPref = composition?.scanBar || 'auto';
    const catalogIsColumnPane = !!(layout.catalog && (layout.catalog.mode === 'left' || layout.catalog.mode === 'right'));
    const catalogHostsScan = scanBarPref === 'catalog'
        || (scanBarPref === 'auto' && catalogIsColumnPane);

    const cartQty = activeSale.cart.reduce((sum, item) => sum + item.qty + (item.freeQuantity || 0), 0);

    /* The total is the one number that must never be truncated and never
       wrap. formatToFit walks the numeric ladder — full → thousands →
       compact — and returns the richest form that actually fits the box it
       has been given. Half a total is worse than no total. */
    const fitTotal = (px, fontPx) => {
        try {
            const r = formatToFit(cartTotal, px, fontPx, getCurrencySymbol(store || settings));
            return r?.text || money(cartTotal);
        } catch (e) {
            return money(cartTotal);
        }
    };

    /* ── the scan field ──────────────────────────────────────────────────
       Barcode-first and rank 1, so it is resident in every composition: in
       the catalog pane when there is one, and at the head of the cart when
       there is not. It is never the thing that gets demoted. */
    const renderScan = () => (
        <div className="vq-pane-fixed flex items-center gap-2.5 px-4 py-3 border-b border-line/80 bg-surface shadow-xs">
            <button
                type="button"
                onClick={() => { setSearchQueryForProduct(activeSale.searchTerm); setShowProductModal(true); }}
                className="h-11 px-3.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 border border-brand-200 dark:border-brand-800 flex items-center justify-center gap-1.5 font-bold text-xs transition-all shadow-xs hover:shadow-sm hover:-translate-y-0.5 shrink-0 cursor-pointer"
                title="Create a product without leaving the register"
            >
                <PackagePlus size={17} className="text-brand-600 dark:text-brand-400" />
                <span className="hidden sm:inline">+ Item</span>
            </button>
            <div id="tour-pos-product" className="flex-1 relative min-w-0">
                <AsyncProductCombobox
                    defaultOptions={categoryProducts}
                    value={activeSale.searchTerm}
                    onQueryChange={(val) => updateActiveSale({ searchTerm: val })}
                    onSelect={(product) => handleProductSelect(product)}
                    placeholder="Scan barcode or search item by name / SKU… [F2]"
                    onKeyDown={handleSearchInputKeyDown}
                    inputClassName="!pl-12 !pr-11 font-bold h-11 text-sm bg-sunken/60 focus:bg-surface rounded-xl border-line/90 focus:border-brand-500 shadow-none focus:ring-4 focus:ring-brand-500/15 transition-all"
                    onCreateNew={() => { setSearchQueryForProduct(activeSale.searchTerm); setShowProductModal(true); }}
                    hideCostAndMargin={true}
                    hideSearchIcon={true}
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none z-10 flex items-center gap-1">
                    <ScanBarcode size={20} className="text-brand-600 dark:text-brand-400" />
                </div>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none z-10 flex items-center">
                    <Search size={18} />
                </div>
            </div>
        </div>
    );

    const renderCategoryStrip = () => (
        <div className="vq-pane-fixed flex items-center gap-2 px-3 py-2 border-b border-line bg-surface">
            <button
                type="button"
                onClick={() => scrollCategories('left')}
                className="w-7 h-7 rounded-lg hover:bg-interactive-hover text-ink-muted hover:text-ink flex items-center justify-center shrink-0 border border-line/80 transition-all cursor-pointer"
                aria-label="Scroll categories left"
            >
                <ChevronLeft size={15} />
            </button>
            <div
                ref={categoryScrollRef}
                onWheel={handleCategoryWheel}
                className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none scroll-smooth px-0.5 min-w-0"
                style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
                <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                        selectedCategory === null
                            ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                            : 'bg-app text-ink-secondary border-line hover:bg-interactive-hover hover:border-line-strong'
                    }`}
                >
                    All Items
                </button>
                {categories.filter(cat => (cat.products_count > 0 || cat.product_count > 0)).map(cat => (
                    <button
                        type="button"
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border flex items-center gap-2 max-w-[200px] cursor-pointer ${
                            selectedCategory === cat.id
                                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                                : 'bg-app text-ink-secondary border-line hover:bg-interactive-hover hover:border-line-strong'
                        }`}
                    >
                        <span className="vq-clip min-w-0">{cat.name}</span>
                        <span className={`vq-num text-2xs px-1.5 py-0.5 rounded-md font-bold shrink-0 leading-none ${
                            selectedCategory === cat.id ? 'bg-white/25 text-white' : 'bg-surface text-ink-muted border border-line/50'
                        }`}>
                            {cat.products_count ?? cat.product_count ?? 0}
                        </span>
                    </button>
                ))}
            </div>
            <button
                type="button"
                onClick={() => scrollCategories('right')}
                className="w-7 h-7 rounded-lg hover:bg-interactive-hover text-ink-muted hover:text-ink flex items-center justify-center shrink-0 border border-line/80 transition-all cursor-pointer"
                aria-label="Scroll categories right"
            >
                <ChevronRight size={15} />
            </button>
        </div>
    );

    const pickProduct = (product) => {
        if (returnMode && posReturnMode !== 'open') {
            addToast('In Return Mode, use the reference number to load items.', 'error');
            return;
        }
        handleProductSelect(product);
    };

    /* Catalog rows — the `list` fit. Used in a narrow column and in the
       overlay, where width is plentiful but the row form is still the one
       that scans fastest. */
    const renderProductRow = (product) => (
        <button
            key={product.id}
            type="button"
            onClick={() => pickProduct(product)}
            className="w-full bg-surface rounded-xl border border-line hover:border-brand-500 transition-all shadow-sm text-left flex items-center justify-between p-2.5 gap-3 relative overflow-hidden cursor-pointer group"
        >
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-lg bg-sunken flex items-center justify-center overflow-hidden shrink-0 border border-line/60">
                    {product.image_url || product.image_path
                        ? <img src={product.image_url || product.image_path} alt="" className="w-full h-full object-cover" />
                        : <Package className="text-ink-muted" size={19} />}
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="vq-clip-2 font-bold text-ink leading-snug text-xs sm:text-sm group-hover:text-brand-600 transition-colors">
                        {product.name}
                    </h4>
                    <span className="vq-clip text-3xs text-ink-muted font-bold uppercase tracking-wider block mt-0.5">
                        {product.category?.name || product.category_name || 'General'}
                    </span>
                </div>
            </div>
            <div className="text-right shrink-0 flex items-center gap-3">
                <div>
                    <span className="text-4xs font-bold text-ink-muted uppercase tracking-wider block leading-none mb-0.5">Stock</span>
                    <span className={`vq-num text-xs font-bold leading-none ${product.stock_quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {formatNumber(product.stock_quantity || 0, 0)}
                    </span>
                </div>
                <div>
                    <span className="text-4xs font-bold text-ink-muted uppercase tracking-wider block leading-none mb-0.5">Price</span>
                    <span className="vq-num font-bold text-brand-600 dark:text-brand-400 block leading-none text-xs sm:text-sm">
                        {money(product.price || product.selling_price || 0)}
                    </span>
                </div>
            </div>
            {product.variants && product.variants.length > 0 && (
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-500" />
            )}
        </button>
    );

    /* ── THE PILL ────────────────────────────────────────────────────────
       The third shape, and the one a short menu actually wants. A card gives
       every product a picture and a stock read-out; a row gives it a full line.
       A menu of twenty-five things needs neither -- it needs all twenty-five
       ON SCREEN AT ONCE, which is what turns the catalog from something you
       search into something you point at.

       So a pill is the name, the price, and nothing else, wrapped as many to a
       row as fit. It keeps the two things the other shapes would not give up:
       the in-cart count, because a tap with no feedback is how the same coffee
       gets rung twice, and the out-of-stock state, because selling something
       that is not there is worse than any layout problem. */
    const renderProductPill = (product) => {
        const inCart = inCartQty.get(product.id) || 0;
        const stock = product.stock_quantity;
        const out = stock !== undefined && Number(stock) <= 0;
        return (
            <button
                key={product.id}
                type="button"
                onClick={() => pickProduct(product)}
                data-incart={inCart > 0 ? '1' : '0'}
                data-out={out ? '1' : '0'}
                className="vq-pill"
                title={`${product.name}${out ? ' — out of stock' : ''}`}
            >
                <span className="vq-pill-name vq-clip">{product.name}</span>
                <span className="vq-num vq-pill-price">
                    {money(product.price || product.selling_price || 0)}
                </span>
                {inCart > 0 && (
                    <span className="vq-pill-n vq-num" aria-label={`${inCart} in the current order`}>
                        {inCart}
                    </span>
                )}
            </button>
        );
    };

    /* Catalog tiles — the `grid-2up` / `grid-3up` fits and the band. */
    /* How much of this product is already in the cart. The catalog had no idea
       the cart existed, so on a catalog-led layout -- where the cart may not
       even be on screen -- an operator tapping tiles had no feedback at all
       and no way to tell a double-tap from a missed one. */
    const inCartQty = React.useMemo(() => {
        const m = new Map();
        for (const l of (activeSale.cart || [])) {
            m.set(l.id, (m.get(l.id) || 0) + Number(l.qty || 0));
        }
        return m;
    }, [activeSale.cart]);

    const renderProductTile = (product) => {
        const inCart = inCartQty.get(product.id) || 0;
        const stock = product.stock_quantity;
        const out = stock !== undefined && Number(stock) <= 0;
        return (
            <button
                key={product.id}
                type="button"
                onClick={() => pickProduct(product)}
                data-incart={inCart > 0 ? '1' : '0'}
                /* Type, radius and spacing all come off the V6 ramp now. The old
                   tile mixed text-xs / text-3xs / rounded-xl / p-3 with hand-picked
                   min-heights, none of which appear in the token set -- which is
                   why the catalog read as a different product from the panes
                   around it. */
                className="vq-tile group"
                title={product.name}
            >
                <span className="vq-tile-top">
                    <span className="vq-tile-thumb">
                        {product.image_url || product.image_path
                            ? <img src={product.image_url || product.image_path} alt="" loading="lazy" />
                            : <Package size={16} strokeWidth={2} />}
                    </span>
                    <span className="vq-tile-id">
                        <span className="vq-tile-name vq-clip-2">{product.name}</span>
                        <span className="vq-tile-meta vq-clip">
                            {product.category?.name || product.category_name || product.sku || ''}
                        </span>
                    </span>
                    {product.variants && product.variants.length > 0 && (
                        <span className="vq-tile-dot" title="Has variants" />
                    )}
                </span>

                <span className="vq-tile-foot">
                    <span className={`vq-tile-stock${out ? ' is-out' : ''}`}>
                        {stock !== undefined ? `${formatNumber(stock || 0, 0)} left` : ''}
                    </span>
                    <span className="vq-num vq-tile-price">
                        {money(product.price || product.selling_price || 0)}
                    </span>
                </span>

                {/* In the cart, and how many. Sits on the tile rather than in a
                    corner of the pane, because the question it answers -- "did
                    that tap land?" -- is asked of THIS tile. */}
                {inCart > 0 && (
                    <span className="vq-tile-badge vq-num" aria-label={`${inCart} in the current order`}>
                        {formatNumber(inCart, 0)}
                    </span>
                )}
            </button>
        );
    };

    const renderCatalogBody = ({ variant = 'list', tiles = 0 } = {}) => {
        /* The engine derives a shape from the width it can afford, which is
           the right default and the wrong answer for a shop with an opinion.
           A stated preference outranks the derivation in both directions --
           rows in a wide column, cards in a narrow one. */
        const shape = composition?.catalogShape || 'auto';
        const asPills = shape === 'pills';
        const asTiles = shape === 'cards' ? true
            : (shape === 'rows' || asPills) ? false
            : (variant !== 'list' || tiles > 0);
        const cols = tiles || (variant === 'grid-3up' ? 3 : 2);

        if (isLoadingProducts) {
            /* A skeleton shaped like the real grid/list, not a spinner --
               the catalog appears to already be "there", just not filled
               in yet, which reads faster than a centered spinner even when
               the actual wait time is identical. */
            if (asTiles) {
                return (
                    <div className="vq-tiles p-3" style={{ '--vq-tiles': cols }}>
                        {Array.from({ length: cols * 3 }).map((_, i) => (
                            <div key={i} className="bg-surface border border-line rounded-xl p-3 flex flex-col gap-2" style={{ minHeight: 76 }} aria-hidden="true">
                                <div className="flex items-start gap-2">
                                    <div className="w-9 h-9 rounded-lg bg-sunken shrink-0 animate-pulse" />
                                    <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
                                        <div className="h-2.5 rounded-full bg-sunken animate-pulse" style={{ width: '85%' }} />
                                        <div className="h-2 rounded-full bg-sunken animate-pulse" style={{ width: '55%' }} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-line/50">
                                    <div className="h-2 w-10 rounded-full bg-sunken animate-pulse" />
                                    <div className="h-4 w-12 rounded-md bg-sunken animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }
            return (
                <div className="p-3 space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-surface border border-line rounded-xl p-2.5 flex items-center gap-3" aria-hidden="true">
                            <div className="w-10 h-10 rounded-lg bg-sunken shrink-0 animate-pulse" />
                            <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="h-3 rounded-full bg-sunken animate-pulse" style={{ width: `${62 - (i % 3) * 8}%` }} />
                                <div className="h-2.5 rounded-full bg-sunken animate-pulse" style={{ width: '30%' }} />
                            </div>
                            <div className="h-5 w-16 rounded-lg bg-sunken shrink-0 animate-pulse" />
                        </div>
                    ))}
                </div>
            );
        }
        if (selectedCategory && categoryProducts.length === 0) {
            return (
                <div className="py-16 text-center">
                    <Archive className="mx-auto text-ink-muted opacity-40 mb-4" size={44} />
                    <p className="text-ink-muted font-bold">No products in this category</p>
                </div>
            );
        }
        if (!selectedCategory && categoryProducts.length === 0) {
            return (
                <div className="py-16 flex flex-col items-center justify-center text-ink-muted gap-4 opacity-60">
                    <div className="w-16 h-16 rounded-lg bg-sunken flex items-center justify-center">
                        <Search size={28} />
                    </div>
                    <div className="text-center px-4">
                        <p className="font-bold text-ink-secondary" style={{ fontSize: 'var(--vq-t-lg)' }}>Start selling</p>
                        <p className="font-medium">Scan an item, or pick a category</p>
                    </div>
                </div>
            );
        }
        if (asPills) {
            return (
                <div className="vq-pills p-3">
                    {(Array.isArray(categoryProducts) ? categoryProducts : []).map(renderProductPill)}
                </div>
            );
        }
        if (asTiles) {
            return (
                <div className="vq-tiles p-3" style={{ '--vq-tiles': cols }}>
                    {(Array.isArray(categoryProducts) ? categoryProducts : []).map(renderProductTile)}
                </div>
            );
        }
        return (
            <div className="p-3 space-y-2">
                {(Array.isArray(categoryProducts) ? categoryProducts : []).map(renderProductRow)}
            </div>
        );
    };

    /* A splitter is a child of the pane it resizes, pinned to the edge it
       moves. It is a real ARIA separator, not a decorated div: it takes focus,
       it announces its value, and it can be driven entirely from the keyboard.

       `edge` is where the handle SITS on this pane ('left' or 'right'); the
       drag maths needs the opposite — which side of the terminal to measure
       from — which is why the two are inverted on the way through. */
    const renderSplit = (key, edge, offsetPx) => {
        const live = dragInfo && dragInfo.key === key;
        const b = SPLIT_BOUNDS[key] || { min: 0, max: 0.55 };
        const pct = Math.round(shareOf(key) * 100);
        const name = key === 'catalog' ? 'Catalog' : 'Payment';
        return (
            <div
                role="separator"
                tabIndex={0}
                aria-orientation="vertical"
                aria-label={`${name} column width`}
                aria-valuemin={Math.round(b.min * 100)}
                aria-valuemax={Math.round(b.max * 100)}
                aria-valuenow={pct}
                aria-valuetext={`${name} column ${pct} percent, ${Math.round(pxOf(key))} pixels`}
                className="vq-split"
                data-dragging={dragging === key ? '1' : '0'}
                data-atfloor={live && dragInfo.atFloor ? '1' : '0'}
                onPointerDown={startSplitDrag(key, edge)}
                onKeyDown={onSplitKeyDown(key, edge)}
                onDoubleClick={resetSplit(key)}
                title={`Drag, or focus and use \u2190 \u2192. Double-click to reset. Stops at this pane's floor.`}
                style={{ [edge]: `${offsetPx - 7}px` }}
            >
                {live && (
                    <span className="vq-split-readout" aria-hidden="true">
                        <b>{dragInfo.pct}%</b> · {dragInfo.px}px
                        {dragInfo.atFloor ? ' · at its floor' : ''}
                    </span>
                )}
            </div>
        );
    };

    /* ── THE CATALOG BAND ─────────────────────────────────────────────────
       One renderer for both the top and the bottom strip. It used to be two
       copies, and they had already diverged: the bottom one had no category
       strip at all, so a shop with the catalog at the bottom could not change
       category without opening the full-screen sheet.

       Height is the law's tile height times the rows the engine allowed, PLUS
       the strip's own 46px chrome. That addition is the fix for a real clip:
       the engine's `cat.h` budgets tile rows only, so setting the section to
       exactly cat.h left the tiles sharing their row with the category strip
       and cropped their second line of text. Nothing is hard-capped at 220px
       any more either — a three-row strip the engine has already proved the
       height for is three rows, not two and a half. */
    const CAT_STRIP_H = 46;

    /* A band resizes in WHOLE TILE ROWS, because that is the only unit the law
       lets it have: half a row of tiles is a row of clipped tiles. So the drag
       is continuous to the hand and discrete in its effect -- you pull the edge
       down and it steps 1 -> 2 -> 3, with the row count printed while you do
       it. Below the band's own floor it simply stops, the same contract the
       vertical dividers keep. */
    const BAND_MAX_ROWS = 3;

    const startBandDrag = (edge) => (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const host = termRef.current;
        if (!host) return;
        const startY = e.clientY;
        const startRows = Math.max(1, comp0Rows());
        setDragging('band');
        host.setAttribute('data-resizing-y', '1');

        const onMove = (ev) => {
            /* One tile row per 152px of travel, in the direction the edge moves:
               a bottom band grows upward. */
            const dy = (edge === 'bottom' ? startY - ev.clientY : ev.clientY - startY);
            const next = Math.max(1, Math.min(BAND_MAX_ROWS, startRows + Math.round(dy / 152)));
            if (next !== (composition?.catalog?.rows ?? 1)) {
                updateComposition(prev => ({ ...prev, catalog: { ...prev.catalog, rows: next } }));
            }
            setDragInfo({ key: 'band', rows: next, atFloor: next === 1 || next === BAND_MAX_ROWS });
        };
        const onUp = () => {
            setDragging(null);
            setDragInfo(null);
            host.removeAttribute('data-resizing-y');
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
    };

    const comp0Rows = () => composition?.catalog?.rows ?? 1;

    const setBandRows = (n) => updateComposition(prev => ({
        ...prev,
        catalog: { ...prev.catalog, rows: Math.max(1, Math.min(BAND_MAX_ROWS, n)) },
    }));

    const onBandKeyDown = (edge) => (e) => {
        const grow = edge === 'bottom' ? 'ArrowUp' : 'ArrowDown';
        const shrink = edge === 'bottom' ? 'ArrowDown' : 'ArrowUp';
        let next = null;
        if (e.key === grow) next = comp0Rows() + 1;
        else if (e.key === shrink) next = comp0Rows() - 1;
        else if (e.key === 'Home') next = 1;
        else if (e.key === 'End') next = BAND_MAX_ROWS;
        else return;
        e.preventDefault();
        setBandRows(next);
        const shown = Math.max(1, Math.min(BAND_MAX_ROWS, next));
        setDragInfo({ key: 'band', rows: shown, atFloor: shown === 1 || shown === BAND_MAX_ROWS });
        clearTimeout(splitReadoutTimer.current);
        splitReadoutTimer.current = setTimeout(() => setDragInfo(null), 1400);
    };

    const renderBandGrip = (edge) => {
        const live = dragInfo && dragInfo.key === 'band';
        const rows = comp0Rows();
        return (
            <div
                role="separator"
                tabIndex={0}
                aria-orientation="horizontal"
                aria-label="Catalog strip height, in tile rows"
                aria-valuemin={1}
                aria-valuemax={BAND_MAX_ROWS}
                aria-valuenow={rows}
                aria-valuetext={`${rows} tile row${rows === 1 ? '' : 's'}`}
                className="vq-split-y"
                data-dragging={dragging === 'band' ? '1' : '0'}
                data-atfloor={live && dragInfo.atFloor ? '1' : '0'}
                onPointerDown={startBandDrag(edge)}
                onKeyDown={onBandKeyDown(edge)}
                onDoubleClick={() => { setBandRows(1); addToast('Catalog strip reset to one row', 'info'); }}
                title="Drag to add or remove a tile row. Double-click for one row."
                style={{ [edge === 'bottom' ? 'bottom' : 'top']: `${bandOuterH() + GUTTER / 2 - 7}px` }}
            >
                {live && (
                    <span className="vq-split-readout" aria-hidden="true">
                        <b>{dragInfo.rows}</b> row{dragInfo.rows === 1 ? '' : 's'}
                    </span>
                )}
            </div>
        );
    };

    const renderCatalogBand = () => {
        const rows = Math.max(1, cat?.rows || 1);
        const tilesH = rows * 152 + (rows - 1) * GUTTER;   // LAW.terminal.tile_h
        return (
            <section
                className="vq-pane vq-catband bg-surface border border-line shrink-0"
                data-pane="catalog-band"
                style={{ height: tilesH + CAT_STRIP_H }}
            >
                {renderCategoryStrip()}
                <div className="vq-pane-body">
                    <div
                        className={(composition?.catalogShape === 'pills') ? 'vq-pills-band' : 'vq-tiles-band'}
                        data-rows={rows}
                    >
                        {(Array.isArray(categoryProducts) ? categoryProducts : [])
                            .map(composition?.catalogShape === 'pills' ? renderProductPill : renderProductTile)}
                    </div>
                </div>
            </section>
        );
    };

    /* The band's height, so the grip can be placed on its edge from outside it.
       One number, derived the same way the band derives it. */
    const bandOuterH = () => {
        const rows = Math.max(1, cat?.rows || 1);
        return rows * 152 + (rows - 1) * GUTTER + CAT_STRIP_H;
    };

    const renderCatalogPane = (fit, tiles) => (
        <section className="vq-pane bg-surface border border-line" data-pane="catalog">
            <header className="vq-pane-h bg-sunken/60 text-ink-muted border-b border-line">
                <span>Catalog</span>
                <span className="vq-num ml-auto text-2xs opacity-80 font-bold">{categoryProducts.length} items</span>
            </header>
            {catalogHostsScan && renderScan()}
            {renderCategoryStrip()}
            <div className="vq-pane-body bg-app">
                {renderCatalogBody({ variant: fit, tiles: fit === 'list' ? 0 : tiles })}
            </div>
        </section>
    );

    /* ── the cart ────────────────────────────────────────────────────────
       Rank 1 and never demoted. Below its measured floor the LINE relays
       through its own fit ladder — table → relay → minimal — inside the
       container query in pos-law.css, and below the leanest fit the pane
       scrolls rather than breaking. It never becomes a sheet. */
    const renderCartLine = (item, index) => (
        <div key={item.cartItemId} className="vq-line bg-surface border border-line hover:border-brand-300 shadow-xs hover:shadow-md group transition-all py-3">
            {/* Index Badge */}
            <span className="vq-line-idx vq-num text-xs sm:text-sm font-extrabold text-brand-800 dark:text-brand-300 bg-brand-50/80 dark:bg-brand-950/50 rounded-xl w-8 h-8 flex items-center justify-center shrink-0 border border-brand-200/60 font-mono">
                {index + 1}
            </span>

            {/* Product Name & Category / Stock info */}
            <div className="vq-line-name-cell min-w-0 flex flex-col justify-center">
                <h4 className="vq-clip-2 font-bold text-ink text-sm sm:text-base leading-snug">
                    {item.name}
                    {/* FIRED, and PAID. Both are states the waiter must be able
                        to read off the line itself: one says the kitchen owns
                        it now, the other says somebody has already settled it
                        and it must not be charged again. */}
                    {tableMode && item.sent && !item.paidSaleId && (
                        <span className="vqt-line-sent">sent</span>
                    )}
                    {tableMode && item.paidSaleId && (
                        <span className="vqt-line-sent vqt-line-paid">paid</span>
                    )}
                </h4>
                {tableMode && Array.isArray(item.mods) && item.mods.length > 0 && (
                    <span className="vqt-line-mods">
                        {item.mods.map(m => m.name).join(' · ')}
                    </span>
                )}
                {tableMode && item.notes && (
                    <span className="vqt-line-mods"><i>“{item.notes}”</i></span>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                        {item.category || 'General'}
                    </span>
                    {(item.barcode || item.sku) && (
                        <span className="font-mono text-xs font-bold bg-sunken/80 px-2 py-0.5 rounded-md text-ink-secondary border border-line/60">
                            {item.barcode || item.sku}
                        </span>
                    )}
                    {item.qty > item.stock && (
                        <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-950/60 dark:text-red-400 px-2 py-0.5 rounded-md inline-flex items-center">
                            Over stock ({item.stock})
                        </span>
                    )}
                    <span className="vq-line-price-inline vq-num text-xs font-bold text-brand-600 dark:text-brand-400">
                        {money(item.price)} each
                    </span>
                </div>
            </div>

            {/* Unit Price Pill */}
            <div className="vq-line-price flex flex-col items-end shrink-0 justify-center">
                {hasPriceOverridePerm ? (
                    /* The unit price, edited in place. It used to be a button
                        that opened a discount modal -- which meant overriding a
                        rate, the single most common counter negotiation, cost
                        two dialogs. Typing here writes the rate directly and
                        the discount is derived from the original. */
                    <span className="flex flex-col items-end">
                        {item.discount > 0 && (
                            <span className="line-through text-2xs text-ink-muted opacity-70">{money(item.original_price)}</span>
                        )}
                        <input
                            type="text"
                            inputMode="decimal"
                            value={priceDraft?.id === item.cartItemId ? priceDraft.value : String(item.price)}
                            onFocus={e => { setPriceDraft({ id: item.cartItemId, value: String(item.price) }); e.target.select(); }}
                            onChange={e => setPriceDraft({ id: item.cartItemId, value: e.target.value.replace(/[^\d.]/g, '') })}
                            onBlur={() => commitPrice(item)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
                                if (e.key === 'Escape') { setPriceDraft(null); e.currentTarget.blur(); }
                            }}
                            aria-label={`Unit price of ${item.name}`}
                            title="Type a new unit price"
                            className="vq-num vq-line-rate w-24 text-right text-xs sm:text-sm font-extrabold
                                       text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40
                                       border border-brand-200/80 dark:border-brand-800 px-2.5 py-1.5 rounded-xl
                                       focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                        />
                    </span>
                ) : hasDiscountPerm ? (
                    <button
                        type="button"
                        onClick={() => openItemDiscountModal(item)}
                        title="Click to edit line discount"
                        className="vq-num text-xs sm:text-sm font-extrabold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-800 px-3 py-1.5 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-all flex flex-col items-end cursor-pointer shadow-xs"
                    >
                        {item.discount > 0 ? (
                            <>
                                <span className="line-through text-2xs text-ink-muted opacity-70">{money(item.original_price)}</span>
                                <span>{money(item.price)}</span>
                            </>
                        ) : money(item.price)}
                    </button>
                ) : (
                    <span className="vq-num text-xs sm:text-sm font-extrabold text-ink px-3 py-1.5 rounded-xl bg-sunken border border-line">
                        {money(item.price)}
                    </span>
                )}
                {item.discount > 0 && (
                    <span className="vq-num text-2xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        −{money(item.discount)}
                    </span>
                )}
            </div>

            {/* Line Controls: Quick Edit & Quantity Stepper */}
            <div className="vq-line-ctl flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    onClick={() => openConverterModal(item)}
                    title="Edit price, quantity or rate"
                    className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-100 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                >
                    <ArrowLeftRight size={16} strokeWidth={2.5} />
                </button>

                <div className="flex items-center bg-sunken/80 rounded-xl border border-line/80 overflow-hidden p-0.5 shadow-xs">
                    <button
                        type="button"
                        onClick={() => updateQty(item.cartItemId, -1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface text-ink-secondary hover:text-ink transition-all cursor-pointer"
                        aria-label="Decrease quantity"
                    >
                        <MinusCircle size={17} />
                    </button>
                    {/* Typeable, not just steppable. The stepper is fine for
                        1 -> 2; it is not fine for 1 -> 24, which is a normal
                        thing to sell, and the only way to do it before was to
                        open the converter modal. Enter or blur commits; Escape
                        puts the old value back. */}
                    <input
                        type="text"
                        inputMode="decimal"
                        value={qtyDraft?.id === item.cartItemId ? qtyDraft.value : String(item.qty)}
                        onFocus={e => { setQtyDraft({ id: item.cartItemId, value: String(item.qty) }); e.target.select(); }}
                        onChange={e => setQtyDraft({ id: item.cartItemId, value: e.target.value.replace(/[^\d.]/g, '') })}
                        onBlur={() => commitQty(item)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
                            if (e.key === 'Escape') { setQtyDraft(null); e.currentTarget.blur(); }
                        }}
                        aria-label={`Quantity of ${item.name}`}
                        className="vq-num vq-line-qty w-12 text-center font-extrabold text-ink text-sm sm:text-base
                                   bg-transparent border-0 rounded-lg focus:outline-none
                                   focus:bg-surface focus:ring-2 focus:ring-brand-500/40"
                    />
                    <button
                        type="button"
                        onClick={() => updateQty(item.cartItemId, 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface text-ink-secondary hover:text-ink transition-all cursor-pointer"
                        aria-label="Increase quantity"
                    >
                        <PlusCircle size={17} />
                    </button>
                </div>

                {hasDiscountPerm && enableFreeQty && showFreeQty && (
                    <div className="flex items-center bg-emerald-50 dark:bg-emerald-900/20 p-0.5 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                        <button
                            type="button"
                            onClick={() => updateFreeQty(item.cartItemId, -1)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 cursor-pointer"
                            aria-label="Decrease free quantity"
                        >
                            <MinusCircle size={15} />
                        </button>
                        <div className="flex flex-col items-center w-10 leading-none shrink-0">
                            <span className="vq-num font-extrabold text-xs text-emerald-700 dark:text-emerald-400 whitespace-nowrap">{item.freeQuantity || 0}</span>
                            <span className="text-3xs font-bold text-emerald-500 uppercase whitespace-nowrap">Free</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => updateFreeQty(item.cartItemId, 1)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 cursor-pointer"
                            aria-label="Increase free quantity"
                        >
                            <PlusCircle size={15} />
                        </button>
                    </div>
                )}
            </div>

            {/* Line Total */}
            <div className="vq-line-total text-right shrink-0 min-w-[85px]">
                <span className="text-2xs font-extrabold text-ink-muted uppercase tracking-wider block leading-none mb-1">Total</span>
                <span className="vq-num font-extrabold text-ink block leading-tight text-base sm:text-lg">
                    {money(item.price * item.qty)}
                </span>
                {showMargin && item.cost_price > 0 && (
                    <span className="vq-num text-2xs font-bold text-emerald-600 dark:text-emerald-400 block leading-none mt-1">
                        Margin {Math.round(((item.price - item.cost_price) / item.price) * 100)}%
                    </span>
                )}
            </div>

            {/* Delete Line */}
            <button
                type="button"
                onClick={() => removeFromCart(item.cartItemId)}
                className="vq-line-del w-9 h-9 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-ink-muted hover:text-rose-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                aria-label="Remove item"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );

    const renderReturnBanner = () => (
        <div className="vq-pane-fixed mx-3 mt-2 mb-1 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs font-bold text-red-500 mb-2 uppercase tracking-wider">Return mode active</p>
            <p className="text-3xs text-red-400 mb-2">
                {posReturnMode === 'open'
                    ? 'Add items to return. A reference number is optional and links the refund to the original sale.'
                    : posReturnMode === 'customer_or_reference'
                        ? 'Search by customer, or enter a reference number.'
                        : 'Enter the original sale reference number to load its items.'}
            </p>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={returnSaleRef}
                    onChange={e => setReturnSaleRef(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (posReturnMode !== 'open' || returnSaleRef.trim()) && lookupSaleForReturn()}
                    placeholder={posReturnMode === 'open' ? 'Reference number (optional)…' : 'Reference number…'}
                    className="flex-1 min-w-0 px-3 text-xs bg-surface border border-line rounded-lg text-ink placeholder:text-ink-muted outline-none focus:border-red-400"
                />
                {(posReturnMode !== 'open' || returnSaleRef.trim()) && (
                    <button
                        onClick={lookupSaleForReturn}
                        disabled={returnSaleLoading}
                        className="px-4 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                        {returnSaleLoading ? '…' : 'Load'}
                    </button>
                )}
            </div>
        </div>
    );

    const renderCartPane = () => (
        <section
            className="vq-pane bg-surface border border-line/80 shadow-md"
            data-pane="cart"
            data-underflow={layout.cart.underflow ? '1' : '0'}
            style={{ '--vq-pane-min': `${Math.round(layout.cart.minWidth)}px` }}
        >
            <header className="vq-pane-h bg-sunken/60 text-ink-muted border-b border-line">
                <ShoppingCart size={15} className="text-brand-600" />
                <span>{returnMode ? 'Return' : 'Current order'}</span>
                {hasDiscountPerm && enableFreeQty && (
                    <label className="ml-3 flex items-center gap-1.5 cursor-pointer select-none normal-case tracking-normal">
                        <input
                            type="checkbox"
                            checked={showFreeQty}
                            onChange={(e) => setShowFreeQty(e.target.checked)}
                            className="sr-only"
                        />
                        <span className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${showFreeQty ? 'bg-emerald-500' : 'bg-line'}`}>
                            <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showFreeQty ? 'left-4' : 'left-0.5'}`} />
                        </span>
                        <span className="text-3xs font-bold">Free qty</span>
                    </label>
                )}
                <span className="vq-num ml-auto text-2xs opacity-80 font-bold">
                    {activeSale.cart.length} lines · {cartQty} qty
                </span>
                {/* The catalog trigger. It used to be a full-width dock
                    row that cost every pane 72px of height, including the
                    payment column with nothing under it. Here they cost none. */}
                {renderPaneTriggers()}
            </header>

            {/* The selected table, and the four things you can do to it that
                are not "take money". It sits above the scan bar because it is
                the CONTEXT for everything below: which table these lines
                belong to is not a detail of the order, it is the order. */}
            {tableMode && selectedTable && (
                <TableBar
                    table={selectedTable}
                    covers={tableCovers}
                    orderType={tableOrderType}
                    unsent={activeSale.cart.filter(l => !l.sent).length}
                    elapsedLabel={tableElapsed(selectedTable.opened_at)}
                    onBack={backToFloor}
                    onCovers={setCovers}
                    onOrderType={setOrderType}
                    onFire={fireToKitchen}
                    onBill={dropCheck}
                    checkDropped={!!selectedTable.check_dropped_at}
                    onSplit={() => setSplitOpen(true)}
                    onMove={() => setMovingTable(true)}
                    onClose={closeSelectedTable}
                    busy={tables.busy}
                    compact={layout.cart && layout.cart.px < 460}
                />
            )}

            {!catalogHostsScan && renderScan()}
            {returnMode && renderReturnBanner()}

            <div ref={cartListRef} className="vq-pane-body vq-cart-lines p-3 space-y-2">
                {activeSale.cart.map(renderCartLine)}
                {activeSale.cart.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
                        <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/40 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4 shadow-sm">
                            <ScanBarcode size={32} strokeWidth={1.75} />
                        </div>
                        <h3 className="font-bold text-ink text-base sm:text-lg mb-1">
                            {tableMode && !selectedTable ? 'Pick a table to start' : 'Scan Barcode or Search Item'}
                        </h3>
                        <p className="text-xs text-ink-muted max-w-sm mb-6 leading-relaxed">
                            Point your handheld barcode scanner or type a product name, SKU, or batch number to start this order.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
                            <span className="text-3xs font-bold text-ink-muted bg-surface border border-line px-2.5 py-1 rounded-lg shadow-xs">
                                <kbd className="font-mono text-ink font-bold">F2</kbd> Focus Barcode
                            </span>
                            <span className="text-3xs font-bold text-ink-muted bg-surface border border-line px-2.5 py-1 rounded-lg shadow-xs">
                                <kbd className="font-mono text-ink font-bold">Ctrl+T</kbd> New Tab
                            </span>
                            <span className="text-3xs font-bold text-ink-muted bg-surface border border-line px-2.5 py-1 rounded-lg shadow-xs">
                                <kbd className="font-mono text-ink font-bold">Ctrl+D</kbd> Open Drawer
                            </span>
                            <span className="text-3xs font-bold text-ink-muted bg-surface border border-line px-2.5 py-1 rounded-lg shadow-xs">
                                <kbd className="font-mono text-ink font-bold">Esc</kbd> Cancel
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );

    /* ── the tender ──────────────────────────────────────────────────────
       Column, bar or sheet — the same fields either way. */
    const renderTenderFields = () => (
        <>
            <div id="tour-pos-customer" className="relative z-sticky">
                {customerDropdownOpen ? (
                    <div className="relative">
                        <AsyncPartyCombobox
                            defaultOptions={initialCustomers}
                            selectedItem={activeSale.customer}
                            onSelect={(customer) => { selectCustomer(customer); setCustomerDropdownOpen(false); }}
                            inputClassName="bg-surface border-line text-ink shadow-sm !pl-10 !pr-10 rounded-xl font-bold text-sm h-12"
                            placeholder="Search customer (name, phone)…"
                            onQueryChange={(val) => setCustomerSearchTerm(val)}
                            onCreateNew={() => setShowQuickPartyModal(true)}
                            addNewLabel="Add new customer"
                            type="customer"
                            onEdit={(customer) => { setEditingCustomer(customer); setShowQuickPartyModal(true); }}
                        />
                        <button
                            type="button"
                            onClick={() => setCustomerDropdownOpen(false)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink w-8 h-8 flex items-center justify-center rounded-lg hover:bg-interactive-hover transition-colors cursor-pointer"
                            aria-label="Close customer search"
                        >
                            <X size={18} />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setCustomerDropdownOpen(true)}
                        className="w-full bg-surface p-4 rounded-2xl text-left hover:border-brand-300 hover:shadow-sm transition-all border border-line/80 shadow-xs flex items-center justify-between gap-3 group cursor-pointer"
                    >
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-100 to-teal-50 dark:from-brand-950/60 dark:to-teal-950/40 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800/60 flex items-center justify-center text-base shadow-xs shrink-0">
                                <User size={20} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-xs uppercase font-extrabold text-ink-muted block leading-none mb-1 tracking-wider">Customer</span>
                                <span className="vq-clip font-bold text-ink text-base sm:text-lg block">
                                    {activeSale.customer?.name || 'Walk-in customer'}
                                </span>
                            </div>
                        </div>
                        <Search size={18} className="text-ink-muted group-hover:text-brand-600 transition-colors shrink-0" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
                {hasDiscountPerm && (
                    <button
                        type="button"
                        onClick={() => setGlobalDiscountModal({
                            show: true,
                            type: activeSale.discountType || 'fixed',
                            value: activeSale.discountValue ? String(activeSale.discountValue) : '',
                        })}
                        className="bg-surface p-4 rounded-2xl text-left hover:border-brand-300 hover:shadow-sm transition-all border border-line/80 shadow-xs flex flex-col justify-center cursor-pointer"
                    >
                        <span className="text-xs uppercase font-extrabold text-ink-muted block mb-1 tracking-wider">Bill Discount</span>
                        <span className="vq-clip vq-num text-base sm:text-lg font-extrabold text-brand-600 dark:text-brand-400">
                            {activeSale.discountType === 'percentage'
                                ? `${activeSale.discountValue}% (${money(globalDiscount)})`
                                : money(globalDiscount)}
                        </span>
                    </button>
                )}

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
                        className="w-full h-full bg-surface p-4 rounded-2xl text-left hover:border-brand-300 hover:shadow-sm transition-all border border-line/80 shadow-xs flex flex-col justify-center cursor-pointer"
                    >
                        <span className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs uppercase font-extrabold text-ink-muted tracking-wider">Payment Method</span>
                        </span>
                        <span className="flex items-center gap-2 min-w-0">
                            <CreditCard size={16} className="text-brand-600 dark:text-brand-400 shrink-0" />
                            <span className="vq-clip text-sm sm:text-base font-extrabold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 px-2.5 py-0.5 rounded-md uppercase">
                                {paymentMethod}
                            </span>
                        </span>
                    </button>
                    {paymentDropdownOpen && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-surface rounded-xl shadow-2xl border border-line overflow-hidden z-sticky py-1">
                            {['cash', 'credit', 'bank', 'card', 'online'].map(method => {
                                if (method === 'credit' && !activeSale.customer) return null;
                                return (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => { setPaymentMethod(method); setPaymentDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold capitalize hover:bg-interactive-hover transition-colors cursor-pointer flex items-center justify-between ${paymentMethod === method ? 'text-brand-600 bg-brand-50 dark:bg-brand-950/30' : 'text-ink-secondary'}`}
                                    >
                                        <span>{method}</span>
                                        {paymentMethod === method && <Check size={16} />}
                                    </button>
                                );
                            })}
                            <div className="my-1 border-t border-line/70" />
                            <button
                                type="button"
                                onClick={() => { setPaymentDropdownOpen(false); setPaymentModalOpen(true); }}
                                className="w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold hover:bg-interactive-hover transition-colors cursor-pointer flex items-center gap-2 text-brand-600 dark:text-brand-400"
                            >
                                <Split size={15} className="shrink-0" />
                                <span>Split payment</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── LOCATION ─────────────────────────────────────────────────
                Rank 2, and it had no control at all: PosController sends the
                warehouse list, the payload sends `warehouse_id`, and there was
                nowhere on the screen to pick one -- so every sale in a
                multi-branch store came out of whichever warehouse happened to
                be flagged default.

                Shown only when there is a genuine choice. A single-warehouse
                shop gets nothing, because a select with one option is a
                control that only costs attention. */}
            {warehouses.length > 1 && (
                <div className="relative">
                    <label
                        htmlFor="pos-warehouse"
                        className="text-xs uppercase font-extrabold text-ink-muted block mb-1 tracking-wider"
                    >
                        Location
                    </label>
                    <div className="relative">
                        <Warehouse
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-600 dark:text-brand-400 pointer-events-none"
                        />
                        <select
                            id="pos-warehouse"
                            value={selectedWarehouseId ?? ''}
                            onChange={e => setSelectedWarehouseId(e.target.value ? Number(e.target.value) : null)}
                            className="w-full h-12 pl-10 pr-9 rounded-2xl bg-surface border border-line/80 shadow-xs
                                       text-sm font-bold text-ink appearance-none cursor-pointer
                                       hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40
                                       transition-colors"
                        >
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                        <ChevronRight
                            size={15}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 text-ink-muted pointer-events-none"
                        />
                    </div>
                </div>
            )}

            {/* Financial Breakdown / Total Box */}
            {((enableTax && (taxRate > 0 || taxAmount > 0)) || totalDiscounts > 0 || enableFulfilment || additionalCharges > 0) ? (
                <div className="bg-gradient-to-br from-[#062421] via-[#0A5049] to-[#076B5E] text-white rounded-2xl p-4 sm:p-5 border border-teal-700/50 shadow-lg space-y-3">
                    <div className="flex justify-between items-center gap-2 text-teal-100 text-sm font-semibold">
                        <span>Subtotal</span>
                        <span className="vq-num text-white font-bold text-base">{money(subtotal)}</span>
                    </div>
                    {totalDiscounts > 0 && (
                        <div className="flex justify-between items-center gap-2 text-emerald-300 text-sm font-bold">
                            <span className="vq-clip">
                                Discount{activeSale.discountType === 'percentage' ? ` (${activeSale.discountValue}%)` : ''}
                            </span>
                            <span className="vq-num font-bold text-base">−{money(totalDiscounts)}</span>
                        </div>
                    )}
                    {enableTax && (
                        <div className="flex justify-between items-center gap-2 text-teal-100 text-sm font-semibold">
                            <span>Tax</span>
                            <span className="flex items-center gap-2 min-w-0">
                                <button
                                    type="button"
                                    onClick={() => updateActiveSale({ taxInclusive: !taxInclusive })}
                                    className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-md border transition-colors cursor-pointer ${
                                        taxInclusive
                                            ? 'bg-teal-400/20 border-teal-300/40 text-teal-200'
                                            : 'bg-white/10 border-white/20 text-white/80'
                                    }`}
                                >
                                    {taxInclusive ? 'Incl' : 'Excl'}
                                </button>
                                <span className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setTaxDropdownOpen(!taxDropdownOpen)}
                                        className="px-2.5 py-0.5 rounded-md text-white font-bold text-sm flex items-center gap-1 hover:bg-white/10 transition-colors border border-white/10 cursor-pointer"
                                    >
                                        <span className="vq-clip max-w-[120px]">
                                            {taxRate === 0
                                                ? '0%'
                                                : `${taxRate}%`}
                                        </span>
                                    </button>
                                    {taxDropdownOpen && (
                                        <span className="absolute right-0 bottom-full mb-1 w-48 bg-surface text-ink rounded-xl shadow-2xl border border-line overflow-hidden z-sticky block py-1">
                                            <button
                                                type="button"
                                                onClick={() => { updateActiveSale({ taxRate: 0 }); setTaxDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold hover:bg-interactive-hover transition-colors cursor-pointer ${taxRate === 0 ? 'text-brand-600 bg-brand-50 dark:bg-brand-950/30' : 'text-ink-secondary'}`}
                                            >
                                                None (0%)
                                            </button>
                                            {parsedTaxRates.map((tax) => (
                                                <button
                                                    key={tax.id}
                                                    type="button"
                                                    onClick={() => { updateActiveSale({ taxRate: parseFloat(tax.rate) || 0 }); setTaxDropdownOpen(false); }}
                                                    className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold hover:bg-interactive-hover transition-colors cursor-pointer ${parseFloat(taxRate) === parseFloat(tax.rate) ? 'text-brand-600 bg-brand-50 dark:bg-brand-950/30' : 'text-ink-secondary'}`}
                                                >
                                                    <span className="vq-clip block">{tax.name} ({tax.rate}%)</span>
                                                </button>
                                            ))}
                                        </span>
                                    )}
                                </span>
                                <span className="vq-num text-white font-bold text-base">{money(taxAmount)}</span>
                            </span>
                        </div>
                    )}
                    {enableFulfilment && (
                        <div className="flex justify-between items-center gap-2 text-teal-100 text-sm font-semibold">
                            <span>Fulfilment</span>
                            <button
                                type="button"
                                onClick={() => updateActiveSale({ is_dropship: !(activeSale.is_dropship || false) })}
                                className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer ${
                                    activeSale.is_dropship
                                        ? 'bg-amber-400/20 border-amber-300/40 text-amber-200'
                                        : 'bg-white/10 border-white/20 text-white/80'
                                }`}
                            >
                                <Truck size={14} />
                                {activeSale.is_dropship ? 'Dropship' : 'Direct'}
                            </button>
                        </div>
                    )}
                    {additionalCharges > 0 && (
                        <div className="flex justify-between items-center gap-2 text-teal-100 text-sm font-semibold">
                            <span>Additional Charges</span>
                            <span className="vq-num text-white font-bold text-base">{money(additionalCharges)}</span>
                        </div>
                    )}
                    {serviceCharge > 0 && (
                        <div className="flex justify-between items-center gap-2 text-teal-100 text-sm font-semibold">
                            <span>Service charge <b className="vq-num opacity-80">{serviceChargePct}%</b></span>
                            <span className="vq-num text-white font-bold text-base">{money(serviceCharge)}</span>
                        </div>
                    )}
                    {tableMode && (
                        /* The tip is typed on the bill, not chosen from three
                           preset percentages: a percentage prompt is a nudge,
                           and a till should not be nudging someone else's
                           customer on someone else's behalf. */
                        <div className="flex justify-between items-center gap-2 text-teal-100 text-sm font-semibold">
                            <label htmlFor="vq-tip" className="cursor-pointer">Tip</label>
                            <input
                                id="vq-tip"
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                value={activeSale.tipAmount ?? ''}
                                onChange={e => updateActiveSale({ tipAmount: e.target.value })}
                                placeholder="0.00"
                                className="vq-num w-28 text-right bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white font-bold text-base placeholder:text-white/40 outline-none focus:border-teal-300"
                            />
                        </div>
                    )}
                    <div className="h-px bg-teal-600/40 my-1" />
                    <div className="flex justify-between items-center gap-2 pt-0.5">
                        <span className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-teal-200">Total Payable</span>
                        <span className="vq-num font-extrabold text-white tracking-tight drop-shadow-sm" style={{ fontSize: 'var(--vq-t-total)' }} title={money(cartTotal)}>
                            {money(cartTotal)}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-br from-[#062421] via-[#0A5049] to-[#076B5E] text-white rounded-2xl p-4 sm:p-5 border border-teal-700/50 shadow-lg flex justify-between items-center gap-2">
                    <span className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-teal-200">Total Payable</span>
                    <span className="vq-num font-extrabold text-white tracking-tight drop-shadow-sm" style={{ fontSize: 'var(--vq-t-total)' }} title={money(cartTotal)}>
                        {money(cartTotal)}
                    </span>
                </div>
            )}

            <div id="tour-pos-paid" className="bg-surface p-4 rounded-2xl border border-line/80 shadow-xs">
                <div className="flex justify-between items-center gap-2 mb-2.5">
                    <span className="text-xs sm:text-sm uppercase font-extrabold text-ink-muted tracking-wider">
                        {returnMode ? 'Amount to refund' : 'Amount tendered'}
                    </span>
                    {/* Split payment now lives inside the Payment Method dropdown above
                        (Cash / Credit / Bank / Card / Online), not as a separate button here. */}
                </div>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted font-bold pointer-events-none text-base sm:text-lg">
                        {getCurrencySymbol(store || settings)}
                    </span>
                    <input
                        ref={cashReceivedInputRef}
                        type="number"
                        value={activeSale.cashReceived}
                        onChange={(e) => updateActiveSale({ cashReceived: e.target.value })}
                        onKeyDown={handleTenderedKeyDown}
                        placeholder="0.00"
                        className="vq-num w-full bg-sunken/60 focus:bg-surface border border-line/90 rounded-xl pl-11 pr-24 font-extrabold text-ink focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 outline-none transition-all no-spinner h-14"
                        style={{ fontSize: 'var(--vq-t-num)' }}
                        disabled={activeSale.cart.length === 0}
                    />
                    <button
                        type="button"
                        onClick={() => updateActiveSale({ cashReceived: cartTotal })}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-surface hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 text-xs sm:text-sm text-ink font-extrabold px-3.5 py-2 rounded-lg border border-line cursor-pointer transition-all shadow-xs"
                    >
                        Exact
                    </button>
                </div>

                {paymentMethod === 'cash' && cartTotal > 0 && (
                    <div className="flex items-center gap-2 pt-3 flex-wrap">
                        <span className="text-xs font-extrabold text-ink-muted uppercase tracking-wider">Quick:</span>
                        {[
                            Math.ceil(cartTotal / 100) * 100,
                            Math.ceil(cartTotal / 500) * 500,
                            Math.ceil(cartTotal / 1000) * 1000,
                            Math.ceil(cartTotal / 5000) * 5000,
                        ]
                            // cartTotal itself is deliberately excluded above -- the "Exact" button
                            // already covers it, and repeating it as the first Quick chip was redundant.
                            .filter((v, i, a) => v > cartTotal && a.indexOf(v) === i)
                            .slice(0, 4)
                            .map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => updateActiveSale({ cashReceived: amt })}
                                    className="vq-num text-sm font-extrabold px-3.5 py-1.5 bg-surface hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 text-ink border border-line/80 rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-xs hover:-translate-y-0.5"
                                >
                                    {money(amt)}
                                </button>
                            ))}
                    </div>
                )}
            </div>

            {!returnMode && (
                <div className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xs ${
                    changeDue >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'
                }`}>
                    <div className="flex justify-between items-center gap-2">
                        <span className={`text-sm sm:text-base font-extrabold uppercase tracking-wider ${changeDue >= 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}`}>
                            {changeDue >= 0 ? 'Change due' : 'Shortage'}
                        </span>
                        <span className={`vq-num font-extrabold ${changeDue >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`} style={{ fontSize: 'var(--vq-t-num)' }}>
                            {money(Math.abs(changeDue))}
                        </span>
                    </div>
                </div>
            )}
        </>
    );

    const completeReturn = async () => {
        if (activeSale.cart.length === 0) { addToast('No items in cart', 'error'); return; }
        setReturnProcessing(true);
        try {
            if (posReturnMode === 'open') {
                const response = await axios.post(route('store.pos.return.store', { store_slug: store?.slug }), {
                    items: activeSale.cart.map(i => ({ product_id: i.id, quantity: i.qty, price: i.price })),
                    refund_method: 'cash',
                    reason: 'POS Open Return',
                });
                addToast(`Return processed — Ref: ${response.data.reference}`, 'success');
                setReturnMode(false);
                updateActiveSale({ cart: [], customer: null });
            } else {
                if (!returnSaleId) {
                    addToast('Load the original sale by reference first', 'error');
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
    };

    const renderTenderActions = () => (
        <>
            {returnMode ? (
                <button
                    type="button"
                    onClick={completeReturn}
                    disabled={returnProcessing || activeSale.cart.length === 0}
                    className="w-full rounded-2xl font-extrabold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50 transition-all uppercase tracking-wider h-14 shadow-md cursor-pointer text-base sm:text-lg"
                >
                    {returnProcessing ? 'Processing…' : '↩ Complete return'}
                </button>
            ) : (
                <button
                    type="button"
                    id="tour-pos-checkout"
                    onClick={handleCheckoutClick}
                    disabled={processingPayment || activeSale.cart.length === 0}
                    style={{
                        boxShadow: '0 6px 24px -4px rgba(11, 170, 143, 0.45)'
                    }}
                    className={`w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600 active:scale-[0.98] text-white rounded-2xl font-extrabold flex items-center justify-center gap-3 transition-all h-14 cursor-pointer text-lg sm:text-xl ${processingPayment || activeSale.cart.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {processingPayment
                        ? <Loader2 size={22} className="shrink-0 animate-spin" />
                        : printOnComplete ? <Printer size={22} className="shrink-0" /> : <Check size={22} className="shrink-0" />}
                    <span className="vq-clip font-extrabold">{processingPayment ? 'Processing…' : (printOnComplete ? 'Complete & Print' : 'Complete Sale')}</span>
                    <span className="vq-num px-3 py-1 rounded-xl font-extrabold bg-white/20 border border-white/20 shrink-0 text-base sm:text-lg backdrop-blur-sm">
                        {money(cartTotal)}
                    </span>
                </button>
            )}

            <div className="flex gap-2.5">
                {/* A TABLE IS A HELD SALE. Holding one would park a park, so in
                    the table terminal this slot carries the way back to the
                    floor instead -- which is the control a waiter actually
                    reaches for after sending an order. */}
                {tableMode && !returnMode && selectedTable && (
                    <button
                        type="button"
                        onClick={backToFloor}
                        className="flex-1 bg-surface hover:bg-brand-50 text-ink-secondary hover:text-brand-700 border border-line hover:border-brand-300 active:scale-[0.98] rounded-xl font-extrabold flex items-center justify-center gap-1.5 transition-all h-12 text-sm sm:text-base cursor-pointer shadow-xs"
                    >
                        <ArrowLeft size={17} /> Floor
                    </button>
                )}
                {!tableMode && !returnMode && (
                    <button
                        type="button"
                        onClick={handleParkBill}
                        disabled={parkingBill || activeSale.cart.length === 0}
                        className={`flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-white rounded-xl font-extrabold flex items-center justify-center gap-1.5 transition-all h-12 text-sm sm:text-base cursor-pointer shadow-xs ${parkingBill || activeSale.cart.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Pause size={17} /> {parkingBill ? 'Holding…' : 'Hold'}
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleClearCartWithUndo}
                    className="flex-1 bg-surface hover:bg-rose-50 text-ink-secondary hover:text-rose-600 border border-line hover:border-rose-200 active:scale-[0.98] rounded-xl font-extrabold flex items-center justify-center gap-1.5 transition-all h-12 text-sm sm:text-base cursor-pointer shadow-xs"
                >
                    <X size={17} /> Cancel
                </button>
            </div>
        </>
    );

    const renderTenderPane = () => (
        <section className="vq-pane bg-surface border border-line/80 shadow-md" data-pane="tender">
            <header className="vq-pane-h bg-sunken/60 text-ink-muted border-b border-line">
                <Receipt size={15} className="text-emerald-600 dark:text-emerald-400" />
                <span>Payment</span>
                <span className="vq-num ml-auto text-2xs opacity-80 font-bold">#{activeSale.id}</span>
                {/* With the order column hidden this header is the only one
                    left, so the secondary triggers come here instead. */}
                {!showOrderPane && renderPaneTriggers()}
            </header>
            <div className="vq-pane-body p-3 space-y-2.5">
                {renderTenderFields()}
            </div>
            <footer className="vq-pane-actions bg-sunken/40 border-t border-line">
                {renderTenderActions()}
            </footer>
        </section>
    );


    /* ══════════════════════════════════════════════════════════════════════
       THE SHELL

       Reads the engine's decision and places the pieces. It contains no
       widths, no breakpoints and no "if mobile" — every number below came
       out of composeTerminal(), which measured this element.
       ══════════════════════════════════════════════════════════════════════ */

    const cat = layout.catalog;
    const catIsColumn = !!cat && (cat.mode === 'left' || cat.mode === 'right');
    const catIsBand = !!cat && (cat.mode === 'top' || cat.mode === 'bottom');

    /* The gutter the dividers sit in. One number, matching --vq-gutter in
       pos-law.css — a divider that guesses its own offset drifts off the
       boundary the moment the gutter changes. */
    const GUTTER = 12;

    /* Nothing to divide when nothing is side by side. Stacked and phone put
       every pane on its own row, so a vertical divider there would be a
       control that moves something the operator cannot see. */
    const resizable = layout.regime === 'columns';

    /* Which side the payment panel lives on. Read by the column order, the
       sheet's transform and the splitter's anchor, so there is one answer
       rather than three hard-coded rights. */
    const tenderSide = composition?.tenderSide || 'right';
    const tenderIsColumn = layout.tender.mode === 'column' && tenderSide !== 'bottom';
    const tenderIsRow = layout.tender.mode === 'column' && tenderSide === 'bottom' && resizable;

    /* A catalog-led shop with a handful of SKUs does not always want a standing
       order column -- the tiles carry an in-cart badge and the payment panel
       carries the totals. It can never be hidden when there is nothing else to
       show the sale on, though: with payment on a button and the order gone,
       the cart would be invisible, which is not a layout, it is a bug. */
    const orderCanHide = (layout.catalog && layout.catalog.mode !== 'overlay' && layout.catalog.mode !== 'off')
        && (tenderIsColumn || tenderIsRow);
    const showOrderPane = composition?.showOrder !== false || !orderCanHide;

    /* The floor could not be given a column of its own at this width, so it
       becomes the step it is on a phone. */
    const floorIsStep = tableMode && !(layout.floor && layout.floor.mode === 'left');

    const dockOf = (id) => layout.dock.find(d => d.id === id);
    const tenderDock = dockOf('tender');
    const catalogDock = dockOf('catalog');

    const openTender = () => setOpenSheet('tender');

    /* The dock row only exists to carry the tender. When the tender is an
       inline bar it already has the width for the secondary triggers, so they
       ride along there; in every other composition they live in a pane header,
       where they cost no height at all. One flag, so a trigger is never drawn
       twice or lost between the two. */
    const dockShowsSecondary = !!(tenderDock && tenderDock.inline);

    /* The catalog, as a header chip. Rendered by whichever pane header is
       Rendered by whichever pane header is on screen -- the order pane
       normally, the payment pane when the order column is hidden -- so a
       demoted catalog is always reachable. */
    const renderPaneTriggers = () => {
        if (dockShowsSecondary) return null;
        if (!catalogDock) return null;
        return (
            <>
                {catalogDock && (
                    <button
                        type="button"
                        onClick={() => setOpenSheet('catalog')}
                        className="vq-pane-trigger"
                        title="Open the catalog"
                    >
                        <LayoutGrid size={13} />
                        <span>Catalog</span>
                        {categoryProducts.length > 0 && (
                            <span className="vq-pane-trigger-n vq-num">{categoryProducts.length}</span>
                        )}
                    </button>
                )}
            </>
        );
    };

    const renderDock = () => {
        /* Not `dock.length`: catalog and floor sit in the dock list but
           reserve no height, and an empty dock row still eats a gutter. */
        if (!tenderDock) return null;

        /* An inline tender bar is not a button that opens something — it IS
           the tender, stacked. The total is printed on the control itself,
           which is how the amount stays on screen in every composition the
           law can produce. */
        if (tenderDock && tenderDock.inline) {
            return (
                <div className="vq-dock">
                    <div className="vq-tender-bar flex-1 bg-surface border border-line shadow-sm min-w-0">
                        <div className="min-w-0">
                            <span className="text-3xs uppercase font-bold text-ink-muted block">
                                {activeSale.cart.length} lines · {cartQty} qty
                            </span>
                            <span className="vq-num font-bold text-emerald-600 dark:text-emerald-400 block leading-none"
                                  style={{ fontSize: 'var(--vq-t-total)' }} title={money(cartTotal)}>
                                {money(cartTotal)}
                            </span>
                        </div>
                        <div className="flex-1" />
                        <button
                            onClick={openTender}
                            className="vq-dock-btn bg-sunken text-ink-secondary border border-line shrink-0 cursor-pointer"
                            data-primary="0"
                        >
                            Details
                        </button>
                        <button
                            onClick={handleCheckoutClick}
                            disabled={processingPayment || activeSale.cart.length === 0}
                            className="vq-dock-btn bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 shrink-0 cursor-pointer"
                            data-primary="1"
                        >
                            {processingPayment
                                ? <Loader2 size={18} className="animate-spin" />
                                : printOnComplete ? <Printer size={18} /> : <Check size={18} />}
                            <span className="vq-clip">{processingPayment ? 'Processing…' : 'Pay'}</span>
                        </button>
                    </div>
                    {catalogDock && (
                        <button
                            onClick={() => setOpenSheet('catalog')}
                            className="vq-dock-btn bg-surface border border-line text-ink shrink-0 cursor-pointer"
                            data-primary="0"
                        >
                            <LayoutGrid size={18} />
                            <span className="hidden sm:inline">Catalog</span>
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div className="vq-dock">
                {tenderDock && (
                    <button
                        onClick={openTender}
                        className="vq-dock-btn bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                        data-primary="1"
                    >
                        <Receipt size={18} />
                        <span className="vq-clip">Take payment</span>
                        <span className="vq-num px-2 py-1 rounded-lg bg-white/20 border border-white/10 shrink-0">
                            {money(cartTotal)}
                        </span>
                    </button>
                )}
            </div>
        );
    };

    const sheetHeader = (title, subtitle) => (
        <header className="vq-pane-fixed flex items-center gap-3 px-4 py-3 border-b border-line bg-sunken/50">
            <div className="min-w-0">
                <h2 className="vq-clip font-bold text-ink" style={{ fontSize: 'var(--vq-t-lg)' }}>{title}</h2>
                {subtitle && <p className="vq-clip text-xs text-ink-muted">{subtitle}</p>}
            </div>
            <button
                onClick={() => setOpenSheet(null)}
                className="ml-auto w-10 h-10 rounded-lg hover:bg-interactive-hover flex items-center justify-center text-ink-muted shrink-0"
                aria-label="Close"
            >
                <X size={20} />
            </button>
        </header>
    );

    return (
        <OneGlanceLayout
            title="Point of Sale"
            activeMenu="Dashboard"
            defaultCollapsed={true}
            hideHeader={true}
            noPadding={true}
            hideSidebar={!showRail}
        >
            <React.Fragment>
                <Head title="POS" />

                <div
                    ref={termRef}
                    className="vq-term text-ink"
                    data-regime={layout.regime}
                    data-senior={seniorMode ? '1' : '0'}
                    style={{
                        '--vq-pane-cols': paneCols,
                        '--vq-dock-h': `${layout.dockH || 0}px`,
                        /* Interface scale rides the type ramp only. Scaling the whole
                           element with transform would blur text and lie to every
                           measurement the engine makes; scaling the ramp lets the
                           engine see a genuinely smaller box and demote honestly. */
                        '--vq-ui-scale': uiScale,
                        '--vq-catband-h': cat && cat.h ? `${Math.round(cat.h)}px` : '0px',
                    }}
                >
                    {/* ── THE BAR ─────────────────────────────────────────
                        Rank-2 navigation and rank-3 read-outs. Nothing that
                        is part of taking money lives up here. */}
                    <div className="vq-term-bar">
                        <Link
                            href={route('store.dashboard', { store_slug: store?.slug })}
                            className="w-11 h-11 rounded-xl bg-surface hover:bg-brand-50 text-ink-secondary hover:text-brand-600 flex items-center justify-center transition-all border border-line hover:border-brand-300 shadow-xs shrink-0 cursor-pointer"
                            title="Leave the register"
                        >
                            <ArrowLeft size={17} />
                        </Link>

                        <div className="flex items-end gap-1.5 overflow-x-auto scrollbar-none flex-1 min-w-0">
                            {sales.map((sale, saleIndex) => (
                                <div
                                    key={sale.id}
                                    onClick={() => setActiveSaleId(sale.id)}
                                    className={`group relative min-w-[140px] max-w-[220px] h-10 px-3.5 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all border shrink-0 ${
                                        activeSaleId === sale.id
                                            ? 'bg-surface text-brand-700 dark:text-brand-300 font-bold border-brand-500/40 shadow-xs ring-2 ring-brand-500/10'
                                            : 'bg-surface/60 hover:bg-surface text-ink-muted hover:text-ink border-line/60 hover:border-line shadow-xs'
                                    }`}
                                >
                                    <span className="flex items-center gap-2 min-w-0">
                                        {activeSaleId === sale.id && (
                                            <span className="w-2 h-2 rounded-full bg-brand-500 ring-2 ring-brand-400/20 shrink-0" />
                                        )}
                                        <span className="vq-clip text-xs font-bold">
                                            {sale.customer?.name
                                                || (sale.reference_number ? `#${sale.reference_number}` : null)
                                                // Fallback for a brand-new, unsaved tab: a stable position-based
                                                // number ("Sale 1", "Sale 2"...) rather than the generic literal
                                                // "New sale" every empty tab used to share (indistinguishable when
                                                // running several sales at once -- a regression from the legacy
                                                // screen's per-tab numbering) and rather than the raw sale.id
                                                // (a Date.now() millisecond timestamp -- the exact defect the
                                                // layout law's capability register already flagged as illegible).
                                                || `Sale ${saleIndex + 1}`}
                                        </span>
                                    </span>
                                    <button
                                        onClick={(e) => closeSale(e, sale.id)}
                                        className={`shrink-0 flex items-center justify-center w-5 h-5 rounded-lg transition-all ${
                                            activeSaleId === sale.id
                                                ? 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                                : 'opacity-0 group-hover:opacity-100 text-ink-muted hover:bg-red-100 hover:text-red-600'
                                        }`}
                                        style={{ minHeight: 20 }}
                                        aria-label="Close tab"
                                    >
                                        <X size={11} strokeWidth={3} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={createNewSale}
                                className="w-11 h-11 rounded-xl bg-surface hover:bg-brand-50 hover:text-brand-600 border border-line hover:border-brand-300 text-ink-muted shadow-xs flex items-center justify-center transition-all shrink-0 cursor-pointer"
                                title="New sale (Ctrl+T)"
                            >
                                <Plus size={17} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {pendingCount > 0 && (
                                <button
                                    onClick={() => { setShowSyncHub(true); loadOfflineSales(); }}
                                    className="vq-chip flex items-center gap-2 px-3.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 transition-colors shadow-xs"
                                    style={{ minHeight: 38 }}
                                    title="Sales queued while offline"
                                >
                                    <Clock size={14} />
                                    <span className="vq-num">{pendingCount}</span>
                                </button>
                            )}

                            {/* ── COUNTER BUTTONS ──────────────────────────
                                Exactly what the Counter tab says should be here,
                                and nothing else. Every one of these was previously
                                either absent (the cash drawer had none at all,
                                despite the hardware call existing) or buried inside
                                a settings modal, and none of them was a choice.

                                All are hidden on a phone regardless of the setting:
                                at that width the bar's whole budget belongs to the
                                sale tabs, and each of these has a home in the
                                settings panel or a key. */}
                            {layout.regime !== 'phone' && (
                                <>
                                    {surfaceButtons.returns && (
                                        <button
                                            onClick={() => setReturnMode(!returnMode)}
                                            aria-pressed={returnMode}
                                            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all
                                                        border shadow-xs shrink-0 cursor-pointer
                                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
                                                returnMode
                                                    ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-400/50'
                                                    : 'bg-surface hover:bg-red-50 dark:hover:bg-red-950/30 text-ink-secondary hover:text-red-600 border-line hover:border-red-300'
                                            }`}
                                            title={returnMode ? 'Return mode is on — the next document is a credit' : 'Switch to return mode'}
                                        >
                                            <Undo2 size={17} />
                                        </button>
                                    )}

                                    {surfaceButtons.parked && (
                                        <button
                                            onClick={() => { loadParkedSales(); setParkedDropdownOpen(true); }}
                                            className="h-11 min-w-11 px-3 rounded-xl bg-surface hover:bg-amber-50 dark:hover:bg-amber-950/30
                                                       text-ink-secondary hover:text-amber-700 dark:hover:text-amber-400
                                                       flex items-center justify-center gap-1.5 transition-all
                                                       border border-line hover:border-amber-300 shadow-xs shrink-0 cursor-pointer
                                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                                            title="Parked sales"
                                        >
                                            <Pause size={17} />
                                            {parkedSales.length > 0 && (
                                                <span className="vq-num text-2xs font-extrabold">{parkedSales.length}</span>
                                            )}
                                        </button>
                                    )}

                                    {surfaceButtons.recent && (
                                        <button
                                            onClick={() => { loadRecentInvoices(); setShowRecentInvoices(true); }}
                                            className="w-11 h-11 rounded-xl bg-surface hover:bg-brand-50 dark:hover:bg-brand-950/40
                                                       text-ink-secondary hover:text-brand-600 dark:hover:text-brand-400
                                                       flex items-center justify-center transition-all
                                                       border border-line hover:border-brand-300 shadow-xs shrink-0 cursor-pointer
                                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                                            title="Recent invoices"
                                        >
                                            <History size={17} />
                                        </button>
                                    )}

                                    {surfaceButtons.drawer && (
                                        <button
                                            onClick={handleOpenCashDrawer}
                                            className="w-11 h-11 rounded-xl bg-surface hover:bg-emerald-50 dark:hover:bg-emerald-950/30
                                                       text-ink-secondary hover:text-emerald-700 dark:hover:text-emerald-400
                                                       flex items-center justify-center transition-all
                                                       border border-line hover:border-emerald-300 shadow-xs shrink-0 cursor-pointer
                                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                                            title="Open cash drawer (Ctrl+D)"
                                        >
                                            <Unlock size={17} />
                                        </button>
                                    )}

                                    {surfaceButtons.keys && (
                                        <button
                                            onClick={() => openSettings('keys')}
                                            className="w-11 h-11 rounded-xl bg-surface hover:bg-interactive-hover
                                                       text-ink-secondary hover:text-ink flex items-center justify-center
                                                       transition-all border border-line shadow-xs shrink-0 cursor-pointer
                                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                                            title="Keyboard shortcuts (?)"
                                        >
                                            <Keyboard size={17} />
                                        </button>
                                    )}

                                    {surfaceButtons.fullscreen && (
                                        <button
                                            onClick={toggleFullscreen}
                                            className="w-11 h-11 rounded-xl bg-surface hover:bg-interactive-hover
                                                       text-ink-secondary hover:text-ink flex items-center justify-center
                                                       transition-all border border-line shadow-xs shrink-0 cursor-pointer
                                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                                            title="Fullscreen (Alt+Z)"
                                        >
                                            {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                                        </button>
                                    )}

                                    {/* Two read-outs, not one control.
                                        They were boxed together in a single
                                        bordered pill, which made a connection
                                        light look like a button and a printer
                                        button look like decoration. The dot is
                                        now bare -- it is a status light, and a
                                        status light in a box reads as pressable
                                        -- and the printer is its own chip that
                                        reports what is actually attached. */}
                                    {surfaceButtons.online && (
                                        <span
                                            className="relative flex h-2.5 w-2.5 shrink-0 mx-1.5 cursor-default"
                                            role="status"
                                            aria-label={isOnline ? 'Online' : 'Offline — sales are queued on this device'}
                                            title={isOnline ? 'Online — sales post immediately' : 'Offline — sales are queued on this device'}
                                        >
                                            {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />}
                                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-emerald-500' : 'bg-danger-500'}`} />
                                        </span>
                                    )}

                                    {surfaceButtons.printer && (
                                        <button
                                            type="button"
                                            onClick={() => openSettings('hardware')}
                                            className={`h-11 px-3 rounded-xl flex items-center gap-2 transition-all border shadow-xs shrink-0 cursor-pointer
                                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
                                                printerState === 'ready'
                                                    ? 'bg-surface border-line text-emerald-700 dark:text-emerald-400 hover:border-emerald-300'
                                                    : printerState === 'no-printer'
                                                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900/60 text-amber-700 dark:text-amber-400'
                                                        : 'bg-surface border-line text-ink-faint hover:border-line-strong'
                                            }`}
                                            title={printerLabel}
                                            aria-label={printerLabel}
                                        >
                                            <Printer size={16} />
                                            {printerState === 'ready' && printerCount > 1 && (
                                                <span className="vq-num text-2xs font-extrabold">{printerCount}</span>
                                            )}
                                            {printerState === 'no-printer' && (
                                                <AlertTriangle size={12} className="shrink-0" />
                                            )}
                                        </button>
                                    )}
                                </>
                            )}

                            {/* ── THE ONE SETTINGS BUTTON ──────────────────
                                Three lived here: a layout picker, a quick-settings
                                dropdown and a register-settings modal, all writing
                                overlapping subsets of the same values. One drawer
                                now holds every one of them, and the operator no
                                longer has to guess which button owns which switch. */}
                            <button
                                onClick={() => openSettings('layout')}
                                aria-expanded={settingsOpen}
                                aria-haspopup="dialog"
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all
                                            border shadow-xs shrink-0 cursor-pointer
                                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
                                    settingsOpen
                                        ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border-brand-500/40'
                                        : 'bg-surface hover:bg-brand-50 dark:hover:bg-brand-950/40 text-ink-secondary hover:text-brand-600 dark:hover:text-brand-400 border-line hover:border-brand-300'
                                }`}
                                title="Register settings — layout, display, selling, hardware, keys (Alt+L)"
                            >
                                <Settings size={17} />
                            </button>
                        </div>
                    </div>

                    {/* ── THE WORKING SURFACE ─────────────────────────────
                        The working surface holds resident catalog bands (top/bottom)
                        and resident pane columns (catalog, cart, tender). */}
                    <div className="vq-term-body">
                        {catIsBand && cat.mode === 'top' && renderCatalogBand()}
                        {catIsBand && cat.mode === 'top' && resizable && renderBandGrip('top')}

                        <div
                            ref={panesRef}
                            className="vq-panes-grid"
                            style={{
                                gridTemplateColumns: (layout.regime === 'stacked' || layout.regime === 'phone') ? 'minmax(0, 1fr)' : paneCols
                            }}
                        >
                            {tenderIsColumn && tenderSide === 'left' && renderTenderPane()}
                            {cat && cat.mode === 'left' && renderCatalogPane(cat.fit, cat.tiles)}

                            {/* THE FLOOR. Rank 1 in the table terminal and the
                                pane the whole shift starts from, so it is a
                                column wherever the width carries one. Below
                                its measured floor the engine turns it into a
                                step -- the sheet below -- rather than a strip
                                too narrow to read a table code in. */}
                            {tableMode && layout.floor && layout.floor.mode === 'left' && (
                                <FloorPane
                                    positions={tables.visible}
                                    tabs={tables.tabs}
                                    zone={tables.zone}
                                    setZone={tables.setZone}
                                    counts={tables.counts}
                                    selectedId={tables.selectedId}
                                    onPick={pickTable}
                                    onNewTicket={(kind) => setNewTicketFor(kind)}
                                    onSetup={openFloorPlan}
                                    money={money}
                                    now={floorNow}
                                    variant={layout.floor.fit === 'map' ? 'map' : 'list'}
                                />
                            )}

                            {tableMode && floorIsStep && !selectedTable
                                ? (
                                    <section className="vq-pane bg-surface border border-line/80 shadow-md" data-pane="floor">
                                        <header className="vq-pane-h bg-sunken/60 text-ink-muted border-b border-line">
                                            <Users size={15} className="text-violet-500 dark:text-violet-400" />
                                            <span>Pick a table</span>
                                            <span className="vq-num ml-auto text-2xs opacity-80 font-bold">
                                                {tables.counts.open} open · {tables.counts.free} free
                                                {tables.counts.tickets > 0 ? ` · ${tables.counts.tickets} tickets` : ''}
                                            </span>
                                        </header>
                                        <FloorPane
                                            embedded
                                            positions={tables.visible}
                                            tabs={tables.tabs}
                                            zone={tables.zone}
                                            setZone={tables.setZone}
                                            counts={tables.counts}
                                            selectedId={tables.selectedId}
                                            onPick={pickTable}
                                            onNewTicket={(kind) => setNewTicketFor(kind)}
                                            onSetup={openFloorPlan}
                                            money={money}
                                            now={floorNow}
                                            variant={layout.cart && layout.cart.px >= 484 ? 'map' : 'list'}
                                        />
                                    </section>
                                )
                                : (showOrderPane && renderCartPane())}
                            {tenderIsColumn && tenderSide === 'right' && renderTenderPane()}
                            {cat && cat.mode === 'right' && renderCatalogPane(cat.fit, cat.tiles)}

                            {/* ── THE DIVIDERS ────────────────────────────
                                Children of the grid, not of a pane: a pane clips
                                its own overflow, so a handle hung off a pane edge
                                was sliced down the middle and its read-out could
                                not be seen at all. Each one sits centred in the
                                gutter it owns, at an offset the engine already
                                computed — so it is always exactly on the boundary
                                it moves, at every width, with no measurement of
                                its own to fall out of step. */}
                            {resizable && cat && cat.mode === 'left'
                                && renderSplit('catalog', 'left',
                                    Math.round(cat.px)
                                    + (tenderIsColumn && tenderSide === 'left' ? Math.round(layout.tender.px) + GUTTER : 0)
                                    + GUTTER / 2)}
                            {resizable && cat && cat.mode === 'right'
                                && renderSplit('catalog', 'right', Math.round(cat.px) + GUTTER / 2)}
                            {resizable && tenderIsColumn && tenderSide === 'right'
                                && renderSplit('tender', 'right',
                                    Math.round(layout.tender.px)
                                    + (cat && cat.mode === 'right' ? Math.round(cat.px) + GUTTER : 0)
                                    + GUTTER / 2)}
                            {resizable && tenderIsColumn && tenderSide === 'left'
                                && renderSplit('tender', 'left', Math.round(layout.tender.px) + GUTTER / 2)}
                        </div>

                        {catIsBand && cat.mode === 'bottom' && resizable && renderBandGrip('bottom')}
                        {catIsBand && cat.mode === 'bottom' && renderCatalogBand()}

                        {/* Payment along the BOTTOM: the same pane, laid out as a
                            full-width row instead of a column. On a wide, short
                            screen this is the better shape -- the money detail
                            gets the width it wants and the cart keeps its height. */}
                        {tenderIsRow && (
                            <section
                                className="vq-pane vq-tender-row bg-surface border border-line/80 shadow-md shrink-0"
                                data-pane="tender"
                                style={{ height: Math.max(220, Math.round((layout.H || 700) * 0.34)) }}
                            >
                                <header className="vq-pane-h bg-sunken/60 text-ink-muted border-b border-line">
                                    <Receipt size={15} className="text-emerald-600 dark:text-emerald-400" />
                                    <span>Payment</span>
                                    <span className="vq-num ml-auto text-2xs opacity-80 font-bold">#{activeSale.id}</span>
                                    {!showOrderPane && renderPaneTriggers()}
                                </header>
                                <div className="vq-pane-body vq-tender-row-body p-3">
                                    {renderTenderFields()}
                                </div>
                                <footer className="vq-pane-actions bg-sunken/40 border-t border-line">
                                    {renderTenderActions()}
                                </footer>
                            </section>
                        )}
                    </div>

                    {/* ── THE DOCK ────────────────────────────────────────
                        A real layout row. Everything the engine demoted has a
                        home here, which is why nothing floats over a pane. */}
                    {renderDock()}
                </div>

                {/* ── SHEETS ──────────────────────────────────────────────
                    A sheet is not a modal: the cart behind it stays live, and
                    Esc or a tap outside returns you with it exactly as you
                    left it. */}
                {openSheet && <div className="vq-scrim" onClick={() => setOpenSheet(null)} />}

                <aside
                    className="vq-sheet bg-surface border-l border-line shadow-2xl"
                    data-open={openSheet === 'catalog' ? 'true' : 'false'}
                    data-full="1"
                    aria-hidden={openSheet !== 'catalog'}
                >
                    {sheetHeader('Catalog', `${categoryProducts.length} items`)}
                    {renderScan()}
                    {renderCategoryStrip()}
                    <div className="vq-pane-body">
                        {renderCatalogBody({ variant: 'grid-3up', tiles: layout.regime === 'phone' ? 2 : 4 })}
                    </div>
                </aside>

                <aside
                    className="vq-sheet bg-surface border-line shadow-2xl"
                    data-open={openSheet === 'tender' ? 'true' : 'false'}
                    data-side={tenderSide}
                    style={{ '--vq-sheet-w': '480px' }}
                    aria-hidden={openSheet !== 'tender'}
                >
                    {sheetHeader('Payment', `Sale #${activeSale.id}`)}
                    <div className="vq-pane-body p-3 space-y-2.5">
                        {openSheet === 'tender' && renderTenderFields()}
                    </div>
                    <footer className="vq-pane-actions bg-sunken/40 border-t border-line">
                        {renderTenderActions()}
                    </footer>
                </aside>


            {/* Variant Selection Modal */}
            {variantModalOpen && selectedProductForVariant && (
                <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
                onClose={() => { setPaymentModalOpen(false); setSplitSeed(null); }}
                totalAmount={cartTotal}
                onComplete={handlePaymentComplete}
                currency={store?.currency_code || settings?.currency || 'PKR'}
                bankAccounts={bankAccounts}
                customer={activeSale.customer}
                defaultPrintReceipt={printOnComplete}
                seedSplit={splitSeed}
            />

            {/* ── THE TABLE TERMINAL'S OWN LAYERS ──────────────────────── */}
            {tableMode && newTicketFor && (
                <NewTicketDialog
                    orderType={newTicketFor}
                    busy={tables.busy}
                    onCancel={() => setNewTicketFor(null)}
                    onConfirm={async (meta) => {
                        const t = await tables.openLane(newTicketFor, meta);
                        setNewTicketFor(null);
                        if (t) {
                            loadedOccupancy.current = t.occupancy_id;
                            tables.prime([]);
                            updateActiveSale({ cart: [], cashReceived: '', customer: null, remarks: '' });
                            addToast(`${t.code} opened`, 'success');
                        }
                    }}
                />
            )}

            {tableMode && seatFor && (
                <SeatDialog
                    position={seatFor}
                    busy={tables.busy}
                    onCancel={() => setSeatFor(null)}
                    onConfirm={confirmSeat}
                />
            )}

            {tableMode && movingTable && selectedTable && (
                <MoveSheet
                    from={selectedTable}
                    positions={tables.positions}
                    busy={tables.busy}
                    onCancel={() => setMovingTable(false)}
                    onTransfer={async (to) => {
                        setMovingTable(false);
                        const res = await tables.transfer(selectedTable.occupancy_id, to.id);
                        if (res) {
                            loadedOccupancy.current = null;
                            tables.select(to.id);
                            addToast(`Moved to ${to.label || to.code}`, 'success');
                        }
                    }}
                    onMerge={async (into) => {
                        setMovingTable(false);
                        const res = await tables.merge(selectedTable.occupancy_id, into.occupancy_id);
                        if (res) {
                            loadedOccupancy.current = null;
                            tables.select(into.id);
                            addToast(`Merged into ${into.label || into.code}`, 'success');
                        }
                    }}
                />
            )}

            {tableMode && (
                <SplitSheet
                    open={splitOpen}
                    lines={activeSale.cart}
                    remaining={cartTotal}
                    covers={tableCovers}
                    money={money}
                    busy={tables.busy}
                    onCancel={() => setSplitOpen(false)}
                    onConfirm={confirmSplit}
                />
            )}

            {tableMode && (
                <ModifierSheet
                    open={!!modifierFor}
                    product={modifierFor}
                    groups={modifierGroups}
                    loading={modifierLoading}
                    money={money}
                    onCancel={() => { setModifierFor(null); setModifierGroups([]); }}
                    onConfirm={(mods) => {
                        const product = modifierFor;
                        setModifierFor(null);
                        setModifierGroups([]);
                        addToCart(product, null, mods);
                    }}
                />
            )}

            {/* Custom Global Discount Preset Modal */}
            {globalDiscountModal.show && (
                <div className="fixed inset-0 z-drawer flex items-center justify-center bg-black/60 backdrop-blur-sm vq-anim-fade">
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
                <div className="fixed inset-0 z-drawer flex items-center justify-center bg-black/60 backdrop-blur-sm vq-anim-fade">
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
                        <div className="font-bold text-emerald-500 my-2" style={{ fontSize: seniorMode ? '34px' : '28px' }}>
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
        {/* --- OFFLINE SYNC HUB MODAL --- */}
        {showSyncHub && (
            <div className="fixed inset-0 z-drawer flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm vq-anim-fade">
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
        {/* ── Cart Undo Floating Banner ────────────────────────────────────────────── */}
        {lastClearedCart && (
            <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-toast bg-slate-900 dark:bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/15 flex items-center gap-4 vq-anim-rise">
                <span className="text-xs font-bold">Cart cleared ({lastClearedCart.cart.length} items removed)</span>
                <button
                    onClick={handleRestoreClearedCart}
                    className="px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                    <Undo2 size={14} />
                    <span>Undo</span>
                </button>
            </div>
        )}

                {/* ── RECENT INVOICES ─────────────────────────────────────
                    `showRecentInvoices` and `loadRecentInvoices()` existed
                    and nothing ever rendered them, so Recent invoices was a
                    button that set a flag into the void. It is a sheet now,
                    like every other rank-2 capability. */}
                {showRecentInvoices && (
                    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-surface rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden border border-line flex flex-col max-h-[86vh]">
                            <div className="p-5 border-b border-line flex items-center justify-between bg-sunken/40 gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 flex items-center justify-center shrink-0">
                                        <History size={19} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="vq-clip font-bold text-ink" style={{ fontSize: 'var(--vq-t-lg)' }}>Recent invoices</h3>
                                        <p className="vq-clip text-xs text-ink-muted">Reprint a receipt, or recall a sale to edit it</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowRecentInvoices(false)}
                                    className="w-10 h-10 rounded-lg hover:bg-interactive-hover flex items-center justify-center text-ink-muted shrink-0"
                                    aria-label="Close"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {loadingRecent && (
                                    <p className="py-10 text-center text-ink-muted font-bold">Loading…</p>
                                )}
                                {!loadingRecent && recentInvoices.length === 0 && (
                                    <p className="py-10 text-center text-ink-muted font-bold">No sales yet today.</p>
                                )}
                                {!loadingRecent && recentInvoices.map(inv => (
                                    <div key={inv.id} className="p-3 rounded-lg border border-line bg-app flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="vq-clip font-bold text-ink">
                                                {inv.reference_number ? `#${inv.reference_number}` : `Sale ${inv.id}`}
                                                <span className="text-ink-muted font-medium"> · {inv.customer?.name || inv.customer_name || 'Walk-in'}</span>
                                            </p>
                                            <p className="vq-num text-xs text-ink-muted">
                                                {money(inv.total_amount || inv.total || 0)}
                                                {inv.created_at ? ` · ${new Date(inv.created_at).toLocaleTimeString()}` : ''}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => { setLastSale(inv); printReceipt('reprint'); }}
                                            className="px-4 rounded-lg bg-surface border border-line text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-xs font-bold shrink-0"
                                        >
                                            <Printer size={14} className="inline mr-1.5" />Reprint
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── PARKED SALES ────────────────────────────────────────
                    Was an absolutely-positioned dropdown hanging off the top
                    bar, which fell outside the viewport on a narrow screen.
                    A rank-2 capability belongs in a sheet. */}
                {parkedDropdownOpen && (
                    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-surface rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-line flex flex-col max-h-[80vh]">
                            <div className="p-5 border-b border-line flex items-center justify-between bg-sunken/40">
                                <h3 className="font-bold text-ink" style={{ fontSize: 'var(--vq-t-lg)' }}>Parked sales</h3>
                                <button
                                    onClick={() => setParkedDropdownOpen(false)}
                                    className="w-10 h-10 rounded-lg hover:bg-interactive-hover flex items-center justify-center text-ink-muted"
                                    aria-label="Close"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {parkedSales.length === 0 ? (
                                    <p className="p-10 text-center text-ink-muted font-bold">No parked sales.</p>
                                ) : parkedSales.map(parked => (
                                    <div
                                        key={parked.id}
                                        onClick={() => handleRecallSale(parked.id)}
                                        className="p-4 hover:bg-interactive-hover cursor-pointer border-b border-line last:border-0 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="vq-clip font-bold text-ink">{parked.customer_name || 'Walk-in customer'}</p>
                                                <p className="vq-num text-xs text-ink-muted">
                                                    {parked.items_count} {parked.items_count === 1 ? 'item' : 'items'} · {money(parked.total || 0)}
                                                </p>
                                                <p className="flex items-center gap-1.5 text-xs mt-1">
                                                    <Clock size={12} className="text-amber-500 shrink-0" />
                                                    <span className={`font-medium ${getTimeRemaining(parked.expires_at).includes('Expired') ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
                                                        {getTimeRemaining(parked.expires_at).includes('Expired')
                                                            ? 'Expired'
                                                            : `Expires in ${getTimeRemaining(parked.expires_at)}`}
                                                    </span>
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteParked(parked.id, e)}
                                                className="w-10 h-10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-ink-muted hover:text-red-600 flex items-center justify-center transition-colors shrink-0"
                                                aria-label="Delete parked sale"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    REGISTER SETTINGS — rank 3, and rank 3 only

                    What is NOT here, deliberately:

                      · a screen-size or "device target" picker. The engine
                        measures the actual element sixty times a second; a
                        cashier cannot tell us anything about their screen
                        that we do not already know more precisely, and the
                        old picker's only real effect was to make the layout
                        wrong on purpose.
                      · a "show ranks" or grid-overlay switch. That belongs
                        to the composer document, not to a register that has
                        a queue of customers at it.
                      · an interface-scale percentage next to a large-text
                        toggle. Two controls, one job, and they disagreed.
                        Large text is now the single answer, and it changes
                        the type ramp and the touch targets rather than
                        zooming the page off the bottom of the screen.

                    What IS here is what a shop actually differs on: whether
                    there is a catalog and where it sits, how the cart and
                    the payment panel divide the rest, and how payment is
                    taken.
                    ══════════════════════════════════════════════════════════ */}
                {/* ── THE ONE SETTINGS SURFACE ──────────────────────────
                    Everything that used to be spread across a layout picker
                    modal, a quick-settings dropdown, a register-settings modal
                    and a keymap modal. It sits BESIDE the register rather than
                    over it above 1024px, because every control on its Layout
                    tab changes the shape of the screen behind it and a change
                    you cannot see while you make it is a change you have to
                    make twice. */}
                <RegisterSettings
                    open={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    initialTab={settingsTab}

                    presets={LAYOUT_PRESETS}
                    presetId={currentPresetId}
                    composition={composition}
                    layout={layout}
                    onApplyPreset={id => { applyPreset(id); addToast(`${id.charAt(0).toUpperCase()}${id.slice(1)} layout applied`, 'success'); }}
                    onUpdateComposition={updateComposition}
                    serviceMode={serviceMode}
                    setServiceMode={saveServiceMode}
                    serviceCharge={serviceChargeSetting}
                    onOpenFloorPlan={() => {
                        setSettingsOpen(false);
                        router.visit(route('store.tables.plan', { store_slug: store?.slug }));
                    }}
                    setServiceCharge={saveServiceCharge}
                    terminal={terminal}
                    surface={surfaceButtons}
                    setSurface={setSurfaceButtons}
                    /* Widths only. Re-applying the whole preset here would also
                       undo the operator's catalog and tender PLACEMENT, which is
                       not what "reset the widths" says and not what they asked
                       for -- and because the matched preset is derived from those
                       same placements, an unmatched combination would have
                       snapped the register all the way back to Column. */
                    onResetWidths={() => {
                        const base = LAYOUT_PRESETS.find(p => p.id === currentPresetId)?.comp;
                        if (!base) return;
                        updateComposition(prev => ({
                            ...prev,
                            catalog: { ...prev.catalog, size: base.catalog.size, rows: base.catalog.rows },
                            split: { cart: base.split.cart, tender: prev.tender === 'column' ? base.split.tender : 0 },
                        }));
                        addToast('Column widths reset', 'info');
                    }}

                    seniorMode={seniorMode}
                    setSeniorMode={v => { setSeniorMode(v); try { sessionStorage.setItem('pos_senior_mode', JSON.stringify(v)); } catch (_) {} }}
                    showRail={showRail}
                    setShowRail={v => { setShowRail(v); try { localStorage.setItem('pos_show_rail', JSON.stringify(v)); } catch (_) {} }}
                    uiScale={uiScale}
                    setUiScale={setUiScale}

                    enableTax={enableTax}
                    setEnableTax={v => { setEnableTax(v); try { localStorage.setItem('pos_enable_tax', String(v)); } catch (_) {} }}
                    enableFulfilment={enableFulfilment}
                    setEnableFulfilment={v => { setEnableFulfilment(v); try { localStorage.setItem('pos_enable_fulfilment', String(v)); } catch (_) {} }}
                    enableFreeQty={enableFreeQty}
                    setEnableFreeQty={v => { setEnableFreeQty(v); try { localStorage.setItem('pos_enable_free_qty', String(v)); } catch (_) {} if (!v) setShowFreeQty(false); }}
                    roundOff={roundOff}
                    setRoundOff={setRoundOff}
                    autoFillCash={autoFillCash}
                    setAutoFillCash={setAutoFillCash}
                    returnMode={returnMode}
                    setReturnMode={setReturnMode}
                    returnPolicyLabel={
                        posReturnMode === 'open' ? 'Open returns'
                        : posReturnMode === 'customer_or_reference' ? 'Customer or reference'
                        : 'Reference required'
                    }
                    discountPresets={discountPresets}
                    setDiscountPresets={v => { setDiscountPresets(v); try { localStorage.setItem('pos_discount_presets', JSON.stringify(v)); } catch (_) {} }}

                    printOnComplete={printOnComplete}
                    setPrintOnComplete={v => { setPrintOnComplete(v); try { localStorage.setItem('pos_print_on_complete', JSON.stringify(v)); } catch (_) {} }}
                    openDrawerOnCash={openDrawerOnCash}
                    setOpenDrawerOnCash={setOpenDrawerOnCash}
                    isStationConnected={isStationConnected}
                    printerState={printerState}
                    printerCount={printerCount}
                    isOnline={isOnline}
                    pendingCount={pendingCount}
                    onOpenCashDrawer={handleOpenCashDrawer}
                    onOpenParked={() => { setSettingsOpen(false); loadParkedSales(); setParkedDropdownOpen(true); }}
                    parkedCount={parkedSales.length}
                    onOpenRecent={() => { setSettingsOpen(false); loadRecentInvoices(); setShowRecentInvoices(true); }}
                    onOpenSyncHub={() => { setSettingsOpen(false); setShowSyncHub(true); loadOfflineSales(); }}

                    onRunSetupWizard={() => { setSettingsOpen(false); setShowSetupWizard(true); }}
                    onResetAll={handleResetRegister}
                />

                <SetupWizardModal
                    open={showSetupWizard}
                    onClose={() => setShowSetupWizard(false)}
                    onApply={handleWizardApply}
                    currentPrefs={wizardPrefs}
                    store={store}
                />
            </React.Fragment>
        </OneGlanceLayout>
    );
};

export default function Pos({
    settings, bankAccounts, recalledSale, warehouses = [], occupancy = null,
    terminal = 'counter', positions = [], tickets = [], zones = [], kitchen = 0,
}) {
    const { store } = usePage().props;
    return (
        <>
            {/* `warehouses` was sent by PosController and stopped here: this
                wrapper never forwarded it, so POSInterface always fell back to
                its `warehouses = []` default and a multi-branch store had no way
                to choose which location a sale came out of. */}
            <POSInterface
                settings={settings}
                recalledSale={recalledSale}
                bankAccounts={bankAccounts}
                warehouses={warehouses}
                occupancy={occupancy}
                terminal={terminal}
                positions={positions}
                tickets={tickets}
                zones={zones}
                kitchen={kitchen}
            />
            <PosTourGuide store={store} />
        </>
    );
}
