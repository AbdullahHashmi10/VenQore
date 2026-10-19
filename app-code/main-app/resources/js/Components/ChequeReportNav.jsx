import { usePage } from '@inertiajs/react';
import { ArrowUpRight, ArrowDownLeft, BookOpen, Calendar } from 'lucide-react';

/** Title-dropdown groups for the four cheque report pages (desktop ListToolbar). */
export function useChequeReportNavGroups() {
    const slug = usePage().props.store?.slug;
    const r = (name) => route(name, { store_slug: slug });
    return [{
        id: 'cheque-reports',
        label: 'Cheque reports',
        items: [
            { id: 'outgoing', label: 'Outgoing Register', href: r('store.banking.reports.outgoing-cheques'), icon: ArrowUpRight },
            { id: 'incoming', label: 'Incoming Register', href: r('store.banking.reports.incoming-cheques'), icon: ArrowDownLeft },
            { id: 'utilization', label: 'Chequebook Utilization', href: r('store.banking.reports.cheque-utilization'), icon: BookOpen },
            { id: 'post-dated', label: 'Post-Dated Cheques', href: r('store.banking.reports.post-dated-cheques'), icon: Calendar },
        ],
    }];
}

/** h-10 date input matching the toolbar pills. */
export function ToolbarDate({ value, onChange, title }) {
    return (
        <input
            type="date"
            value={value}
            title={title}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 px-2 rounded-[12px] border border-line bg-app text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500"
        />
    );
}
