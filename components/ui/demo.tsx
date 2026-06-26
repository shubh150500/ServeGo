"use client";

import React from "react";
import { motion } from "framer-motion";
import { DotGlobeHero } from "@/components/ui/globe-hero";
import { ArrowRight, Zap, Search } from "lucide-react";

// Compound SVG Component for 3D metallic wrench with transparent notches
const WrenchSVG = () => (
  <svg width="82" height="82" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="metal-wrench" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="35%" stopColor="#cbd5e1" />
        <stop offset="70%" stopColor="#64748b" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
      <linearGradient id="highlight-wrench" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>
    <g transform="rotate(-15 50 50)">
      {/* Handle */}
      <rect x="43" y="24" width="14" height="52" rx="7" fill="url(#metal-wrench)" />
      <rect x="45" y="28" width="10" height="44" rx="4" fill="url(#highlight-wrench)" opacity="0.3" />
      
      {/* Top Head with cutouts using evenodd rule */}
      <path d="M50,8 A17,17 0 1,1 50,42 A17,17 0 0,1 50,8 Z M42,8 H58 V19 L50,25 L42,19 Z" fillRule="evenodd" fill="url(#metal-wrench)" />
      
      {/* Bottom Head with hole using evenodd rule */}
      <path d="M50,66 A13,13 0 1,1 50,92 A13,13 0 0,1 50,66 Z M50,74 A5,5 0 1,0 50,84 A5,5 0 0,0 50,74 Z" fillRule="evenodd" fill="url(#metal-wrench)" />
    </g>
  </svg>
);

// Compound SVG Component for 3D metallic broom/brush
const BroomSVG = () => (
  <svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="broom-metal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="50%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="bristles-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="75%" stopColor="#64748b" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
    </defs>
    <g transform="rotate(35 50 50)">
      {/* Handle */}
      <rect x="47" y="12" width="6" height="46" rx="3" fill="url(#broom-metal)" />
      
      {/* Brush Base */}
      <path d="M30,58 L70,58 C73,58 75,60 75,63 L75,66 C75,68 73,70 70,70 L30,70 C27,70 25,68 25,66 L25,63 C25,60 27,58 30,58 Z" fill="url(#broom-metal)" />
      
      {/* Bristles */}
      <path d="M26,70 L20,88 C20,90 22,92 25,92 L75,92 C78,92 80,90 80,88 L74,70 Z" fill="url(#bristles-grad)" />
      {/* Bristle separator details */}
      <line x1="31" y1="72" x2="27" y2="90" stroke="#1e293b" strokeWidth="1.2" opacity="0.4" />
      <line x1="40" y1="72" x2="38" y2="90" stroke="#1e293b" strokeWidth="1.2" opacity="0.4" />
      <line x1="50" y1="72" x2="50" y2="90" stroke="#1e293b" strokeWidth="1.2" opacity="0.4" />
      <line x1="60" y1="72" x2="62" y2="90" stroke="#1e293b" strokeWidth="1.2" opacity="0.4" />
      <line x1="69" y1="72" x2="73" y2="90" stroke="#1e293b" strokeWidth="1.2" opacity="0.4" />
    </g>
  </svg>
);

// Compound SVG Component for 3D metallic AC Unit
const ACSVG = () => (
  <svg width="78" height="78" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ac-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="45%" stopColor="#f1f5f9" />
        <stop offset="85%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id="ac-vent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="50%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>
    <g transform="rotate(-8 50 50)">
      {/* Main AC Box */}
      <rect x="15" y="32" width="70" height="34" rx="5" fill="url(#ac-body)" />
      
      {/* Front Panel border & gloss */}
      <rect x="18" y="36" width="64" height="16" rx="2" fill="#f8fafc" opacity="0.95" />
      
      {/* Logo mark */}
      <circle cx="50" cy="44" r="1.5" fill="#cbd5e1" />
      
      {/* Bottom Vent */}
      <rect x="18" y="55" width="64" height="4" rx="1" fill="url(#ac-vent)" />
      
      {/* Status Lights */}
      <circle cx="76" cy="44" r="1" fill="#22c55e" />
      <circle cx="80" cy="44" r="1" fill="#3b82f6" />
      
      {/* Air Flow indicators */}
      <path d="M23,65 Q28,74 26,79" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
      <path d="M50,65 Q52,75 50,80" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
      <path d="M77,65 Q72,74 74,79" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
    </g>
  </svg>
);

