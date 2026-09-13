import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useForm } from "@inertiajs/react";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { A as AuthLayout, b as AuthForm, c as AuthField, d as AuthButton } from "./index-BhXucrH4.js";
import "react";
import "./Input-BO7OpFmF.js";
function ResetPassword({ token, email }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    token,
    email,
    password: "",
    password_confirmation: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post("/reset-password", {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => reset("password", "password_confirmation")
    });
  };
  return /* @__PURE__ */ jsx(
    AuthLayout,
    {
      title: "Choose a new password",
      heading: "Choose a new password",
      subheading: "Choose a strong password for your account.",
      children: /* @__PURE__ */ jsxs(AuthForm, { onSubmit: submit, children: [
        /* @__PURE__ */ jsx(
          AuthField,
          {
            label: "Email",
            type: "email",
            name: "email",
            value: data.email,
            onChange: (e) => setData("email", e.target.value),
            readOnly: true,
            prefix: /* @__PURE__ */ jsx(Mail, { size: 16 }),
            error: errors.email
          }
        ),
        /* @__PURE__ */ jsx(
          AuthField,
          {
            label: "New password",
            type: "password",
            name: "password",
            value: data.password,
            onChange: (e) => setData("password", e.target.value),
            autoComplete: "new-password",
            autoFocus: true,
            required: true,
            prefix: /* @__PURE__ */ jsx(Lock, { size: 16 }),
            error: errors.password
          }
        ),
        /* @__PURE__ */ jsx(
          AuthField,
          {
            label: "Confirm password",
            type: "password",
            name: "password_confirmation",
            value: data.password_confirmation,
            onChange: (e) => setData("password_confirmation", e.target.value),
            autoComplete: "new-password",
            required: true,
            prefix: /* @__PURE__ */ jsx(Lock, { size: 16 }),
            error: errors.password_confirmation
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
              " Resetting…"
            ] }) : "Reset password"
          }
        )
      ] })
    }
  );
}
export {
  ResetPassword as default
};
