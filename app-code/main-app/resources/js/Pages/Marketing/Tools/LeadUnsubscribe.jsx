import React from 'react';
import { useForm, usePage } from '@inertiajs/react';
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
        <MarketingLayout title="Unsubscribe — VenQore">
            <section className="pt-36 md:pt-44 pb-24 px-6 flex items-center justify-center">
                <div className="max-w-md text-center">
                    <MailX size={48} className="text-slate-500 dark:text-slate-500 mx-auto mb-6" />
                    {flash?.success ? (
                        <p className="text-slate-600 dark:text-slate-300">{flash.success}</p>
                    ) : (
                        <>
                            <h1 className="text-2xl font-black mb-3 text-slate-900 dark:text-white">Unsubscribe from VenQore emails</h1>
                            <p className="text-slate-600 dark:text-slate-400 mb-8">You'll stop receiving marketing emails from VenQore. This won't affect any account you have.</p>
                            <button
                                onClick={submit}
                                disabled={processing}
                                className="px-7 py-3 bg-slate-900 dark:bg-white text-white dark:text-void-900 rounded-full text-sm font-black uppercase tracking-wide hover:scale-105 transition-transform disabled:opacity-50"
                            >
                                {processing ? 'Unsubscribing…' : 'Confirm unsubscribe'}
                            </button>
                        </>
                    )}
                </div>
            </section>
        </MarketingLayout>
    );
}
