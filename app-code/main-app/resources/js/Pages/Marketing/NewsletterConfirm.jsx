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
            <section className="pt-36 md:pt-44 pb-24 px-6 flex items-center justify-center">
                <div className="max-w-md text-center">
                    {found && confirmed ? (
                        <>
                            <CheckCircle2 size={48} className="text-emerald-500 dark:text-emerald-400 mx-auto mb-6" />
                            <h1 className="text-2xl font-bold mb-3 text-ink">Subscription confirmed</h1>
                            <p className="text-ink-secondary mb-8">
                                Thanks — your address is confirmed. Every newsletter will include an unsubscribe link.
                            </p>
                        </>
                    ) : (
                        <>
                            <XCircle size={48} className="text-red-500 dark:text-red-400 mx-auto mb-6" />
                            <h1 className="text-2xl font-bold mb-3 text-ink">Link not found</h1>
                            <p className="text-ink-secondary mb-8">This confirmation link is invalid or no longer available.</p>
                        </>
                    )}
                    <Link href="/" className="text-sm font-bold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300">
                        &larr; Back to VenQore
                    </Link>
                </div>
            </section>
        </MarketingLayout>
    );
}
