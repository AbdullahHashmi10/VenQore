/**
 * 21st.dev page : https://21st.dev/@jakobhoeg/components/chat-bubble  (docs: https://docs-shadcn-chat.vercel.app/components/chat-bubble)
 * Author        : Jakob Hoeg Mørk (@jakobhoeg) - shadcn-chat
 * License       : MIT (Copyright (c) 2024 Jakob Hoeg Mørk) - upstream LICENSE. 21st.dev page lists none.
 * 21st.dev deps : lucide-react
 * Code origin   : UPSTREAM GITHUB github.com/jakobhoeg/shadcn-chat @ 47e5f8a, 2025-08-12
 *                 packages/ui/src/components/ui/chat/chat-bubble.tsx + message-loading.tsx (3-dot SVG
 *                 typing indicator used by <ChatBubbleMessage isLoading />).
 * Dependencies  : react, class-variance-authority, shadcn Avatar (@radix-ui/react-avatar), shadcn Button, cn
 */

// ============================================================
// FILE: jakobhoeg_shadcn-chat/packages/ui/src/components/ui/chat/chat-bubble.tsx  (verbatim, unmodified)
// ============================================================
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import MessageLoading from "./message-loading";
import { Button, ButtonProps } from "@/components/ui/button";

// ChatBubble
const chatBubbleVariant = cva(
  "flex gap-2 max-w-[60%] items-end relative group",
  {
    variants: {
      variant: {
        received: "self-start",
        sent: "self-end flex-row-reverse",
      },
      layout: {
        default: "",
        ai: "max-w-full w-full items-center",
      },
    },
    defaultVariants: {
      variant: "received",
      layout: "default",
    },
  },
);

interface ChatBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleVariant> {}

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  ({ className, variant, layout, children, ...props }, ref) => (
    <div
      className={cn(
        chatBubbleVariant({ variant, layout, className }),
        "relative group",
      )}
      ref={ref}
      {...props}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child) && typeof child.type !== "string"
          ? React.cloneElement(child, {
              variant,
              layout,
            } as React.ComponentProps<typeof child.type>)
          : child,
      )}
    </div>
  ),
);
ChatBubble.displayName = "ChatBubble";

// ChatBubbleAvatar
interface ChatBubbleAvatarProps {
  src?: string;
  fallback?: string;
  className?: string;
}

const ChatBubbleAvatar: React.FC<ChatBubbleAvatarProps> = ({
  src,
  fallback,
  className,
}) => (
  <Avatar className={className}>
    <AvatarImage src={src} alt="Avatar" />
    <AvatarFallback>{fallback}</AvatarFallback>
  </Avatar>
);

// ChatBubbleMessage
const chatBubbleMessageVariants = cva("p-4", {
  variants: {
    variant: {
      received:
        "bg-secondary text-secondary-foreground rounded-r-lg rounded-tl-lg",
      sent: "bg-primary text-primary-foreground rounded-l-lg rounded-tr-lg",
    },
    layout: {
      default: "",
      ai: "border-t w-full rounded-none bg-transparent",
    },
  },
  defaultVariants: {
    variant: "received",
    layout: "default",
  },
});

interface ChatBubbleMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleMessageVariants> {
  isLoading?: boolean;
}

const ChatBubbleMessage = React.forwardRef<
  HTMLDivElement,
  ChatBubbleMessageProps
>(
  (
    { className, variant, layout, isLoading = false, children, ...props },
    ref,
  ) => (
    <div
      className={cn(
        chatBubbleMessageVariants({ variant, layout, className }),
        "break-words max-w-full whitespace-pre-wrap",
      )}
      ref={ref}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <MessageLoading />
        </div>
      ) : (
        children
      )}
    </div>
  ),
);
ChatBubbleMessage.displayName = "ChatBubbleMessage";

// ChatBubbleTimestamp
interface ChatBubbleTimestampProps
  extends React.HTMLAttributes<HTMLDivElement> {
  timestamp: string;
}

const ChatBubbleTimestamp: React.FC<ChatBubbleTimestampProps> = ({
  timestamp,
  className,
  ...props
}) => (
  <div className={cn("text-xs mt-2 text-right", className)} {...props}>
    {timestamp}
  </div>
);

// ChatBubbleAction
type ChatBubbleActionProps = ButtonProps & {
  icon: React.ReactNode;
};

const ChatBubbleAction: React.FC<ChatBubbleActionProps> = ({
  icon,
  onClick,
  className,
  variant = "ghost",
  size = "icon",
  ...props
}) => (
  <Button
    variant={variant}
    size={size}
    className={className}
    onClick={onClick}
    {...props}
  >
    {icon}
  </Button>
);

interface ChatBubbleActionWrapperProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "sent" | "received";
  className?: string;
}

const ChatBubbleActionWrapper = React.forwardRef<
  HTMLDivElement,
  ChatBubbleActionWrapperProps
>(({ variant, className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute top-1/2 -translate-y-1/2 flex opacity-0 group-hover:opacity-100 transition-opacity duration-200",
      variant === "sent"
        ? "-left-1 -translate-x-full flex-row-reverse"
        : "-right-1 translate-x-full",
      className,
    )}
    {...props}
  >
    {children}
  </div>
));
ChatBubbleActionWrapper.displayName = "ChatBubbleActionWrapper";

export {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
  chatBubbleVariant,
  chatBubbleMessageVariants,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
};

// ============================================================
// FILE: jakobhoeg_shadcn-chat/packages/ui/src/components/ui/chat/message-loading.tsx  (verbatim, unmodified)
// ============================================================
// @hidden
export default function MessageLoading() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="text-foreground"
    >
      <circle cx="4" cy="12" r="2" fill="currentColor">
        <animate
          id="spinner_qFRN"
          begin="0;spinner_OcgL.end+0.25s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
      <circle cx="12" cy="12" r="2" fill="currentColor">
        <animate
          begin="spinner_qFRN.begin+0.1s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
      <circle cx="20" cy="12" r="2" fill="currentColor">
        <animate
          id="spinner_OcgL"
          begin="spinner_qFRN.begin+0.2s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
    </svg>
  );
}

// ============================================================
// DEMO USAGE - verbatim as shown on the 21st.dev page (captured via WebFetch, 2026-09-10)
// ============================================================
// import {
//   ChatBubble,
//   ChatBubbleAvatar,
//   ChatBubbleMessage,
//   ChatBubbleAction
// } from "@/components/ui/chat-bubble"
// import { Copy, RefreshCcw } from "lucide-react"
// 
// const messages = [
//   {
//     id: 1,
//     message: "Help me with my essay.",
//     sender: "user",
//   },
//   {
//     id: 2,
//     message: "I can help you with that. What do you need help with?",
//     sender: "bot",
//   },
// ]
// 
// const actionIcons = [
//   { icon: Copy, type: "Copy" },
//   { icon: RefreshCcw, type: "Regenerate" },
// ]
// 
// export function ChatBubbleVariants() {
//   return (
//     <div className="max-w-md space-y-4 p-4">
//       <ChatBubble variant="sent">
//         <ChatBubbleAvatar fallback="US" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&crop=faces&fit=crop" />
//         <ChatBubbleMessage variant="sent">
//           I have a question about the library.
//         </ChatBubbleMessage>
//       </ChatBubble>
// 
//       <ChatBubble variant="received">
//         <ChatBubbleAvatar fallback="AI" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"  />
//         <ChatBubbleMessage>
//           Sure, I'd be happy to help!
//         </ChatBubbleMessage>
//       </ChatBubble>
//     </div>
//   )
// }
// 
// export function ChatBubbleAiLayout() {
//   return (
//     <div className="max-w-md divide-y">
//       {messages.map((message, index) => {
//         const variant = message.sender === "user" ? "sent" : "received"
//         return (
//           <div key={message.id} className="py-6 first:pt-0 last:pb-0">
//             <div className="flex gap-3">
//               <ChatBubbleAvatar
//                 src={variant === "sent"
//                   ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&crop=faces&fit=crop"
//                   : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
//                 }
//                 fallback={variant === "sent" ? "US" : "AI"}
//               />
//               <div className="flex-1">
//                 {message.message}
//                 {message.sender === "bot" && (
//                   <div className="flex gap-2 mt-2">
//                     {actionIcons.map(({ icon: Icon, type }) => (
//                       <button
//                         key={type}
//                         onClick={() => console.log(`Action ${type} clicked for message ${index}`)}
//                         className="p-1 hover:bg-muted rounded-md transition-colors"
//                       >
//                         <Icon className="size-3" />
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         )
//       })}
//     </div>
//   )
// }
// 
// export function ChatBubbleStates() {
//   return (
//     <div className="max-w-md space-y-4 p-4">
//       <ChatBubble variant="received">
//         <ChatBubbleAvatar fallback="AI" />
//         <ChatBubbleMessage isLoading />
//       </ChatBubble>
// 
//       <ChatBubble variant="received">
//         <ChatBubbleAvatar fallback="AI" />
//         <ChatBubbleMessage className="bg-destructive/10 text-destructive">
//           Error processing request
//         </ChatBubbleMessage>
//       </ChatBubble>
//     </div>
//   )
// }
