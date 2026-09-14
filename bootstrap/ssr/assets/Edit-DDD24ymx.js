import { jsx } from "react/jsx-runtime";
import PurchaseForm from "./PurchaseForm-BhzSnhcU.js";
import "react";
import "@inertiajs/react";
import "lucide-react";
import "./useDocumentChrome-BD85E_OC.js";
import "./AsyncProductCombobox-BMa0miLw.js";
import "axios";
import "use-debounce";
import "./SmartCombobox-DfdFIseQ.js";
import "react-dom";
import "./format-131Nyq79.js";
import "./terms-DwYjlWsV.js";
import "./OneGlanceLayout-3W1KNwa4.js";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-DlkwqCwv.js";
import "motion/react";
import "./ThinkingOrb-CQCcf5-R.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "./MoneyDocument-DIlY3_Ui.js";
import "./settings-DUqQ1JdE.js";
import "./AsyncPartyCombobox-C_xHT5vA.js";
import "./ProductModal-DTGv60aX.js";
import "./PremiumButton-BUDyjGi2.js";
import "./PremiumSelect-BaeCSgsA.js";
import "./QuickPartyModal-BjRmNiLb.js";
function PurchaseEdit({
  purchase,
  items,
  landedCosts,
  suppliers,
  products,
  warehouses,
  expenseCategories = []
}) {
  return /* @__PURE__ */ jsx(
    PurchaseForm,
    {
      mode: "edit",
      purchase,
      items,
      landedCosts,
      suppliers,
      products,
      warehouses,
      expenseCategories
    }
  );
}
export {
  PurchaseEdit as default
};
