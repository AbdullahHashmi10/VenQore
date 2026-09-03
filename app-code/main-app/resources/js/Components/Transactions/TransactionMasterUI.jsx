import React from 'react';
import {
    Search,
    BarChart3,
    FileSpreadsheet,
    Printer,
    MoreVertical,
    Mail,
    MessageCircle,
    Share2,
    Eye,
    RefreshCcw,
    FileText,
    History,
    Trash2,
    Copy,
    X,
    ChevronUp,
    ChevronDown,
    CornerUpRight,
    CheckSquare,
    Square,
    Edit,
    Truck,
    XCircle,
    Clock,
    File
} from 'lucide-react';

// ==========================================
// PHASE 1: STATS CARDS
// ==========================================

export const StatCard = ({
    icon: Icon,
    iconBgClass = 'bg-brand-100 dark:bg-brand-900/30',
    iconColorClass = 'text-brand-600 dark:text-brand-400',
    label,
    value,
    valueColorClass = 'text-ink'
}) => {
    return (
        <div className="bg-surface p-4 rounded-xl border border-line shadow-sm flex items-center gap-4">
            <div className={`p-3 ${iconBgClass} ${iconColorClass} rounded-lg`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">{label}</p>
                <p className={`text-xl font-bold ${valueColorClass}`}>{value}</p>
            </div>
        </div>
    );
};

export const TotalSaleCard = ({ value, formatCurrency }) => {
    return (
        <StatCard
            icon={FileText}
            iconBgClass="bg-brand-100 dark:bg-brand-900/30"
            iconColorClass="text-brand-600 dark:text-brand-400"
            label="Total Sale"
            value={formatCurrency ? formatCurrency(value) : `Rs ${value?.toLocaleString() || 0}`}
            valueColorClass="text-ink"
        />
    );
};

export const PaidAmountCard = ({ value, formatCurrency }) => {
    return (
        <StatCard
            icon={CheckSquare}
            iconBgClass="bg-emerald-100 dark:bg-emerald-900/30"
            iconColorClass="text-emerald-600 dark:text-emerald-400"
            label="Paid Amount"
            value={formatCurrency ? formatCurrency(value) : `Rs ${value?.toLocaleString() || 0}`}
            valueColorClass="text-emerald-600"
        />
    );
};

export const UnpaidDueCard = ({ value, formatCurrency }) => {
    return (
        <StatCard
            icon={Clock}
            iconBgClass="bg-rose-100 dark:bg-rose-900/30"
            iconColorClass="text-rose-600 dark:text-rose-400"
            label="Unpaid (Due)"
            value={formatCurrency ? formatCurrency(value) : `Rs ${value?.toLocaleString() || 0}`}
            valueColorClass="text-rose-600"
        />
    );
};

export const TransactionCountCard = ({ value }) => {
    return (
        <StatCard
            icon={History}
            iconBgClass="bg-blue-100 dark:bg-blue-900/30"
            iconColorClass="text-blue-600 dark:text-blue-400"
            label="Transactions"
            value={value || 0}
            valueColorClass="text-ink"
        />
    );
};

export const StatsCardsGrid = ({ children }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
            {children}
        </div>
    );
};

// ==========================================
// PHASE 2: HEADER & FILTERING
// ==========================================

