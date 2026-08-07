import React from 'react';
import { Link } from '@inertiajs/react';
import { CheckCircle2, XCircle } from 'lucide-react';
import MarketingLayout from '../Shared/MarketingLayout';

export default function LeadConfirm({ found, confirmed }) {
    return (
        <MarketingLayout title="Confirm subscription — VenQore">
            <section className="pt-36 md:pt-44 pb-24 px-6 flex items-center justify-center">
                <div className="max-w-md text-center">
                    {found ? (
                        <>
                            <CheckCircle2 size={48} className="text-emerald-500 dark:text-emerald-400 mx-auto mb-6" />
                            <h1 className="text-2xl font-black mb-3 text-slate-900 dark:text-white">You're confirmed</h1>
                            <p className="text-slate-600 dark:text-slate-400 mb-8">
                                {confirmed
                                    ? "Thanks — you'll start getting occasional retail tips from VenQore. Unsubscribe anytime."
                                    : 'This subscription was already confirmed.'}
                            </p>
                        </>
                    ) : (
                        <>
                            <XCircle size={48} className="text-red-500 dark:text-red-400 mx-auto mb-6" />
                            <h1 className="text-2xl font-black mb-3 text-slate-900 dark:text-white">Link not found</h1>
                            <p className="text-slate-600 dark:text-slate-400 mb-8">This confirmation link is invalid or has expired.</p>
                        </>
                    )}
                    <Link href="/" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                        &larr; Back to VenQore
                    </Link>
                </div>
            </section>
        </MarketingLayout>
    );
}
