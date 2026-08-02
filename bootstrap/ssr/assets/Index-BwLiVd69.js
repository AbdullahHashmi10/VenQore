import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useForm, Head } from "@inertiajs/react";
import { BookOpen, Plus, X, FileText, Check, Edit, Trash2 } from "lucide-react";
function BlogPostsIndex({ posts = [] }) {
  const [editingPost, setEditingPost] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "Financial Truth",
    author: "VenQore Editorial",
    image: "/images/blog/default.jpg",
    meta_title: "",
    meta_description: "",
    is_published: true
  });
  const openCreate = () => {
    reset();
    setEditingPost(null);
    setIsCreating(true);
  };
  const openEdit = (p) => {
    setEditingPost(p);
    setIsCreating(false);
    setData({
      title: p.title || "",
      slug: p.slug || "",
      excerpt: p.excerpt || "",
      content: p.content || "",
      category: p.category || "Financial Truth",
      author: p.author || "VenQore Editorial",
      image: p.image || "/images/blog/default.jpg",
      meta_title: p.meta_title || "",
      meta_description: p.meta_description || "",
      is_published: !!p.is_published
    });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPost) {
      put(route("platform.blog-posts.update", editingPost.id), {
        onSuccess: () => {
          setEditingPost(null);
          reset();
        }
      });
    } else {
      post(route("platform.blog-posts.store"), {
        onSuccess: () => {
          setIsCreating(false);
          reset();
        }
      });
    }
  };
  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      destroy(route("platform.blog-posts.destroy", id));
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-slate-950 text-slate-100 p-8", children: [
    /* @__PURE__ */ jsx(Head, { title: "SuperAdmin — Blog Engine" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8 pb-6 border-b border-slate-800", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-black tracking-tight text-white flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(BookOpen, { className: "text-indigo-500", size: 32 }),
            "Blog Engine Management"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Manage global public marketing posts, SEO metadata, and JSON-LD articles." })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: openCreate,
            className: "px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 18 }),
              " New Blog Post"
            ]
          }
        )
      ] }),
      (isCreating || editingPost) && /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-2xl", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pb-4 border-b border-slate-800 mb-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-white", children: editingPost ? `Edit Post: ${editingPost.title}` : "Create New Blog Post" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setIsCreating(false);
                setEditingPost(null);
              },
              className: "p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800",
              children: /* @__PURE__ */ jsx(X, { size: 20 })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2", children: "Title" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: data.title,
                  onChange: (e) => setData("title", e.target.value),
                  className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none",
                  required: true
                }
              ),
              errors.title && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-1", children: errors.title })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2", children: "Slug (URL Path)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: data.slug,
                  onChange: (e) => setData("slug", e.target.value),
                  placeholder: "auto-generated from title",
                  className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                }
              ),
              errors.slug && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-1", children: errors.slug })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2", children: "Category" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: data.category,
                  onChange: (e) => setData("category", e.target.value),
                  className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2", children: "Author" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: data.author,
                  onChange: (e) => setData("author", e.target.value),
                  className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2", children: "Hero Image URL" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: data.image,
                  onChange: (e) => setData("image", e.target.value),
                  className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2", children: "Excerpt" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: data.excerpt,
                onChange: (e) => setData("excerpt", e.target.value),
                rows: 2,
                className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:border-indigo-500 focus:outline-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2", children: "Full Content (Markdown Supported)" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: data.content,
                onChange: (e) => setData("content", e.target.value),
                rows: 8,
                className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2", children: "Meta Title (SEO)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: data.meta_title,
                  onChange: (e) => setData("meta_title", e.target.value),
                  className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2", children: "Meta Description (SEO)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: data.meta_description,
                  onChange: (e) => setData("meta_description", e.target.value),
                  className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-4", children: [
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  checked: data.is_published,
                  onChange: (e) => setData("is_published", e.target.checked),
                  className: "rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-300", children: "Published Live" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    setIsCreating(false);
                    setEditingPost(null);
                  },
                  className: "px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold",
                  children: "Cancel"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: processing,
                  className: "px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30",
                  children: editingPost ? "Save Changes" : "Publish Post"
                }
              )
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-800 bg-slate-950/50 text-2xs uppercase tracking-wider text-slate-400 font-bold", children: [
          /* @__PURE__ */ jsx("th", { className: "p-4", children: "Post Title" }),
          /* @__PURE__ */ jsx("th", { className: "p-4", children: "Slug" }),
          /* @__PURE__ */ jsx("th", { className: "p-4", children: "Category" }),
          /* @__PURE__ */ jsx("th", { className: "p-4", children: "Author" }),
          /* @__PURE__ */ jsx("th", { className: "p-4", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-800/60 text-sm", children: posts.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "p-8 text-center text-slate-500", children: 'No blog posts found. Click "New Blog Post" to publish one.' }) }) : posts.map((p) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-800/40 transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "p-4 font-bold text-white", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(FileText, { size: 16, className: "text-indigo-400 shrink-0" }),
            /* @__PURE__ */ jsx("span", { children: p.title })
          ] }) }),
          /* @__PURE__ */ jsxs("td", { className: "p-4 text-slate-400 font-mono text-xs", children: [
            "/blog/",
            p.slug
          ] }),
          /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 rounded-full bg-slate-800 text-indigo-300 text-xs font-bold", children: p.category }) }),
          /* @__PURE__ */ jsx("td", { className: "p-4 text-slate-300", children: p.author }),
          /* @__PURE__ */ jsx("td", { className: "p-4", children: p.is_published ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20", children: [
            /* @__PURE__ */ jsx(Check, { size: 12 }),
            " Published"
          ] }) : /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold", children: "Draft" }) }),
          /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => openEdit(p),
                className: "p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors",
                title: "Edit",
                children: /* @__PURE__ */ jsx(Edit, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleDelete(p.id),
                className: "p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors",
                title: "Delete",
                children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
              }
            )
          ] }) })
        ] }, p.id)) })
      ] }) })
    ] })
  ] });
}
export {
  BlogPostsIndex as default
};
