import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Sparkles, ArrowRight, Minimize2, Check } from 'lucide-react';

export default function GlobalOnboardingWidget({ store }) {
 const [isMinimized, setIsMinimized] = useState(() => {
 return sessionStorage.getItem('amd_global_onboarding_minimized') === 'true';
 });

 const toggleMinimized = (val) => {
 setIsMinimized(val);
 sessionStorage.setItem('amd_global_onboarding_minimized', val ? 'true' : 'false');
 };

 const getOnboardingProgress = (step) => {
 switch (step) {
 case 'welcome': return 0;
 case 'stock_value': return 10;
 case 'sidebar_stock': return 20;
 case 'inventory_tour': return 35;
 case 'congratulations': return 45;
 case 'inventory_tour_more': return 45;
 case 'purchase_tour_start': return 55;
 case 'purchase_tour_sidebar': return 60;
 case 'purchase_tour': return 65;
 case 'purchase_congratulations': return 70;
 case 'invoice_tour_start':
 case 'pos_tour_start': return 75;
 case 'invoice_tour':
 case 'pos_tour': return 85;
 case 'invoice_congratulations':
 case 'pos_congratulations': return 90;
 case 'expense_tour_start': return 92;
 case 'expense_tour': return 95;
 case 'expense_congratulations': return 97;
 case 'drive_sync_tour': return 99;
 default: return 0;
 }
 };

 const getPhaseName = (progress) => {
 if (progress < 50) return 'Phase 1: Catalog Products';
 if (progress >= 50 && progress < 75) return 'Phase 2: Record Purchase';
 if (progress >= 75 && progress < 92) return 'Phase 3: Record Sale';
 if (progress >= 92 && progress < 98) return 'Phase 4: Add Expense';
 return 'Phase 5: Secure Database';
 };

 const handleResume = () => {
 const step = store?.onboarding_step;
 if (step === 'skipped') {
 router.post(
 route('store.onboarding.step', { store_slug: store?.slug }),
 { step: 'welcome' },
 {
 onSuccess: () => {
 router.visit(route('store.dashboard', { store_slug: store.slug }));
 }
 }
 );
 return;
 }
 if (['welcome', 'stock_value', 'sidebar_stock'].includes(step)) {
 router.visit(route('store.dashboard', { store_slug: store.slug }));
 } else if (['inventory_tour', 'congratulations', 'inventory_tour_more'].includes(step)) {
 router.visit(route('store.inventory.index', { store_slug: store.slug }));
 } else if (['purchase_tour_start', 'purchase_tour_sidebar', 'purchase_tour', 'purchase_congratulations'].includes(step)) {
 if (step === 'purchase_tour') {
 router.visit(route('store.purchases.create', { store_slug: store.slug }));
 } else {
 router.visit(route('store.dashboard', { store_slug: store.slug }));
 }
 } else if (['invoice_tour_start', 'invoice_tour', 'invoice_congratulations'].includes(step)) {
 if (step === 'invoice_tour') {
 router.visit(route('store.sales.invoice.create', { store_slug: store.slug }));
 } else {
 router.visit(route('store.dashboard', { store_slug: store.slug }));
 }
 } else if (['pos_tour_start', 'pos_tour', 'pos_congratulations'].includes(step)) {
 if (step === 'pos_tour') {
 router.visit(route('store.pos', { store_slug: store.slug }));
 } else {
 router.visit(route('store.dashboard', { store_slug: store.slug }));
 }
 } else if (['expense_tour_start', 'expense_tour', 'expense_congratulations'].includes(step)) {
 if (step === 'expense_tour') {
 router.visit(route('store.expenses.index', { store_slug: store.slug }));
 } else {
 router.visit(route('store.dashboard', { store_slug: store.slug }));
 }
 } else if (step === 'drive_sync_tour') {
 router.visit(route('store.admin.data', { store_slug: store.slug, tab: 'drive_sync' }));
 } else {
 router.visit(route('store.dashboard', { store_slug: store.slug }));
 }
 };

 const handleMarkComplete = () => {
 router.post(
 route('store.onboarding.step', { store_slug: store?.slug }),
 { step: 'completed' },
 { preserveScroll: true }
 );
 };

 const { component, url, props } = usePage();
 const step = store?.onboarding_step;
 const onboarding_metrics = props.onboarding_metrics;

 const metrics = onboarding_metrics || {
 has_products: false,
 has_purchases: false,
 has_sales: false,
 has_expenses: false,
 has_drive_sync: false
 };

 const checklist = [
 { key: 'inventory', label: 'Catalog First Product', isDone: metrics.has_products },
 { key: 'purchase', label: 'Record First Purchase', isDone: metrics.has_purchases },
 { key: 'sale', label: 'Record First Sale (POS/Invoice)', isDone: metrics.has_sales },
 { key: 'expense', label: 'Record Store Expense', isDone: metrics.has_expenses },
 { key: 'drive_sync', label: 'Secure Database (Google Drive)', isDone: metrics.has_drive_sync || !!store?.google_backup_enabled || !!store?.google_connected }
 ];
 const remainingCount = checklist.filter(item => !item.isDone).length;

 useEffect(() => {
 if (remainingCount === 0 && store && !store.onboarding_completed && step !== 'completed') {
 router.post(
 route('store.onboarding.step', { store_slug: store?.slug }),
 { step: 'completed' },
 { preserveScroll: true }
 );
 }
 }, [remainingCount, store?.onboarding_completed, step]);

 // Check if the mobile nav bar is active to avoid overlapping
 const showMobileNavBar = (() => {
 if (!store) return false;
 const auth = props?.auth;
 if (!auth?.user) return false;

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

 // Helper to determine if an active spotlight/tour modal is currently running on the page
 const isTourActive = () => {
 if (!step) return false;
 const pathname = window.location.pathname;

 // Dashboard modals/tooltips
 if (['welcome', 'stock_value', 'sidebar_stock', 'purchase_tour_start', 'purchase_tour_sidebar', 'invoice_tour_start', 'pos_tour_start', 'expense_tour_start'].includes(step)) {
 return component === 'Dashboard' || pathname.endsWith('/dashboard');
 }

 // Inventory tour spotlight
 if (['inventory_tour', 'congratulations', 'inventory_tour_more'].includes(step)) {
 return component?.includes('Inventory') || pathname.includes('/inventory');
 }

 // Purchase tour spotlight
 if (['purchase_tour', 'purchase_congratulations'].includes(step)) {
 return component?.includes('Purchases/Create') || pathname.includes('/purchases/create');
 }

 // Invoice tour spotlight
 if (['invoice_tour', 'invoice_congratulations'].includes(step)) {
 return component?.includes('CreateInvoice') || pathname.includes('/sales/invoice/create');
 }

 // POS tour spotlight
 if (['pos_tour', 'pos_congratulations'].includes(step)) {
 return component?.includes('Pos') || pathname.includes('/pos');
 }

 // Expense tour spotlight
 if (['expense_tour', 'expense_congratulations'].includes(step)) {
 return component?.includes('Expenses') || pathname.includes('/expenses');
 }

 return false;
 };

 // If onboarding is marked as completed in DB or is demo store, don't show the widget
 if (store?.onboarding_completed || store?.is_demo || step === 'completed') {
 return null;
 }

 // If the step is empty (no onboarding), don't show the widget
 if (!step) {
 return null;
 }

 // Hide during active tours to avoid overlapping UI/spotlights
 if (isTourActive()) {
 return null;
 }

 // Explicitly blocked patterns — active creation/transaction/setup flows
 const path = window.location.pathname.toLowerCase();
 const blockedPatterns = [
 '/pos',
 '/create',
 '/edit',
 '/new-store',
 '/setup',
 '/refund',
 '/return',
 ];
 const isProfileEdit = path.includes('/profile/edit') || path.includes('/profile');
 if (blockedPatterns.some(p => path.includes(p) && !(p === '/edit' && isProfileEdit))) {
 return null;
 }

 const progress = getOnboardingProgress(step);
 const circumference = 2 * Math.PI * 18;
 const progressOffset = circumference * (1 - progress / 100);

 const handleStepClick = (item) => {
 if (item.isDone) return;
 
 let targetStep = '';
 let targetRoute = '';
 let routeParams = { store_slug: store?.slug };

 switch (item.key) {
 case 'inventory':
 targetStep = 'inventory_tour';
 targetRoute = 'store.inventory.index';
 break;
 case 'purchase':
 targetStep = 'purchase_tour_start';
 targetRoute = 'store.dashboard';
 break;
 case 'sale':
 targetStep = 'invoice_tour_start';
 targetRoute = 'store.dashboard';
 break;
 case 'expense':
 targetStep = 'expense_tour_start';
 targetRoute = 'store.dashboard';
 break;
 case 'drive_sync':
 targetStep = 'drive_sync_tour';
 targetRoute = 'store.admin.data';
 routeParams.tab = 'drive_sync';
 break;
 default:
 return;
 }

 router.post(
 route('store.onboarding.step', { store_slug: store?.slug }),
 { step: targetStep },
 {
 onSuccess: () => {
 router.visit(route(targetRoute, routeParams));
 }
 }
 );
 };

 if (isMinimized) {
 // Minimized floating circle widget
 return (
 <div 
 onClick={() => toggleMinimized(false)}
 title={`Onboarding Checklist: ${remainingCount} steps remaining`}
 className={`fixed right-6 z-drawer w-14 h-14 bg-surface border border-line dark:border-brand-500/30 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(99,102,241,0.3)] backdrop-blur-md flex items-center justify-center cursor-pointer pointer-events-auto active:scale-95 hover:border-brand-400/50 transition-all duration-slow group animate-in zoom-in-90 ${showMobileNavBar ? 'bottom-[172px] lg:bottom-24' : 'bottom-24'}`}
 >
 <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 44 44">
 <circle
 className="text-neutral-100 dark:text-ink"
 strokeWidth="3.5"
 stroke="currentColor"
 fill="transparent"
 r="18"
 cx="22"
 cy="22"
 />
 <circle
 className="text-brand-500 transition-all duration-slower ease-out"
 strokeWidth="3.5"
 strokeDasharray={circumference}
 strokeDashoffset={progressOffset}
 strokeLinecap="round"
 stroke="currentColor"
 fill="transparent"
 r="18"
 cx="22"
 cy="22"
 />
 </svg>
 <div className="relative z-10 text-brand-600 dark:text-brand-400 group-hover:text-brand-700 dark:group-hover:text-white transition-colors duration-normal">
 <Sparkles size={18} className="animate-pulse" />
 </div>
 <span className="absolute -top-1 -right-2 bg-rose-600 text-4xs font-bold text-white px-2 py-0.5 rounded-full shadow whitespace-nowrap">
 {remainingCount} left
 </span>
 </div>
 );
 }

 return (
 <div className={`fixed right-6 z-drawer max-w-sm w-full bg-surface border border-line dark:border-brand-500/30 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_15px_40px_rgba(99,102,241,0.25)] p-5 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-slow pointer-events-auto ${showMobileNavBar ? 'bottom-[172px] lg:bottom-24' : 'bottom-24'}`}>
 {/* Minimize button */}
 <button 
 onClick={() => toggleMinimized(true)}
 className="absolute top-4 right-4 p-1.5 rounded-lg bg-surface hover:bg-interactive-hover text-ink-muted hover:text-ink-secondary dark:bg-surface dark:hover:bg-interactive-hover dark:text-ink-muted dark:hover:text-white transition-colors border border-line"
 title="Minimize to widget"
 >
 <Minimize2 size={12} />
 </button>

 <div className="flex items-start gap-3 mb-3">
 <div className="p-2 bg-brand-50 dark:bg-brand-500/10 rounded-lg text-brand-600 dark:text-brand-400 shrink-0">
 <Sparkles size={20} className="animate-pulse" />
 </div>
 <div>
 <h4 className="text-sm font-bold text-ink uppercase tracking-wider">Setup Checklist</h4>
 <p className="text-2xs text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wide">
 {remainingCount === 0 ? 'All Completed!' : `${remainingCount} steps remaining`}
 </p>
 </div>
 </div>

 {/* Checklist of steps */}
 <div className="my-4 space-y-1.5 border-t border-b border-line py-3">
 {checklist.map((item, idx) => (
 <button
 key={idx}
 onClick={() => handleStepClick(item)}
 disabled={item.isDone}
 className={`w-full flex items-center justify-between text-xs p-1.5 rounded-lg transition-all text-left ${item.isDone ? 'cursor-not-allowed opacity-80' : 'hover:bg-interactive-hover dark:hover:bg-interactive-hover cursor-pointer'}`}
 title={item.isDone ? `${item.label} completed` : `Click to jump to ${item.label}`}
 >
 <div className="flex items-center gap-2">
 <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${item.isDone ? 'bg-emerald-500/15 text-emerald-500' : 'bg-sunken text-ink-muted'}`}>
 {item.isDone ? (
 <Check size={10} strokeWidth={3} />
 ) : (
 <div className="w-1.5 h-1.5 rounded-full bg-sunken" />
 )}
 </div>
 <span className={`font-semibold ${item.isDone ? 'text-ink-muted line-through' : 'text-ink-secondary dark:text-ink'}`}>
 {item.label}
 </span>
 </div>
 <span className={`text-3xs font-bold px-1.5 py-0.5 rounded-full ${item.isDone ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand-500/10 text-brand-500'}`}>
 {item.isDone ? 'Done' : 'Start'}
 </span>
 </button>
 ))}
 </div>

 <div className="flex gap-2">
 <button
 onClick={handleResume}
 className="flex-[2] py-2.5 px-3 bg-gradient-brand text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.99]"
 >
 <span>Resume Setup</span>
 <ArrowRight size={12} />
 </button>
 <button
 onClick={handleMarkComplete}
 className="flex-1 py-2.5 px-3 bg-surface hover:bg-interactive-hover border border-line text-ink-secondary hover:text-ink dark:bg-surface dark:hover:bg-interactive-hover dark:border-line dark:text-ink-muted dark:hover:text-white font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-[0.99] flex items-center justify-center gap-1"
 >
 <Check size={12} />
 <span>Done</span>
 </button>
 </div>
 </div>
 );
}
