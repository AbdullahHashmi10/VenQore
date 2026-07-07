import React from 'react';
import { usePage } from '@inertiajs/react';
import { Lock, Zap, ArrowRight } from 'lucide-react';

/**
 * FeatureLock — Proactive plan-gate wrapper component.
 *
 * Wraps any section of the UI and overlays a premium blurred lock panel
 * when the feature is disabled in the tenant plan. When enabled, renders
 * children normally with zero overhead.
 *
 * Usage:
 *   <FeatureLock feature="recurring_invoices" label="Recurring Invoices" plan="growth">
 *       <RecurringInvoicesTable />
 *   </FeatureLock>
 *
 * Also exports: useFeature(key) => boolean hook for conditional rendering
 */

const PLAN_LABELS = {
    trial:    'Trial',
    starter:  'Starter',
    growth:   'Growth',
    business: 'Business',
    ltd:      'Lifetime Deal',
};

const PLAN_COLORS = {
    growth:   { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', accent: '#818cf8' },
    business: { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', accent: '#c084fc' },
    default:  { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', accent: '#818cf8' },
};

/** Hook: returns true/false/null for a feature key */
export function useFeature(key) {
    const { store } = usePage().props;
    const features = store?.features ?? {};
    if (!(key in features)) return null;
    return Boolean(features[key]);
}

export default function FeatureLock({
    feature,
    label = 'This Feature',
    plan = 'growth',
    height = 220,
    children,
}) {
    const { store } = usePage().props;
    const features = store?.features ?? {};
    const isEnabled = feature in features ? Boolean(features[feature]) : true;

    if (isEnabled) return children;

    const colors = PLAN_COLORS[plan] ?? PLAN_COLORS.default;
    const planLabel = PLAN_LABELS[plan] ?? plan;
    const currentPlan = store?.plan ?? 'starter';

    const triggerUpgradeModal = () => {
        const billingUrl = window.route?.('store.billing.index', { store_slug: store?.slug }) ?? '#';
        window.dispatchEvent(new CustomEvent('amd:plan-limit', {
            detail: { feature, message: `${label} is not available on your current plan.`, current_plan: currentPlan, billing_url: billingUrl },
        }));
    };

    return (
        <div style={{ position: 'relative', minHeight: height }}>
            <div style={{ filter: 'blur(4px)', opacity: 0.35, pointerEvents: 'none', userSelect: 'none' }} aria-hidden="true">
                {children}
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,10,18,0.72)', backdropFilter: 'blur(2px)', borderRadius: 14, border: `1px solid ${colors.border}`, gap: 14, padding: 24, textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: colors.bg, border: `1.5px solid ${colors.border}`, display: 'grid', placeItems: 'center', color: colors.accent }}>
                    <Lock size={22} />
                </div>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', marginBottom: 5 }}>{label} requires {planLabel}</div>
                    <div style={{ fontSize: 12.5, color: '#64748b', maxWidth: 280, margin: '0 auto', lineHeight: 1.55 }}>Upgrade your plan to unlock {label.toLowerCase()} and other advanced capabilities.</div>
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
