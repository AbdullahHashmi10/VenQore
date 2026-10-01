import React, { useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import ServiceNavTabs from '@/Pages/Services/ServiceNavTabs';
import {
    Calendar as CalendarIcon,
    Clock,
    User,
    MapPin,
    Plus,
    ChevronLeft,
    ChevronRight,
    Filter,
    CheckCircle2,
    AlertCircle,
    X,
    ExternalLink,
    Sparkles,
    Briefcase
} from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { useTermText } from '@/lib/terms';

const STATUS_META = {
    draft:          { label: 'Draft',          badge: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700' },
    scheduled:      { label: 'Scheduled',      badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800/40' },
    in_progress:    { label: 'In Progress',    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/40' },
    on_hold:        { label: 'On Hold',        badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800/40' },
    awaiting_parts: { label: 'Awaiting Parts', badge: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-800/40' },
    completed:      { label: 'Completed',      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40' },
    invoiced:       { label: 'Invoiced',       badge: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800/40' },
    cancelled:      { label: 'Cancelled',      badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800/40' },
};

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export default function ServiceCalendar({
    jobs = [],
    employees = [],
    services = [],
    filters = {},
}) {
    const { store } = usePage().props;
    const storeSlug = store?.slug || (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : '');
    const tt = useTermText();

    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [viewMode, setViewMode] = useState('lanes'); // 'lanes' (Technician Swimlanes), 'week', 'agenda'
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(filters.employee_id || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    // Quick Book Modal
    const [isQuickBookOpen, setIsQuickBookOpen] = useState(false);
    const [quickBookForm, setQuickBookForm] = useState({
        party_id: '',
        title: '',
        service_product_id: '',
        technician_id: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '10:00',
        priority: 'normal',
        site_address: '',
        notes: '',
        estimated_total: '',
    });

    // Selected Job Preview Drawer
    const [selectedJob, setSelectedJob] = useState(null);

    // Filtered jobs
    const filteredJobs = useMemo(() => {
        return jobs.filter((job) => {
            if (selectedStatus !== 'all' && job.status !== selectedStatus) return false;
            if (selectedEmployeeId !== 'all') {
                const hasEmp = job.assignments?.some((a) => String(a.employee_id) === String(selectedEmployeeId));
                if (!hasEmp) return false;
            }
            return true;
        });
    }, [jobs, selectedStatus, selectedEmployeeId]);

    // Navigation functions
    const goToToday = () => setCurrentDate(new Date());
    const prevDate = () => {
        const d = new Date(currentDate);
        if (viewMode === 'week') d.setDate(d.getDate() - 7);
        else d.setDate(d.getDate() - 1);
        setCurrentDate(d);
    };
    const nextDate = () => {
        const d = new Date(currentDate);
        if (viewMode === 'week') d.setDate(d.getDate() + 7);
        else d.setDate(d.getDate() + 1);
        setCurrentDate(d);
    };

    const dateFormattedString = currentDate.toISOString().split('T')[0];

    const weekDays = useMemo(() => {
        const start = new Date(currentDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
        start.setDate(diff);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const next = new Date(start);
            next.setDate(start.getDate() + i);
            days.push(next);
        }
        return days;
    }, [currentDate]);

    // Format display title
    const calendarHeaderTitle = useMemo(() => {
        if (viewMode === 'week') {
            const first = weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const last = weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            return `${first} – ${last}`;
        }
        return currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }, [currentDate, viewMode, weekDays]);

    // Open quick book with prefilled slot
    const handleSlotClick = (employeeId = '', hour = 9) => {
        const hourStr = String(hour).padStart(2, '0') + ':00';
        const endHourStr = String(hour + 1).padStart(2, '0') + ':00';
        setQuickBookForm({
            party_id: '',
            title: '',
            service_product_id: '',
            technician_id: employeeId || '',
            date: dateFormattedString,
            start_time: hourStr,
            end_time: endHourStr,
            priority: 'normal',
            site_address: '',
            notes: '',
            estimated_total: '',
        });
        setIsQuickBookOpen(true);
    };

    // Handle catalog service select in Quick Book
    const handleServiceChange = (serviceId) => {
        const svc = services.find((s) => String(s.id) === String(serviceId));
        if (svc) {
            const durationMins = Number(svc.default_duration) || 60;
            const startTime = quickBookForm.start_time || '09:00';
            const [h, m] = startTime.split(':').map(Number);
            const totalMins = h * 60 + m + durationMins;
            const endH = Math.floor(totalMins / 60) % 24;
            const endM = totalMins % 60;
            const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

            setQuickBookForm((prev) => ({
                ...prev,
                service_product_id: serviceId,
                title: prev.title || svc.name,
                estimated_total: svc.price || '',
                end_time: endTimeStr,
            }));
        } else {
            setQuickBookForm((prev) => ({ ...prev, service_product_id: serviceId }));
        }
    };

    const submitQuickBook = (e) => {
        e.preventDefault();
        const startAt = `${quickBookForm.date} ${quickBookForm.start_time}:00`;
        const endAt = `${quickBookForm.date} ${quickBookForm.end_time}:00`;

        router.post(
            route('store.service-jobs.quick-book', { store_slug: storeSlug }),
            {
                party_id: quickBookForm.party_id,
                title: quickBookForm.title,
                service_product_id: quickBookForm.service_product_id || null,
                technician_id: quickBookForm.technician_id || null,
                scheduled_start_at: startAt,
                scheduled_end_at: endAt,
                priority: quickBookForm.priority,
                site_address: quickBookForm.site_address,
                notes: quickBookForm.notes,
                estimated_total: quickBookForm.estimated_total ? parseFloat(quickBookForm.estimated_total) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => setIsQuickBookOpen(false),
            }
        );
    };

    // Helper: get jobs for a specific employee & date
    const getJobsForLane = (empId, dateStr) => {
        return filteredJobs.filter((job) => {
            const jobDate = job.scheduled_start_at ? job.scheduled_start_at.split(' ')[0] : job.scheduled_for;
            if (jobDate !== dateStr) return false;
            if (!empId) {
                return !job.assignments || job.assignments.length === 0;
            }
            return job.assignments?.some((a) => String(a.employee_id) === String(empId));
        });
    };

    return (
        <OneGlanceLayout title="Dispatch Calendar" activeMenu="Sell">
            <Head title="Services Dispatch Calendar" />

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                {/* Unified Services Tabs */}
                <ServiceNavTabs active="calendar" />

                {/* Header & Controls Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                            Dispatch & Scheduling
                        </h1>
                        <p className="mt-1 text-xs text-ink-secondary">
                            {tt('Allocate technician lanes, time slots, and track field appointments.')}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* View Switcher */}
                        <div className="inline-flex rounded-lg border border-line bg-surface p-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('lanes')}
                                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                                    viewMode === 'lanes' ? 'bg-accent-fill text-accent-on' : 'text-ink-secondary hover:text-ink'
                                }`}
                            >
                                Tech Lanes
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('week')}
                                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                                    viewMode === 'week' ? 'bg-accent-fill text-accent-on' : 'text-ink-secondary hover:text-ink'
                                }`}
                            >
                                Week View
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('agenda')}
                                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                                    viewMode === 'agenda' ? 'bg-accent-fill text-accent-on' : 'text-ink-secondary hover:text-ink'
                                }`}
                            >
                                Agenda List
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => handleSlotClick()}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent-fill px-3.5 text-xs font-semibold text-accent-on shadow-glow transition-colors hover:bg-accent-fill-hover"
                        >
                            <Plus size={15} />
                            <span>Quick Book</span>
                        </button>
                    </div>
                </div>

                {/* Date Navigator & Filters Bar */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-sm">
                    {/* Date Stepper */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={goToToday}
                            className="rounded-md border border-line bg-app px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-sunken"
                        >
                            Today
                        </button>
                        <div className="flex items-center rounded-md border border-line bg-app">
                            <button
                                type="button"
                                onClick={prevDate}
                                className="p-1.5 text-ink-muted hover:text-ink transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={nextDate}
                                className="p-1.5 text-ink-muted hover:text-ink transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                        <span className="ml-1 text-sm font-semibold text-ink">
                            {calendarHeaderTitle}
                        </span>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Technician Filter */}
                        <div className="flex items-center gap-1.5 rounded-md border border-line bg-app px-2.5 py-1">
                            <User size={13} className="text-ink-muted" />
                            <select
                                value={selectedEmployeeId}
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                className="border-0 bg-transparent py-0.5 text-xs font-medium text-ink focus:outline-none focus:ring-0"
                            >
                                <option value="all">{tt('All Technicians')}</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1.5 rounded-md border border-line bg-app px-2.5 py-1">
                            <Filter size={13} className="text-ink-muted" />
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="border-0 bg-transparent py-0.5 text-xs font-medium text-ink focus:outline-none focus:ring-0"
                            >
                                <option value="all">All Statuses</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="in_progress">In Progress</option>
                                <option value="on_hold">On Hold</option>
                                <option value="completed">Completed</option>
                                <option value="invoiced">Invoiced</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Main Calendar Views */}
                <div className="mt-4">
                    {/* VIEW 1: TECHNICIAN SWIMLANES */}
                    {viewMode === 'lanes' && (
                        <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
                            <div className="min-w-[850px]">
                                {/* Lane Headers */}
                                <div className="grid border-b border-line bg-sunken/40" style={{ gridTemplateColumns: `100px repeat(${Math.max(employees.length, 1)}, minmax(220px, 1fr))` }}>
                                    <div className="p-3 text-center text-2xs font-bold uppercase tracking-wider text-ink-muted border-r border-line">
                                        Time Slot
                                    </div>
                                    {employees.length === 0 ? (
                                        <div className="p-3 text-xs font-semibold text-ink">
                                            General Queue (Unassigned)
                                        </div>
                                    ) : (
                                        employees.map((emp) => (
                                            <div key={emp.id} className="flex items-center justify-between border-r border-line p-3 last:border-r-0">
                                                <div className="flex items-center gap-2 truncate">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-quiet text-xs font-bold text-accent-text">
                                                        {emp.name.charAt(0)}
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="truncate text-xs font-semibold text-ink">{emp.name}</p>
                                                        <p className="text-2xs text-ink-muted">{tt('Technician')}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSlotClick(emp.id)}
                                                    title="Book appointment for this tech"
                                                    className="rounded p-1 text-ink-muted hover:bg-surface hover:text-ink transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Lanes Hour Rows */}
                                <div className="divide-y divide-line">
                                    {HOURS.map((hour) => {
                                        const hourLabel = `${String(hour).padStart(2, '0')}:00`;
                                        return (
                                            <div
                                                key={hour}
                                                className="grid min-h-[90px]"
                                                style={{ gridTemplateColumns: `100px repeat(${Math.max(employees.length, 1)}, minmax(220px, 1fr))` }}
                                            >
                                                {/* Hour Marker */}
                                                <div className="border-r border-line p-2.5 text-center text-xs font-medium text-ink-muted bg-sunken/10">
                                                    {hourLabel}
                                                </div>

                                                {/* Tech Columns */}
                                                {employees.length === 0 ? (
                                                    <div
                                                        onClick={() => handleSlotClick('', hour)}
                                                        className="group relative border-r border-line p-2 transition-colors hover:bg-accent-quiet/20 cursor-pointer"
                                                    >
                                                        <span className="hidden text-2xs font-semibold text-accent-text group-hover:inline-block">
                                                            + Book slot
                                                        </span>
                                                    </div>
                                                ) : (
                                                    employees.map((emp) => {
                                                        const laneJobs = getJobsForLane(emp.id, dateFormattedString).filter((j) => {
                                                            if (!j.scheduled_start_at) return hour === 9; // fallback
                                                            const jobHour = new Date(j.scheduled_start_at).getHours();
                                                            return jobHour === hour;
                                                        });

                                                        return (
                                                            <div
                                                                key={emp.id}
                                                                onClick={(e) => {
                                                                    if (e.target === e.currentTarget) handleSlotClick(emp.id, hour);
                                                                }}
                                                                className="group relative border-r border-line p-1.5 transition-colors hover:bg-accent-quiet/10 cursor-pointer last:border-r-0"
                                                            >
                                                                {laneJobs.map((job) => {
                                                                    const meta = STATUS_META[job.status] || STATUS_META.draft;
                                                                    return (
                                                                        <div
                                                                            key={job.id}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedJob(job);
                                                                            }}
                                                                            className={`mb-1.5 rounded-lg border p-2 text-xs shadow-xs transition-transform hover:-translate-y-0.5 cursor-pointer ${meta.badge}`}
                                                                        >
                                                                            <div className="flex items-start justify-between gap-1">
                                                                                <span className="font-semibold text-ink truncate">
                                                                                    {job.title}
                                                                                </span>
                                                                                <span className="text-2xs font-mono font-bold opacity-80 shrink-0">
                                                                                    {job.number}
                                                                                </span>
                                                                            </div>
                                                                            <div className="mt-1 flex items-center justify-between text-2xs text-ink-secondary">
                                                                                <span className="truncate">{job.party?.name || 'Walk-in'}</span>
                                                                                {job.estimated_total > 0 && (
                                                                                    <span className="font-semibold">{formatCurrency(job.estimated_total)}</span>
                                                                                )}
                                                                            </div>
                                                                            {job.site_address && (
                                                                                <p className="mt-1 flex items-center gap-1 text-2xs text-ink-muted truncate">
                                                                                    <MapPin size={10} className="shrink-0" />
                                                                                    <span className="truncate">{job.site_address}</span>
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VIEW 2: 7-DAY WEEK VIEW */}
                    {viewMode === 'week' && (
                        <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
                            <div className="min-w-[850px]">
                                {/* Week Days Header */}
                                <div className="grid grid-cols-7 border-b border-line bg-sunken/40 divide-x divide-line">
                                    {weekDays.map((day, idx) => {
                                        const isToday = day.toDateString() === new Date().toDateString();
                                        return (
                                            <div
                                                key={idx}
                                                className={`p-3 text-center ${isToday ? 'bg-accent-quiet/40' : ''}`}
                                            >
                                                <p className="text-2xs font-bold uppercase tracking-wider text-ink-muted">
                                                    {day.toLocaleDateString(undefined, { weekday: 'short' })}
                                                </p>
                                                <p className={`mt-0.5 text-sm font-semibold ${isToday ? 'text-accent-text font-bold' : 'text-ink'}`}>
                                                    {day.getDate()}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Week Days Columns */}
                                <div className="grid grid-cols-7 divide-x divide-line min-h-[480px]">
                                    {weekDays.map((day, idx) => {
                                        const dayStr = day.toISOString().split('T')[0];
                                        const dayJobs = filteredJobs.filter((j) => {
                                            const jobDate = j.scheduled_start_at ? j.scheduled_start_at.split(' ')[0] : j.scheduled_for;
                                            return jobDate === dayStr;
                                        });

                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    setQuickBookForm((prev) => ({ ...prev, date: dayStr }));
                                                    setIsQuickBookOpen(true);
                                                }}
                                                className="group p-2 hover:bg-sunken/20 cursor-pointer space-y-2"
                                            >
                                                {dayJobs.map((job) => {
                                                    const meta = STATUS_META[job.status] || STATUS_META.draft;
                                                    const tech = job.assignments?.[0]?.employee?.name;
                                                    return (
                                                        <div
                                                            key={job.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedJob(job);
                                                            }}
                                                            className={`rounded-lg border p-2 text-xs shadow-xs transition-transform hover:-translate-y-0.5 cursor-pointer ${meta.badge}`}
                                                        >
                                                            <div className="flex items-start justify-between gap-1">
                                                                <span className="font-semibold text-ink truncate">{job.title}</span>
                                                            </div>
                                                            <p className="text-2xs text-ink-secondary truncate">{job.party?.name}</p>
                                                            {tech && (
                                                                <p className="mt-1 flex items-center gap-1 text-2xs text-accent-text font-medium truncate">
                                                                    <User size={10} />
                                                                    <span>{tech}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {dayJobs.length === 0 && (
                                                    <div className="py-8 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-2xs font-semibold text-accent-text">+ Add Job</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VIEW 3: AGENDA LIST */}
                    {viewMode === 'agenda' && (
                        <div className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden">
                            {filteredJobs.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Briefcase size={36} className="mx-auto text-ink-muted/50 mb-3" />
                                    <p className="text-sm font-semibold text-ink">No scheduled appointments found</p>
                                    <p className="mt-1 text-xs text-ink-secondary">{tt('Schedule a new job using Quick Book or Work Orders.')}</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-line">
                                    {filteredJobs.map((job) => {
                                        const meta = STATUS_META[job.status] || STATUS_META.draft;
                                        const tech = job.assignments?.[0]?.employee?.name;
                                        const timeStr = job.scheduled_start_at
                                            ? new Date(job.scheduled_start_at).toLocaleString(undefined, {
                                                  month: 'short',
                                                  day: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                              })
                                            : job.scheduled_for || 'Unscheduled';

                                        return (
                                            <div
                                                key={job.id}
                                                onClick={() => setSelectedJob(job)}
                                                className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-sunken/40 cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-quiet text-accent-text">
                                                        <CalendarIcon size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-ink text-sm">{job.title}</span>
                                                            <span className="font-mono text-2xs text-ink-muted">({job.number})</span>
                                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold border ${meta.badge}`}>
                                                                {meta.label}
                                                            </span>
                                                        </div>
                                                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-secondary">
                                                            <span className="flex items-center gap-1">
                                                                <User size={12} className="text-ink-muted" />
                                                                {job.party?.name || tt('Walk-in Customer')}
                                                            </span>
                                                            {tech && (
                                                                <span className="flex items-center gap-1 font-medium text-accent-text">
                                                                    <span>Tech: {tech}</span>
                                                                </span>
                                                            )}
                                                            {job.site_address && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin size={12} className="text-ink-muted" />
                                                                    {job.site_address}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-xs font-semibold text-ink">{timeStr}</p>
                                                        {job.estimated_total > 0 && (
                                                            <p className="text-xs text-ink-muted font-mono">{formatCurrency(job.estimated_total)}</p>
                                                        )}
                                                    </div>
                                                    <Link
                                                        href={route('store.service-jobs.show', { store_slug: storeSlug, serviceJob: job.id })}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="rounded-lg border border-line bg-app p-2 text-ink-muted hover:text-ink hover:bg-sunken"
                                                    >
                                                        <ExternalLink size={15} />
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* QUICK BOOK APPOINTMENT MODAL */}
            {isQuickBookOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-line pb-4">
                            <div>
                                <h3 className="font-display text-lg font-semibold text-ink flex items-center gap-2">
                                    <Sparkles size={18} className="text-accent-text" />
                                    {tt('Quick Book Service Appointment')}
                                </h3>
                                <p className="mt-0.5 text-xs text-ink-secondary">
                                    {tt('Schedule a service job with auto-pricing and lane dispatching.')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsQuickBookOpen(false)}
                                className="rounded-md p-1.5 text-ink-muted hover:bg-sunken hover:text-ink"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={submitQuickBook} className="mt-4 space-y-4">
                            {/* Catalog Service Quick Picker */}
                            <div>
                                <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                    {tt('Select Catalog Service (Optional)')}
                                </label>
                                <select
                                    value={quickBookForm.service_product_id}
                                    onChange={(e) => handleServiceChange(e.target.value)}
                                    className="w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                                >
                                    <option value="">-- Choose standard service or enter custom title --</option>
                                    {services.map((svc) => (
                                        <option key={svc.id} value={svc.id}>
                                            {svc.name} ({formatCurrency(svc.price || 0)} &bull; {svc.default_duration || 60}m)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                        {tt('Job Title / Summary *')}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={quickBookForm.title}
                                        onChange={(e) => setQuickBookForm({ ...quickBookForm, title: e.target.value })}
                                        placeholder="e.g. AC Gas Refill & Cleaning"
                                        className="w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                        {tt('Assign Technician')}
                                    </label>
                                    <select
                                        value={quickBookForm.technician_id}
                                        onChange={(e) => setQuickBookForm({ ...quickBookForm, technician_id: e.target.value })}
                                        className="w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                                    >
                                        <option value="">Unassigned Queue</option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Date & Time Slots */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                        Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={quickBookForm.date}
                                        onChange={(e) => setQuickBookForm({ ...quickBookForm, date: e.target.value })}
                                        className="w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        value={quickBookForm.start_time}
                                        onChange={(e) => setQuickBookForm({ ...quickBookForm, start_time: e.target.value })}
                                        className="w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                        End Time
                                    </label>
                                    <input
                                        type="time"
                                        value={quickBookForm.end_time}
                                        onChange={(e) => setQuickBookForm({ ...quickBookForm, end_time: e.target.value })}
                                        className="w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                        Estimated Price / Value
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={quickBookForm.estimated_total}
                                        onChange={(e) => setQuickBookForm({ ...quickBookForm, estimated_total: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                        Priority
                                    </label>
                                    <select
                                        value={quickBookForm.priority}
                                        onChange={(e) => setQuickBookForm({ ...quickBookForm, priority: e.target.value })}
                                        className="w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                                    >
                                        <option value="low">Low</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                    Site Address (For on-site jobs)
                                </label>
                                <input
                                    type="text"
                                    value={quickBookForm.site_address}
                                    onChange={(e) => setQuickBookForm({ ...quickBookForm, site_address: e.target.value })}
                                    placeholder="e.g. House 44, Block B, DHA Phase 5"
                                    className="w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 border-t border-line pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsQuickBookOpen(false)}
                                    className="rounded-lg border border-line px-4 py-2 text-xs font-semibold text-ink-secondary hover:bg-sunken hover:text-ink"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-accent-fill px-4 py-2 text-xs font-semibold text-accent-on shadow-glow hover:bg-accent-fill-hover"
                                >
                                    <CheckCircle2 size={14} />
                                    Book Appointment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* JOB PREVIEW SIDE DRAWER */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
                    <div className="w-full max-w-md h-full bg-surface border-l border-line p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-fast">
                        <div>
                            <div className="flex items-center justify-between border-b border-line pb-4">
                                <div>
                                    <span className="text-2xs font-mono font-bold text-accent-text">{selectedJob.number}</span>
                                    <h3 className="font-display text-lg font-semibold text-ink">{selectedJob.title}</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedJob(null)}
                                    className="rounded-md p-1.5 text-ink-muted hover:bg-sunken hover:text-ink"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="mt-5 space-y-4 text-xs">
                                <div className="rounded-lg border border-line bg-app p-3">
                                    <p className="text-2xs font-semibold uppercase tracking-wider text-ink-muted">Customer</p>
                                    <p className="mt-1 font-semibold text-ink">{selectedJob.party?.name || 'Walk-in'}</p>
                                    {selectedJob.party?.phone && <p className="text-ink-secondary">{selectedJob.party.phone}</p>}
                                </div>

                                <div className="rounded-lg border border-line bg-app p-3">
                                    <p className="text-2xs font-semibold uppercase tracking-wider text-ink-muted">{tt('Technician & Schedule')}</p>
                                    <p className="mt-1 font-semibold text-ink">
                                        {selectedJob.assignments?.[0]?.employee?.name || 'Unassigned'}
                                    </p>
                                    <p className="text-ink-secondary mt-0.5">
                                        {selectedJob.scheduled_start_at
                                            ? new Date(selectedJob.scheduled_start_at).toLocaleString()
                                            : selectedJob.scheduled_for || 'Date not set'}
                                    </p>
                                </div>

                                {selectedJob.site_address && (
                                    <div className="rounded-lg border border-line bg-app p-3">
                                        <p className="text-2xs font-semibold uppercase tracking-wider text-ink-muted">Site Location</p>
                                        <p className="mt-1 text-ink">{selectedJob.site_address}</p>
                                    </div>
                                )}

                                {selectedJob.lines?.length > 0 && (
                                    <div>
                                        <p className="text-2xs font-semibold uppercase tracking-wider text-ink-muted mb-2">Scope & Lines</p>
                                        <div className="space-y-1.5">
                                            {selectedJob.lines.map((line) => (
                                                <div key={line.id} className="flex justify-between border-b border-line/50 pb-1 text-ink">
                                                    <span>{line.description}</span>
                                                    <span className="font-mono font-medium">{formatCurrency(line.unit_price * line.quantity)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-line pt-4 flex items-center justify-between">
                            <span className="text-xs font-semibold text-ink">
                                Value: {formatCurrency(selectedJob.estimated_total || 0)}
                            </span>
                            <Link
                                href={route('store.service-jobs.show', { store_slug: storeSlug, serviceJob: selectedJob.id })}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-accent-fill px-4 py-2 text-xs font-semibold text-accent-on shadow-glow hover:bg-accent-fill-hover"
                            >
                                <span>{tt('Open Full Job')}</span>
                                <ExternalLink size={13} />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
