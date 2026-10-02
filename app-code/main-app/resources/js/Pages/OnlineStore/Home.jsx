import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StoreTabs from '@/Components/Commerce/StoreTabs';
import { Alert, Button, Card } from '@/Components/Commerce/ui';

export default function Home({ store, problems, can_publish, counts, published_products, public_url, qr_svg, urls }) {
    const { errors } = usePage().props;
    const live = store.status === 'published';
    const post = (url, data = {}) => router.post(url, data, { preserveScroll: true });

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Marketing">
            <Head title="Online Store" />
            <h1 className="text-2xl font-bold text-ink mb-4">Online Store</h1>
            <StoreTabs active="home" urls={urls} status={store.status} />
            {errors?.store && <div className="mb-4"><Alert kind="error">{errors.store}</Alert></div>}

            <div className="grid md:grid-cols-3 gap-4">
                <Card className="md:col-span-2 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="font-semibold text-lg">{live ? 'Your store is live' : 'Your store is not live yet'}</h2>
                            <p className="text-sm text-ink-muted">Basic online ordering is free. Orders arrive in VenQore and post to your normal sales and stock.</p>
                        </div>
                        {live
                            ? <Button variant="secondary" onClick={() => post(urls.unpublish)}>Unpublish</Button>
                            : <Button disabled={!can_publish} onClick={() => post(urls.publish)}>Publish store</Button>}
                    </div>

                    {store.status === 'suspended' && <Alert kind="error">This store is suspended{store.suspended_reason ? `: ${store.suspended_reason}` : ''}. Contact VenQore support. Existing orders are preserved.</Alert>}

                    {!live && problems.length > 0 && (
                        <Alert kind="warn">
                            Before you can publish:
                            <ul className="list-disc ml-5 mt-1">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
                        </Alert>
                    )}

                    {live && (
                        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={store.intake_paused} onChange={(e) => post(urls.intake, { paused: e.target.checked })} />
                                Pause new online orders (kill switch)
                            </label>
                            {store.intake_paused && <span className="text-xs text-amber-700">Customers can browse but cannot order.</span>}
                        </div>
                    )}

                    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-line pt-4 text-center">
                        {[['New', counts.pending], ['Active', counts.active], ['Completed', counts.completed], ['Products live', published_products]].map(([l, v]) => (
                            <div key={l} className="bg-sunken rounded-xl py-3"><dt className="text-xs text-ink-muted">{l}</dt><dd className="text-2xl font-bold tabular-nums">{v}</dd></div>
                        ))}
                    </dl>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => router.visit(urls.settings)}>Store settings</Button>
                        <Button variant="secondary" onClick={() => router.visit(urls.products)}>Products &amp; pricing</Button>
                        <Button variant="secondary" onClick={() => router.visit(urls.orders)}>Online orders</Button>
                    </div>
                </Card>

                <Card className="space-y-3 text-center">
                    <h2 className="font-semibold">Share your store</h2>
                    <div className="mx-auto w-44 bg-white p-2 rounded-xl" dangerouslySetInnerHTML={{ __html: qr_svg }} aria-label="QR code for your store link" role="img" />
                    <p className="text-xs text-ink-muted break-all">{public_url}</p>
                    <div className="flex gap-2 justify-center">
                        <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(public_url)}>Copy link</Button>
                        <a className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-sunken border border-line text-ink" href={public_url} target="_blank" rel="noopener noreferrer">
                            {live ? 'Open store' : 'Preview'}
                        </a>
                    </div>
                    {!live && <p className="text-xs text-ink-muted">Only you can see the link until you publish.</p>}
                </Card>
            </div>
        </OneGlanceLayout>
    );
}
