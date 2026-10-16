/**
 * /demo — one page, one button.
 *
 * The button opens a two-step picker: the business first, then who you are in
 * it. Submitting posts to demo.login, which provisions the shared demo store
 * with that business's modules and signs the visitor in under that role.
 * Business types come from the server (BusinessTypes — the same catalogue the
 * builder uses); the page never keeps a second list.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import SiteChrome from '@/Components/Site/SiteChrome';
import DemoPicker from '@/Components/Demo/DemoPicker';

export default function DemoLanding({
    businessTypes,
    primaryRoles = [],
    specializedRoles = [],
    initialBusinessType = null,
    initialRole = 'owner',
    flash = {},
}) {
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(flash?.error || null);
    const triggerRef = useRef(null);

    // The server answers "regenerating, try again" as a flash message, not an exception.
    useEffect(() => { if (flash?.error) setError(flash.error); }, [flash?.error]);

    const close = () => { setOpen(false); triggerRef.current?.focus(); };

    const launch = ({ business, role }) => {
        if (!business || !role || submitting) return;
        setSubmitting(true);
        setError(null);
        router.post('/demo/login', { business_type: business, role }, {
            onError: () => setError('Something went wrong opening the demo. Please try again.'),
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <SiteChrome underHeader>
            <Head>
                <title>Live demo | VenQore</title>
                <meta name="description" content="Open a live VenQore store with sample data. Pick your kind of business and who you are in it — no sign-up." />
                <link rel="canonical" href="https://venqore.com/demo" />
            </Head>

            <section className="vq-section vq-dm-hero">
                <div className="vq-amb" aria-hidden="true"><span className="vq-amb__aurora" style={{ opacity: 0.26 }} /></div>
                <div className="vq-container" style={{ position: 'relative' }}>
                    <div className="vq-mc-head vq-mc-head--center">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Live demo · no sign-up</span>
                        <h1 className="vq-display vq-mt-4">See your business <em className="vq-italic">running.</em></h1>
                        <p className="vq-lede vq-mt-6">
                            A real store with real sample data, set up for your kind of business. Two quick choices and you are inside.
                        </p>
                        <div className="vq-mt-10">
                            <button
                                ref={triggerRef}
                                type="button"
                                className="vq-btn vq-btn--primary vq-dm-cta"
                                onClick={() => { setError(null); setOpen(true); }}
                                aria-haspopup="dialog"
                            >
                                <Sparkles size={20} aria-hidden="true" />
                                Open the live demo
                                <span className="vq-btn__arrow"><ArrowRight size={18} aria-hidden="true" /></span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {open && (
                <DemoPicker
                    types={businessTypes}
                    primaryRoles={primaryRoles}
                    specializedRoles={specializedRoles}
                    initialBusiness={initialBusinessType}
                    initialRole={initialRole}
                    submitting={submitting}
                    error={error}
                    onSubmit={launch}
                    onClose={close}
                />
            )}
        </SiteChrome>
    );
}
