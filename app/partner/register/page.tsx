"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Lock, Phone, ShieldAlert, UserPlus, User, Briefcase, MapPin, CalendarDays, Camera } from "lucide-react";
import { SERVICES_LIST } from "@/lib/services";
import { compressProfilePhoto } from "@/lib/imageCompressor";

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
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Aadhaar upload states
  const [aadhaarUrl, setAadhaarUrl] = useState("");
  const [aadhaarError, setAadhaarError] = useState("");
  const [uploadingAadhaar, setUploadingAadhaar] = useState(false);

  // Agreement checkbox state
  const [agreementAccepted, setAgreementAccepted] = useState(false);

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError("");
    setUploadingImage(true);
    try {
      const compressed = await compressProfilePhoto(file);
      setImageUrl(compressed);
    } catch (err) {
      console.error("Compression error:", err);
      setImageError("Failed to compress profile photo. Try another image.");
      setImageUrl("");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAadhaarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAadhaarError("");
    setUploadingAadhaar(true);
    try {
      const compressed = await compressProfilePhoto(file);
      setAadhaarUrl(compressed);
    } catch (err) {
      console.error("Aadhaar compression error:", err);
      setAadhaarError("Failed to compress Aadhaar photo. Try another image.");
      setAadhaarUrl("");
    } finally {
      setUploadingAadhaar(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanMobile = mobile.trim().replace(/\s+/g, "");
    const cleanName = name.trim();
    const cleanArea = area.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!imageUrl) {
      setError("Please upload your selfie profile photo.");
      setLoading(false);
      return;
    }

    if (!aadhaarUrl) {
      setError("Please upload your Aadhaar Card photo.");
      setLoading(false);
      return;
    }

    if (!agreementAccepted) {
      setError("Please read and agree to the Worker Agreement, Community Guidelines, and Privacy Policy.");
      setLoading(false);
      return;
    }

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
        imageUrl: imageUrl,
        aadhaarUrl: aadhaarUrl,
        rating: 5.0,
        totalReviews: 0,
        totalAssignedJobs: 0,
        totalAcceptedJobs: 0,
        totalRejectedJobs: 0,
        totalCompletedJobs: 0,
        agreementAccepted: true,
        agreementVersion: "v1.0",
        agreementAcceptedTimestamp: serverTimestamp(),
        lastActivity: serverTimestamp(),
        status: "pending" as const,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "workers"), wDoc);

      // Write worker agreement acceptance log
      await addDoc(collection(db, "worker_agreement_acceptance_logs"), {
        accepted: true,
        timestamp: serverTimestamp(),
        agreementVersion: "v1.0",
        workerMobile: cleanMobile,
        workerId: docRef.id,
        workerName: cleanName
      });

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

        {!success ? (
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
              {/* Selfie (Profile Photo) Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80">Selfie Photo (Profile Image) *</label>
                <div className="flex items-center gap-4">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt="Selfie preview" 
                      className="w-14 h-14 rounded-full border border-border/80 object-cover bg-muted" 
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-muted/40 border border-border/80 flex items-center justify-center text-muted-foreground">
                      <Camera className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      required
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
                    />
                    {uploadingImage && <span className="text-[10px] text-primary animate-pulse font-bold block">Optimizing image...</span>}
                    {imageError && <span className="text-[10px] text-destructive block">{imageError}</span>}
                  </div>
                </div>
              </div>

              {/* Aadhaar Card Photo Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80">Aadhaar Card Photo *</label>
                <div className="flex items-center gap-4">
                  {aadhaarUrl ? (
                    <img 
                      src={aadhaarUrl} 
                      alt="Aadhaar preview" 
                      className="w-14 h-14 rounded-lg border border-border/80 object-cover bg-muted" 
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-muted/40 border border-border/80 flex items-center justify-center text-muted-foreground">
                      <Camera className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      required
                      accept="image/*"
                      onChange={handleAadhaarChange}
                      className="block w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
                    />
                    {uploadingAadhaar && <span className="text-[10px] text-primary animate-pulse font-bold block">Optimizing image...</span>}
                    {aadhaarError && <span className="text-[10px] text-destructive block">{aadhaarError}</span>}
                  </div>
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

            {/* Worker Agreement Checkbox */}
            <div className="flex items-start gap-2.5 bg-muted/30 p-4 border border-border/60 rounded-2xl">
              <input
                id="worker-agreement-checkbox"
                type="checkbox"
                checked={agreementAccepted}
                onChange={(e) => setAgreementAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-500 border-border/80 rounded cursor-pointer"
              />
              <label htmlFor="worker-agreement-checkbox" className="text-xs text-muted-foreground leading-normal select-none">
                I agree to the{" "}
                <Link href="/worker-agreement" target="_blank" className="text-emerald-500 font-bold hover:underline">
                  Worker Agreement
                </Link>,{" "}
                <Link href="/community-guidelines" target="_blank" className="text-emerald-500 font-bold hover:underline">
                  Community Guidelines
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="text-emerald-500 font-bold hover:underline">
                  Privacy Policy
                </Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !agreementAccepted}
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
        ) : null}

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
