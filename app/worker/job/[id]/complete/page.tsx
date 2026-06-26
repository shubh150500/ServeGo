"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { SERVICES_LIST } from "@/lib/services";
import confetti from "canvas-confetti";
import { promiseWithTimeout, compressImageToBase64 } from "@/lib/utils";
import { CheckCircle2, Upload, AlertCircle, Camera, ChevronLeft, ArrowRight, ShieldCheck } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkerCompleteJobPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const bookingId = unwrappedParams.id;

  // State
  const [booking, setBooking] = useState<any | null>(null);
  const [worker, setWorker] = useState<any | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Upload Photo State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

      // Fetch booking
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      const bookingData = bookingSnap.data();

      // Security check: Verify token
      if (bookingData.securityToken !== token) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setBooking({ id: bookingSnap.id, ...bookingData });
      setAuthorized(true);

      // Fetch worker
      if (bookingData.assignedWorkerId) {
        const workerSnap = await getDoc(doc(db, "workers", bookingData.assignedWorkerId));
        if (workerSnap.exists()) {
          setWorker({ id: workerSnap.id, ...workerSnap.data() });
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Error synchronizing with platform. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File is too large. Maximum size allowed is 5MB.");
        return;
      }
      
      // Check file type (must be an image)
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
      let downloadUrl = "";

      // 1. Upload photo to Firebase Storage (with a 5-second timeout and Base64 fallback)
      try {
        const storageRef = ref(storage, `completions/${booking.id}/${photoFile.name}`);
        const uploadResult = await promiseWithTimeout(
          uploadBytes(storageRef, photoFile),
          5000,
          "Storage upload timed out"
        );
        downloadUrl = await promiseWithTimeout(
          getDownloadURL(uploadResult.ref),
          4000,
          "Fetching download URL timed out"
        );
      } catch (uploadErr) {
        console.warn("Firebase Storage failed or timed out. Falling back to compressed Base64 stored in Firestore:", uploadErr);
        // Compress completion photo to max 360x360 pixels to keep it small in Firestore (< 30KB)
        downloadUrl = await compressImageToBase64(photoFile, 360, 360);
      }

      setPhotoLoading(false);

      // 2. Perform Firestore update transaction
      const bookingRef = doc(db, "bookings", booking.id);
      const workerRef = doc(db, "workers", worker.id);

      await runTransaction(db, async (transaction) => {
        const bSnap = await transaction.get(bookingRef);
        const wSnap = await transaction.get(workerRef);

        if (!bSnap.exists() || !wSnap.exists()) {
          throw new Error("Database records missing.");
        }

        const bData = bSnap.data();
        if (bData.status !== "ACCEPTED") {
          throw new Error(`Job status is ${bData.status}. Only ACCEPTED jobs can be completed.`);
        }

        const currentCompleted = wSnap.data().totalCompletedJobs || 0;

        transaction.update(bookingRef, {
          status: "COMPLETED",
          completionPhotoUrl: downloadUrl,
          updatedAt: serverTimestamp(),
        });

        transaction.update(workerRef, {
          totalCompletedJobs: currentCompleted + 1,
          lastActivity: serverTimestamp(),
        });
      });

      // Fire confetti celebration!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      setSuccess(true);
      setBooking((prev: any) => ({ ...prev, status: "COMPLETED", completionPhotoUrl: downloadUrl }));
    } catch (err: any) {
      console.error("Completion update failed:", err);
      setError(err.message || "Failed to finalize job completion.");
    } finally {
      setActionLoading(false);
      setPhotoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-lg font-bold">Synchronizing job parameters...</div>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <AlertCircle className="w-16 h-16 text-destructive" />
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
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href={`/worker/job/${bookingId}/accept?token=${token}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to details
          </Link>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="ServeGo Logo" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-xl font-black tracking-tighter text-black">
              ServeGo
            </span>
          </div>
        </div>

        {success || booking?.status === "COMPLETED" ? (
          <div className="bg-card border border-border/85 p-8 md:p-12 rounded-3xl text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black">Job Completed!</h2>
              <p className="text-muted-foreground text-sm font-medium">
                Booking ID: <span className="text-foreground font-mono font-bold">{bookingId}</span>
              </p>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
              Outstanding work! The completion proof has been uploaded. The customer will now receive a link to submit their review. Your activity metrics have been updated.
            </p>
            <div className="pt-4 border-t border-border/60">
              <Link 
                href={`/review/${booking.id}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                Go to Review Page (Self-test) <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border/80 rounded-3xl shadow-xl overflow-hidden">
            
            <div className="bg-primary/5 border-b border-border/60 p-6">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Submit Completion Proof</span>
              <h2 className="text-2xl font-black text-foreground">{serviceDetails?.name || booking?.serviceType} Service</h2>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="bg-muted/30 p-5 rounded-2xl border border-border/60 text-sm space-y-2">
                <p><strong>Customer Name:</strong> {booking?.customerName}</p>
                <p><strong>Service Location:</strong> {booking?.customerAddress}, {booking?.customerArea}</p>
                <p><strong>Work description:</strong> {booking?.description}</p>
              </div>

              <form onSubmit={handleCompleteJob} className="space-y-6">
                
                {/* Photo Upload Box */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground/80 block">Upload After-Work Photo</label>
                  
                  {photoPreview ? (
                    <div className="relative border border-border/80 rounded-2xl overflow-hidden aspect-video bg-muted/20 flex items-center justify-center">
                      <img src={photoPreview} alt="Work preview" className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => { setPhotoFile(null); setPhotoPreview(""); }}
                        className="absolute bottom-4 right-4 px-4 py-2 bg-background/80 backdrop-blur border border-border/65 rounded-xl text-xs font-bold hover:bg-background transition-all"
                      >
                        Remove Photo
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border/80 rounded-2xl p-8 text-center bg-muted/10 hover:bg-muted/20 transition-all relative">
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Tap to capture or upload completed work photo</p>
                          <p className="text-xs text-muted-foreground mt-1">Supports PNG, JPG, or HEIC images up to 5MB</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border/60">
                  <button
                    type="submit"
                    disabled={actionLoading || photoLoading || !photoFile}
                    className="w-full py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:bg-primary/95 shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {photoLoading ? "Uploading Image..." : actionLoading ? "Finalizing..." : "Submit Job Completion"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary" /> Verified submission records. Anti-fraud checks enabled.
        </div>
      </div>
    </div>
  );
}
