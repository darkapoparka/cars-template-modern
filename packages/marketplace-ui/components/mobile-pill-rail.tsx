"use client";

import { cn } from "@repo/design-system/lib/utils";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/** Preserve the page inset and fade overflowing pills so horizontal scrolling reads intentionally. */
export function MobilePillRail({
  children,
  className,
  label,
  "data-slot": dataSlot,
}: {
  children: ReactNode;
  className?: string;
  label: string;
  "data-slot"?: string;
}) {
  const railRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const updateEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }
    const left = rail.scrollLeft > 1;
    const right = rail.scrollWidth - rail.clientWidth - rail.scrollLeft > 1;
    setEdges((current) =>
      current.left === left && current.right === right
        ? current
        : { left, right }
    );
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }
    const observer = new ResizeObserver(updateEdges);
    observer.observe(rail);
    if (contentRef.current) {
      observer.observe(contentRef.current);
    }
    updateEdges();
    return () => observer.disconnect();
  }, [updateEdges]);

  return (
    <section
      aria-label={label}
      className="min-w-0 snap-x snap-proximity overflow-x-auto overscroll-x-contain [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2 [&::-webkit-scrollbar]:hidden"
      data-slot={dataSlot}
      onScroll={updateEdges}
      ref={railRef}
      style={{
        maskImage: `linear-gradient(to right, ${edges.left ? "transparent, black 28px" : "black 0px"}, ${edges.right ? "black calc(100% - 28px), transparent" : "black 100%"})`,
        scrollPaddingInline: "12px",
      }}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: Safari needs a focus target for native keyboard scrolling.
      tabIndex={0}
    >
      <div className={cn("flex w-max min-w-full", className)} ref={contentRef}>
        {children}
      </div>
    </section>
  );
}
