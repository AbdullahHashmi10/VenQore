import React, { useState, useEffect } from 'react';
import { Zap, X, Check, ArrowRight, Crown, Sparkles, Lock } from 'lucide-react';
import Modal from '@/Components/Modal';
import { usePage } from '@inertiajs/react';

/**
 * UpgradeModal — V6 Global Lock Modal
 *
 * Triggered when a tenant hits a limit or requests a fenced capability.
 * Listens for:
 *   1. CustomEvent('amd:plan-limit') from axios interceptor or components
 *   2. Inertia flash 'plan_limit' from redirects
 */
export default function UpgradeModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [feature, setFeature] = useState(null);
    const [message, setMessage] = useState('');
    const [currentPlan, setCurrentPlan] = useState('starter');
    const [upgradeUrl, setUpgradeUrl] = useState('#');
    const [billingUrl, setBillingUrl] = useState('#');
    const [portalUrl, setPortalUrl] = useState('#');
    const [currentCount, setCurrentCount] = useState(null);
    const [limit, setLimit] = useState(null);
    const [upgradeTarget, setUpgradeTarget] = useState('growth');

    const { flash, limit_grace_status, store } = usePage().props;

    // Listen for custom event from Axios interceptor & UI triggers
    useEffect(() => {
        const handlePlanLimitEvent = (e) => {
            const data = e.detail || {};
            setFeature(data.feature || null);
            setMessage(data.message || 'You have reached a limit on your current plan.');
            setCurrentPlan(data.current_plan || store?.plan || 'starter');
            setUpgradeUrl(data.upgrade_url || (store?.slug ? `/stores/${store.slug}/billing` : '/billing'));
            setBillingUrl(data.billing_url || (store?.slug ? `/stores/${store.slug}/billing` : '/billing'));
            setPortalUrl(data.portal_url || '#');
            setCurrentCount(data.current_count ?? null);
            setLimit(data.limit ?? null);
            setUpgradeTarget(data.upgrade_target || 'growth');
            setIsOpen(true);
        };

        window.addEventListener('amd:plan-limit', handlePlanLimitEvent);
        return () => window.removeEventListener('amd:plan-limit', handlePlanLimitEvent);
    }, [store]);

    // Check Inertia flash
    useEffect(() => {
        if (flash?.plan_limit) {
            const data = flash.plan_limit;
            setFeature(data.feature || null);
            setMessage(data.message || 'You have reached a limit on your current plan.');
            setCurrentPlan(data.current_plan || store?.plan || 'starter');
            setUpgradeUrl(data.upgrade_url || (store?.slug ? `/stores/${store.slug}/billing` : '/billing'));
            setBillingUrl(data.billing_url || (store?.slug ? `/stores/${store.slug}/billing` : '/billing'));
            setPortalUrl(data.portal_url || '#');
            setCurrentCount(data.current_count ?? null);
            setLimit(data.limit ?? null);
            setUpgradeTarget(data.upgrade_target || 'growth');
            setIsOpen(true);
        }
    }, [flash, store]);

    const planPerks = {
        growth: [
            '50,000 product SKUs',
            'Up to 3 full staff seats (till logins unlimited)',
            'Up to 3 store locations',
            'Multi-branch operations & stock transfers',
            'Manufacturing, BOM & production runs',
            'Growth signals & owner’s daily pulse',
            'Customer loyalty & digital gift cards',
            'Recurring invoices, bank rec & e-invoicing',
            '4,000 monthly AI credits',
        ],
        business: [
            '250,000 product SKUs',
            'Up to 10 full staff seats',
            'Up to 10 store locations',
            'Public REST API & Webhooks',
            'White-label customization',
            'Security activity log & audit trail',
            'Custom role permissions',
            'Serial / IMEI tracking',
            '9,000 monthly AI credits',
        ],
    };

    const upgradeTo = upgradeTarget || ((currentPlan === 'starter' || currentPlan === 'ltd_1') ? 'growth' : 'business');
    const isHighestTier = currentPlan === 'business' || currentPlan === 'custom';
    const upgradeLabel = isHighestTier ? 'Enterprise Support' : (upgradeTo === 'business' ? 'Scale' : 'Growth');
    const upgradePerks = planPerks[upgradeTo] || planPerks.growth;

    const featureLabels = {
        sku_limit: { icon: '📦', label: 'Product SKU Limit' },
        staff_limit: { icon: '👤', label: 'Full Staff Seat Limit' },
        locations: { icon: '🏪', label: 'Store Location Limit' },
        location_limit: { icon: '🏪', label: 'Store Location Limit' },
        multi_branch: { icon: '🌐', label: 'Multi-Branch Operations' },
        production: { icon: '🏭', label: 'Manufacturing & Production' },
        bill_of_materials: { icon: '📋', label: 'Bill of Materials' },
        ai_system_builder: { icon: '🤖', label: 'AI System Builder' },
        growth_engine: { icon: '✨', label: 'Growth Engine & Signals' },
        owners_daily_pulse: { icon: '⚡', label: 'Daily Pulse' },
        loyalty_points: { icon: '⭐', label: 'Loyalty Points' },
        digital_gift_cards: { icon: '🎁', label: 'Digital Gift Cards' },
        recurring_invoices: { icon: '🔄', label: 'Recurring Invoicing' },
        bank_reconciliation: { icon: '🏦', label: 'Bank Reconciliation' },
        e_invoicing: { icon: '📄', label: 'E-Invoicing' },
        api_access: { icon: '🔌', label: 'REST API & Webhooks' },
        white_label: { icon: '🏷️', label: 'White-Label Branding' },
        security_activity_log: { icon: '🛡️', label: 'Security & Audit Log' },
        custom_roles: { icon: '👥', label: 'Custom Roles' },
        imei_scanner: { icon: '📱', label: 'IMEI Scanning' },
        serial_tracking: { icon: '🔢', label: 'Serial Tracking' },
        woocommerce: { icon: '🛒', label: 'WooCommerce Sync' },
    };

    const getFeatureMeta = (feat) => {
        if (!feat) return { icon: '🔒', label: 'Feature Locked' };
        if (featureLabels[feat]) return featureLabels[feat];

        const label = feat
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        return { icon: '🔒', label };
    };

    const featureMeta = getFeatureMeta(feature);

    const planColors = {
        starter: 'text-ink-muted',
        growth: 'text-brand-400',
        business: 'text-amber-400',
    };

    const displayCount = currentCount || (limit_grace_status?.is_over_limit && limit_grace_status?.exceeded_feature === feature ? limit_grace_status.current_count : null);
    const displayLimit = limit || (limit_grace_status?.is_over_limit && limit_grace_status?.exceeded_feature === feature ? limit_grace_status.limit : null);

    let unitName = 'items';
    if (feature === 'sku_limit') unitName = 'Products';
    else if (feature === 'staff_limit') unitName = 'Full Seats';
    else if (feature === 'locations' || feature === 'location_limit') unitName = 'Locations';

    return (
        <Modal show={isOpen} onClose={() => setIsOpen(false)} maxWidth="lg">
            <div className="relative overflow-hidden bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl">
                {/* Ambient Effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-600/15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

                {/* Close Button */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-interactive-hover text-ink-muted hover:text-white transition-all"
                >
                    <X size={14} />
                </button>

                <div className="relative z-10 p-8">
                    {/* Header */}
                    <div className="flex items-start gap-5 mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-400/20 to-orange-600/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg">
                            {featureMeta.icon}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                                    {featureMeta.label}
                                </span>
                                {displayCount !== null && displayLimit !== null && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                        {displayCount.toLocaleString()} / {displayLimit.toLocaleString()} {unitName}
                                    </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-800 border border-neutral-700 ${planColors[currentPlan] || 'text-white'}`}>
                                    {currentPlan === 'business' ? 'Scale' : currentPlan} plan
                                </span>
                            </div>

                            <h2 className="text-xl font-bold text-white leading-tight">
                                {isHighestTier ? (
                                    <span>Plan Limit Reached</span>
                                ) : (
                                    <>
                                        Available in{' '}
                                        <span className={upgradeTo === 'business' ? 'text-amber-400' : 'text-brand-400'}>
                                            {upgradeLabel}
                                        </span>
                                    </>
                                )}
                            </h2>
                            <p className="text-ink-muted text-sm mt-1 leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>

                    {/* Perks Grid */}
                    <div className="bg-neutral-800/60 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-5 mb-6">
                        <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Crown size={12} className={upgradeTo === 'business' ? 'text-amber-400' : 'text-brand-400'} />
                            Included in {upgradeLabel}
                        </p>
                        <div className="grid grid-cols-1 gap-2.5">
                            {upgradePerks.map((perk, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${upgradeTo === 'business' ? 'bg-amber-500/15 text-amber-400' : 'bg-brand-500/15 text-brand-400'}`}>
                                        <Check size={11} strokeWidth={3} />
                                    </div>
                                    <span className="text-sm text-neutral-300">{perk}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <a
                            href={upgradeUrl}
                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all shadow-lg ${
                                upgradeTo === 'business'
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400'
                                    : 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500'
                            }`}
                        >
                            <Sparkles size={16} />
                            Upgrade to {upgradeLabel}
                            <ArrowRight size={14} />
                        </a>

                        <a
                            href={billingUrl}
                            className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-medium text-sm text-neutral-300 bg-neutral-800 hover:bg-interactive-hover border border-neutral-700 hover:border-line-strong transition-all"
                        >
                            View Plans & Add-ons
                        </a>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-medium text-sm text-ink-muted hover:text-neutral-300 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>

                    {portalUrl && portalUrl !== '#' && (
                        <p className="text-center text-ink-secondary text-xs mt-5">
                            Upgrades apply immediately with prorated billing. Manage anytime at the{' '}
                            <a href={portalUrl} className="text-ink-muted hover:text-neutral-300 underline transition-colors">
                                billing portal
                            </a>.
                        </p>
                    )}
                </div>
            </div>
        </Modal>
    );
}
