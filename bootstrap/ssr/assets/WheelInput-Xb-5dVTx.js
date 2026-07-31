import { jsx } from "react/jsx-runtime";
import { useRef, useEffect } from "react";
function WheelInput({ onWheel, style, className, ...props }) {
  const ref = useRef(null);
  const onWheelRef = useRef(onWheel);
  useEffect(() => {
    onWheelRef.current = onWheel;
  }, [onWheel]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e) => {
      if (onWheelRef.current) {
        onWheelRef.current(e);
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);
  return /* @__PURE__ */ jsx(
    "input",
    {
      ref,
      className,
      style,
      ...props
    }
  );
}
export {
  WheelInput as W
};
