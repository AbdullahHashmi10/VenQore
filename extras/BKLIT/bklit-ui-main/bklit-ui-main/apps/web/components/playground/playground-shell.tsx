"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PlaygroundShell({
  title,
  description,
  toolbar,
  children,
  overlay,
  className,
}: {
  title?: string;
  description?: string;
  toolbar?: ReactNode;
  children: ReactNode;
  overlay?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-4 p-6",
        className
      )}
    >
      {(title || description) && (
        <header className="space-y-1">
          {title ? (
            <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
          ) : null}
          {description ? (
            <p className="text-muted-foreground text-sm">{description}</p>
          ) : null}
        </header>
      )}

      {toolbar}

      <div className="relative">
        {children}
        {overlay ? (
          <div className="pointer-events-none absolute top-3 right-3 z-30">
            {overlay}
          </div>
        ) : null}
      </div>
    </div>
  );
}
