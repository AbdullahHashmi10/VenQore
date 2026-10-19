import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { router, usePage } from '@inertiajs/react';
import { Sparkles, ArrowRight, ArrowLeft, Box, HelpCircle, Trophy, Home, Plus, Upload, Minimize2 } from 'lucide-react';
import { useTermText } from '@/lib/terms';

export default function ProductTourGuide({ isModalOpen, store, categories = [] }) {
 const tt = useTermText();
 const { onboarding_metrics, modules } = usePage().props;
 const hasPreSales = !Array.isArray(modules) || modules.includes('pre_sales');
 const isEarlyOnboarding = !store?.onboarding_completed && !onboarding_metrics?.has_products;
 const isVisible = ['inventory_tour', 'sidebar_stock', 'congratulations', 'inventory_tour_more'].includes(store?.onboarding_step)
  || isEarlyOnboarding;
 const [isCategoryCreationPath, setIsCategoryCreationPath] = useState(() => categories.length === 0);
 const [currentStep, setCurrentStep] = useState(0);
 const [isMinimized, setIsMinimized] = useState(() => {
 return sessionStorage.getItem('amd_onboarding_minimized') === 'true';
 });

 const toggleMinimized = (val) => {
 setIsMinimized(val);
 sessionStorage.setItem('amd_onboarding_minimized', val ? 'true' : 'false');
 };
 const [coords, setCoords] = useState(null);
 const [isMobile, setIsMobile] = useState(false);
 const [liveMargin, setLiveMargin] = useState(null);
 const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
 const [isDropdownOpen, setIsDropdownOpen] = useState(false);
 const tourSteps = useMemo(() => {
  const steps = [
   { key: 'add_product', getTargetId: () => 'tour-add-product', title: tt('Create Product') },
   { key: 'name', getTargetId: () => 'tour-product-name', title: tt('Product Guide') },
   { key: 'sku', getTargetId: () => 'tour-product-sku-gen', title: tt('Product Guide') },
  ];

  if (isCategoryCreationPath) {
   steps.push(
    { 
     key: 'category_trigger', 
     getTargetId: () => (document.getElementById('tour-new-category-name') ? 'tour-new-category-name' : 'tour-product-category'), 
     title: tt('Product Guide') 
    },
    { key: 'create_category_btn', getTargetId: () => 'tour-add-new-category-btn', title: tt('Product Guide') },
    { key: 'create_category_input', getTargetId: () => 'tour-new-category-name', title: tt('Product Guide') },
   );
  } else {
   steps.push(
    { 
     key: 'category', 
     getTargetId: () => (document.getElementById('tour-new-category-name') ? 'tour-new-category-name' : 'tour-product-category'), 
     title: tt('Product Guide') 
    }
   );
  }

  steps.push(
   { key: 'cost', getTargetId: () => 'tour-product-cost', title: tt('Product Guide') },
   { key: 'price', getTargetId: () => 'tour-product-price', title: tt('Product Guide') },
   { 
    key: 'barcode', 
    getTargetId: () => (document.getElementById('tour-barcode-modal') ? 'tour-barcode-modal' : 'tour-product-barcode'), 
    title: isBarcodeModalOpen ? tt('Add Barcode') : tt('Barcodes (Optional)') 
   }
  );

  if (hasPreSales) {
   steps.push({ key: 'reservations', getTargetId: () => 'tour-tab-reservations', title: tt('Product Guide') });
  }

  steps.push(
   { key: 'extra', getTargetId: () => 'tour-tab-extra', title: tt('Product Guide') },
   { key: 'save', getTargetId: () => 'tour-product-save', title: tt('Product Guide') }
  );

  return steps;
 }, [isCategoryCreationPath, hasPreSales, isBarcodeModalOpen, tt]);

 const currentStepData = tourSteps[currentStep] || tourSteps[0];
 const isBarcodeStep = currentStepData?.key === 'barcode';

 const renderPortal = (content) => {
 if (typeof document === 'undefined') return null;
 return createPortal(content, document.body);
 };

 // Track step transitions based on modal open state
 useEffect(() => {
 if (isModalOpen && currentStep === 0) {
 setCurrentStep(1);
 } else if (!isModalOpen && currentStep > 0) {
 setCurrentStep(0);
 }
 }, [isModalOpen]);

 // If arriving on inventory page during onboarding, promote step to inventory_tour
 useEffect(() => {
  if (store?.slug && !store?.onboarding_completed && isEarlyOnboarding) {
   if (store?.onboarding_step !== 'inventory_tour' && store?.onboarding_step !== 'congratulations' && store?.onboarding_step !== 'inventory_tour_more') {
    router.post(
     route('store.onboarding.step', { store_slug: store.slug }),
     { step: 'inventory_tour' },
     { preserveScroll: true }
    );
   }
  }
 }, [store?.slug, store?.onboarding_step, store?.onboarding_completed, isEarlyOnboarding]);

 // Track mobile view
 useEffect(() => {
 const checkMobile = () => setIsMobile(window.innerWidth < 768);
 checkMobile();
 window.addEventListener('resize', checkMobile);
 return () => window.removeEventListener('resize', checkMobile);
 }, []);

 // Track barcode sub-modal visibility
 useEffect(() => {
 if (!isBarcodeStep) {
 setIsBarcodeModalOpen(false);
 return;
 }
 const checkBarcodeModal = () => {
 const modalEl = document.getElementById('tour-barcode-modal');
 const isOpen = !!(modalEl && modalEl.getBoundingClientRect().width > 0);
 setIsBarcodeModalOpen(isOpen);
 };
 checkBarcodeModal();
 const interval = setInterval(checkBarcodeModal, 80);
 return () => clearInterval(interval);
 }, [isBarcodeStep]);

 // Track open dropdowns (e.g. Category select)
 useEffect(() => {
 const checkDropdown = () => {
 const dropdownPortal = document.querySelector('[data-premium-select-portal="open"]');
 const isOpen = !!(dropdownPortal && dropdownPortal.getBoundingClientRect().height > 0);
 setIsDropdownOpen(prev => prev !== isOpen ? isOpen : prev);
 };
 checkDropdown();
 const interval = setInterval(checkDropdown, 80);
 return () => clearInterval(interval);
 }, []);

 // Get DOM IDs for each step
 const getTargetId = (stepIndex) => {
  const step = tourSteps[stepIndex];
  return step ? step.getTargetId() : null;
 };

 // Auto-advance logic
 useEffect(() => {
 if (!isCategoryCreationPath) return;

 const interval = setInterval(() => {
  const activeId = document.activeElement?.id;
  const key = tourSteps[currentStep]?.key;

  if (key === 'category_trigger') {
   if (document.getElementById('tour-add-new-category-btn')) {
    const nextIdx = tourSteps.findIndex(s => s.key === 'create_category_btn');
    if (nextIdx !== -1) setCurrentStep(nextIdx);
   }
  } else if (key === 'create_category_btn') {
   if (document.getElementById('tour-new-category-name')) {
    const nextIdx = tourSteps.findIndex(s => s.key === 'create_category_input');
    if (nextIdx !== -1) setCurrentStep(nextIdx);
   }
  } else if (key === 'create_category_input') {
   if (activeId === 'tour-product-cost') {
    const nextIdx = tourSteps.findIndex(s => s.key === 'cost');
    if (nextIdx !== -1) setCurrentStep(nextIdx);
   }
  }
 }, 150);

 return () => clearInterval(interval);
 }, [currentStep, isCategoryCreationPath, tourSteps]);

 // Scroll active element into view and update coordinates
 useEffect(() => {
 const getVisibleElement = (id) => {
 const elements = document.querySelectorAll(`[id="${id}"]`);
 for (let i = 0; i < elements.length; i++) {
 const el = elements[i];
 const rect = el.getBoundingClientRect();
 if (rect.width > 0 && rect.height > 0) {
 return el;
 }
 }
 return elements[0] || null;
 };

 const updateCoords = () => {
 const activeTargetId = getTargetId(currentStep);
 if (!activeTargetId) {
 setCoords(null);
 return;
 }
 const el = getVisibleElement(activeTargetId);
 if (el) {
 const rect = el.getBoundingClientRect();

 let finalTop = rect.top;
 let finalLeft = rect.left;
 let finalWidth = rect.width;
 let finalHeight = rect.height;

 const dropdownPortal = document.querySelector('[data-premium-select-portal="open"]');
 if (dropdownPortal) {
 const dropRect = dropdownPortal.getBoundingClientRect();
 if (dropRect.width > 0 && dropRect.height > 0) {
 const isAligned = Math.abs(dropRect.left - rect.left) < 60 
 || (dropRect.left >= rect.left - 40 && dropRect.right <= rect.right + 40);
 if (isAligned) {
 const top = Math.min(rect.top, dropRect.top);
 const left = Math.min(rect.left, dropRect.left);
 const right = Math.max(rect.right, dropRect.right);
 const bottom = Math.max(rect.bottom, dropRect.bottom);
 finalTop = top;
 finalLeft = left;
 finalWidth = right - left;
 finalHeight = bottom - top;
 }
 }
 }

 setCoords(prev => {
 if (prev && 
 prev.top === finalTop && 
 prev.left === finalLeft && 
 prev.width === finalWidth && 
 prev.height === finalHeight) {
 return prev; // No change, skip state update to prevent infinite re-renders
 }
 return {
 top: finalTop,
 left: finalLeft,
 width: finalWidth,
 height: finalHeight,
 };
 });
 } else {
 setCoords(null);
 }
 };

 const initialTargetId = getTargetId(currentStep);
 const el = initialTargetId ? getVisibleElement(initialTargetId) : null;
 if (el && currentStep > 0 && initialTargetId !== 'tour-barcode-modal') {
 el.scrollIntoView({ behavior: 'smooth', block: 'center' });
 }

 const timer = setTimeout(updateCoords, 100);
 window.addEventListener('resize', updateCoords);
 
 const modalContainer = document.querySelector('.overflow-y-auto');
 if (modalContainer) {
 modalContainer.addEventListener('scroll', updateCoords, true);
 }

 const interval = setInterval(updateCoords, 80);

 return () => {
 clearTimeout(timer);
 clearInterval(interval);
 window.removeEventListener('resize', updateCoords);
 if (modalContainer) {
 modalContainer.removeEventListener('scroll', updateCoords, true);
 }
 };
 }, [currentStep, isModalOpen, isCategoryCreationPath, isBarcodeModalOpen, isDropdownOpen, tourSteps]);

 // Live margin checker effect (Steps 4 & 5)
 useEffect(() => {
 if (currentStepData?.key !== 'cost' && currentStepData?.key !== 'price') return;

 const checkMargin = () => {
 const costEl = document.getElementById('tour-product-cost');
 const priceEl = document.getElementById('tour-product-price');
 
 if (costEl && priceEl) {
 const cost = parseFloat(costEl.value) || 0;
 const price = parseFloat(priceEl.value) || 0;
 if (price > 0 && cost > 0) {
 const margin = Math.round(((price - cost) / price) * 100);
 setLiveMargin({ cost, price, margin });
 } else {
 setLiveMargin(null);
 }
 }
 };

 const interval = setInterval(checkMargin, 150);
 return () => clearInterval(interval);
 }, [currentStepData?.key]);

 const handleMakeMore = () => {
 router.post(
 route('store.onboarding.step', { store_slug: store?.slug }),
 { step: 'inventory_tour_more' },
 { preserveScroll: true }
 );
 };

 const handleGoToDashboard = () => {
 router.post(
 route('store.onboarding.step', { store_slug: store?.slug }),
 { step: 'purchase_tour_start' },
 {
 preserveScroll: true,
 onSuccess: () => {
 router.visit(route('store.dashboard', { store_slug: store?.slug }));
 }
 }
 );
 };

 const handleUpdateStep = (stepValue) => {
 router.post(
 route('store.onboarding.step', { store_slug: store?.slug }),
 { step: stepValue },
 { preserveScroll: true }
 );
 };

 if (store?.is_demo || !isVisible) return null;

 if (store?.onboarding_step === 'inventory_tour_more') {
 if (isMinimized) {
 // Minimized Floating Progress Widget (Pie Chart / Ring)
 const circumference = 2 * Math.PI * 18;
 const progressOffset = circumference * (1 - 0.33); // 33% progress (Phase 1 of 3 complete)

 return (
 <div 
 onClick={() => toggleMinimized(false)}
 title="Onboarding Active: Cataloging Mode (33% Complete). Click to expand."
 className="fixed bottom-24 right-6 z-[10000050] w-14 h-14 bg-surface border border-line rounded-full shadow-xl backdrop-blur-md flex items-center justify-center cursor-pointer pointer-events-auto active:scale-95 hover:border-teal-400 transition-all duration-slow group"
 >
 <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 44 44">
 {/* Background Ring */}
 <circle
 className="text-line"
 strokeWidth="3.5"
 stroke="currentColor"
 fill="transparent"
 r="18"
 cx="22"
 cy="22"
 />
 {/* Progress Segment */}
 <circle
 className="text-accent-text transition-all duration-slower ease-out"
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
 {/* Inner Icon */}
 <div className="relative z-10 text-accent-text group-hover:text-ink transition-colors duration-normal">
 <Sparkles size={18} className="animate-pulse" />
 </div>
 {/* Small badge */}
 <span className="absolute -top-1 -right-1 bg-accent-fill text-accent-on text-4xs font-bold px-1.5 py-0.5 rounded-full shadow">
 33%
 </span>
 </div>
 );
 }

 // Expanded Glassmorphic Banner/Card
 return (
 <div className="fixed bottom-24 right-6 z-[10000050] max-w-sm w-full bg-surface border border-line text-ink rounded-2xl shadow-2xl p-5 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-slow pointer-events-auto">
 {/* Minimize Button */}
 <button 
 onClick={() => toggleMinimized(true)}
 className="absolute top-4 right-4 p-1.5 rounded-lg bg-sunken hover:bg-interactive-hover text-ink-muted hover:text-ink transition-colors border border-line"
 title="Minimize to widget"
 >
 <Minimize2 size={12} />
 </button>

 <div className="flex items-start gap-3 mb-3">
 <div className="p-2 bg-accent-quiet text-accent-text rounded-lg shrink-0">
 <Sparkles size={20} className="animate-pulse" />
 </div>
 <div>
 <h4 className="text-sm font-bold text-ink uppercase tracking-wider">Onboarding Active</h4>
 <p className="text-2xs text-accent-text font-semibold uppercase tracking-wide">Cataloging Mode (33%)</p>
 </div>
 </div>
 <p className="text-xs text-ink-secondary leading-relaxed font-medium mb-4 pr-6">
 You can add as many products as you like. When you are done cataloging, click below to proceed or load products in bulk.
 </p>
 <div className="flex flex-col gap-2">
 <button
 onClick={handleGoToDashboard}
 className="w-full py-2.5 px-3 bg-accent-fill hover:bg-accent-fill-hover text-accent-on font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.99]"
 >
 <span>Proceed to Buy Stock</span>
 <ArrowRight size={12} />
 </button>
 <button
 onClick={() => handleUpdateStep('completed')}
 className="w-full py-2.5 px-3 bg-sunken hover:bg-interactive-hover border border-line text-ink-secondary hover:text-ink font-semibold rounded-xl text-xs transition-all cursor-pointer active:scale-[0.99]"
 >
 Exit Tour
 </button>
 </div>
 </div>
 );
 }

 if (store?.onboarding_step === 'congratulations') {
 return renderPortal(
 <div className="fixed inset-0 z-[10000200] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
 <div className="fixed inset-0 bg-neutral-950/65 backdrop-blur-md transition-opacity duration-slow animate-in fade-in"></div>

 <div className="relative w-full max-w-lg mx-auto my-6 px-4 z-[10000201] animate-in zoom-in-95 duration-slow">
 <div className="relative flex flex-col w-full bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-ink">
 
 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 pointer-events-none opacity-40 dark:opacity-20" style={{ background: 'radial-gradient(ellipse at 50% -20%, #23C4A6 0%, transparent 70%)' }}></div>

 <div className="flex flex-col items-center text-center relative z-10">
 <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mb-5 shadow-sm">
 <Trophy size={28} className="animate-bounce" />
 </div>

 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-quiet text-accent-text border border-teal-200/50 dark:border-teal-800/50 mb-3">
 First Step Complete
 </span>

 <h2 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight mb-2">
 Congratulations! 🎉
 </h2>

 <p className="text-sm font-semibold text-accent-text mb-2">
 {tt('You have successfully created your first product!')}
 </p>

 <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-sm mb-8">
 Great job setting up your initial catalog! Now you can either return to the dashboard to record purchases/stock or create more items.
 </p>

 <div className="flex flex-col gap-3 w-full">
 <button
 onClick={handleGoToDashboard}
 className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-accent-fill hover:bg-accent-fill-hover text-accent-on font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer text-sm"
 >
 <Home size={16} />
 <span>Next: Go to Dashboard</span>
 </button>

 <button
 onClick={handleMakeMore}
 className="w-full py-3 px-5 bg-sunken hover:bg-interactive-hover text-ink-secondary hover:text-ink font-semibold rounded-xl border border-line transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
 >
 <Plus size={16} />
 <span>{tt('Make More Products')}</span>
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
 }

 const renderBarcodeContent = () => {
 if (isBarcodeModalOpen) {
 return (
 <div className="space-y-2">
 <p className="text-xs text-ink-secondary leading-relaxed font-medium">
 Enter or scan your <span className="text-ink font-bold">Barcode Number</span> (e.g. 1234567890123) and select the barcode type.
 </p>
 <p className="text-xs text-ink-secondary leading-relaxed font-medium">
 Optionally check <span className="text-ink font-bold">Set as Primary</span>. Click <span className="text-ink font-bold">Add Barcode</span> to save, or <span className="text-ink font-bold">Cancel</span> to discard.
 </p>
 <div className="p-2 rounded-xl bg-sunken border border-line text-2xs text-ink-muted">
 Tip: You can also click <span className="font-semibold text-ink">Next</span> below to close this modal and proceed.
 </div>
 </div>
 );
 }
 return (
 <div className="space-y-2">
 <p className="text-xs text-ink-secondary leading-relaxed font-medium">
 In the <span className="text-ink font-bold">Barcodes</span> section, you can add barcode tags for scanner lookup.
 </p>
 <div className="p-2.5 rounded-xl bg-sunken border border-line">
 <span className="text-2xs font-bold uppercase tracking-wider text-accent-text block mb-1">Optional Step</span>
 <p className="text-xs text-ink-secondary">
 Adding a barcode is <span className="text-ink font-semibold">completely optional</span>. Click <span className="text-ink font-bold">+ Add Barcode</span> to enter one now, or click <span className="text-ink font-bold">Next</span> to proceed without barcodes.
 </p>
 </div>
 </div>
 );
 };

 const getTooltipStyle = () => {
 if (!coords) {
 return {
 position: 'fixed',
 top: '50%',
 left: '50%',
 transform: 'translate(-50%, -50%)',
 width: 'calc(100% - 32px)',
 maxWidth: '360px',
 zIndex: 10000110,
 };
 }

 if (isMobile) {
 return {
 position: 'fixed',
 bottom: '20px',
 left: '50%',
 transform: 'translateX(-50%)',
 width: 'calc(100% - 32px)',
 maxWidth: '360px',
 zIndex: 10000110,
 };
 }

 const spaceOnRight = window.innerWidth - (coords.left + coords.width);
 const spaceOnLeft = coords.left;

 if (spaceOnRight >= 300) {
 return {
 position: 'fixed',
 top: Math.max(16, Math.min(window.innerHeight - 300, coords.top + (coords.height / 2) - 80)),
 left: coords.left + coords.width + 16,
 width: Math.min(320, spaceOnRight - 24),
 zIndex: 10000110,
 };
 } else if (spaceOnLeft >= 300) {
 return {
 position: 'fixed',
 top: Math.max(16, Math.min(window.innerHeight - 300, coords.top + (coords.height / 2) - 80)),
 left: Math.max(16, coords.left - Math.min(320, spaceOnLeft - 24) - 16),
 width: Math.min(320, spaceOnLeft - 24),
 zIndex: 10000110,
 };
 } else {
 const placeAbove = coords.top > 260;
 const topPos = placeAbove ? coords.top - 240 : coords.top + coords.height + 16;
 const leftPos = Math.max(16, Math.min(window.innerWidth - 336, coords.left + (coords.width / 2) - 160));
 return {
 position: 'fixed',
 top: Math.max(16, Math.min(window.innerHeight - 260, topPos)),
 left: leftPos,
 width: '320px',
 zIndex: 10000110,
 };
 }
 };

 return renderPortal(
 <div className="fixed inset-0 z-[10000100] overflow-hidden pointer-events-none">
 {/* Dimming Mask / Spotlight */}
 {coords && (
 <div
 className="fixed pointer-events-none transition-all duration-fast ease-out"
 style={{
 top: coords.top - 6,
 left: coords.left - 6,
 width: coords.width + 12,
 height: coords.height + 12,
 borderRadius: currentStep === 0 ? '8px' : (isBarcodeModalOpen ? '20px' : (isDropdownOpen ? '16px' : '12px')),
 boxShadow: '0 0 0 9999px rgba(6, 16, 13, 0.72)',
 border: '2px solid rgba(45, 212, 191, 0.45)',
 zIndex: 10000105,
 }}
 />
 )}

 {!coords && (
 <div className="fixed inset-0 bg-[#06100D]/70 pointer-events-none z-[10000100]"></div>
 )}

 {/* Floating Tooltip */}
 <div
 style={getTooltipStyle()}
 className="bg-surface border border-line rounded-2xl shadow-2xl p-5 text-ink pointer-events-auto relative z-[10000110] animate-in fade-in duration-slow"
 >
 {/* Content */}
 <div className="flex items-start gap-3 mb-3">
 <div className="p-2 bg-accent-quiet text-accent-text border border-teal-200/50 dark:border-teal-800/50 rounded-lg shrink-0">
 <Sparkles size={18} className="animate-pulse" />
 </div>
 <div>
 <h4 className="text-sm font-bold text-ink uppercase tracking-wider">
 {currentStepData?.title || tt('Product Guide')}
 </h4>
 <span className="text-2xs font-semibold text-accent-text">
 Step {currentStep + 1} of {tourSteps.length}{isBarcodeStep && isBarcodeModalOpen && ' • Barcode Modal'}
 </span>
 </div>
 </div>

 <div className="space-y-4">
 {currentStepData?.key === 'add_product' && (
 <p className="text-xs text-ink-secondary leading-relaxed font-medium">
 Let's add your first product. Click on the highlighted <span className="text-ink font-bold">{tt('Add Product')}</span> button to open the product creator form.
 </p>
 )}
 {currentStepData?.key === 'name' && (
 <p className="text-xs text-ink-secondary leading-relaxed font-medium">
 Type a <span className="text-ink font-bold">Product Name</span> here.
 </p>
 )}
 {currentStepData?.key === 'sku' && (
 <p className="text-xs text-ink-secondary leading-relaxed font-medium">
 Type a custom product code in the <span className="text-ink font-bold">SKU</span> box, or auto-generate one.
 </p>
 )}
 {currentStepData?.key === 'category_trigger' && (
 <p className="text-xs text-ink-secondary leading-relaxed font-medium">
 You don't have any categories yet! Click on the <span className="text-ink font-bold">Category</span> selection box.
 </p>
 )}
 {currentStepData?.key === 'create_category_btn' && (
 <p className="text-xs text-ink-secondary leading-relaxed font-medium">
 Click <span className="text-ink font-bold">+ Create New Category</span> at the bottom of the dropdown list.
 </p>
 )}
 {currentStepData?.key === 'create_category_input' && (
 <p className="text-xs text-ink-secondary leading-relaxed font-medium">
 Type a name for your new category (e.g. <span className="text-ink font-bold">Beverages</span>) to create it inline.
 </p>
 )}
 {currentStepData?.key === 'category' && (
 <div className="space-y-2">
 {document.getElementById('tour-new-category-name') ? (
 <>
 <p className="text-xs text-ink-secondary leading-relaxed font-medium">
 Type a name for your new category (e.g. <span className="text-ink font-bold">Beverages</span>).
 </p>
 <div className="p-2 rounded-xl bg-sunken border border-line text-2xs text-ink-muted">
 Click <span className="font-semibold text-ink">Next</span> when done to proceed to pricing.
 </div>
 </>
 ) : isDropdownOpen ? (
 <>
 <p className="text-xs text-ink-secondary leading-relaxed font-medium">
 Choose a category from the list below, or click <span className="text-ink font-bold">+ Create New Category</span> at the bottom.
 </p>
 <div className="p-2 rounded-xl bg-sunken border border-line text-2xs text-ink-muted">
 Tip: Both the selector and category options are highlighted together. Click any category to select it.
 </div>
 </>
 ) : (
 <p className="text-xs text-ink-secondary leading-relaxed font-medium">
 Select a <span className="text-ink font-bold">Category</span>. Click the selection box to open your category options.
 </p>
 )}
 </div>
 )}
 {currentStepData?.key === 'cost' && (
 <p className="text-xs text-ink-secondary leading-relaxed font-medium">
 Set your <span className="text-ink font-bold">Cost Price</span>.
 </p>
 )}
 {currentStepData?.key === 'price' && (
 <div className="space-y-2">
 <p className="text-xs text-ink-secondary leading-relaxed font-medium">
 Set your <span className="text-ink font-bold">Selling Price</span>.
 </p>
 {liveMargin ? (
 <div className="p-2.5 rounded-xl bg-sunken border border-line">
 <p className="text-2xs font-bold text-ink-muted uppercase tracking-wider">Live Profit Analysis</p>
 <p className="text-xs font-bold text-ink mt-0.5">
 Margin: <span className={liveMargin.margin >= 30 ? 'text-emerald-400' : 'text-amber-400'}>{liveMargin.margin}%</span>
 </p>
 </div>
 ) : null}
 </div>
 )}
 {currentStepData?.key === 'barcode' && renderBarcodeContent()}
 {currentStepData?.key === 'reservations' && (
 <p className="text-xs text-ink-secondary leading-relaxed font-medium">
 The <span className="text-ink font-bold">Reservations</span> tab tracks stock quantities currently held for unpaid invoices.
 </p>
 )}
 {currentStepData?.key === 'extra' && (
 <p className="text-xs text-ink-secondary leading-relaxed font-medium">
 The <span className="text-ink font-bold">Extra</span> tab handles additional details like images and descriptions.
 </p>
 )}
 {currentStepData?.key === 'save' && (
 <p className="text-xs text-ink-secondary leading-relaxed font-medium">
 All done! Click <span className="text-ink font-bold">Save Changes</span> to create your product and finalize the setup tour.
 </p>
 )}

 {/* Navigation Buttons */}
 <div className="flex gap-2 justify-between items-center">
 {currentStep > 0 ? (
 <button
 onClick={() => {
 if (isBarcodeStep && isBarcodeModalOpen) {
 document.getElementById('tour-barcode-close-btn')?.click();
 return;
 }

 const prevStep = tourSteps[currentStep - 1];
 if (currentStepData?.key === 'save') {
 document.getElementById('tour-tab-extra')?.click();
 } else if (currentStepData?.key === 'extra') {
 if (prevStep?.key === 'reservations') {
 document.getElementById('tour-tab-reservations')?.click();
 } else {
 document.getElementById('tour-tab-details')?.click();
 }
 } else if (currentStepData?.key === 'reservations') {
 document.getElementById('tour-tab-details')?.click();
 }

 setCurrentStep(currentStep - 1);
 }}
 className="px-3 py-1.5 bg-sunken hover:bg-interactive-hover border border-line text-ink-secondary hover:text-ink rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
 >
 <ArrowLeft size={12} />
 <span>Back</span>
 </button>
 ) : (
 <div /> // Spacer
 )}

 {currentStep > 0 && currentStep < tourSteps.length - 1 && (
 <button
 onClick={() => {
 if (isBarcodeStep && isBarcodeModalOpen) {
 document.getElementById('tour-barcode-close-btn')?.click();
 }

 const nextStep = tourSteps[currentStep + 1];
 if (nextStep?.key === 'reservations') {
 document.getElementById('tour-tab-reservations')?.click();
 } else if (nextStep?.key === 'extra') {
 document.getElementById('tour-tab-extra')?.click();
 } else if (nextStep?.key === 'save') {
 document.getElementById('tour-tab-details')?.click();
 }

 setCurrentStep(currentStep + 1);
 }}
 className="px-4 py-1.5 bg-accent-fill hover:bg-accent-fill-hover text-accent-on rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 transition-all cursor-pointer"
 >
 <span>Next</span>
 <ArrowRight size={12} />
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
