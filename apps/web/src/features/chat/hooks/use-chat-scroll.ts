"use client";

import { useEffect, useRef } from "react";

export function useChatScroll<T>(dependency: T) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const viewport = element.parentElement;
    if (!viewport) {
      return;
    }

    viewport.scrollTop = viewport.scrollHeight;
  }, [dependency]);

  return containerRef;
}
