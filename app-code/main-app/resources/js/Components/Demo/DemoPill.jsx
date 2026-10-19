/**
 * DemoPill — says "you are in the demo" from the same header slot the trial
 * pill uses, instead of a full-width bar. Clicking it opens the demo picker so
 * the visitor can change their role or the kind of business without leaving
 * the app. Renders nothing outside the demo store.
 */
import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import DemoPicker from '@/Components/Demo/DemoPicker';

const humanize = (id) => String(id || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function DemoPill() {
    const { is_demo, store } = usePage().props;
    const [open, setOpen] = useState(false);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    if (!(is_demo || store?.is_demo)) return null;

    const roleName = data
        ? [...data.primaryRoles, ...data.specializedRoles].find((r) => r.id === data.currentRole)?.name
        : null;

    const begin = async () => {
        setError(null);
        if (!data) {
            setLoading(true);
            try {
                const res = await fetch('/demo/options', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
                if (!res.ok) throw new Error(String(res.status));
                setData(await res.json());
            } catch (e) {
                setError('Could not load the demo options. Please try again.');
                setLoading(false);
                return;
            }
            setLoading(false);
        }
        setOpen(true);
    };

    const apply = ({ business, role }) => {
        if (submitting) return;
        setSubmitting(true);
        setError(null);
        router.post('/demo/switch-business', { business_type: business, role }, {
            onError: () => setError('Could not switch the demo. Please try again.'),
            onFinish: () => setSubmitting(false),
        });
    };

    const label = store?.demo_business_label || humanize(store?.demo_business_type);

    return (
        <>
            <button
                type="button"
                onClick={begin}
                disabled={loading}
                aria-haspopup="dialog"
                title={`Demo store${label ? ` · ${label}` : ''}. Click to change role or business type.`}
                className="flex items-center gap-2 h-11 px-3 rounded-xl bg-brand-500/10 border border-brand-500/25 hover:bg-brand-500/20 hover:border-brand-500/40 transition-all shadow-sm"
            >
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                <span className="text-2xs font-bold text-brand-700 dark:text-brand-300 uppercase tracking-[0.15em] leading-none">
                    Demo{roleName ? <span className="hidden sm:inline"> · {roleName}</span> : null}
                </span>
            </button>

            {open && data && (
                <DemoPicker
                    types={data.businessTypes}
                    primaryRoles={data.primaryRoles}
                    specializedRoles={data.specializedRoles}
                    initialBusiness={data.currentBusinessType}
                    initialRole={data.currentRole}
                    submitLabel="Switch demo"
                    submittingLabel="Switching…"
                    trialHref="/register"
                    submitting={submitting}
                    error={error}
                    onSubmit={apply}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}
