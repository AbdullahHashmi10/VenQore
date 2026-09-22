import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Bike, ChefHat, CheckCircle2, Clock, MapPin, PackageCheck, AlertCircle, RefreshCw } from 'lucide-react';

const STEPS = [
    { key: 'placed',    label: 'Order Placed',      desc: 'We received your order',        icon: Clock },
    { key: 'preparing', label: 'Preparing',         desc: 'Kitchen is cooking your food',  icon: ChefHat },
    { key: 'out',       label: 'On the Way',        desc: 'Rider is heading to your door', icon: Bike },
    { key: 'delivered', label: 'Delivered',         desc: 'Enjoy your meal!',              icon: PackageCheck },
];

const STEP_INDEX = { placed: 0, preparing: 1, out: 2, delivered: 3 };

export default function Track({ tracking, error }) {
    const [secondsLeft, setSecondsLeft] = useState(30);

    // Auto-refresh page every 30 seconds
    useEffect(() => {
        if (error || tracking?.status === 'delivered') return;
        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    window.location.reload();
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [error, tracking?.status]);

    if (error === 'not_found') {
        return (
            <div style={containerStyle}>
                <Head title="Order Not Found" />
                <div style={cardStyle}>
                    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                        <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
                        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#18181b', margin: '0 0 8px' }}>
                            Order Not Found
                        </h1>
                        <p style={{ fontSize: '14px', color: '#71717a', margin: 0, lineHeight: 1.5 }}>
                            This tracking link is invalid or has expired. If you placed an order, please contact the store directly.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error === 'expired') {
        return (
            <div style={containerStyle}>
                <Head title="Tracking Expired" />
                <div style={cardStyle}>
                    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                        <CheckCircle2 size={48} style={{ color: '#10b981', margin: '0 auto 16px' }} />
                        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#18181b', margin: '0 0 8px' }}>
                            Delivery Completed
                        </h1>
                        <p style={{ fontSize: '14px', color: '#71717a', margin: 0, lineHeight: 1.5 }}>
                            This order was completed and its tracking window has ended. Thank you for your order!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const currentIdx = STEP_INDEX[tracking?.status] ?? 0;
    const isOut = tracking?.status === 'out';
    const isDelivered = tracking?.status === 'delivered';

    return (
        <div style={containerStyle}>
            <Head title={`Live Order Tracking • ${tracking?.status_label || 'Delivery'}`} />

            <div style={cardStyle}>
                {/* Header */}
                <header style={{
                    padding: '24px 20px',
                    borderBottom: '1px solid #f4f4f5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#fafafa',
                    borderTopLeftRadius: '16px',
                    borderTopRightRadius: '16px',
                }}>
                    <div>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: '#10b981',
                            display: 'block',
                            marginBottom: '4px',
                        }}>
                            Live Delivery Tracking
                        </span>
                        <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#18181b', margin: 0 }}>
                            {tracking?.customer_name ? `Order for ${tracking.customer_name}` : 'Your Order'}
                        </h1>
                    </div>

                    {!isDelivered && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#71717a' }}>
                            <RefreshCw size={12} style={{ animation: 'spin 3s linear infinite' }} />
                            <span>{secondsLeft}s</span>
                        </div>
                    )}
                </header>

                {/* Hero Status Callout */}
                <div style={{
                    padding: '24px 20px',
                    textAlign: 'center',
                    background: isDelivered ? '#ecfdf5' : isOut ? '#eff6ff' : '#ffffff',
                    borderBottom: '1px solid #f4f4f5',
                }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '28px',
                        background: isDelivered ? '#10b981' : isOut ? '#3b82f6' : '#18181b',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}>
                        {isDelivered ? <PackageCheck size={28} /> : isOut ? <Bike size={28} /> : <ChefHat size={28} />}
                    </div>

                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#18181b', margin: '0 0 6px' }}>
                        {tracking?.status_label}
                    </h2>

                    {isOut && tracking?.rider_first_name && (
                        <p style={{ fontSize: '15px', color: '#2563eb', fontWeight: 600, margin: '0 0 8px' }}>
                            🚴 {tracking.rider_first_name} is on the way!
                        </p>
                    )}

                    {isOut && tracking?.eta_remaining !== null && (
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#dbeafe',
                            color: '#1d4ed8',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 700,
                            marginTop: '4px',
                        }}>
                            <Clock size={14} />
                            <span>Estimated arrival: {tracking.eta_remaining > 0 ? `~${tracking.eta_remaining} mins` : 'Any moment now'}</span>
                        </div>
                    )}
                </div>

                {/* Status Timeline */}
                <div style={{ padding: '24px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                        {/* Connecting Line */}
                        <div style={{
                            position: 'absolute',
                            left: '19px',
                            top: '16px',
                            bottom: '16px',
                            width: '2px',
                            background: '#e4e4e7',
                            zIndex: 0,
                        }} />

                        {STEPS.map((step, idx) => {
                            const isDone = idx < currentIdx;
                            const isCurrent = idx === currentIdx;
                            const StepIcon = step.icon;

                            let dotBg = '#e4e4e7';
                            let dotColor = '#71717a';
                            if (isDone || isCurrent) {
                                dotBg = isCurrent ? '#18181b' : '#10b981';
                                dotColor = '#ffffff';
                            }

                            return (
                                <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', zIndex: 1 }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '20px',
                                        background: dotBg,
                                        color: dotColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        transition: 'all 0.3s ease',
                                        boxShadow: isCurrent ? '0 0 0 4px rgba(24,24,27,0.1)' : 'none',
                                    }}>
                                        {isDone ? <CheckCircle2 size={18} /> : <StepIcon size={18} />}
                                    </div>
                                    <div style={{ paddingTop: '8px' }}>
                                        <h3 style={{
                                            fontSize: '15px',
                                            fontWeight: isCurrent ? 800 : 600,
                                            color: isCurrent ? '#18181b' : isDone ? '#3f3f46' : '#a1a1aa',
                                            margin: '0 0 2px',
                                        }}>
                                            {step.label}
                                        </h3>
                                        <p style={{ fontSize: '13px', color: '#71717a', margin: 0 }}>
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <footer style={{
                    padding: '16px 20px',
                    borderTop: '1px solid #f4f4f5',
                    textAlign: 'center',
                    background: '#fafafa',
                    borderBottomLeftRadius: '16px',
                    borderBottomRightRadius: '16px',
                }}>
                    <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0 }}>
                        Powered by VenQore Restaurant Platform
                    </p>
                </footer>
            </div>
        </div>
    );
}

const containerStyle = {
    minHeight: '100vh',
    background: '#f4f4f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const cardStyle = {
    background: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    border: '1px solid #e4e4e7',
};
