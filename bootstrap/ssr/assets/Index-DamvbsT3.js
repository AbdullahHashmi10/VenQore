import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import MarketingLayout, { RevealOnScroll, SectionLabel, MagneticButton } from "./MarketingLayout-CMiC1Bik.js";
import { Link } from "@inertiajs/react";
import { Sparkles, BookOpen, Clock, ArrowRight, ChevronRight } from "lucide-react";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
const FeaturedPost = ({ post }) => /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsx(Link, { href: `/blog/${post.slug}`, className: "block group", children: /* @__PURE__ */ jsx("div", { className: "relative rounded-[3rem] bg-white/[0.02] border border-white/[0.06] overflow-hidden hover:border-indigo-500/20 hover:bg-white/[0.04] transition-all duration-700", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2", children: [
  /* @__PURE__ */ jsxs("div", { className: "relative aspect-[16/10] lg:aspect-auto bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent flex items-center justify-center overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 vq-grid-pattern opacity-50" }),
    /* @__PURE__ */ jsxs("div", { className: "relative text-center p-12", children: [
      /* @__PURE__ */ jsx("div", { className: "text-8xl font-black text-white/[0.04] font-display tracking-tighter leading-none group-hover:text-white/[0.06] transition-colors duration-700", children: "01" }),
      /* @__PURE__ */ jsx(BookOpen, { size: 48, className: "text-indigo-500/20 mx-auto mt-4 group-hover:text-indigo-500/30 group-hover:scale-110 transition-all duration-700" })
    ] })
  ] }),
  /* @__PURE__ */ jsxs("div", { className: "p-8 md:p-12 flex flex-col justify-center", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
      /* @__PURE__ */ jsx("span", { className: "px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black tracking-[0.2em] uppercase", children: post.category }),
      /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(Clock, { size: 10 }),
        " ",
        post.date
      ] })
    ] }),
    /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-black text-white tracking-tight leading-tight mb-4 font-display group-hover:text-indigo-100 transition-colors", children: post.title }),
    /* @__PURE__ */ jsx("p", { className: "text-slate-500 leading-relaxed mb-8 line-clamp-3", children: post.excerpt }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-600 font-bold", children: post.author }),
      /* @__PURE__ */ jsxs("span", { className: "text-indigo-400 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-2 group-hover:gap-3 transition-all", children: [
        "Read Article ",
        /* @__PURE__ */ jsx(ArrowRight, { size: 13 })
      ] })
    ] })
  ] })
] }) }) }) });
const PostCard = ({ post, index }) => /* @__PURE__ */ jsx(RevealOnScroll, { delay: index * 0.1, children: /* @__PURE__ */ jsx(Link, { href: `/blog/${post.slug}`, className: "block group h-full", children: /* @__PURE__ */ jsxs("div", { className: "rounded-[2rem] bg-white/[0.02] border border-white/[0.06] overflow-hidden hover:border-indigo-500/20 hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-500 h-full flex flex-col", children: [
  /* @__PURE__ */ jsxs("div", { className: "relative aspect-[16/9] bg-gradient-to-br from-indigo-500/5 to-purple-500/5 flex items-center justify-center overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 vq-dot-pattern" }),
    /* @__PURE__ */ jsx("div", { className: "text-6xl font-black text-white/[0.03] font-display tracking-tighter group-hover:text-white/[0.05] transition-colors duration-500", children: String(index + 2).padStart(2, "0") })
  ] }),
  /* @__PURE__ */ jsxs("div", { className: "p-7 flex flex-col flex-1", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
      /* @__PURE__ */ jsx("span", { className: "px-2.5 py-0.5 rounded-full bg-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest", children: post.category }),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-700 font-bold", children: post.date })
    ] }),
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white tracking-tight leading-snug mb-3 font-display group-hover:text-indigo-100 transition-colors flex-1", children: post.title }),
    /* @__PURE__ */ jsx("p", { className: "text-slate-600 text-sm leading-relaxed mb-5 line-clamp-2", children: post.excerpt }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-auto pt-4 border-t border-white/5", children: [
      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-700 font-bold", children: post.author }),
      /* @__PURE__ */ jsx(ChevronRight, { size: 14, className: "text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" })
    ] })
  ] })
] }) }) });
function BlogIndex({ posts = [] }) {
  const featured = posts[0];
  const rest = posts.slice(1);
  return /* @__PURE__ */ jsxs(
    MarketingLayout,
    {
      title: "Blog — VenQore",
      description: "Insights on financial accuracy, inventory management, and building operations that don't lie about your numbers.",
      children: [
        /* @__PURE__ */ jsx("section", { className: "relative pt-40 pb-16 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto text-center", children: [
          /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsx(SectionLabel, { icon: Sparkles, children: "The Signal" }) }),
          /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.1, children: /* @__PURE__ */ jsxs("h1", { className: "text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-6 font-display", children: [
            /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent", children: "Ideas That" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent vq-text-glow", children: "Matter." })
          ] }) }),
          /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.2, children: /* @__PURE__ */ jsx("p", { className: "text-lg text-slate-500 max-w-xl mx-auto", children: "Deep dives into financial accuracy, operational control, and the hidden mechanics that make or break a business." }) })
        ] }) }),
        featured && /* @__PURE__ */ jsx("section", { className: "py-8 px-6", children: /* @__PURE__ */ jsx("div", { className: "max-w-6xl mx-auto", children: /* @__PURE__ */ jsx(FeaturedPost, { post: featured }) }) }),
        rest.length > 0 && /* @__PURE__ */ jsx("section", { className: "py-16 px-6", children: /* @__PURE__ */ jsx("div", { className: "max-w-6xl mx-auto", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: rest.map((post, i) => /* @__PURE__ */ jsx(PostCard, { post, index: i }, post.uid || i)) }) }) }),
        /* @__PURE__ */ jsx("section", { className: "py-32 px-6", children: /* @__PURE__ */ jsx("div", { className: "max-w-3xl mx-auto text-center", children: /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] border border-white/[0.06] rounded-[3rem] p-12 md:p-16 relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" }),
          /* @__PURE__ */ jsxs("h2", { className: "text-3xl md:text-4xl font-black text-white tracking-tighter font-display mb-4", children: [
            "Stay ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-400", children: "Sharp." })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 mb-10 max-w-sm mx-auto", children: "Get our best thinking on financial accuracy and operational control. No spam. No filler." }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                placeholder: "your@email.com",
                className: "flex-1 w-full px-6 py-4 bg-white/[0.04] border border-white/[0.08] rounded-full text-white text-sm placeholder:text-slate-700 outline-none focus:border-indigo-500/40 transition-colors"
              }
            ),
            /* @__PURE__ */ jsx(MagneticButton, { variant: "accent", className: "whitespace-nowrap w-full sm:w-auto justify-center", children: "Subscribe" })
          ] })
        ] }) }) }) })
      ]
    }
  );
}
export {
  BlogIndex as default
};
