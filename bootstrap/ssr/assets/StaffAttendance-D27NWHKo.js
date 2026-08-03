import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, router, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { C as ContactsModuleTabs } from "./ContactsModuleTabs-Xp8OjljE.js";
import { UserCheck, CheckCircle, XCircle, AlertTriangle, Timer, Calendar, Search, Download, Printer, User, Coffee, TrendingUp, Monitor, Eye, Shield, Clock } from "lucide-react";
import { u as useAlert } from "../ssr.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "laravel-echo";
import "pusher-js";
function StaffAttendanceIndex({ staff = [], attendance = [], gaps = [], terminalActivities = [], filters = {} }) {
  const { store } = usePage().props;
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState(filters.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  const [activeSubTab, setActiveSubTab] = useState("attendance");
  const [selectedScreenshotId, setSelectedScreenshotId] = useState(null);
  const { showAlert } = useAlert();
  const stats = useMemo(() => {
    const currentData = attendance;
    return {
      totalStaff: staff.length,
      present: currentData.filter((a) => a.status === "present").length,
      absent: staff.length - currentData.filter((a) => a.status === "present").length,
      pendingGaps: gaps.filter((g) => g.status === "pending").length,
      totalHoursToday: currentData.reduce((sum, a) => sum + parseFloat(a.hours_worked || 0), 0)
    };
  }, [staff, attendance, gaps]);
  const filteredStaff = useMemo(() => {
    return staff.filter(
      (s) => !searchTerm || s.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staff, searchTerm]);
  const getStatusStyle = (status) => {
    switch (status) {
      case "present":
        return { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle, label: "Present" };
      case "absent":
        return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: XCircle, label: "Absent" };
      case "late":
        return { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", icon: Clock, label: "Late" };
      case "on_break":
        return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: Coffee, label: "On Break" };
      default:
        return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-500 dark:text-slate-400", icon: User, label: status || "Absent" };
    }
  };
  const formatTime = (time) => {
    if (!time) return "-";
    return (/* @__PURE__ */ new Date(`2000-01-01T${time}`)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "-";
    try {
      return new Date(dateTimeStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return dateTimeStr;
    }
  };
  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };
  const handleApproveGap = (gapId) => {
    router.post(route("store.staff-attendance.approve-gap", { store_slug: store.slug, id: gapId }), {}, {
      onSuccess: () => showAlert({ title: "Approved", message: "Gap claim approved", type: "success" })
    });
  };
  const handleRejectGap = (gapId) => {
    router.post(route("store.staff-attendance.reject-gap", { store_slug: store.slug, id: gapId }), {}, {
      onSuccess: () => showAlert({ title: "Rejected", message: "Gap claim rejected", type: "info" })
    });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Staff Attendance", activeMenu: "Staff Attendance", mode: "admin", children: [
    /* @__PURE__ */ jsx(Head, { title: "Staff Attendance" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(ContactsModuleTabs, { activeTab: "attendance" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-5 gap-1 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(UserCheck, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Staff" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-slate-900 dark:text-white", children: stats.totalStaff })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckCircle, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Present" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-emerald-600", children: stats.present })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg", children: /* @__PURE__ */ jsx(XCircle, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Absent" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-red-600", children: stats.absent })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Pending Gaps" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-amber-600", children: stats.pendingGaps })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg", children: /* @__PURE__ */ jsx(Timer, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Hours Today" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-lg font-black text-purple-600", children: [
            stats.totalHoursToday.toFixed(1),
            "h"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
            "Staff ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Attendance" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-bold uppercase shrink-0", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setActiveSubTab("attendance"),
                className: `px-2.5 py-1 rounded-md transition-all ${activeSubTab === "attendance" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`,
                children: "📋 Staff Log"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setActiveSubTab("security"),
                className: `px-2.5 py-1 rounded-md transition-all ${activeSubTab === "security" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`,
                children: "🛡️ Terminal Security"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Calendar, { size: 14, className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: dateFilter,
                onChange: (e) => {
                  const newDate = e.target.value;
                  setDateFilter(newDate);
                  router.get(route("store.staff-attendance.index", { store_slug: store.slug }), { date: newDate }, { preserveState: true, preserveScroll: true });
                },
                className: "pl-8 pr-2 py-1 text-sm font-medium bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-0 cursor-pointer text-slate-600 dark:text-slate-300 w-36"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          activeSubTab === "attendance" && /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                placeholder: "Search staff...",
                className: "pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 outline-none w-44"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2", children: [
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600", title: "Export", children: /* @__PURE__ */ jsx(Download, { size: 16 }) }),
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500", title: "Print", children: /* @__PURE__ */ jsx(Printer, { size: 16 }) })
          ] })
        ] })
      ] }),
      activeSubTab === "attendance" && gaps.filter((g) => g.status === "pending").length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-2 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { size: 14, className: "text-amber-600" }),
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-amber-800 dark:text-amber-400 uppercase", children: "Pending Gap Approvals" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: gaps.filter((g) => g.status === "pending").map((gap) => /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-amber-100 dark:border-slate-800 rounded-lg p-2 flex items-center gap-2 shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(User, { size: 12, className: "text-amber-600 dark:text-amber-400" }) }),
          /* @__PURE__ */ jsxs("div", { className: "mr-2", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-800 dark:text-white", children: gap.user?.name }),
            /* @__PURE__ */ jsxs("p", { className: "text-2xs text-slate-500", children: [
              formatTime(gap.start_time),
              " - ",
              formatTime(gap.end_time)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => handleApproveGap(gap.id), className: "p-1 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition-colors", title: "Approve", children: /* @__PURE__ */ jsx(CheckCircle, { size: 12 }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => handleRejectGap(gap.id), className: "p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors", title: "Reject", children: /* @__PURE__ */ jsx(XCircle, { size: 12 }) })
          ] })
        ] }, gap.id)) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900", children: activeSubTab === "attendance" ? /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10", children: [
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Staff Member" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Check In" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Check Out" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Hours" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Breaks" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Gaps" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "History" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: filteredStaff.length > 0 ? filteredStaff.map((member) => {
          const attendanceRecord = attendance.find((a) => a.user_id === member.id && a.date === dateFilter);
          const memberGaps = gaps.filter((g) => g.user_id === member.id);
          const statusStyle = getStatusStyle(attendanceRecord?.status);
          const StatusIcon = statusStyle.icon;
          return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all", children: [
            /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { size: 14, className: "text-indigo-600 dark:text-indigo-400" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-sm text-slate-800 dark:text-white", children: member.name }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-500", children: member.role || "Staff" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${statusStyle.bg} ${statusStyle.text}`, children: [
              /* @__PURE__ */ jsx(StatusIcon, { size: 10 }),
              statusStyle.label
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "p-3 text-center text-sm font-mono text-slate-600 dark:text-slate-400", children: formatTime(attendanceRecord?.check_in) }),
            /* @__PURE__ */ jsx("td", { className: "p-3 text-center text-sm font-mono text-slate-600 dark:text-slate-400", children: formatTime(attendanceRecord?.check_out) }),
            /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsxs("span", { className: "font-bold text-sm text-slate-800 dark:text-white", children: [
              attendanceRecord?.hours_worked?.toFixed(1) || "0",
              "h"
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-2xs font-bold", children: [
              /* @__PURE__ */ jsx(Coffee, { size: 10 }),
              attendanceRecord?.breaks || 0
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: memberGaps.length > 0 ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded text-2xs font-bold", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { size: 10 }),
              memberGaps.length
            ] }) : /* @__PURE__ */ jsx("span", { className: "text-slate-300 dark:text-slate-600", children: "-" }) }),
            /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsx(
              Link,
              {
                href: route("store.staff-attendance.show", { store_slug: store.slug, id: member.id }),
                className: "inline-flex p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all",
                title: "View Full History",
                children: /* @__PURE__ */ jsx(TrendingUp, { size: 16 })
              }
            ) })
          ] }, member.id);
        }) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3", children: /* @__PURE__ */ jsx(UserCheck, { size: 28, className: "text-slate-400" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-slate-700 dark:text-slate-300 mb-1", children: "No staff members found" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Add staff members to start tracking attendance" })
        ] }) }) }) })
      ] }) : /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10", children: [
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Terminal ID / Name" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Device Fingerprint" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Away (Focus Lost)" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Resume (Focus Back)" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Duration" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Screen Capture" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: terminalActivities.length > 0 ? terminalActivities.map((activity) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all", children: [
          /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(Monitor, { size: 14, className: "text-indigo-600 dark:text-indigo-400" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-sm text-slate-800 dark:text-white", children: activity.terminal?.name || "Unknown Terminal" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-500", children: "POS Terminal" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "p-3 text-center text-xs font-mono text-slate-600 dark:text-slate-400", children: activity.device_id ? activity.device_id.substring(0, 16) + "..." : "-" }),
          /* @__PURE__ */ jsx("td", { className: "p-3 text-center text-sm font-mono text-slate-600 dark:text-slate-400", children: formatDateTime(activity.away_at) }),
          /* @__PURE__ */ jsx("td", { className: "p-3 text-center text-sm font-mono text-slate-600 dark:text-slate-400", children: formatDateTime(activity.back_at) }),
          /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400", children: [
            /* @__PURE__ */ jsx(Timer, { size: 10 }),
            formatDuration(activity.duration_seconds)
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: activity.screenshot_path ? /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setSelectedScreenshotId(activity.id),
              className: "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow transition-all",
              children: [
                /* @__PURE__ */ jsx(Eye, { size: 12 }),
                "View Capture"
              ]
            }
          ) : /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 dark:text-slate-600", children: "No Capture" }) })
        ] }, activity.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3", children: /* @__PURE__ */ jsx(Shield, { size: 28, className: "text-slate-400" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-slate-700 dark:text-slate-300 mb-1", children: "No security logs recorded" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Terminal activity is clean for this date" })
        ] }) }) }) })
      ] }) })
    ] }),
    selectedScreenshotId && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-slate-800 pb-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Shield, { className: "text-indigo-500", size: 20 }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-base font-black text-white uppercase", children: "Decrypted Terminal Capture" }),
            /* @__PURE__ */ jsxs("p", { className: "text-2xs text-slate-500 font-bold", children: [
              "Terminal: ",
              terminalActivities.find((a) => a.id === selectedScreenshotId)?.terminal?.name || "Unknown",
              " | Duration Away: ",
              formatDuration(terminalActivities.find((a) => a.id === selectedScreenshotId)?.duration_seconds || 0)
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setSelectedScreenshotId(null),
            className: "p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all",
            children: /* @__PURE__ */ jsx(XCircle, { size: 20 })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-[300px] max-h-[60vh] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800", children: /* @__PURE__ */ jsx(
        "img",
        {
          src: route("store.terminal-activities.screenshot", { store_slug: store.slug, id: selectedScreenshotId }),
          alt: "Terminal screen capture",
          className: "max-w-full max-h-full object-contain",
          onError: (e) => {
            e.target.onerror = null;
            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z'/%3E%3Cline x1='12' y1='9' x2='12' y2='13'/%3E%3Cline x1='12' y1='17' x2='12.01' y2='17'/%3E%3C/svg%3E";
            showAlert({ title: "Error", message: "Failed to decrypt or load screen capture.", type: "error" });
          }
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-end gap-2 border-t border-slate-800 pt-3 text-xs text-slate-500", children: /* @__PURE__ */ jsx("p", { children: "🔒 This screen capture was stored with AES-256 encryption and decrypted securely on request." }) })
    ] }) })
  ] });
}
export {
  StaffAttendanceIndex as default
};
