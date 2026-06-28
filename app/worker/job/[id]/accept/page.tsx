"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SERVICES_LIST } from "@/lib/services";
import { CheckCircle2, XCircle, AlertCircle, Phone, MapPin, User, FileText, ChevronRight } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkerAcceptJobPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const bookingId = unwrappedParams.id;

  // Booking & Worker State
  const [booking, setBooking] = useState<any | null>(null);
  const [worker, setWorker] = useState<any | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Reject State
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchBooking();
  }, [bookingId, token]);

  const fetchBooking = async () => {
    setLoading(true);
    setError("");
    try {
      if (!bookingId || !token) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      // Fetch details from secure server-side API bypassing client rules
      const res = await fetch("/api/worker/job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to retrieve job details.");
      }

      setBooking(data.booking);
      setAuthorized(true);

      if (data.worker) {
        setWorker(data.worker);
      }
    } catch (err: any) {
      console.error(err);
      setError(`Error synchronizing with platform (${err.message || err}). Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!booking || !worker) return;
    setActionLoading(true);
    setError("");

    try {
      const bookingRef = doc(db, "bookings", booking.id);
      const workerRef = doc(db, "workers", worker.id);

      await runTransaction(db, async (transaction) => {
        const bSnap = await transaction.get(bookingRef);
        const wSnap = await transaction.get(workerRef);

        if (!bSnap.exists() || !wSnap.exists()) {
          throw new Error("Records no longer exist on database.");
        }

        const bData = bSnap.data();
        if (bData.status !== "ASSIGNED") {
          throw new Error(`Job status is already ${bData.status}. You cannot accept it.`);
        }

        const currentAccepted = wSnap.data().totalAcceptedJobs || 0;

        transaction.update(bookingRef, {
          status: "ACCEPTED",
          updatedAt: serverTimestamp(),
        });

        transaction.update(workerRef, {
          totalAcceptedJobs: currentAccepted + 1,
          lastActivity: serverTimestamp(),
        });
      });

      // Refresh data
      await fetchBooking();
    } catch (err: any) {
      console.error("Acceptance failed:", err);
      setError(err.message || "Failed to accept the job.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !worker || !rejectReason) return;
    setActionLoading(true);
    setError("");

    try {
      const bookingRef = doc(db, "bookings", booking.id);
      const workerRef = doc(db, "workers", worker.id);

      await runTransaction(db, async (transaction) => {
        const bSnap = await transaction.get(bookingRef);
        const wSnap = await transaction.get(workerRef);

        if (!bSnap.exists() || !wSnap.exists()) {
          throw new Error("Records no longer exist on database.");
        }

        const currentRejected = wSnap.data().totalRejectedJobs || 0;

        transaction.update(bookingRef, {
          status: "REJECTED",
          assignedWorkerId: null, // send back to admin pool
          rejectionReason: rejectReason,
          updatedAt: serverTimestamp(),
        });

        transaction.update(workerRef, {
          totalRejectedJobs: currentRejected + 1,
          lastActivity: serverTimestamp(),
        });
      });

      // Redirect or show rejection complete
      setBooking((prev: any) => ({ ...prev, status: "REJECTED" }));
    } catch (err: any) {
      console.error("Rejection failed:", err);
      setError(err.message || "Failed to submit rejection.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-lg font-bold">Synchronizing job details...</div>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <XCircle className="w-16 h-16 text-destructive" />
        <h1 className="text-3xl font-black">Link Unauthorized</h1>
        <p className="text-muted-foreground max-w-md">
          This URL is expired, completed, or you do not have permission to view it. Please contact the platform administrator.
        </p>
      </div>
    );
  }

  const serviceDetails = SERVICES_LIST.find(s => s.id === booking?.serviceType);

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-6 selection:bg-primary/20">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Logo Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <img src="/logo.png" alt="ServeGo Logo" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-2xl font-black tracking-tighter text-black">
              ServeGo
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Secure Partner Dispatch Network</p>
        </div>

        {/* State 1: Worker Rejects the Job */}
        {booking?.status === "REJECTED" ? (
          <div className="bg-card border border-border/80 p-8 rounded-3xl text-center space-y-4 shadow-xl">
            <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
            <h2 className="text-2xl font-black">Job Rejection Registered</h2>
            <p className="text-muted-foreground">
              Thank you for letting us know. The job has been sent back to the admin pool, and your metrics have been logged. You may close this page.
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border/80 rounded-3xl shadow-xl overflow-hidden">
            
            {/* Header info */}
            <div className="bg-primary/5 border-b border-border/60 p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Service Requested</span>
                <span className="text-lg font-black text-foreground">{serviceDetails?.name || booking?.serviceType}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase ${
                booking?.status === "ASSIGNED" ? "bg-amber-100 text-amber-800" :
                booking?.status === "ACCEPTED" ? "bg-purple-100 text-purple-800" :
                booking?.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                "bg-muted text-muted-foreground"
              }`}>
                {booking?.status}
              </span>
            </div>

            {error && (
              <div className="p-6 pb-0">
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              </div>
            )}

            <div className="p-6 md:p-8 space-y-8">
              
              {/* Job Details Card */}
              <div className="space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Job Description
                </h3>
                <div className="bg-muted/30 p-4 rounded-xl border border-border/60 space-y-3">
                  <p className="text-foreground text-sm font-medium">{booking?.description}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                    <MapPin className="w-3.5 h-3.5" /> Sector/Area: {booking?.customerArea}
                  </div>
                </div>
              </div>

              {/* Reveal Customer Details on ACCEPTED */}
              {booking?.status === "ACCEPTED" ? (
                <div className="space-y-6 border-t border-border/60 pt-6">
                  <h3 className="text-lg font-black text-primary flex items-center gap-2">
                    <User className="w-5 h-5" /> Customer Details Revealed
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border border-border/80 p-5 rounded-2xl flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5 text-sm">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Contact Name</span>
                        <p className="font-bold text-foreground">{booking?.customerName}</p>
                      </div>
                    </div>

                    <a 
                      href={`tel:${booking?.customerMobile}`}
                      className="bg-card border border-border/80 p-5 rounded-2xl flex items-start gap-4 hover:border-primary/50 hover:bg-muted/10 transition-all cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5 text-sm">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Mobile Line</span>
                        <p className="font-bold text-emerald-600 flex items-center gap-1">
                          {booking?.customerMobile} <ChevronRight className="w-4 h-4 shrink-0" />
                        </p>
                      </div>
                    </a>
                  </div>

                  <div className="bg-card border border-border/80 p-5 rounded-2xl flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 text-sm">
                      <span className="text-xs text-muted-foreground uppercase font-bold">Full Address</span>
                      <p className="font-medium text-foreground">{booking?.customerAddress}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-2xl flex gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Next Steps:</p>
                      <p className="text-xs leading-relaxed mt-1">
                        Call the customer immediately to discuss the timing slot and provide a final labor estimate. Once you finish the work, open the completion portal link to upload the proof and confirm completion.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 text-center">
                    <Link
                      href={`/worker/job/${booking.id}/complete?token=${token}`}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/30 transition-all duration-300"
                    >
                      Proceed to Job Completion Page <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : booking?.status === "COMPLETED" ? (
                <div className="space-y-4 text-center border-t border-border/60 pt-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h3 className="text-xl font-bold">This Job is Completed</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    The work has been confirmed and reviewed by the customer. No further action is required.
                  </p>
                </div>
              ) : (
                /* Acceptance Trigger Options */
                <div className="space-y-6 border-t border-border/60 pt-6">
                  {showRejectForm ? (
                    <form onSubmit={handleReject} className="space-y-4">
                      <h4 className="font-bold text-sm text-foreground/80">Select Reason for Rejection</h4>
                      <select
                        required
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                      >
                        <option value="">Select Reason</option>
                        <option value="Busy">Busy on another job</option>
                        <option value="Unavailable">Unavailable today / leave</option>
                        <option value="Out of Area">Customer area is too far</option>
                        <option value="Other">Other reason</option>
                      </select>
                      <div className="flex gap-4">
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 cursor-pointer"
                        >
                          Confirm Rejection
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRejectForm(false)}
                          className="px-6 py-2.5 border border-border/85 rounded-xl text-sm font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={handleAccept}
                        disabled={actionLoading}
                        className="flex-1 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/95 shadow-lg transition-all duration-300 disabled:opacity-50 cursor-pointer"
                      >
                        {actionLoading ? "Processing..." : "Accept Job (Reveal Details)"}
                      </button>
                      <button
                        onClick={() => setShowRejectForm(true)}
                        disabled={actionLoading}
                        className="py-4 px-6 border border-border/85 hover:bg-muted font-bold rounded-xl transition-all duration-300 disabled:opacity-50 cursor-pointer text-muted-foreground hover:text-foreground"
                      >
                        Reject Job
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
