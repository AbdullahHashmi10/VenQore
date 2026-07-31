import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import MarketingLayout, { RevealOnScroll, MagneticButton } from "./MarketingLayout-CMiC1Bik.js";
import { Link } from "@inertiajs/react";
import { ArrowLeft, Clock, Share2, ArrowRight, ChevronRight } from "lucide-react";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
const RelatedPost = ({ post, index }) => /* @__PURE__ */ jsx(RevealOnScroll, { delay: index * 0.1, children: /* @__PURE__ */ jsx(Link, { href: `/blog/${post.slug}`, className: "block group", children: /* @__PURE__ */ jsxs("div", { className: "rounded-[2rem] bg-white/[0.02] border border-white/[0.06] p-6 hover:border-indigo-500/20 hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-500", children: [
  /* @__PURE__ */ jsx("span", { className: "px-2.5 py-0.5 rounded-full bg-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 inline-block", children: post.category }),
  /* @__PURE__ */ jsx("h4", { className: "text-base font-bold text-white tracking-tight leading-snug mb-2 group-hover:text-indigo-100 transition-colors line-clamp-2", children: post.title }),
  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-3 pt-3 border-t border-white/5", children: [
    /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-700 font-bold", children: post.date }),
    /* @__PURE__ */ jsx(ChevronRight, { size: 14, className: "text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" })
  ] })
] }) }) });
const ArticleContent = ({ content }) => {
  if (!content) return null;
  const paragraphs = content.split("\n\n");
  return /* @__PURE__ */ jsx("div", { className: "space-y-6", children: paragraphs.map((para, i) => {
    const trimmed = para.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("> ")) {
      return /* @__PURE__ */ jsx("blockquote", { className: "border-l-2 border-indigo-500/40 pl-6 py-2 text-lg text-indigo-200/80 italic leading-relaxed font-medium", children: trimmed.replace(/^>\s*/, "") }, i);
    }
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      return /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-white tracking-tight font-display mt-10 mb-4", children: trimmed.replace(/\*\*/g, "") }, i);
    }
    if (trimmed.startsWith("* ")) {
      const items = trimmed.split("\n").filter((l) => l.trim().startsWith("* "));
      return /* @__PURE__ */ jsx("ul", { className: "space-y-3 pl-1", children: items.map((item, j) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3 text-slate-400 leading-relaxed", children: [
        /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-indigo-500/50 mt-2.5 flex-shrink-0" }),
        /* @__PURE__ */ jsx("span", { children: item.replace(/^\*\s*/, "") })
      ] }, j)) }, i);
    }
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
    return /* @__PURE__ */ jsx("p", { className: "text-slate-400 leading-[1.9] text-[17px]", children: parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return /* @__PURE__ */ jsx("strong", { className: "text-white font-semibold", children: part.replace(/\*\*/g, "") }, j);
      }
      return /* @__PURE__ */ jsx("span", { children: part }, j);
    }) }, i);
  }) });
};
function BlogShow({ post, recentPosts = [] }) {
  if (!post) return null;
  return /* @__PURE__ */ jsxs(
    MarketingLayout,
    {
      title: `${post.title} — VenQore Blog`,
      description: post.excerpt,
      children: [
        /* @__PURE__ */ jsx("section", { className: "relative pt-40 pb-16 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto", children: [
          /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsxs(Link, { href: "/blog", className: "inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-400 transition-colors mb-12 group", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { size: 14, className: "group-hover:-translate-x-1 transition-transform" }),
            /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold uppercase tracking-[0.15em]", children: "Back to Blog" })
          ] }) }),
          /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.05, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-8", children: [
            /* @__PURE__ */ jsx("span", { className: "px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black tracking-[0.2em] uppercase", children: post.category }),
            /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-slate-600 font-bold flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Clock, { size: 11 }),
              " ",
              post.date
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.1, children: /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[1.05] mb-8 font-display", children: post.title }) }),
          /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.15, children: /* @__PURE__ */ jsx("p", { className: "text-xl text-slate-400 leading-relaxed mb-8 font-medium", children: post.excerpt }) }),
          /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.2, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-6 border-y border-white/5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xs font-black", children: post.author?.charAt(0) || "V" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm font-bold text-white", children: post.author }),
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-600 uppercase tracking-widest font-bold", children: post.date })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => navigator.clipboard?.writeText(window.location.href),
                className: "flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-slate-600 hover:text-white hover:border-white/10 transition-all text-[10px] font-black uppercase tracking-widest",
                children: [
                  /* @__PURE__ */ jsx(Share2, { size: 12 }),
                  " Share"
                ]
              }
            )
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "pb-24 px-6", children: /* @__PURE__ */ jsx("div", { className: "max-w-3xl mx-auto", children: /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsx(ArticleContent, { content: post.content }) }) }) }),
        recentPosts.length > 0 && /* @__PURE__ */ jsx("section", { className: "py-24 px-6 border-t border-white/5", children: /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto", children: [
          /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-12", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-white tracking-tight font-display", children: "More from The Signal" }),
            /* @__PURE__ */ jsxs(Link, { href: "/blog", className: "text-indigo-400 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-2 hover:gap-3 transition-all", children: [
              "All Posts ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-5", children: recentPosts.filter((p) => p.slug !== post.slug).slice(0, 3).map((p, i) => /* @__PURE__ */ jsx(RelatedPost, { post: p, index: i }, p.uid || i)) })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "py-24 px-6 text-center", children: /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-3xl md:text-4xl font-black text-white tracking-tighter font-display mb-4", children: [
            "Ready The See the ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-400", children: "Difference?" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 mb-8", children: "14-day free trial. No credit card required." }),
          /* @__PURE__ */ jsxs(MagneticButton, { href: "/register", variant: "primary", children: [
            "Start Free Trial ",
            /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
          ] })
        ] }) }) })
      ]
    }
  );
}
export {
  BlogShow as default
};
