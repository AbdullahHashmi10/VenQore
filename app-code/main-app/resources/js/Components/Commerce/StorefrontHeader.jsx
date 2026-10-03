import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ShoppingBag, Sun, Moon, Star, User, Package, Search, X, CheckCircle2, LogOut, ExternalLink, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/Contexts/ThemeContext';
import { shopToast } from '@/Components/Commerce/PublicShell';
import { money } from '@/lib/commerce';

function ThemeButton() {
    const { isDarkMode, toggleTheme } = useTheme();
    return (
        <button
            type="button"
            className="vq-sh-icon"
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
        >
            {isDarkMode ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
        </button>
    );
}

export default function StorefrontHeader({
    storeTitle,
    storeSlug,
    bag,
    ratingSummary: initialRatingSummary,
    customer: initialCustomer,
}) {
    const [scrolled, setScrolled] = useState(false);
    const [ratingSummary, setRatingSummary] = useState(initialRatingSummary || { average: null, count: 0, reviews: [] });
    const [customer, setCustomer] = useState(initialCustomer || null);

    // Modals
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showTrackModal, setShowTrackModal] = useState(false);

    // Rating Form State
    const [selectedStars, setSelectedStars] = useState(5);
    const [hoverStars, setHoverStars] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);

    // Customer Auth Form State (within modals)
    const [authName, setAuthName] = useState('');
    const [authPhone, setAuthPhone] = useState('');
    const [authEmail, setAuthEmail] = useState('');
    const [submittingAuth, setSubmittingAuth] = useState(false);
    const [authError, setAuthError] = useState('');

    // Order Track Form State
    const [trackNumber, setTrackNumber] = useState('');
    const [trackPhone, setTrackPhone] = useState('');
    const [trackLoading, setTrackLoading] = useState(false);
    const [trackError, setTrackError] = useState('');

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Sync initial props if they change
    useEffect(() => {
        if (initialRatingSummary) setRatingSummary(initialRatingSummary);
    }, [initialRatingSummary]);

    useEffect(() => {
        if (initialCustomer) setCustomer(initialCustomer);
    }, [initialCustomer]);

    // Handle Customer Login
    const handleCustomerLogin = async (e) => {
        if (e) e.preventDefault();
        setAuthError('');
        if (!authPhone.trim() || !authName.trim()) {
            setAuthError('Please enter your full name and phone number.');
            return;
        }
        setSubmittingAuth(true);
        try {
            const res = await axios.post(`/shop/${storeSlug}/customer/login`, {
                name: authName.trim(),
                phone: authPhone.trim(),
                email: authEmail.trim() || undefined,
            });
            if (res.data?.customer) {
                setCustomer(res.data.customer);
                shopToast(`Welcome back, ${res.data.customer.name}!`);
            }
        } catch (err) {
            setAuthError(err.response?.data?.message || 'Could not sign in. Please verify your details.');
        } finally {
            setSubmittingAuth(false);
        }
    };

    // Handle Customer Logout
    const handleCustomerLogout = async () => {
        try {
            await axios.post(`/shop/${storeSlug}/customer/logout`);
            setCustomer(null);
            setShowCustomerModal(false);
            shopToast('You have signed out as customer.');
        } catch {
            setCustomer(null);
        }
    };

    // Handle Rating Submit
    const handleRatingSubmit = async (e) => {
        e.preventDefault();
        setSubmittingRating(true);
        try {
            const payload = {
                rating: selectedStars,
                review: reviewComment.trim() || undefined,
            };
            if (!customer) {
                payload.name = authName.trim();
                payload.phone = authPhone.trim();
                payload.email = authEmail.trim() || undefined;
            }
            const res = await axios.post(`/shop/${storeSlug}/rate`, payload);
            if (res.data?.success) {
                if (res.data.rating_summary) {
                    setRatingSummary(res.data.rating_summary);
                }
                if (!customer && (authName.trim() || authPhone.trim())) {
                    setCustomer({
                        name: authName.trim(),
                        phone: authPhone.trim(),
                        has_reviewed: true,
                        orders: [],
                    });
                }
                setShowRatingModal(false);
                setReviewComment('');
                shopToast('Thank you! Your rating has been recorded.');
            }
        } catch (err) {
            shopToast(err.response?.data?.message || 'Failed to submit rating. Please check your details.');
        } finally {
            setSubmittingRating(false);
        }
    };

    // Handle Direct Order Lookup
    const handleTrackOrder = async (e) => {
        e.preventDefault();
        setTrackError('');
        if (!trackNumber.trim() || !trackPhone.trim()) {
            setTrackError('Please provide both your order number and phone number.');
            return;
        }
        setTrackLoading(true);
        try {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/order-lookup';
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (csrf) {
                const tokenInput = document.createElement('input');
                tokenInput.type = 'hidden';
                tokenInput.name = '_token';
                tokenInput.value = csrf;
                form.appendChild(tokenInput);
            }
            const numInput = document.createElement('input');
            numInput.type = 'hidden';
            numInput.name = 'number';
            numInput.value = trackNumber.trim();
            form.appendChild(numInput);

            const phoneInput = document.createElement('input');
            phoneInput.type = 'hidden';
            phoneInput.name = 'phone';
            phoneInput.value = trackPhone.trim();
            form.appendChild(phoneInput);

            document.body.appendChild(form);
            form.submit();
        } catch {
            setTrackError('Failed to search order. Please try again.');
            setTrackLoading(false);
        }
    };

    return (
        <>
            <header
                className={`vq-sh vq-sh--storefront${scrolled ? ' is-scrolled' : ''}`}
                data-site-header=""
            >
                <div className="vq-sh__glass" aria-hidden="true" />
                <div className="vq-sh__inner">
                    {/* LEFT: Logo & Storefront identity */}
                    <div className="vq-sh__brand-wrap">
                        <a className="vq-btn-plain vq-sh__brand" href="/shop" title="Explore all shops on VenQore">
                            <img src="/v6/assets/logo.png" alt="VenQore" width="28" height="28" />
                            <span>VenQore</span>
                        </a>
                    </div>

                    {/* CENTER: Store name + Rating display & trigger */}
                    <div className="vq-sh__store-center">
                        <div className="vq-sh__store-name" title={storeTitle}>
                            {storeTitle || 'Online Store'}
                        </div>
                        <button
                            type="button"
                            className="vq-sh__rate-pill"
                            onClick={() => setShowRatingModal(true)}
                            title="Rate this store and view customer reviews"
                        >
                            <span className="vq-sh__rate-stars">
                                <Star size={13} className="star-filled" fill="currentColor" />
                                <b>{ratingSummary?.average ? ratingSummary.average.toFixed(1) : '5.0'}</b>
                            </span>
                            <span className="vq-sh__rate-count">
                                {ratingSummary?.count > 0 ? `(${ratingSummary.count})` : '· Rate Store'}
                            </span>
                        </button>
                    </div>

                    {/* RIGHT: Actions (Track Order, Shopping Bag, Theme Toggle, Customer Account) */}
                    <div className="vq-sh__store-actions">
                        {/* Track Order */}
                        <button
                            type="button"
                            className="vq-sh__track-btn"
                            onClick={() => {
                                if (customer && customer.orders?.length > 0) {
                                    setShowCustomerModal(true);
                                } else {
                                    setShowTrackModal(true);
                                }
                            }}
                            title="Track an existing order"
                        >
                            <Package size={15} />
                            <span>Track Order</span>
                        </button>

                        {/* Shopping Cart Bag */}
                        {bag && (
                            <button
                                type="button"
                                className={`vq-sh-bagbtn ${bag.bump ? 'bump' : ''}`}
                                onClick={bag.onClick}
                                aria-label={`Open shopping cart, ${bag.count || 0} items`}
                                title={`Shopping cart (${bag.count || 0} items)`}
                            >
                                <ShoppingBag size={17} aria-hidden="true" />
                                {bag.count > 0 && (
                                    <span className="vq-sh-bagbadge" key={bag.count}>
                                        {bag.count}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Theme Toggle (Light / Dark) */}
                        <ThemeButton />

                        {/* Customer Account Button */}
                        {customer ? (
                            <button
                                type="button"
                                className="vq-sh__cust-btn vq-sh__cust-btn--active"
                                onClick={() => setShowCustomerModal(true)}
                                title={`Signed in as ${customer.name}. View order history.`}
                            >
                                <span className="vq-sh__cust-avatar">
                                    {customer.name?.charAt(0).toUpperCase() || 'C'}
                                </span>
                                <span className="vq-sh__cust-name">{customer.name.split(' ')[0]}</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="vq-sh__cust-btn"
                                onClick={() => setShowCustomerModal(true)}
                                title="Sign in as customer to view your orders and track history"
                            >
                                <User size={15} />
                                <span>Sign In</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* MODAL 1: Store Rating & Reviews Modal */}
            {showRatingModal && (
                <div className="vqs-scrim" onClick={() => setShowRatingModal(false)}>
                    <div className="vqs-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="vqs-modal-head">
                            <div>
                                <h3 className="vqs-modal-title">Customer Ratings & Reviews</h3>
                                <p className="vqs-muted" style={{ fontSize: 13, margin: '2px 0 0' }}>
                                    {storeTitle} · {ratingSummary.average ? `${ratingSummary.average.toFixed(1)} / 5.0 (${ratingSummary.count} reviews)` : 'Be the first to rate!'}
                                </p>
                            </div>
                            <button type="button" className="vqs-iconbtn" onClick={() => setShowRatingModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="vqs-modal-body">
                            {/* If user is not customer, prompt customer login */}
                            {!customer ? (
                                <div className="vqs-rating-auth-box">
                                    <div className="vqs-notice-pill">
                                        <ShieldCheck size={16} />
                                        <span>Customer Verification Required</span>
                                    </div>
                                    <p style={{ fontSize: 13.5, color: 'var(--vq-text-2)', margin: '8px 0 16px', lineHeight: 1.45 }}>
                                        To ensure authentic feedback from genuine shoppers, please sign in with your customer details to submit a rating.
                                    </p>
                                    {authError && <div className="vqs-err" style={{ marginBottom: 12 }}>{authError}</div>}
                                    <form onSubmit={handleCustomerLogin} style={{ display: 'grid', gap: 10 }}>
                                        <input
                                            type="text"
                                            className="vqs-input"
                                            placeholder="Your full name"
                                            value={authName}
                                            onChange={(e) => setAuthName(e.target.value)}
                                            required
                                        />
                                        <input
                                            type="tel"
                                            className="vqs-input"
                                            placeholder="Phone number (e.g. 0300...)"
                                            value={authPhone}
                                            onChange={(e) => setAuthPhone(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="submit"
                                            className="vqs-btn vqs-btn--full"
                                            disabled={submittingAuth}
                                        >
                                            {submittingAuth ? 'Signing In...' : 'Sign In as Customer to Rate'}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <form onSubmit={handleRatingSubmit} style={{ display: 'grid', gap: 14 }}>
                                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--vq-text-2)', marginBottom: 8 }}>
                                            Rate your experience with {storeTitle}:
                                        </div>
                                        <div className="vqs-stars-picker">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    type="button"
                                                    key={star}
                                                    className="vqs-star-pick"
                                                    onMouseEnter={() => setHoverStars(star)}
                                                    onMouseLeave={() => setHoverStars(0)}
                                                    onClick={() => setSelectedStars(star)}
                                                >
                                                    <Star
                                                        size={28}
                                                        fill={(hoverStars || selectedStars) >= star ? '#F5B32E' : 'none'}
                                                        stroke={(hoverStars || selectedStars) >= star ? '#F5B32E' : 'currentColor'}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#F5B32E', marginTop: 4 }}>
                                            {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][(hoverStars || selectedStars) - 1]}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="vqs-label">Your Review (Optional)</label>
                                        <textarea
                                            className="vqs-textarea"
                                            rows={3}
                                            placeholder="How was the product quality, delivery speed, and service?"
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--vq-text-3)' }}>
                                        <ShieldCheck size={14} color="#0BAA8F" />
                                        <span>Posting as customer <b>{customer.name}</b></span>
                                    </div>

                                    <button
                                        type="submit"
                                        className="vqs-btn vqs-btn--full"
                                        disabled={submittingRating}
                                    >
                                        {submittingRating ? 'Submitting...' : 'Submit Rating'}
                                    </button>
                                </form>
                            )}

                            {/* Recent Customer Reviews */}
                            {ratingSummary.reviews && ratingSummary.reviews.length > 0 && (
                                <div style={{ marginTop: 24, borderTop: '1px solid var(--vq-line)', paddingTop: 16 }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>
                                        Recent Reviews ({ratingSummary.reviews.length})
                                    </h4>
                                    <div style={{ display: 'grid', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
                                        {ratingSummary.reviews.map((rev) => (
                                            <div key={rev.id} className="vqs-review-item">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{rev.customer_name}</span>
                                                    <span style={{ display: 'flex', gap: 2, color: '#F5B32E' }}>
                                                        {Array.from({ length: rev.rating }).map((_, i) => (
                                                            <Star key={i} size={12} fill="#F5B32E" stroke="#F5B32E" />
                                                        ))}
                                                    </span>
                                                </div>
                                                {rev.review && <p style={{ fontSize: 12.5, color: 'var(--vq-text-2)', margin: '4px 0 0' }}>{rev.review}</p>}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--vq-text-3)', marginTop: 4 }}>
                                                    {rev.is_verified ? <span style={{ color: '#0BAA8F' }}>✓ Verified Buyer</span> : <span>Verified Customer</span>}
                                                    <span>{rev.created_at}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: Customer Account & Orders History Portal */}
            {showCustomerModal && (
                <div className="vqs-scrim" onClick={() => setShowCustomerModal(false)}>
                    <div className="vqs-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="vqs-modal-head">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="vqs-cust-iconwrap">
                                    <User size={18} />
                                </div>
                                <div>
                                    <h3 className="vqs-modal-title">
                                        {customer ? `Customer Portal: ${customer.name}` : 'Customer Sign In'}
                                    </h3>
                                    <p className="vqs-muted" style={{ fontSize: 12.5, margin: 0 }}>
                                        {customer ? `Phone: ${customer.phone}` : 'Access your order history and track shipments'}
                                    </p>
                                </div>
                            </div>
                            <button type="button" className="vqs-iconbtn" onClick={() => setShowCustomerModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="vqs-modal-body">
                            {customer ? (
                                <div style={{ display: 'grid', gap: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 14, fontWeight: 600 }}>Your Orders with {storeTitle}</span>
                                        <button
                                            type="button"
                                            className="vqs-btn vqs-btn--soft"
                                            style={{ minHeight: 32, fontSize: 12, padding: '0 12px' }}
                                            onClick={() => {
                                                setShowCustomerModal(false);
                                                setShowRatingModal(true);
                                            }}
                                        >
                                            <Star size={13} fill="#F5B32E" stroke="#F5B32E" />
                                            <span>Rate Store</span>
                                        </button>
                                    </div>

                                    {customer.orders && customer.orders.length > 0 ? (
                                        <div style={{ display: 'grid', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
                                            {customer.orders.map((ord) => (
                                                <div key={ord.id} className="vqs-order-item">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div>
                                                            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' }}>
                                                                Order {ord.number}
                                                            </div>
                                                            <div style={{ fontSize: 12, color: 'var(--vq-text-3)', marginTop: 2 }}>
                                                                {ord.created_at} · {ord.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}
                                                            </div>
                                                        </div>
                                                        <span className={`vqs-badge vqs-badge--${ord.status === 'completed' ? 'ok' : ord.status === 'pending' ? 'warn' : 'info'}`}>
                                                            {ord.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--vq-line-soft)' }}>
                                                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                                                            {money(ord.total, ord.currency_symbol)}
                                                        </span>
                                                        {ord.status_url && (
                                                            <a
                                                                href={ord.status_url}
                                                                className="vqs-linkish"
                                                                style={{ fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                            >
                                                                <span>Live Status</span>
                                                                <ExternalLink size={12} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="vqs-empty-orders">
                                            <Package size={32} strokeWidth={1.5} color="var(--vq-text-3)" />
                                            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--vq-text-2)' }}>
                                                No past orders found under this phone number yet.
                                            </p>
                                        </div>
                                    )}

                                    <div style={{ paddingTop: 12, borderTop: '1px solid var(--vq-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <button
                                            type="button"
                                            className="vqs-btn vqs-btn--soft"
                                            onClick={handleCustomerLogout}
                                            style={{ color: 'var(--vq-danger)' }}
                                        >
                                            <LogOut size={14} />
                                            <span>Sign Out</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="vqs-btn"
                                            onClick={() => setShowCustomerModal(false)}
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleCustomerLogin} style={{ display: 'grid', gap: 12 }}>
                                    <p style={{ fontSize: 13, color: 'var(--vq-text-2)', margin: 0 }}>
                                        Sign in to check live status on pending orders and track your complete purchase history.
                                    </p>
                                    {authError && <div className="vqs-err">{authError}</div>}
                                    <div>
                                        <label className="vqs-label">Full Name</label>
                                        <input
                                            type="text"
                                            className="vqs-input"
                                            placeholder="Your full name"
                                            value={authName}
                                            onChange={(e) => setAuthName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="vqs-label">Phone Number</label>
                                        <input
                                            type="tel"
                                            className="vqs-input"
                                            placeholder="Phone used when placing orders"
                                            value={authPhone}
                                            onChange={(e) => setAuthPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="vqs-label">Email (Optional)</label>
                                        <input
                                            type="email"
                                            className="vqs-input"
                                            placeholder="For digital receipts"
                                            value={authEmail}
                                            onChange={(e) => setAuthEmail(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="vqs-btn vqs-btn--full"
                                        disabled={submittingAuth}
                                    >
                                        {submittingAuth ? 'Signing In...' : 'Sign In as Customer'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: Quick Track Order Search Modal */}
            {showTrackModal && (
                <div className="vqs-scrim" onClick={() => setShowTrackModal(false)}>
                    <div className="vqs-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="vqs-modal-head">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="vqs-cust-iconwrap">
                                    <Package size={18} />
                                </div>
                                <div>
                                    <h3 className="vqs-modal-title">Track an Order</h3>
                                    <p className="vqs-muted" style={{ fontSize: 12.5, margin: 0 }}>
                                        Enter your order number and phone to view live status
                                    </p>
                                </div>
                            </div>
                            <button type="button" className="vqs-iconbtn" onClick={() => setShowTrackModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="vqs-modal-body">
                            <form onSubmit={handleTrackOrder} style={{ display: 'grid', gap: 12 }}>
                                {trackError && <div className="vqs-err">{trackError}</div>}
                                <div>
                                    <label className="vqs-label">Order Number</label>
                                    <input
                                        type="text"
                                        className="vqs-input"
                                        placeholder="e.g. VQ-ABC-1234"
                                        value={trackNumber}
                                        onChange={(e) => setTrackNumber(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="vqs-label">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="vqs-input"
                                        placeholder="Phone used during checkout"
                                        value={trackPhone}
                                        onChange={(e) => setTrackPhone(e.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="vqs-btn vqs-btn--full"
                                    disabled={trackLoading}
                                >
                                    {trackLoading ? 'Searching...' : 'Track My Order'}
                                </button>
                                <div style={{ textAlign: 'center', marginTop: 4 }}>
                                    <button
                                        type="button"
                                        className="vq-btn-plain"
                                        style={{ fontSize: 12.5, color: 'var(--vq-text-2)', textDecoration: 'underline' }}
                                        onClick={() => {
                                            setShowTrackModal(false);
                                            setShowCustomerModal(true);
                                        }}
                                    >
                                        Or sign in to view all your past orders
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
