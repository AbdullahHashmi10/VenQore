import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { Mail, MessageSquareWarning, Search, CheckCircle2, ChevronDown, AlertTriangle, Info } from "lucide-react";
import MarketingLayout from "./MarketingLayout-cwTDSbNB.js";
import "@inertiajs/react";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./CookieConsent-DgIWvNoO.js";
import "motion/react";
import "./SiteChrome-CBP-bGRL.js";
const RESOLVED = ["resolved", "fixed", "closed"];
const MITIGATED = ["mitigated", "workaround available", "monitoring"];
const stateOf = (status = "") => {
  const s = String(status).toLowerCase();
  if (RESOLVED.includes(s)) return "resolved";
  if (MITIGATED.includes(s)) return "mitigated";
  return "open";
};
const STATE_META = {
  open: { label: "Open", tone: "warning" },
  mitigated: { label: "Mitigated", tone: "info" },
  resolved: { label: "Resolved", tone: "success" }
};
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const fmtDate = (d) => {
  if (!d) return "";
  const dt = /* @__PURE__ */ new Date(`${d}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString(void 0, { day: "numeric", month: "short", year: "numeric" });
};
function Banner({ open, mitigated, worst }) {
  let tone = "success";
  let Icon = CheckCircle2;
  let title = "No open issues";
  let sub = "Everything we know about is resolved.";
  if (open > 0) {
    tone = worst === "high" || worst === "critical" ? "warning" : "info";
    Icon = tone === "warning" ? AlertTriangle : Info;
    title = `${open} open ${open === 1 ? "issue" : "issues"} we are working on`;
    sub = "Details, impact and a workaround for each are below.";
  } else if (mitigated > 0) {
    tone = "info";
    Icon = Info;
    title = `${mitigated} ${mitigated === 1 ? "issue has" : "issues have"} a workaround in place`;
    sub = "A permanent fix is still in progress.";
  }
  return /* @__PURE__ */ jsxs("div", { className: `vq-status-banner vq-status-banner--${tone}`, role: "status", children: [
    /* @__PURE__ */ jsx(Icon, { size: 26, "aria-hidden": "true" }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "vq-status-banner__title", children: title }),
      /* @__PURE__ */ jsx("p", { className: "vq-status-banner__sub", children: sub })
    ] })
  ] });
}
function IssueRow({ issue, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const state = stateOf(issue.status);
  const meta = STATE_META[state];
  const sev = String(issue.severity || "").toLowerCase();
  const panelId = `issue-${issue.id}`;
  return /* @__PURE__ */ jsxs("li", { className: `vq-issue vq-issue--${state}${open ? " is-open" : ""}`, children: [
    /* @__PURE__ */ jsxs("button", { type: "button", className: "vq-issue__head", "aria-expanded": open, "aria-controls": panelId, onClick: () => setOpen(!open), children: [
      /* @__PURE__ */ jsx("span", { className: `vq-issue__dot vq-issue__dot--${meta.tone}`, "aria-hidden": "true" }),
      /* @__PURE__ */ jsxs("span", { className: "vq-issue__main", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-issue__title", children: issue.title }),
        /* @__PURE__ */ jsxs("span", { className: "vq-issue__meta", children: [
          /* @__PURE__ */ jsx("span", { className: "vq-issue__id", children: issue.id }),
          /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "·" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Updated ",
            fmtDate(issue.updated_at)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "vq-issue__chips", children: [
        sev && /* @__PURE__ */ jsx("span", { className: `vq-sev vq-sev--${sev}`, children: issue.severity }),
        /* @__PURE__ */ jsx("span", { className: `vq-badge vq-badge--${meta.tone}`, children: issue.status || meta.label })
      ] }),
      /* @__PURE__ */ jsx(ChevronDown, { size: 18, className: "vq-issue__chev", "aria-hidden": "true" })
    ] }),
    /* @__PURE__ */ jsx("div", { id: panelId, className: "vq-issue__body", hidden: !open, children: /* @__PURE__ */ jsxs("dl", { children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("dt", { children: "Impact" }),
        /* @__PURE__ */ jsx("dd", { children: issue.impact })
      ] }),
      issue.workaround && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("dt", { children: state === "resolved" ? "Resolution" : "Workaround" }),
        /* @__PURE__ */ jsx("dd", { children: issue.workaround })
      ] })
    ] }) })
  ] });
}
function KnownIssues({ issues = [], lastUpdated }) {
  const [query, setQuery] = useState("");
  const { openList, mitigatedList, resolvedList, worst } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (i) => !q || [i.title, i.id, i.impact, i.workaround].some((t) => String(t || "").toLowerCase().includes(q));
    const bySeverity = (a, b) => (SEVERITY_ORDER[String(a.severity).toLowerCase()] ?? 9) - (SEVERITY_ORDER[String(b.severity).toLowerCase()] ?? 9);
    const list = issues.filter(match);
    const openL = list.filter((i) => stateOf(i.status) === "open").sort(bySeverity);
    const worstSev = issues.filter((i) => stateOf(i.status) === "open").map((i) => String(i.severity).toLowerCase()).sort((a, b) => (SEVERITY_ORDER[a] ?? 9) - (SEVERITY_ORDER[b] ?? 9))[0];
    return {
      openList: openL,
      mitigatedList: list.filter((i) => stateOf(i.status) === "mitigated").sort(bySeverity),
      resolvedList: list.filter((i) => stateOf(i.status) === "resolved").sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))),
      worst: worstSev
    };
  }, [issues, query]);
  const totals = useMemo(() => ({
    open: issues.filter((i) => stateOf(i.status) === "open").length,
    mitigated: issues.filter((i) => stateOf(i.status) === "mitigated").length,
    resolved: issues.filter((i) => stateOf(i.status) === "resolved").length
  }), [issues]);
  const Group = ({ title, list, defaultOpen, empty }) => /* @__PURE__ */ jsxs("section", { className: "vq-status-group", "aria-label": title, children: [
    /* @__PURE__ */ jsxs("div", { className: "vq-status-group__head", children: [
      /* @__PURE__ */ jsx("h2", { children: title }),
      /* @__PURE__ */ jsx("span", { className: "vq-status-group__count", children: list.length })
    ] }),
    list.length ? /* @__PURE__ */ jsx("ul", { className: "vq-issue-list", children: list.map((i) => /* @__PURE__ */ jsx(IssueRow, { issue: i, defaultOpen }, i.id)) }) : /* @__PURE__ */ jsx("p", { className: "vq-status-empty", children: empty })
  ] });
  return /* @__PURE__ */ jsx(
    MarketingLayout,
    {
      title: "Known issues & status",
      description: "Live list of known VenQore issues — what is affected, the workaround, and when it was last updated.",
      children: /* @__PURE__ */ jsx("section", { className: "vq-section vq-status-page", children: /* @__PURE__ */ jsxs("div", { className: "vq-container vq-status-wrap", children: [
        /* @__PURE__ */ jsxs("header", { className: "vq-status-top", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Status" }),
            /* @__PURE__ */ jsx("h1", { className: "vq-h1 vq-mt-3", children: "Known issues" }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-3", children: "What we know is not working perfectly, who it affects, and what to do until it is fixed." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-status-actions", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--secondary", href: "/subscribe", children: [
              /* @__PURE__ */ jsx(Mail, { size: 16, "aria-hidden": "true" }),
              " Get updates"
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary", href: "/contact", children: [
              /* @__PURE__ */ jsx(MessageSquareWarning, { size: 16, "aria-hidden": "true" }),
              " Report an issue"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(Banner, { open: totals.open, mitigated: totals.mitigated, worst }),
        /* @__PURE__ */ jsxs("div", { className: "vq-status-bar", children: [
          /* @__PURE__ */ jsxs("dl", { className: "vq-status-counts", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("dt", { children: [
                /* @__PURE__ */ jsx("span", { className: "vq-issue__dot vq-issue__dot--warning", "aria-hidden": "true" }),
                "Open"
              ] }),
              /* @__PURE__ */ jsx("dd", { children: totals.open })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("dt", { children: [
                /* @__PURE__ */ jsx("span", { className: "vq-issue__dot vq-issue__dot--info", "aria-hidden": "true" }),
                "Mitigated"
              ] }),
              /* @__PURE__ */ jsx("dd", { children: totals.mitigated })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("dt", { children: [
                /* @__PURE__ */ jsx("span", { className: "vq-issue__dot vq-issue__dot--success", "aria-hidden": "true" }),
                "Resolved"
              ] }),
              /* @__PURE__ */ jsx("dd", { children: totals.resolved })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "vq-status-search", children: [
            /* @__PURE__ */ jsx(Search, { size: 16, "aria-hidden": "true" }),
            /* @__PURE__ */ jsx("span", { className: "vq-sr-only", children: "Search issues" }),
            /* @__PURE__ */ jsx("input", { type: "search", value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Search by title or ID" })
          ] })
        ] }),
        /* @__PURE__ */ jsx(Group, { title: "Open", list: openList, defaultOpen: true, empty: "No open issues match." }),
        /* @__PURE__ */ jsx(Group, { title: "Mitigated — workaround in place", list: mitigatedList, defaultOpen: false, empty: "Nothing here right now." }),
        /* @__PURE__ */ jsx(Group, { title: "Resolved", list: resolvedList, defaultOpen: false, empty: "No resolved issues match." }),
        lastUpdated && /* @__PURE__ */ jsxs("p", { className: "vq-status-foot", children: [
          "Board last updated ",
          fmtDate(lastUpdated),
          ". Times are shown in your local date format."
        ] })
      ] }) })
    }
  );
}
export {
  KnownIssues as default
};
