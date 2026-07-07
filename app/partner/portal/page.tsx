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

  // Milestone Rewards States
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "bank">("upi");
  
  // Withdrawal Form States
  const [upiId, setUpiId] = useState("");
  const [bankHolderName, setBankHolderName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);

  const [toggles, setToggles] = useState<any>({
    minMilestoneRating: 4.0
  });

  const [pendingComplaints, setPendingComplaints] = useState<any[]>([]);
  const [resolvingComplaint, setResolvingComplaint] = useState("");

  // Subscribe to Config Toggles
  useEffect(() => {
    const unsubToggles = onSnapshot(doc(db, "system_config", "toggles"), (docSnap) => {
      if (docSnap.exists()) {
        setToggles(docSnap.data());
      }
    });
    return () => unsubToggles();
  }, []);

  // Auto-trigger pending review celebration
  useEffect(() => {
    if (!partnerDetails) return;
    const comp = partnerDetails.milestoneCompletedJobs || 0;
    const target = partnerDetails.currentMilestone || 100;
    const rat = partnerDetails.rating || 5.0;
    const status = partnerDetails.milestoneStatus || "in_progress";
    const minRat = toggles?.minMilestoneRating ?? 4.0;

    if (comp >= target && rat >= minRat && status === "in_progress") {
      const ref = doc(db, "workers", partnerDetails.id);
      updateDoc(ref, {
        milestoneStatus: "pending_review",
        milestoneAchievedAt: serverTimestamp()
      }).then(() => {
        setShowCelebrationModal(true);
      });
    }
  }, [partnerDetails?.milestoneCompletedJobs, partnerDetails?.rating, partnerDetails?.milestoneStatus, toggles?.minMilestoneRating]);

  const handleSubmitWithdrawal = async () => {
    if (!partner?.id) return;
    setSubmittingWithdrawal(true);
    try {
      const payload: any = { method: paymentMethod };
      if (paymentMethod === "upi") {
        if (!upiId.trim()) throw new Error("Please enter your UPI ID.");
        payload.upiId = upiId.trim();
      } else {
        if (!bankHolderName.trim() || !bankAccountNumber.trim() || !bankIfsc.trim() || !bankName.trim()) {
          throw new Error("Please fill out all bank account fields.");
        }
        payload.holderName = bankHolderName.trim();
        payload.accountNumber = bankAccountNumber.trim();
        payload.ifsc = bankIfsc.trim();
        payload.bankName = bankName.trim();
      }

      const ref = doc(db, "workers", partner.id);
      await updateDoc(ref, {
        milestoneStatus: "withdrawal_requested",
        milestoneWithdrawalDetails: payload,
        updatedAt: serverTimestamp()
      });
      setShowWithdrawModal(false);
    } catch (err: any) {
      alert(err.message || "Failed to submit withdrawal request.");
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  const handleUnlockNextMilestone = async () => {
    if (!partner?.id || !partnerDetails) return;
    try {
      const ref = doc(db, "workers", partner.id);
      const currentTarget = partnerDetails.currentMilestone || 100;
      const payDetails = partnerDetails.milestonePaymentDetails || {};
      
      const newHistoryItem = {
        milestone: currentTarget,
        unlockedDate: partnerDetails.milestoneAchievedAt || new Date(),
        approvedDate: partnerDetails.milestoneApprovedAt || new Date(),
        paidAt: payDetails.paidAt || new Date(),
        status: "paid"
      };

      const existingHistory = partnerDetails.milestoneHistory || [];
      const updatedHistory = [...existingHistory, newHistoryItem];

      await updateDoc(ref, {
        currentMilestone: currentTarget + 100,
        milestoneCompletedJobs: 0,
        milestoneStatus: "in_progress",
        milestoneHistory: updatedHistory,
        milestoneBonusAmount: null,
        milestoneWithdrawalDetails: null,
        milestonePaymentDetails: null,
        milestoneAchievedAt: null,
        milestoneApprovedAt: null,
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      alert("Error unlocking next milestone: " + err.message);
    }
  };

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

  // Subscribe to pending customer complaints for this worker
  useEffect(() => {
    if (!partner?.id) return;
    const q = query(
      collection(db, "complaints"),
      where("workerId", "==", partner.id),
      where("status", "==", "pending")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPendingComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [partner?.id]);

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

        const pData = partnerSnap.exists() ? partnerSnap.data() : {};
        const currentCompleted = pData?.totalCompletedJobs || 0;
        const currentMilestoneJobs = pData?.milestoneCompletedJobs || 0;
        const currentMilestoneStatus = pData?.milestoneStatus || "in_progress";
        const currentMilestoneTarget = pData?.currentMilestone || 100;
        const currentRating = pData?.rating || 5.0;

        let partnerUpdates: any = {
          totalCompletedJobs: currentCompleted + 1,
          lastActivity: serverTimestamp(),
        };

        if (currentMilestoneStatus === "in_progress") {
          const nextCompletedCount = currentMilestoneJobs + 1;
          partnerUpdates.milestoneCompletedJobs = nextCompletedCount;
          if (nextCompletedCount >= currentMilestoneTarget && currentRating >= 4.0) {
            partnerUpdates.milestoneStatus = "pending_review";
            partnerUpdates.milestoneAchievedAt = serverTimestamp();
          }
        }

        transaction.update(partnerRef, partnerUpdates);
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

  const handleResolveComplaint = async (complaintId: string) => {
    setResolvingComplaint(complaintId);
    try {
      const ref = doc(db, "complaints", complaintId);
      const complaint = pendingComplaints.find(c => c.id === complaintId);
      const createdAt = complaint?.createdAt?.seconds ? complaint.createdAt.seconds * 1000 : Date.now();
      const responseTimeMs = Date.now() - createdAt;
      const responseTimeHours = Math.round(responseTimeMs / (1000 * 60 * 60) * 10) / 10;
      
      await updateDoc(ref, {
        status: "resolved",
        resolvedAt: serverTimestamp(),
        workerResponseTime: `${responseTimeHours} hours`
      });
    } catch (err: any) {
      alert("Failed to resolve: " + err.message);
    } finally {
      setResolvingComplaint("");
    }
  };

  // Logout utility
  const handleLogout = () => {
    localStorage.removeItem("partner_profile");
    router.push("/partner/login");
  };

  if (loading || !partner) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

        {/* Customer Complaints Alert */}
        {pendingComplaints.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 animate-pulse" /> Customer Complaints ({pendingComplaints.length})
            </h3>
            {pendingComplaints.map((complaint) => (
              <div key={complaint.id} className="bg-rose-50 border border-rose-200 p-5 rounded-2xl space-y-4 animate-in fade-in">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-black tracking-widest text-rose-400">Complaint</span>
                    <h4 className="font-black text-sm text-rose-800">{complaint.reason}</h4>
                    <p className="text-[10px] text-rose-600">Booking: {complaint.bookingId?.substring(0, 10)}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[9px] font-black rounded-full uppercase animate-pulse">Pending</span>
                </div>

                {complaint.description && (
                  <p className="text-xs text-rose-700 bg-rose-100/50 p-3 rounded-xl italic">"{complaint.description}"</p>
                )}

                {complaint.photos && complaint.photos.length > 0 && (
                  <div className="flex gap-2">
                    {complaint.photos.map((photo: string, i: number) => (
                      <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border border-rose-200">
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs text-rose-700 space-y-1">
                  <p><strong>Customer:</strong> {complaint.customerName}</p>
                  <p><strong>Mobile:</strong> {complaint.customerMobile}</p>
                  <p><strong>Service:</strong> {complaint.serviceType}</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={`tel:${complaint.customerMobile}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    📞 Call Customer
                  </a>
                  <a
                    href={`https://wa.me/91${complaint.customerMobile}?text=Hi%20${encodeURIComponent(complaint.customerName)},%20I%20am%20contacting%20you%20regarding%20your%20complaint%20on%20ServeGo%20booking%20${complaint.bookingId?.substring(0,8)}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    💬 WhatsApp Customer
                  </a>
                </div>

                <button
                  onClick={() => handleResolveComplaint(complaint.id)}
                  disabled={resolvingComplaint === complaint.id}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer border-none disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {resolvingComplaint === complaint.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>✅ Complaint Resolved</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

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
          const currentMilestone = partnerDetails?.currentMilestone || 100;
          const milestoneCompletedJobs = partnerDetails?.milestoneCompletedJobs || 0;
          const milestoneStatus = partnerDetails?.milestoneStatus || "in_progress";
          const minMilestoneRating = toggles?.minMilestoneRating ?? 4.0;
          
          const progressPct = Math.min(100, (milestoneCompletedJobs / currentMilestone) * 100);
          const jobsRemaining = Math.max(0, currentMilestone - milestoneCompletedJobs);
          
          // Milestone Status Text helper
          const getStatusBadge = (status: string) => {
            switch (status) {
              case "in_progress":
                return <span className="text-[10px] uppercase font-black tracking-widest bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">In Progress</span>;
              case "pending_review":
                return <span className="text-[10px] uppercase font-black tracking-widest bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full border border-yellow-100 animate-pulse">Pending Review</span>;
              case "approved":
                return <span className="text-[10px] uppercase font-black tracking-widest bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">Approved</span>;
              case "withdrawal_requested":
                return <span className="text-[10px] uppercase font-black tracking-widest bg-purple-50 text-purple-600 px-3 py-1 rounded-full border border-purple-100">Withdrawal Requested</span>;
              case "payment_processing":
                return <span className="text-[10px] uppercase font-black tracking-widest bg-amber-50 text-amber-600 px-3 py-1 rounded-full border border-amber-100">Processing</span>;
              case "paid":
                return <span className="text-[10px] uppercase font-black tracking-widest bg-emerald-500 text-white px-3 py-1 rounded-full">Paid</span>;
              case "rejected":
                return <span className="text-[10px] uppercase font-black tracking-widest bg-rose-50 text-rose-600 px-3 py-1 rounded-full border border-rose-100">Rejected</span>;
              default:
                return <span className="text-[10px] uppercase font-black tracking-widest bg-slate-50 text-slate-600 px-3 py-1 rounded-full">Unknown</span>;
            }
          };

          return (
            <div className="space-y-6">
              
              {/* Main Milestone Progress Card */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-6 shadow-xl shadow-slate-100/40">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-indigo-600" /> Milestone Rewards
                  </h3>
                  {getStatusBadge(milestoneStatus)}
                </div>

                {/* Main Progress Tracker */}
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Completed Jobs</span>
                      <p className="text-3xl font-black text-slate-800 mt-1">{milestoneCompletedJobs} <span className="text-xs text-slate-400 font-bold">/ {currentMilestone}</span></p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Average Rating</span>
                      <p className="text-3xl font-black text-amber-500 mt-1">{rating.toFixed(1)}<span className="text-xs text-slate-400 font-bold">★</span></p>
                    </div>
                  </div>

                  {/* Rating warnings */}
                  {milestoneCompletedJobs >= currentMilestone && rating < minMilestoneRating && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs space-y-1">
                      <p className="font-extrabold flex items-center gap-2">⚠️ Rating Restriction</p>
                      <p className="text-muted-foreground leading-relaxed">You achieved the completed jobs milestone, but your average rating ({rating.toFixed(1)}★) is below the minimum required rating of {minMilestoneRating}★. Please improve customer feedback on upcoming jobs to unlock the reward.</p>
                    </div>
                  )}

                  {/* Animated Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>Milestone Progress</span>
                      <span>{Math.round(progressPct)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/50">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    {jobsRemaining > 0 ? (
                      <p className="text-[10px] text-slate-400 font-bold">
                        Need {jobsRemaining} more completed jobs with rating &ge; {minMilestoneRating}★ to unlock this milestone.
                      </p>
                    ) : (
                      <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Target achieved! Milestone unlocked.
                      </p>
                    )}
                  </div>
                </div>

                {/* Milestone Cards grid */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Available Milestones</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[100, 200, 300].map((mVal) => {
                      const isCompleted = currentMilestone > mVal;
                      const isCurrent = currentMilestone === mVal;
                      const isLocked = currentMilestone < mVal;

                      return (
                        <div 
                          key={mVal} 
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                            isCompleted ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" :
                            isCurrent ? "bg-indigo-50/30 border-indigo-200 text-indigo-900 shadow-sm animate-pulse" :
                            "bg-slate-50/50 border-slate-100 text-slate-400 opacity-60"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black">{mVal} Jobs</span>
                            {isCompleted ? <CheckCircle className="w-4 h-4 text-emerald-600" /> :
                             isCurrent ? <Award className="w-4 h-4 text-indigo-600" /> :
                             <ShieldCheck className="w-4 h-4 text-slate-300" />}
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider block">
                            {isCompleted ? "Completed" : isCurrent ? "Active Target" : "Locked"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Milestone-specific state configurations */}
                {milestoneStatus === "approved" && (
                  <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="space-y-1">
                      <h4 className="font-black text-base text-indigo-900">🎉 Bonus Approved!</h4>
                      <p className="text-xs text-indigo-700">Your milestone reward has been approved by the admin. You can withdraw your reward now.</p>
                    </div>
                    <button
                      onClick={() => setShowWithdrawModal(true)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg hover:shadow-indigo-600/30 transition-all cursor-pointer border-none"
                    >
                      Withdraw Bonus Reward
                    </button>
                  </div>
                )}

                {milestoneStatus === "paid" && partnerDetails?.milestonePaymentDetails && (
                  <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl space-y-4 animate-in fade-in duration-300">
                    <div className="text-center space-y-1">
                      <h4 className="font-black text-base text-emerald-950">🎉 Bonus Paid Successfully!</h4>
                      <p className="text-xs text-emerald-700">Your milestone bonus has been successfully paid.</p>
                    </div>
                    <div className="bg-white/85 border border-emerald-100 p-3.5 rounded-xl text-xs space-y-1.5 text-slate-700 font-medium">
                      <p><strong>Milestone:</strong> {currentMilestone} Jobs Completed</p>
                      <p><strong>Status:</strong> <span className="text-emerald-600 font-extrabold">Paid Successfully</span></p>
                      <p><strong>Reference No:</strong> {partnerDetails.milestonePaymentDetails.referenceNumber}</p>
                      <p><strong>Paid Date:</strong> {partnerDetails.milestonePaymentDetails.paidAt ? new Date(partnerDetails.milestonePaymentDetails.paidAt.seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={handleUnlockNextMilestone}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer border-none"
                    >
                      Unlock Next Milestone ({currentMilestone + 100} Jobs)
                    </button>
                  </div>
                )}
              </div>

              {/* Milestone history listing */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-xl shadow-slate-100/40">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Completed Milestones History</span>
                {(!partnerDetails?.milestoneHistory || partnerDetails.milestoneHistory.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-2">No completed milestones registered yet.</p>
                ) : (
                  <div className="space-y-3">
                    {partnerDetails.milestoneHistory.map((hist: any, index: number) => (
                      <div key={index} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-xs text-slate-600">
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-800">{hist.milestone} Jobs Milestone</p>
                          <p className="text-[10px] text-slate-400">Paid: {new Date(hist.paidAt.seconds * 1000).toLocaleDateString()}</p>
                        </div>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black uppercase">PAID</span>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* Celebration Modal */}
      {showCelebrationModal && (
        <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center p-6 z-50 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md text-center space-y-6 shadow-2xl relative overflow-hidden text-slate-800">
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-primary/10 rounded-full blur-xl" />
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl" />

            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-3xl mx-auto animate-bounce">
              🎉
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full tracking-wider font-bold">Milestone Unlocked</span>
              <h3 className="text-2xl font-black text-slate-850">Congratulations!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                You have successfully unlocked the <strong className="text-slate-800">{partnerDetails?.currentMilestone} Jobs</strong> milestone.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs space-y-2 text-slate-650 text-left">
              <div className="flex justify-between">
                <span>Completed Jobs:</span>
                <strong className="text-slate-800">{partnerDetails?.milestoneCompletedJobs} Jobs</strong>
              </div>
              <div className="flex justify-between">
                <span>Your Quality Rating:</span>
                <strong className="text-slate-800">{partnerDetails?.rating?.toFixed(1)}★</strong>
              </div>
              <div className="flex justify-between border-t border-slate-150 pt-2 font-bold text-slate-800">
                <span>Current Status:</span>
                <span className="text-indigo-600 uppercase font-black">Pending Review</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowCelebrationModal(false);
                if (typeof window !== "undefined") {
                  import("canvas-confetti").then((module) => {
                    const confetti = module.default;
                    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
                  });
                }
              }}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer border-none"
            >
              Continue to Portal
            </button>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-6 z-50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white border border-slate-100 p-6.5 rounded-3xl w-full max-w-md space-y-6 shadow-2xl relative text-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-800">Withdraw Bonus Reward</h3>
                <p className="text-[10px] text-slate-400 font-bold">Transfer milestone earnings to bank or UPI</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Choose Payout Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      paymentMethod === "upi"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-600"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" /> UPI Payout
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank")}
                    className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      paymentMethod === "bank"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-600"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Award className="w-4 h-4" /> Bank Account
                  </button>
                </div>
              </div>

              {paymentMethod === "upi" ? (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="text-xs font-bold text-slate-600">UPI ID *</label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. name@upi, mobile@ybl"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 text-xs text-slate-800 focus:bg-white transition-all font-bold"
                  />
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Account Holder Name *</label>
                    <input
                      type="text"
                      required
                      value={bankHolderName}
                      onChange={(e) => setBankHolderName(e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 text-xs text-slate-800 focus:bg-white font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Account Number *</label>
                    <input
                      type="text"
                      required
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="e.g. 501002394823"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 text-xs text-slate-800 focus:bg-white font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">IFSC Code *</label>
                      <input
                        type="text"
                        required
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                        placeholder="e.g. HDFC0000123"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 text-xs text-slate-800 focus:bg-white font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">Bank Name *</label>
                      <input
                        type="text"
                        required
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 text-xs text-slate-800 focus:bg-white font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="py-3 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs rounded-xl cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitWithdrawal}
                disabled={submittingWithdrawal}
                className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer border-none disabled:opacity-50"
              >
                {submittingWithdrawal ? "Submitting..." : "Submit Payout"}
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
