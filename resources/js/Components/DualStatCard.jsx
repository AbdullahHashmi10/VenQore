import React from 'react';
import PremiumDropdown from './PremiumDropdown';

const DualStatCard = ({
    title,
    leftLabel, leftValue,
    rightLabel, rightValue,
    value, subValue, // Single stat props
    icon: Icon,
    colorClass,
    color,
    period = 'Today',
    onPeriodChange,
    delay = 0,
    compact = false,
    onLeftClick,
    onRightClick,
}) => {
    // Determine color classes safely
    const baseColor = color || (colorClass ? colorClass.split('-')[1] : 'indigo');
    const bgClass = colorClass || `bg-${baseColor}-500`;
    const textClass = `text-${baseColor}-600`;
    const bgOpacityClass = `bg-${baseColor}-50`;

    // Determine if single or dual mode
    const isSingle = !!value;

    // Compact horizontal layout
    if (compact || isSingle) {
        return (
            <div
                className="bg-surface rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-line relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-slow"
                style={{ animationDelay: `${delay}ms` }}
            >
                <div className={`absolute -right-6 -top-6 w-20 h-20 ${bgClass} opacity-10 rounded-full blur-2xl transition-transform duration-slower ease-in-out`}></div>

                <div className="flex items-center justify-between relative z-10 w-full">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${bgOpacityClass} dark:bg-opacity-10 ${textClass}`}>
                            <Icon size={18} className="text-current" />
                        </div>
                        <div>
                            <h3 className="font-bold text-ink-secondary text-xs uppercase tracking-wide">{title}</h3>
                            {subValue && <p className="text-2xs font-medium text-ink-muted">{subValue}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {onPeriodChange && (
                            <PremiumDropdown
                                value={period}
                                onChange={onPeriodChange}
                                options={[
                                    { value: 'Today', label: 'Today' },
                                    { value: 'Month', label: 'Month' },
                                    { value: 'Year', label: 'Year' },
                                    { value: 'All Time', label: 'All Time' },
                                ]}
                            />
                        )}
                        <p className={`text-2xl font-bold text-ink tracking-tight`}>{value}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Original dual layout (for dual value cards)
    return (
        <div
            className="bg-surface rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none border border-line relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-slow h-full flex flex-col justify-center gap-2"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`absolute -right-4 -top-4 w-20 h-20 ${bgClass} opacity-10 rounded-full blur-2xl transition-transform duration-slower ease-in-out`}></div>

            <div className="flex items-center gap-3 relative z-10 shrink-0">
                <div className={`p-2 rounded-xl ${bgOpacityClass} dark:bg-opacity-10 ${textClass}`}>
                    <Icon size={18} className="text-current" />
                </div>
                <h3 className="font-bold text-ink-secondary text-xs uppercase tracking-wide">{title}</h3>

                {onPeriodChange && (
                    <div className="ml-auto">
                        <PremiumDropdown
                            value={period}
                            onChange={onPeriodChange}
                            options={[
                                { value: 'Today', label: 'Today' },
                                { value: 'Month', label: 'Month' },
                                { value: 'Year', label: 'Year' },
                                { value: 'All Time', label: 'All Time' },
                            ]}
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10 grow items-center">
                {/* Vertical Divider */}
                <div className="absolute left-1/2 top-1 bottom-1 w-px bg-sunken -translate-x-1/2"></div>

                <div className={`text-center ${onLeftClick ? 'cursor-pointer transition-transform' : ''}`} onClick={onLeftClick}>
                    <p className="text-2xs uppercase font-bold text-ink-muted mb-1 tracking-wider">{leftLabel}</p>
                    <p className="text-lg font-bold text-ink tracking-tight leading-none">{leftValue}</p>
                </div>
                <div className={`text-center ${onRightClick ? 'cursor-pointer transition-transform' : ''}`} onClick={onRightClick}>
                    <p className="text-2xs uppercase font-bold text-ink-muted mb-1 tracking-wider">{rightLabel}</p>
                    <p className="text-lg font-bold text-ink tracking-tight leading-none">{rightValue}</p>
                </div>
            </div>
        </div>
    );
};

export default DualStatCard;
