import { LoaderCircle } from "lucide-react";

import { cn } from "@/shared/lib/cn";

interface LoadingStateProps {
  label: string;
  className?: string;
}

export function LoadingState({ label, className }: LoadingStateProps) {
  return (
    <div className={cn("flex min-h-[240px] items-center justify-center rounded-3xl border border-white/10 bg-white/5", className)}>
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        <span>{label}</span>
      </div>
    </div>
  );
}

