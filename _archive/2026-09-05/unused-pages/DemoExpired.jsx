import React, { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';

export default function DemoExpired({ activityCount = 0 }) {
    const [timeExplored, setTimeExplored] = useState('a short while');

    useEffect(() => {
        const entry = localStorage.getItem('demo_entry_time');
        if (entry) {
            const minutes = Math.ceil((Date.now() - parseInt(entry, 10)) / (1000 * 60));
            setTimeExplored(`${minutes} minutes`);
            localStorage.removeItem('demo_entry_time'); // cleanup
        }
    }, []);

    return (
        <div className="min-h-screen bg-app flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <Head title="Demo Session Expired" />

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center border-t-4 border-brand-600">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-brand-100 mb-6">
                        <svg className="h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl justify-center font-bold text-ink mb-2">
                        Your demo session has ended.
                    </h2>
                    
                    <p className="text-ink-muted mb-6">
                        It looks like you were idle or your specific sandbox instance timed out intentionally to recycle resources.
                    </p>

                    <div className="bg-sunken p-4 rounded-lg text-left mb-6 text-sm text-ink-secondary">
                        <p className="font-semibold mb-2">During your {timeExplored} session you:</p>
                        <ul className="space-y-2">
                            <li className="flex items-start">
                                <span className="text-green-500 mr-2">✓</span>
                                Explored the robust product catalog operations
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-500 mr-2">✓</span>
                                Viewed over 5 years of algorithmic historical sales data
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-500 mr-2">✓</span>
                                Checked the real-time financial dashboards and flows
                            </li>
                        </ul>
                    </div>

                    <p className="text-ink font-medium mb-4">
                        Your real store is waiting to be built.
                    </p>

                    <a 
                        href="/register" 
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
                    >
                        Create your account — Free
                    </a>
                </div>
            </div>
        </div>
    );
}
