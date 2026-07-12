import React, { useState, useEffect, useRef, useCallback } from 'react';
import StoreSwitcher from '@/Components/StoreSwitcher';
import { Link, usePage, router } from '@inertiajs/react';
import SidebarItem from '@/Components/SidebarItem';
import CommandPalette from '@/Components/CommandPalette';
import OmniSearch from '@/Components/OmniSearch';
import AiAssistantModal from '@/Components/AiAssistantModal';
import FloatingAiBubble from '@/Components/FloatingAiBubble';
import OnboardingDriver from '@/Components/OnboardingDriver';
import DemoBanner from '@/Components/DemoBanner';
import {
    Activity,
    Monitor,
    User,
    Type,
    LogOut,
    Menu,
    Search,
    Sun,
    Moon,
    Bell,
    Home,
    LayoutDashboard,
    BarChart2,
    Box,
    CreditCard,
    HardDrive,
    Settings,
    Trash2,
    History,
    RefreshCcw,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    BookOpen,
    FileText,
    ShieldCheck,
    Database,
    ShoppingCart,
    Users,
    Clock,
    Sparkles,
    MessageSquare,
    Check,
    X,
    ArrowRight,
    ShoppingBag,
    Package,
    Settings2,
    Wallet,
    TrendingUp,
    Ticket,
    Rss,
    UserCog,
    Layers,
    Zap,
    MoreVertical,
    Plus,
    Factory,
    Mail
} from 'lucide-react';
import { useWorkspace } from '@/Contexts/WorkspaceContext';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import CharityButton from '@/Components/CharityButton';
import VersionChecker from '@/Components/VersionChecker';
import TerminalStatusBadge from '@/Components/TerminalStatusBadge';
import Toast from '@/Components/Toast';
import UpgradeModal from '@/Components/UpgradeModal';
import GlobalOnboardingWidget from '@/Components/GlobalOnboardingWidget';
import ImpersonationBanner from '@/Components/ImpersonationBanner';
import PlanUsageBanner from '@/Components/PlanUsageBanner';
import SubscriptionExpiryBanner from '@/Components/SubscriptionExpiryBanner';
import PlanNotificationBell from '@/Components/PlanNotificationBell';
import { useTheme } from '@/Contexts/ThemeContext';
import LimitGraceBanner from '@/Components/LimitGraceBanner';

