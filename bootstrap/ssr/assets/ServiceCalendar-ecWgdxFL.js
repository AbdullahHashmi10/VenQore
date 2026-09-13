import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import ServiceNavTabs from "./ServiceNavTabs-C0mnPWx8.js";
import { Plus, ChevronLeft, ChevronRight, User, Filter, MapPin, Briefcase, Calendar, ExternalLink, Sparkles, X, CheckCircle2 } from "lucide-react";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
const STATUS_META = {
  draft: { label: "Draft", badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700" },
  scheduled: { label: "Scheduled", badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800/40" },
  in_progress: { label: "In Progress", badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/40" },
  on_hold: { label: "On Hold", badge: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800/40" },
  awaiting_parts: { label: "Awaiting Parts", badge: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-800/40" },
  completed: { label: "Completed", badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40" },
  invoiced: { label: "Invoiced", badge: "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800/40" },
  cancelled: { label: "Cancelled", badge: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800/40" }
};
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
function ServiceCalendar({
  jobs = [],
  employees = [],
  services = [],
  filters = {}
}) {
  const { store } = usePage().props;
  const storeSlug = store?.slug || (typeof window !== "undefined" ? window.location.pathname.split("/")[2] : "");
  const tt = useTermText();
  const [currentDate, setCurrentDate] = useState(() => /* @__PURE__ */ new Date());
  const [viewMode, setViewMode] = useState("lanes");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(filters.employee_id || "all");
  const [selectedStatus, setSelectedStatus] = useState(filters.status || "all");
  const [isQuickBookOpen, setIsQuickBookOpen] = useState(false);
  const [quickBookForm, setQuickBookForm] = useState({
    party_id: "",
    title: "",
    service_product_id: "",
    technician_id: "",
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "10:00",
    priority: "normal",
    site_address: "",
    notes: "",
    estimated_total: ""
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (selectedStatus !== "all" && job.status !== selectedStatus) return false;
      if (selectedEmployeeId !== "all") {
        const hasEmp = job.assignments?.some((a) => String(a.employee_id) === String(selectedEmployeeId));
        if (!hasEmp) return false;
      }
      return true;
    });
  }, [jobs, selectedStatus, selectedEmployeeId]);
  const goToToday = () => setCurrentDate(/* @__PURE__ */ new Date());
  const prevDate = () => {
    const d = new Date(currentDate);
    if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };
  const nextDate = () => {
    const d = new Date(currentDate);
    if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };
  const dateFormattedString = currentDate.toISOString().split("T")[0];
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date(start);
      next.setDate(start.getDate() + i);
      days.push(next);
    }
    return days;
  }, [currentDate]);
  const calendarHeaderTitle = useMemo(() => {
    if (viewMode === "week") {
      const first = weekDays[0].toLocaleDateString(void 0, { month: "short", day: "numeric" });
      const last = weekDays[6].toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" });
      return `${first} – ${last}`;
    }
    return currentDate.toLocaleDateString(void 0, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }, [currentDate, viewMode, weekDays]);
  const handleSlotClick = (employeeId = "", hour = 9) => {
    const hourStr = String(hour).padStart(2, "0") + ":00";
    const endHourStr = String(hour + 1).padStart(2, "0") + ":00";
    setQuickBookForm({
      party_id: "",
      title: "",
      service_product_id: "",
      technician_id: employeeId || "",
      date: dateFormattedString,
      start_time: hourStr,
      end_time: endHourStr,
      priority: "normal",
      site_address: "",
      notes: "",
      estimated_total: ""
    });
    setIsQuickBookOpen(true);
  };
  const handleServiceChange = (serviceId) => {
    const svc = services.find((s) => String(s.id) === String(serviceId));
    if (svc) {
      const durationMins = Number(svc.default_duration) || 60;
      const startTime = quickBookForm.start_time || "09:00";
      const [h, m] = startTime.split(":").map(Number);
      const totalMins = h * 60 + m + durationMins;
      const endH = Math.floor(totalMins / 60) % 24;
      const endM = totalMins % 60;
      const endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
      setQuickBookForm((prev) => ({
        ...prev,
        service_product_id: serviceId,
        title: prev.title || svc.name,
        estimated_total: svc.price || "",
        end_time: endTimeStr
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
      route("store.service-jobs.quick-book", { store_slug: storeSlug }),
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
        estimated_total: quickBookForm.estimated_total ? parseFloat(quickBookForm.estimated_total) : null
      },
      {
        preserveScroll: true,
        onSuccess: () => setIsQuickBookOpen(false)
      }
    );
  };
  const getJobsForLane = (empId, dateStr) => {
    return filteredJobs.filter((job) => {
      const jobDate = job.scheduled_start_at ? job.scheduled_start_at.split(" ")[0] : job.scheduled_for;
      if (jobDate !== dateStr) return false;
      if (!empId) {
        return !job.assignments || job.assignments.length === 0;
      }
      return job.assignments?.some((a) => String(a.employee_id) === String(empId));
    });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Dispatch Calendar", activeMenu: "Sell", children: [
    /* @__PURE__ */ jsx(Head, { title: "Services Dispatch Calendar" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 py-6 sm:px-6", children: [
      /* @__PURE__ */ jsx(ServiceNavTabs, { active: "calendar" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight text-ink", children: "Dispatch & Scheduling" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-secondary", children: tt("Allocate technician lanes, time slots, and track field appointments.") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "inline-flex rounded-lg border border-line bg-surface p-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setViewMode("lanes"),
                className: `rounded-md px-3 py-1 text-xs font-semibold transition-colors ${viewMode === "lanes" ? "bg-accent-fill text-accent-on" : "text-ink-secondary hover:text-ink"}`,
                children: "Tech Lanes"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setViewMode("week"),
                className: `rounded-md px-3 py-1 text-xs font-semibold transition-colors ${viewMode === "week" ? "bg-accent-fill text-accent-on" : "text-ink-secondary hover:text-ink"}`,
                children: "Week View"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setViewMode("agenda"),
                className: `rounded-md px-3 py-1 text-xs font-semibold transition-colors ${viewMode === "agenda" ? "bg-accent-fill text-accent-on" : "text-ink-secondary hover:text-ink"}`,
                children: "Agenda List"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => handleSlotClick(),
              className: "inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent-fill px-3.5 text-xs font-semibold text-accent-on shadow-glow transition-colors hover:bg-accent-fill-hover",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 15 }),
                /* @__PURE__ */ jsx("span", { children: "Quick Book" })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: goToToday,
              className: "rounded-md border border-line bg-app px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-sunken",
              children: "Today"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center rounded-md border border-line bg-app", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: prevDate,
                className: "p-1.5 text-ink-muted hover:text-ink transition-colors",
                children: /* @__PURE__ */ jsx(ChevronLeft, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: nextDate,
                className: "p-1.5 text-ink-muted hover:text-ink transition-colors",
                children: /* @__PURE__ */ jsx(ChevronRight, { size: 16 })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("span", { className: "ml-1 text-sm font-semibold text-ink", children: calendarHeaderTitle })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 rounded-md border border-line bg-app px-2.5 py-1", children: [
            /* @__PURE__ */ jsx(User, { size: 13, className: "text-ink-muted" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: selectedEmployeeId,
                onChange: (e) => setSelectedEmployeeId(e.target.value),
                className: "border-0 bg-transparent py-0.5 text-xs font-medium text-ink focus:outline-none focus:ring-0",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "all", children: tt("All Technicians") }),
                  employees.map((emp) => /* @__PURE__ */ jsx("option", { value: emp.id, children: emp.name }, emp.id))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 rounded-md border border-line bg-app px-2.5 py-1", children: [
            /* @__PURE__ */ jsx(Filter, { size: 13, className: "text-ink-muted" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: selectedStatus,
                onChange: (e) => setSelectedStatus(e.target.value),
                className: "border-0 bg-transparent py-0.5 text-xs font-medium text-ink focus:outline-none focus:ring-0",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "all", children: "All Statuses" }),
                  /* @__PURE__ */ jsx("option", { value: "scheduled", children: "Scheduled" }),
                  /* @__PURE__ */ jsx("option", { value: "in_progress", children: "In Progress" }),
                  /* @__PURE__ */ jsx("option", { value: "on_hold", children: "On Hold" }),
                  /* @__PURE__ */ jsx("option", { value: "completed", children: "Completed" }),
                  /* @__PURE__ */ jsx("option", { value: "invoiced", children: "Invoiced" })
                ]
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
        viewMode === "lanes" && /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-xl border border-line bg-surface shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "min-w-[850px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid border-b border-line bg-sunken/40", style: { gridTemplateColumns: `100px repeat(${Math.max(employees.length, 1)}, minmax(220px, 1fr))` }, children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 text-center text-2xs font-bold uppercase tracking-wider text-ink-muted border-r border-line", children: "Time Slot" }),
            employees.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-3 text-xs font-semibold text-ink", children: "General Queue (Unassigned)" }) : employees.map((emp) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-r border-line p-3 last:border-r-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 truncate", children: [
                /* @__PURE__ */ jsx("div", { className: "flex h-7 w-7 items-center justify-center rounded-full bg-accent-quiet text-xs font-bold text-accent-text", children: emp.name.charAt(0) }),
                /* @__PURE__ */ jsxs("div", { className: "truncate", children: [
                  /* @__PURE__ */ jsx("p", { className: "truncate text-xs font-semibold text-ink", children: emp.name }),
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: tt("Technician") })
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleSlotClick(emp.id),
                  title: "Book appointment for this tech",
                  className: "rounded p-1 text-ink-muted hover:bg-surface hover:text-ink transition-colors",
                  children: /* @__PURE__ */ jsx(Plus, { size: 14 })
                }
              )
            ] }, emp.id))
          ] }),
          /* @__PURE__ */ jsx("div", { className: "divide-y divide-line", children: HOURS.map((hour) => {
            const hourLabel = `${String(hour).padStart(2, "0")}:00`;
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: "grid min-h-[90px]",
                style: { gridTemplateColumns: `100px repeat(${Math.max(employees.length, 1)}, minmax(220px, 1fr))` },
                children: [
                  /* @__PURE__ */ jsx("div", { className: "border-r border-line p-2.5 text-center text-xs font-medium text-ink-muted bg-sunken/10", children: hourLabel }),
                  employees.length === 0 ? /* @__PURE__ */ jsx(
                    "div",
                    {
                      onClick: () => handleSlotClick("", hour),
                      className: "group relative border-r border-line p-2 transition-colors hover:bg-accent-quiet/20 cursor-pointer",
                      children: /* @__PURE__ */ jsx("span", { className: "hidden text-2xs font-semibold text-accent-text group-hover:inline-block", children: "+ Book slot" })
                    }
                  ) : employees.map((emp) => {
                    const laneJobs = getJobsForLane(emp.id, dateFormattedString).filter((j) => {
                      if (!j.scheduled_start_at) return hour === 9;
                      const jobHour = new Date(j.scheduled_start_at).getHours();
                      return jobHour === hour;
                    });
                    return /* @__PURE__ */ jsx(
                      "div",
                      {
                        onClick: (e) => {
                          if (e.target === e.currentTarget) handleSlotClick(emp.id, hour);
                        },
                        className: "group relative border-r border-line p-1.5 transition-colors hover:bg-accent-quiet/10 cursor-pointer last:border-r-0",
                        children: laneJobs.map((job) => {
                          const meta = STATUS_META[job.status] || STATUS_META.draft;
                          return /* @__PURE__ */ jsxs(
                            "div",
                            {
                              onClick: (e) => {
                                e.stopPropagation();
                                setSelectedJob(job);
                              },
                              className: `mb-1.5 rounded-lg border p-2 text-xs shadow-xs transition-transform hover:-translate-y-0.5 cursor-pointer ${meta.badge}`,
                              children: [
                                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-1", children: [
                                  /* @__PURE__ */ jsx("span", { className: "font-semibold text-ink truncate", children: job.title }),
                                  /* @__PURE__ */ jsx("span", { className: "text-2xs font-mono font-bold opacity-80 shrink-0", children: job.number })
                                ] }),
                                /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center justify-between text-2xs text-ink-secondary", children: [
                                  /* @__PURE__ */ jsx("span", { className: "truncate", children: job.party?.name || "Walk-in" }),
                                  job.estimated_total > 0 && /* @__PURE__ */ jsx("span", { className: "font-semibold", children: formatCurrency(job.estimated_total) })
                                ] }),
                                job.site_address && /* @__PURE__ */ jsxs("p", { className: "mt-1 flex items-center gap-1 text-2xs text-ink-muted truncate", children: [
                                  /* @__PURE__ */ jsx(MapPin, { size: 10, className: "shrink-0" }),
                                  /* @__PURE__ */ jsx("span", { className: "truncate", children: job.site_address })
                                ] })
                              ]
                            },
                            job.id
                          );
                        })
                      },
                      emp.id
                    );
                  })
                ]
              },
              hour
            );
          }) })
        ] }) }),
        viewMode === "week" && /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-xl border border-line bg-surface shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "min-w-[850px]", children: [
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 border-b border-line bg-sunken/40 divide-x divide-line", children: weekDays.map((day, idx) => {
            const isToday = day.toDateString() === (/* @__PURE__ */ new Date()).toDateString();
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: `p-3 text-center ${isToday ? "bg-accent-quiet/40" : ""}`,
                children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted", children: day.toLocaleDateString(void 0, { weekday: "short" }) }),
                  /* @__PURE__ */ jsx("p", { className: `mt-0.5 text-sm font-semibold ${isToday ? "text-accent-text font-bold" : "text-ink"}`, children: day.getDate() })
                ]
              },
              idx
            );
          }) }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 divide-x divide-line min-h-[480px]", children: weekDays.map((day, idx) => {
            const dayStr = day.toISOString().split("T")[0];
            const dayJobs = filteredJobs.filter((j) => {
              const jobDate = j.scheduled_start_at ? j.scheduled_start_at.split(" ")[0] : j.scheduled_for;
              return jobDate === dayStr;
            });
            return /* @__PURE__ */ jsxs(
              "div",
              {
                onClick: () => {
                  setQuickBookForm((prev) => ({ ...prev, date: dayStr }));
                  setIsQuickBookOpen(true);
                },
                className: "group p-2 hover:bg-sunken/20 cursor-pointer space-y-2",
                children: [
                  dayJobs.map((job) => {
                    const meta = STATUS_META[job.status] || STATUS_META.draft;
                    const tech = job.assignments?.[0]?.employee?.name;
                    return /* @__PURE__ */ jsxs(
                      "div",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          setSelectedJob(job);
                        },
                        className: `rounded-lg border p-2 text-xs shadow-xs transition-transform hover:-translate-y-0.5 cursor-pointer ${meta.badge}`,
                        children: [
                          /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between gap-1", children: /* @__PURE__ */ jsx("span", { className: "font-semibold text-ink truncate", children: job.title }) }),
                          /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-secondary truncate", children: job.party?.name }),
                          tech && /* @__PURE__ */ jsxs("p", { className: "mt-1 flex items-center gap-1 text-2xs text-accent-text font-medium truncate", children: [
                            /* @__PURE__ */ jsx(User, { size: 10 }),
                            /* @__PURE__ */ jsx("span", { children: tech })
                          ] })
                        ]
                      },
                      job.id
                    );
                  }),
                  dayJobs.length === 0 && /* @__PURE__ */ jsx("div", { className: "py-8 text-center opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsx("span", { className: "text-2xs font-semibold text-accent-text", children: "+ Add Job" }) })
                ]
              },
              idx
            );
          }) })
        ] }) }),
        viewMode === "agenda" && /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-line bg-surface shadow-sm overflow-hidden", children: filteredJobs.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-12 text-center", children: [
          /* @__PURE__ */ jsx(Briefcase, { size: 36, className: "mx-auto text-ink-muted/50 mb-3" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-ink", children: "No scheduled appointments found" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-secondary", children: tt("Schedule a new job using Quick Book or Work Orders.") })
        ] }) : /* @__PURE__ */ jsx("div", { className: "divide-y divide-line", children: filteredJobs.map((job) => {
          const meta = STATUS_META[job.status] || STATUS_META.draft;
          const tech = job.assignments?.[0]?.employee?.name;
          const timeStr = job.scheduled_start_at ? new Date(job.scheduled_start_at).toLocaleString(void 0, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }) : job.scheduled_for || "Unscheduled";
          return /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => setSelectedJob(job),
              className: "flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-sunken/40 cursor-pointer transition-colors",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-accent-quiet text-accent-text", children: /* @__PURE__ */ jsx(Calendar, { size: 18 }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-semibold text-ink text-sm", children: job.title }),
                      /* @__PURE__ */ jsxs("span", { className: "font-mono text-2xs text-ink-muted", children: [
                        "(",
                        job.number,
                        ")"
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: `inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold border ${meta.badge}`, children: meta.label })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-secondary", children: [
                      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                        /* @__PURE__ */ jsx(User, { size: 12, className: "text-ink-muted" }),
                        job.party?.name || tt("Walk-in Customer")
                      ] }),
                      tech && /* @__PURE__ */ jsx("span", { className: "flex items-center gap-1 font-medium text-accent-text", children: /* @__PURE__ */ jsxs("span", { children: [
                        "Tech: ",
                        tech
                      ] }) }),
                      job.site_address && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                        /* @__PURE__ */ jsx(MapPin, { size: 12, className: "text-ink-muted" }),
                        job.site_address
                      ] })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-ink", children: timeStr }),
                    job.estimated_total > 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted font-mono", children: formatCurrency(job.estimated_total) })
                  ] }),
                  /* @__PURE__ */ jsx(
                    Link,
                    {
                      href: route("store.service-jobs.show", { store_slug: storeSlug, serviceJob: job.id }),
                      onClick: (e) => e.stopPropagation(),
                      className: "rounded-lg border border-line bg-app p-2 text-ink-muted hover:text-ink hover:bg-sunken",
                      children: /* @__PURE__ */ jsx(ExternalLink, { size: 15 })
                    }
                  )
                ] })
              ]
            },
            job.id
          );
        }) }) })
      ] })
    ] }),
    isQuickBookOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-xl rounded-2xl border border-line bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-line pb-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-display text-lg font-semibold text-ink flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Sparkles, { size: 18, className: "text-accent-text" }),
            tt("Quick Book Service Appointment")
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-ink-secondary", children: tt("Schedule a service job with auto-pricing and lane dispatching.") })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setIsQuickBookOpen(false),
            className: "rounded-md p-1.5 text-ink-muted hover:bg-sunken hover:text-ink",
            children: /* @__PURE__ */ jsx(X, { size: 18 })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submitQuickBook, className: "mt-4 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: tt("Select Catalog Service (Optional)") }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: quickBookForm.service_product_id,
              onChange: (e) => handleServiceChange(e.target.value),
              className: "w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "-- Choose standard service or enter custom title --" }),
                services.map((svc) => /* @__PURE__ */ jsxs("option", { value: svc.id, children: [
                  svc.name,
                  " (",
                  formatCurrency(svc.price || 0),
                  " • ",
                  svc.default_duration || 60,
                  "m)"
                ] }, svc.id))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: tt("Job Title / Summary *") }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                required: true,
                value: quickBookForm.title,
                onChange: (e) => setQuickBookForm({ ...quickBookForm, title: e.target.value }),
                placeholder: "e.g. AC Gas Refill & Cleaning",
                className: "w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: tt("Assign Technician") }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: quickBookForm.technician_id,
                onChange: (e) => setQuickBookForm({ ...quickBookForm, technician_id: e.target.value }),
                className: "w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Unassigned Queue" }),
                  employees.map((emp) => /* @__PURE__ */ jsx("option", { value: emp.id, children: emp.name }, emp.id))
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: "Date *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                required: true,
                value: quickBookForm.date,
                onChange: (e) => setQuickBookForm({ ...quickBookForm, date: e.target.value }),
                className: "w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: "Start Time" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "time",
                value: quickBookForm.start_time,
                onChange: (e) => setQuickBookForm({ ...quickBookForm, start_time: e.target.value }),
                className: "w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: "End Time" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "time",
                value: quickBookForm.end_time,
                onChange: (e) => setQuickBookForm({ ...quickBookForm, end_time: e.target.value }),
                className: "w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: "Estimated Price / Value" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                step: "0.01",
                value: quickBookForm.estimated_total,
                onChange: (e) => setQuickBookForm({ ...quickBookForm, estimated_total: e.target.value }),
                placeholder: "0.00",
                className: "w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: "Priority" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: quickBookForm.priority,
                onChange: (e) => setQuickBookForm({ ...quickBookForm, priority: e.target.value }),
                className: "w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "low", children: "Low" }),
                  /* @__PURE__ */ jsx("option", { value: "normal", children: "Normal" }),
                  /* @__PURE__ */ jsx("option", { value: "high", children: "High" }),
                  /* @__PURE__ */ jsx("option", { value: "urgent", children: "Urgent" })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: "Site Address (For on-site jobs)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: quickBookForm.site_address,
              onChange: (e) => setQuickBookForm({ ...quickBookForm, site_address: e.target.value }),
              placeholder: "e.g. House 44, Block B, DHA Phase 5",
              className: "w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2.5 border-t border-line pt-4", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setIsQuickBookOpen(false),
              className: "rounded-lg border border-line px-4 py-2 text-xs font-semibold text-ink-secondary hover:bg-sunken hover:text-ink",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              className: "inline-flex items-center gap-1.5 rounded-lg bg-accent-fill px-4 py-2 text-xs font-semibold text-accent-on shadow-glow hover:bg-accent-fill-hover",
              children: [
                /* @__PURE__ */ jsx(CheckCircle2, { size: 14 }),
                "Book Appointment"
              ]
            }
          )
        ] })
      ] })
    ] }) }),
    selectedJob && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md h-full bg-surface border-l border-line p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-fast", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-line pb-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-2xs font-mono font-bold text-accent-text", children: selectedJob.number }),
            /* @__PURE__ */ jsx("h3", { className: "font-display text-lg font-semibold text-ink", children: selectedJob.title })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setSelectedJob(null),
              className: "rounded-md p-1.5 text-ink-muted hover:bg-sunken hover:text-ink",
              children: /* @__PURE__ */ jsx(X, { size: 18 })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 space-y-4 text-xs", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-line bg-app p-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xs font-semibold uppercase tracking-wider text-ink-muted", children: "Customer" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 font-semibold text-ink", children: selectedJob.party?.name || "Walk-in" }),
            selectedJob.party?.phone && /* @__PURE__ */ jsx("p", { className: "text-ink-secondary", children: selectedJob.party.phone })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-line bg-app p-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xs font-semibold uppercase tracking-wider text-ink-muted", children: tt("Technician & Schedule") }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 font-semibold text-ink", children: selectedJob.assignments?.[0]?.employee?.name || "Unassigned" }),
            /* @__PURE__ */ jsx("p", { className: "text-ink-secondary mt-0.5", children: selectedJob.scheduled_start_at ? new Date(selectedJob.scheduled_start_at).toLocaleString() : selectedJob.scheduled_for || "Date not set" })
          ] }),
          selectedJob.site_address && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-line bg-app p-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xs font-semibold uppercase tracking-wider text-ink-muted", children: "Site Location" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-ink", children: selectedJob.site_address })
          ] }),
          selectedJob.lines?.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xs font-semibold uppercase tracking-wider text-ink-muted mb-2", children: "Scope & Lines" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: selectedJob.lines.map((line) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-b border-line/50 pb-1 text-ink", children: [
              /* @__PURE__ */ jsx("span", { children: line.description }),
              /* @__PURE__ */ jsx("span", { className: "font-mono font-medium", children: formatCurrency(line.unit_price * line.quantity) })
            ] }, line.id)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "border-t border-line pt-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-xs font-semibold text-ink", children: [
          "Value: ",
          formatCurrency(selectedJob.estimated_total || 0)
        ] }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("store.service-jobs.show", { store_slug: storeSlug, serviceJob: selectedJob.id }),
            className: "inline-flex items-center gap-1.5 rounded-lg bg-accent-fill px-4 py-2 text-xs font-semibold text-accent-on shadow-glow hover:bg-accent-fill-hover",
            children: [
              /* @__PURE__ */ jsx("span", { children: tt("Open Full Job") }),
              /* @__PURE__ */ jsx(ExternalLink, { size: 13 })
            ]
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  ServiceCalendar as default
};
