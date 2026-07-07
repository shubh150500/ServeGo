"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  runTransaction, 
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { 
  Phone, 
  CheckCircle, 
  MapPin, 
  LogOut, 
  Activity, 
  Image as ImageIcon,
  MessageSquare,
  AlertTriangle,
  Upload,
  AlertOctagon,
  Clock,
  Star,
  Trophy,
  Award,
  TrendingUp,
  Sparkles,
  Medal,
  ShieldCheck
} from "lucide-react";

// List of supported services mapping
const SERVICES_MAP: Record<string, string> = {
  ac: "AC Repair & Service",
  geyser: "Geyser Service & Install",
  ro: "RO Water Purifier Service",
  washing: "Washing Machine Repair",
  refrigerator: "Refrigerator Repair",
  plumbing: "Plumbing Services",
  electrical: "Electrical Services",
  painting: "Professional Painting",
  cleaning: "Full Home Cleaning",
  appliance: "Home Appliances Repair",
  carpentry: "Carpentry Works",
  gardening: "Gardening & Landscaping",
  beauty: "Salon & Beauty at Home",
  pest: "Pest Control Services"
};

const getLiveServiceId = (staticId: string): string => {
  const mapping: Record<string, string> = {
    "ac-repair": "ac",
    "ro-repair": "ro",
    "plumber": "plumbing",
    "electrician": "electrical",
    "carpenter": "carpentry",
    "pest-control": "pest"
  };
  return mapping[staticId] || staticId;
};

const getPartnerJobLabel = (serviceType: string): string => {
  const liveId = getLiveServiceId(serviceType);
  return SERVICES_MAP[liveId] || SERVICES_MAP[serviceType] || serviceType;
};