// Compound SVG Component for 3D metallic keyring and keys
const KeysSVG = () => (
  <svg width="54" height="54" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="key-metal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="35%" stopColor="#cbd5e1" />
        <stop offset="70%" stopColor="#64748b" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
    </defs>
    <g transform="rotate(20 50 50)">
      {/* Key Ring */}
      <circle cx="42" cy="42" r="17" stroke="url(#key-metal)" strokeWidth="3.5" />
      
      {/* Key 1 (Primary) */}
      <g transform="rotate(35 42 42)">
        {/* Head */}
        <path d="M42,59 A9,9 0 1,1 42,77 A9,9 0 0,1 42,59 Z M42,65 A3,3 0 1,0 42,71 A3,3 0 0,0 42,65 Z" fillRule="evenodd" fill="url(#key-metal)" />
        {/* Shaft */}
        <rect x="40.5" y="76" width="3" height="22" fill="url(#key-metal)" />
        {/* Teeth */}
        <rect x="43.5" y="85" width="3" height="2.5" rx="0.5" fill="url(#key-metal)" />
        <rect x="43.5" y="90" width="2.5" height="2.5" rx="0.5" fill="url(#key-metal)" />
      </g>

      {/* Key 2 (Secondary) */}
      <g transform="rotate(-45 42 42)">
        {/* Head */}
        <path d="M42,59 A9,9 0 1,1 42,77 A9,9 0 0,1 42,59 Z M42,65 A3,3 0 1,0 42,71 A3,3 0 0,0 42,65 Z" fillRule="evenodd" fill="url(#key-metal)" />
        {/* Shaft */}
        <rect x="40.5" y="76" width="3" height="18" fill="url(#key-metal)" />
        {/* Teeth */}
        <rect x="43.5" y="81" width="3" height="2.5" rx="0.5" fill="url(#key-metal)" />
        <rect x="43.5" y="86" width="2.5" height="2.5" rx="0.5" fill="url(#key-metal)" />
      </g>
    </g>
  </svg>
);

