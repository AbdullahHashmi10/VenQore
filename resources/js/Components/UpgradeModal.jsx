import React, { useState, useEffect } from 'react';
import { Zap, X, Check, ArrowRight, Crown, Sparkles, Lock } from 'lucide-react';
import Modal from '@/Components/Modal';
import { usePage } from '@inertiajs/react';

/**
 * UpgradeModal — Phase 4.4 Frontend
 *
 * Global modal shown when the backend throws a PlanLimitException (403 plan_limit).
 * Triggered by the axios interceptor in bootstrap.js via the custom event:
 *   window.dispatchEvent(new CustomEvent('amd:plan-limit', { detail: { ... } }))
 *
 * Design: Premium dark glassmorphism — matches the VenQore aesthetic.
 * Shows: current plan, what the user hit, what they unlock by upgrading.
 *
 * Usage (auto-mounted in OneGlanceLayout — no manual import needed):
 *   Just import and render <UpgradeModal /> once in the layout.
 *
 * Manual trigger (optional):
 *   window.dispatchEvent(new CustomEvent('amd:plan-limit', {
 *       detail: { feature: 'sku_limit', message: '...', current_plan: 'starter' }
 *   }));
 */
export default function UpgradeModal() {
    const [isOpen, setIsOpen]       = useState(false);
    const [feature, setFeature]     = useState(null);
    const [message, setMessage]         = useState('');
    const [currentPlan, setCurrentPlan] = useState('starter');
    const [upgradeUrl, setUpgradeUrl]   = useState('#');
    const [billingUrl, setBillingUrl]   = useState('#');
    const [portalUrl, setPortalUrl]     = useState('#');

    const { flash } = usePage().props;

    useEffect(() => {
        const handlePlanLimit = (e) => {
            const detail = e.detail || {};
            setFeature(detail.feature || 'limit');
            setMessage(detail.message || "You've reached the limit for your current plan.");
            setCurrentPlan(detail.current_plan || 'starter');
            setUpgradeUrl(detail.upgrade_url || '#');
            setBillingUrl(detail.billing_url || '#');
            setPortalUrl(detail.portal_url || '#');
            setIsOpen(true);
        };

        window.addEventListener('amd:plan-limit', handlePlanLimit);
        return () => window.removeEventListener('amd:plan-limit', handlePlanLimit);
    }, []);

    useEffect(() => {
        if (flash?.plan_limit) {
            const detail = flash.plan_limit;
            setFeature(detail.feature || 'limit');
            setMessage(detail.message || "You've reached the limit for your current plan.");
            setCurrentPlan(detail.current_plan || 'starter');
            setUpgradeUrl(detail.upgrade_url || '#');
            setBillingUrl(detail.billing_url || '#');
            setPortalUrl(detail.portal_url || '#');
            setIsOpen(true);
        }
    }, [flash?.plan_limit]);

    const planPerks = {
        growth: [
            'Unlimited products (SKUs)',
            'Up to 10 staff accounts',
            'Up to 3 warehouse locations',
            'WooCommerce integration',
            'Growth Engine (AI retention)',
            'Advanced reports',
            'Multi-branch support',
        ],
        business: [
            'Everything in Growth',
            'Unlimited staff accounts',
            'Unlimited warehouse locations',
            'Public REST API access',
            'Priority support',
            'White-label ready',
        ],
    };

    const upgradeTo = (currentPlan === 'starter' || currentPlan === 'ltd_1') ? 'growth'
                     : (currentPlan === 'growth'  || currentPlan === 'ltd_2') ? 'business'
                     : 'business';
    const upgradePerks = planPerks[upgradeTo] || planPerks.growth;

    // LTD-specific logic: show AppSumo stacking CTA instead of subscription CTA
    const isLtd       = currentPlan?.startsWith('ltd_');
    const ltdTier     = isLtd ? parseInt(currentPlan.replace('ltd_', '')) : 0;
    const canStackMore = isLtd && ltdTier < 3;

    const featureLabels = {
        sku_limit:     { icon: '📦', label: 'Product Limit' },
        staff_limit:   { icon: '👤', label: 'Staff Limit' },
        locations:     { icon: '🏪', label: 'Warehouse Limit' },
        woocommerce:   { icon: '🛒', label: 'WooCommerce' },
        api_access:    { icon: '🔌', label: 'API Access' },
        growth_engine: { icon: '✨', label: 'Growth Engine' },
        multi_branch:  { icon: '🌐', label: 'Multi-Branch' },
    };

    const featureMeta = featureLabels[feature] || { icon: '🔒', label: 'Feature' };

    const planColors = {
        starter: 'text-slate-400',
        growth: 'text-indigo-400',
        business: 'text-amber-400',
    };

    return (
        <Modal show={isOpen} onClose={() => setIsOpen(false)} maxWidth="lg">
            <div className="relative overflow-hidden bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
                {/* ── Ambient Background Effects ── */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
                <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-5 pointer-events-none" />

                {/* ── Close Button ── */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                >
                    <X size={14} />
                </button>

                <div className="relative z-10 p-8">
                    {/* ── Header ── */}
                    <div className="flex items-start gap-5 mb-8">
                        {/* Feature icon */}
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-400/20 to-orange-600/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg">
                            {featureMeta.icon}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                                    {featureMeta.label} Reached
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 ${planColors[currentPlan]}`}>
                                    {currentPlan} plan
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-white leading-tight">
                                Unlock More with{' '}
                                <span className={upgradeTo === 'business' ? 'text-amber-400' : 'text-indigo-400'}>
                                    {upgradeTo.charAt(0).toUpperCase() + upgradeTo.slice(1)}
                                </span>
                            </h2>
                            <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>

                    {/* ── Perks Grid ── */}
                    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Crown size={12} className={upgradeTo === 'business' ? 'text-amber-400' : 'text-indigo-400'} />
                            What you unlock with {upgradeTo.charAt(0).toUpperCase() + upgradeTo.slice(1)}
                        </p>
                        <div className="grid grid-cols-1 gap-2.5">
                            {upgradePerks.map((perk, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${upgradeTo === 'business' ? 'bg-amber-500/15 text-amber-400' : 'bg-indigo-500/15 text-indigo-400'}`}>
                                        <Check size={11} strokeWidth={3} />
                                    </div>
                                    <span className="text-sm text-slate-300">{perk}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── CTA Buttons ── */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Primary: Upgrade CTA — LTD-aware */}
                        {isLtd ? (
                            canStackMore ? (
                                // LTD user who can still stack more codes
                                <a
                                    href="https://appsumo.com/products/venqore"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-900/20 hover:shadow-amber-900/40"
                                >
                                    <Sparkles size={16} />
                                    Stack Another AppSumo Code
                                    <ArrowRight size={14} />
                                </a>
                            ) : (
                                // LTD user at max tier (ltd_3) — must move to subscription
                                <a
                                    href={upgradeUrl}
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg shadow-indigo-900/30"
                                >
                                    <Sparkles size={16} />
                                    Upgrade to Subscription
                                    <ArrowRight size={14} />
                                </a>
                            )
                        ) : (
                            // Regular subscription user
                            <a
                                href={upgradeUrl}
                                className={`
                                    flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all shadow-lg
                                    ${upgradeTo === 'business'
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-900/20 hover:shadow-amber-900/40'
                                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-indigo-900/30 hover:shadow-indigo-900/50'}
                                `}
                            >
                                <Sparkles size={16} />
                                Upgrade to {upgradeTo.charAt(0).toUpperCase() + upgradeTo.slice(1)}
                                <ArrowRight size={14} />
                            </a>
                        )}

                        {/* Secondary: View Billing */}
                        <a
                            href={billingUrl}
                            className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-medium text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-all"
                        >
                            View Plans
                        </a>

                        {/* Dismiss */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-medium text-sm text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>

                    <p className="text-center text-slate-600 text-xs mt-5">
                        Upgrade takes effect instantly. No downtime. Manage subscription at{' '}
                        <a href={portalUrl} className="text-slate-500 hover:text-slate-300 underline transition-colors">
                            billing portal
                        </a>
                        .
                    </p>
                </div>
            </div>
        </Modal>
    );
}
