"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { 
  Users, 
  MapPin, 
  Layers, 
  ShieldCheck, 
  ArrowRight, 
  ChevronDown, 
  Clock, 
  Star,
  Award,
  Zap,
  TrendingUp,
  Sparkles,
  Mail,
  Copy,
  Check,
  Share2,
  Phone,
  Calendar,
  User,
  ShoppingBag,
  Car
} from "lucide-react";
import { SERVICES_LIST } from "@/lib/services";

export default function PreLaunchPage() {
  // Config states loaded dynamically from Firestore
  const [config, setConfig] = useState<any>({
    launchDate: "2026-07-16T10:00:00+05:30",
    launchMessage: "🚀 ServeGo launches on 16 July 2026. Join the waitlist today and get early access to Aurangabad's trusted home services, local shops and vehicle rentals.",
    heroHeading: "Something Big is Coming to Aurangabad.",
    heroSubheading: "The Future of Local Services, Trusted Professionals, Partner Shops and Vehicle Rentals.",
    countdownVisibility: true,
    waitlistVisibility: true,
    citiesPlanned: 1,
    servicesPlanned: 15,
    professionalsTarget: 100,
  });

  const [dbStats, setDbStats] = useState({
    waitlistCount: 1842
  });

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Client device / referral detection
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState({ browser: "unknown", device: "unknown" });

  // Form states
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("Aurangabad");
  const [area, setArea] = useState("");
  const [service, setService] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Phone Mockup Active Tab
  const [phoneTab, setPhoneTab] = useState<"home" | "booking" | "worker" | "shop" | "rental">("home");

  // FAQ Expanded State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Background particles canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // 1. Detect referral and device info
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) setReferredBy(ref);

      const ua = window.navigator.userAgent;
      let browser = "Other";
      if (ua.indexOf("Chrome") > -1) browser = "Chrome";
      else if (ua.indexOf("Safari") > -1) browser = "Safari";
      else if (ua.indexOf("Firefox") > -1) browser = "Firefox";
      else if (ua.indexOf("Edge") > -1) browser = "Edge";
      
      let device = "Desktop";
      if (/Mobi|Android|iPhone/i.test(ua)) device = "Mobile";
      else if (/Tablet|iPad/i.test(ua)) device = "Tablet";
      
      setDeviceInfo({ browser, device });
    }

    // 2. Real-time Firebase Config Listeners
    const unsubToggles = onSnapshot(doc(db, "system_config", "toggles"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig((prev: any) => ({ ...prev, ...data }));
      }
    });

    const unsubCounters = onSnapshot(doc(db, "system_config", "counters"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && typeof data.waitlistCount === "number") {
          setDbStats({ waitlistCount: data.waitlistCount });
        }
      }
    });

    // 3. Particles background setup
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        let animationFrameId: number;
        let particles: Array<{ x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }> = [];

        const resizeCanvas = () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        };

        const createParticles = () => {
          particles = [];
          const count = Math.min(60, Math.floor(window.innerWidth / 20));
          for (let i = 0; i < count; i++) {
            particles.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              size: Math.random() * 2 + 0.5,
              speedX: (Math.random() - 0.5) * 0.3,
              speedY: (Math.random() - 0.5) * 0.3,
              opacity: Math.random() * 0.5 + 0.2
            });
          }
        };

        const drawParticles = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
          particles.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(224, 224, 225, ${p.opacity})`;
            ctx.fill();

            // Update particle positions
            p.x += p.speedX;
            p.y += p.speedY;

            // Bounce on boundaries
            if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
            if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
          });

          animationFrameId = requestAnimationFrame(drawParticles);
        };

        resizeCanvas();
        createParticles();
        drawParticles();

        window.addEventListener("resize", () => {
          resizeCanvas();
          createParticles();
        });

        return () => {
          cancelAnimationFrame(animationFrameId);
          window.removeEventListener("resize", resizeCanvas);
        };
      }
    }

    return () => {
      unsubToggles();
      unsubCounters();
    };
  }, []);

  // Auto transition phone screen preview tab
  useEffect(() => {
    const tabs: Array<"home" | "booking" | "worker" | "shop" | "rental"> = ["home", "booking", "worker", "shop", "rental"];
    const interval = setInterval(() => {
      setPhoneTab((prev) => {
        const nextIndex = (tabs.indexOf(prev) + 1) % tabs.length;
        return tabs[nextIndex];
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Countdown calculations
  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(config.launchDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [config.launchDate]);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setAlreadyRegistered(false);

    if (!name.trim() || !mobile.trim() || !city.trim() || !service.trim()) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(mobile.trim())) {
      setError("Please enter a valid 10-digit mobile number.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          city: city.trim(),
          area: area.trim(),
          service: service.trim(),
          referredBy: referredBy,
          browser: deviceInfo.browser,
          device: deviceInfo.device
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to join waitlist.");
      }

      if (data.alreadyRegistered) {
        setAlreadyRegistered(true);
      }
      
      setUserPosition(data.waitlistPosition);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to register. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const link = `${window.location.origin}/pre-launch?ref=SG${userPosition}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const referralLink = typeof window !== "undefined" 
    ? `${window.location.origin}/pre-launch?ref=SG${userPosition}` 
    : `https://servego.co.in/pre-launch?ref=SG${userPosition}`;

  const faqs = [
    {
      q: "What is ServeGo?",
      a: "ServeGo is Aurangabad's premium home services and local rental ecosystem. We connect verified local professionals, neighborhood shops, and vehicle rental partners directly to consumers with standard transparent pricing and zero hidden markups."
    },
    {
      q: "Why should I join the pre-launch waitlist?",
      a: "Waitlist members secure exclusive launch benefits: free booking fees for the first 3 months, priority service dispatch, and access to special introductory rates across all service, rental, and shopping categories."
    },
    {
      q: "How does the referral system work?",
      a: "Every registrant receives a unique referral code. When someone joins the waitlist using your link, your priority position is boosted by 5 spots closer to #1, granting you earlier access to private beta bookings."
    },
    {
      q: "How are local service professionals verified?",
      a: "Every technician, plumber, electrician, and worker goes through rigorous background checks, document verification, and practical skills auditing, backed by the ServeGo Standard Guarantee."
    }
  ];

  const previewTabs = [
    { id: "home", label: "Home Services", icon: Zap },
    { id: "booking", label: "Quick Booking", icon: Calendar },
    { id: "worker", label: "Professional Profile", icon: User },
    { id: "shop", label: "Partner Shops", icon: ShoppingBag },
    { id: "rental", label: "Vehicle Rental", icon: Car }
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans overflow-x-hidden selection:bg-white/20 relative">
      {/* 1. Animated background particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-60" />

      {/* 2. Glow effects */}
      <div className="absolute top-[-10%] left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-zinc-800/10 via-zinc-900/5 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-zinc-700/5 via-zinc-900/5 to-transparent rounded-full blur-[160px] pointer-events-none z-0" />

      {/* 3. Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:50px_50px] opacity-40 pointer-events-none z-0" />

      {/* 4. Elegant Aurangabad Skyline Outline Overlay (Very faint SVG backdrop) */}
      <div className="absolute bottom-[5%] left-0 right-0 h-[300px] opacity-[0.03] pointer-events-none z-0 flex items-end">
        <svg viewBox="0 0 1440 320" width="100%" height="100%" preserveAspectRatio="none" className="stroke-white fill-none stroke-[1.5]">
          {/* Custom outline of Bibi Ka Maqbara domes, Aurangabad Gates, and hills */}
          <path d="M 0,280 L 150,280 Q 200,240 230,280 L 320,280 Q 340,180 370,180 Q 400,180 420,280 L 450,280 Q 460,260 470,260 Q 480,260 490,280 L 520,280 Q 560,120 620,120 Q 680,120 720,280 L 780,280 Q 800,200 820,200 Q 840,200 860,280 L 980,280 Q 1020,220 1050,280 L 1120,280 Q 1200,150 1280,280 L 1440,280" />
          <path d="M 570,280 L 570,170 Q 620,130 670,170 L 670,280 M 590,280 L 590,210 Q 620,180 650,210 L 650,280" className="stroke-dashed opacity-50" />
          <circle cx="620" cy="110" r="4" className="fill-white" />
        </svg>
      </div>

      {/* Main Luxury Frame container */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 relative z-10">
        
        {/* Apple style Top Header Logo */}
        <header className="flex items-center justify-between border-b border-white/5 pb-8 mb-16">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="ServeGo" className="w-9 h-9 rounded-xl object-contain border border-white/10 p-0.5 bg-black" />
            <span className="text-xl font-extrabold tracking-tight uppercase text-white font-mono">ServeGo</span>
          </div>
          <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#CCCCCC] backdrop-blur-md">
            🚀 PRE-LAUNCH waitlist
          </span>
        </header>

        {/* Hero & Waitlist main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center mb-24">
          
          {/* Left Column: Hero Headers and Badges */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400 animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-300">
                {config.launchMessage.split(" ")[0]} {config.launchMessage.split(" ")[1]} {config.launchMessage.split(" ")[2]}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] bg-gradient-to-b from-white via-zinc-100 to-zinc-500 bg-clip-text text-transparent">
              {config.heroHeading}
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 font-medium leading-relaxed max-w-xl">
              {config.heroSubheading}
            </p>

            {/* Launching Badge & Countdown */}
            {config.countdownVisibility && (
              <div className="space-y-4 pt-4 max-w-md">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">LAUNCH COUNTDOWN</span>
                <div className="flex gap-4">
                  {[
                    { label: "DAYS", value: timeLeft.days },
                    { label: "HOURS", value: timeLeft.hours },
                    { label: "MINS", value: timeLeft.minutes },
                    { label: "SECS", value: timeLeft.seconds }
                  ].map((unit, idx) => (
                    <div key={idx} className="flex-1 bg-[#0a0a0a]/90 border border-white/10 rounded-2xl p-4 text-center shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-300">
                      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      <span className="text-2xl sm:text-3xl font-black text-white block tracking-tighter">
                        {String(unit.value).padStart(2, "0")}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mt-1">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Floating interactive badges (around Hero) */}
            <div className="flex flex-wrap gap-3 pt-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-zinc-300 backdrop-blur-md hover:border-white/20 transition-all">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                <span>100+ Verified Professionals</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-zinc-300 backdrop-blur-md hover:border-white/20 transition-all">
                <Zap className="w-3.5 h-3.5 text-zinc-400" />
                <span>15+ Categories</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-zinc-300 backdrop-blur-md hover:border-white/20 transition-all">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span>Trusted Local Platform</span>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Waitlist card */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-1 bg-gradient-to-b from-zinc-700/20 to-transparent rounded-3xl blur opacity-35" />
            <div className="relative bg-[#0d0d0d]/95 border border-white/10 p-8 rounded-3xl backdrop-blur-3xl shadow-2xl space-y-6">
              
              <AnimatePresence mode="wait">
                {success ? (
                  /* Success / Registered UI */
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    key="success-card"
                    className="text-center py-4 space-y-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto shadow-inner">
                      <Award className="w-8 h-8 text-zinc-300" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">
                        {alreadyRegistered ? "✅ Welcome Back!" : "🎉 You're on the Waitlist!"}
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed px-2">
                        {alreadyRegistered 
                          ? "You are already registered on the ServeGo Waitlist. See your current priority rank and referral link below." 
                          : `Thank you, ${name}! Your early access slot has been successfully registered.`}
                      </p>
                    </div>

                    {/* Numeric Position Badge */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden shadow-inner">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">YOUR WAITLIST POSITION</span>
                      <span className="text-4xl font-extrabold text-white mt-1.5 block tracking-tight">
                        #{userPosition}
                      </span>
                    </div>

                    {/* Referral section */}
                    <div className="space-y-3 pt-2 text-left">
                      <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 tracking-widest">
                        <span>INVITE FRIENDS & MOVE HIGHER</span>
                        <span className="text-zinc-400">SG{userPosition}</span>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value={referralLink} 
                          className="flex-1 bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-[11px] font-mono text-zinc-300 focus:outline-none"
                        />
                        <button
                          onClick={copyToClipboard}
                          className="px-3 bg-white text-black rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center"
                          title="Copy Link"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[9px] text-zinc-500 font-semibold text-center mt-1">
                        Invite 5 friends and move higher in the waitlist.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
                      🔥 Join {dbStats.waitlistCount}+ members already waiting
                    </div>
                  </motion.div>
                ) : (
                  /* Input Registration Form */
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key="registration-form"
                    className="space-y-6"
                  >
                    <div className="space-y-1.5">
                      <h2 className="text-xl font-bold tracking-tight">Join the Exclusive Waitlist</h2>
                      <p className="text-xs text-zinc-500 font-medium">Be the first to access professional local services, bookings and rental fleets.</p>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs font-semibold">
                        ⚠️ {error}
                      </div>
                    )}

                    <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Shubham Rajput"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-zinc-400 text-xs font-semibold text-white placeholder-zinc-600 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Mobile Number</label>
                        <input 
                          type="tel" 
                          required
                          pattern="[0-9]{10}"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="e.g. 9876543210"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-zinc-400 text-xs font-semibold text-white placeholder-zinc-600 transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">City</label>
                          <input 
                            type="text" 
                            required
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none text-xs font-semibold text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Area (Optional)</label>
                          <input 
                            type="text" 
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            placeholder="e.g. Cidco"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-zinc-400 text-xs font-semibold text-white placeholder-zinc-600 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Interested Service</label>
                        <select
                          required
                          value={service}
                          onChange={(e) => setService(e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-zinc-400 text-xs font-semibold text-white placeholder-zinc-600 transition-all"
                        >
                          <option value="" className="bg-black text-white">Choose Service Category</option>
                          {SERVICES_LIST.map((srv) => (
                            <option key={srv.id} value={srv.id} className="bg-black text-white">
                              {srv.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {referredBy && (
                        <div className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-[10px] text-zinc-400 flex items-center justify-between">
                          <span>Referred by user code:</span>
                          <span className="font-mono text-white font-bold">{referredBy}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading || !name.trim() || mobile.length !== 10 || !service}
                        className="w-full py-3.5 bg-white text-black font-bold text-xs rounded-xl shadow-lg hover:shadow-white/5 hover:bg-zinc-200 transition-all duration-300 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-widest mt-2"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Secure Early Access</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>
                    <p className="text-[9px] text-zinc-600 text-center font-medium">Join {dbStats.waitlistCount}+ professionals & customers already registered.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* Floating smartphone mockup & features display */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-20 border-t border-white/5 relative z-10">
          {/* Mockup selectors */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Interactive Walkthrough</span>
              <h3 className="text-3xl font-bold tracking-tight mt-1 text-white">Explore the Premium UI Preview</h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-md">Our app is engineered for speed, ease, and security. Cycle through features or click a tab to see previews inside the smartphone mockup.</p>
            </div>

            <div className="flex flex-col gap-2.5">
              {previewTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = phoneTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setPhoneTab(tab.id as any)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? "bg-white/5 border-white/20 shadow-lg" 
                        : "bg-transparent border-transparent hover:bg-white/3"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isActive ? "bg-white text-black" : "bg-white/5 text-white"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-white">{tab.label}</span>
                      <span className="text-[10px] text-zinc-500 font-medium block">
                        {tab.id === "home" && "Fast access to home cleaning, repair & upkeep"}
                        {tab.id === "booking" && "Check available technician slots & book instantly"}
                        {tab.id === "worker" && "Detailed ratings, history & background verifications"}
                        {tab.id === "shop" && "Purchase groceries & health essentials from local stores"}
                        {tab.id === "rental" && "Reserve sedan, hatchback & two-wheelers on-demand"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Floating smartphone wrapper */}
          <div className="lg:col-span-6 flex justify-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
            
            {/* Bobbing smartphone framework */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="w-[280px] h-[560px] bg-[#0c0c0c] border-[6px] border-zinc-800 rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col"
            >
              {/* iPhone style dynamic island / notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-black rounded-full z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800" />
              </div>

              {/* Internal phone screens */}
              <div className="flex-1 bg-black p-4 pt-12 overflow-y-auto z-10 flex flex-col gap-4 text-xs select-none">
                <AnimatePresence mode="wait">
                  {phoneTab === "home" && (
                    <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 font-bold uppercase tracking-wider">Services</span>
                        <MapPin className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {["Electrician", "Plumber", "AC Repair", "Cleaning"].map((n) => (
                          <div key={n} className="bg-white/5 border border-white/5 p-3 rounded-xl hover:border-white/10 transition-colors">
                            <span className="font-bold text-white block">{n}</span>
                            <span className="text-[9px] text-zinc-500 mt-1 block">Starts at ₹199</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {phoneTab === "booking" && (
                    <motion.div key="booking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider block">Confirm Slot</span>
                      <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-3">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Date</span>
                          <span className="text-white font-bold">16 July 2026</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Time</span>
                          <span className="text-white font-bold">10:00 AM - 12:00 PM</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2 font-bold text-white">
                          <span>Total Pay</span>
                          <span>₹299</span>
                        </div>
                      </div>
                      <button className="w-full py-2.5 bg-white text-black font-bold rounded-xl text-[10px] uppercase">Book Worker</button>
                    </motion.div>
                  )}

                  {phoneTab === "worker" && (
                    <motion.div key="worker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white">
                          RP
                        </div>
                        <div>
                          <span className="font-bold text-white block">Rahul Prasad</span>
                          <span className="text-[9px] text-zinc-500 block">Electrician • 5 yrs Exp</span>
                        </div>
                      </div>
                      <div className="flex gap-1 items-center">
                        {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3 h-3 text-white fill-white" />)}
                        <span className="text-[10px] text-zinc-400 ml-1">(120 Reviews)</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 p-2 rounded-xl text-[9px] text-zinc-400">
                        "Extremely professional. Solved standard wiring issues in minutes."
                      </div>
                    </motion.div>
                  )}

                  {phoneTab === "shop" && (
                    <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider block">Partner Shops</span>
                      <div className="space-y-2">
                        <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl flex justify-between items-center">
                          <div>
                            <span className="font-bold text-white block">Krishna Medicos</span>
                            <span className="text-[9px] text-zinc-500">Medicine & Healthcare</span>
                          </div>
                          <span className="text-[9px] bg-white/10 text-white px-2 py-0.5 rounded">Active</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl flex justify-between items-center">
                          <div>
                            <span className="font-bold text-white block">Sagar Supermarket</span>
                            <span className="text-[9px] text-zinc-500">Daily Groceries</span>
                          </div>
                          <span className="text-[9px] bg-white/10 text-white px-2 py-0.5 rounded">Active</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {phoneTab === "rental" && (
                    <motion.div key="rental" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider block">Vehicle Rental</span>
                      <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-2">
                        <span className="font-bold text-white block">Maruti Swift (Sedan Class)</span>
                        <div className="flex justify-between text-[9px] text-zinc-500">
                          <span>Fuel type: Petrol</span>
                          <span>Daily: ₹1500/day</span>
                        </div>
                        <button className="w-full py-2 bg-white/10 text-white font-bold rounded-xl text-[9px] uppercase border border-white/15">Rent Now</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom reflection bar */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-28 h-1.5 bg-zinc-800 rounded-full z-30" />
            </motion.div>
          </div>
        </section>

        {/* Feature Previews grid */}
        <section className="space-y-12 py-20 border-t border-white/5 relative z-10">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Available Categories</span>
            <h3 className="text-3xl font-bold tracking-tight text-white">Redefined Local Offerings</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {SERVICES_LIST.map((srv) => (
              <div key={srv.id} className="bg-[#0b0b0b] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all duration-300 hover:shadow-2xl">
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <span className="px-2 py-0.5 bg-white/5 text-white/50 border border-white/10 rounded-full text-[8px] font-bold uppercase tracking-wider absolute top-4 right-4">
                  Launching Soon
                </span>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-white group-hover:bg-white group-hover:text-black transition-all">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{srv.name}</h3>
                <p className="text-[10px] text-zinc-500 font-medium">Early booking available soon</p>
              </div>
            ))}
          </div>
        </section>

        {/* Dynamic Social Proof Indicators */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 py-16 border-t border-white/5 relative z-10">
          {[
            { label: "Waitlist Members", value: dbStats.waitlistCount, icon: Users },
            { label: "Planned Cities", value: config.citiesPlanned, icon: MapPin },
            { label: "Services Ready", value: config.servicesPlanned, icon: Layers },
            { label: "Professionals Registered", value: config.professionalsTarget, icon: ShieldCheck }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white/3 border border-white/5 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white mb-4 group-hover:border-white/25 transition-all">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-2xl font-extrabold text-white block tracking-tighter">
                  {stat.value}+
                </span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mt-1">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </section>

        {/* FAQ Section */}
        <section className="space-y-12 py-20 border-t border-white/5 relative z-10">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Inquiries & Answers</span>
            <h3 className="text-3xl font-bold tracking-tight text-white">Frequently Asked Questions</h3>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div key={idx} className="bg-[#090909] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md transition-all duration-300">
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-sm text-white select-none cursor-pointer focus:outline-none hover:bg-white/3 transition-all"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isExpanded ? "rotate-180 text-white" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 pt-12 mt-12 flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-500 text-xs font-bold relative z-10">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-5 h-5 opacity-50" />
            <span className="font-mono text-zinc-400">© {new Date().getFullYear()} ServeGo. Redefined Local Services.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="mailto:servegoofficial@gmail.com" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email Contact
            </a>
            <span className="text-white/10">|</span>
            <div className="flex items-center gap-1">
              <span>Target Launch:</span>
              <span className="text-white font-bold font-mono">16 July 2026</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}

