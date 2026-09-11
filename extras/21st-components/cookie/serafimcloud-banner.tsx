/**
 * 21st.dev page : https://21st.dev/@serafimcloud/components/banner  (default demo = "BannerCookie")
 * Author        : Serafim (@serafimcloud, founder of 21st.dev)
 * License       : MIT (stated on 21st.dev page; also github.com/serafimcloud/21st LICENSE, (c) 2024 21st.dev)
 * 21st.dev deps : lucide-react, class-variance-authority
 * Code origin   : github.com/serafimcloud/21st (21st.dev's own open-source site repo) @ b96d84d, 2025-05-28
 *                 apps/web/components/ui/banner.tsx. Its API (variant/size/rounded, icon, action,
 *                 isClosable, layout) matches the 21st.dev demo, but equality with the published
 *                 21st.dev component was not byte-verified.
 * Dependencies  : react, class-variance-authority, lucide-react, shadcn Button, cn (@/lib/utils)
 * Other variants on the page: New feature, Upgrade, With link, Link+close, With buttons, Link+secondary button,
 *                 Centered with button, With description, With countdown (demo code for those not captured).
 */

// ============================================================
// FILE: s21/apps/web/components/ui/banner.tsx  (verbatim, unmodified)
// ============================================================
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

const bannerVariants = cva("relative w-full", {
  variants: {
    variant: {
      default: "bg-background border border-border",
      muted: "bg-muted",
      border: "border-b border-border",
    },
    size: {
      sm: "px-4 py-2",
      default: "px-4 py-3",
      lg: "px-4 py-3 md:py-2",
    },
    rounded: {
      none: "",
      default: "rounded-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    rounded: "none",
  },
})

interface BannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bannerVariants> {
  icon?: React.ReactNode
  action?: React.ReactNode
  onClose?: () => void
  isClosable?: boolean
  layout?: "row" | "center" | "complex"
}

const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  (
    {
      className,
      variant,
      size,
      rounded,
      icon,
      action,
      onClose,
      isClosable,
      layout = "row",
      children,
      ...props
    },
    ref,
  ) => {
    const innerContent = (
      <div
        className={cn(
          "flex gap-2",
          layout === "center" && "justify-center",
          layout === "complex" && "md:items-center",
        )}
      >
        {layout === "complex" ? (
          <div className="flex grow gap-3 md:items-center">
            {icon && (
              <div className="flex shrink-0 items-center gap-3 max-md:mt-0.5">
                {icon}
              </div>
            )}
            <div
              className={cn(
                "flex grow",
                layout === "complex" &&
                  "flex-col justify-between gap-3 md:flex-row md:items-center",
              )}
            >
              {children}
            </div>
          </div>
        ) : (
          <>
            {icon && (
              <div className="flex shrink-0 items-center gap-3">{icon}</div>
            )}
            <div className="flex grow items-center justify-between gap-3">
              {children}
            </div>
          </>
        )}
        {(action || isClosable) && (
          <div className="flex items-center gap-3">
            {action}
            {isClosable && (
              <Button
                variant="ghost"
                className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
                onClick={onClose}
                aria-label="Close banner"
              >
                <X
                  size={16}
                  strokeWidth={2}
                  className="opacity-60 transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                />
              </Button>
            )}
          </div>
        )}
      </div>
    )

    return (
      <div
        ref={ref}
        className={cn(bannerVariants({ variant, size, rounded }), className)}
        {...props}
      >
        {innerContent}
      </div>
    )
  },
)
Banner.displayName = "Banner"

export { Banner, type BannerProps }

// ============================================================
// DEMO USAGE - verbatim as shown on the 21st.dev page (captured via WebFetch, 2026-09-10)
// ============================================================
// import { Banner } from "@/components/ui/banner"
// import { Button } from "@/components/ui/button"
// 
// function BannerCookie() {
//   return (
//     <Banner rounded="default" className="shadow-lg shadow-black/5">
//       <div className="w-full">
//         <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
//           <p className="text-sm">
//             We use cookies to improve your experience, analyze site usage, and show personalized content.
//           </p>
//           <div className="flex shrink-0 gap-2 max-md:flex-wrap">
//             <Button size="sm">Accept</Button>
//             <Button variant="outline" size="sm">Decline</Button>
//           </div>
//         </div>
//       </div>
//     </Banner>
//   )
// }
// 
// export { BannerCookie }
