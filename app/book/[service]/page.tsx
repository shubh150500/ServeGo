"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { SERVICES_LIST } from "@/lib/services";
import ServiceIcon from "@/components/ServiceIcon";
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from "firebase/firestore";
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
  
  // App UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [newBookingId, setNewBookingId] = useState("");
  const [copied, setCopied] = useState(false);

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
        <header className="border-b border-border/60 py-6 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="ServeGo Logo" className="w-8 h-8 rounded-lg object-contain" />
              <span className="text-xl font-black tracking-tighter text-black">
                ServeGo
              </span>
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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
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
      // Ensure Razorpay SDK script is fully loaded
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      // 1. Create order on the serverless API
      const orderResponse = await fetch("/api/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: service.assuranceFee,
          serviceId: service.id,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || "Failed to create payment order ID");
      }

      const orderId = orderData.id;

      // 2. Open Razorpay Checkout Modal
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

            // 3. Verify signature on the serverless API
            const verifyResponse = await fetch("/api/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.verified) {
              throw new Error(verifyData.error || "Payment signature verification failed");
            }

            // 4. Create Firestore records inside a Transaction/Batch
            const secureToken = generateSecurityToken();

            // Create Booking document
            const bookingDoc: any = {
              customerName: name,
              customerMobile: mobile,
              customerAddress: address,
              customerArea: area.toLowerCase().trim(),
              serviceType: service.id,
              description: description,
              status: "NEW",
              securityToken: secureToken,
              assuranceFeePaid: true,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };

            if (partnerId) {
              bookingDoc.selectedPartnerId = partnerId;
              bookingDoc.assignedPartnerId = "";
              bookingDoc.assignedPartnerType = service.type || "";
            }

            const bookingRef = await addDoc(collection(db, "bookings"), bookingDoc);

            // Create Payment document
            const paymentDoc = {
              bookingId: bookingRef.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              amount: service.assuranceFee,
              customerId: "", // guest checkout
              status: "captured",
              createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "payments"), paymentDoc);

            // Create Customer record if not exists
            const customerDoc = {
              name: name,
              mobile: mobile,
              createdAt: serverTimestamp(),
            };
            await addDoc(collection(db, "customers"), customerDoc);

            // Show success UI
            setNewBookingId(bookingRef.id);
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

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      
      {/* Load Razorpay script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <header className="border-b border-border/60 py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href={`/services/${service.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Service
          </Link>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="ServeGo Logo" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-xl font-black tracking-tighter text-black">
              ServeGo
            </span>
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

            <div className="bg-card border border-border/80 p-8 rounded-3xl shadow-lg space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-6">
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

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground/80">Description of Work / Issue</label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what needs to be fixed or installed in detail (e.g. 3 ceiling fans replacement and check light switch box)"
                    className="w-full px-4 py-3 bg-muted/40 border border-border/85 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm resize-none"
                  />
                </div>

                <div className="border-t border-border/60 pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1 text-center md:text-left">
                    <span className="text-sm font-semibold text-muted-foreground block">Payable Assurance Fee</span>
                    <span className="text-3xl font-black text-foreground">₹{service.assuranceFee}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 w-full md:w-auto cursor-pointer"
                  >
                    <CreditCard className="w-5 h-5" />
                    {loading ? "Processing Payment..." : `Pay Assurance Fee`}
                  </button>
                </div>
              </form>
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
