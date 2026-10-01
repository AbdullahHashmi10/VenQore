import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import ReactDOMServer from 'react-dom/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import React from 'react';
import GlobalProviderLayout from '@/Layouts/GlobalProviderLayout';
import { route } from 'ziggy-js';
import { Ziggy } from '@/ziggy.js';

const appName = import.meta.env.VITE_APP_NAME || 'VenQore POS';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => {
            const businessName = page.props?.store?.name || page.props?.settings?.business_name || appName;
            return title ? `${title} - ${businessName}` : businessName;
        },
        resolve: (name) =>
            resolvePageComponent(
                `./Pages/${name}.jsx`,
                import.meta.glob('./Pages/**/*.jsx'),
            ).then((module) => {
                const pageComponent = module.default;
                const originalLayout = pageComponent.layout;

                pageComponent.layout = (pageNode) => {
                    const layoutElement = originalLayout
                        ? (typeof originalLayout === 'function' && originalLayout.length > 0
                            ? originalLayout(pageNode)
                            : React.createElement(originalLayout, {}, pageNode))
                        : pageNode;

                    return (
                        <GlobalProviderLayout>
                            {layoutElement}
                        </GlobalProviderLayout>
                    );
                };
                return module;
            }),
        setup: ({ App, props }) => {
            const ziggy = props.initialPage.props.ziggy || Ziggy;
            if (ziggy) {
                global.route = (name, params, absolute) =>
                    route(name, params, absolute, {
                        ...ziggy,
                        location: new URL(ziggy.location || Ziggy.url),
                    });
            }

            return <App {...props} />;
        },
    })
);
