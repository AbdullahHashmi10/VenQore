export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-line text-brand-600 shadow-sm focus:ring-brand-500 dark:border-line dark:bg-app dark:focus:ring-brand-600 dark:focus:ring-offset-gray-800 ' +
                className
            }
        />
    );
}
