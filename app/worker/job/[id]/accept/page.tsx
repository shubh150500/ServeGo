"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SERVICES_LIST } from "@/lib/services";
import { compressImageToBase64 } from "@/lib/utils";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Phone, 
  MapPin, 
  User, 
  FileText, 
  Camera, 
  ShieldCheck 
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkerAcceptJobPage({ params }: PageProps) {
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

  // Complete Job Upload Photo State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);

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
      const res = await fetch("/api/worker/job/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          bookingId: booking.id,
          token: token,
          action: "accept"
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to accept job.");
      }

      // Update state to render the details & upload section
      setBooking((prev: any) => ({ ...prev, status: "ACCEPTED" }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to accept job.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!booking || !worker) return;
    setActionLoading(true);
    setError("");

    try {
      const res = await fetch("/api/worker/job/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          bookingId: booking.id,
          token: token,
          action: "reject",
          rejectReason: rejectReason.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reject job.");
      }

      setBooking((prev: any) => ({ ...prev, status: "REJECTED" }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to reject job.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        setError("File is too large. Maximum size allowed is 5MB.");
        return;
      }
      
      if (!file.type.startsWith("image/")) {
        setError("Invalid file type. Please upload an image file (PNG, JPG, WEBP).");
        return;
      }

      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleCompleteJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !worker) return;
    if (!photoFile) {
      setError("Please upload a completion photo as proof of service completion.");
      return;
    }

    setActionLoading(true);
    setError("");
    setPhotoLoading(true);

    try {
      // Compress completion photo to max 360x360 pixels to keep base64 string size small
      const base64Photo = await compressImageToBase64(photoFile, 360, 360);

      // Call secure server action API to mark job completed bypassing client SDK rules
      const res = await fetch("/api/worker/job/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          bookingId: booking.id,
          token: token,
          action: "complete",
          completionPhotoUrl: base64Photo
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit completion.");
      }

      setBooking((prev: any) => ({ ...prev, status: "COMPLETED", completionPhotoUrl: base64Photo }));
    } catch (err: any) {
      console.error("Completion failed:", err);
      setError(err.message || "Failed to finalize job completion.");
    } finally {
      setActionLoading(false);
      setPhotoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-bold text-muted-foreground">Synchronizing job details...</div>
        </div>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <XCircle className="w-16 h-16 text-destructive animate-pulse" />
        <h1 className="text-3xl font-black">Unauthorized link</h1>
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
          This dispatch parameters are invalid, expired, or you do not have permission to access them. Please contact platform operations.
        </p>
      </div>
    );
  }

  const serviceDetails = SERVICES_LIST.find((s) => s.id === booking?.serviceType);

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#333333] py-12 px-6 font-sans">
      <div className="max-w-xl mx-auto space-y-8">
        
        {/* Logo and Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-zinc-200 rounded-xl shadow-sm">
            <img src="/logo.png" alt="ServeGo" className="w-6 h-6 object-contain" />
            <span className="text-sm font-black tracking-tight uppercase text-black font-mono">ServeGo</span>
          </div>
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Secure Partner Dispatch Network</p>
        </div>

        {/* Unified Card Container */}
        <div className="bg-white border border-zinc-200/80 rounded-3xl shadow-xl overflow-hidden">
          
          <div className="bg-zinc-50 border-b border-zinc-200 p-6 flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest block">Service Job Portal</span>
              <h2 className="text-xl font-black text-black">{serviceDetails?.name || booking?.serviceType}</h2>
            </div>
            <span className={`px-2.5 py-1 text-[9px] font-black rounded-full uppercase tracking-wider ${
              booking?.status === "ASSIGNED" ? "bg-amber-100 text-amber-700" :
              booking?.status === "ACCEPTED" ? "bg-blue-100 text-blue-700" :
              booking?.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
              "bg-zinc-100 text-zinc-600"
            }`}>
              {booking?.status}
            </span>
          </div>

          <div className="p-6 space-y-6">
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* FLOW 1: Awaiting Acceptance */}
            {booking?.status === "ASSIGNED" && (
              <div className="space-y-6">
                <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 text-sm space-y-3">
                  <h3 className="font-bold text-black border-b border-zinc-200 pb-2">📋 Job Parameters</h3>
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-zinc-400" /> <strong>Area:</strong> {booking?.customerArea}</p>
                  <p className="flex items-start gap-2"><FileText className="w-4 h-4 text-zinc-400 mt-0.5" /> <span><strong>Job Description:</strong> {booking?.description}</span></p>
                </div>

                {!showRejectForm ? (
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      onClick={handleAccept}
                      disabled={actionLoading}
                      className="w-full py-4 bg-[#C46A4A] hover:bg-[#B35939] text-white font-bold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                      {actionLoading ? "Processing assignment..." : "Accept Job (Reveal Details)"}
                    </button>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={actionLoading}
                      className="w-full py-3 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 font-bold rounded-xl border border-zinc-200 transition-colors text-xs"
                    >
                      Reject Job
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-2 border-t border-zinc-200">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-600 block">Reason for Rejection</label>
                      <textarea
                        required
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Please state the reason (e.g. Schedule conflicts, distant area, etc.)"
                        className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-xs resize-none focus:outline-none focus:border-zinc-400 transition-all"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleReject}
                        disabled={actionLoading || !rejectReason.trim()}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-colors disabled:opacity-50"
                      >
                        Submit Rejection
                      </button>
                      <button
                        onClick={() => setShowRejectForm(false)}
                        className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FLOW 2: Accepted & Active (Upload Proof UI) */}
            {booking?.status === "ACCEPTED" && (
              <div className="space-y-6">
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 text-sm space-y-3">
                  <h3 className="font-bold text-blue-900 border-b border-blue-200 pb-2">📞 Customer Contact & Address</h3>
                  <p className="flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /> <strong>Customer Name:</strong> {booking?.customerName}</p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-500" /> 
                    <strong>Mobile Number:</strong> 
                    <a href={`tel:${booking?.customerMobile}`} className="text-blue-600 hover:underline font-bold font-mono">
                      {booking?.customerMobile}
                    </a>
                  </p>
                  <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-blue-500 mt-0.5" /> <span><strong>Complete Address:</strong> {booking?.customerAddress}, {booking?.customerArea}</span></p>
                  <p className="flex items-start gap-2"><FileText className="w-4 h-4 text-blue-500 mt-0.5" /> <span><strong>Job Description:</strong> {booking?.description}</span></p>
                </div>

                <div className="border-t border-zinc-200 pt-6">
                  <h3 className="text-base font-bold text-black mb-4">📸 Submit Work Completion Proof</h3>
                  
                  <form onSubmit={handleCompleteJob} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 block">UPLOAD SCREENSHOT OR AFTER-WORK PHOTO</label>
                      
                      {photoPreview ? (
                        <div className="relative border border-zinc-200 rounded-2xl overflow-hidden aspect-video bg-zinc-50 flex items-center justify-center">
                          <img src={photoPreview} alt="Work preview" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => { setPhotoFile(null); setPhotoPreview(""); }}
                            className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 backdrop-blur border border-zinc-200 rounded-xl text-xs font-bold hover:bg-white transition-all shadow-md"
                          >
                            Remove Photo
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center bg-zinc-50 hover:bg-zinc-100/50 transition-all relative">
                          <input
                            type="file"
                            accept="image/*"
                            required
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <div className="space-y-3">
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto">
                              <Camera className="w-5 h-5 text-[#C46A4A]" />
                            </div>
                            <div>
                              <p className="text-xs font-bold">Tap to capture or upload completed work photo</p>
                              <p className="text-[10px] text-zinc-500 mt-0.5">Supports PNG, JPG, or HEIC images up to 5MB</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading || photoLoading || !photoFile}
                      className="w-full py-4 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/95 shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {photoLoading ? "Uploading & Compressing..." : actionLoading ? "Finalizing..." : "Submit Job Completion"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* FLOW 3: Already Completed */}
            {booking?.status === "COMPLETED" && (
              <div className="text-center py-6 space-y-6 animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-black">Job Completed Successfully!</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed px-4">
                    Outstanding work! The completion proof has been uploaded. The customer will now receive a link to submit their review. Your activity stats have been updated.
                  </p>
                </div>
              </div>
            )}

            {/* FLOW 4: Rejected */}
            {booking?.status === "REJECTED" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black">Job Rejected</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    You have rejected this job assign. It has been released and sent back to dispatch for manual reallocation.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="flex items-center gap-2 justify-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-[#C46A4A]" /> Secure Partner Network. Anti-fraud logging active.
        </div>
      </div>
    </div>
  );
}
