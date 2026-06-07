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
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                        <Home size={14} />
                    </Link>
                    {breadcrumbs.map((crumb, idx) => (
                        <React.Fragment key={idx}>
                            <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
                            {crumb.href ? (
                                <Link
                                    href={crumb.href}
                                    className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-slate-700 dark:text-slate-200 font-medium">
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
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Icon size={24} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
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
