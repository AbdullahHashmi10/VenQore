import React, { useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { usePlan } from '@/Hooks/usePlan';
import { FEATURE_METADATA, PLAN_LABELS } from '@/Registry/features';
import { Lock, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { vq } from '@/theme/runtime';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';

const PLAN_COLORS = {
    growth:   { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', accent: vq.indigo[400] },
    business: { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', accent: vq.purple[400] },
    addon:    { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', accent: vq.purple[400] },
    default:  { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', accent: vq.indigo[400] },
};

export default function LockedFeature({
    feature,
    mode = 'gate', // 'gate' (block), 'lock' (overlay), 'badge' (inline clickable)
    label: customLabel,
    plan: customPlanRequired,
    fallback = null,
    showUpgradeBadge = true, // for gate mode
    height = 220, // for lock mode
    isComingSoon = false, // for badge mode (coming soon modal)
    isLocked, // explicit lock override
    children
}) {
    const { store } = usePage().props;
    const { hasFeature } = usePlan();
    const [showComingSoon, setShowComingSoon] = useState(false);

    // Canonical entitlement check
    const isAllowed = isLocked !== undefined ? !isLocked : hasFeature(feature);

    if (isAllowed && !isComingSoon) {
        return <>{children}</>;
    }

    // Resolve metadata
    const metadata = FEATURE_METADATA[feature] || {};
    const label = customLabel || metadata.label || 'This Feature';
    const planRequired = customPlanRequired || metadata.plan || 'growth';
    const planLabel = PLAN_LABELS[planRequired] || planRequired;
    const currentPlan = store?.plan || 'starter';
    const colors = PLAN_COLORS[planRequired] || PLAN_COLORS.default;

    const triggerUpgradeModal = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (isComingSoon) {
            setShowComingSoon(true);
            return;
        }

        // Fire plan-limit event to show global UpgradeModal
        const billingUrl = window.route ? route('store.billing', { store_slug: store?.slug }) : '/billing';
        window.dispatchEvent(new CustomEvent('amd:plan-limit', {
            detail: {
                feature,
                message: `${label} is not available on your current plan.`,
                current_plan: currentPlan,
                billing_url: billingUrl
            },
        }));
    };

    if (mode === 'gate') {
        if (fallback) return <>{fallback}</>;
        if (!showUpgradeBadge) return null;

        return (
            <div className="relative border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-5 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: colors.bg, border: `1.5px solid ${colors.border}`, display: 'grid', placeItems: 'center', color: colors.accent }}>
                        <Lock size={18} />
                    </div>
                    <h4 className="text-sm font-bold text-ink dark:text-ink">
                        {label} is Locked
                    </h4>
                    <p className="text-xs text-ink-secondary dark:text-ink-secondary max-w-md leading-relaxed">
                        This feature requires a {planLabel} subscription.
                    </p>
                    <button
                        onClick={triggerUpgradeModal}
                        className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg text-white bg-brand-600 hover:bg-brand-700 transition shadow-sm"
                    >
                        <Zap size={12} className="mr-1.5" />
                        Upgrade to {planLabel}
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'lock') {
        return (
            <div style={{ position: 'relative', minHeight: height }}>
                <div style={{ filter: 'blur(4px)', opacity: 0.35, pointerEvents: 'none', userSelect: 'none' }} aria-hidden="true">
                    {children}
                </div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,10,18,0.72)', backdropFilter: 'blur(2px)', borderRadius: 14, border: `1px solid ${colors.border}`, gap: 14, padding: 24, textAlign: 'center', zIndex: 30 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: colors.bg, border: `1.5px solid ${colors.border}`, display: 'grid', placeItems: 'center', color: colors.accent }}>
                        <Lock size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: vq.slate[200], marginBottom: 5 }}>{label} requires {planLabel}</div>
                        <div style={{ fontSize: 12.5, color: vq.slate[500], maxWidth: 280, margin: '0 auto', lineHeight: 1.55 }}>Upgrade your plan to unlock {label.toLowerCase()} and other advanced capabilities.</div>
                    </div>
                    <button onClick={triggerUpgradeModal} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 999, background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}bb)`, border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `0 4px 16px ${colors.accent}33`, transition: 'all .15s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <Zap size={14} />
                        Upgrade to {planLabel}
                        <ArrowRight size={13} />
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'badge') {
        const handleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerUpgradeModal();
        };

        return (
            <>
                <div onClick={handleClick} className="relative cursor-pointer group w-full">
                    {children}
                    {showUpgradeBadge && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <Lock size={12} className="text-amber-500" />
                        </div>
                    )}
                </div>

                {showComingSoon && (
                    <Modal show={showComingSoon} onClose={() => setShowComingSoon(false)} maxWidth="sm">
                        <div className="relative overflow-hidden bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-600/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

                            <div className="p-8 text-center relative z-10">
                                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 transform hover:rotate-6 transition-transform">
                                    <Lock size={32} className="text-white" />
                                </div>

                                <h2 className="text-2xl font-bold text-white mb-3 flex items-center justify-center gap-2">
                                    Coming Soon <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-mono uppercase border border-amber-500/30">V1.1</span>
                                </h2>

                                <p className="text-neutral-300 mb-8 leading-relaxed">
                                    This advanced module is part of our upcoming Gold Release expansion.
                                    We are currently finalizing the security and performance audits.
                                </p>

                                {/* The V6 Button styles itself from tokens and
                                    declares no `className`, so the stack of
                                    !bg-neutral-* overrides that used to sit
                                    here was being dropped by React in silence.
                                    The secondary variant — a light card face —
                                    reads correctly on this dark panel, and
                                    stock Tailwind greys are off the palette
                                    anyway (DESIGN-RULES §4). */}
                                <div className="flex justify-center">
                                    <SecondaryButton onClick={() => setShowComingSoon(false)}>
                                        Acknowledge
                                    </SecondaryButton>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}
            </>
        );
    }

    return children;
}
