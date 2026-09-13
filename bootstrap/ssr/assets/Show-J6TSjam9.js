import { jsxs, jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import MarketingLayout from "./MarketingLayout-cwTDSbNB.js";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";
import { marked } from "marked";
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
const ArticleContent = ({ content }) => {
  const html = useMemo(() => {
    if (!content) return "";
    marked.setOptions({
      gfm: true,
      breaks: false,
      headerIds: true,
      mangle: false
    });
    return marked.parse(content);
  }, [content]);
  if (!html) return null;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "vq-read",
      dangerouslySetInnerHTML: { __html: html }
    }
  );
};
function BlogShow({ post, recentPosts = [] }) {
  const wordCount = useMemo(() => {
    if (!post?.content) return 0;
    return post.content.trim().split(/\s+/).length;
  }, [post?.content]);
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  if (!post) return null;
  return /* @__PURE__ */ jsxs(
    MarketingLayout,
    {
      title: `${post.title} — VenQore`,
      description: post.excerpt,
      children: [
        /* @__PURE__ */ jsxs(Head, { children: [
          /* @__PURE__ */ jsx("meta", { property: "og:type", content: "article" }),
          /* @__PURE__ */ jsx("meta", { property: "og:title", content: post.title }),
          /* @__PURE__ */ jsx("meta", { property: "og:description", content: post.excerpt })
        ] }),
        /* @__PURE__ */ jsxs("article", { children: [
          /* @__PURE__ */ jsx("header", { className: "vq-section vq-mc-top vq-mc-top--flush", children: /* @__PURE__ */ jsxs("div", { className: "vq-container vq-container--narrow", children: [
            /* @__PURE__ */ jsx("div", { className: "vq-mc-back", children: /* @__PURE__ */ jsxs(Link, { href: "/blog", className: "vq-link", children: [
              /* @__PURE__ */ jsx(ArrowLeft, { size: 16, "aria-hidden": "true" }),
              " Back to all articles"
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "vq-mc-meta", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent", children: post.category || "Financial Truth" }),
              /* @__PURE__ */ jsxs("span", { className: "vq-mc-meta__item", children: [
                /* @__PURE__ */ jsx(Clock, { size: 14, "aria-hidden": "true" }),
                " ",
                readTime,
                " min read · ",
                wordCount.toLocaleString(),
                " words"
              ] }),
              post.date && /* @__PURE__ */ jsx("span", { className: "vq-mc-meta__item", children: post.date })
            ] }),
            /* @__PURE__ */ jsx("h1", { className: "vq-h1 vq-mt-6", children: post.title }),
            post.excerpt && /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: post.excerpt }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3 vq-mt-8", style: { paddingBottom: "var(--vq-space-8)", borderBottom: "1px solid var(--vq-line)" }, children: [
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: "vq-mc-icon vq-mc-icon--round",
                  "aria-hidden": "true",
                  style: { width: 44, height: 44, fontFamily: "var(--vq-font-numeric)", fontWeight: 700, fontSize: 14 },
                  children: "VQ"
                }
              ),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: "var(--vq-fs-small)", fontWeight: 600, color: "var(--vq-text)" }, children: post.author || "VenQore Editorial" }),
                /* @__PURE__ */ jsx("div", { className: "vq-caption", children: "Systems & Accounting Research" })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "vq-section vq-mc-body", style: { paddingTop: "var(--vq-space-6)" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-container vq-container--narrow", children: [
            /* @__PURE__ */ jsx(ArticleContent, { content: post.content || post.excerpt }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-center", style: { marginTop: "var(--vq-space-20)", padding: "clamp(32px, 5vw, 48px)" }, children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent", children: "Build your system" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Run real money through an immutable Core Ledger." }),
              /* @__PURE__ */ jsx("p", { className: "vq-body vq-text-2 vq-mt-4", style: { maxWidth: "52ch", marginInline: "auto" }, children: "VenQore assembles point of sale, inventory, and real double-entry accounting configured to your exact business workflow." }),
              /* @__PURE__ */ jsx("div", { className: "vq-mt-8", children: /* @__PURE__ */ jsxs(Link, { href: "/build-workspace", className: "vq-btn vq-btn--primary vq-btn--lg", children: [
                "Start building workspace ",
                /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsx(ArrowRight, { size: 16, "aria-hidden": "true" }) })
              ] }) })
            ] })
          ] }) })
        ] }),
        recentPosts.length > 0 && /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head", style: { marginBottom: "var(--vq-space-10)" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "Continue reading" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2", children: "Related field guides" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-grid vq-grid--3", children: recentPosts.map((rel, idx) => /* @__PURE__ */ jsxs(Link, { href: `/blog/${rel.slug}`, className: "vq-card vq-card--interactive vq-mc-lcard", children: [
            rel.category && /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent", style: { alignSelf: "flex-start" }, children: rel.category }),
            /* @__PURE__ */ jsx("h3", { className: "vq-mc-lcard__title", style: { marginTop: "var(--vq-space-2)" }, children: rel.title }),
            rel.excerpt && /* @__PURE__ */ jsx("p", { className: "vq-mc-lcard__text", children: rel.excerpt }),
            /* @__PURE__ */ jsxs("div", { className: "vq-mc-lcard__foot", children: [
              /* @__PURE__ */ jsx("span", { children: rel.date }),
              /* @__PURE__ */ jsxs("span", { className: "vq-mc-lcard__cta", children: [
                "Read guide ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 15, "aria-hidden": "true" })
              ] })
            ] })
          ] }, rel.slug || idx)) })
        ] }) })
      ]
    }
  );
}
export {
  BlogShow as default
};
