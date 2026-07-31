import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { M as Modal } from "../ssr.js";
import { AlertTriangle } from "lucide-react";
function ConfirmModal({ show, onClose, title, message, onConfirm, confirmLabel = "Confirm", cancelLabel = "Cancel", isDangerous = false }) {
  return /* @__PURE__ */ jsx(Modal, { show, onClose, maxWidth: "sm", children: /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 mb-4", children: [
      /* @__PURE__ */ jsx("div", { className: "shrink-0 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 24 }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-slate-800 dark:text-white", children: title }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: message })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-3 mt-6", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onClose,
          className: "flex-1 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
          children: cancelLabel
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            onConfirm();
            onClose();
          },
          className: `flex-1 py-2.5 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all ${isDangerous ? "bg-red-500 hover:bg-red-600 shadow-red-500/30" : "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/30"}`,
          children: confirmLabel
        }
      )
    ] })
  ] }) });
}
export {
  ConfirmModal as C
};
