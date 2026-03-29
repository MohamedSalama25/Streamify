"use client";

import * as React from "react";

import { cn } from "@/shared/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "input-stealth flex h-11 w-full rounded-xl px-4 py-2 text-sm outline-none transition-all duration-300",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
