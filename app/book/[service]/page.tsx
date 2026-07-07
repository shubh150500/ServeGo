"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SERVICES_LIST } from "@/lib/services";
import ServiceIcon from "@/components/ServiceIcon";
import ThemeToggle from "@/components/ThemeToggle";
import { collection, addDoc, serverTimestamp, doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, CreditCard, ShieldCheck, AlertCircle, CheckCircle, Copy, Check } from "lucide-react";

interface PageProps {
  params: Promise<{ service: string }>;
}

export default function BookServicePage({ params }: PageProps) {
  const router = useRouter();

  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const serviceId = unwrappedParams.service;

  const [service, setService] = useState<any | null>(null);
  const [loadingService, setLoadingService] = useState(true);

  const searchParams = useSearchParams();
  const partnerId = searchParams?.get("partnerId") || "";
  const [partner, setPartner] = useState<any | null>(null);
  const [toggles, setToggles] = useState<any>({
    localPartnerServicesEnabled: false,
    vehicleRentalEnabled: false
  });

  useEffect(() => {
    if (!serviceId) return;

    // Subscribe to service details
    const unsubService = onSnapshot(
      doc(db, "services", serviceId),
      (docSnap) => {
        let currentService: any = null;
        if (docSnap.exists()) {
          currentService = docSnap.data();
        } else {
          const staticS = SERVICES_LIST.find((s) => s.id === serviceId);
          if (staticS) currentService = staticS;
        }
        setService(currentService);
        setLoadingService(false);
      },
      (err) => {
        console.error("Firestore booking service subscription failed:", err);
        setLoadingService(false);
      }
    );

    // Subscribe to toggles
    const unsubToggles = onSnapshot(
      doc(db, "system_config", "toggles"),
      (docSnap) => {
        if (docSnap.exists()) {
          setToggles(docSnap.data());
        }
      },
      (err) => console.error("Toggles sub failed:", err)
    );

    return () => {
      unsubService();
      unsubToggles();
    };
  }, [serviceId]);

  // Subscribe to selected partner details
  useEffect(() => {
    if (!partnerId || !service || !service.type) return;

    const collectionName = service.type === "partner" ? "shops" : "vehicles";
    const unsubPartner = onSnapshot(
      doc(db, collectionName, partnerId),
      (docSnap) => {
        if (docSnap.exists()) {
          setPartner({ id: docSnap.id, ...docSnap.data() });
        }
      },
      (err) => console.error("Selected partner sub failed:", err)
    );

    return () => unsubPartner();
  }, [partnerId, service]);

  // Form State
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  
  // Wizard & Promo state enhancements
  const [step, setStep] = useState(1);
  const [bookingDate, setBookingDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [bookingTimeSlot, setBookingTimeSlot] = useState("Morning (9 AM - 12 PM)");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");

  // App UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [newBookingId, setNewBookingId] = useState("");
  const [copied, setCopied] = useState(false);
  const [rzpLoaded, setRzpLoaded] = useState(false);
  const [diagError, setDiagError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ((window as any).Razorpay) {
        setRzpLoaded(true);
        return;
      }
      
      const script = document.createElement("script");
      script.src = "/razorpay-checkout.js";
      script.async = true;
      script.onload = () => {
        setRzpLoaded(true);
      };
      script.onerror = () => {
        setDiagError("Checkout script blocked or failed to load. Check adblockers/network.");
      };
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);

  // Recover from page reloads during mobile UPI app redirect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pendingBookingId = localStorage.getItem("pending_booking_id");
      const pendingOrderId = localStorage.getItem("pending_order_id");

      if (pendingBookingId && pendingOrderId) {
        setLoading(true);
        setError("");

        fetch("/api/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "check_order",
            order_id: pendingOrderId,
            booking_id: pendingBookingId,
          }),
        })
          .then(async (res) => {
            const data = await res.json();
            if (res.ok && data.verified) {
              localStorage.removeItem("pending_booking_id");
              localStorage.removeItem("pending_order_id");
              setNewBookingId(pendingBookingId);
              setBookingSuccess(true);
            } else {
              console.log("Staged checkout check: unpaid or failed.", data.error);
              localStorage.removeItem("pending_booking_id");
              localStorage.removeItem("pending_order_id");
            }
          })
          .catch((err) => {
            console.error("Error during recovery verification:", err);
            localStorage.removeItem("pending_booking_id");
            localStorage.removeItem("pending_order_id");
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, []);

  // Interest registration form state
  const [interestName, setInterestName] = useState("");
  const [interestMobile, setInterestMobile] = useState("");
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestSuccess, setInterestSuccess] = useState(false);

  const handleInterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interestName.trim() || !interestMobile.trim() || !service) return;

    setInterestLoading(true);
    try {
      await addDoc(collection(db, "launch_interests"), {
        name: interestName.trim(),
        mobile: interestMobile.trim(),
        serviceId: service.id,
        serviceName: service.name,
        createdAt: serverTimestamp()
      });
      setInterestSuccess(true);
    } catch (err) {
      console.error("Failed to submit launch interest:", err);
    } finally {
      setInterestLoading(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(newBookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loadingService) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground text-sm font-semibold mt-4">Loading service details...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <h1 className="text-4xl font-black">Service Not Found</h1>
        <p className="text-muted-foreground max-w-md">
          The service category you requested does not exist.
        </p>
        <Link href="/" className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl">
          Back to Homepage
        </Link>
      </div>
    );
  }

  const isGated = 
    service && (
      (service.type === "partner" && !toggles.localPartnerServicesEnabled) ||
      (service.type === "vehicle" && !toggles.vehicleRentalEnabled)
    );

  if (isGated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
        <header className="border-b border-border/60 py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
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
        </header>

        <main className="flex-1 max-w-lg w-full mx-auto px-6 py-12 flex flex-col justify-center space-y-8">
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <ServiceIcon name={service.iconName} className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">{service.name}</h1>
            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400 text-xs font-bold rounded-full uppercase tracking-wider">
              Coming Soon
            </span>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We are working hard to onboard top-rated local partners and launch {service.name} services in your area. Enter your details below to get notified as soon as we go live!
            </p>
          </div>

          {interestSuccess ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-6 rounded-2xl text-center space-y-3 animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <h4 className="font-bold text-emerald-900 dark:text-emerald-300">Interest Registered!</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                Thank you! We will alert you on WhatsApp/SMS once our services become operational.
              </p>
              <Link
                href="/"
                className="inline-block mt-4 px-6 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-md transition-all"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleInterestSubmit} className="bg-card border border-border/80 p-6 rounded-3xl shadow-xl space-y-4">
              <h3 className="font-bold text-lg text-foreground">Launch Notification Request</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80">Full Name</label>
                <input
                  type="text"
                  required
                  value={interestName}
                  onChange={(e) => setInterestName(e.target.value)}
                  placeholder="e.g. Amit Patel"
                  className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm focus:bg-background transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/80">WhatsApp Number</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  title="Please enter a will enter 10-digit mobile number."
                  value={interestMobile}
                  onChange={(e) => setInterestMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm focus:bg-background transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={interestLoading || !interestName.trim() || interestMobile.length !== 10}
                className="w-full py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/95 shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {interestLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Keep Me Posted</span>
                )}
              </button>
            </form>
          )}
        </main>

        <footer className="border-t border-border/60 py-6 px-6 text-center text-xs text-muted-foreground bg-muted/10">
          © {new Date().getFullYear()} ServeGo. All rights reserved.
        </footer>
      </div>
    );
  }

  // Generate a random secure token for the worker accept/reject pages
  const generateSecurityToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !mobile.trim() || !address.trim() || !area.trim() || !description.trim()) {
      setError("Please fill out all the fields before proceeding to payment.");
      return;
    }

    if (mobile.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    try {
      // Ensure Razorpay SDK is loaded on the window, with a forceful fallback injector
      if (!(window as any).Razorpay && !rzpLoaded) {
        throw new Error("Razorpay payment gateway is still loading. Please wait a moment and try again.");
      }

      // 1. Create order on the serverless API
      const payableAmount = Math.max(1, service.assuranceFee - discount);
      const orderResponse = await fetch("/api/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: payableAmount,
          serviceId: service.id,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || "Failed to create payment order ID");
      }

      const orderId = orderData.id;

      // 2. Create Booking document in Firestore with INITIATED status
      const secureToken = generateSecurityToken();
      const bookingDoc: any = {
        customerName: name,
        customerMobile: mobile,
        customerAddress: address,
        customerArea: area.toLowerCase().trim(),
        serviceType: service.id,
        description: description,
        bookingDate: bookingDate,
        bookingTimeSlot: bookingTimeSlot,
        appliedPromoCode: promoCode || "",
        appliedDiscountAmount: discount,
        status: "INITIATED",
        securityToken: secureToken,
        assuranceFeePaid: false,
        razorpayOrderId: orderId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (partnerId) {
        bookingDoc.selectedPartnerId = partnerId;
        bookingDoc.assignedPartnerId = "";
        bookingDoc.assignedPartnerType = service.type || "";
      }

      // Generate professional booking ID starting with "SG" followed by 8 uppercase alphanumeric chars
      const generatedId = "SG" + Array.from({ length: 8 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join("");
      const bookingRef = doc(db, "bookings", generatedId);
      await setDoc(bookingRef, bookingDoc);
      const createdBookingId = generatedId;

      // Save references in localStorage to recover from page reloads during UPI redirect
      localStorage.setItem("pending_booking_id", createdBookingId);
      localStorage.setItem("pending_order_id", orderId);

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "ServeGo",
        description: `Service Assurance Fee - ${service.name}`,
        order_id: orderId,
        handler: async function (response: any) {
          // Razorpay callback success payload
          try {
            setLoading(true);

            // 4. Verify signature on the serverless API (this will finalize DB records and broadcast push alerts)
            const verifyResponse = await fetch("/api/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_id: createdBookingId,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.verified) {
              throw new Error(verifyData.error || "Payment signature verification failed");
            }

            // Clear pending booking references in localStorage
            localStorage.removeItem("pending_booking_id");
            localStorage.removeItem("pending_order_id");

            // Show success UI
            setNewBookingId(createdBookingId);
            setBookingSuccess(true);
          } catch (err: any) {
            console.error("Payment Verification/DB write error:", err);
            setError(err.message || "Failed to finalize booking record. Contact support.");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: name,
          contact: mobile,
        },
        theme: {
          color: "hsl(var(--primary))",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Booking Error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const downloadInvoice = () => {
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
    ctx.fillText(`Invoice No: SG-${newBookingId}`, 40, 140);
    ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, 40, 160);
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
    ctx.fillText(`Name: ${name}`, 40, 260);
    ctx.fillText(`Mobile: ${mobile}`, 40, 280);
    ctx.fillText(`Address: ${address}`, 40, 300);
    ctx.fillText(`Sector: ${area}`, 40, 320);

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
    ctx.fillText(`Service Name: ${service.name}`, 40, 400);
    ctx.fillText(`Preferred Date: ${bookingDate}`, 40, 420);
    ctx.fillText(`Preferred Slot: ${bookingTimeSlot}`, 40, 440);
    ctx.fillText(`Description: ${description || "General maintenance"}`, 40, 460);

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
    ctx.fillText(`Promo Discount (${promoCode || "None"}):`, 40, 565);
    
    ctx.textAlign = "right";
    ctx.fillText("₹99.00", 560, 540);
    ctx.fillText(`- ₹${discount.toFixed(2)}`, 560, 565);

    // Total highlight
    ctx.beginPath();
    ctx.moveTo(30, 595);
    ctx.lineTo(570, 595);
    ctx.stroke();

    ctx.font = "bold 15px sans-serif";
    ctx.fillText("Grand Total Paid:", 200, 625);
    ctx.fillText(`₹${(99 - discount).toFixed(2)}`, 560, 625);

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
    link.download = `ServeGo_Invoice_${newBookingId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      

      <header className="border-b border-border/60 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href={`/services/${service.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Service
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
      </header>

      <div className="max-w-3xl mx-auto px-6 py-16">
        {bookingSuccess ? (
          <div className="bg-card border border-border/70 p-8 md:p-12 rounded-3xl shadow-2xl space-y-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary animate-pulse">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight">Booking Confirmed!</h2>
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-semibold bg-muted/50 px-4 py-2 rounded-xl max-w-md mx-auto border border-border/60 mt-3">
                  <span>Booking ID:</span>
                  <span className="text-foreground font-mono font-bold select-all">{newBookingId}</span>
                  <button
                    onClick={handleCopyId}
                    type="button"
                    className="ml-2 p-1.5 hover:bg-muted-foreground/15 rounded-lg text-primary transition-colors cursor-pointer flex items-center justify-center"
                    title="Copy Booking ID"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Search Pulse Tracker */}
            <div className="bg-muted/40 border border-border/80 p-6 rounded-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30 animate-pulse" />
              
              <div className="flex items-center gap-4">
                {/* Blinking Green Dot */}
                <div className="relative flex h-4 w-4 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </div>
                <div>
                  <h4 className="font-bold text-base text-foreground">Matching Service Provider...</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Automated engine is scanning active partners in <span className="font-bold text-foreground capitalize">{area}</span></p>
                </div>
              </div>

              {/* Status Stepper */}
              <div className="space-y-4 border-t border-border/50 pt-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</div>
                  <span className="text-muted-foreground">Booking request registered successfully</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</div>
                  <span className="text-muted-foreground">Service assurance payment captured</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold animate-pulse">●</div>
                  <span className="font-semibold text-foreground">Assigning the highest-ranked {service.name} in your sector</span>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground text-center text-sm leading-relaxed max-w-lg mx-auto">
              Your {service.name.toLowerCase()} request is now active. Once the administrator confirms the assignment, the provider will contact you directly via WhatsApp or mobile.
            </p>

            <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl space-y-4 max-w-lg mx-auto text-center">
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-foreground flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Booking Invoice Ready
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed px-2">
                  Please download your autogenerated invoice receipt for future use. It contains your unique booking ID, payment confirmation details, and tracking codes.
                </p>
              </div>
              <button
                onClick={downloadInvoice}
                className="w-full py-3 bg-primary text-primary-foreground font-black text-xs rounded-xl shadow-md hover:bg-primary/95 flex items-center justify-center gap-2 cursor-pointer btn-press border-none"
              >
                <FileText className="w-4.5 h-4.5" /> Download Booking Invoice
              </button>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href={`/track/${newBookingId}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/30 transition-all duration-300 cursor-pointer"
              >
                Track Live Order Status
              </Link>
              <Link 
                href="/" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-border/80 hover:bg-muted font-bold rounded-xl transition-all duration-300 cursor-pointer"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                {service.imageUrl ? (
                  <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                ) : (
                  <ServiceIcon name={service.iconName} className="w-6 h-6" />
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                Schedule your {service.name}
              </h1>
              <p className="text-muted-foreground">
                Please provide accurate contact and location details. The assurance fee will lock in your schedule.
              </p>
            </div>

            {partner && (
              <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {service.type === "partner" ? "🏪" : "🚗"}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Selected Provider</span>
                    <h4 className="font-bold text-foreground">
                      {service.type === "partner" ? partner.name : partner.vehicleName}
                    </h4>
                    <p className="text-xs text-muted-foreground">{partner.area}</p>
                  </div>
                </div>
                {service.type === "vehicle" && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Rental Price</span>
                    <strong className="text-foreground text-sm">₹{partner.price}/Day</strong>
                  </div>
                )}
              </div>
            )}

            {/* Booking Wizard Steps Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                <span className={step >= 1 ? "text-primary font-black" : ""}>1. Details</span>
                <span className={step >= 2 ? "text-primary font-black" : ""}>2. Schedule</span>
                <span className={step >= 3 ? "text-primary font-black" : ""}>3. Contact</span>
                <span className={step >= 4 ? "text-primary font-black" : ""}>4. Confirm</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out" 
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-card border border-border/80 p-6 md:p-8 rounded-3xl shadow-lg space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/80">Description of Work / Issue</label>
                      <textarea
                        required
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what needs to be fixed or installed in detail (e.g. 3 ceiling fans replacement and check light switch box)"
                        className="w-full px-4 py-3 bg-muted/40 border border-border/85 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Please write in detail so the assigned worker can understand your requirements easily.</p>
                    </div>

                    <div className="pt-4 border-t border-border/40 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (!description.trim()) {
                            setError("Please enter a description of the work needed.");
                            return;
                          }
                          setError("");
                          setStep(2);
                        }}
                        className="px-6 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/95 shadow-md cursor-pointer"
                      >
                        Next: Choose Schedule
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80">Preferred Service Date</label>
                        <input
                          type="date"
                          required
                          value={bookingDate}
                          min={(() => {
                            const today = new Date();
                            const yyyy = today.getFullYear();
                            const mm = String(today.getMonth() + 1).padStart(2, '0');
                            const dd = String(today.getDate()).padStart(2, '0');
                            return `${yyyy}-${mm}-${dd}`;
                          })()}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full px-4 py-3 bg-muted/40 border border-border/85 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80">Select Preferred Time Slot</label>
                        <div className="grid grid-cols-1 gap-2.5">
                          {[
                            "Morning (9 AM - 12 PM)",
                            "Afternoon (12 PM - 3 PM)",
                            "Evening (3 PM - 6 PM)",
                            "Night (6 PM - 9 PM)"
                          ].map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setBookingTimeSlot(slot)}
                              className={`w-full px-4 py-3 text-left rounded-xl border text-sm font-semibold transition-all flex justify-between items-center ${
                                bookingTimeSlot === slot
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/80 hover:bg-muted text-foreground"
                              }`}
                            >
                              <span>{slot}</span>
                              {bookingTimeSlot === slot && <span className="text-xs">✓</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/40 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-6 py-3 border border-border hover:bg-muted text-foreground font-bold text-sm rounded-xl cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!bookingDate) {
                            setError("Please pick a preferred date.");
                            return;
                          }
                          setError("");
                          setStep(3);
                        }}
                        className="px-6 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/95 shadow-md cursor-pointer"
                      >
                        Next: Contact Details
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80">Full Name</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Amit Sharma"
                          className="w-full px-4 py-3 bg-muted/40 border border-border/85 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80">WhatsApp Contact Number</label>
                        <input
                          type="tel"
                          required
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full px-4 py-3 bg-muted/40 border border-border/85 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-bold text-foreground/80">Complete Address</label>
                        <input
                          type="text"
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Flat, building name, street address"
                          className="w-full px-4 py-3 bg-muted/40 border border-border/85 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80">Area / City Sector</label>
                        <input
                          type="text"
                          required
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          placeholder="e.g. Sector 62"
                          className="w-full px-4 py-3 bg-muted/40 border border-border/85 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/40 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-6 py-3 border border-border hover:bg-muted text-foreground font-bold text-sm rounded-xl cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!name.trim() || !mobile.trim() || !address.trim() || !area.trim()) {
                            setError("Please fill out all contact fields.");
                            return;
                          }
                          if (mobile.length !== 10) {
                            setError("Please enter a valid 10-digit mobile number.");
                            return;
                          }
                          setError("");
                          setStep(4);
                        }}
                        className="px-6 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/95 shadow-md cursor-pointer"
                      >
                        Next: Review & Confirm
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Booking Review Summary Card */}
                    <div className="bg-muted/40 border border-border/60 p-5 rounded-2xl space-y-4 text-sm">
                      <h4 className="font-black text-foreground uppercase tracking-wider text-xs">Booking Summary</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground block">Customer Name</span>
                          <span className="font-semibold text-foreground">{name}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">WhatsApp Number</span>
                          <span className="font-semibold text-foreground">{mobile}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Scheduled Date</span>
                          <span className="font-semibold text-foreground">{bookingDate}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Preferred Time</span>
                          <span className="font-semibold text-foreground">{bookingTimeSlot}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-muted-foreground block">Service Location</span>
                          <span className="font-semibold text-foreground">{address}, {area}</span>
                        </div>
                      </div>
                    </div>

                    {/* Promo Code Fields */}
                    <div className="space-y-2 border-t border-border/40 pt-5">
                      <label className="text-xs font-bold text-foreground/80 block">Apply Coupon / Promo Code</label>
                      <div className="flex gap-2.5">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="e.g. AUBR50"
                          disabled={couponApplied}
                          className="flex-1 px-4 py-3 bg-muted/40 border border-border/85 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm uppercase font-mono font-bold"
                        />
                        {couponApplied ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDiscount(0);
                              setPromoCode("");
                              setCouponApplied(false);
                            }}
                            className="px-4 py-3 border border-border hover:bg-muted text-sm font-bold text-destructive rounded-xl cursor-pointer"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setCouponError("");
                              const code = promoCode.trim().toUpperCase();
                              if (code === "AUBR50") {
                                setDiscount(Math.floor(service.assuranceFee * 0.5));
                                setCouponApplied(true);
                              } else if (code === "") {
                                setCouponError("Please type a promo code first.");
                              } else {
                                setCouponError("Invalid coupon code");
                                setDiscount(0);
                                setCouponApplied(false);
                              }
                            }}
                            className="px-5 py-3 bg-secondary text-primary border border-border/60 hover:bg-secondary/80 text-sm font-bold rounded-xl cursor-pointer"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                      
                      {couponApplied && (
                        <p className="text-xs text-emerald-500 font-semibold">✓ Coupon applied successfully! Discount of ₹{discount} is applied.</p>
                      )}
                      {couponError && (
                        <p className="text-xs text-destructive font-semibold">⚠ {couponError}</p>
                      )}
                      
                      <div className="bg-primary/5 p-3.5 rounded-xl border border-primary/20 flex justify-between text-xs mt-2 text-muted-foreground">
                        <span>Use launch coupon <span className="font-mono font-bold text-primary animate-pulse">AUBR50</span> to get 50% discount!</span>
                      </div>
                    </div>

                    {/* Cost Breakdown & Pay Button */}
                    <form onSubmit={handleBookingSubmit} className="space-y-6 border-t border-border/40 pt-5">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Assurance Fee</span>
                          <span>₹{service.assuranceFee}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-sm text-emerald-500 font-semibold">
                            <span>Coupon Discount</span>
                            <span>-₹{discount}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-end pt-2 border-t border-border/30">
                          <span className="text-sm font-semibold text-muted-foreground block">Payable Assurance Fee</span>
                          <strong className="text-3xl font-black text-foreground">₹{Math.max(1, service.assuranceFee - discount)}</strong>
                        </div>
                      </div>

                      <div className="flex justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => setStep(3)}
                          className="px-6 py-4 border border-border hover:bg-muted text-foreground font-bold text-sm rounded-xl cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 group inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                        >
                          <CreditCard className="w-5 h-5" />
                          {loading ? "Processing Payment..." : `Pay Assurance Fee`}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary" /> Secure payment gateway by Razorpay. Money is held in trust.
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
