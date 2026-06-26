"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SERVICES_LIST } from "@/lib/services";
import ServiceIcon from "@/components/ServiceIcon";
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
  Sparkles
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
  const [serviceDetails, setServiceDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) return;

    setError("");
    
    // Subscribe to real-time updates on the booking document
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

        // If a worker is assigned, subscribe to real-time updates on the worker document
        if (bData.assignedWorkerId) {
          const workerRef = doc(db, "workers", bData.assignedWorkerId);
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
        } else {
          setWorker(null);
        }
      },
      (err) => {
        console.error("Real-time listener failed:", err);
        setError("Network connection issue. Trying to reconnect...");
        setLoading(false);
      }
    );

    return () => unsubscribeBooking();
  }, [bookingId]);

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

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-6 selection:bg-primary/20">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="ServeGo Logo" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-xl font-black tracking-tighter text-black">
              ServeGo
            </span>
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
                    <a
                      href={`tel:${worker.mobile}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                    >
                      <Phone className="w-4 h-4" /> Call Partner
                    </a>
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
              </div>
            )}

            {/* General Booking Info summary */}
            <div className="border-t border-border/60 pt-6 space-y-2 text-xs text-muted-foreground">
              <h4 className="text-sm font-bold text-foreground/80 flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-primary" /> Booking Summary
              </h4>
              <p><strong>Customer Name:</strong> {booking.customerName}</p>
              <p><strong>Service Location:</strong> {booking.customerAddress}, {booking.customerArea}</p>
              <p><strong>Problem Description:</strong> {booking.description}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
