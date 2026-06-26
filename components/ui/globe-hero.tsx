"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DotGlobeHeroProps {
  rotationSpeed?: number;
  globeRadius?: number;
  className?: string;
  children?: React.ReactNode;
}

const DotGlobeHero = React.forwardRef<
  HTMLDivElement,
  DotGlobeHeroProps
>(({
  rotationSpeed,
  globeRadius,
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full min-h-screen bg-background overflow-x-hidden flex items-center justify-center",
        className
      )}
      {...props}
    >
      {/* Children Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full py-16 md:py-0">
        {children}
      </div>
      
      {/* Animated Glassmorphism Background Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {/* Top-Right Peach/Orange Blob (utilizing brand color primary #C46A4A with higher opacity) */}
        <div className="absolute top-[5%] right-[-10%] w-[480px] h-[480px] rounded-full bg-primary/30 blur-blob animate-blob-1" />
        
        {/* Bottom-Left Light Blue Blob */}
        <div className="absolute bottom-[5%] left-[-10%] w-[520px] h-[520px] rounded-full bg-blue-400/25 blur-blob animate-blob-2" />
      </div>
    </div>
  );
});

DotGlobeHero.displayName = "DotGlobeHero";

export { DotGlobeHero, type DotGlobeHeroProps };
