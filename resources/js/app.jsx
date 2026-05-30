import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import React from 'react';
import { createRoot } from 'react-dom/client';
import GlobalProviderLayout from '@/Layouts/GlobalProviderLayout';


import GlobalErrorBoundary from '@/Components/GlobalErrorBoundary';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Intercept non-JSON responses from Inertia server calls (preventing the default modal block)
router.on('invalid', (event) => {
    event.preventDefault();
    const status = event.detail?.response?.status || 500;
    window.location.href = `/error/${status}`;
});

createInertiaApp({
    title: (title) => {
        const businessName = window.amdSettings?.business_name || appName;
        return title ? `${title} - ${businessName}` : businessName;
    },
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ).then((module) => {
            const page = module.default;
            const originalLayout = page.layout;

            // Robustly handle both functional and component layouts, or no layout
            page.layout = (pageNode) => {
                const layoutElement = originalLayout
                    ? (typeof originalLayout === 'function' && originalLayout.length > 0
                        ? originalLayout(pageNode) // If it's a layout function: page => <L>{page}</L>
                        : React.createElement(originalLayout, {}, pageNode)) // If it's a Component
                    : pageNode;

                return (
                    <GlobalProviderLayout>
                        {layoutElement}
                    </GlobalProviderLayout>
                );
            };
            return module;
        }),
    setup({ el, App, props }) {
        // Global settings initialization - ensures formatCurrency() has context 
        // even during the very first render of any component.
        const pageProps = props.initialPage.props;
        const store = pageProps.store || {};
        const settings = pageProps.settings || {};

        window.amdSettings = {
            ...settings,
            currency:        settings.currency        || store.currency_code,
            currency_code:   store.currency_code      || settings.currency_code,
            currency_symbol: store.currency_symbol    || settings.currency_symbol,
            timezone:        settings.timezone        || store.timezone || 'UTC',
            store_name:      store.name               || settings.store_name || settings.business_name,
            decimal_places:  parseInt(settings.decimal_places !== undefined ? settings.decimal_places : 2)
        };

        const root = createRoot(el);
        root.render(
            <GlobalErrorBoundary>
                <App {...props} />
            </GlobalErrorBoundary>
        );
    },
    progress: {
        color: '#4B5563',
    },
});


// Global window error listener for non-React errors
window.onerror = function (message, source, lineno, colno, error) {
    try {
        fetch('/api/report-error', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            },
            body: JSON.stringify({
                message: message,
                url: window.location.href,
                stack_trace: error?.stack,
                file: source,
                line: lineno,
            }),
        });
    } catch (e) {}
};

window.onunhandledrejection = function (event) {
    try {
        fetch('/api/report-error', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            },
            body: JSON.stringify({
                message: 'Unhandled Promise Rejection: ' + event.reason,
                url: window.location.href,
                stack_trace: event.reason?.stack,
                file: null,
                line: null,
            }),
        });
    } catch (e) {}
};

if ('serviceWorker' in navigator) {
    const isDev = import.meta.env.DEV;

    if (!isDev) {
        window.addEventListener('load', () => {
            // Proactively unregister any legacy conflicting service workers in production
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (const registration of registrations) {
                    const url = registration.active?.scriptURL || '';
                    if (url && !url.endsWith('/sw.js')) {
                        console.log('[SW] Unregistering legacy conflicting service worker:', url);
                        registration.unregister();
                    }
                }
            });

            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    } else {
        // In dev mode, unregister any previously registered SW to avoid stale caches
        window.addEventListener('load', () => {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (const registration of registrations) {
                    registration.unregister();
                }
            });
        });
    }
}
