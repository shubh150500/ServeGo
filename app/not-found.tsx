import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, Search, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Page Not Found (404) | ServeGo Aurangabad",
  description: "The page you are looking for does not exist on ServeGo. Browse our local home services catalog or track your booking.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-6 text-center select-none relative">
      
      {/* Background blur blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-3xl" />

      <div className="max-w-md w-full space-y-8 relative z-10">
        
        {/* Brand header */}
        <div className="flex items-center justify-center gap-2">
          <img src="/logo.png" alt="ServeGo Logo" className="w-8 h-8 rounded-lg object-contain" />
          <span className="text-2xl font-black tracking-tighter text-black">
            ServeGo
          </span>
        </div>

        {/* Warning Icon */}
        <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">404 - Page Not Found</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Oops! The page you're searching for doesn't exist or has been moved. Use the links below to find what you need.
          </p>
        </div>

        {/* Quick Links */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xl space-y-4 text-left">
          <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Quick Navigation</h3>
          <div className="grid grid-cols-1 gap-2">
            <Link 
              href="/"
              className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-all font-semibold text-sm border border-transparent hover:border-border"
            >
              <Home className="w-4 h-4 text-primary" />
              <span>Back to Homepage</span>
            </Link>
            <Link 
              href="/#services"
              className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-all font-semibold text-sm border border-transparent hover:border-border"
            >
              <Search className="w-4 h-4 text-primary" />
              <span>Browse Home Services</span>
            </Link>
            <Link 
              href="/track"
              className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-all font-semibold text-sm border border-transparent hover:border-border"
            >
              <ArrowLeft className="w-4 h-4 text-primary" />
              <span>Track Existing Booking</span>
            </Link>
          </div>
        </div>

        <div className="pt-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Go back to safety
          </Link>
        </div>
      </div>
    </div>
  );
}
