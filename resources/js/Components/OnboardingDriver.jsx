import React, { useEffect } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { usePage } from '@inertiajs/react';

const OnboardingDriver = () => {
    const { flash, auth } = usePage().props;

    useEffect(() => {
        // Only run for authenticated users
        if (!auth?.user) return;

        const isSetupSuccess = flash?.success === 'Setup completed successfully!';
        const onboardingCompleted = localStorage.getItem('amd_onboarding_driver_complete');

        // Logic check: Run if setup just finished OR if it's a new user who hasn't completed it
        if (!isSetupSuccess && onboardingCompleted) return;

        const driverObj = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            doneBtnText: 'Finish Tour',
            nextBtnText: 'Next →',
            prevBtnText: '← Back',
            overlayColor: 'rgba(0, 0, 0, 0.75)',
            steps: [
                {
                    popover: {
                        title: 'Welcome to VenQore!',
                        description: 'Let us take a quick 1-minute tour of your new high-performance ERP dashboard. Ready to see how it works?',
                    }
                },
                {
                    element: '#tour-omnisearch',
                    popover: {
                        title: 'Universal AI Search',
                        description: 'Your command center. Search products, customers, invoices, or ask our AI a question. Press <b>Ctrl + K</b> anywhere to open it instantly.',
                        position: 'bottom'
                    }
                },
                {
                    element: '#sidebar-dashboard',
                    popover: {
                        title: 'Your Command Center',
                        description: 'View real-time performance graphs, outstanding balances, and low-stock alerts right here.',
                        position: 'right'
                    }
                },
                {
                    element: '#sidebar-sell',
                    popover: {
                        title: 'Selling Power',
                        description: 'Manage Quotations, Orders, Proposals, and Invoices. Everything relates back to your accounting ledger automatically.',
                        position: 'right'
                    }
                },
                {
                    element: '#sidebar-stock',
                    popover: {
                        title: 'Inventory Control',
                        description: 'Track products, manage categories, and handle stock transfers. Our V3 engine ensures batch-level accuracy.',
                        position: 'right'
                    }
                },
                {
                    element: '#tour-growth-engine',
                    popover: {
                        title: 'AI Growth Engine',
                        description: 'Our proprietary brain detects opportunities—like which customer is due for a refill—and drafts WhatsApp reminders for you.',
                        position: 'bottom'
                    }
                },
                {
                    element: '#tour-performance',
                    popover: {
                        title: 'Performance Tracking',
                        description: 'Instantly view today’s Sales vs Gross Profit. Switch between day, month, and year views with one click.',
                        position: 'bottom'
                    }
                },
                {
                    element: '#tour-net-profit',
                    popover: {
                        title: 'Net Profit & Health',
                        description: 'The ultimate bottom line. See exactly how much money is staying in your pocket after all expenses.',
                        position: 'bottom'
                    }
                },
                {
                    element: '#tour-sales-chart',
                    popover: {
                        title: 'Visualize Growth',
                        description: 'Real-time sales visualizations. Hover over any point to see specific transaction details.',
                        position: 'top'
                    }
                },
                {
                    element: '#tour-low-stock',
                    popover: {
                        title: 'Never Run Out',
                        description: 'Products reaching their alert limit appear here instantly. Tap "Order" to draft a new Purchase Order.',
                        position: 'left'
                    }
                },
                {
                    element: '#tour-right-panel',
                    popover: {
                        title: 'Asset Overview',
                        description: 'Monitor Cash-in-Hand, Bank Balances, and Total Inventory Valuation at all times.',
                        position: 'left'
                    }
                },
                {
                    popover: {
                        title: 'You’re All Set!',
                        description: 'Explore the settings to customize your experience. Welcome to the future of your business!',
                    }
                }
            ],
            onDestroyed: () => {
                localStorage.setItem('amd_onboarding_driver_complete', 'true');
            }
        });

        // Add custom styles for premium look
        const style = document.createElement('style');
        style.innerHTML = `
            .driver-popover {
                border-radius: 20px !important;
                padding: 24px !important;
                background-color: #ffffff !important;
                border: 1px solid #e2e8f0 !important;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
            }
            .dark .driver-popover {
                background-color: #0f172a !important;
                border-color: #1e293b !important;
                color: #f8fafc !important;
            }
            .driver-popover-title {
                font-size: 18px !important;
                font-weight: 800 !important;
                color: #1e293b !important;
                margin-bottom: 8px !important;
            }
            .dark .driver-popover-title {
                color: #ffffff !important;
            }
            .driver-popover-description {
                font-size: 14px !important;
                color: #64748b !important;
                line-height: 1.6 !important;
            }
            .dark .driver-popover-description {
                color: #94a3b8 !important;
            }
            .driver-popover-btn {
                border-radius: 10px !important;
                font-weight: 700 !important;
                text-shadow: none !important;
                padding: 8px 16px !important;
                transition: all 0.2s !important;
            }
            .driver-popover-next-btn {
                background-color: #4f46e5 !important;
                color: white !important;
            }
            .driver-popover-prev-btn {
                background-color: #f1f5f9 !important;
                color: #64748b !important;
            }
            .dark .driver-popover-prev-btn {
                background-color: #1e293b !important;
                color: #94a3b8 !important;
            }
            .driver-popover-progress-text {
                font-weight: 600 !important;
                color: #94a3b8 !important;
            }
        `;
        document.head.appendChild(style);

        // Delayed start to ensure sidebar and dashboard rendering
        const timer = setTimeout(() => {
            // Check if we are on dashboard to run the full dashboard tour
            // Otherwise, we might only want to highlight sidebar
            if (window.location.pathname.includes('/dashboard')) {
                driverObj.drive();
            }
        }, 2000);

        return () => {
            clearTimeout(timer);
            document.head.removeChild(style);
        };

    }, [flash?.success, auth?.user?.id]);

    return null;
};

export default OnboardingDriver;
