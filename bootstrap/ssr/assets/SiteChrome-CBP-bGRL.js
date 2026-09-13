import { jsxs, jsx } from "react/jsx-runtime";
import { useEffect } from "react";
import { S as SiteHeader, a as SiteFooter, C as CookieConsent } from "./CookieConsent-DgIWvNoO.js";
function useMarketingShell() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const app = document.getElementById("app");
    const prev = {
      shell: html.getAttribute("data-vq-shell"),
      htmlOverflowY: html.style.overflowY,
      htmlOverflowX: html.style.overflowX,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      appHeight: app?.style.height,
      appOverflow: app?.style.overflow
    };
    html.setAttribute("data-vq-shell", "marketing");
    html.style.overflowY = "auto";
    html.style.overflowX = "clip";
    body.style.overflow = "visible";
    body.style.height = "auto";
    if (app) {
      app.style.height = "auto";
      app.style.overflow = "visible";
    }
    return () => {
      if (prev.shell) html.setAttribute("data-vq-shell", prev.shell);
      else html.removeAttribute("data-vq-shell");
      html.style.overflowY = prev.htmlOverflowY;
      html.style.overflowX = prev.htmlOverflowX;
      body.style.overflow = prev.bodyOverflow;
      body.style.height = prev.bodyHeight;
      if (app) {
        app.style.height = prev.appHeight;
        app.style.overflow = prev.appOverflow;
      }
    };
  }, []);
}
function SiteChrome({
  children,
  underHeader = false,
  footer = true,
  footerCta = true,
  className = "",
  mainClassName = ""
}) {
  useMarketingShell();
  return /* @__PURE__ */ jsxs("div", { className: `vq-site vq-app-body ${className}`, style: { background: "var(--vq-bg)", color: "var(--vq-text)", minHeight: "100vh", overflow: "visible", position: "relative" }, children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsx("main", { id: "main", className: `vq-chrome-main ${mainClassName}`, "data-under-header": underHeader ? "" : void 0, children }),
    footer && /* @__PURE__ */ jsx(SiteFooter, { showCta: footerCta }),
    /* @__PURE__ */ jsx(CookieConsent, {})
  ] });
}
export {
  SiteChrome as S,
  useMarketingShell as u
};
