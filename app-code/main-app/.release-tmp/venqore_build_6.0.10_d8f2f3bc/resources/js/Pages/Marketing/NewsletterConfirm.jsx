import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, XCircle } from 'lucide-react';
import MarketingLayout from './Shared/MarketingLayout';

export default function NewsletterConfirm({ found, confirmed }) {
    return (
        <MarketingLayout
            title="Confirm newsletter subscription — VenQore"
            description="Confirm your VenQore newsletter subscription."
        >
            <Head><meta name="robots" content="noindex, nofollow" /></Head>
            <section className="vq-section vq-mc-top">
                <div className="vq-container">
                    <div className="vq-card vq-card--xl vq-center" style={{ maxWidth: '560px', marginInline: 'auto', padding: 'clamp(32px, 5vw, 48px)' }}>
                        {found && confirmed ? (
                            <>
                                <span className="vq-mc-icon vq-mc-icon--lg vq-mc-icon--round" style={{ '--tone': 'var(--vq-success)' }}>
                                    <CheckCircle2 size={30} aria-hidden="true" />
                                </span>
                                <h1 className="vq-h2 vq-mt-6">Subscription confirmed</h1>
                                <p className="vq-body vq-text-2 vq-mt-3" style={{ marginInline: 'auto' }}>
                                    Thanks — your address is confirmed. Every newsletter will include an unsubscribe link.
                                </p>
                            </>
                        ) : (
                            <>
                                <span className="vq-mc-icon vq-mc-icon--lg vq-mc-icon--round" style={{ '--tone': 'var(--vq-danger)' }}>
                                    <XCircle size={30} aria-hidden="true" />
                                </span>
                                <h1 className="vq-h2 vq-mt-6">Link not found</h1>
                                <p className="vq-body vq-text-2 vq-mt-3" style={{ marginInline: 'auto' }}>This confirmation link is invalid or no longer available.</p>
                            </>
                        )}
                        <div className="vq-mt-8">
                            <Link href="/" className="vq-btn vq-btn--secondary">
                                &larr; Back to VenQore
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
