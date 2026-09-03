import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Sparkles, ArrowRight, ArrowLeft, Trophy, Home } from 'lucide-react';
import axios from 'axios';

export default function PurchaseTourGuide({ store }) {
 const [hasSuppliers, setHasSuppliers] = useState(true);
 const [isSupplierCreationPath, setIsSupplierCreationPath] = useState(null);
 const [currentStep, setCurrentStep] = useState(0);
 const [coords, setCoords] = useState(null);
 const [isMobile, setIsMobile] = useState(false);

 // Only run if the onboarding step is 'purchase_tour' or 'purchase_congratulations'
 const isVisible = store?.onboarding_step === 'purchase_tour' || store?.onboarding_step === 'purchase_congratulations';

 useEffect(() => {
 if (isVisible) {
 axios.get(route('store.suppliers.search', { store_slug: store?.slug }), { params: { search: '' } })
 .then(res => {
 const list = res.data || [];
 const empty = list.length === 0;
 setHasSuppliers(!empty);
 if (isSupplierCreationPath === null) {
 setIsSupplierCreationPath(empty);
 }
 })
 .catch(err => console.error('Failed to search suppliers:', err));
 }
 }, [isVisible, store?.slug]);

 // Track mobile view
 useEffect(() => {
 const checkMobile = () => setIsMobile(window.innerWidth < 768);
 checkMobile();
 window.addEventListener('resize', checkMobile);
 return () => window.removeEventListener('resize', checkMobile);
 }, []);

 // Get DOM IDs for each step
 const getTargetId = (step) => {
 if (isSupplierCreationPath) {
 switch (step) {
 case 0: return 'tour-purchase-supplier';
 case 1: return 'tour-add-new-party-btn';
 case 2: return 'tour-party-name';
 case 3: return 'tour-party-phone';
 case 4: return 'tour-party-address';
 case 5: return 'tour-party-submit';
 case 6: return 'tour-purchase-product';
 case 7: return 'tour-purchase-quantity';
 case 8: return 'tour-purchase-cost';
 case 9: return 'tour-purchase-paid';
 case 10: return 'tour-purchase-save';
 case 11: return 'tour-new-transaction';
 default: return null;
 }
 } else {
 switch (step) {
 case 0: return 'tour-purchase-supplier';
 case 1: return 'tour-purchase-product';
 case 2: return 'tour-purchase-quantity';
 case 3: return 'tour-purchase-cost';
 case 4: return 'tour-purchase-paid';
 case 5: return 'tour-purchase-save';
 case 6: return 'tour-new-transaction';
 default: return null;
 }
 }
 };

 // Auto-advance logic
 useEffect(() => {
 if (!isVisible) return;

 const interval = setInterval(() => {
 const activeId = document.activeElement?.id;

 if (isSupplierCreationPath) {
 if (currentStep === 0) {
 if (document.getElementById('tour-add-new-party-btn')) setCurrentStep(1);
 } else if (currentStep === 1) {
 if (document.getElementById('tour-party-name')) setCurrentStep(2);
 } else if (currentStep === 2) {
 if (activeId === 'tour-party-phone') setCurrentStep(3);
 } else if (currentStep === 3) {
 if (activeId === 'tour-party-address') setCurrentStep(4);
 } else if (currentStep === 4) {
 if (activeId === 'tour-party-submit') setCurrentStep(5);
 } else if (currentStep === 5) {
 if (!document.getElementById('tour-party-name')) setCurrentStep(6);
 } else if (currentStep === 10) {
 if (document.getElementById('tour-new-transaction')) setCurrentStep(11);
 }
 } else {
 if (currentStep === 5) {
 if (document.getElementById('tour-new-transaction')) setCurrentStep(6);
 }
 }
 }, 150);

 return () => clearInterval(interval);
 }, [currentStep, isVisible, isSupplierCreationPath]);

 // Scroll active element into view and update coordinates
 useEffect(() => {
 if (!isVisible || store?.onboarding_step === 'purchase_congratulations') {
 setCoords(null);
 return;
 }

 const targetId = getTargetId(currentStep);
 if (!targetId) {
 setCoords(null);
 return;
 }

 const updateCoords = () => {
 const el = document.getElementById(targetId);
 if (el) {
 const rect = el.getBoundingClientRect();
 setCoords({
 top: rect.top,
 left: rect.left,
 width: rect.width,
 height: rect.height,
 });
 } else {
 setCoords(null);
 }
 };

 const el = document.getElementById(targetId);
 if (el) {
 el.scrollIntoView({ behavior: 'smooth', block: 'center' });
 }

 const timer = setTimeout(updateCoords, 300);
 window.addEventListener('resize', updateCoords);
 window.addEventListener('scroll', updateCoords, true);

 const interval = setInterval(updateCoords, 80);

 return () => {
 clearTimeout(timer);
 clearInterval(interval);
 window.removeEventListener('resize', updateCoords);
 window.removeEventListener('scroll', updateCoords, true);
 };
 }, [currentStep, isVisible, store?.onboarding_step, isSupplierCreationPath]);

 const handleStartInvoiceTour = () => {
 router.post(
 route('store.onboarding.step', { store_slug: store?.slug }),
 { step: 'invoice_tour_start' },
 {
 onSuccess: () => {
 router.visit(route('store.dashboard', { store_slug: store?.slug }));
 }
 }
 );
 };

 const handleStartPosTour = () => {
 router.post(
 route('store.onboarding.step', { store_slug: store?.slug }),
 { step: 'pos_tour_start' },
 {
 onSuccess: () => {
 router.visit(route('store.dashboard', { store_slug: store?.slug }));
 }
 }
 );
 };

 const handleCompleteTour = () => {
 router.post(
 route('store.onboarding.step', { store_slug: store?.slug }),
 { step: 'completed' },
 {
 onSuccess: () => {
 router.visit(route('store.dashboard', { store_slug: store?.slug }));
 }
 }
 );
 };

 if (!isVisible) return null;

 // Renders the Congratulations Modal at the end of the tour
 if (store?.onboarding_step === 'purchase_congratulations') {
 return (
 <div className="fixed inset-0 z-drawer flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
 <div className="fixed inset-0 bg-neutral-950/65 backdrop-blur-md transition-opacity duration-slow animate-in fade-in"></div>

 <div className="relative w-full max-w-lg mx-auto my-6 px-4 z-drawer animate-in zoom-in-95 duration-slow">
 <div className="relative flex flex-col w-full bg-neutral-900/90 dark:bg-app border border-brand-500/20 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden">
 
 <div className="absolute -top-12 -left-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
 <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

 <div className="p-8 flex flex-col items-center text-center relative z-10">
 <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-glow mb-6 animate-bounce">
 <Trophy className="text-white w-8 h-8" />
 </div>

 <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">
 Stock Added! 🎉
 </h2>

 <p className="text-ink-muted text-sm font-semibold mb-2">
 Your first purchase was recorded successfully!
 </p>

 <p className="text-neutral-300 text-sm leading-relaxed max-w-sm mb-6">
 Congratulations! You have successfully added stock to your store catalog. Now let's try making your first sale to generate an invoice or POS receipt!
 </p>

 <div className="flex flex-col gap-2.5 w-full">
 <button
 onClick={handleStartInvoiceTour}
 className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-brand text-white font-bold rounded-xl shadow-md transition-all duration-normal active:scale-[0.99] cursor-pointer text-sm"
 >
 <span>Create B2B Invoice</span>
 </button>
 <button
 onClick={handleStartPosTour}
 className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transition-all duration-normal active:scale-[0.99] cursor-pointer text-sm"
 >
 <span>Go to POS Register</span>
 </button>
 <button
 onClick={handleCompleteTour}
 className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-neutral-800 hover:bg-interactive-hover text-neutral-300 hover:text-white font-bold rounded-xl border border-neutral-700/60 transition-all duration-normal active:scale-[0.99] cursor-pointer text-xs mt-1"
 >
 <span>Skip & Finish Setup</span>
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
 }

 const getTooltipStyle = () => {
 if (!coords) return { display: 'none' };

 if (isMobile) {
 return {
 position: 'fixed',
 bottom: '20px',
 left: '50%',
 transform: 'translateX(-50%)',
 width: 'calc(100% - 32px)',
 maxWidth: '360px',
 zIndex: 115,
 };
 }

 const spaceOnRight = window.innerWidth - (coords.left + coords.width);
 const spaceOnLeft = coords.left;

 if (spaceOnRight > 340) {
 return {
 position: 'fixed',
 top: coords.top + (coords.height / 2) - 80,
 left: coords.left + coords.width + 20,
 width: '320px',
 zIndex: 115,
 };
 } else if (spaceOnLeft > 340) {
 return {
 position: 'fixed',
 top: coords.top + (coords.height / 2) - 80,
 left: coords.left - 340,
 width: '320px',
 zIndex: 115,
 };
 } else {
 return {
 position: 'fixed',
 top: coords.top + coords.height + 20,
 left: coords.left + (coords.width / 2) - 160,
 width: '320px',
 zIndex: 115,
 };
 }
 };

 return (
 <div className="fixed inset-0 z-drawer overflow-hidden pointer-events-none">
 {/* Dimming Mask / Spotlight */}
 {coords && (
 <div
 className="fixed pointer-events-none transition-all duration-fast ease-out"
 style={{
 top: coords.top - 6,
 left: coords.left - 6,
 width: coords.width + 12,
 height: coords.height + 12,
 borderRadius: '12px',
 boxShadow: '0 0 0 9999px rgba(3, 7, 18, 0.75), 0 0 15px 5px rgba(99, 102, 241, 0.4), 0 0 0 2px rgb(99, 102, 241)',
 zIndex: 110,
 }}
 />
 )}

 {!coords && (
 <div className="fixed inset-0 bg-neutral-950/75 pointer-events-auto z-drawer"></div>
 )}

 {/* Floating Tooltip */}
 <div
 style={getTooltipStyle()}
 className="bg-neutral-900/95 dark:bg-app border border-brand-500/30 rounded-2xl shadow-[0_15px_40px_rgba(99,102,241,0.2)] p-6 pointer-events-auto relative z-drawer animate-in fade-in duration-slow"
 >
 <div className="flex items-start gap-3 mb-3">
 <div className="p-2 bg-brand-500/10 rounded-lg text-brand-400 shrink-0">
 <Sparkles size={20} className="animate-pulse" />
 </div>
 <div>
 <h4 className="text-sm font-bold text-white uppercase tracking-wider">
 Purchase Tour
 </h4>
 <span className="text-2xs font-semibold text-brand-400">
 Step {currentStep + 1} of {isSupplierCreationPath ? 12 : 7}
 </span>
 </div>
 </div>

 <div className="space-y-4">
 {isSupplierCreationPath ? (
 <>
 {currentStep === 0 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 You don't have any suppliers yet! Click on the <span className="text-white font-bold">Search Party</span> input.
 </p>
 )}
 {currentStep === 1 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Now click <span className="text-white font-bold">+ Create New Party</span> at the bottom of the dropdown.
 </p>
 )}
 {currentStep === 2 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Put in the supplier's <span className="text-white font-bold">Name</span> inside the modal.
 </p>
 )}
 {currentStep === 3 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Put in their <span className="text-white font-bold">Phone Number</span>.
 </p>
 )}
 {currentStep === 4 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Put in their <span className="text-white font-bold">Address</span>.
 </p>
 )}
 {currentStep === 5 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Click <span className="text-white font-bold">Create Supplier</span> to save the supplier.
 </p>
 )}
 {currentStep === 6 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Great! Now move toward the <span className="text-white font-bold">Search Product</span> option and select the previously created product.
 </p>
 )}
 {currentStep === 7 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Set the <span className="text-white font-bold">Quantity</span> of items purchased.
 </p>
 )}
 {currentStep === 8 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Verify the purchase <span className="text-white font-bold">Unit Price</span>.
 </p>
 )}
 {currentStep === 9 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Enter the <span className="text-white font-bold">Amount Paid</span> (leave as 0 if on credit).
 </p>
 )}
 {currentStep === 10 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Click <span className="text-white font-bold">Complete Purchase</span> to save the transaction.
 </p>
 )}
 {currentStep === 11 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Click <span className="text-white font-bold">NEW TRANSACTION</span> to continue your setup.
 </p>
 )}
 </>
 ) : (
 <>
 {currentStep === 0 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Select a <span className="text-white font-bold">Supplier</span> you are purchasing from.
 </p>
 )}
 {currentStep === 1 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Search and select the <span className="text-white font-bold">Product</span> you created.
 </p>
 )}
 {currentStep === 2 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Set the <span className="text-white font-bold">Quantity</span> of items purchased.
 </p>
 )}
 {currentStep === 3 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Verify the purchase <span className="text-white font-bold">Unit Price</span>.
 </p>
 )}
 {currentStep === 4 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Enter the <span className="text-white font-bold">Amount Paid</span>.
 </p>
 )}
 {currentStep === 5 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Click <span className="text-white font-bold">Complete Purchase</span> to save the transaction.
 </p>
 )}
 {currentStep === 6 && (
 <p className="text-xs text-neutral-300 leading-relaxed font-medium">
 Click <span className="text-white font-bold">NEW TRANSACTION</span> to continue your setup.
 </p>
 )}
 </>
 )}

 <div className="flex gap-2 justify-between items-center">
 {currentStep > 0 ? (
 <button
 onClick={() => setCurrentStep(currentStep - 1)}
 className="px-3 py-1.5 bg-neutral-800 text-ink-muted hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
 >
 <ArrowLeft size={12} />
 <span>Back</span>
 </button>
 ) : (
 <div />
 )}

 {currentStep < (isSupplierCreationPath ? 11 : 6) && (
 <button
 onClick={() => setCurrentStep(currentStep + 1)}
 className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
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
