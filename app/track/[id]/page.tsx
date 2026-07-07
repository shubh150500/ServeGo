"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { doc, onSnapshot, collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { compressProfilePhoto } from "@/lib/imageCompressor";
import { db } from "@/lib/firebase";
import { SERVICES_LIST } from "@/lib/services";
import ServiceIcon from "@/components/ServiceIcon";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Star, 
  User, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  Camera,
  X,
  Send
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderTrackingPage({ params }: PageProps) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const bookingId = unwrappedParams.id;

  // State
  const [booking, setBooking] = useState<any | null>(null);
  const [worker, setWorker] = useState<any | null>(null);
  const [partner, setPartner] = useState<any | null>(null);
  const [serviceDetails, setServiceDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Mobile verification for complaint
  const [verifyMobile, setVerifyMobile] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  
  // Complaint states
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintReason, setComplaintReason] = useState("");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [complaintPhotos, setComplaintPhotos] = useState<string[]>([]);
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState(false);
  const [alreadyComplained, setAlreadyComplained] = useState(false);
  const [complaintWindowDays, setComplaintWindowDays] = useState(5);

  // Hook 1: Subscribe to Booking Document
  useEffect(() => {
    if (!bookingId) return;

    setError("");
    const bookingRef = doc(db, "bookings", bookingId);
    const unsubscribeBooking = onSnapshot(
      bookingRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          setError("Invalid booking tracking code.");
          setLoading(false);
          return;
        }

        const bData = docSnap.data();
        setBooking({ id: docSnap.id, ...bData });
        setLoading(false);
      },
      (err) => {
        console.error("Real-time listener failed:", err);
        setError("Network connection issue. Trying to reconnect...");
        setLoading(false);
      }
    );

    return () => unsubscribeBooking();
  }, [bookingId]);

  // Hook 2: Subscribe to Assigned Worker
  useEffect(() => {
    if (!booking?.assignedWorkerId) {
      setWorker(null);
      return;
    }

    const workerRef = doc(db, "workers", booking.assignedWorkerId);
    const unsubscribeWorker = onSnapshot(
      workerRef,
      (wSnap) => {
        if (wSnap.exists()) {
          setWorker({ id: wSnap.id, ...wSnap.data() });
        }
      },
      (err) => console.error("Firestore tracking worker subscription failed:", err)
    );

    return () => unsubscribeWorker();
  }, [booking?.assignedWorkerId]);

  // Hook 3: Subscribe to Assigned Partner Shop or Vehicle
  useEffect(() => {
    if (!booking?.assignedPartnerId || !booking?.assignedPartnerType) {
      setPartner(null);
      return;
    }

    const coll = booking.assignedPartnerType === "shop" ? "shops" : "vehicles";
    const partnerRef = doc(db, coll, booking.assignedPartnerId);
    const unsubscribePartner = onSnapshot(
      partnerRef,
      (pSnap) => {
        if (pSnap.exists()) {
          setPartner({ id: pSnap.id, type: booking.assignedPartnerType, ...pSnap.data() });
        }
      },
      (err) => console.error("Firestore tracking partner subscription failed:", err)
    );

    return () => unsubscribePartner();
  }, [booking?.assignedPartnerId, booking?.assignedPartnerType]);

  useEffect(() => {
    if (!booking?.serviceType) return;

    const unsub = onSnapshot(
      doc(db, "services", booking.serviceType),
      (docSnap) => {
        if (docSnap.exists()) {
          setServiceDetails(docSnap.data());
        } else {
          const staticS = SERVICES_LIST.find((s) => s.id === booking.serviceType);
          if (staticS) setServiceDetails(staticS);
        }
      },
      (err) => console.error("Firestore tracking service details subscription failed:", err)
    );

    return () => unsub();
  }, [booking?.serviceType]);

  // Hook 5: Load complaint window config
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "system_config", "toggles"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setComplaintWindowDays(data.complaintWindowDays ?? 5);
        }
      }
    );
    return () => unsub();
  }, []);

  // Hook 6: Check if complaint already exists for this booking
  useEffect(() => {
    if (!bookingId) return;
    const q = query(collection(db, "complaints"), where("bookingId", "==", bookingId), where("source", "==", "customer"));
    getDocs(q).then((snap) => {
      if (!snap.empty) setAlreadyComplained(true);
    }).catch(() => {});
  }, [bookingId]);

  // Complaint photo handler
  const handleComplaintPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos = [...complaintPhotos];
    for (let i = 0; i < Math.min(files.length, 3 - newPhotos.length); i++) {
      try {
        const compressed = await compressProfilePhoto(files[i]);
        newPhotos.push(compressed);
      } catch {}
    }
    setComplaintPhotos(newPhotos);
  };

  // Submit complaint
  const handleSubmitComplaint = async () => {
    if (!complaintReason || !booking) return;
    setComplaintSubmitting(true);
    try {
      await addDoc(collection(db, "complaints"), {
        bookingId: booking.id,
        customerName: booking.customerName,
        customerMobile: booking.customerMobile,
        customerAddress: booking.customerAddress || "",
        workerId: booking.assignedWorkerId || "",
        workerName: worker?.name || "",
        workerMobile: worker?.mobile || "",
        serviceType: booking.serviceType,
        reason: complaintReason,
        description: complaintDescription,
        photos: complaintPhotos,
        status: "pending",
        source: "customer",
        createdAt: serverTimestamp(),
        resolvedAt: null,
        workerResponseTime: null,
        workerNotes: "",
        adminNotes: "",
        adminAction: ""
      });

      // Try to send push notification to worker
      try {
        const subsSnap = await getDocs(query(collection(db, "push_subscriptions"), where("workerId", "==", booking.assignedWorkerId)));
        for (const subDoc of subsSnap.docs) {
          const sub = subDoc.data();
          await fetch("/api/worker/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subscription: sub.subscription,
              title: "⚠️ Customer Complaint Filed",
              body: `${booking.customerName} has raised a complaint for booking ${booking.id.substring(0, 8)}. Reason: ${complaintReason}`,
              tag: "complaint-" + booking.id
            })
          });
        }
      } catch {}

      setComplaintSuccess(true);
      setAlreadyComplained(true);
    } catch (err: any) {
      alert("Failed to submit complaint: " + err.message);
    } finally {
      setComplaintSubmitting(false);
    }
  };

  // Compute complaint window
  const isComplaintWindowOpen = () => {
    if (!booking?.completedAt) return false;
    const completedTime = booking.completedAt.seconds * 1000;
    const windowMs = complaintWindowDays * 24 * 60 * 60 * 1000;
    return Date.now() < completedTime + windowMs;
  };

  const getComplaintDaysLeft = () => {
    if (!booking?.completedAt) return 0;
    const completedTime = booking.completedAt.seconds * 1000;
    const windowMs = complaintWindowDays * 24 * 60 * 60 * 1000;
    const remaining = (completedTime + windowMs) - Date.now();
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
  };

  const downloadInvoice = () => {
    if (!booking) return;
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 600, 800);

    // Outer border
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 580, 780);

    // Decorative Header Accent
    ctx.fillStyle = "#4f46e5"; // Indigo
    ctx.fillRect(10, 10, 580, 15);

    // Brand Name
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ServeGo", 300, 60);

    // Subtitle
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("OFFICIAL SERVICE TRANSACTION RECEIPT", 300, 85);

    // Horizontal Separator
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 110);
    ctx.lineTo(570, 110);
    ctx.stroke();

    // Invoice Metadata
    ctx.textAlign = "left";
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(`Invoice No: SG-${booking.id}`, 40, 140);
    ctx.fillText(`Date: ${booking.createdAt ? new Date(booking.createdAt.seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString()}`, 40, 160);
    ctx.fillText(`Status: PAID (Verified)`, 40, 180);

    // Horizontal Separator
    ctx.beginPath();
    ctx.moveTo(30, 210);
    ctx.lineTo(570, 210);
    ctx.stroke();

    // Section: Customer Info
    ctx.fillStyle = "#4f46e5";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("CUSTOMER DETAILS", 40, 235);

    ctx.fillStyle = "#0f172a";
    ctx.font = "normal 13px sans-serif";
    ctx.fillText(`Name: ${booking.customerName}`, 40, 260);
    ctx.fillText(`Mobile: ${booking.customerMobile}`, 40, 280);
    ctx.fillText(`Address: ${booking.customerAddress}`, 40, 300);
    ctx.fillText(`Sector: ${booking.customerArea}`, 40, 320);

    // Horizontal Separator
    ctx.beginPath();
    ctx.moveTo(30, 350);
    ctx.lineTo(570, 350);
    ctx.stroke();

    // Section: Service Info
    ctx.fillStyle = "#4f46e5";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("SERVICE DETAILS", 40, 375);

    ctx.fillStyle = "#0f172a";
    ctx.font = "normal 13px sans-serif";
    ctx.fillText(`Service Name: ${serviceDetails?.name || booking.serviceType}`, 40, 400);
    ctx.fillText(`Preferred Date: ${booking.bookingDate || "Today"}`, 40, 420);
    ctx.fillText(`Preferred Slot: ${booking.bookingTimeSlot || "General"}`, 40, 440);
    ctx.fillText(`Description: ${booking.description || "General maintenance"}`, 40, 460);

    // Horizontal Separator
    ctx.beginPath();
    ctx.moveTo(30, 490);
    ctx.lineTo(570, 490);
    ctx.stroke();

    // Section: Payment Breakdown
    ctx.fillStyle = "#4f46e5";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("PAYMENT BREAKDOWN", 40, 515);

    ctx.fillStyle = "#0f172a";
    ctx.font = "normal 13px sans-serif";
    ctx.fillText("Service Assurance Fee:", 40, 540);
    ctx.fillText(`Promo Discount (${booking.appliedPromoCode || "None"}):`, 40, 565);
    
    ctx.textAlign = "right";
    ctx.fillText("₹99.00", 560, 540);
    const disc = booking.appliedDiscountAmount || 0;
    ctx.fillText(`- ₹${disc.toFixed(2)}`, 560, 565);

    // Total highlight
    ctx.beginPath();
    ctx.moveTo(30, 595);
    ctx.lineTo(570, 595);
    ctx.stroke();

    ctx.font = "bold 15px sans-serif";
    ctx.fillText("Grand Total Paid:", 200, 625);
    ctx.fillText(`₹${(99 - disc).toFixed(2)}`, 560, 625);

    // Dashed Cut Line at bottom
    ctx.strokeStyle = "#cbd5e1";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(20, 680);
    ctx.lineTo(580, 680);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Thank you message
    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    ctx.font = "italic 11px sans-serif";
    ctx.fillText("This is an autogenerated electronic receipt verified by ServeGo Payments.", 300, 715);
    ctx.fillText("For complaints or assistance, WhatsApp us or return to the tracking portal.", 300, 735);
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("© 2026 ServeGo. Ranchi • Patna • Delhi • Aurangabad.", 300, 760);

    // Trigger download
    const link = document.createElement("a");
    link.download = `ServeGo_Invoice_${booking.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground text-sm font-semibold mt-4">Establishing secure connection to matching engine...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <h1 className="text-3xl font-black">Tracking Record Not Found</h1>
        <p className="text-muted-foreground max-w-md">
          {error || "The tracking reference you provided does not exist or has expired."}
        </p>
        <Link href="/" className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl">
          Back to Home
        </Link>
      </div>
    );
  }



  // Helper to determine step status
  const getStepStatus = (stepName: "placed" | "assigned" | "accepted" | "completed") => {
    const status = booking.status;
    
    if (stepName === "placed") return "completed"; // always completed if document exists
    
    if (stepName === "assigned") {
      if (status === "ASSIGNED" || status === "ACCEPTED" || status === "COMPLETED") return "completed";
      return "pending";
    }
    
    if (stepName === "accepted") {
      if (status === "ACCEPTED" || status === "COMPLETED") return "completed";
      if (status === "ASSIGNED") return "active";
      return "pending";
    }
    
    if (stepName === "completed") {
      if (status === "COMPLETED") return "completed";
      if (status === "ACCEPTED") return "active";
      return "pending";
    }
    
    return "pending";
  };

  const formatWhatsAppNumber = (num: string): string => {
    let clean = num.replace(/[^\d]/g, ""); // strip all non-digits
    if (clean.startsWith("0")) clean = clean.substring(1);
    if (clean.length === 10) clean = "91" + clean;
    return clean;
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-6 selection:bg-primary/20">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="ServeGo Logo" className="w-8 h-8 rounded-lg object-contain" />
              <span className="text-xl font-black tracking-tighter text-foreground">
                ServeGo
              </span>
            </div>
          </div>
        </div>

        {/* Live Service Card */}
        <div className="bg-card border border-border/70 rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-primary/5 border-b border-border/60 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 overflow-hidden">
                {serviceDetails?.imageUrl ? (
                  <img src={serviceDetails.imageUrl} alt={serviceDetails.name} className="w-full h-full object-cover" />
                ) : (
                  <ServiceIcon name={serviceDetails?.iconName || "Sparkles"} className="w-6 h-6" />
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Real-Time Tracking</span>
                <h2 className="text-xl font-black text-foreground">{serviceDetails?.name || booking.serviceType} Booking</h2>
              </div>
            </div>
            <div className="text-sm font-mono text-muted-foreground bg-muted px-3 py-1 rounded-xl">
              ID: {booking.id.substring(0, 10)}...
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            
            {/* Live Progress Timeline */}
            <div className="space-y-6">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Live Service Tracker
              </h3>

              <div className="relative pl-8 space-y-8 before:absolute before:top-2 before:bottom-2 before:left-3 before:w-0.5 before:bg-border/60">
                
                {/* Step 1: Booking Placed */}
                <div className="relative">
                  <div className="absolute -left-8 mt-0.5 w-6.5 h-6.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xs font-bold z-10">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Assurance Fee Captured</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Payment registered and order initialized in queue.</p>
                  </div>
                </div>

                {/* Step 2: Matching/Assigned */}
                <div className="relative">
                  {getStepStatus("assigned") === "completed" ? (
                    <div className="absolute -left-8 mt-0.5 w-6.5 h-6.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xs font-bold z-10">
                      ✓
                    </div>
                  ) : (
                    <div className="absolute -left-8 mt-0.5 w-6.5 h-6.5 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs font-bold z-10 animate-pulse">
                      ●
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Service Partner Match</h4>
                    {getStepStatus("assigned") === "completed" ? (
                      <p className="text-xs text-muted-foreground mt-0.5">Found and dispatched top-ranked provider in your area.</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5 animate-pulse">Scanning available rated workers in {booking.customerArea}...</p>
                    )}
                  </div>
                </div>

                {/* Step 3: Accepted */}
                <div className="relative">
                  {getStepStatus("accepted") === "completed" ? (
                    <div className="absolute -left-8 mt-0.5 w-6.5 h-6.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xs font-bold z-10">
                      ✓
                    </div>
                  ) : getStepStatus("accepted") === "active" ? (
                    <div className="absolute -left-8 mt-0.5 w-6.5 h-6.5 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs font-bold z-10 animate-pulse">
                      ●
                    </div>
                  ) : (
                    <div className="absolute -left-8 mt-0.5 w-6.5 h-6.5 rounded-full bg-muted border border-border/80 flex items-center justify-center text-xs font-bold z-10 text-muted-foreground">
                      ○
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Worker Dispatched</h4>
                    {getStepStatus("accepted") === "completed" ? (
                      <p className="text-xs text-muted-foreground mt-0.5">Provider accepted and confirmed the schedule.</p>
                    ) : getStepStatus("accepted") === "active" ? (
                      <p className="text-xs text-muted-foreground mt-0.5 animate-pulse">Waiting for the assigned partner to accept dispatcher details...</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">Awaiting partner assignment.</p>
                    )}
                  </div>
                </div>

                {/* Step 4: Completed */}
                <div className="relative">
                  {getStepStatus("completed") === "completed" ? (
                    <div className="absolute -left-8 mt-0.5 w-6.5 h-6.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xs font-bold z-10">
                      ✓
                    </div>
                  ) : getStepStatus("completed") === "active" ? (
                    <div className="absolute -left-8 mt-0.5 w-6.5 h-6.5 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs font-bold z-10 animate-pulse">
                      ●
                    </div>
                  ) : (
                    <div className="absolute -left-8 mt-0.5 w-6.5 h-6.5 rounded-full bg-muted border border-border/80 flex items-center justify-center text-xs font-bold z-10 text-muted-foreground">
                      ○
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Service Verification Completed</h4>
                    {getStepStatus("completed") === "completed" ? (
                      <p className="text-xs text-muted-foreground mt-0.5">Job finished. Thank you for using ServeGo!</p>
                    ) : getStepStatus("completed") === "active" ? (
                      <p className="text-xs text-muted-foreground mt-0.5 animate-pulse">Partner is currently executing the task at your premises.</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">Task execution pending.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Revealed Worker details card if status is ACCEPTED or COMPLETED */}
            {worker && (booking.status === "ACCEPTED" || booking.status === "COMPLETED") && (
              <div className="border-t border-border/60 pt-6 space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Assigned Service Partner
                </h3>
                
                <div className="bg-muted/30 border border-border/60 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2">
                    <h4 className="text-lg font-black">{worker.name}</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-bold text-foreground">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {worker.rating}★
                      </span>
                      <span>Experience: <strong>{worker.experience} Years</strong></span>
                      <span>Completed Jobs: <strong>{worker.totalCompletedJobs}</strong></span>
                    </div>
                  </div>
                  
                  {booking.status === "ACCEPTED" && (
                    <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
                      <a
                        href={`tel:${worker.mobile}`}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-secondary border border-border/80 hover:bg-secondary/80 text-foreground font-bold rounded-xl text-sm transition-colors cursor-pointer"
                      >
                        <Phone className="w-4 h-4 text-primary" /> Call Partner
                      </a>
                      <a
                        href={`https://wa.me/${formatWhatsAppNumber(worker.mobile)}?text=Hi%20${encodeURIComponent(worker.name)},%20I%20am%20${encodeURIComponent(booking.customerName)}.%20We%20are%20connected%20via%20ServeGo%20for%20the%20${encodeURIComponent(serviceDetails?.name || "service")}%20request%20(ID:%20${booking.id.substring(0, 5)}).`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" /> WhatsApp Chat
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Revealed Partner Shop/Vehicle details card if status is ASSIGNED, ACCEPTED or COMPLETED */}
            {partner && (booking.status === "ASSIGNED" || booking.status === "ACCEPTED" || booking.status === "COMPLETED") && (
              <div className="border-t border-border/60 pt-6 space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Assigned Service Partner
                </h3>
                
                <div className="bg-muted/30 border border-border/60 p-6 rounded-2xl space-y-4">
                  {partner.type === "shop" ? (
                    <>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-4">
                        <div>
                          <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded uppercase">
                            Shop Partner
                          </span>
                          <h4 className="text-lg font-black mt-1">{partner.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Owner: <strong>{partner.ownerName}</strong></p>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-amber-500 text-sm">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {partner.rating || "5.0"}★
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <div>
                          <strong>Area Cover:</strong> {partner.area}
                        </div>
                        <div>
                          <strong>Address:</strong> {partner.address}
                        </div>
                        <div>
                          <strong>Hours:</strong> {partner.openingTime} - {partner.closingTime}
                        </div>
                        <div>
                          <strong>Delivery Support:</strong> {partner.deliveryAvailable ? `Yes (Charges: ₹${partner.deliveryCharges})` : "Pickup Only"}
                        </div>
                      </div>

                      {partner.description && (
                        <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/40 italic">
                          "{partner.description}"
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 pt-2">
                        <a
                          href={`tel:${partner.phone}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" /> Call Shop
                        </a>
                        {partner.whatsapp && (
                          <a
                            href={`https://wa.me/${formatWhatsAppNumber(partner.whatsapp)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-bold rounded-xl text-xs transition-colors"
                          >
                            WhatsApp
                          </a>
                        )}
                        {partner.googleMapsLink && (
                          <a
                            href={partner.googleMapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-border/80 text-muted-foreground hover:bg-muted font-bold rounded-xl text-xs transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5 text-primary" /> Directions
                          </a>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-4">
                        <div>
                          <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded uppercase">
                            Rental Vehicle
                          </span>
                          <h4 className="text-lg font-black mt-1">{partner.vehicleName}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Plate Number: <strong>{partner.vehicleNumber}</strong></p>
                        </div>
                        <span className="text-xs bg-muted border border-border/80 px-2.5 py-1 rounded-xl text-foreground font-black capitalize">
                          {partner.category?.replace("vehicle-", "")}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <div>
                          <strong>Owner:</strong> {partner.ownerName}
                        </div>
                        {partner.driverName && (
                          <div>
                            <strong>Driver:</strong> {partner.driverName}
                          </div>
                        )}
                        <div>
                          <strong>Area Cover:</strong> {partner.area}
                        </div>
                        <div>
                          <strong>Daily Rent:</strong> ₹{partner.price}/day
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <a
                          href={`tel:${partner.phone}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" /> Call Driver
                        </a>
                        {partner.whatsapp && (
                          <a
                            href={`https://wa.me/${formatWhatsAppNumber(partner.whatsapp)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-bold rounded-xl text-xs transition-colors"
                          >
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Reveal Completion Photo if Completed */}
            {booking.status === "COMPLETED" && (
              <div className="border-t border-border/60 pt-6 space-y-6">
                {booking.completionPhotoUrl && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-foreground/80 block">Completed Work Photo Proof</h4>
                    <div className="border border-border/80 rounded-2xl overflow-hidden aspect-video bg-muted/20">
                      <img 
                        src={booking.completionPhotoUrl} 
                        alt="Work completion proof" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Review Prompt CTA */}
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" /> Share your experience!
                    </h4>
                    <p className="text-xs leading-relaxed text-emerald-700">
                      Please submit a rating and brief review for the partner's profile.
                    </p>
                  </div>
                  <Link
                    href={`/review/${booking.id}`}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all"
                  >
                    Write a Review <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Complaint Section */}
                <div className="border-t border-border/60 pt-6 space-y-4">
                  {!mobileVerified ? (
                    <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-3">
                      <h4 className="font-bold text-sm text-amber-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Have an issue with this service?
                      </h4>
                      <p className="text-xs text-amber-700">Enter your registered mobile number to verify your identity.</p>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={verifyMobile}
                          onChange={(e) => setVerifyMobile(e.target.value)}
                          placeholder="Enter your mobile number"
                          maxLength={10}
                          className="flex-1 px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-foreground"
                        />
                        <button
                          onClick={() => {
                            const clean = verifyMobile.replace(/\s+/g, "");
                            if (clean === booking.customerMobile || clean === booking.customerMobile?.slice(-10)) {
                              setMobileVerified(true);
                            } else {
                              alert("Mobile number does not match the booking record.");
                            }
                          }}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  ) : alreadyComplained || complaintSuccess ? (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-5 rounded-2xl text-xs font-bold text-center">
                      ✅ A complaint has already been submitted for this booking. Our team and the assigned worker will address it.
                    </div>
                  ) : isComplaintWindowOpen() ? (
                    <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-amber-800 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Facing an issue?
                        </h4>
                        <p className="text-xs text-amber-700">
                          You have {getComplaintDaysLeft()} day(s) left to raise a complaint for this booking.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowComplaintModal(true)}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl cursor-pointer border-none flex items-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4" /> Raise Complaint
                      </button>
                    </div>
                  ) : (
                    <div className="bg-muted/30 border border-border/60 p-4 rounded-2xl text-center">
                      <p className="text-xs text-muted-foreground font-bold">Complaint period has expired.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* General Booking Info summary */}
            <div className="border-t border-border/60 pt-6 space-y-3 text-xs text-muted-foreground bg-muted/20 p-5 rounded-2xl border border-dashed border-border/40">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Booking Summary
                </h4>
                <button
                  onClick={downloadInvoice}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary font-extrabold text-[11px] rounded-lg transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Download Invoice
                </button>
              </div>
              <p><strong>Customer Name:</strong> {booking.customerName}</p>
              <p><strong>Service Location:</strong> {booking.customerAddress}, {booking.customerArea}</p>
              <p><strong>Problem Description:</strong> {booking.description}</p>
            </div>

          </div>
        </div>
      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-foreground">Raise a Complaint</h3>
                <button onClick={() => setShowComplaintModal(false)} className="p-1 hover:bg-muted rounded-lg cursor-pointer">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80">Select Reason *</label>
                <select
                  value={complaintReason}
                  onChange={(e) => setComplaintReason(e.target.value)}
                  className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="">Choose a reason...</option>
                  <option value="Same issue occurred again">Same issue occurred again</option>
                  <option value="Worker not responding">Worker not responding</option>
                  <option value="Poor quality work">Poor quality work</option>
                  <option value="Behaviour issue">Behaviour issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80">Description (Optional)</label>
                <textarea
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={3}
                  className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80">Upload Photos (Optional, max 3)</label>
                <div className="flex gap-2 flex-wrap">
                  {complaintPhotos.map((p, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-border">
                      <img src={p} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setComplaintPhotos(complaintPhotos.filter((_, idx) => idx !== i))}
                        className="absolute top-0 right-0 bg-black/60 text-white p-0.5 rounded-bl-lg cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {complaintPhotos.length < 3 && (
                    <label className="w-16 h-16 border-2 border-dashed border-border rounded-xl flex items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors">
                      <Camera className="w-5 h-5 text-muted-foreground" />
                      <input type="file" accept="image/*" onChange={handleComplaintPhoto} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* Notice */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 p-4 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 space-y-2 leading-relaxed">
                <p className="font-bold">📋 Important Notice:</p>
                <p>If the issue is related to the <strong>SAME previous service</strong>, please first contact the assigned worker after submitting the complaint.</p>
                <p>If it is a completely <strong>NEW issue</strong>, please create a new booking through ServeGo.</p>
                <p>ServeGo is a technology platform that connects customers with workers. Final service resolution depends upon the mutual understanding between the customer and the assigned worker.</p>
              </div>

              <button
                onClick={handleSubmitComplaint}
                disabled={!complaintReason || complaintSubmitting}
                className="w-full py-3.5 bg-primary text-primary-foreground font-black text-sm rounded-xl shadow cursor-pointer border-none disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {complaintSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {complaintSubmitting ? "Submitting..." : "Submit Complaint"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
