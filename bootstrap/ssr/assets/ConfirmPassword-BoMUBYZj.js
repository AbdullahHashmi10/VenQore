import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useForm } from "@inertiajs/react";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { A as AuthLayout, b as AuthForm, c as AuthField, d as AuthButton } from "./index-BhXucrH4.js";
import "react";
import "./Input-BO7OpFmF.js";
function ConfirmPassword() {
  const { data, setData, post, processing, errors, reset } = useForm({ password: "" });
  const submit = (e) => {
    e.preventDefault();
    post("/confirm-password", {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => reset("password")
    });
  };
  return /* @__PURE__ */ jsx(
    AuthLayout,
    {
      title: "Confirm your password",
      heading: "Confirm your password",
      subheading: "This is a protected section of the application. Please confirm your password before continuing.",
      back: false,
      children: /* @__PURE__ */ jsxs(AuthForm, { onSubmit: submit, children: [
        /* @__PURE__ */ jsx(
          AuthField,
          {
            label: "Password",
            type: "password",
            name: "password",
            value: data.password,
            onChange: (e) => setData("password", e.target.value),
            autoComplete: "current-password",
            autoFocus: true,
            required: true,
            prefix: /* @__PURE__ */ jsx(Lock, { size: 16 }),
            error: errors.password
          }
        ),
        /* @__PURE__ */ jsx(
          AuthButton,
          {
            type: "submit",
            disabled: processing,
            iconAfter: processing ? null : /* @__PURE__ */ jsx(ArrowRight, { size: 16 }),
            children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
              " Confirming…"
            ] }) : "Confirm"
          }
        )
      ] })
    }
  );
}
export {
  ConfirmPassword as default
};
