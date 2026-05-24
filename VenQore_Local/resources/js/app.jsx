import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import React from 'react';
import { createRoot } from 'react-dom/client';
import GlobalProviderLayout from '@/Layouts/GlobalProviderLayout';


import GlobalErrorBoundary from '@/Components/GlobalErrorBoundary';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

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


if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
