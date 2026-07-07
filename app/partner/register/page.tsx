"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Lock, Phone, ShieldAlert, UserPlus, User, Briefcase, MapPin, CalendarDays } from "lucide-react";
import { SERVICES_LIST } from "@/lib/services";

export default function PartnerRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [area, setArea] = useState("");
  const [experience, setExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [servicesList, setServicesList] = useState<any[]>(SERVICES_LIST);

  useEffect(() => {
    // Load database services config
    const fetchDbServices = async () => {
      try {
        const qSnap = await getDocs(collection(db, "services"));
        const list = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (list.length > 0) {
          setServicesList(list);
        }
      } catch (err) {
        console.error("Error loading services config:", err);
      }
    };
    fetchDbServices();

    // Inject partner manifest and service worker dynamically
    if (typeof window !== "undefined") {
      const existingLink = document.querySelector('link[rel="manifest"]');
      if (existingLink) {
        existingLink.setAttribute("href", "/partner-manifest.json");
      } else {
        const link = document.createElement("link");
        link.rel = "manifest";
        link.href = "/partner-manifest.json";
        document.head.appendChild(link);
      }

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/partner-sw.js");
      }
    }

    // Redirect if already logged in
    const activePartner = localStorage.getItem("partner_profile");
    if (activePartner) {
      router.push("/partner/portal");
    }
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanMobile = mobile.trim().replace(/\s+/g, "");
    const cleanName = name.trim();
    const cleanArea = area.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanMobile || !cleanPassword || !serviceType || !cleanArea) {
      setError("Please fill out all required fields.");
      setLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(cleanMobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      setLoading(false);
      return;
    }

    if (cleanPassword.length < 4) {
      setError("Password must be at least 4 characters.");
      setLoading(false);
      return;
    }

    try {
      // Check if mobile already exists
      const existingQuery = query(
        collection(db, "workers"),
        where("mobile", "==", cleanMobile)
      );
      const existingSnap = await getDocs(existingQuery);

      if (!existingSnap.empty) {
        setError("This mobile number is already registered. Please login instead.");
        setLoading(false);
        return;
      }

      // Create new worker document
      const wDoc = {
        name: cleanName,
        mobile: cleanMobile,
        serviceType: serviceType,
        area: cleanArea,
        experience: parseInt(experience, 10) || 1,
        email: "",
        password: cleanPassword,
        rating: 5.0,
        totalReviews: 0,
        totalAssignedJobs: 0,
        totalAcceptedJobs: 0,
        totalRejectedJobs: 0,
        totalCompletedJobs: 0,
        lastActivity: serverTimestamp(),
        status: "pending" as const,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "workers"), wDoc);

      localStorage.removeItem("partner_profile");
      setSuccess(true);

      // Redirect to login page after brief success message
      setTimeout(() => {
        router.push("/partner/login");
      }, 4000);
    } catch (err: any) {
      console.error("Partner registration error:", err);
      setError("Registration failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-6 py-12 selection:bg-primary/20">
      <div className="w-full max-w-md space-y-8 bg-card border border-border/80 p-8 rounded-3xl shadow-xl">
        
        {/* Branding header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Partner Registration</h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Register as a service partner to receive job leads directly on your portal.
          </p>
        </div>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex flex-col gap-2 text-sm font-bold animate-in fade-in">
            <span>🎉 Registration submitted successfully!</span>
            <span className="text-xs font-normal text-muted-foreground">Your profile is pending administrator verification. Once approved, you can login with your mobile number. Redirecting to login page...</span>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {!success && (
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div className="space-y-4">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full pl-11 pr-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm focus:bg-background transition-all"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80">Mobile Number *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    className="w-full pl-11 pr-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm focus:bg-background transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80">Create Password *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    minLength={4}
                    className="w-full pl-11 pr-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm focus:bg-background transition-all"
                  />
                </div>
              </div>

              {/* Service Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80">Service Type *</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    required
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm focus:bg-background transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select your service...</option>
                    {servicesList.map(srv => (
                      <option key={srv.id} value={srv.id}>{srv.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80">Service Area *</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Ranchi, Patna, Delhi"
                    className="w-full pl-11 pr-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm focus:bg-background transition-all"
                  />
                </div>
              </div>

              {/* Experience */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80">Experience (Years)</label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 3"
                    min={0}
                    max={50}
                    className="w-full pl-11 pr-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm focus:bg-background transition-all"
                  />
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-sm rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer btn-press border-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register & Start</span>
              )}
            </button>
          </form>
        )}

        <div className="text-center space-y-3 pt-2">
          <Link 
            href="/partner/login" 
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline transition-colors"
          >
            Already registered? Login Here
          </Link>
          <div>
            <Link href="/" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
              Return to Customer Website
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