const compressImageToBase64 = (file: File, maxWidth = 600, maxHeight = 600, quality = 0.5): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function PartnerPortalPage() {
  const router = useRouter();
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Real-time states
  const [availableLeads, setAvailableLeads] = useState<any[]>([]);
  const [activeLead, setActiveLead] = useState<any>(null);
  const [partnerDetails, setPartnerDetails] = useState<any>(null);

  // Dev diagnostic states
  const [debugInfo, setDebugInfo] = useState<any>({
    activeCount: 0,
    availableCount: 0,
    error: ""
  });

  // Complete job modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  // Notification alert state
  const [newLeadAlert, setNewLeadAlert] = useState<any>(null);
  
  // PWA Installation Hook States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Track already notified lead IDs to avoid repeated triggers on update
  const notifiedLeads = useRef<Set<string>>(new Set());

  // Setup PWA install elements
  useEffect(() => {
    // Register PWA Service Worker and Manifest dynamically
    if (typeof window !== "undefined") {
      // Inject manifest link
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
        navigator.serviceWorker.register("/partner-sw.js").then(
          (reg) => console.log("SW Registered with scope:", reg.scope),
          (err) => console.warn("SW registration failed:", err)
        );
      }

      const checkStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
      setIsStandalone(checkStandalone);

      const handlePrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        if (!checkStandalone) {
          setShowInstallPrompt(true);
        }
      };

      window.addEventListener("beforeinstallprompt", handlePrompt);
      return () => {
        window.removeEventListener("beforeinstallprompt", handlePrompt);
      };
    }
  }, []);

  useEffect(() => {
    // Load Profile
    const profile = localStorage.getItem("partner_profile");
    if (!profile) {
      router.push("/partner/login");
    } else {
      setPartner(JSON.parse(profile));
    }
    setLoading(false);
  }, []);

  // Setup Push Notification Subscription
  useEffect(() => {
    if (!partner?.id) return;

    const setupPushSubscription = async () => {
      try {
        if ("serviceWorker" in navigator && "PushManager" in window) {
          const reg = await navigator.serviceWorker.ready;
          
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            console.warn("Notification permission denied by partner.");
            return;
          }

          let sub = await reg.pushManager.getSubscription();

          const urlBase64ToUint8Array = (base64String: string) => {
            const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
            const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
              outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
          };

          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!vapidPublicKey) {
            console.warn("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not defined in env.");
            return;
          }

          const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

          if (!sub) {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedKey,
            });
          }

          const subscriptionJson = JSON.parse(JSON.stringify(sub));
          
          const workerRef = doc(db, "workers", partner.id);
          await updateDoc(workerRef, {
            pushSubscription: subscriptionJson,
            lastActivity: serverTimestamp(),
          });
          
          console.log("Web Push subscription registered successfully!");
        }
      } catch (pushErr) {
        console.error("Error setting up Web Push subscription:", pushErr);
      }
    };

    setupPushSubscription();
  }, [partner]);

  // Subscribe to Partner Real-time details
  useEffect(() => {
    if (!partner?.id) return;
    const unsubPartner = onSnapshot(doc(db, "workers", partner.id), (docSnap) => {
      if (docSnap.exists()) {
        setPartnerDetails(docSnap.data());
      }
    }, (err) => console.error("Partner details subscription failed:", err));
    return () => unsubPartner();
  }, [partner]);

  // Setup Real-time Firestore Listeners
  useEffect(() => {
    if (!partner?.id || !partner?.serviceType) return;

    // 1. Listen for Active Accepted Job
    const activeQuery = query(
      collection(db, "bookings"),
      where("assignedWorkerId", "==", partner.id),
      where("status", "in", ["ACCEPTED", "ASSIGNED"])
    );

    const unsubActive = onSnapshot(activeQuery, (snapshot) => {
      setDebugInfo((prev: any) => ({ ...prev, activeCount: snapshot.size }));
      if (!snapshot.empty) {
        // Load the single active job
        const docSnap = snapshot.docs[0];
        setActiveLead({ id: docSnap.id, ...docSnap.data() });
      } else {
        setActiveLead(null);
      }
    }, (err) => {
      console.error("Active Query error:", err);
      setDebugInfo((prev: any) => ({ ...prev, error: "Active Query Error: " + err.message }));
    });

    // 2. Listen for Available NEW Leads in their Service Category
    const serviceTypes = Array.from(new Set([
      partner.serviceType,
      getLiveServiceId(partner.serviceType)
    ]));

    const availableQuery = query(
      collection(db, "bookings"),
      where("status", "==", "NEW"),
      where("serviceType", "in", serviceTypes)
    );

    const unsubAvailable = onSnapshot(availableQuery, (snapshot) => {
      setDebugInfo((prev: any) => ({ ...prev, availableCount: snapshot.size }));
      const list: any[] = [];
      let triggerAlert = false;
      let newestLead: any = null;

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const item = { id: docSnap.id, ...data };
        list.push(item);

        // Check if we should notify for this new lead
        if (!notifiedLeads.current.has(docSnap.id)) {
          notifiedLeads.current.add(docSnap.id);
          newestLead = item;
          triggerAlert = true;
        }
      });

      setAvailableLeads(list);

      // Trigger alerts only if a new lead is detected
      if (triggerAlert && newestLead) {
        playAlertSound(newestLead);
        triggerVibrate();
        triggerBrowserNotification(newestLead);
        setNewLeadAlert(newestLead);
      }
    }, (err) => {
      console.error("Available Query error:", err);
      setDebugInfo((prev: any) => ({ ...prev, error: "Available Query Error: " + err.message }));
    });

    return () => {
      unsubActive();
      unsubAvailable();
    };
  }, [partner]);

  // Audio & Speech Voice Alert (Zero static assets required, maximum volume)
  const playAlertSound = (lead?: any) => {
    // 1. Speech synthesis - shouts "New Order! New Order!" and reads details
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel(); // Reset queue
        const serviceName = SERVICES_MAP[lead?.serviceType] || "service job";
        const customerArea = lead?.customerArea || "your area";
        const text = `New Order! New Order! You have a new ${serviceName} booking in ${customerArea}. Please open the app and accept now!`;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = 1.0; // Max volume
        utterance.rate = 1.15;  // Fast and urgent
        utterance.pitch = 1.05; // Slightly high pitch to attract attention
        
        // Select an English voice
        const voices = window.speechSynthesis.getVoices();
        const targetVoice = voices.find(v => v.lang.startsWith("en-") || v.lang.startsWith("hi-"));
        if (targetVoice) utterance.voice = targetVoice;
        
        window.speechSynthesis.speak(utterance);
      } catch (speechErr) {
        console.warn("Speech synthesis was blocked or failed:", speechErr);
      }
    }

    // 2. Fallback high-volume sawtooth synthesizer beep
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth"; // Sharper, louder buzzer-like waveform
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.8, ctx.currentTime + start); // Extremely loud gain
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Play 3 loud alarm cycle siren buzzes
      for (let i = 0; i < 3; i++) {
        playTone(950, i * 0.5, 0.2);
        playTone(1300, i * 0.5 + 0.2, 0.25);
      }
    } catch (err) {
      console.warn("Audio Context alert failed to play:", err);
    }
  };

  // Intense repeating vibration pattern
  const triggerVibrate = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      // Long vibration cycles to draw physical alert
      navigator.vibrate([1000, 300, 1000, 300, 1000, 300, 1000]);
    }
  };

  // Browser system push notification with Service Worker compatibility for mobile Chrome
  const triggerBrowserNotification = (lead: any) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        const title = `🚨 NEW ${SERVICES_MAP[lead.serviceType]?.toUpperCase() || "SERVICE"} DISPATCH!`;
        const options = {
          body: `Area: ${lead.customerArea}\nWork Description: ${lead.description || "General Repair Work"}\nTap here to accept now!`,
          icon: "/logo.png",
          badge: "/logo.png",
          tag: lead.id,
          vibrate: [1000, 300, 1000, 300, 1000],
          requireInteraction: true
        };

        // Mobile Chrome requires serviceWorker.ready to display native push notifications
        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, options);
          }).catch(swErr => {
            console.warn("SW push fallback triggered:", swErr);
            new Notification(title, options);
          });
        } else {
          new Notification(title, options);
        }
      }
    }
  };

  // Firestore transaction accept handler
  const handleAcceptJob = async (leadId: string) => {
    if (!partner) return;
    if (activeLead) {
      alert("You already have an active job. Please complete your current job before accepting a new one!");
      return;
    }
    setErrorMsg("");

    try {
      const leadRef = doc(db, "bookings", leadId);
      const partnerRef = doc(db, "workers", partner.id);

      await runTransaction(db, async (transaction) => {
        // 1. Execute all reads first
        const leadSnap = await transaction.get(leadRef);
        const partnerSnap = await transaction.get(partnerRef);

        if (!leadSnap.exists()) {
          throw new Error("This booking request no longer exists.");
        }

        const data = leadSnap.data();
        if (data.status !== "NEW") {
          throw new Error("This job has already been accepted by another partner.");
        }

        // 2. Execute all writes/updates after
        transaction.update(leadRef, {
          status: "ACCEPTED",
          assignedWorkerId: partner.id,
          assignedWorkerName: partner.name,
          updatedAt: serverTimestamp(),
        });

        const currentAccepted = partnerSnap.exists() ? (partnerSnap.data()?.totalAcceptedJobs || 0) : 0;
        transaction.update(partnerRef, {
          totalAcceptedJobs: currentAccepted + 1,
          lastActivity: serverTimestamp(),
        });
      });

      setNewLeadAlert(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to accept booking.");
    }
  };

  // Reject/Dismiss alert locally
  const handleRejectJob = () => {
    setNewLeadAlert(null);
  };

  // Photo submission & job completion handler
  const handleCompleteJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!photoFile) {
      setErrorMsg("Please upload/take at least one completion photo as proof.");
      return;
    }

    setUploading(true);
    setUploadStep("Compressing image...");

    try {
      // 1. Compress image directly to a light base64 Data URL (~30KB)
      const base64Data = await compressImageToBase64(photoFile);
      
      setUploadStep("Saving status in database...");
      const photoUrl = base64Data;

      // 2. Perform Transaction to update job status to COMPLETED
      const leadRef = doc(db, "bookings", activeLead.id);
      const partnerRef = doc(db, "workers", partner.id);

      await runTransaction(db, async (transaction) => {
        // 1. Execute all reads first
        const leadSnap = await transaction.get(leadRef);
        const partnerSnap = await transaction.get(partnerRef);

        if (!leadSnap.exists()) throw new Error("Booking does not exist.");

        // 2. Execute all writes/updates after
        transaction.update(leadRef, {
          status: "COMPLETED",
          completionPhoto: photoUrl,
          completionPhotoUrl: photoUrl, // Set completionPhotoUrl to match admin dashboard expectations
          completionRemarks: remarks.trim(),
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const currentCompleted = partnerSnap.exists() ? (partnerSnap.data()?.totalCompletedJobs || 0) : 0;
        transaction.update(partnerRef, {
          totalCompletedJobs: currentCompleted + 1,
          lastActivity: serverTimestamp(),
        });
      });

      // Clear Modal states and active lead locally
      setShowCompleteModal(false);
      setRemarks("");
      setPhotoFile(null);
      setActiveLead(null);
    } catch (err: any) {
      console.error("Job completion write error:", err);
      setErrorMsg(err.message || "Error finalizing job. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Logout utility
  const handleLogout = () => {
    localStorage.removeItem("partner_profile");
    router.push("/partner/login");
  };

  if (loading || !partner) {
    return (
      <div className="min-h-screen bg-[#1C1816] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
    return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-indigo-100">
      
      {/* Top Standalone PWA bar */}
      <header className="px-5 py-4 border-b border-slate-200/80 flex justify-between items-center bg-white sticky top-0 z-30 shadow-sm shadow-slate-100/50">
        <div className="flex items-center gap-3">
          {/* Profile Photo */}
          {partnerDetails?.imageUrl ? (
            <img 
              src={partnerDetails.imageUrl} 
              alt={partner.name} 
              className="w-10 h-10 rounded-full border border-slate-200 object-cover bg-slate-50" 
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-black">
              {partner.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-sm font-black tracking-tight text-slate-900">{partner.name}</h1>
            </div>
            <p className="text-[10px] text-indigo-600 uppercase tracking-widest mt-0.5 font-black">
              {getPartnerJobLabel(partner.serviceType)}
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main UI body */}
      <main className="flex-1 flex flex-col p-5 max-w-xl mx-auto w-full space-y-6">
        
        {/* Partner Metrics Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Metric 1: Completed Jobs */}
          <div className="bg-white border border-slate-100 p-4.5 rounded-3xl flex flex-col justify-between shadow-md shadow-slate-100/50 min-h-[110px] transition-all hover:shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Completed Work</span>
              <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl font-black text-emerald-600">{partnerDetails?.totalCompletedJobs || 0}</p>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Jobs finished</span>
            </div>
          </div>

          {/* Metric 2: Quality Rating */}
          <div className="bg-white border border-slate-100 p-4.5 rounded-3xl flex flex-col justify-between shadow-md shadow-slate-100/50 min-h-[110px] transition-all hover:shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Quality Rating</span>
              <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0 animate-pulse">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl font-black text-amber-600">{partnerDetails?.rating?.toFixed(1) || "5.0"} ★</p>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{partnerDetails?.totalReviews || 0} reviews</span>
            </div>
          </div>
        </div>

        {/* Active Job State */}
        {activeLead ? (
          <div className="bg-white border border-slate-100 p-6 rounded-3xl space-y-6 shadow-xl shadow-slate-100/80 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-black bg-indigo-600 text-white px-3 py-1 rounded-full uppercase tracking-wider">
                Active Booking
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1 font-bold">
                <Clock className="w-3.5 h-3.5" /> ID: {activeLead.id}
              </span>
            </div>

            {/* Customer Details Display */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Customer Name</span>
                <p className="text-lg font-bold text-slate-800">{activeLead.customerName}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Location / Address</span>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{activeLead.customerAddress}</p>
                <span className="text-xs font-black text-indigo-600 mt-1 block">Sector Area: {activeLead.customerArea}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Job Requirements</span>
                <p className="text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-600 italic leading-relaxed">
                  {activeLead.description}
                </p>
              </div>
            </div>

            {/* Premium action coordinates */}
            <div className="grid grid-cols-1 gap-3.5 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${activeLead.customerMobile}`}
                  className="py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg hover:shadow-indigo-600/30 flex items-center justify-center gap-2.5 btn-press text-center cursor-pointer transition-all border-none"
                >
                  <Phone className="w-4 h-4" /> Call Customer
                </a>

                <a
                  href={`https://wa.me/${activeLead.customerMobile.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    `Hello ${activeLead.customerName}! I am your ServeGo partner ${partner.name} assigned to your service request. I'm on my way to coordinate.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2.5 btn-press text-center cursor-pointer transition-all border-none"
                >
                  <MessageSquare className="w-4 h-4" /> WhatsApp
                </a>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  activeLead.customerAddress + ", " + activeLead.customerArea
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-4 border border-slate-200 hover:bg-slate-55 text-slate-700 font-black text-sm rounded-2xl flex items-center justify-center gap-2.5 btn-press text-center cursor-pointer transition-all bg-white"
              >
                <MapPin className="w-4 h-4 text-indigo-600" /> Open Location Map
              </a>
            </div>

            {/* Complete action */}
            <button
              onClick={() => setShowCompleteModal(true)}
              className="w-full py-4.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-base rounded-2xl shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer mt-6 border-none"
            >
              <CheckCircle className="w-5 h-5" /> Complete Job & Submit
            </button>

          </div>
        ) : (
          /* Waiting Screen State */
          <div className="flex-1 flex flex-col justify-center items-center py-16 text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 relative z-10">
                <Activity className="w-12 h-12 animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full bg-indigo-100/50 animate-ping duration-1000 scale-125" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800">Waiting for New Jobs...</h2>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Stay on this screen to instantly receive and accept new {getPartnerJobLabel(partner.serviceType)} bookings. Keep volume up for audio alerts.
              </p>
            </div>

            {/* Mini List of current available leads if any (without full details, just overview to accept) */}
            {availableLeads.length > 0 && (
              <div className="w-full max-w-md pt-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">
                  Available Job Pickups ({availableLeads.length})
                </h3>
                {availableLeads.map((lead) => (
                  <div 
                    key={lead.id} 
                    className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col text-left gap-3.5 shadow-md shadow-slate-100/40"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                          {getPartnerJobLabel(lead.serviceType)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">{lead.bookingDate || "Today"}</span>
                      </div>
                      <h4 className="font-bold text-sm mt-1 text-slate-800">Sector Area: {lead.customerArea}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{lead.description}</p>
                    </div>

                    <button
                      onClick={() => handleAcceptJob(lead.id)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md btn-press cursor-pointer transition-all border-none"
                    >
                      Accept Booking
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- ServeGo Performance & Rewards System (Private View) --- */}
        {(() => {
          // ServeScore internal calculation hidden from workers
          const rating = partnerDetails?.rating || 5.0;
          const completedJobs = partnerDetails?.totalCompletedJobs || 0;
          const accepted = partnerDetails?.totalAcceptedJobs || 0;
          const rejected = partnerDetails?.totalRejectedJobs || 0;
          const assigned = partnerDetails?.totalAssignedJobs || 0;
          
          const acceptanceRate = assigned > 0 ? (accepted / assigned) * 100 : 100;
          const complaints = partnerDetails?.complaintCount || 0;
          const warnings = partnerDetails?.warningCount || 0;

          // Backend algorithmic logic executed client-side for private display representation
          const computedScore = Math.min(1000, Math.max(0, Math.round(
            (rating * 100) + 
            (completedJobs * 10) + 
            (acceptanceRate * 2) - 
            (complaints * 50) - 
            (warnings * 100)
          )));

          // Badge System calculations and styles
          let badge = "Bronze";
          let nextBadge = "Silver";
          let badgeThreshold = 300;
          let prevThreshold = 0;

          let badgeStyles = {
            bg: "bg-gradient-to-br from-amber-500 to-orange-700 text-white",
            text: "text-amber-600",
            label: "Bronze Quality Tier",
            iconColor: "text-orange-200",
            progressColor: "bg-orange-500"
          };

          if (computedScore <= 300) {
            badge = "Bronze";
            nextBadge = "Silver";
            badgeThreshold = 300;
            prevThreshold = 0;
            badgeStyles = {
              bg: "bg-gradient-to-br from-amber-600 to-amber-800 text-white",
              text: "text-amber-700",
              label: "Bronze Quality Tier",
              iconColor: "text-amber-300",
              progressColor: "bg-amber-500"
            };
          } else if (computedScore <= 600) {
            badge = "Silver";
            nextBadge = "Gold";
            badgeThreshold = 600;
            prevThreshold = 300;
            badgeStyles = {
              bg: "bg-gradient-to-br from-slate-400 via-slate-350 to-slate-600 text-white shadow-lg shadow-slate-100",
              text: "text-slate-600",
              label: "Silver Quality Tier",
              iconColor: "text-slate-200",
              progressColor: "bg-slate-400"
            };
          } else if (computedScore <= 800) {
            badge = "Gold";
            nextBadge = "Elite";
            badgeThreshold = 800;
            prevThreshold = 600;
            badgeStyles = {
              bg: "bg-gradient-to-br from-yellow-400 via-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-100 border border-amber-300",
              text: "text-amber-600",
              label: "Luxurious Gold Tier",
              iconColor: "text-amber-800",
              progressColor: "bg-amber-600"
            };
          } else if (computedScore <= 950) {
            badge = "Elite";
            nextBadge = "Legend";
            badgeThreshold = 950;
            prevThreshold = 800;
            badgeStyles = {
              bg: "bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-100 border border-indigo-400",
              text: "text-indigo-600",
              label: "Elite Platinum Tier",
              iconColor: "text-indigo-200",
              progressColor: "bg-indigo-500"
            };
          } else {
            badge = "Legend";
            nextBadge = "Maxed";
            badgeThreshold = 1000;
            prevThreshold = 950;
            badgeStyles = {
              bg: "bg-gradient-to-br from-fuchsia-600 via-violet-600 to-indigo-700 text-white shadow-2xl shadow-fuchsia-100 border border-fuchsia-500",
              text: "text-fuchsia-600",
              label: "Legendary Cosmic Tier",
              iconColor: "text-yellow-300 animate-bounce",
              progressColor: "bg-fuchsia-500"
            };
          }

          const pointsRemaining = Math.max(0, badgeThreshold - computedScore);
          const badgeProgress = Math.min(100, Math.max(0, ((computedScore - prevThreshold) / (badgeThreshold - prevThreshold)) * 100));

          // Mock rank mapping for private view (without leaking actual numbers or leaderboard list)
          const rank = partnerDetails?.rank || 3;
          const performanceScore = Math.round(acceptanceRate * 0.4 + (rating / 5) * 60);

          // Top 5 Eligibility Identification
          const isEligible = rank <= 5 && partnerDetails?.status === "active";

          return (
            <div className="bg-white border border-slate-100 rounded-3xl p-5 space-y-5 shadow-xl shadow-slate-100/50 mt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-indigo-600" /> Performance Dashboard
                </h3>
                <span className="text-[10px] uppercase font-black tracking-widest bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full">
                  Account Summary
                </span>
              </div>

              {/* Reward Eligibility banner */}
              {isEligible ? (
                <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 animate-spin" style={{ animationDuration: "3s" }} />
                  <p className="text-xs font-bold text-emerald-700 leading-tight">
                    Congratulations! You are eligible for this month's Top Performer Reward.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex items-center gap-2.5">
                  <TrendingUp className="w-5 h-5 text-slate-400 shrink-0" />
                  <p className="text-xs font-bold text-slate-500 leading-tight">
                    Keep improving your stats to reach Top 5.
                  </p>
                </div>
              )}

              {/* Two Column stats block */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 border border-slate-100/80 rounded-2xl flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Overall Rank</span>
                  <div className="mt-2.5 flex items-baseline gap-1">
                    <p className="text-2xl font-black text-indigo-600">#{rank}</p>
                    <span className="text-[8px] text-slate-400 uppercase font-black">Aurangabad</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-100/80 rounded-2xl flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">ServeScore</span>
                  <div className="mt-2.5 flex items-baseline gap-1">
                    <p className="text-2xl font-black text-emerald-600">{computedScore}</p>
                    <span className="text-[8px] text-slate-400 uppercase font-black">Points</span>
                  </div>
                </div>
              </div>

              {/* Progress to next badge (Premium card display) */}
              <div className="space-y-3.5 pt-1">
                
                {/* Visual Badge Card */}
                <div className={`p-5 rounded-2xl ${badgeStyles.bg} flex flex-col justify-between relative overflow-hidden shadow-md`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-80 block">Active Status Badge</span>
                      <h4 className="text-xl font-black tracking-tight mt-1">{badgeStyles.label}</h4>
                    </div>
                    <Award className={`w-8 h-8 ${badgeStyles.iconColor} shrink-0`} />
                  </div>
                  
                  {nextBadge !== "Maxed" && (
                    <div className="mt-4.5 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold opacity-90">
                        <span>Progress to {nextBadge}</span>
                        <span>{Math.round(badgeProgress)}%</span>
                      </div>
                      <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-white h-full rounded-full transition-all duration-500"
                          style={{ width: `${badgeProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {nextBadge !== "Maxed" ? (
                  <p className="text-[10px] text-slate-500 italic font-semibold">
                    Only <strong className="text-slate-800">{pointsRemaining}</strong> points remaining to unlock next badge.
                  </p>
                ) : (
                  <p className="text-[10px] text-emerald-600 italic font-semibold flex items-center gap-1 bg-emerald-50 p-2.5 rounded-xl">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Legendary status unlocked! Keep up the outstanding service.
                  </p>
                )}
              </div>

              {/* Achievement History */}
              <div className="border-t border-slate-100 pt-3.5 space-y-2.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Achievement History</span>
                <div className="grid grid-cols-2 gap-3.5 text-[10px] font-semibold">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span>Hall of Fame: <strong className="text-slate-900">{partnerDetails?.achievementHistory?.hallOfFameAppearances || 0}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Medal className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Top 5 Finishes: <strong className="text-slate-900">{partnerDetails?.achievementHistory?.top5Finishes || 0}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    <span>Best Score: <strong className="text-slate-900">{partnerDetails?.achievementHistory?.bestMonthlyPerformance || `${computedScore} Pts`}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                    <span>Highest Rank: <strong className="text-slate-900">#{partnerDetails?.achievementHistory?.highestRankAchieved || rank}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      </main>

      {/* Floating Critical Alert Dialog for incoming jobs */}
      {newLeadAlert && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-6 z-50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white border border-slate-100 p-6.5 rounded-3xl w-full max-w-md space-y-6 shadow-2xl animate-in zoom-in-95 text-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 animate-bounce">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-indigo-600 uppercase tracking-wide">Incoming Dispatch Alert</h3>
                <p className="text-[10px] text-slate-400 font-bold">Action required immediately</p>
              </div>
            </div>

            <div className="space-y-3.5 text-sm">
              <p className="text-slate-600"><strong>Job Class:</strong> <span className="text-slate-900 font-bold">{getPartnerJobLabel(newLeadAlert.serviceType)}</span></p>
              <p className="text-slate-600"><strong>Work Area:</strong> <span className="text-slate-900 font-bold">{newLeadAlert.customerArea}</span></p>
              <p className="text-xs text-slate-600 italic bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                "{newLeadAlert.description || 'No specific requirements details.'}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleRejectJob}
                className="py-3 border border-slate-200 hover:bg-slate-55 text-slate-500 font-bold text-xs rounded-xl cursor-pointer btn-press bg-white"
              >
                Dismiss / Pass
              </button>
              <button
                onClick={() => handleAcceptJob(newLeadAlert.id)}
                className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1 cursor-pointer btn-press border-none animate-pulse"
              >
                Accept Lead Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Completion Modal Form */}
      {showCompleteModal && activeLead && (
        <div className="fixed inset-0 bg-slate-900/85 flex items-center justify-center p-6 z-50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-100 p-6 rounded-3xl w-full max-w-md space-y-6 shadow-2xl text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900">
                <CheckCircle className="w-5 h-5 text-emerald-500" /> Complete Lead Work
              </h3>
              <button 
                onClick={() => setShowCompleteModal(false)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCompleteJobSubmit} className="space-y-5">
              
              {/* Photo upload field */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase block">Upload Completion Photo *</label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6.5 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors flex flex-col items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setPhotoFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {photoFile ? (
                    <div className="space-y-2 text-emerald-600">
                      <ImageIcon className="w-8 h-8 mx-auto" />
                      <p className="text-xs font-bold line-clamp-1">{photoFile.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-slate-400">
                      <Upload className="w-8 h-8 mx-auto text-indigo-600 animate-bounce" />
                      <p className="text-xs font-semibold text-slate-600">Tap to snap or upload proof photo</p>
                      <p className="text-[10px]">JPEG, PNG (Required)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Remarks/Feedback */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase block">Work Remarks (Optional)</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Cleared leakage, resolved AC line issue successfully."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-800 h-24 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer btn-press border-none"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{uploadStep || "Uploading..."}</span>
                  </>
                ) : (
                  <span>Submit Proof & Complete</span>
                )}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* PWA Install Promotion Modal Overlay */}
      {showInstallPrompt && !isStandalone && (
        <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center p-6 z-55 backdrop-blur-md animate-in fade-in">
          <div className="bg-white border border-slate-100 p-8 rounded-3xl w-full max-w-md text-center space-y-6 shadow-2xl text-slate-800">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto">
              <Upload className="w-10 h-10 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-black text-2xl text-slate-900">Install Partner App</h3>
              <p className="text-xs text-slate-500 leading-relaxed px-2">
                This portal requires installation to run on your home screen. Installing enables standalone view, fast startup, custom vibration codes, and audio ring alerts.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={async () => {
                  if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === "accepted") {
                      setShowInstallPrompt(false);
                      setDeferredPrompt(null);
                      setIsStandalone(true);
                    }
                  } else {
                    alert("Click the three dots in your mobile browser and select 'Add to Home screen' or 'Install App' to install.");
                  }
                }}
                className="w-full py-4 bg-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg hover:shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer btn-press border-none"
              >
                Install App Now
              </button>
              
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-2xl text-slate-400 cursor-pointer transition-colors bg-white"
              >
                Continue in Browser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="mt-auto p-6 bg-slate-100/80 border-t border-slate-200 text-[10px] text-slate-400 font-bold tracking-widest w-full text-center uppercase">
        <p>© 2026 ServeGo. All Rights Reserved. Partner Portal.</p>
        {debugInfo.error && <p className="text-rose-600 font-bold font-mono mt-1">Error: {debugInfo.error}</p>}
      </footer>

    </div>
  );
}
