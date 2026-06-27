"use client";

import React, { useState, useEffect } from "react";
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
  FileText, 
  Clock, 
  Star,
  Award,
  Zap,
  TrendingUp,
  Sparkles,
  Phone,
  Mail
} from "lucide-react";
import { SERVICES_LIST } from "@/lib/services";

export default function PreLaunchPage() {
  // Config states loaded dynamically from Firestore
  const [config, setConfig] = useState<any>({
    launchDate: "2026-08-16T00:00:00",
    launchMessage: "We are launching very soon in your area. Register early to claim exclusive benefits.",
    heroHeading: "Aurangabad's Smartest Home Services Platform",
    heroSubheading: "Connecting customers with verified professionals faster than ever before.",
    countdownVisibility: true,
    waitlistVisibility: true,
    citiesPlanned: 3,
    servicesPlanned: 11,
    professionalsTarget: 150,
  });

  // Database stats counter
  const [dbStats, setDbStats] = useState({
    waitlistCount: 2583
  });

  // Countdown timer calculations
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Form registration state
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("Aurangabad");
  const [area, setArea] = useState("");
  const [service, setService] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [error, setError] = useState("");

  // FAQ Expanded State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    // 1. Listen to toggles configuration in real-time
    const unsubToggles = onSnapshot(doc(db, "system_config", "toggles"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig((prev: any) => ({ ...prev, ...data }));
      }
    });

    // 2. Listen to position counter in real-time
    const unsubCounters = onSnapshot(doc(db, "system_config", "counters"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && typeof data.waitlistCount === "number") {
          setDbStats({ waitlistCount: data.waitlistCount });
        }
      }
    });

    return () => {
      unsubToggles();
      unsubCounters();
    };
  }, []);

  // Countdown Clock tick
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
          service: service.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to join waitlist.");
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

  const faqs = [
    {
      q: "What is ServeGo?",
      a: "ServeGo is Aurangabad's upcoming premium home services marketplace platform. We connect verified professional technicians, cleaners, carpenters, and rental partners directly to consumers with standard transparent pricing and zero middleman commissions."
    },
    {
      q: "Why should I join the waitlist?",
      a: "Waitlist members get exclusive early-bird benefits: priority scheduling, zero booking fees for the first 3 months, and standard discounted rates on all booking categories."
    },
    {
      q: "How are the professionals verified?",
      a: "Every worker or shop partner goes through strict background verification, professional identity screening, and credential auditing, backed by the ServeGo Quality Guarantee."
    },
    {
      q: "When will the platform launch?",
      a: `ServeGo is scheduled to launch live in Aurangabad on August 16, 2026. Keep an eye on your WhatsApp notifications and emails for early testing updates.`
    }
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans overflow-x-hidden selection:bg-[#fff]/20 relative">
      {/* Luxury Radial Backlighting / Floating Reflection */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[500px] bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-[140px] pointer-events-none z-0" />
      <div className="absolute top-[20%] left-[-10%] w-[350px] h-[350px] bg-[#fff]/3 rounded-full blur-[100px] pointer-events-none z-0" />
      
      {/* Glossy Grid Overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 pointer-events-none z-0" />

      {/* Main Luxury Frame */}
      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        
        {/* Apple style Top Header Logo */}
        <header className="flex items-center justify-between border-b border-white/5 pb-8 mb-16">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ServeGo" className="w-8 h-8 rounded-lg object-contain border border-white/10" />
            <span className="text-xl font-black tracking-tight uppercase text-white">ServeGo</span>
          </div>
          <span className="px-3.5 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#B3B3B3]">
            Pre-Launch Phase
          </span>
        </header>

        {/* Hero & Waitlist Main Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: Hero & Message */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E06D3E]/10 border border-[#E06D3E]/30 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-[#E06D3E]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#E06D3E]">LAUNCHING IN AURANGABAD</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] bg-gradient-to-r from-white via-[#E6E6E6] to-[#737373] bg-clip-text text-transparent">
              {config.heroHeading}
            </h1>

            <p className="text-sm sm:text-base text-[#A3A3A3] font-medium leading-relaxed max-w-lg">
              {config.heroSubheading}
            </p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
              <p className="text-xs text-[#CCCCCC] leading-relaxed">
                📢 {config.launchMessage}
              </p>
            </div>

            {/* Countdown widget */}
            {config.countdownVisibility && (
              <div className="space-y-4 pt-4">
                <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">LAUNCH COUNTDOWN</span>
                <div className="flex gap-4">
                  {[
                    { label: "DAYS", value: timeLeft.days },
                    { label: "HRS", value: timeLeft.hours },
                    { label: "MINS", value: timeLeft.minutes },
                    { label: "SECS", value: timeLeft.seconds }
                  ].map((unit, idx) => (
                    <div key={idx} className="flex-1 bg-[#121212]/90 border border-white/5 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden group hover:border-white/15 transition-all">
                      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      <span className="text-2xl sm:text-3xl font-black text-white block tracking-tighter">
                        {String(unit.value).padStart(2, "0")}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-bold text-[#737373] uppercase tracking-wider block mt-1">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Waitlist glossy card */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#E06D3E]/30 to-[#A67C52]/30 rounded-3xl blur opacity-30" />
            <div className="relative bg-[#0F0F0F] border border-white/10 p-8 rounded-3xl backdrop-blur-3xl shadow-2xl space-y-6">
              
              {success ? (
                /* Success registration widget */
                <AnimatePresence>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6 space-y-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                      <Award className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">🎉 Waitlist Joined!</h3>
                      <p className="text-xs text-[#A3A3A3] px-2 leading-relaxed">
                        Thank you, {name}! We have secured your early-bird registration slot. You will be notified the moment we launch.
                      </p>
                    </div>

                    {/* Sequential Position box */}
                    {userPosition && (
                      <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#E06D3E]/5 to-transparent pointer-events-none" />
                        <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">YOUR WAITLIST POSITION</span>
                        <span className="text-3xl font-black text-white mt-1.5 block">
                          #{userPosition}
                        </span>
                      </div>
                    )}

                    <div className="text-xs text-[#737373] font-semibold">
                      🔥 Join {dbStats.waitlistCount} others already on the waitlist!
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                /* Registration Waitlist Form */
                <>
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-extrabold tracking-tight">Join the Exclusive Waitlist</h2>
                    <p className="text-xs text-[#737373] font-medium">Be the first to book local services with verified performers.</p>
                  </div>

                  {error && (
                    <div className="p-3.5 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs font-semibold">
                      ⚠️ {error}
                    </div>
                  )}

                  <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#E06D3E] text-xs font-medium transition-all text-white placeholder-[#525252]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block">Mobile Number</label>
                      <input 
                        type="tel" 
                        required
                        pattern="[0-9]{10}"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="e.g. 9876543210"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#E06D3E] text-xs font-medium transition-all text-white placeholder-[#525252]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block">City</label>
                        <input 
                          type="text" 
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Aurangabad"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#E06D3E] text-xs font-medium transition-all text-white placeholder-[#525252]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block">Area (Optional)</label>
                        <input 
                          type="text" 
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          placeholder="e.g. Cidco"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#E06D3E] text-xs font-medium transition-all text-white placeholder-[#525252]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block">Interested Service</label>
                      <select
                        required
                        value={service}
                        onChange={(e) => setService(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#E06D3E] text-xs font-medium transition-all text-white placeholder-[#525252]"
                      >
                        <option value="" className="bg-[#121212]">Choose Category</option>
                        {SERVICES_LIST.map((srv) => (
                          <option key={srv.id} value={srv.id} className="bg-[#121212]">
                            {srv.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !name.trim() || mobile.trim().length !== 10 || !service}
                      className="w-full py-3.5 bg-gradient-to-r from-[#E06D3E] to-[#A67C52] text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-[#E06D3E]/20 hover:brightness-105 transition-all duration-300 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider block mt-2 border border-white/10"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Secure Early Access</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                  <p className="text-[9px] text-[#525252] text-center font-medium">Join {dbStats.waitlistCount} people who have already registered.</p>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Dynamic Social Proof Stat Indicators */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-24 pb-16 border-t border-white/5 mt-24">
          {[
            { label: "Waitlist Registrants", value: dbStats.waitlistCount, icon: Users },
            { label: "Cities Covered", value: config.citiesPlanned, icon: MapPin },
            { label: "Available Services", value: config.servicesPlanned, icon: Layers },
            { label: "Verified Professionals", value: config.professionalsTarget, icon: ShieldCheck }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white/3 border border-white/5 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white mb-4 group-hover:border-[#E06D3E]/30 transition-all">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-2xl font-black text-white block tracking-tighter">
                  {stat.value}+
                </span>
                <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mt-1">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </section>

        {/* Luxury Platform Features Panel */}
        <section className="space-y-12 py-16 border-t border-white/5">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-bold text-[#E06D3E] uppercase tracking-widest block">Premium Platform Capabilities</span>
            <h2 className="text-3xl font-black tracking-tight">Standard Quality Assurance</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Verified Workers",
                desc: "Strict screening, ID credentials verification, and standard criminal background checks.",
                icon: ShieldCheck
              },
              {
                title: "Fast Booking",
                desc: "Instant booking verification and immediate slot assignment algorithms.",
                icon: Zap
              },
              {
                title: "Transparent Pricing",
                desc: "Zero middleman markup, transparent standardized fees, and secure payments.",
                icon: TrendingUp
              }
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="bg-[#121212]/80 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/15 transition-all">
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Luxury FAQ Accordion */}
        <section className="space-y-12 py-16 border-t border-white/5">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-bold text-[#E06D3E] uppercase tracking-widest block">Common Inquiries</span>
            <h2 className="text-3xl font-black tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {faqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div key={idx} className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-sm text-white select-none cursor-pointer focus:outline-none hover:bg-white/5 transition-all"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[#737373] transition-transform duration-300 ${isExpanded ? "rotate-180 text-white" : ""}`} />
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
                        <div className="px-6 pb-5 text-xs text-[#A3A3A3] leading-relaxed border-t border-white/5 pt-4">
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
        <footer className="border-t border-white/5 pt-12 mt-12 flex flex-col md:flex-row items-center justify-between gap-6 text-[#737373] text-xs font-semibold">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-5 h-5 opacity-70" />
            <span>&copy; {new Date().getFullYear()} ServeGo. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="mailto:servegoofficial@gmail.com" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </a>
            <span className="text-white/10">|</span>
            <div className="flex items-center gap-1">
              <span>Target Launch:</span>
              <span className="text-white font-bold">16 August 2026</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
