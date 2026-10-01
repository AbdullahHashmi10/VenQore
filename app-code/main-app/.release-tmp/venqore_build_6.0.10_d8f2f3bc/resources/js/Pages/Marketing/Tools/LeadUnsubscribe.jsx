import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { MailX } from 'lucide-react';
import MarketingLayout from '../Shared/MarketingLayout';

export default function LeadUnsubscribe({ token }) {
    const { flash } = usePage().props;
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(`/tools/lead/unsubscribe/${token}`);
    };

    return (
        <MarketingLayout title="Unsubscribe — VenQore"
                         description="Unsubscribe from VenQore tool emails.">
            {/* One-time token page — never index */}
            <Head><meta name="robots" content="noindex, nofollow" /></Head>
            <section className="vq-section vq-lead">
                <div className="vq-container vq-container--narrow">
                    <div className="vq-card vq-card--xl vq-lead__card">
                        <span className="vq-lead__icon"><MailX size={28} aria-hidden="true" /></span>
                        {flash?.success ? (
                            <>
                                <h1 className="vq-h1">You're unsubscribed</h1>
                                <p className="vq-lede">{flash.success}</p>
                            </>
                        ) : (
                            <>
                                <h1 className="vq-h1">Unsubscribe from VenQore emails</h1>
                                <p className="vq-lede">You'll stop receiving marketing emails from VenQore. This won't affect any account you have.</p>
                                <div className="vq-lead__actions">
                                    <button
                                        type="button"
                                        onClick={submit}
                                        disabled={processing}
                                        className="vq-btn vq-btn--primary vq-btn--lg"
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
