import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import MarketingLayout, { RevealOnScroll, SectionLabel, GlassCard, MagneticButton } from "./MarketingLayout-CMiC1Bik.js";
import { Headphones, MessageCircle, Mail, Zap, Loader2, CheckCircle2, Send, AlertCircle, Clock, MapPin, BookOpen, ArrowRight } from "lucide-react";
import "@inertiajs/react";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
const InputField = ({ label, type = "text", name, placeholder, required, value, onChange, rows }) => {
  const [focused, setFocused] = useState(false);
  const Tag = rows ? "textarea" : "input";
  return /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
    /* @__PURE__ */ jsxs("label", { className: `block text-[10px] font-black uppercase tracking-[0.25em] mb-3 transition-colors duration-300 ${focused ? "text-indigo-400" : "text-slate-600"}`, children: [
      label,
      " ",
      required && /* @__PURE__ */ jsx("span", { className: "text-indigo-500", children: "*" })
    ] }),
    /* @__PURE__ */ jsx(
      Tag,
      {
        type,
        name,
        placeholder,
        required,
        value,
        onChange,
        rows,
        onFocus: () => setFocused(true),
        onBlur: () => setFocused(false),
        className: `w-full px-5 py-4 bg-white/[0.03] border rounded-2xl text-white text-sm placeholder:text-slate-700 outline-none transition-all duration-500 resize-none
                    ${focused ? "border-indigo-500/40 bg-indigo-500/[0.03] shadow-lg shadow-indigo-900/10" : "border-white/[0.06] hover:border-white/10"}
                `
      }
    ),
    /* @__PURE__ */ jsx("div", { className: `absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent transition-opacity duration-500 ${focused ? "opacity-100" : "opacity-0"}` })
  ] });
};
const ContactMethod = ({ icon: Icon, title, subtitle, action, href, color = "indigo", delay }) => /* @__PURE__ */ jsx(RevealOnScroll, { delay, children: /* @__PURE__ */ jsxs(
  "a",
  {
    href,
    target: href?.startsWith("http") ? "_blank" : void 0,
    rel: href?.startsWith("http") ? "noopener noreferrer" : void 0,
    className: `block p-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.06] hover:bg-${color}-500/[0.04] hover:border-${color}-500/20 transition-all duration-500 group cursor-pointer`,
    children: [
      /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-2xl bg-${color}-500/10 text-${color}-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`, children: /* @__PURE__ */ jsx(Icon, { size: 22 }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white tracking-tight mb-1 font-display", children: title }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-600 text-sm mb-3", children: subtitle }),
      /* @__PURE__ */ jsxs("span", { className: `text-${color}-400 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 group-hover:gap-3 transition-all`, children: [
        action,
        " ",
        /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
      ] })
    ]
  }
) });
function Contact() {
  const [form, setForm] = useState({ name: "", email: "", company: "", subject: "", message: "" });
  const [status, setStatus] = useState("idle");
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    await new Promise((r) => setTimeout(r, 1500));
    setStatus("success");
    setForm({ name: "", email: "", company: "", subject: "", message: "" });
    setTimeout(() => setStatus("idle"), 5e3);
  };
  return /* @__PURE__ */ jsxs(
    MarketingLayout,
    {
      title: "Contact — VenQore",
      description: "Talk to our team. Whether you need a demo, have questions, or want enterprise pricing — we respond fast.",
      children: [
        /* @__PURE__ */ jsx("section", { className: "relative pt-40 pb-16 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto text-center", children: [
          /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsx(SectionLabel, { icon: Headphones, children: "Get in Touch" }) }),
          /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.1, children: /* @__PURE__ */ jsxs("h1", { className: "text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 font-display", children: [
            /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent", children: "Let's" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent vq-text-glow", children: "Talk." })
          ] }) }),
          /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.2, children: /* @__PURE__ */ jsxs("p", { className: "text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed", children: [
            "Whether you need a personalized walkthrough, have technical questions, or want to discuss enterprise licensing — ",
            /* @__PURE__ */ jsx("span", { className: "text-white", children: "we respond within hours, not days." })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "py-16 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5", children: [
          /* @__PURE__ */ jsx(
            ContactMethod,
            {
              delay: 0,
              icon: MessageCircle,
              title: "WhatsApp",
              subtitle: "Fastest way to reach us. Immediate response during business hours.",
              action: "Chat Now",
              href: "https://wa.me/923091999489",
              color: "emerald"
            }
          ),
          /* @__PURE__ */ jsx(
            ContactMethod,
            {
              delay: 0.1,
              icon: Mail,
              title: "Email",
              subtitle: "For detailed inquiries, partnerships, and enterprise discussions.",
              action: "Send Email",
              href: "mailto:hello@venqore.com",
              color: "indigo"
            }
          ),
          /* @__PURE__ */ jsx(
            ContactMethod,
            {
              delay: 0.2,
              icon: Zap,
              title: "Live Demo",
              subtitle: "See VenQore in action with your own data. 30-minute, 1-on-1 session.",
              action: "Book Demo",
              href: "/demo",
              color: "amber"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "py-24 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12", children: [
          /* @__PURE__ */ jsx("div", { className: "lg:col-span-3", children: /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] border border-white/[0.06] rounded-[3rem] p-8 md:p-12", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-white tracking-tight mb-2 font-display", children: "Send a Message" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-600 text-sm mb-10", children: "We'll get back to you within a few hours." }),
            /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-6", children: [
                /* @__PURE__ */ jsx(
                  InputField,
                  {
                    label: "Your Name",
                    name: "name",
                    placeholder: "John Doe",
                    required: true,
                    value: form.name,
                    onChange: handleChange
                  }
                ),
                /* @__PURE__ */ jsx(
                  InputField,
                  {
                    label: "Email Address",
                    type: "email",
                    name: "email",
                    placeholder: "john@company.com",
                    required: true,
                    value: form.email,
                    onChange: handleChange
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-6", children: [
                /* @__PURE__ */ jsx(
                  InputField,
                  {
                    label: "Company",
                    name: "company",
                    placeholder: "Acme Inc.",
                    value: form.company,
                    onChange: handleChange
                  }
                ),
                /* @__PURE__ */ jsx(
                  InputField,
                  {
                    label: "Subject",
                    name: "subject",
                    placeholder: "Sales Inquiry",
                    required: true,
                    value: form.subject,
                    onChange: handleChange
                  }
                )
              ] }),
              /* @__PURE__ */ jsx(
                InputField,
                {
                  label: "Message",
                  name: "message",
                  placeholder: "Tell us about your business and what you're looking for...",
                  required: true,
                  rows: 5,
                  value: form.message,
                  onChange: handleChange
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-6 pt-4", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "submit",
                    disabled: status === "sending",
                    className: `inline-flex items-center gap-3 px-10 py-4 rounded-full font-black text-sm uppercase tracking-[0.15em] transition-all duration-500
                                                ${status === "sending" ? "bg-indigo-600/50 text-white/50 cursor-wait" : status === "success" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" : "bg-white text-[#020010] hover:shadow-[0_0_60px_-5px_rgba(255,255,255,0.3)] hover:scale-105"}
                                            `,
                    children: [
                      status === "sending" && /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
                      status === "success" && /* @__PURE__ */ jsx(CheckCircle2, { size: 16 }),
                      status === "idle" && /* @__PURE__ */ jsx(Send, { size: 16 }),
                      status === "error" && /* @__PURE__ */ jsx(AlertCircle, { size: 16 }),
                      status === "idle" && "Send Message",
                      status === "sending" && "Sending...",
                      status === "success" && "Message Sent!",
                      status === "error" && "Try Again"
                    ]
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-700 font-bold uppercase tracking-widest hidden sm:block", children: "We respect your privacy" })
              ] })
            ] })
          ] }) }) }),
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
            /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.1, children: /* @__PURE__ */ jsxs(GlassCard, { padding: "p-8", children: [
              /* @__PURE__ */ jsx(Clock, { size: 22, className: "text-indigo-400 mb-4" }),
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white tracking-tight mb-2 font-display", children: "Response Time" }),
              /* @__PURE__ */ jsxs("p", { className: "text-slate-500 text-sm leading-relaxed mb-4", children: [
                "We typically respond within ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "2-4 hours" }),
                " during business hours. WhatsApp is fastest for urgent inquiries."
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em]", children: [
                /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-emerald-500 animate-pulse" }),
                "Currently Online"
              ] })
            ] }) }),
            /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.2, children: /* @__PURE__ */ jsxs(GlassCard, { padding: "p-8", children: [
              /* @__PURE__ */ jsx(MapPin, { size: 22, className: "text-indigo-400 mb-4" }),
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white tracking-tight mb-2 font-display", children: "Location" }),
              /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm leading-relaxed", children: "We're a remote-first team. Our engineering is based in Pakistan, serving businesses globally." })
            ] }) }),
            /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.3, children: /* @__PURE__ */ jsxs(GlassCard, { padding: "p-8", children: [
              /* @__PURE__ */ jsx(BookOpen, { size: 22, className: "text-indigo-400 mb-4" }),
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white tracking-tight mb-2 font-display", children: "For Partners" }),
              /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm leading-relaxed mb-4", children: "Interested in reselling, white-labeling, or integrating VenQore into your ecosystem? We'd love to hear from you." }),
              /* @__PURE__ */ jsxs("a", { href: "mailto:partners@venqore.com", className: "text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all", children: [
                "Partner Inquiries ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
              ] })
            ] }) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "py-32 px-6 text-center border-t border-white/5", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[120px] pointer-events-none" }),
          /* @__PURE__ */ jsxs(RevealOnScroll, { children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-tight relative z-10 font-display", children: [
              "Not Ready to Talk?",
              /* @__PURE__ */ jsx("br", {}),
              /* @__PURE__ */ jsx("span", { className: "text-indigo-400", children: "Try It First." })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-lg text-slate-500 mb-10 max-w-lg mx-auto relative z-10", children: "14-day free trial. No credit card. No sales call required." }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10", children: [
              /* @__PURE__ */ jsxs(MagneticButton, { href: "/register", variant: "primary", children: [
                "Start Free Trial ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
              ] }),
              /* @__PURE__ */ jsx(MagneticButton, { href: "/demo", variant: "ghost", children: "Live Demo" })
            ] })
          ] })
        ] }) })
      ]
    }
  );
}
export {
  Contact as default
};