export const FilterPill = ({ label, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1 text-2xs font-bold uppercase rounded-full transition-all ${isActive
                ? 'bg-brand-600 text-white'
                : 'bg-sunken text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover'
                }`}
        >
            {label}
        </button>
    );
};

export const FilterPillGroup = ({ activeFilter, onFilterChange, filters = ['all', 'today', 'month', 'year'], activeColorClass = "bg-brand-600 text-white" }) => {
    const labels = {
        all: 'All',
        today: 'Today',
        month: 'This Month',
        year: 'This Year'
    };

    return (
        <div className="flex items-center gap-2">
            {filters.map(filter => (
                <button
                    key={filter}
                    onClick={() => onFilterChange(filter)}
                    className={`px-3 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === filter
                        ? activeColorClass
                        : 'bg-sunken text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover'
                        }`}
                >
                    {labels[filter] || filter}
                </button>
            ))}
        </div>
    );
};

export const DateRangePicker = ({ dateRange, onDateChange }) => {
    return (
        <div className="flex items-center gap-1 bg-app px-2 py-1 rounded-lg border border-line">
            <span className="text-2xs font-bold text-ink-muted uppercase mr-1">Range:</span>
            <input
                type="date"
                name="from"
                value={dateRange.from || ''}
                onChange={onDateChange}
                className="bg-transparent border-none p-0 text-xs font-bold text-ink-secondary w-28 focus:ring-0"
            />
            <span className="text-neutral-300">→</span>
            <input
                type="date"
                name="to"
                value={dateRange.to || ''}
                onChange={onDateChange}
                className="bg-transparent border-none p-0 text-xs font-bold text-ink-secondary w-28 focus:ring-0"
            />
        </div>
    );
};

export const TransactionSearchBar = ({ value, onChange, onKeyDown, placeholder = "Search..." }) => {
    return (
        <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                className="pl-9 pr-4 py-2 bg-sunken border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-500 w-full transition-all font-bold"
            />
        </div>
    );
};

export const ActionButton = ({ icon: Icon, onClick, href, title, colorClass = "text-ink-secondary", hoverBgClass = "hover:bg-interactive-hover dark:hover:bg-interactive-hover" }) => {
    const className = `p-2 ${hoverBgClass} rounded-lg ${colorClass} transition-colors`;

    if (href) {
        return (
            <a href={href} className={className} title={title} target="_blank" rel="noopener noreferrer">
                <Icon size={20} />
            </a>
        );
    }

    return (
        <button onClick={onClick} className={className} title={title}>
            <Icon size={20} />
        </button>
    );
};

export const ActionIconGroup = ({ exportHref, analyticsHref, onPrint }) => {
    return (
        <div className="flex items-center gap-1 border-l border-line pl-2 ml-2">
            {exportHref && (
                <ActionButton
                    icon={FileSpreadsheet}
                    href={exportHref}
                    title="Export to Excel"
                    colorClass="text-emerald-600 dark:text-emerald-500"
                    hoverBgClass="hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                />
            )}
            {analyticsHref && (
                <ActionButton
                    icon={BarChart3}
                    href={analyticsHref}
                    title="Analytics"
                />
            )}
            {onPrint && (
                <ActionButton
                    icon={Printer}
                    onClick={onPrint}
                    title="Print Page"
                />
            )}
        </div>
    );
};

export const PageHeader = ({
    title,
    highlightedTitle,
    activeFilter,
    onFilterChange,
    dateRange,
    onDateChange,
    searchTerm,
    onSearchChange,
    onSearchKeyDown,
    exportHref,
    analyticsHref,
    onPrint
}) => {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-line shadow-sm shrink-0">
            <div className="flex flex-col gap-1">
                <h1 className="text-xl font-bold text-ink uppercase tracking-tight">
                    {title} <span className="text-brand-600">{highlightedTitle}</span>
                </h1>
                <FilterPillGroup activeFilter={activeFilter} onFilterChange={onFilterChange} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <DateRangePicker dateRange={dateRange} onDateChange={onDateChange} />
                <div className="w-48">
                    <TransactionSearchBar
                        value={searchTerm}
                        onChange={onSearchChange}
                        onKeyDown={onSearchKeyDown}
                    />
                </div>
                <ActionIconGroup
                    exportHref={exportHref}
                    analyticsHref={analyticsHref}
                    onPrint={onPrint}
                />
            </div>
        </div>
    );
};

export const ActionBarRow = ({ children, label = "Manage your records" }) => {
    return (
        <div className="flex justify-between items-center shrink-0">
            <div className="text-sm text-ink-muted">{label}</div>
            <div className="flex gap-2">
                {children}
            </div>
        </div>
    );
};

export const NewActionButton = ({ href, label, variant = 'secondary', bgClass = "" }) => {
    const baseClasses = "px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2";
    let variantClasses = "";

    if (bgClass) {
        variantClasses = `${bgClass} text-white shadow-sm`;
    } else {
        variantClasses = variant === 'primary'
            ? "bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
            : "bg-surface border border-line hover:bg-interactive-hover dark:hover:bg-interactive-hover";
    }

    return (
        <a href={href} className={`${baseClasses} ${variantClasses}`}>
            {label}
        </a>
    );
};

// ==========================================
// PHASE 3: TABLE STRUCTURE
// ==========================================

export const TableContainer = ({ children }) => {
    return (
        <div className="flex-1 overflow-visible rounded-xl border border-line shadow-sm bg-surface">
            {children}
        </div>
    );
};

export const TransactionTable = ({ children }) => {
    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
                {children}
            </table>
        </div>
    );
};

export const SortableTableHeader = ({
    column,
    index,
    sortConfig,
    onSort,
    draggedColumn,
    onDragStart,
    onDragOver,
    onDrop,
    label,
    align = "left"
}) => {
    // Support both column object and direct props
    const colObj = column || { label, key: label?.toLowerCase() };
    const isSorted = sortConfig?.key === colObj.key;
    const isBeingDragged = draggedColumn === index;

    return (
        <th
            draggable={colObj.key !== 'actions'}
            onDragStart={(e) => onDragStart?.(e, index)}
            onDragOver={(e) => onDragOver?.(e, index)}
            onDrop={(e) => onDrop?.(e, index)}
            onClick={() => colObj.key !== 'actions' && onSort?.(colObj.key)}
            className={`
                p-4 text-xs font-bold text-ink-muted uppercase tracking-wider 
                cursor-pointer select-none hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors
                ${align === 'right' ? 'text-right' : ''}
                ${isBeingDragged ? 'opacity-50 border-2 border-dashed border-brand-500' : ''}
`}
            style={{ width: colObj.width }}
        >
            <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
                {colObj.label}
                {colObj.key !== 'actions' && isSorted && (
                    sortConfig.direction === 'asc'
                        ? <ChevronUp size={14} className="text-brand-500" />
                        : <ChevronDown size={14} className="text-brand-500" />
                )}
            </div>
        </th>
    );
};

export const TableHeaderRow = ({
    columns,
    sortConfig,
    onSort,
    draggedColumn,
    onDragStart,
    onDragOver,
    onDrop,
    children
}) => {
    return (
        <thead>
            <tr className="bg-app border-b border-line">
                {columns ? columns.map((col, index) => (
                    <SortableTableHeader
                        key={col.key || index}
                        column={col}
                        index={index}
                        sortConfig={sortConfig}
                        onSort={onSort}
                        draggedColumn={draggedColumn}
                        onDragStart={onDragStart}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                    />
                )) : children}
            </tr>
        </thead>
    );
};

export const TransactionRowWrapper = ({ children, onClick, onDoubleClick }) => {
    return (
        <tr
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            className="group hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors cursor-pointer border-b border-line last:border-none"
        >
            {children}
        </tr>
    );
};

export const TableCell = ({ children, className = "" }) => {
    return (
        <td className={`p-4 text-sm ${className}`}>
            {children}
        </td>
    );
};

export const EmptyStateRow = ({ colSpan, message = "No records found" }) => {
    return (
        <tr>
            <td colSpan={colSpan} className="p-20 text-center">
                <div className="flex flex-col items-center gap-3 opacity-20 dark:opacity-40">
                    <History size={48} />
                    <p className="font-bold text-xs uppercase tracking-widest">{message}</p>
                </div>
            </td>
        </tr>
    );
};

export const TableBody = ({ children }) => {
    return (
        <tbody className="divide-y divide-line">
            {children}
        </tbody>
    );
};

// ==========================================
// PHASE 4: CELL RENDERERS
// ==========================================

export const DateCell = ({ date, formatDate }) => {
    const formatted = formatDate
        ? formatDate(date)
        : new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <TableCell>
            <span className="text-ink-secondary font-medium">{formatted}</span>
        </TableCell>
    );
};

export const InvoiceNumberCell = ({ reference, onClick }) => {
    return (
        <TableCell>
            <span
                className="font-mono text-brand-600 dark:text-brand-400 font-bold cursor-pointer hover:underline"
                onClick={onClick}
            >
                {reference}
            </span>
        </TableCell>
    );
};

export const PartyNameCell = ({ name, phone }) => {
    return (
        <TableCell>
            <div className="flex flex-col">
                <span className="font-bold text-ink capitalize">{name || 'Walk-in'}</span>
                {phone && <span className="text-2xs font-bold text-ink-muted uppercase tracking-tight">{phone}</span>}
            </div>
        </TableCell>
    );
};

export const TransactionTypeBadge = ({ type = 'sale' }) => {
    const styles = {
        sale: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
        purchase: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
        return: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
        expense: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
        payment: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400'
    };

    return (
        <span className={`text-2xs font-bold uppercase px-2 py-0.5 rounded-md ${styles[type] || styles.sale}`}>
            {type}
        </span>
    );
};

export const PaymentTypeCell = ({ method }) => {
    return (
        <TableCell>
            <span className="uppercase text-2xs font-bold text-ink-muted bg-sunken px-2 py-0.5 rounded-md">
                {method || '-'}
            </span>
        </TableCell>
    );
};

export const AmountCell = ({ amount, formatCurrency }) => {
    const formatted = formatCurrency
        ? formatCurrency(amount)
        : `Rs ${parseFloat(amount || 0).toLocaleString()}`;

    return (
        <TableCell className="text-right">
            <span className="font-bold text-ink">{formatted}</span>
        </TableCell>
    );
};

export const BalanceCell = ({ total, paid, formatCurrency }) => {
    const balance = parseFloat(total) - parseFloat(paid || 0);
    const formatted = formatCurrency
        ? formatCurrency(Math.abs(balance))
        : `Rs ${Math.abs(balance).toLocaleString()}`;

    // Tolerance of 1 for floating point diffs
    if (balance > 1) {
        return <span className="text-red-500 font-bold">{formatted}</span>;
    }
    if (balance < -1) {
        return <span className="text-blue-600 font-bold" title="Overpaid Amount">+{formatted}</span>;
    }
    return (
        <span className="text-emerald-500 text-2xs font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
            Settled
        </span>
    );
};

export const StatusBadge = ({ status }) => {
    const styles = {
        paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
        unpaid: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
        partial: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
        draft: 'bg-neutral-100 text-ink-secondary dark:bg-surface dark:text-ink-muted',
        sent: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
        accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
        declined: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
    };

    return (
        <span className={`px-3 py-1 rounded-lg text-2xs font-bold uppercase tracking-wider ${styles[status] || styles.draft}`}>
            {status}
        </span>
    );
};

// ==========================================
// PHASE 5: ACTIONS & MENUS
// ==========================================

export const ActionMenuItem = ({ icon: Icon, label, onClick, href, variant = 'default', className = "" }) => {
    const baseClasses = "w-full text-left px-3 py-2 rounded flex items-center gap-2 text-sm transition-colors font-bold";
    const variantClasses = {
        default: "hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary",
        danger: "hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
    };

    const combinedClasses = `${baseClasses} ${variantClasses[variant] || variantClasses.default} ${className}`;

    if (href) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={combinedClasses} onClick={(e) => e.stopPropagation()}>
                {Icon && <Icon size={14} />}
                {label}
            </a>
        );
    }

    return (
        <button onClick={(e) => { e.stopPropagation(); onClick?.(); }} className={combinedClasses}>
            {Icon && <Icon size={14} />}
            {label}
        </button>
    );
};

export const SharePopup = ({ isOpen, onEmailClick, onWhatsAppClick }) => {
    if (!isOpen) return null;

    return (
        <div className="absolute right-0 top-full mt-2 w-40 bg-surface rounded-xl shadow-xl border border-line p-1 z-50 animate-in zoom-in-95">
            <ActionMenuItem icon={Mail} label="Email" onClick={onEmailClick} />
            <ActionMenuItem icon={MessageCircle} label="WhatsApp" onClick={onWhatsAppClick} />
        </div>
    );
};

export const RowActionMenu = ({
    isOpen,
    row,
    onEdit,
    onReturn,
    onConvert,
    convertLabel,
    onDeliveryChallan,
    onPaymentHistory,
    onCancel,
    onDelete,
    onDuplicate,
    onPreview,
    onViewHistory,
    printHref
}) => {
    if (!isOpen) return null;

    return (
        <div className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-xl shadow-xl border border-line p-1 z-50 animate-in zoom-in-95">
            <div className="py-1">
                <ActionMenuItem icon={Edit} label="View/Edit" onClick={onEdit} />
                {onReturn && <ActionMenuItem icon={RefreshCcw} label="Convert To Return" onClick={onReturn} />}
                {onConvert && <ActionMenuItem icon={RefreshCcw} label={convertLabel || "Convert"} onClick={onConvert} />}
                <ActionMenuItem icon={Truck} label="Preview Delivery Challan" onClick={onDeliveryChallan} />
                <ActionMenuItem icon={History} label="Payment History" onClick={onPaymentHistory} />
                <ActionMenuItem icon={XCircle} label="Cancel Invoice" onClick={onCancel} variant="danger" />
                <div className="h-px bg-sunken my-1"></div>
                <ActionMenuItem icon={Trash2} label="Delete" onClick={onDelete} variant="danger" />
                <ActionMenuItem icon={Copy} label="Duplicate" onClick={onDuplicate} />
                <ActionMenuItem icon={FileText} label="Open PDF" href={printHref} />
                <ActionMenuItem icon={Eye} label="Preview" onClick={onPreview} />
                <ActionMenuItem icon={Printer} label="Print" href={printHref} />
                <ActionMenuItem icon={Clock} label="View History" onClick={onViewHistory} />
            </div>
        </div>
    );
};

export const RowActionsCell = ({
    row,
    printHref,
    activeSharePopup,
    onShareToggle,
    activeActionMenu,
    onMenuToggle,
    onEmailClick,
    onWhatsAppClick,
    onEdit,
    onReturn,
    onConvert,
    convertLabel,
    onDeliveryChallan,
    onPaymentHistory,
    onCancel,
    onDelete,
    onDuplicate,
    onPreview,
    onViewHistory
}) => {
    return (
        <TableCell>
            <div className="flex items-center justify-end gap-2 relative">
                <a
                    href={printHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-600 transition-colors"
                >
                    <Printer size={16} />
                </a>

                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); onShareToggle?.(row.id); }}
                        className={`p-1.5 rounded-lg transition-colors ${activeSharePopup === row.id ? 'text-brand-600 bg-sunken shadow-inner' : 'text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover'}`}
                    >
                        <CornerUpRight size={16} />
                    </button>
                    <SharePopup
                        isOpen={activeSharePopup === row.id}
                        onEmailClick={() => onEmailClick?.(row)}
                        onWhatsAppClick={() => onWhatsAppClick?.(row)}
                    />
                </div>

                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); onMenuToggle?.(row.id); }}
                        className={`p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? 'text-brand-600 bg-sunken shadow-inner' : 'text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover'}`}
                    >
                        <MoreVertical size={16} />
                    </button>
                    <RowActionMenu
                        isOpen={activeActionMenu === row.id}
                        row={row}
                        printHref={printHref}
                        onEdit={() => onEdit?.(row)}
                        onReturn={() => onReturn?.(row)}
                        onConvert={() => onConvert?.(row)}
                        convertLabel={convertLabel}
                        onDeliveryChallan={() => onDeliveryChallan?.(row)}
                        onPaymentHistory={() => onPaymentHistory?.(row)}
                        onCancel={() => onCancel?.(row)}
                        onDelete={() => onDelete?.(row)}
                        onDuplicate={() => onDuplicate?.(row)}
                        onPreview={() => onPreview?.(row)}
                        onViewHistory={() => onViewHistory?.(row)}
                    />
                </div>
            </div>
        </TableCell>
    );
};
