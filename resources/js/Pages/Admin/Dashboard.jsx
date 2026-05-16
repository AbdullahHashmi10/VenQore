import React, { useRef } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, Link, usePage } from '@inertiajs/react'; // Ensure Link is imported
import { Users, ShieldCheck, Settings, Activity, ArrowRight, Lock, Database, LayoutDashboard, Package } from 'lucide-react';
import MidnightNebula from '@/Components/MidnightNebula';

// --- VISUAL COMPONENTS ---
const FeatureCard = ({ icon: Icon, title, description, colorClass, glowColor, routeName }) => {
    const cardRef = useRef(null);
    const glowRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!cardRef.current || !glowRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Subtler rotation for smaller cards
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

        const glowX = (x / rect.width) * 100;
        const glowY = (y / rect.height) * 100;
        glowRef.current.style.opacity = '1';
        glowRef.current.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.2), transparent 70%)`;
    };

    const handleMouseLeave = () => {
        if (!cardRef.current || !glowRef.current) return;
        cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        glowRef.current.style.opacity = '0';
    };

    const { store } = usePage().props;
    return (
        <Link
            href={typeof route === 'function' && routeName ? route(routeName.startsWith('store.') ? routeName : `store.${routeName}`, { store_slug: store?.slug }) : '#'}
            className="group relative w-full h-full min-h-[220px] cursor-pointer block"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Background Blob */}
            <div className={`absolute inset-0 ${colorClass} rounded-3xl blur-[60px] opacity-10 group-hover:opacity-30 transition-opacity duration-500`} />

            {/* Card Content */}
            <div
                ref={cardRef}
                className="relative h-full w-full bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 p-6 flex flex-col items-center text-center transition-transform duration-100 ease-out will-change-transform shadow-sm group-hover:shadow-xl dark:shadow-none"
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div ref={glowRef} className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 mix-blend-soft-light z-20 rounded-3xl" />

                <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
                    <div className={`mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 ${glowColor} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors">{title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-light">{description}</p>
                </div>
            </div>
        </Link>
    );
};

export default function AdminHome({ stats, auth }) {

    return (
        <OneGlanceLayout title="Admin Hub" mode="admin">
            <Head title="Admin Hub" />

            <div className="h-full flex flex-col relative overflow-y-auto custom-scrollbar p-6 md:p-8">
                {/* Mesh Gradient Background (Dark Mode Only) */}
                <div className="hidden dark:block fixed top-0 right-0 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="hidden dark:block fixed bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
                <div className="hidden dark:block fixed inset-0 bg-[url('/images/noise.svg')] opacity-20 pointer-events-none"></div>

                {/* Big Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                    <FeatureCard
                        title="Admin Dashboard"
                        description="View detailed system statistics, active sessions, and performance metrics."
                        icon={LayoutDashboard}
                        colorClass="bg-indigo-600"
                        glowColor="text-indigo-500 dark:text-indigo-400"
                        routeName="admin.dashboard"
                    />
                    <FeatureCard
                        title="User Management"
                        description="Add, edit, or remove users. Manage roles and permissions for your team."
                        icon={Users}
                        colorClass="bg-emerald-600"
                        glowColor="text-emerald-500 dark:text-emerald-400"
                        routeName="admin.users"
                    />
                    <FeatureCard
                        title="System Settings"
                        description="Configure global application settings, preferences, and system defaults."
                        icon={Settings}
                        colorClass="bg-slate-600"
                        glowColor="text-slate-500 dark:text-slate-400"
                        routeName="admin.settings"
                    />
                    <FeatureCard
                        title="Security Logs"
                        description="Monitor system access, view audit trails, and track suspicious activities."
                        icon={ShieldCheck}
                        colorClass="bg-amber-600"
                        glowColor="text-amber-500 dark:text-amber-400"
                        routeName="admin.logs"
                    />
                    <FeatureCard
                        title="Reports Center"
                        description="Generate and view comprehensive reports on sales, inventory, and finance."
                        icon={Activity}
                        colorClass="bg-pink-600"
                        glowColor="text-pink-500 dark:text-pink-400"
                        routeName="store.reports.index"
                    />
                    <FeatureCard
                        title="Database Management"
                        description="Perform backups, optimize tables, and manage data integrity."
                        icon={Database}
                        colorClass="bg-blue-600"
                        glowColor="text-blue-500 dark:text-blue-400"
                        routeName="admin.data"
                    />
                </div>

                {/* Recent Activity Box - Styled to match Home Page */}
                <div className="mt-8 bg-white dark:bg-black/20 rounded-3xl p-8 border border-slate-200 dark:border-white/5 backdrop-blur-sm relative z-10 flex flex-col shadow-sm">
                    <div className="p-0 flex justify-between items-center mb-6 border-b-0">
                        <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-3">
                            <Activity className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                            Recent System Activity
                        </h3>
                        <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold transition-colors">
                            View All Logs
                        </button>
                    </div>
                    <div className="text-center text-slate-400 py-8">
                        <p>No recent system activity to display.</p>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
