import React from 'react';
import { Link } from '@inertiajs/react';
import '../../../css/commerce-shop.css';
import { SHOP_MARK } from '@/lib/shopMark';

/** Shopper shell (VenQore Shops design): no merchant navigation, no account chrome. */
export default function PublicShell({ children, title }) {
    return (
        <div className="vqs-shop">
            <header className="vqs-topbar">
                <div className="vqs-wrap vqs-topbar-in">
                    <Link href="/shop" className="vqs-brand">
                        <img src={SHOP_MARK} alt="" width="30" height="30" />
                        <span>VenQore</span>
                        <span className="vqs-tag">Shops</span>
                    </Link>
                    <span className="vqs-spacer" />
                    {title && <span className="vqs-crumb">{title}</span>}
                </div>
            </header>
            <main className="vqs-wrap vqs-main">{children}</main>
            <footer className="vqs-wrap vqs-foot">
                Orders are requests to the business and are confirmed by them. Prices and availability are set by each business.
            </footer>
        </div>
    );
}
