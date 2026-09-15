import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-fast ease-in-out focus:outline-none ' +
                (active
                    ? 'border-brand-400 text-ink focus:border-brand-700 dark:border-brand-600 dark:text-ink'
                    : 'border-transparent text-ink-muted hover:border-line-strong hover:text-ink focus:border-line-strong focus:text-ink-secondary dark:text-ink-secondary dark:hover:border-line-strong dark:hover:text-neutral-300 dark:focus:border-line-strong dark:focus:text-neutral-300') +
                className
            }
        >
            {children}
        </Link>
    );
}
