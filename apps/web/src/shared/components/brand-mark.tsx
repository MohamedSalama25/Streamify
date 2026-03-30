"use client";

import Image from "next/image";
import { APP_NAME } from "@streamify/shared";
import { cn } from "@/shared/lib/cn";

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {compact ? (
        <Image
          src="/logos/streamify-icon-transparent-256.png"
          alt={`${APP_NAME} Icon`}
          width={40}
          height={40}
          className="object-contain"
          priority
        />
      ) : (
        <>
          {/* Light Theme Logo */}
          <Image
            src="/logos/streamify-logo-light-transparent.png"
            alt={`${APP_NAME} Logo`}
            width={160}
            height={40}
            className="object-contain dark:hidden"
            priority
          />
          {/* Dark Theme Logo */}
          <Image
            src="/logos/streamify-logo-dark-transparent.png"
            alt={`${APP_NAME} Logo`}
            width={160}
            height={40}
            className="hidden object-contain dark:block"
            priority
          />
        </>
      )}
    </div>
  );
}
