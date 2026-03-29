"use client";

import { APP_NAME } from "@streamify/shared";
import { cn } from "@/shared/lib/cn";

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl ghost-border bg-surface-container-high">
        <div className="absolute inset-1 rounded-lg bg-gradient-to-br from-primary/40 via-primary-container/30 to-secondary/20 blur-sm" />
        <div className="relative h-4 w-4 rounded-full bg-gradient-to-br from-primary to-primary-container" />
      </div>
      {!compact ? (
        <span className="font-display text-lg font-bold tracking-tight text-on-surface">
          {APP_NAME}
          <span className="text-primary">Elite</span>
        </span>
      ) : null}
    </div>
  );
}
