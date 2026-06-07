import React from 'react';

export default function SectionHeader({ title, description, className = '' }) {
    return (
        <div className={`mb-6 ${className}`}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
            {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
    );
}