export default function DotGlobeHeroDemo() {
  const scrollToServices = () => {
    const servicesSection = document.getElementById("services");
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToHowItWorks = () => {
    const howItWorksSection = document.getElementById("how-it-works");
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <DotGlobeHero
      rotationSpeed={0.002}
      className="hero-section-wrapper relative overflow-x-hidden min-h-screen md:min-h-[110vh] flex items-center"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/20 pointer-events-none" />
      
      {/* Enhanced glowing gradients to replicate screenshot aesthetic */}
      <div className="absolute top-[10%] left-[-5%] w-[450px] h-[450px] bg-blue-300/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[110px] pointer-events-none animate-pulse duration-[8s]" />
      
      {/* Two Column Grid Layout */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center pt-28 pb-16 lg:pt-32 lg:pb-24">
        
        {/* Left Column: Heading, Subheading & CTAs */}
        <div className="lg:col-span-6 flex flex-col items-start text-left space-y-6 md:space-y-8 max-w-xl">
          
          {/* Aurangabad zone tag */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/15 via-primary/5 to-primary/15 border border-primary/25 backdrop-blur-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]"
          >
            <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
            <span className="relative z-10 text-xs font-bold text-foreground/80 tracking-wider uppercase">Aurangabad zone</span>
            <div className="w-2 h-2 bg-primary rounded-full animate-ping [animation-delay:0.5s]" />
          </motion.div>
          
          {/* Heading */}
          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.9] select-none uppercase text-foreground text-left"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              <span className="block font-black text-foreground mb-1">
                connecting
              </span>
              <span className="block font-black text-foreground mb-1">
                you to the
              </span>
              <span className="inline-block relative">
                <span className="text-foreground font-black relative z-10">
                  services.
                </span>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, delay: 1.1, ease: "easeOut" }}
                  className="absolute -bottom-1 left-0 h-1.5 bg-gradient-to-r from-primary via-primary/70 to-transparent rounded-full"
                />
              </span>
            </motion.h1>
          </div>
          
          {/* Subheading & details */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-4"
          >
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground/90 leading-relaxed font-semibold" 
               style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              Find local professionals or grow{" "}
              <span className="text-foreground font-bold bg-gradient-to-r from-primary/15 to-primary/5 px-1.5 py-0.5 rounded-md">
                your business.
              </span>
            </p>
            <p className="text-sm md:text-base text-muted-foreground/70 font-medium">
              Book the required home services instantly with verified performers.
            </p>
          </motion.div>

          {/* Call-to-Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-2"
          >
            <motion.button
              onClick={scrollToServices}
              whileHover={{ 
                scale: 1.03, 
                boxShadow: "0 15px 35px -5px rgba(196, 106, 74, 0.25), 0 0 10px rgba(196, 106, 74, 0.1)",
                y: -1
              }}
              whileTap={{ scale: 0.98 }}
              className="group relative inline-flex items-center justify-center gap-3.5 px-7 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-base shadow-[0_10px_25px_-5px_rgba(196, 106, 74, 0.3)] transition-all duration-300 cursor-pointer overflow-hidden border border-primary/20"
            >
              <span className="relative z-10 tracking-wide">Find a Professional</span>
              <ArrowRight className="relative z-10 w-4.5 h-4.5 group-hover:translate-x-1.5 transition-transform duration-300" />
            </motion.button>
            
            <motion.button
              onClick={scrollToHowItWorks}
              whileHover={{ 
                scale: 1.03,
                backgroundColor: "#FAF6F1",
                borderColor: "#D7C3B0",
                boxShadow: "0 12px 25px -10px rgba(0,0,0,0.06)",
                y: -1
              }}
              whileTap={{ scale: 0.98 }}
              className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-3.5 border border-border/80 rounded-2xl font-bold text-base text-foreground/80 hover:text-foreground backdrop-blur-xl bg-background/40 hover:bg-background/80 transition-all duration-300 cursor-pointer shadow-sm"
            >
              <Zap className="relative z-10 w-4.5 h-4.5 text-primary/80 group-hover:scale-105 transition-transform" />
              <span className="relative z-10 tracking-wide">Become a Partner</span>
            </motion.button>
          </motion.div>
        </div>

        {/* Right Column: Sleek iPhone Mockup with Floating 3D Icons */}
        <div className="lg:col-span-6 flex items-center justify-center relative w-full h-[520px] sm:h-[600px] lg:h-[660px] select-none mt-6 lg:mt-0">
          
          {/* Ambient Glow behind the mockup */}
          <div className="absolute w-[320px] h-[320px] rounded-full bg-primary/5 blur-3xl pointer-events-none z-0" />
          
          {/* Smartphone Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotateY: 5 }}
            animate={{ opacity: 1, y: 0, rotateY: -3 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative w-[275px] h-[550px] sm:w-[300px] sm:h-[600px] bg-slate-950 rounded-[46px] p-2 sm:p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] border-[7px] border-slate-900/90 z-10 flex flex-col perspective-1000"
          >
            {/* Glossy Reflection overlay */}
            <div className="absolute inset-0 rounded-[38px] bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none z-20" />
            
            {/* Screen Content Wrapper */}
            <div className="relative w-full h-full bg-[#FAF6F1] rounded-[36px] overflow-hidden flex flex-col select-none">
              
              {/* Dynamic Island Notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5.5 bg-black rounded-full z-30 flex items-center justify-between px-2.5">
                <span className="text-[8.5px] text-white/95 font-bold leading-none">9:41</span>
                <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                <div className="flex items-center gap-1">
                  {/* Signal bars */}
                  <div className="flex items-end gap-[1px] h-1.5">
                    <div className="w-[1.5px] h-0.5 bg-white/90" />
                    <div className="w-[1.5px] h-1 bg-white/90" />
                    <div className="w-[1.5px] h-1.5 bg-white/90" />
                  </div>
                  {/* Battery */}
                  <div className="w-2.5 h-1.5 border border-white/80 rounded-[2px] p-[1px] flex items-center">
                    <div className="w-full h-full bg-white rounded-[1px]" />
                  </div>
                </div>
              </div>

              {/* In-App Content */}
              <div className="flex-1 flex flex-col pt-9 pb-3 px-3.5 overflow-y-auto scrollbar-none bg-[#FAF6F1]">
                
                {/* App Header Nav */}
                <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                  <div className="flex items-center gap-1">
                    <img src="/logo.png" alt="Logo" className="w-4 h-4 rounded-md object-contain" />
                    <span className="text-xs font-black tracking-tight text-black">ServeGo</span>
                  </div>
                  <Search className="w-3.5 h-3.5 text-black/75 font-bold" />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-1 mt-2.5 overflow-x-auto scrollbar-none">
                  {["Filter", "Filters", "Closest"].map((filter, idx) => (
                    <div key={idx} className="px-2.5 py-1 bg-white border border-border/50 text-[8.5px] font-bold rounded-lg text-muted-foreground flex items-center gap-1.5 whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                      {filter} <span className="text-[6.5px] text-muted-foreground/60">▼</span>
                    </div>
                  ))}
                </div>

                {/* Section Title */}
                <h4 className="text-[11px] font-extrabold tracking-wider text-slate-900 mt-4 mb-2.5 uppercase">Top services</h4>

                {/* Services mini listing */}
                <div className="space-y-1.5 flex-1">
                  {[
                    { name: "Electrician & Plumber", label: "🔌" },
                    { name: "Home Cleaning", label: "🧹" },
                    { name: "Salon & Spa", label: "💆" },
                    { name: "AC & Appliance Repair", label: "❄️" },
                    { name: "CCTV Installation", label: "📹" },
                    { name: "Carpentry & Assembly", label: "🔨" }
                  ].map((service, idx) => (
                    <div key={idx} className="p-2 bg-white border border-border/35 rounded-xl flex items-center justify-between shadow-[0_2px_4px_rgba(0,0,0,0.015)]">
                      <div className="flex items-center gap-3.5">
                        <div className="w-5.5 h-5.5 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                          {service.label}
                        </div>
                        <span className="text-[9px] font-semibold text-slate-700">{service.name}</span>
                      </div>
                      <span className="text-[8px] text-muted-foreground/50">▶</span>
                    </div>
                  ))}
                </div>

                {/* Bottom Navigation */}
                <div className="border-t border-border/40 pt-2 mt-2 flex items-center justify-between text-[7px] font-bold text-muted-foreground/80">
                  <div className="flex flex-col items-center gap-0.5 text-primary">
                    <span>🏠</span>
                    <span>Home</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span>🔍</span>
                    <span>Discover</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span>📋</span>
                    <span>Tasks</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span>👤</span>
                    <span>Profile</span>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

          {/* Floating 3D Elements with Parallax Depth and Animations */}
          
          {/* 1. Metallic Wrench - Top Left */}
          <div className="absolute top-[8%] left-[2%] sm:left-[-4%] depth-medium pointer-events-none z-20">
            <div className="float-icon delay-1">
              <WrenchSVG />
            </div>
          </div>

          {/* 2. Broom/Brush 1 - Bottom Left */}
          <div className="absolute bottom-[4%] left-[6%] sm:left-[-2%] depth-deep pointer-events-none z-20">
            <div className="float-icon delay-2">
              <BroomSVG />
            </div>
          </div>

          {/* 3. Broom/Brush 2 - Top Right */}
          <div className="absolute top-[12%] right-[5%] sm:right-[-2%] transform scale-75 rotate-[120deg] depth-shallow pointer-events-none z-0">
            <div className="float-icon delay-3">
              <BroomSVG />
            </div>
          </div>

          {/* 4. AC Unit - Middle Right */}
          <div className="absolute top-[42%] right-[-4%] sm:right-[-12%] depth-medium pointer-events-none z-20">
            <div className="float-icon delay-1">
              <ACSVG />
            </div>
          </div>

          {/* 5. Metallic Keys - Bottom Right */}
          <div className="absolute bottom-[10%] right-[3%] sm:right-[-4%] depth-shallow pointer-events-none z-20">
            <div className="float-icon delay-2">
              <KeysSVG />
            </div>
          </div>

        </div>

      </div>
    </DotGlobeHero>
  );
}
