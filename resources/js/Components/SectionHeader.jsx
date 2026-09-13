import React from 'react';

export default function SectionHeader({ title, description, className = '' }) {
    return (
        <div className={`mb-6 ${className}`}>
            <h3 className="text-lg font-bold text-ink">{title}</h3>
            {description && <p className="text-sm text-ink-muted">{description}</p>}
        </div>
    );
}
