import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import MarketingLayout from "./MarketingLayout-cwTDSbNB.js";
import { Link } from "@inertiajs/react";
import { BookOpen, ArrowRight, Clock } from "lucide-react";
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
const PostMeta = ({ post }) => /* @__PURE__ */ jsxs("div", { className: "vq-mc-meta", children: [
  post.category && /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent", children: post.category }),
  post.date && /* @__PURE__ */ jsxs("span", { className: "vq-mc-meta__item", children: [
    /* @__PURE__ */ jsx(Clock, { size: 14, "aria-hidden": "true" }),
    " ",
    post.date
  ] })
] });
const FeaturedPost = ({ post }) => /* @__PURE__ */ jsxs(Link, { href: `/blog/${post.slug}`, className: "vq-card vq-card--interactive vq-mc-feature", children: [
  /* @__PURE__ */ jsxs("div", { className: "vq-mc-feature__art", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsx(BookOpen, { size: 40, strokeWidth: 1.6 }),
    /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent", children: "Featured" })
  ] }),
  /* @__PURE__ */ jsxs("div", { className: "vq-mc-feature__body", children: [
    /* @__PURE__ */ jsx(PostMeta, { post }),
    /* @__PURE__ */ jsx("h2", { className: "vq-mc-feature__title", children: post.title }),
    post.excerpt && /* @__PURE__ */ jsx("p", { className: "vq-mc-feature__text", children: post.excerpt }),
    /* @__PURE__ */ jsxs("div", { className: "vq-mc-lcard__foot", style: { marginTop: "var(--vq-space-2)" }, children: [
      /* @__PURE__ */ jsx("span", { children: post.author }),
      /* @__PURE__ */ jsxs("span", { className: "vq-mc-lcard__cta", children: [
        "Read article ",
        /* @__PURE__ */ jsx(ArrowRight, { size: 16, "aria-hidden": "true" })
      ] })
    ] })
  ] })
] });
const PostCard = ({ post }) => /* @__PURE__ */ jsxs(Link, { href: `/blog/${post.slug}`, className: "vq-card vq-card--interactive vq-mc-lcard", children: [
  /* @__PURE__ */ jsx(PostMeta, { post }),
  /* @__PURE__ */ jsx("h3", { className: "vq-mc-lcard__title", style: { marginTop: "var(--vq-space-2)" }, children: post.title }),
  post.excerpt && /* @__PURE__ */ jsx("p", { className: "vq-mc-lcard__text", children: post.excerpt }),
  /* @__PURE__ */ jsxs("div", { className: "vq-mc-lcard__foot", children: [
    /* @__PURE__ */ jsx("span", { children: post.author }),
    /* @__PURE__ */ jsxs("span", { className: "vq-mc-lcard__cta", children: [
      "Read ",
      /* @__PURE__ */ jsx(ArrowRight, { size: 15, "aria-hidden": "true" })
    ] })
  ] })
] });
function BlogIndex({ posts = { data: [] } }) {
  const postItems = Array.isArray(posts) ? posts : posts.data || [];
  const featured = postItems[0];
  const rest = postItems.slice(1);
  const hasPagination = !Array.isArray(posts) && posts.last_page > 1;
  const total = !Array.isArray(posts) && typeof posts.total === "number" ? posts.total : postItems.length;
  return /* @__PURE__ */ jsxs(
    MarketingLayout,
    {
      title: "Blog & Field Guides — VenQore",
      description: "Deep dives into financial accuracy, operational control, and the hidden mechanics that make or break retail & wholesale businesses.",
      children: [
        /* @__PURE__ */ jsxs("section", { className: "vq-section vq-mc-top", children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", "aria-hidden": "true", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__aurora", style: { opacity: 0.22 } }) }),
          /* @__PURE__ */ jsx("div", { className: "vq-container", style: { position: "relative" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-mc-head", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "The Signal · VenQore editorial" }),
            /* @__PURE__ */ jsxs("h1", { className: "vq-display vq-mt-4", children: [
              "Ideas that ",
              /* @__PURE__ */ jsx("em", { className: "vq-italic", children: "matter." })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "Deep dives into financial accuracy, inventory velocity, and the mathematical laws that ensure your books always balance." })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-mc-body", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          featured ? /* @__PURE__ */ jsx(FeaturedPost, { post: featured }) : /* @__PURE__ */ jsxs("div", { className: "vq-card vq-mc-empty", children: [
            /* @__PURE__ */ jsx(BookOpen, { size: 32, "aria-hidden": "true" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h3 vq-mt-4", children: "No articles yet" }),
            /* @__PURE__ */ jsx("p", { className: "vq-body vq-text-2 vq-mt-2", style: { marginInline: "auto" }, children: "New field guides will appear here as they are published." })
          ] }),
          rest.length > 0 && /* @__PURE__ */ jsxs("div", { style: { marginTop: "var(--vq-space-20)" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-mc-rowhead", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "All articles & guides" }),
                /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-3", children: "More from the Signal" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "vq-caption", children: [
                total,
                " publications"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "vq-grid vq-grid--3", children: rest.map((post, i) => /* @__PURE__ */ jsx(PostCard, { post }, post.uid || post.slug || i)) })
          ] }),
          hasPagination && /* @__PURE__ */ jsxs("nav", { className: "vq-mc-pager", "aria-label": "Blog pages", children: [
            posts.prev_page_url ? /* @__PURE__ */ jsx(Link, { href: posts.prev_page_url, preserveScroll: true, className: "vq-btn vq-btn--secondary", children: "← Previous" }) : /* @__PURE__ */ jsx("span", {}),
            /* @__PURE__ */ jsxs("span", { className: "vq-caption vq-num", children: [
              "Page ",
              posts.current_page,
              " of ",
              posts.last_page
            ] }),
            posts.next_page_url ? /* @__PURE__ */ jsx(Link, { href: posts.next_page_url, preserveScroll: true, className: "vq-btn vq-btn--secondary", children: "Next →" }) : /* @__PURE__ */ jsx("span", {})
          ] })
        ] }) })
      ]
    }
  );
}
export {
  BlogIndex as default
};
