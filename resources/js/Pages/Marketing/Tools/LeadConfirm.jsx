import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import MarketingLayout from '../Shared/MarketingLayout';

export default function LeadConfirm({ found, confirmed }) {
    return (
        <MarketingLayout title="Confirm subscription — VenQore"
                         description="Confirm your email address to receive the file you generated.">
            {/* One-time token page — never index */}
            <Head><meta name="robots" content="noindex, nofollow" /></Head>
            <section className="vq-section vq-lead">
                <div className="vq-container vq-container--narrow">
                    <div className="vq-card vq-card--xl vq-lead__card">
                        {found ? (
                            <>
                                <span className="vq-lead__icon vq-lead__icon--ok"><CheckCircle2 size={28} aria-hidden="true" /></span>
                                <h1 className="vq-h1">You're confirmed</h1>
                                <p className="vq-lede">
                                    {confirmed
                                        ? "Thanks — you'll start getting occasional retail tips from VenQore. Unsubscribe anytime."
                                        : 'This subscription was already confirmed.'}
                                </p>
                            </>
                        ) : (
                            <>
                                <span className="vq-lead__icon vq-lead__icon--bad"><XCircle size={28} aria-hidden="true" /></span>
                                <h1 className="vq-h1">Link not found</h1>
                                <p className="vq-lede">This confirmation link is invalid or has expired.</p>
                            </>
                        )}
                        <div className="vq-lead__actions">
                            <Link href="/" className="vq-btn vq-btn--secondary vq-btn--lg">
                                <ArrowLeft size={16} aria-hidden="true" /> Back to VenQore
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
