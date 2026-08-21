import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight, Home } from 'lucide-react';

/**
 * PageHeader - Consistent page header with breadcrumbs and actions
 * 
 * @param {String} title - Page title
 * @param {String} subtitle - Optional subtitle
 * @param {Array} breadcrumbs - [{label, href}] - last item is current page (no href)
 * @param {ReactNode} actions - Action buttons to display on right
 * @param {String} icon - Lucide icon component to display
 */
export default function PageHeader({
    title,
    subtitle,
    breadcrumbs = [],
    actions,
    icon: Icon
}) {
    const { store } = usePage().props;
    return (
        <div className="mb-6">
            {/* Breadcrumbs */}
            {/* Breadcrumbs - Disabled as per user request */}
            {/* {breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1 text-sm mb-3">
                    <Link
                        href={route('store.home', { store_slug: store?.slug })}
                        className="text-ink-muted hover:text-brand-600 transition-colors"
                    >
                        <Home size={14} />
                    </Link>
                    {breadcrumbs.map((crumb, idx) => (
                        <React.Fragment key={idx}>
                            <ChevronRight size={14} className="text-neutral-300 dark:text-ink-secondary" />
                            {crumb.href ? (
                                <Link
                                    href={crumb.href}
                                    className="text-ink-muted hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-ink-secondary dark:text-ink font-medium">
                                    {crumb.label}
                                </span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
            )} */}

            {/* Title Row */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="p-2.5 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl">
                            <Icon size={24} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-ink tracking-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-sm text-ink-muted mt-0.5">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {actions && (
                    <div className="flex items-center gap-3">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
