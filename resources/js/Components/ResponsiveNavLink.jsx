import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                active
                    ? 'border-brand-400 bg-brand-50 text-brand-700 focus:border-brand-700 focus:bg-brand-100 focus:text-brand-800 dark:border-brand-600 dark:bg-brand-900/50 dark:text-brand-300 dark:focus:border-brand-300 dark:focus:bg-brand-900 dark:focus:text-brand-200'
                    : 'border-transparent text-ink-secondary hover:border-line-strong hover:bg-interactive-hover hover:text-ink focus:border-line-strong focus:bg-interactive-active focus:text-ink dark:text-ink-secondary dark:hover:border-line-strong dark:hover:bg-interactive-hover dark:hover:text-neutral-200 dark:focus:border-line-strong dark:focus:bg-interactive-active dark:focus:text-neutral-200'
            } text-base font-medium transition duration-fast ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
