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
                    <MailX size={48} className="text-ink-muted mx-auto mb-6" />
                    {flash?.success ? (
                        <p className="text-ink-secondary">{flash.success}</p>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold mb-3 text-ink">Unsubscribe from VenQore emails</h1>
                            <p className="text-ink-secondary mb-8">You'll stop receiving marketing emails from VenQore. This won't affect any account you have.</p>
                            <button
                                onClick={submit}
                                disabled={processing}
                                className="px-7 py-3 bg-accent-fill text-accent-on hover:bg-accent-fill-hover rounded-full text-sm font-bold uppercase tracking-wide transition-transform disabled:opacity-50"
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
