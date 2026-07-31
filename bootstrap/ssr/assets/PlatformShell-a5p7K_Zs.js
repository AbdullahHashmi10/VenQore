import { jsx } from "react/jsx-runtime";
import "react";
import { P as PlatformLayout } from "./PlatformLayout-CV-DtcbF.js";
function PlatformShell({ title, children }) {
  return /* @__PURE__ */ jsx(PlatformLayout, { title: title || "Command Center", children });
}
export {
  PlatformShell as P
};
