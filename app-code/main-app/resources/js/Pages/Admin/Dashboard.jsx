import { useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';

/**
 * Deprecated: The /admin page has been merged into /home.
 * This client-side guard redirects any stale visits to the unified Home page.
 */
export default function DeprecatedAdminDashboard() {
    const { store } = usePage().props;

    useEffect(() => {
        if (typeof route === 'function') {
            router.replace(route('store.home', { store_slug: store?.slug }));
        } else {
            window.location.href = `/s/${store?.slug || ''}/home`;
        }
    }, [store]);

    return null;
}
