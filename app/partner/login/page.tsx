"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Lock, Phone, ShieldAlert, KeyRound, UserPlus } from "lucide-react";
import { hashPassword } from "@/lib/utils";

export default function PartnerLoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanMobile = mobile.trim().replace(/\s+/g, "");

    if (!cleanMobile || !password.trim()) {
      setError("Please fill out all fields.");
      setLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(cleanMobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      setLoading(false);
      return;
    }

    const lockoutKey = `lockout_until_${cleanMobile}`;
    const failedAttemptsKey = `failed_attempts_${cleanMobile}`;

    const lockoutTime = localStorage.getItem(lockoutKey);
    if (lockoutTime && Date.now() < parseInt(lockoutTime, 10)) {
      const remainingMin = Math.ceil((parseInt(lockoutTime, 10) - Date.now()) / 60000);
      setError(`Too many failed login attempts. Account temporarily locked. Try again in ${remainingMin} minute(s).`);
      setLoading(false);
      return;
    }

    try {
      const hashedPassword = await hashPassword(password);
      const q = query(
        collection(db, "workers"),
        where("mobile", "==", cleanMobile),
        where("password", "==", hashedPassword)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        const attempts = parseInt(localStorage.getItem(failedAttemptsKey) || "0", 10) + 1;
        localStorage.setItem(failedAttemptsKey, String(attempts));

        if (attempts >= 5) {
          localStorage.setItem(lockoutKey, String(Date.now() + 5 * 60 * 1000));
          localStorage.removeItem(failedAttemptsKey);
          setError("Account locked due to 5 consecutive failed login attempts. Please try again after 5 minutes.");
        } else {
          setError(`Invalid mobile number or password. Failed attempts: ${attempts}/5.`);
        }
        setLoading(false);
        return;
      }

      localStorage.removeItem(failedAttemptsKey);
      localStorage.removeItem(lockoutKey);

      // Partner authenticated successfully
      const partnerDoc = querySnapshot.docs[0];
      const partnerData = partnerDoc.data();

      if (partnerData.status === "pending") {
        setError("Your registration is pending administrator approval. Please wait for verification.");
        setLoading(false);
        return;
      }

      if (partnerData.status !== "active") {
        setError("Your partner profile is suspended or inactive. Contact administrator.");
        setLoading(false);
        return;
      }

      const profilePayload = {
        id: partnerDoc.id,
        name: partnerData.name,
        mobile: partnerData.mobile,
        email: partnerData.email,
        serviceType: partnerData.serviceType,
        area: partnerData.area,
      };

      localStorage.setItem("partner_profile", JSON.stringify(profilePayload));
      router.push("/partner/portal");
    } catch (err: any) {
      console.error("Partner authentication error:", err);
      setError("Authentication failed. Please verify connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-6 py-12 selection:bg-primary/20">
      <div className="w-full max-w-md space-y-8 bg-card border border-border/80 p-8 rounded-3xl shadow-xl">
        
        {/* Branding header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Partner Portal</h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Enter your registered mobile number and password to access dispatch jobs.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground/80">Mobile Number</label>
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground/80">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm focus:bg-background transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/95 shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer btn-press"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Partner Login</span>
            )}
          </button>
        </form>

        <div className="text-center space-y-3 pt-2">
          <Link 
            href="/partner/register" 
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            New Partner? Register Here
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
