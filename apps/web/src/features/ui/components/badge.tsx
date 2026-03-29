import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/shared/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em]",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/10 text-slate-100",
        success: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
        warning: "border-amber-400/30 bg-amber-500/15 text-amber-200",
        danger: "border-rose-400/30 bg-rose-500/15 text-rose-200",
        muted: "border-white/10 bg-transparent text-slate-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />;
}
