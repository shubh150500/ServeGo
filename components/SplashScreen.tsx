"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SplashScreen() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isSystemRoute = pathname.startsWith("/admin") || pathname.startsWith("/worker");

  useEffect(() => {
    setMounted(true);
    if (isSystemRoute) {
      setShouldRender(false);
      return;
    }

    const hasPlayed = sessionStorage.getItem("splash-played");
    if (hasPlayed) {
      setShouldRender(false);
      return;
    }

    setShouldRender(true);

    const duration = 1800; // 1.8s duration
    const intervalTime = 16; // ~60fps
    const steps = duration / intervalTime;
    const increment = 100 / steps;

    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        setProgress(100);
        clearInterval(timer);
        setTimeout(() => {
          setVisible(false);
          setTimeout(() => {
            sessionStorage.setItem("splash-played", "true");
            setShouldRender(false);
          }, 500); // Wait for fade-out transition (500ms)
        }, 300); // Hold at 100% for 300ms
      } else {
        setProgress(currentProgress);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isSystemRoute]);

  if (!mounted || isSystemRoute || !shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ backgroundColor: "#E7D7C6" }}
    >
      {/* Container to prevent layout shifts */}
      <div className="flex flex-col items-center select-none">
        
        {/* Logo and Brand Text Row */}
        <div className="flex items-center gap-4">
          <img 
            src="/logo.png" 
            alt="ServeGo Logo" 
            className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-2xl animate-pulse" 
          />
          <div className="flex flex-col justify-center leading-none text-black font-sans">
            <span className="text-[32px] md:text-[38px] font-black tracking-tight leading-[0.85] text-black">
              SERVE
            </span>
            <span className="text-[32px] md:text-[38px] font-black tracking-tight leading-[0.85] text-black mt-1">
              GO
            </span>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="mt-10 md:mt-12 w-48 md:w-56 h-[5px] bg-black/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-black rounded-full transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>
    </div>
  );
}
