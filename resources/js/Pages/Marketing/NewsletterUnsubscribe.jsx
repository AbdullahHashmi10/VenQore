import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { MailX } from 'lucide-react';
import MarketingLayout from './Shared/MarketingLayout';

export default function NewsletterUnsubscribe({ token }) {
    const { flash } = usePage().props;
    const { post, processing } = useForm({});

    const submit = (event) => {
        event.preventDefault();
        post(`/subscribe/unsubscribe/${token}`);
    };

    return (
        <MarketingLayout
            title="Unsubscribe from the newsletter — VenQore"
            description="Stop receiving VenQore newsletter emails."
        >
            <Head><meta name="robots" content="noindex, nofollow" /></Head>
            <section className="vq-section vq-mc-top">
                <div className="vq-container">
                    <div className="vq-card vq-card--xl vq-center" style={{ maxWidth: '560px', marginInline: 'auto', padding: 'clamp(32px, 5vw, 48px)' }}>
                        <span className="vq-mc-icon vq-mc-icon--lg vq-mc-icon--round" style={{ '--tone': 'var(--vq-text-2)' }}>
                            <MailX size={30} aria-hidden="true" />
                        </span>
                        {flash?.success ? (
                            <p className="vq-body vq-mt-6" style={{ marginInline: 'auto', color: 'var(--vq-text)' }}>{flash.success}</p>
                        ) : (
                            <>
                                <h1 className="vq-h2 vq-mt-6">Unsubscribe from VenQore</h1>
                                <p className="vq-body vq-text-2 vq-mt-3" style={{ marginInline: 'auto' }}>
                                    You will stop receiving newsletter emails. This will not affect any VenQore account you have.
                                </p>
                                <div className="vq-mt-8">
                                    <button
                                        type="button"
                                        onClick={submit}
                                        disabled={processing}
                                        className="vq-btn vq-btn--primary vq-btn--lg"
                                        style={{ opacity: processing ? 0.6 : undefined }}
                                    >
                                        {processing ? 'Unsubscribing…' : 'Confirm unsubscribe'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
