"use client";

import {
  Children,
  createContext,
  useContext,
  type CSSProperties,
  type ReactNode,
} from "react";

const StaggerContext = createContext(0);

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Single skeleton bone with staggered shimmer delay. */
export function Skeleton({
  className = "",
  index,
  rounded = "lg",
}: {
  className?: string;
  /** Explicit stagger index; otherwise inherits from nearest Stagger parent. */
  index?: number;
  rounded?: "sm" | "md" | "lg" | "xl" | "full" | "none";
}) {
  const inherited = useContext(StaggerContext);
  const i = index ?? inherited;
  const radius =
    rounded === "none"
      ? "rounded-none"
      : rounded === "sm"
        ? "rounded-sm"
        : rounded === "md"
          ? "rounded-md"
          : rounded === "xl"
            ? "rounded-xl"
            : rounded === "full"
              ? "rounded-full"
              : "rounded-lg";

  return (
    <div
      className={cn("skeleton-bone", radius, className)}
      style={{ ["--skeleton-i" as string]: i } as CSSProperties}
      aria-hidden="true"
    />
  );
}

/** Stagger children: each direct child rises in sequence; nested bones shimmer out of sync. */
export function Stagger({
  children,
  className = "",
  startIndex = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  startIndex?: number;
  as?: "div" | "ul" | "section" | "span";
}) {
  const items = Children.toArray(children);
  return (
    <Tag className={cn("skeleton-stagger", className)} aria-busy="true" aria-live="polite">
      {items.map((child, offset) => {
        const index = startIndex + offset;
        return (
          <div
            key={offset}
            className="skeleton-stagger-item min-w-0"
            style={{ ["--skeleton-i" as string]: index } as CSSProperties}
          >
            <StaggerContext.Provider value={index}>{child}</StaggerContext.Provider>
          </div>
        );
      })}
    </Tag>
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
  startIndex = 0,
}: {
  lines?: number;
  className?: string;
  startIndex?: number;
}) {
  return (
    <Stagger className={cn("space-y-2.5", className)} startIndex={startIndex}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5", i === lines - 1 && lines > 1 ? "w-[66%]" : "w-full")}
        />
      ))}
    </Stagger>
  );
}

export function SkeletonField({ index }: { index?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton index={index} className="h-3.5 w-28" />
      <Skeleton index={typeof index === "number" ? index + 1 : undefined} className="h-12 w-full" />
    </div>
  );
}

export function SkeletonCard({
  className = "",
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-teal-100/80 bg-white p-5 shadow-sm shadow-teal-950/[0.03] dark:border-teal-900/40 dark:bg-zinc-900 sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
