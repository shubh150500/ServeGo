"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc, runTransaction, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SERVICES_LIST } from "@/lib/services";
import { Star, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerReviewPage({ params }: PageProps) {
  const router = useRouter();

  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const bookingId = unwrappedParams.id;

  // State
  const [booking, setBooking] = useState<any | null>(null);
  const [worker, setWorker] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Review Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    setLoading(true);
    setError("");
    try {
      if (!bookingId) {
        setLoading(false);
        return;
      }

      // Fetch booking
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        setError("Invalid Booking ID. Could not find service details.");
        setLoading(false);
        return;
      }

      const bookingData = bookingSnap.data();
      setBooking({ id: bookingSnap.id, ...bookingData });

      // Fetch assigned worker details
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !worker) return;
    if (!reviewText.trim()) {
      setError("Please write a brief feedback review message.");
      return;
    }

    setSubmitLoading(true);
    setError("");

    try {
      const workerRef = doc(db, "workers", worker.id);

      // Submit review and update worker rating in a Transaction
      await runTransaction(db, async (transaction) => {
        const wSnap = await transaction.get(workerRef);

        if (!wSnap.exists()) {
          throw new Error("Worker profile no longer exists on database.");
        }

        const wData = wSnap.data();
        const currentRating = wData.rating || 5.0;
        const currentReviewsCount = wData.totalReviews || 0;

        // Formula: New average rating = ((currentRating * currentReviewsCount) + newRating) / (currentReviewsCount + 1)
        const newReviewsCount = currentReviewsCount + 1;
        const newAverageRating = 
          ((currentRating * currentReviewsCount) + rating) / newReviewsCount;

        // Round to 2 decimal places
        const roundedRating = Math.round(newAverageRating * 100) / 100;

        transaction.update(workerRef, {
          rating: roundedRating,
          totalReviews: newReviewsCount,
          lastActivity: serverTimestamp(),
        });
      });

      // Add review document to reviews collection
      await addDoc(collection(db, "reviews"), {
        bookingId: booking.id,
        workerId: worker.id,
        customerName: booking.customerName || "Anonymous",
        rating: rating,
        reviewText: reviewText,
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
    } catch (err: any) {
      console.error("Failed to submit review:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-lg font-bold">Synchronizing review parameters...</div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <AlertCircle className="w-16 h-16 text-destructive" />
        <h1 className="text-3xl font-black">Review Unavailable</h1>
        <p className="text-muted-foreground max-w-md">{error}</p>
        <Link href="/" className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl">
          Back to Home
        </Link>
      </div>
    );
  }

  const serviceDetails = SERVICES_LIST.find(s => s.id === booking?.serviceType);

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-6 selection:bg-primary/20">
      <div className="max-w-xl mx-auto space-y-8">
        
        {/* Logo Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <img src="/logo.png" alt="ServeGo Logo" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-2xl font-black tracking-tighter text-black">
              ServeGo
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Customer Experience Platform</p>
        </div>

        {success ? (
          <div className="bg-card border border-border/85 p-8 md:p-12 rounded-3xl text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black">Feedback Received!</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Thank you for sharing your experience. Your rating and comments have been registered and will help us match top-performing workers for future service requests.
            </p>
            <div className="pt-4 border-t border-border/60">
              <Link href="/" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/30 transition-all duration-300">
                Back to Home <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border/80 rounded-3xl shadow-xl overflow-hidden">
            
            <div className="bg-primary/5 border-b border-border/60 p-6 text-center space-y-2">
              <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                Rate Your Professional
              </span>
              <h2 className="text-2xl font-black text-foreground">
                How was your {serviceDetails?.name || booking?.serviceType} service?
              </h2>
              {worker && (
                <p className="text-muted-foreground text-sm">
                  Service performed by <strong className="text-foreground">{worker.name}</strong>
                </p>
              )}
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-8">
                
                {/* Star rating selector */}
                <div className="space-y-3 text-center">
                  <label className="text-sm font-bold text-foreground/80 block uppercase tracking-wider">Overall Rating</label>
                  <div className="flex justify-center items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 focus:outline-none transition-all duration-150 hover:scale-125 cursor-pointer text-amber-400"
                      >
                        <Star 
                          className="w-10 h-10" 
                          fill={star <= (hoverRating || rating) ? "currentColor" : "transparent"} 
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">
                    {rating === 1 && "Extremely Poor"}
                    {rating === 2 && "Unsatisfactory"}
                    {rating === 3 && "Average Work"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Outstanding Service!"}
                  </span>
                </div>

                {/* Written review */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground/80">Share Your Experience</label>
                  <textarea
                    required
                    rows={4}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write a brief comment about the quality of service, timeliness, and behavior..."
                    className="w-full px-4 py-3 bg-muted/40 border border-border/85 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitLoading || !reviewText.trim()}
                  className="w-full py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:bg-primary/95 shadow-lg transition-all duration-300 disabled:opacity-50 cursor-pointer"
                >
                  {submitLoading ? "Submitting Review..." : "Submit Star Feedback"}
                </button>

              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
