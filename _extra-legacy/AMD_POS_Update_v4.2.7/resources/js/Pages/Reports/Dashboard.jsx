import React from 'react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { Head, Link } from '@inertiajs/react';
import { FileText, BarChart, PieChart, TrendingUp, ArrowRight, Download, Clock } from 'lucide-react';
import MidnightNebula from '@/Components/MidnightNebula';

export default function ReportsDashboard({ stats, recentReports }) {
    const StatCard = ({ title, value, icon: Icon, color, subValue }) => (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
                    <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                {subValue && (
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                        {subValue}
                    </span>
                )}
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold text-slate-800 dark:text-white group-hover:scale-105 transition-transform origin-left">
                {value}
            </p>
        </div>
    );

    return (
        <ReportsLayout title="Reports Dashboard">
            <Head title="Reports Dashboard" />

            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Reports"
                        value={stats.total_reports}
                        icon={FileText}
                        color="bg-indigo-500"
                    />
                    <StatCard
                        title="Generated Today"
                        value={stats.generated_today}
                        icon={BarChart}
                        color="bg-emerald-500"
                    />
                    <StatCard
                        title="Scheduled"
                        value={stats.scheduled_reports}
                        icon={Clock}
                        color="bg-amber-500"
                    />
                    <StatCard
                        title="Archived"
                        value={stats.archived_reports}
                        icon={PieChart}
                        color="bg-slate-500"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Reports */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-500" />
                                Recent Reports
                            </h3>
                            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                View All
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Report Name</th>
                                        <th className="px-6 py-4 font-medium">Type</th>
                                        <th className="px-6 py-4 font-medium">Date</th>
                                        <th className="px-6 py-4 font-medium text-right">Status</th>
                                        <th className="px-6 py-4 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {recentReports.length > 0 ? (
                                        recentReports.map((report) => (
                                            <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                                    {report.name}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                    {report.type}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                                    {new Date(report.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                        ${report.status === 'Ready' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                            'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}
                                                    `}>
                                                        {report.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                                                        <Download size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                                                No reports found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <MidnightNebula className="rounded-2xl p-6 shadow-xl h-full" primaryColor="indigo" secondaryColor="pink">
                        <h3 className="font-bold text-xl mb-2 text-white">Generate Reports</h3>
                        <p className="text-indigo-100 mb-6 text-sm">Create custom reports for your business.</p>

                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white">
                                <span className="font-medium">Sales Report</span>
                                <ArrowRight size={16} />
                            </button>
                            <button className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white">
                                <span className="font-medium">Inventory Report</span>
                                <ArrowRight size={16} />
                            </button>
                            <button className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white">
                                <span className="font-medium">Financial Statement</span>
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </MidnightNebula>
                </div>
            </div>
        </ReportsLayout>
    );
}