export default function OneGlanceLayout({ children, title, activeMenu, defaultCollapsed = false, hideHeader = false, fullScreen = false, mode = 'app', noPadding = false }) {
    const {
        store
    } = usePage().props;

    const isStarterOrLtd1 = store?.plan === 'starter' || store?.plan === 'ltd_1';

    const { activeInvoices, currentInvoiceId, setCurrentInvoiceId, posSessions, currentPosId, setCurrentPosId, activePurchases, currentPurchaseId, setCurrentPurchaseId } = useWorkspace();
    const { url, props } = usePage();
    const { settings, flash, my_role, userRole: userRoleProp, vensynq_enabled, woocommerce_enabled } = props;

    // Global Toast State
    const [toasts, setToasts] = useState([]);
    const addToast = (message, type = 'info') => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
    };
    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    // Live Header Clock State
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const clockInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(clockInterval);
    }, []);

    // Listen for flash messages from backend
    useEffect(() => {
        if (flash?.success) {
            addToast(flash.success, 'success');
        }
        if (flash?.error) {
            addToast(flash.error, 'error');
        }
        if (flash?.warning) {
            addToast(flash.warning, 'warning');
        }
        if (flash?.info) {
            addToast(flash.info, 'info');
        }
    }, [flash?.success, flash?.error, flash?.warning, flash?.info]);

    // Listen for AJAX toast events (from axios interceptor in bootstrap.js)
    useEffect(() => {
        const handleToast = (e) => {
            if (e.detail && e.detail.message) {
                addToast(e.detail.message, e.detail.type || 'info');
            }
        };

        const handleNetworkError = (e) => {
            if (e.detail && e.detail.message) {
                // Persistent error toast for network issues
                addToast(e.detail.message, 'error');
            }
        };

        window.addEventListener('amd:toast', handleToast);
        window.addEventListener('amd:network-error', handleNetworkError);

        return () => {
            window.removeEventListener('amd:toast', handleToast);
            window.removeEventListener('amd:network-error', handleNetworkError);
        };
    }, []);

    // Auto-retract sidebar for invoice/purchase creation
    const isInvoiceCreate = url.includes('/sales/invoice/create') || url.includes('/purchases/create');
    const isPosRoute = url.includes('/pos');

    // Make settings available globally for legacy/utility functions (Synchronous population)
    // Definitive Plan: merge store-level currency so formatCurrency() auto-uses per-store currency
    if (typeof window !== 'undefined') {
        window.amdSettings = {
            ...(settings || {}),
            // Unified metadata: prioritize store-level (synced) values, then settings
            currency:        settings?.currency        || store?.currency_code,
            currency_code:   store?.currency_code      || settings?.currency_code,
            currency_symbol: store?.currency_symbol    || settings?.currency_symbol,
            store_name:      store?.name               || settings?.store_name || settings?.business_name,
            decimal_places:  parseInt(settings?.decimal_places || 2)
        };
    }

    const isTrial = store?.status === 'trial' || (store?.trial_ends_at && new Date(store.trial_ends_at) > new Date());
    const trialDaysLeft = store?.trial_ends_at
        ? Math.max(0, Math.ceil((new Date(store.trial_ends_at) - new Date()) / 86400000))
        : null;

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [isMobileFabsOpen, setIsMobileFabsOpen] = useState(false);
    const [budIconType, setBudIconType] = useState('setup'); // 'setup' or 'chat'

    useEffect(() => {
        const interval = setInterval(() => {
            setBudIconType(prev => prev === 'setup' ? 'chat' : 'setup');
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isMobileFabsOpen) {
            document.body.classList.add('mobile-fabs-expanded');
        } else {
            document.body.classList.remove('mobile-fabs-expanded');
        }
    }, [isMobileFabsOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!isMobileFabsOpen) return;
            const target = event.target;
            const isClickOnBud = target.closest('#mobile-fabs-toggle-bud');
            const isClickOnFloatingPanel = target.closest('.fixed.right-6.z-\\[55\\]') || target.closest('.fixed.right-6.z-\\[95\\]') || target.closest('#tour-chat-widget-btn');
            
            if (!isClickOnBud && !isClickOnFloatingPanel) {
                setIsMobileFabsOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isMobileFabsOpen]);

    const showExpandedSidebar = isSidebarOpen || mobileSidebarOpen;
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { isDarkMode, setIsDarkMode } = useTheme();
    const [isLargeText, setIsLargeText] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [expandedMenu, setExpandedMenu] = useState(null);
    const userMenuRef = useRef(null);
    const notificationRef = useRef(null);
    const growthRef = useRef(null);
    const displayMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const [isDisplayMenuOpen, setIsDisplayMenuOpen] = useState(false);

    // Dynamic Mobile Bottom Nav Bar visibility check
    const showMobileNavBar = (() => {
        if (!props.auth?.user) return false;
        if (fullScreen) return false;

        const path = url.toLowerCase();

        // 1. Explicitly check if returns history list page (should show navbar)
        const isReturnsHistoryList = path.includes('/returns-history') && 
            !path.includes('/create') && 
            !path.includes('/edit') && 
            !path.includes('/return-detail');

        if (isReturnsHistoryList) return true;

        // 2. Block on POS screen
        if (path.includes('/pos')) return false;

        // 3. Block on creation, editing, return making, or refunds
        const isCreateFlow = path.includes('/create');
        const isEditFlow = path.includes('/edit');
        const isReturnFlow = path.includes('/return') && !path.includes('/returns-history');
        const isRefundFlow = path.includes('/refund');
        const isSetupFlow = path.includes('/setup') || path.includes('/new-store') || path.includes('/start');

        if (isCreateFlow || isEditFlow || isReturnFlow || isRefundFlow || isSetupFlow) {
            return false;
        }

        return true;
    })();

    // Active status for mobile navigation bar tabs
    const isSaleInvoiceActive = route().current('store.sales.dashboard') || route().current('store.sales.*') || route().current('store.orders.*') || route().current('store.sales.index');
    const isPurchaseActive = route().current('store.purchases.*') || route().current('store.purchases.index');
    const isHomeActive = route().current('store.dashboard') || route().current('store.home');
    const isExpenseActive = route().current('store.expenses.*') || route().current('store.expenses.index');
    const isStockActive = route().current('store.inventory.*') || route().current('store.inventory.dashboard') || route().current('store.products.*');

    const getMobileTabUrl = (routeName) => {
        if (!store) return '#';
        if (route().has(routeName)) {
            return route(routeName, { store_slug: store.slug });
        }
        return '#';
    };

    // Tap-and-hold / Long-press handling state for Dropdowns
    const [activeDropdown, setActiveDropdown] = useState(null); // 'sales' | 'purchases' | 'dashboard' | 'expenses' | 'stock' | null
    const pressTimerRef = useRef(null);
    const wasLongPressRef = useRef(false);

    const startPress = (menuKey) => {
        wasLongPressRef.current = false;
        pressTimerRef.current = setTimeout(() => {
            wasLongPressRef.current = true;
            setActiveDropdown(menuKey);
        }, 400); // 400ms long-press duration
    };

    const cancelPress = () => {
        if (pressTimerRef.current) {
            clearTimeout(pressTimerRef.current);
        }
    };

    const handleLinkClick = (menuKey, defaultRouteName) => (e) => {
        if (wasLongPressRef.current) {
            e.preventDefault();
            e.stopPropagation();
            wasLongPressRef.current = false;
            return;
        }
        // Direct click normal behavior
        router.visit(getMobileTabUrl(defaultRouteName));
    };

    const getDropdownOptions = (menuKey) => {
        switch (menuKey) {
            case 'sales':
                return [
                    { label: 'Invoices List', href: 'store.sales.index', icon: <FileText size={14} /> },
                    { label: 'New Sale', href: 'store.sales.create', icon: <Plus size={14} /> },
                    { label: 'Sales Orders', href: 'store.pre-sales.index', icon: <ShoppingCart size={14} /> },
                    { label: 'Proposals', href: 'store.proposals.index', icon: <FileText size={14} /> },
                    { label: 'Return History', href: 'store.returns-history.index', icon: <History size={14} /> },
                    { label: 'Invoice Reminders', href: 'store.invoice-reminders.index', icon: <Clock size={14} /> },
                    { label: 'Recurring Invoices', href: 'store.recurring-invoices.index', icon: <RefreshCcw size={14} /> },
                ];
            case 'purchases':
                return [
                    { label: 'Purchases List', href: 'store.purchases.index', icon: <ShoppingBag size={14} /> },
                    { label: 'New Purchase', href: 'store.purchases.create', icon: <Plus size={14} /> },
                    { label: 'Purchase Orders', href: 'store.purchase-orders.index', icon: <FileText size={14} /> },
                    { label: 'Debit Notes', href: 'store.debit-notes.index', icon: <CreditCard size={14} /> },
                ];
            case 'dashboard':
                return [
                    { label: 'Business Dashboard', href: 'store.dashboard', icon: <LayoutDashboard size={14} /> },
                    { label: 'Point of Sale (POS)', href: 'store.pos', icon: <Monitor size={14} /> },
                    { label: 'New Sale', href: 'store.sales.create', icon: <Plus size={14} /> },
                    { label: 'New Purchase', href: 'store.purchases.create', icon: <Plus size={14} /> },
                    { label: 'New Expense', action: 'expense-modal', icon: <CreditCard size={14} /> },
                    { label: 'All Parties', href: 'store.parties.index', icon: <Users size={14} /> },
                    { label: 'All Inventory', href: 'store.inventory.index', icon: <Box size={14} /> },
                ];
            case 'expenses':
                return [
                    { label: 'Expenses List', href: 'store.expenses.index', icon: <CreditCard size={14} /> },
                    { label: 'New Expense', action: 'expense-modal', icon: <Plus size={14} /> },
                ];
            case 'stock':
                return [
                    { label: 'Products List', href: 'store.inventory.index', icon: <Box size={14} /> },
                    { label: 'Categories', href: 'store.categories.index', icon: <Layers size={14} /> },
                    { label: 'Attributes', href: 'store.attributes.index', icon: <Settings size={14} /> },
                    { label: 'Stock Levels', href: 'store.inventory.stock-levels', icon: <BarChart2 size={14} /> },
                    { label: 'Stock Adjustments', href: 'store.stock-operations', query: { tab: 'adjustments' }, icon: <Layers size={14} /> },
                    { label: 'Warehouses', href: 'store.stock-operations', query: { tab: 'warehouses' }, icon: <Box size={14} /> },
                    { label: 'Stock Transfers', href: 'store.stock-transfers.index', icon: <RefreshCcw size={14} /> },
                    { label: 'Stock Audit', href: 'store.stock-takes.index', icon: <Search size={14} /> },
                    { label: 'Batch Tracking', href: 'store.batches.index', icon: <Package size={14} /> },
                    { label: 'Serial Tracking', href: 'store.serials.index', icon: <Package size={14} /> },
                    { label: 'Production', href: 'store.production.index', icon: <Factory size={14} /> },
                    { label: 'Cookbook', href: 'store.cookbook.index', icon: <BookOpen size={14} /> },
                ];
            default:
                return [];
        }
    };

    const handleOptionClick = (option) => {
        setActiveDropdown(null);
        if (option.action === 'expense-modal') {
            router.visit(route('store.expenses.index', { store_slug: store?.slug }) + '?action=add');
            return;
        }
        if (option.href) {
            const url = route(option.href, { store_slug: store?.slug, ...(option.query || {}) });
            router.visit(url);
        }
    };

    // Track if sidebar was expanded via hover (vs manual click)
    const wasHoverExpandedRef = useRef(false);
    const sidebarRef = useRef(null);

    // Global Search State - REMOVED (Replaced by OmniSearch)


    // AI Modal State (Phase 4)
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isAiMinimized, setIsAiMinimized] = useState(false);
    const [aiModalQuery, setAiModalQuery] = useState('');
    const [aiMessageCount, setAiMessageCount] = useState(0);

    // REMOVED: Exit Authorization Logic moved to GlobalProviderLayout to prevent duplicates

    // Track message count from sessionStorage
    useEffect(() => {
        const checkMessages = () => {
            const saved = sessionStorage.getItem('amd_ai_messages');
            if (saved) {
                try {
                    const messages = JSON.parse(saved);
                    setAiMessageCount(messages.length);
                } catch (e) { }
            }
        };
        checkMessages();
        const interval = setInterval(checkMessages, 1000);
        return () => clearInterval(interval);
    }, []);

    // Auto-expand sidebar & menu during onboarding steps
    useEffect(() => {
        const handleTourStep = (e) => {
            const step = e.detail;
            if (step === 'sidebar_stock') {
                setIsSidebarOpen(true);
                setExpandedMenu('Stock');
            } else if (step === 'purchase_tour_sidebar') {
                setIsSidebarOpen(true);
                setExpandedMenu('Purchase');
            }
        };
        window.addEventListener('onboarding-step-changed', handleTourStep);
        
        // Also check initial load step
        if (window.activeOnboardingStep === 'sidebar_stock') {
            setIsSidebarOpen(true);
            setExpandedMenu('Stock');
        } else if (window.activeOnboardingStep === 'purchase_tour_sidebar') {
            setIsSidebarOpen(true);
            setExpandedMenu('Purchase');
        }

        return () => {
            window.removeEventListener('onboarding-step-changed', handleTourStep);
        };
    }, [store]);

    // Growth Engine AI Popup State
    const [isGrowthOpen, setIsGrowthOpen] = useState(false);
    const [showAiPopup, setShowAiPopup] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowAiPopup(true);
        }, 5000);
        return () => clearTimeout(timer);
    }, []);



    useEffect(() => {
        if (isInvoiceCreate) {
            setIsSidebarOpen(false);
        }
    }, [isInvoiceCreate]);

    // Idle Detection (uses auto_logout setting, default 60 minutes)
    const [isIdle, setIsIdle] = useState(false);
    const idleTimerRef = useRef(null);

    const resetIdleTimer = () => {
        if (isIdle) setIsIdle(false);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

        // Get auto_logout from settings (in minutes), default to 60
        const autoLogoutMinutes = parseInt(settings?.auto_logout) || 60;
        const timeoutMs = autoLogoutMinutes * 60 * 1000;

        idleTimerRef.current = setTimeout(() => {
            setIsIdle(true);
        }, timeoutMs);
    };

    useEffect(() => {
        // Initial start
        resetIdleTimer();

        // Listen for activity
        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
        const handler = () => resetIdleTimer();

        events.forEach(event => window.addEventListener(event, handler));

        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            events.forEach(event => window.removeEventListener(event, handler));
        };
    }, [isIdle]);

    const userPerms = props.auth?.user?.permissions || [];
    const hasAnyPerm = (...keys) => keys.some(k => userPerms.some(p => p === k || p.startsWith(k + '.')));

    const appMenuItems = [
        { name: 'Home', icon: Home, subs: [], 
          route: store ? 'store.home' : null, 
          routeParams: store ? { store_slug: store.slug } : {} },
        { name: 'Dashboard', icon: LayoutDashboard, subs: [], 
          route: store ? 'store.dashboard' : null, 
          routeParams: store ? { store_slug: store.slug } : {} },
        {
            name: 'Sell',
            icon: ShoppingCart,
            // PROBLEM 1 FIX: Cashier sees only POS. All other roles see full Sell menu sub-items.
            subs: props.auth?.user?.role === 'cashier' ? [] : [
                { group: 'Transactions', items: ['Orders', 'Quotations / Pre-Sales', 'Proposals'] },
                { group: 'Post-Sale', items: ['Returns History', { label: 'Invoice Reminders', locked: !store?.features?.invoice_reminders }, { label: 'Recurring Invoices', locked: !store?.features?.recurring_invoices }] },
                { group: 'Config', items: [{ label: 'E-Invoicing (Coming Soon)', locked: true }] }
            ],
            route: store ? 'store.sales.dashboard' : 'sales.dashboard',
            routeParams: store ? { store_slug: store.slug } : {}
        },
        {
            name: 'Purchase',
            icon: ShoppingBag,
            subs: [
                { group: 'Transactions', items: ['Purchases', 'Purchase Orders'] },
                { group: 'Post-Purchase', items: ['Purchase Returns'] }
            ],
            route: store ? 'store.purchases.index' : 'purchases.index',
            routeParams: store ? { store_slug: store.slug } : {}
        },
        {
            name: 'Stock',
            icon: Box,
            subs: [
                { group: 'Catalog', items: ['Products', 'Categories', 'Attributes', 'Labels'] },
                { group: 'Operations', items: ['Stock Levels', 'Stock Operations', 'Stock Transfers', 'Stock Audit'] },
                { group: 'Tracking', items: ['Batch Tracking', 'Serial Tracking'] },
                { group: 'Manufacturing', items: [{ label: 'Production', locked: !store?.features?.production }, { label: 'Cookbook', locked: !store?.features?.bill_of_materials }] }
            ],
            route: store ? 'store.inventory.dashboard' : 'inventory.dashboard',
            routeParams: store ? { store_slug: store.slug } : {}
        },
        {
            name: 'Contacts',
            icon: Users,
            subs: [
                { group: 'Partners', items: ['Customers', 'Suppliers', 'Parties'] },
            ],
            route: store ? 'store.parties.index' : 'parties.index',
            routeParams: store ? { store_slug: store.slug } : {}
        },
        {
            name: 'Money',
            icon: Wallet,
            subs: [
                { group: 'Cash Flow', items: ['Payments', 'Expenses', 'To Receive', 'To Pay'] },
                { group: 'Banking', items: [{ label: 'Fund Management', locked: !store?.features?.fund_management }, 'Bank Accounts', { label: 'Bank Reconciliation', locked: !store?.features?.bank_reconciliation }] },
            ],
            route: store ? 'store.transactions.index' : 'transactions.index',
            routeParams: store ? { store_slug: store.slug } : {}
        },
        {
            name: 'VenSynQ',
            icon: RefreshCcw,
            subs: [
                { group: 'Multi-Channel', items: ['VenSynQ'] },
                { group: 'Promotion', items: [{ label: 'Email Marketing', locked: !store?.features?.email_marketing }, { label: 'SMS Marketing', locked: !store?.features?.sms_marketing }, { label: 'Campaigns', locked: !store?.features?.campaigns }] },
                { group: 'Integrations', items: [woocommerce_enabled ? 'WooCommerce Sync' : null].filter(Boolean) },
                { group: 'Configuration', items: ['VenSynQ Settings'] }
            ],
            route: store ? 'store.vensynq.index' : 'vensynq.index',
            routeParams: store ? { store_slug: store.slug } : {}
        },
        {
            name: 'Insights',
            icon: TrendingUp,
            subs: [
                { group: 'Growth', items: [!store?.features?.growth_engine ? { label: 'Growth Engine', locked: true } : 'Growth Engine'] },
                { group: 'Financial Health', items: ['Chart of Accounts', 'Profit & Loss', 'Balance Sheet', 'Cash Flow', 'Tax Report'] },
                { group: 'Sales Analysis', items: ['Sales Report', 'Discount Report', 'Sale Aging'] },
                { group: 'Purchase Analysis', items: ['Purchase Report', 'Expense Report'] },
                { group: 'Inventory', items: ['Stock Valuation', 'Low Stock', 'Movement History', 'Expiry Report'] },
                { group: 'Operational', items: ['Activity Log'] }
            ],
            route: store ? 'store.reports.index' : 'reports.index',
            routeParams: store ? { store_slug: store.slug } : {}
        },
    ];

    const userRole = my_role || userRoleProp || props.auth?.user?.role;
    const isPlatformAdmin = !!props.auth?.user?.is_platform_admin;

    // ── CRITICAL SECURITY: If no store context and user landed here via a legacy bare route,
    // redirect to /hub immediately. NEVER show platform links to store users.
    // The store prop is set by TenantMiddleware — if it's missing, we're in the wrong zone.
    if (!store && mode !== 'admin') {
        // Use a deferred redirect to avoid React render errors
        if (typeof window !== 'undefined') {
            window.location.href = '/hub';
        }
        return null;
    }

    // ── Admin mode sidebar (only rendered when mode='admin') ──
    // Platform HQ mode (isPlatformAdmin): shows Platform HQ links
    // Store Admin Panel mode (!isPlatformAdmin OR store context): shows the full store Admin Panel
    const adminMenuItems = (mode === 'admin' && isPlatformAdmin && !store) ? [
        // ── Platform HQ (Unified SuperAdmin Experience) ─────────────────────────
        { name: 'Overview', icon: LayoutDashboard, subs: [], route: 'platform.dashboard' },
        { name: 'System Health', icon: Activity, subs: [], route: 'platform.health.errors' },
        { name: 'Plans & Limits', icon: Layers, subs: [], route: 'platform.plans.index' },
        { name: 'Platforms', icon: Database, subs: [], route: 'platform.platforms.index' },
        { name: 'Coupons', icon: Ticket, subs: [], route: 'platform.coupons.index' },
        { name: 'Tenant Overrides', icon: Zap, subs: [], route: 'platform.tenants.overrides' },
        { name: 'Stores', icon: ShoppingBag, subs: [], route: 'platform.stores' },
        { name: 'Platform Users', icon: UserCog, subs: [], route: 'platform.users' },
        { name: 'Revenue', icon: TrendingUp, subs: [], route: 'platform.dashboard', routeParams: { tab: 'revenue' } },
        { name: 'Support', icon: Ticket, subs: [], route: 'platform.tickets' },
        { name: 'Activity Feed', icon: Rss, subs: [], route: 'platform.dashboard', routeParams: { tab: 'feed' } },
        { name: 'Demo Store', icon: Monitor, subs: [], route: 'platform.dashboard', routeParams: { tab: 'demo' } },
        { name: 'Agent Inbox', icon: MessageSquare, subs: [], route: 'platform.chatbot.inbox' },
        { name: 'Chatbot Settings', icon: Sparkles, subs: [], route: 'platform.chatbot.settings' },
        { name: 'VenSynQ', icon: RefreshCcw, subs: [], route: 'platform.dashboard', routeParams: { tab: 'vensynq' } },
        { name: 'Settings', icon: Settings, subs: [], route: 'platform.dashboard', routeParams: { tab: 'settings' } },
        { name: 'System Update', icon: Package, subs: [], route: 'updater.index' },
        { name: 'Digital Products', icon: Package, subs: [], route: 'platform.digital-hub' },
        { name: 'Newsletter Hub', icon: Mail, subs: [], route: 'platform.newsletter-hub' },
    ] : [
        // ── Store Admin Panel — Restored Full Legacy Experience ──────────────
        // Scoped to /s/{store_slug}/admin/... to maintain SaaS isolation.
        { name: 'Admin Home',          icon: Home,            subs: [], 
          route: store ? 'store.admin.home' : null,      
          routeParams: store ? { store_slug: store.slug } : {} },
          
        { name: 'Executive Dashboard', icon: LayoutDashboard, subs: [], 
          route: store ? 'store.admin.dashboard' : null, 
          routeParams: store ? { store_slug: store.slug } : {} },
          
        { name: 'User Management',     icon: Users,           subs: [], 
          route: store ? 'store.admin.users' : null,     
          routeParams: store ? { store_slug: store.slug } : {} },
          
        { name: 'System Settings',     icon: Settings,        subs: [], 
          route: store ? 'store.admin.settings' : null,  
          routeParams: store ? { store_slug: store.slug } : {} },
          
        { name: 'Data & Backup',       icon: HardDrive,       subs: [],
          route: store ? 'store.admin.data' : null,
          routeParams: store ? { store_slug: store.slug } : {} },

          
        // OVERRIDE: Backups feature strictly removed from tenant admin panel for structural security.
        { name: 'Activity Log',        icon: History,         subs: [], 
          route: store ? 'store.admin.logs' : null,      
          routeParams: store ? { store_slug: store.slug } : {} },
          
        { name: 'Recycle Bin',         icon: Trash2,          subs: [], 
          route: store ? 'store.admin.recycle-bin.index' : null,
          routeParams: store ? { store_slug: store.slug } : {} },
        
        { name: 'Subscription',        icon: CreditCard,      subs: [], 
          route: store ? 'store.billing' : null,         
          routeParams: store ? { store_slug: store.slug } : {} },

        { name: 'Agent Inbox',         icon: MessageSquare,   subs: [], 
          route: store ? 'store.admin.chatbot.inbox' : null,
          routeParams: store ? { store_slug: store.slug } : {} },

        { name: 'Chatbot Settings',    icon: Sparkles,        subs: [], 
          route: store ? 'store.admin.chatbot.settings' : null,
          routeParams: store ? { store_slug: store.slug } : {} },
    ];

    // RBAC Permission Map
    const MENU_PERMISSIONS = {
        'Home': [],
        // Sell: only roles that can actually create sales or open POS sessions
        'Sell': ['sales.create', 'sales.view'],
        // Purchase: only roles that can create purchase orders
        'Purchase': ['purchases.create'],
        // Stock: only roles that can manage/adjust inventory (not read-only view)
        'Stock': ['inventory.create', 'inventory.adjust', 'inventory.edit'],
        // Contacts: owner/admin/manager bypass above; others need purchases.suppliers
        'Contacts': ['purchases.suppliers', 'admin.staff_view'],
        // Money: anyone with finance access
        'Money': ['finance.balances', 'finance.transactions', 'finance.expenses'],
        'VenSynQ': ['sales.create', 'inventory.adjust'],
        'Insights': ['reports'],
        'Activity Log': ['audit'],
        'Recycle Bin': ['settings'],
        'Agent Inbox': ['settings'],
        'Chatbot Settings': ['settings'],
        // 'Settings': ['settings'],  // Removed
        // 'System': ['settings', 'audit'], // Removed
        'Overview': [],
        'System Health': [],
        'Plans & Limits': [],
        'Platforms': [],
        'Coupons': [],
        'Tenant Overrides': [],
        'Stores': [],
        'Platform Users': [],
        'Revenue': [],
        'Support': [],
        'Activity Feed': [],
        'Demo Store': [],
        'Settings': [],
        'System Update': [],
        'Staff Summaries': ['users'],
        'Staff Attendance': ['users'],
        'System Settings': ['settings'],
        'Database': ['settings']
    };

    const rawMenuItems = mode === 'admin' ? adminMenuItems : appMenuItems;

    const menuItems = rawMenuItems.filter(item => {
        // Exclude VenSynQ if disabled platform-wide
        if (item.name === 'VenSynQ' && !vensynq_enabled) {
            return false;
        }

        // Exclude chatbot links for non-platform-staff
        if (item.name === 'Agent Inbox' || item.name === 'Chatbot Settings') {
            const isStaff = isPlatformAdmin || !!props.auth?.user?.is_platform_staff;
            if (!isStaff) return false;
            // Hide if the plan is Starter or LTD 1
            if (isStarterOrLtd1) return false;
        }

        // Platform admin sees all items in any mode
        if (isPlatformAdmin) return true;

        // Store owner, admin, and manager: see all store menu items
        if (userRole === 'owner' || userRole === 'admin' || userRole === 'manager') return true;

        const required = MENU_PERMISSIONS[item.name];
        // Home is always visible; everything else requires explicit permission for non-named roles
        if (item.name === 'Home') return true;
        if (!required || required.length === 0) return false;

        // Prefix-aware permission check:
        // stored permissions are namespaced (e.g. 'pos.open_session', 'sales.view')
        // but MENU_PERMISSIONS uses short prefixes (e.g. 'pos', 'sales')
        // so we match if any stored permission equals OR starts with the required prefix
        return required.some(req =>
            userPerms.some(p => p === req || p.startsWith(req + '.'))
        );
    });

    // Helper to check if a menu item is active
    const isMenuItemActive = (item) => {
        if (activeMenu) return activeMenu === item.name;

        // Check if current route matches the item's main route
        if (item.route && route().current(item.route)) return true;

        // Custom mapping for Insights -> reports.*
        if (item.name === 'Insights' && route().current('store.reports.*')) return true;

        // Check if current route matches any related routes (basic heuristic)
        // For example, if item.name is 'Sales', match 'sales.*'
        const prefix = item.name.toLowerCase();
        if (route().current(`store.${prefix}.*`)) return true;

        return false;
    };

    const toggleMenu = (menuName) => {
        if (expandedMenu === menuName) {
            setExpandedMenu(null);
        } else {
            setExpandedMenu(menuName);
        }
    };

    // Handle hover-to-expand: expand sidebar AND open the specific menu
    const handleHoverExpand = useCallback((menuKey) => {
        if (!isSidebarOpen) {
            wasHoverExpandedRef.current = true; // Mark as hover-expanded
            setIsSidebarOpen(true);
            setExpandedMenu(menuKey);
        }
    }, [isSidebarOpen]);

    // Handle sidebar mouse leave - auto-collapse if it was hover-expanded
    const handleSidebarMouseLeave = useCallback(() => {
        if (wasHoverExpandedRef.current && isSidebarOpen) {
            // Small delay to prevent accidental collapse during quick movements
            setTimeout(() => {
                if (wasHoverExpandedRef.current) {
                    setIsSidebarOpen(false);
                    setExpandedMenu(null);
                    wasHoverExpandedRef.current = false;
                }
            }, 300);
        }
    }, [isSidebarOpen]);

    // Handle manual sidebar toggle - mark as NOT hover-expanded
    const handleManualToggle = useCallback(() => {
        wasHoverExpandedRef.current = false; // User clicked, so don't auto-collapse
        setIsSidebarOpen(!isSidebarOpen);
    }, [isSidebarOpen]);

    // Handle any click inside sidebar - cancel auto-collapse
    const handleSidebarInteraction = useCallback(() => {
        wasHoverExpandedRef.current = false; // User interacted, keep sidebar open
    }, []);

    // REMOVED LOCAL THEME EFFECT - Handled by ThemeContext

    useEffect(() => {
        // UI Scale logic: senior_mode (20px) > ui_scale setting (%)
        let fontSize = '16px';
        let scale = (parseInt(settings?.ui_scale) || 100) / 100;

        if (settings?.senior_mode === '1') {
            fontSize = '20px';
        } else if (isLargeText) {
            fontSize = '18px';
        }

        document.documentElement.style.fontSize = fontSize;
        document.documentElement.style.setProperty('--ui-scale', scale.toString());

        // Apply transform only if not default to avoid potential layout issues
        if (scale !== 1) {
            document.body.style.transform = `scale(${scale})`;
            document.body.style.transformOrigin = 'top left';
            document.body.style.width = `${100 / scale}%`;
            document.body.style.height = `${100 / scale}%`;
        } else {
            document.body.style.transform = '';
            document.body.style.width = '';
            document.body.style.height = '';
        }
    }, [isLargeText, settings?.senior_mode, settings?.ui_scale]);

    useEffect(() => {
        function handleClickOutside(event) {
            // If the element clicked has been removed from the DOM during event propagation,
            // ignore the event so it does not trigger accidental dropdown closures.
            if (!document.body.contains(event.target)) return;

            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
            if (growthRef.current && !growthRef.current.contains(event.target)) {
                setIsGrowthOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [userMenuRef, notificationRef, growthRef, mobileMenuRef]);

    return (
        <>
            <DemoBanner />
            <CommandPalette />
            <OnboardingDriver />
            {/* <OnboardingTour /> Legacy Modal Tour */}
            <PwaInstallPrompt />
            {/* Phase 4.4 — Global plan limit upgrade modal (triggered by axios interceptor) */}
            <UpgradeModal />
            <ImpersonationBanner />
            <div className={`h-full w-full overflow-hidden flex bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300`}>
                <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (max-width: 1023px) {
            ::-webkit-scrollbar {
                display: none !important;
            }
            * {
                -ms-overflow-style: none !important;
                scrollbar-width: none !important;
            }
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        :root {
            --ui-scale: ${settings?.ui_scale ? settings.ui_scale / 100 : 1};
        }
        /* Draggable region for custom title bar */
        .amd-draggable {
            -webkit-app-region: drag;
        }
        .amd-no-drag {
            -webkit-app-region: no-drag;
        }
      `}</style>



                {/* --- SIDEBAR --- */}
                {mobileSidebarOpen && (
                    <div className="fixed inset-0 bg-black/50 z-[90] lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
                )}
                {!fullScreen && (
                    <aside
                        ref={sidebarRef}
                        onMouseLeave={handleSidebarMouseLeave}
                        onClick={handleSidebarInteraction}
                        className={`
                            fixed lg:relative inset-y-0 lg:inset-auto lg:top-0 left-0 h-[100vh] shrink-0 z-[100] lg:z-40
                            transform lg:transform-none transition-all duration-300 lg:duration-500 lg:ease-[cubic-bezier(0.2,0.8,0.2,1)]
                            flex flex-col amd-no-drag
                            ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                            ${isPlatformAdmin && !store 
                                ? (isDarkMode ? 'bg-[#020617]/95 backdrop-blur-2xl border-r border-white/5' : 'bg-white border-r border-slate-200')
                                : 'bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-900'}
                            ${showExpandedSidebar ? 'w-[280px]' : 'w-[280px] lg:w-[88px]'}
                            ${isPlatformAdmin && !store 
                                ? (isDarkMode ? 'm-4 rounded-[32px] h-[calc(100vh-32px)] border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]' : 'border-r border-slate-200 shadow-sm transition-all')
                                : ''}
                        `}
                    >


                        {/* Logo */}
                        <div className="h-24 flex items-center justify-center shrink-0 relative z-10">
                            <div className="flex items-center justify-center">
                                <img src={store?.logo_url || "/images/logo.png"} alt="Logo" className="w-20 h-20 object-contain drop-shadow-md" />
                            </div>
                        </div>

                        <button
                            onClick={handleManualToggle}
                            className={`
                        hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full shadow-md z-50 items-center justify-center text-slate-400 hover:text-indigo-500 transition-all group
                        ${!showExpandedSidebar && 'rotate-180'}
                    `}
                        >
                            <ChevronLeft size={14} className="group-hover:scale-125 transition-transform" />
                        </button>

                        {/* Menu */}
                        <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar relative z-10" onClick={() => setMobileSidebarOpen(false)}>
                            {menuItems.map((item) => (
                                <SidebarItem
                                    key={item.name}
                                    id={item.name === 'Stock' ? 'tour-sidebar-stock' : `tour-sidebar-${item.name.toLowerCase()}`}
                                    name={item.name}
                                    icon={item.icon}
                                    subItems={item.subs}
                                    route={item.route}
                                    routeParams={item.routeParams || { store_slug: store?.slug }}
                                    menuKey={item.name}
                                    onHoverExpand={handleHoverExpand}
                                    isPlatformHQ={isPlatformAdmin && !store}
                                    isExpanded={showExpandedSidebar}
                                    isMenuExpanded={expandedMenu === item.name}
                                    isActive={activeMenu === item.name}
                                    onToggle={() => {
                                        toggleMenu(item.name);
                                        if (!showExpandedSidebar) setIsSidebarOpen(true);
                                    }}
                                />
                            ))}

                            {/* Activity Hub — PROBLEM 5 FIX: Viewer/Accountant see nothing; Cashier sees own sessions only */}
                            {(activeInvoices.length > 0 || posSessions.length > 0 || (activePurchases && activePurchases.length > 0)) && !(isPlatformAdmin && !store) && (
                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-left-2">
                                    <div className={`flex items-center gap-3 mb-4 px-2 ${!showExpandedSidebar && 'justify-center'}`}>
                                        <Activity size={18} className="text-indigo-500" />
                                        {showExpandedSidebar && <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Activity Hub</span>}
                                    </div>

                                    <div className="space-y-1">
                                        {/* Invoices — hidden from cashier/viewer/accountant/purchasing_officer */}
                                        {(userRole === 'owner' || userRole === 'admin' || userRole === 'manager') && activeInvoices.map((inv, idx) => (
                                            <button
                                                key={inv.id}
                                                onClick={() => {
                                                    setCurrentInvoiceId(inv.id);
                                                    if (!url.includes('/sales/invoice/create')) router.visit(route('store.sales.invoice.create', { store_slug: store?.slug }));
                                                }}
                                                className={`
                                            w-full flex items-center gap-3 p-2 rounded-xl transition-all group
                                            ${currentInvoiceId === inv.id && url.includes('/sales/invoice/create') ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                            ${!showExpandedSidebar && 'justify-center'}
                                        `}
                                                title={`Invoice: ${inv.customer?.name || `Sale #${idx + 1}`}`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${currentInvoiceId === inv.id && url.includes('/sales/invoice/create') ? 'bg-emerald-500' : 'bg-green-500/50'}`}></div>
                                                {showExpandedSidebar && (
                                                    <span className="text-sm font-medium truncate">
                                                        📄 {inv.customer?.name || `Sale #${idx + 1}`}
                                                    </span>
                                                )}
                                            </button>
                                        ))}

                                        {/* POS Sessions — cashier sees only own sessions */}
                                        {(userRole === 'owner' || userRole === 'admin' || userRole === 'manager' || userRole === 'cashier' || userPerms.includes('pos')) && posSessions
                                            .filter(pos => userRole === 'cashier' ? pos.user_id === props.auth?.user?.id : true)
                                            .map((pos, idx) => (
                                            <button
                                                key={pos.id}
                                                onClick={() => {
                                                    setCurrentPosId(pos.id);
                                                    if (!url.startsWith('/pos')) router.visit(route('store.pos', { store_slug: store?.slug }));
                                                }}
                                                className={`
                                            w-full flex items-center gap-3 p-2 rounded-xl transition-all group
                                            ${currentPosId === pos.id && url.startsWith('/pos') ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                            ${!showExpandedSidebar && 'justify-center'}
                                        `}
                                                title={`POS: ${pos.customer?.name || `Session #${idx + 1}`}`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${currentPosId === pos.id && url.startsWith('/pos') ? 'bg-emerald-500' : 'bg-green-500/50'}`}></div>
                                                {showExpandedSidebar && (
                                                    <span className="text-sm font-medium truncate">
                                                        🛒 {pos.customer?.name || `POS #${idx + 1}`}
                                                    </span>
                                                )}
                                            </button>
                                        ))}

                                        {/* Purchases — purchasing_officer and above */}
                                        {activePurchases && (userRole === 'owner' || userRole === 'admin' || userRole === 'manager' || userRole === 'purchasing_officer' || userPerms.includes('purchases')) && activePurchases.map((pur, idx) => (
                                            <button
                                                key={pur.id}
                                                onClick={() => {
                                                    setCurrentPurchaseId(pur.id);
                                                    if (!url.includes('/purchases/create')) router.visit(route('store.purchases.create', { store_slug: store?.slug }));
                                                }}
                                                className={`
                                            w-full flex items-center gap-3 p-2 rounded-xl transition-all group
                                            ${currentPurchaseId === pur.id && url.includes('/purchases/create') ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                            ${!showExpandedSidebar && 'justify-center'}
                                        `}
                                                title={`Purchase: ${pur.supplier?.name || `Purchase #${idx + 1}`}`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${currentPurchaseId === pur.id && url.includes('/purchases/create') ? 'bg-red-500' : 'bg-red-500/50'}`}></div>
                                                {showExpandedSidebar && (
                                                    <span className="text-sm font-medium truncate">
                                                        🛍️ {pur.supplier?.name || `Purchase #${idx + 1}`}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Back to Shop Button (Admin Mode Only) - Hide in Platform HQ */}
                            {mode === 'admin' && !(isPlatformAdmin && !store) && (
                                <div className="mt-4 px-2">
                                    <Link
                                        href={store
                                            ? route('store.dashboard', { store_slug: store.slug })
                                            : '#'
                                        }
                                        className={`
                                    flex items-center gap-3 w-full p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all font-medium border border-indigo-100 dark:border-indigo-800
                                    ${!showExpandedSidebar && 'justify-center'}
                                `}
                                        title="Back to Store"
                                    >
                                        <LogOut size={20} className="rotate-180" />
                                        {showExpandedSidebar && <span>Back to Store</span>}
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* User & POS Button */}
                        <div className={`border-t border-slate-100 dark:border-slate-800 shrink-0 flex flex-col gap-3 relative z-10 ${showExpandedSidebar ? 'p-4' : 'p-2'}`} ref={userMenuRef}>

                            {/* POS BUTTON — only show when we have a store context and NOT in platform HQ */}
                            {store && !(isPlatformAdmin && !store) && (userRole === 'owner' || userRole === 'admin' || userRole === 'manager' || userRole === 'cashier' || hasAnyPerm('pos')) && (
                                <Link
                                href={store
                                    ? (isPosRoute ? route('store.dashboard', {store_slug: store.slug}) : route('store.pos', {store_slug: store.slug}))
                                    : '#'
                                }
                                className={`
                            flex items-center justify-center gap-3 w-full py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden shadow-lg hover:shadow-indigo-500/30
                            ${showExpandedSidebar ? 'px-4' : 'px-0'}
                        `}
                            >
                                {/* Premium Background */}
                                <div className="absolute inset-0 bg-slate-900 z-0">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/30 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>
                                    <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20"></div>
                                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
                                </div>

                                <div className="relative z-10 flex items-center gap-3 text-white">
                                    <Monitor size={24} className="group-hover:scale-110 transition-transform duration-300" />
                                    <span className={`font-bold tracking-wide whitespace-nowrap transition-all duration-300 ${showExpandedSidebar ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden'}`}>
                                        {isPosRoute ? 'Close POS' : 'Open POS'}
                                    </span>
                                </div>
                            </Link>
                            )}

                            {/* USER MENU POPUP */}
                            {isUserMenuOpen && (
                                <div className="absolute bottom-20 left-4 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                                    {store && (
                                        <Link href={route('store.profile.edit', { store_slug: store.slug })} className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200">
                                            <User size={16} /> Profile Settings
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem('amd_onboarding_driver_complete');
                                            window.location.reload();
                                        }}
                                        className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm font-medium text-indigo-600 dark:indigo-400"
                                    >
                                        <Sparkles size={16} /> Take a Tour
                                    </button>
                                    {/* Admin Panel link — goes to new store-scoped route */}
                                    {store && (userRole === 'owner' || userRole === 'admin') && (
                                         <Link 
                                             id="tour-sidebar-admin"
                                             href={mode === 'admin' 
                                                 ? route('store.dashboard', {store_slug: store.slug})
                                                 : route('store.admin.home', {store_slug: store.slug})
                                             } 
                                             className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                                         >
                                             <ShieldCheck size={16} className={mode === 'admin' ? "text-indigo-500" : "text-amber-500"} /> 
                                             {mode === 'admin' ? 'Back to Store' : 'Admin Panel'}
                                         </Link>
                                    )}
                                    {(userRole === 'platform_admin') && (
                                        <Link href="/updater" className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-sm font-medium text-amber-600 dark:text-amber-400">
                                            <Package size={16} /> System Update
                                        </Link>
                                    )}
                                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                    <Link href={route('logout')} method="post" as="button" className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors text-sm font-medium">
                                        <LogOut size={16} /> Logout
                                    </Link>
                                </div>
                            )}

                            <button
                                className={`flex items-center ${showExpandedSidebar ? 'justify-start px-3 gap-3' : 'justify-center px-0 gap-0'} w-full py-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700`}
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md ring-2 ring-white dark:ring-slate-900">
                                    {(() => {
                                        const name = props.auth?.user?.name || '';
                                        const email = props.auth?.user?.email || '?';
                                        if (name) {
                                            const parts = name.split(' ');
                                            if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                                            return name.substring(0, 2).toUpperCase();
                                        }
                                        return email.substring(0, 2).toUpperCase();
                                    })()}
                                </div>
                                <div className={`text-left transition-all duration-300 overflow-hidden ${showExpandedSidebar ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[120px]">
                                        {props.auth?.user?.name || props.auth?.user?.email}
                                    </p>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                        {props.auth?.user?.role === 'platform_admin' ? 'Platform Owner' : (props.auth?.user?.role || 'User')}
                                    </p>
                                </div>
                            </button>
                        </div>
                    </aside>
                )}

                {/* --- MAIN CONTENT --- */}
                <main className={`flex-1 flex flex-col h-full min-w-0 relative bg-slate-50 dark:bg-slate-950 transition-opacity duration-500 ease-in-out opacity-100`}>
                    
                    {/* Limit Grace Countdown Banner */}
                    <LimitGraceBanner />

                    {/* Subscription/Trial Banner */}
                    {(() => {
                        if (!store) return null;
                        
                        let daysLeft = null;
                        let isTrial = store.status === 'trial';
                        let targetDate = isTrial ? store.trial_ends_at : store.subscription_ends_at;

                        if (targetDate) {
                            const diffMs = new Date(targetDate).getTime() - new Date().getTime();
                            daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 3600 * 24)));
                        }

                        // Only show if subscription has 7 or fewer days left, and is not a trial (trial has its own header badge)
                        if (daysLeft !== null && !isTrial && daysLeft <= 7 && store.status !== 'suspended') {
                            const isUrgent = daysLeft <= 3;
                            const isWarning = daysLeft > 3 && daysLeft <= 7;

                            let bannerColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
                            let btnColor = 'bg-emerald-500 hover:bg-emerald-600';
                            if (isWarning) {
                                bannerColor = 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
                                btnColor = 'bg-amber-500 hover:bg-amber-600';
                            }
                            if (isUrgent) {
                                bannerColor = 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900/30';
                                btnColor = 'bg-red-500 hover:bg-red-600';
                            }

                            return (
                                <div className={`w-full px-4 py-2 text-sm font-medium flex items-center justify-between shrink-0 border-b ${bannerColor}`}>
                                    <div className="flex items-center gap-2">
                                        <Activity size={16} className={isUrgent ? 'animate-pulse' : ''} />
                                        <span>
                                            {isTrial 
                                                ? `Your free trial expires in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}.` 
                                                : `Your subscription expires in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}.`}
                                        </span>
                                    </div>
                                    <Link href={`/s/${store.slug}/billing`} className={`px-3 py-1 rounded-md text-xs font-bold text-white transition-colors ${btnColor}`}>
                                        Upgrade Now
                                    </Link>
                                </div>
                            );
                        }
                        
                        // If suspended (e.g. they somehow bypassed the middleware or it's degraded mode)
                        if (store.status === 'suspended') {
                            return (
                                <div className="w-full px-4 py-2 text-sm font-bold bg-slate-900 text-white flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        <X size={16} className="text-red-500" />
                                        <span>Your subscription has expired. The system is in locked mode.</span>
                                    </div>
                                    <Link href={`/s/${store.slug}/billing`} className="px-3 py-1 rounded-md text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors">
                                        Upgrade Plan
                                    </Link>
                                </div>
                            );
                        }

                        return null;
                    })()}

                    {/* Plan Usage Warning Banner — AppSumo LTD (80% / 95% / 100% threshold) */}
                    <PlanUsageBanner />

                    {/* Subscription / Gift Access Link expiry — 7-day / 2-day warnings + locked state */}
                    <SubscriptionExpiryBanner />

                    {/* Header */}
                    {!hideHeader && !fullScreen && (
                        <header className="h-14 px-4 sm:px-8 flex items-center z-50 relative shrink-0">
                            {/* LEFT SECTION */}
                            <div className="flex-1 flex items-center gap-3 sm:gap-8 text-slate-400">
                                <button className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                    onClick={() => setMobileSidebarOpen(true)}>
                                    <Menu size={20} />
                                </button>
                                <div className="hidden md:flex flex-col">
                                    <h1 className={`font-bold tracking-tight whitespace-nowrap ${isPlatformAdmin && !store 
                                        ? (isDarkMode ? 'text-2xl text-white' : 'text-2xl text-slate-900')
                                        : 'text-xl text-slate-800 dark:text-white'}`}>
                                        {title || (isPlatformAdmin && !store ? 'Command Center' : 'Overview')}
                                    </h1>
                                    {!isPosRoute && <p className="text-xs text-slate-400 font-medium">Welcome back, {props.auth?.user?.name || 'Abdullah'}</p>}
                                </div>
 
                                {/* OmniSearch - Universal Command Palette */}
                                <div id="tour-omnisearch" className="flex-1 max-w-[240px] sm:max-w-xs md:max-w-none">
                                    <OmniSearch
                                        onAskAi={(query) => {
                                            setAiModalQuery(query);
                                            setIsAiModalOpen(true);
                                            setIsAiMinimized(false);
                                        }}
                                    />
                                </div>
                            </div>
 
                            {/* CENTER SECTION */}
                            <div className="flex-none">
                                {isTrial && (
                                    <Link
                                        href={route('store.billing', { store_slug: store?.slug })}
                                        className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all group shadow-sm shadow-amber-500/5"
                                    >
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                                        <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em] leading-none">
                                            {trialDaysLeft} Days Left
                                        </span>
                                        <ArrowRight size={14} className="text-amber-500 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                )}
                            </div>
 
                            {/* RIGHT SECTION */}
                            <div className="flex-1 flex items-center justify-end gap-2 sm:gap-4">
                                <div className="hidden lg:block">
                                    <CharityButton />
                                </div>
 
                                {/* Actionable Intelligence (AI) Recommendation Engine */}
                                <div className="hidden lg:block relative z-50" ref={growthRef}>
                                    {showAiPopup && !isGrowthOpen && props.growth_engine?.popup && (
                                        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 h-16 bg-white dark:bg-slate-900 pr-3 pl-4 rounded-2xl shadow-lg border border-indigo-100 dark:border-indigo-800 animate-in fade-in slide-in-from-right-4 duration-500 flex items-center gap-4">
                                            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-t border-r border-indigo-100 dark:border-indigo-800 rotate-45"></div>
 
                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 shrink-0">
                                                <Sparkles size={18} />
                                            </div>
 
                                            <div className="flex flex-col justify-center w-72">
                                                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">Opportunity Detected</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                    {props.growth_engine.popup.description || 'New insights available.'}
                                                </p>
                                            </div>
 
                                            <div className="flex items-center gap-2 border-l border-slate-100 dark:border-slate-800 pl-3 h-10">
                                                <button
                                                    onClick={() => { setIsGrowthOpen(true); setShowAiPopup(false); }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                                    title="View Actions"
                                                >
                                                    <ArrowRight size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setShowAiPopup(false)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
 
                                        {/* Growth Engine - Hide in Platform HQ */}
                                        {!(isPlatformAdmin && !store) && (userRole === 'owner' || userRole === 'admin') && (
                                            <button
                                                id="tour-growth-engine"
                                                onClick={() => setIsGrowthOpen(!isGrowthOpen)}
                                                className={`group relative flex items-center gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border transition-all duration-300 ${isGrowthOpen
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200 dark:shadow-none'
                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'}`}
                                            >
                                                <Sparkles size={16} className={isGrowthOpen ? 'text-indigo-200' : 'text-indigo-500'} />
                                                <span className={`text-sm font-bold hidden md:inline-block ${isGrowthOpen ? 'text-white' : 'bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent'}`}>
                                                    Growth Engine
                                                </span>
                                                {props.growth_engine?.count > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>}
                                            </button>
                                        )}
 
                                    {/* Growth Engine Dropdown */}
                                    {isGrowthOpen && (
                                        <div className="absolute right-0 top-full mt-3 w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right z-[70]">
                                            <div className="p-5 bg-gradient-to-br from-indigo-600 to-violet-700 text-white relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                                <h3 className="text-lg font-bold relative z-10 flex items-center gap-2">
                                                    <Sparkles size={18} className="text-yellow-300" /> Actionable Intelligence
                                                </h3>
                                                <p className="text-indigo-100 text-xs mt-1 relative z-10">{props.growth_engine?.count || 0} Opportunities detected.</p>
                                            </div>
 
                                            <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                                {(!props.growth_engine?.count || props.growth_engine.count === 0) ? (
                                                    <div className="p-8 text-center text-slate-500">
                                                        <Sparkles size={24} className="mx-auto mb-2 text-slate-300" />
                                                        <p className="text-sm">No new recommendations.</p>
                                                    </div>
                                                ) : (
                                                    <div className="p-4 text-center">
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">Head to the dashboard to view detailed insights.</p>
                                                    </div>
                                                )}
                                            </div>
 
                                            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
                                                <Link href={route('store.growth-engine.index', { store_slug: store.slug })} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1">
                                                    View All Recommendations <ArrowRight size={12} />
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
 
                                {/* Store Switcher (Moved from Sidebar) */}
                                {props.auth?.my_stores_count > 1 && (
                                    <div className="hidden lg:block relative">
                                        <StoreSwitcher />
                                    </div>
                                )}
 
                                {/* Header Private Shortcut: Toggle Admin/Store Panel - Hide in Platform HQ */}
                                {store && !(isPlatformAdmin && !store) && (userRole === 'owner' || userRole === 'admin') && (
                                    <Link
                                        href={mode === 'admin' ? (store ? route('store.dashboard', {store_slug: store.slug}) : '#') : (store ? route('store.admin.home', {store_slug: store.slug}) : '#')}
                                        className="hidden lg:flex group relative items-center gap-2 px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all duration-300"
                                    >
                                        <ShieldCheck size={16} className={mode === 'admin' ? "text-indigo-500" : "text-amber-500"} />
                                        <span className={`text-sm font-bold bg-gradient-to-r ${mode === 'admin' ? 'from-indigo-600 to-violet-600' : 'from-amber-600 to-orange-600'} bg-clip-text text-transparent`}>
                                            {mode === 'admin' ? 'Back to Store' : 'Admin Panel'}
                                        </span>
                                    </Link>
                                )}
 
                                {/* Live Header Clock */}
                                <div className="hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 shrink-0 font-mono shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300">
                                    <Clock size={16} className="text-indigo-500 dark:text-indigo-400 animate-[pulse_2s_infinite]" />
                                    <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                </div>
 
                                {/* Display Settings Dropdown */}
                                <div className="hidden lg:block relative" ref={displayMenuRef}>
                                    <button
                                        onClick={() => setIsDisplayMenuOpen(!isDisplayMenuOpen)}
                                        className={`p-3 rounded-xl transition-all border shadow-sm relative ${isDisplayMenuOpen
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:shadow-md border-slate-100 dark:border-slate-700'}`}
                                        title="Display Preferences"
                                    >
                                        <Settings2 size={18} />
                                    </button>
 
                                    {isDisplayMenuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-[60] overflow-hidden animate-in fade-in zoom-in-95 origin-top-right p-2 space-y-1">
                                            <button
                                                onClick={() => {
                                                    const newValue = settings?.senior_mode === '1' ? '0' : '1';
                                                    router.post(route("store.settings.update", {
                                                        store_slug: store.slug
                                                    }), {
                                                        settings: { ...settings, senior_mode: newValue }
                                                    }, { preserveScroll: true });
                                                }}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${settings?.senior_mode === '1'
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Type size={16} />
                                                    <span className="text-sm font-semibold">Senior Mode</span>
                                                </div>
                                                <div className={`w-8 h-4 rounded-full relative transition-colors ${settings?.senior_mode === '1' ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings?.senior_mode === '1' ? 'left-4.5' : 'left-0.5'}`}></div>
                                                </div>
                                            </button>
 
                                            <button
                                                onClick={() => setIsDarkMode(!isDarkMode)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isDarkMode
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                                                    <span className="text-sm font-semibold">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                                                </div>
                                                <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'left-4.5' : 'left-0.5'}`}></div>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </div>
 
                                {/* Mobile Options Dropdown (lg:hidden) */}
                                <div className="lg:hidden relative" ref={mobileMenuRef}>
                                    <button
                                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                        className={`p-3 rounded-xl transition-all border shadow-sm relative ${isMobileMenuOpen
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:shadow-md border-slate-100 dark:border-slate-700'}`}
                                        title="More Options"
                                    >
                                        <MoreVertical size={18} />
                                    </button>
 
                                    {isMobileMenuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-[60] overflow-hidden animate-in fade-in zoom-in-95 origin-top-right p-2 space-y-2">
                                            {/* Store Switcher & Charity Button Row */}
                                            {(props.auth?.my_stores_count > 1 || String(settings?.charity_enabled) === '1' || settings?.charity_enabled === true) && (
                                                <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-end justify-between gap-3">
                                                    {props.auth?.my_stores_count > 1 ? (
                                                        <div className="flex-1">
                                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Switch Store</p>
                                                            <StoreSwitcher />
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-355 pl-2 pb-2">Charity Donations</span>
                                                    )}
                                                    {(String(settings?.charity_enabled) === '1' || settings?.charity_enabled === true) && (
                                                        <div className="flex-none">
                                                            <CharityButton />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
 
                                            {/* Admin / Store Link */}
                                            {store && !(isPlatformAdmin && !store) && (userRole === 'owner' || userRole === 'admin') && (
                                                <Link
                                                    href={mode === 'admin' ? (store ? route('store.dashboard', {store_slug: store.slug}) : '#') : (store ? route('store.admin.home', {store_slug: store.slug}) : '#')}
                                                    className={`flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-semibold ${mode === 'admin' ? 'text-indigo-600' : 'text-amber-600'}`}
                                                >
                                                    <ShieldCheck size={16} className={mode === 'admin' ? "text-indigo-500" : "text-amber-500"} />
                                                    <span>{mode === 'admin' ? 'Back to Store' : 'Admin Panel'}</span>
                                                </Link>
                                            )}
 
                                            {/* Display Settings */}
                                            <div className="space-y-1">
                                                <button
                                                    onClick={() => {
                                                        const newValue = settings?.senior_mode === '1' ? '0' : '1';
                                                        router.post(route("store.settings.update", {
                                                            store_slug: store.slug
                                                        }), {
                                                            settings: { ...settings, senior_mode: newValue }
                                                        }, { preserveScroll: true });
                                                    }}
                                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${settings?.senior_mode === '1'
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Type size={16} />
                                                        <span className="text-sm font-semibold">Senior Mode</span>
                                                    </div>
                                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${settings?.senior_mode === '1' ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings?.senior_mode === '1' ? 'left-4.5' : 'left-0.5'}`}></div>
                                                    </div>
                                                </button>
 
                                                <button
                                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isDarkMode
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                                                        <span className="text-sm font-semibold">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                                                    </div>
                                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'left-4.5' : 'left-0.5'}`}></div>
                                                    </div>
                                                </button>
                                            </div>
 
                                            {/* User Settings */}
                                            <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1">
                                                {store && (
                                                    <Link href={route('store.profile.edit', { store_slug: store.slug })} className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200">
                                                        <User size={16} /> Profile Settings
                                                    </Link>
                                                )}
                                                <Link href={route('logout')} method="post" as="button" className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors text-sm font-medium">
                                                    <LogOut size={16} /> Logout
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Notification Button */}
                                <div className="relative" ref={notificationRef}>
                                    <button
                                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                        className={`p-3 rounded-xl transition-all border shadow-sm relative ${isNotificationsOpen
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:shadow-md border-slate-100 dark:border-slate-700'}`}
                                    >
                                        <Bell size={18} />
                                        {props.auth.unread_notifications_count > 0 && (
                                            <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800 animate-pulse"></span>
                                        )}
                                    </button>

                                    {/* Notifications Dropdown */}
                                    {isNotificationsOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-[60] overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                                            <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                                                <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                                                <button
                                                    onClick={() => store && router.post(route('store.notifications.mark-all-read', { store_slug: store.slug }))}
                                                    className="text-xs text-indigo-500 font-medium hover:underline"
                                                >
                                                    Mark all read
                                                </button>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                                {props.auth.notifications && props.auth.notifications.length > 0 ? (
                                                    props.auth.notifications.map((notification) => (
                                                        <div key={notification.id} className={`p-3 rounded-xl transition-colors ${notification.read_at ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20'}`}>
                                                            <div className="flex gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notification.read_at ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600'}`}>
                                                                    <Bell size={14} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-semibold text-slate-800 dark:text-white">{notification.data?.title || 'Notification'}</p>
                                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{notification.data?.message || 'No details available'}</p>
                                                                    <p className="text-[10px] text-slate-400 mt-1">{new Date(notification.created_at).toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-6 text-center text-slate-500">
                                                        <p className="text-xs">No notifications yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-2 border-t border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center">
                                                <Link href={store ? route('store.notifications.index', { store_slug: store.slug }) : '#'} className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                                                    View All Notifications
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </header>
                    )}


                    {/* DYNAMIC CONTENT AREA */}
                    <div className={`flex-1 min-h-0 overflow-y-auto h-full w-full animate-[fadeIn_0.4s_ease-out] ${noPadding ? '' : 'px-2 sm:px-8 pb-8'}`}>
                        {children}
                        {/* Spacer to ensure content is not hidden behind the mobile bottom nav bar */}
                        {showMobileNavBar && (
                            <div className="lg:hidden w-full shrink-0" style={{ height: '80px' }} aria-hidden="true" />
                        )}
                    </div>
                </main >

                {/* IDLE OVERLAY */}
                {
                    isIdle && (
                        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-500">
                            <div className="text-center text-white space-y-6 max-w-lg p-8">
                                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                    <Clock size={48} className="text-indigo-400" />
                                </div>
                                <h2 className="text-4xl font-bold tracking-tight">Session Paused</h2>
                                <p className="text-xl text-slate-300">
                                    We haven't detected any activity for {parseInt(settings?.auto_logout) || 60} minutes.
                                    Your session has been paused to secure your work.
                                </p>
                                <button
                                    onClick={() => setIsIdle(false)}
                                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
                                >
                                    I'm Back, Resume Work
                                </button>
                            </div>
                        </div>
                    )
                }

                {/* Phase 4: AI Command Center */}
                <AiAssistantModal
                    isOpen={isAiModalOpen}
                    onClose={() => { setIsAiModalOpen(false); setAiModalQuery(''); }}
                    onMinimize={() => {
                        setIsAiModalOpen(false);
                        setIsAiMinimized(true);
                        setAiModalQuery('');
                    }}
                    initialQuery={aiModalQuery}
                    settings={settings}
                    store={store}
                />

                {isAiMinimized && (
                    <FloatingAiBubble
                        onClick={() => {
                            setIsAiMinimized(false);
                            setIsAiModalOpen(true);
                        }}
                        onClose={() => setIsAiMinimized(false)}
                        messageCount={aiMessageCount}
                    />
                )}
            </div >
            <PwaInstallPrompt />
            <VersionChecker />
            <OnboardingDriver />
            <GlobalOnboardingWidget store={store} />
            
            {/* Mobile Bottom Navigation Bar */}
            {showMobileNavBar && (
                <div className="lg:hidden fixed bottom-5 left-4 right-4 z-[100] animate-in slide-in-from-bottom-6 cubic-bezier(0.16, 1, 0.3, 1) duration-500">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/40 dark:border-slate-800/60 rounded-3xl shadow-[0_16px_36px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.4)] px-3 py-2 flex items-center justify-between gap-1 relative">
                        
                        {/* Upward Drop-up Menu */}
                        {activeDropdown && (
                            <>
                                <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={() => setActiveDropdown(null)} />
                                <div className="absolute left-3 right-3 bottom-[4.5rem] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-[120] animate-in slide-in-from-bottom-2 duration-200 max-h-[60vh] overflow-y-auto">
                                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                            {activeDropdown} Options
                                        </span>
                                        <button onClick={() => setActiveDropdown(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {getDropdownOptions(activeDropdown).map((option, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleOptionClick(option)}
                                                className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-150/50 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all text-left text-xs font-extrabold"
                                            >
                                                <span className="text-slate-400 shrink-0">{option.icon}</span>
                                                <span className="truncate">{option.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Glowing Bud Toggle for Mobile FABs */}
                        <div className="absolute -top-3 right-6 z-[105]">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMobileFabsOpen(!isMobileFabsOpen);
                                }}
                                id="mobile-fabs-toggle-bud"
                                className="px-2.5 py-1 rounded-full bg-slate-900/90 dark:bg-slate-950/90 border border-indigo-500/40 flex items-center gap-1 text-white shadow-lg shadow-indigo-500/20 hover:border-indigo-400 cursor-pointer relative active:scale-95 transition-all duration-300 text-[10px] font-bold uppercase tracking-wider"
                            >
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500 animate-ping opacity-75" />
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500" />
                                {budIconType === 'setup' ? (
                                    <Sparkles size={10} className="text-indigo-400 animate-in fade-in zoom-in duration-300" />
                                ) : (
                                    <MessageSquare size={10} className="text-indigo-400 animate-in fade-in zoom-in duration-300" />
                                )}
                                <ChevronUp size={10} className={`transition-transform duration-300 ${isMobileFabsOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Tab 1: Sale (invoice) */}
                        <Link
                            href={getMobileTabUrl('store.sales.index')}
                            onMouseDown={() => startPress('sales')}
                            onMouseUp={cancelPress}
                            onMouseLeave={cancelPress}
                            onTouchStart={() => startPress('sales')}
                            onTouchEnd={cancelPress}
                            onContextMenu={(e) => e.preventDefault()}
                            onClick={handleLinkClick('sales', 'store.sales.index')}
                            className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 px-1 rounded-2xl transition-all duration-300 relative ${
                                isSaleInvoiceActive
                                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 font-semibold scale-[1.03] shadow-sm border border-indigo-100/30 dark:border-indigo-900/30'
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                            }`}
                        >
                            <ShoppingCart size={20} className={`transition-transform duration-300 ${isSaleInvoiceActive ? 'scale-110' : ''}`} />
                            <span className="text-[8px] sm:text-[9px] font-medium tracking-tighter text-center leading-tight whitespace-nowrap">Sale</span>
                            {isSaleInvoiceActive && (
                                <span className="absolute bottom-1 w-1.5 h-1 bg-indigo-500 dark:bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse"></span>
                            )}
                        </Link>

                        {/* Tab 2: Purchase */}
                        <Link
                            href={getMobileTabUrl('store.purchases.index')}
                            onMouseDown={() => startPress('purchases')}
                            onMouseUp={cancelPress}
                            onMouseLeave={cancelPress}
                            onTouchStart={() => startPress('purchases')}
                            onTouchEnd={cancelPress}
                            onContextMenu={(e) => e.preventDefault()}
                            onClick={handleLinkClick('purchases', 'store.purchases.index')}
                            className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 px-1 rounded-2xl transition-all duration-300 relative ${
                                isPurchaseActive
                                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 font-semibold scale-[1.03] shadow-sm border border-indigo-100/30 dark:border-indigo-900/30'
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                            }`}
                        >
                            <ShoppingBag size={20} className={`transition-transform duration-300 ${isPurchaseActive ? 'scale-110' : ''}`} />
                            <span className="text-[8px] sm:text-[9px] font-medium tracking-tighter text-center leading-tight whitespace-nowrap">Purchase</span>
                            {isPurchaseActive && (
                                <span className="absolute bottom-1 w-1.5 h-1 bg-indigo-500 dark:bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse"></span>
                            )}
                        </Link>

                        {/* Tab 3: Dashboard */}
                        <Link
                            href={getMobileTabUrl('store.dashboard')}
                            onMouseDown={() => startPress('dashboard')}
                            onMouseUp={cancelPress}
                            onMouseLeave={cancelPress}
                            onTouchStart={() => startPress('dashboard')}
                            onTouchEnd={cancelPress}
                            onContextMenu={(e) => e.preventDefault()}
                            onClick={handleLinkClick('dashboard', 'store.dashboard')}
                            className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 px-1 rounded-2xl transition-all duration-300 relative ${
                                isHomeActive
                                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 font-semibold scale-[1.03] shadow-sm border border-indigo-100/30 dark:border-indigo-900/30'
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                            }`}
                        >
                            <LayoutDashboard size={20} className={`transition-transform duration-300 ${isHomeActive ? 'scale-110' : ''}`} />
                            <span className="text-[8px] sm:text-[9px] font-medium tracking-tighter text-center leading-tight whitespace-nowrap">Dashboard</span>
                            {isHomeActive && (
                                <span className="absolute bottom-1 w-1.5 h-1 bg-indigo-500 dark:bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse"></span>
                            )}
                        </Link>

                        {/* Tab 4: Expense */}
                        <Link
                            href={getMobileTabUrl('store.expenses.index')}
                            onMouseDown={() => startPress('expenses')}
                            onMouseUp={cancelPress}
                            onMouseLeave={cancelPress}
                            onTouchStart={() => startPress('expenses')}
                            onTouchEnd={cancelPress}
                            onContextMenu={(e) => e.preventDefault()}
                            onClick={handleLinkClick('expenses', 'store.expenses.index')}
                            className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 px-1 rounded-2xl transition-all duration-300 relative ${
                                isExpenseActive
                                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 font-semibold scale-[1.03] shadow-sm border border-indigo-100/30 dark:border-indigo-900/30'
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                            }`}
                        >
                            <CreditCard size={20} className={`transition-transform duration-300 ${isExpenseActive ? 'scale-110' : ''}`} />
                            <span className="text-[8px] sm:text-[9px] font-medium tracking-tighter text-center leading-tight whitespace-nowrap">Expense</span>
                            {isExpenseActive && (
                                <span className="absolute bottom-1 w-1.5 h-1 bg-indigo-500 dark:bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse"></span>
                            )}
                        </Link>

                        {/* Tab 5: Stock */}
                        <Link
                            href={getMobileTabUrl('store.inventory.index')}
                            onMouseDown={() => startPress('stock')}
                            onMouseUp={cancelPress}
                            onMouseLeave={cancelPress}
                            onTouchStart={() => startPress('stock')}
                            onTouchEnd={cancelPress}
                            onContextMenu={(e) => e.preventDefault()}
                            onClick={handleLinkClick('stock', 'store.inventory.index')}
                            className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 px-1 rounded-2xl transition-all duration-300 relative ${
                                isStockActive
                                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 font-semibold scale-[1.03] shadow-sm border border-indigo-100/30 dark:border-indigo-900/30'
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                            }`}
                        >
                            <Box size={20} className={`transition-transform duration-300 ${isStockActive ? 'scale-110' : ''}`} />
                            <span className="text-[8px] sm:text-[9px] font-medium tracking-tighter text-center leading-tight whitespace-nowrap">Stock</span>
                            {isStockActive && (
                                <span className="absolute bottom-1 w-1.5 h-1 bg-indigo-500 dark:bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse"></span>
                            )}
                        </Link>
                    </div>
                </div>
            )}

            {/* Global Toast Notifications */}
            <Toast toasts={toasts} removeToast={removeToast} duration={4000} />

            {/* Global Style Injections for Mobile FABs Drawer */}
            <style>{`
                @media (max-width: 1023px) {
                    /* Hide FABs by translating down */
                    div[class*="z-[55]"],
                    div[class*="z-[95]"],
                    div[class*="z-[150]"] {
                        transform: translateY(400px) !important;
                        opacity: 0 !important;
                        pointer-events: none !important;
                        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease !important;
                    }
                    /* Slide up when active and offset slightly higher to clear bottom bar/bud overlap */
                    body.mobile-fabs-expanded div[class*="z-[55]"],
                    body.mobile-fabs-expanded div[class*="z-[95]"],
                    body.mobile-fabs-expanded div[class*="z-[150]"] {
                        transform: translateY(-20px) !important;
                        opacity: 1 !important;
                        pointer-events: auto !important;
                    }
                }
            `}</style>
        </>
    );
}
