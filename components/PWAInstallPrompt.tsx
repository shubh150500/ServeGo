"use client";

import React, { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed)
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (isStandalone) return;

      const handleBeforeInstallPrompt = (e: Event) => {
        // Prevent default browser install bar
        e.preventDefault();
        // Store event
        setDeferredPrompt(e);
        // Show prompt after a delay (e.g. 3 seconds after loading)
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      // Register Service Worker
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").then(
          (reg) => console.log("Service Worker registered successfully with scope:", reg.scope),
          (err) => console.error("Service Worker registration failed:", err)
        );
      }

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show native prompt
    deferredPrompt.prompt();
    
    // Wait for choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // Clean up
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md bg-card/95 backdrop-blur-xl border border-border/80 p-5 rounded-3xl shadow-2xl z-50 animate-in slide-in-from-bottom duration-300">
      <button 
        onClick={handleClose}
        className="absolute top-4 right-4 p-1.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 overflow-hidden">
          <img src="/logo.png" alt="ServeGo App" className="w-full h-full object-cover" />
        </div>
        <div className="space-y-1 pr-6">
          <h4 className="font-black text-base text-foreground tracking-tight flex items-center gap-1.5">
            Install ServeGo App
          </h4>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Get instant access, real-time booking tracking, and fast notifications directly on your phone.
          </p>
        </div>
      </div>
      
      <div className="mt-4 flex gap-3">
        <button
          onClick={handleInstallClick}
          className="flex-1 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Install App
        </button>
        <button
          onClick={handleClose}
          className="px-4 py-2.5 border border-border/80 text-xs font-semibold rounded-xl hover:bg-muted transition-all cursor-pointer text-muted-foreground hover:text-foreground"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}
