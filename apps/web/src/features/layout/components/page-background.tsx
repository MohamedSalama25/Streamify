"use client";

import { cn } from "@/shared/lib/cn";

interface PageBackgroundProps {
  className?: string;
  imageUrl?: string;
}

export function PageBackground({ className, imageUrl }: PageBackgroundProps) {
  return (
    <div className={cn("pointer-events-none fixed inset-0 overflow-hidden", className)}>
      {/* Background Image Layer */}
      {imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.15] mix-blend-luminosity grayscale"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}

      {/* Primary glow — top left */}
      <div className="absolute -left-[8%] -top-[5%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] animate-pulseGlow" />
      {/* Secondary glow — top right */}
      <div className="absolute -right-[5%] top-[15%] h-[400px] w-[400px] rounded-full bg-secondary/8 blur-[100px] animate-float" />
      {/* Tertiary glow — bottom center */}
      <div className="absolute bottom-[-8%] left-[30%] h-[350px] w-[350px] rounded-full bg-primary-container/6 blur-[100px]" />
      {/* Radial overlay */}
      <div className="absolute inset-0 bg-gradient-radial" />
    </div>
  );
}
