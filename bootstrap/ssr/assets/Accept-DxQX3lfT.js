import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useForm, router } from "@inertiajs/react";
import { Building2, User, Briefcase, CheckCircle, XCircle } from "lucide-react";
import { A as AuthLayout, a as AuthStack, d as AuthButton } from "./index-BhXucrH4.js";
import "react";
import "./Input-BO7OpFmF.js";
const ROLE_LABELS = {
  admin: "Admin",
  manager: "Manager",
  cashier: "Cashier",
  inventory_staff: "Inventory Staff",
  accountant: "Accountant",
  support: "Support",
  custom: "Custom",
  viewer: "Viewer"
};
function InviteAccept({ invitation, store, admin_name, token }) {
  const { post, processing } = useForm({ token });
  const accept = () => post("/invite/accept", { preserveState: true, preserveScroll: true });
  const decline = () => router.post("/invite/decline", { token }, { preserveState: true, preserveScroll: true });
  const roles = invitation?.roles || ["cashier"];
  return /* @__PURE__ */ jsx(
    AuthLayout,
    {
      title: "Accept Invitation — VenQore",
      heading: "You're invited!",
      subheading: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("strong", { className: "font-semibold text-ink", children: admin_name }),
        " has invited you to join their store on VenQore."
      ] }),
      children: /* @__PURE__ */ jsxs(AuthStack, { gap: 6, children: [
        /* @__PURE__ */ jsxs(AuthStack, { gap: 3, children: [
          /* @__PURE__ */ jsx(InfoRow, { icon: /* @__PURE__ */ jsx(Building2, { size: 18 }), label: "Store", children: /* @__PURE__ */ jsx("p", { className: "text-base font-semibold leading-tight text-ink", children: store?.name }) }),
          /* @__PURE__ */ jsxs(InfoRow, { icon: /* @__PURE__ */ jsx(User, { size: 18 }), label: "Invited as", children: [
            /* @__PURE__ */ jsx("p", { className: "text-base font-semibold leading-tight text-ink", children: invitation?.invitee_name }),
            /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs leading-tight text-ink-muted", children: invitation?.invitee_email })
          ] }),
          /* @__PURE__ */ jsx(InfoRow, { icon: /* @__PURE__ */ jsx(Briefcase, { size: 18 }), label: "Your role(s)", children: /* @__PURE__ */ jsx("div", { className: "mt-1 flex flex-wrap gap-2", children: roles.map((r) => /* @__PURE__ */ jsx(
            "span",
            {
              className: "rounded-full bg-accent-quiet px-3 py-1 text-xs font-semibold text-accent-text",
              children: ROLE_LABELS[r] || r
            },
            r
          )) }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-center text-xs leading-relaxed text-ink-muted", children: "After accepting, you will be redirected to the store hub to access your dashboard." }),
        /* @__PURE__ */ jsxs(AuthStack, { gap: 2, children: [
          /* @__PURE__ */ jsx(AuthButton, { onClick: accept, disabled: processing, icon: /* @__PURE__ */ jsx(CheckCircle, { size: 16 }), children: processing ? "Accepting…" : "Accept Invite" }),
          /* @__PURE__ */ jsx(AuthButton, { variant: "secondary", onClick: decline, disabled: processing, icon: /* @__PURE__ */ jsx(XCircle, { size: 16 }), children: "Decline" })
        ] })
      ] })
    }
  );
}
function InfoRow({ icon, label, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 rounded-md border border-line bg-sunken p-4", children: [
    /* @__PURE__ */ jsx("span", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-quiet text-accent-text", children: icon }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsx("p", { className: "text-2xs uppercase tracking-wider text-ink-muted", children: label }),
      children
    ] })
  ] });
}
export {
  InviteAccept as default
};
