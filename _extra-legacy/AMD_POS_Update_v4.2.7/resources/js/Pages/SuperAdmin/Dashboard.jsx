/**
 * VenQore Command Center — entry / dispatcher.
 *
 * The audit asked to "split the 3,117-line Dashboard into routes" and run the
 * whole platform from ONE shell. This thin page wraps every Command Center view
 * in <PlatformLayout> and renders the right view from the ?view= query param,
 * so each nav item is a deep-linkable destination without needing dozens of new
 * backend routes. The default (no ?view=) is the rebuilt Overview.
 *
 * The previous 3,117-line monolith is preserved as Dashboard.legacy.jsx.bak.
 */
import React, { useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import PlatformLayout from '@/Layouts/PlatformLayout';
import Overview from '@/Pages/Platform/Overview';
import {
    RevenueView, GmvView, TestingView, DemoView, SupportView,
    ImpersonationView, PkVerificationsView, SettingsView,
    JobsView, StorageView, FlagsView, AppSumoView,
} from '@/Pages/Platform/Views';

const TITLES = {
    overview: 'Overview',
    revenue: 'Revenue',
    gmv: 'Merchant GMV',
    testing: 'Testing Center',
    demo: 'Demo & Sandbox',
    support: 'Support Inbox',
    impersonation: 'Impersonation',
    'pk-verifications': 'PK Verifications',
    settings: 'Platform Settings',
    jobs: 'Jobs & Queues',
    storage: 'Storage',
    flags: 'Feature Flags',
    appsumo: 'AppSumo / LTD',
};

function viewFromUrl(url) {
    try {
        const qs = (url || (typeof window !== 'undefined' ? window.location.search : '')).split('?')[1] || '';
        return new URLSearchParams(qs).get('view') || 'overview';
    } catch {
        return 'overview';
    }
}

export default function Dashboard(props) {
    // Derive from the Inertia page URL so client-side ?view= navigation updates.
    const page = usePage();
    const view = useMemo(() => viewFromUrl(page.url), [page.url]);

    let content;
    switch (view) {
        case 'revenue': content = <RevenueView {...props} />; break;
        case 'gmv': content = <GmvView {...props} />; break;
        case 'testing': content = <TestingView {...props} />; break;
        case 'demo': content = <DemoView {...props} />; break;
        case 'support': content = <SupportView {...props} />; break;
        case 'impersonation': content = <ImpersonationView {...props} />; break;
        case 'pk-verifications': content = <PkVerificationsView {...props} />; break;
        case 'settings': content = <SettingsView {...props} />; break;
        case 'jobs': content = <JobsView {...props} />; break;
        case 'storage': content = <StorageView {...props} />; break;
        case 'flags': content = <FlagsView {...props} />; break;
        case 'appsumo': content = <AppSumoView {...props} />; break;
        default: content = <Overview {...props} />;
    }

    return (
        <PlatformLayout title={TITLES[view] || 'Overview'}>
            {content}
        </PlatformLayout>
    );
}
