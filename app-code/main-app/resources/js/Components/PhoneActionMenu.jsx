import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { router, usePage } from '@inertiajs/react';
import { useTermText } from '@/lib/terms';
import {
    ArrowDownLeft, ArrowUpRight, Building2, Box, FileText, RefreshCw, Tag,
    PackageCheck, PackageMinus, CheckCircle2, ShoppingCart, ShoppingBag, X,
} from 'lucide-react';

/*
 * Phone quick-action menu (opened from the + in the bottom bar).
 * Same actions as the desktop sidebar's ACTIONS menu, laid out as one
 * non-scrolling grid that fills the screen.
 */
const ACTIONS = [
    { label: 'New Sale', icon: ShoppingCart, tone: 'emerald', route: 'store.sales.invoice.create', perm: 'sales.create' },
    { label: 'New Purchase', icon: ShoppingBag, tone: 'amber', route: 'store.purchases.create', perm: 'purchases.create' },
    { label: 'Payment In', icon: ArrowDownLeft, tone: 'emerald', route: 'store.payments.in', perm: 'finance.receive_payment' },
    { label: 'Payment Out', icon: ArrowUpRight, tone: 'rose', route: 'store.payments.out', perm: 'finance.send_payment' },
    { label: 'Add Product', icon: Box, tone: 'teal', route: 'store.inventory.create', perm: 'inventory.create' },
    { label: 'New Quote', icon: FileText, tone: 'indigo', route: 'store.proposals.create', perm: 'sales.quotations' },
    { label: 'Goods In', icon: PackageCheck, tone: 'teal', route: 'store.purchases.goods-in', perm: 'purchases.receive' },
    { label: 'Goods Out', icon: PackageMinus, tone: 'indigo', route: 'store.sales.goods-out', perm: 'sales.dispatch' },
    { label: 'Transfer Stock', icon: RefreshCw, tone: 'orange', route: 'store.stock-transfers.create', perm: 'inventory.transfer' },
    { label: 'Add Bank', icon: Building2, tone: 'sky', route: 'store.bank-accounts.index', params: { action: 'add' }, perm: 'finance.journal' },
    { label: 'Add Category', icon: Tag, tone: 'teal', route: 'store.categories.index', perm: 'inventory.create' },
    { label: 'Approvals', icon: CheckCircle2, tone: 'amber', route: 'store.approvals.inbox', perm: 'approvals.view' },
];

const TONE = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
};

export default function PhoneActionMenu({ isOpen, onClose }) {
    const { store, auth } = usePage().props;
    const tt = useTermText();

    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
    }, [isOpen, onClose]);

    if (!isOpen || typeof document === 'undefined') return null;

    const perms = auth?.user?.permissions || [];
    const can = (p) => auth?.user?.is_platform_admin || auth?.user?.role === 'owner' || perms.includes('*') || perms.includes(p);
    const items = ACTIONS.filter(a => can(a.perm));

    const go = (a) => {
        onClose();
        try {
            if (typeof route === 'function' && store?.slug) router.visit(route(a.route, { store_slug: store.slug, ...(a.params || {}) }));
        } catch (e) { /* route missing */ }
    };

    return createPortal(
        <div className="lg:hidden fixed inset-0 z-[2100] flex flex-col" role="dialog" aria-modal="true" aria-label="Quick actions">
            <div className="absolute inset-0 backdrop-blur-md" style={{ background: 'rgba(13,20,18,0.55)' }} onClick={onClose} />
            <div className="relative flex-1 min-h-0 flex flex-col justify-center px-3 pt-[max(16px,env(safe-area-inset-top))]">
                <div className="text-center text-xs font-semibold uppercase tracking-wider text-white/70 mb-3">Quick actions</div>
                <div className="grid grid-cols-3 gap-2 content-center" style={{ gridAutoRows: 'minmax(0, 104px)' }}>
                    {items.map((a, i) => {
                        const Icon = a.icon;
                        return (
                            <button
                                key={a.label}
                                type="button"
                                onClick={() => go(a)}
                                style={{ animation: `vqPop 0.22s cubic-bezier(.2,.8,.2,1) ${i * 18}ms both` }}
                                className="flex flex-col items-center justify-center gap-2 rounded-xl bg-surface border border-line shadow-lg px-1 active:scale-95 transition-transform"
                            >
                                <span className={`h-11 w-11 rounded-lg flex items-center justify-center ${TONE[a.tone]}`}>
                                    <Icon size={22} />
                                </span>
                                <span className="text-[12px] font-semibold text-ink text-center leading-tight">{tt(a.label)}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="relative shrink-0 flex justify-center pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close quick actions"
                    className="h-14 w-14 rounded-full bg-gradient-brand text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
                >
                    <X size={26} />
                </button>
            </div>
        </div>,
        document.body
    );
}
