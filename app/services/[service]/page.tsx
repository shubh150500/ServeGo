"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SERVICES_LIST } from "@/lib/services";
import ServiceIcon from "@/components/ServiceIcon";
import { Check, HelpCircle, ArrowLeft, ArrowRight, Star, Phone, MapPin, X, Clock } from "lucide-react";
import { doc, onSnapshot, collection, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";

interface PageProps {
  params: Promise<{ service: string }>;
}

export default function ServicePage({ params }: PageProps) {
  const router = useRouter();
  
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const serviceId = unwrappedParams.service;

  const [service, setService] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggles, setToggles] = useState<any>({
    localPartnerServicesEnabled: false,
    vehicleRentalEnabled: false
  });
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);

  // Interest Form State for gated services
  const [interestName, setInterestName] = useState("");
  const [interestMobile, setInterestMobile] = useState("");
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestSuccess, setInterestSuccess] = useState(false);

  useEffect(() => {
    if (!serviceId) return;

    // 1. Subscribe to service details
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
        setLoading(false);
      },
      (err) => {
        console.error("Firestore service details subscription failed:", err);
        setLoading(false);
      }
    );

    // 2. Subscribe to toggles
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

  // 3. Query partners in real-time when service details load
  useEffect(() => {
    if (!service || !service.type) return;

    let q;
    if (service.type === "partner") {
      q = query(
        collection(db, "shops"),
        where("category", "==", serviceId),
        where("status", "==", "active")
      );
    } else if (service.type === "vehicle") {
      q = query(
        collection(db, "vehicles"),
        where("category", "==", serviceId),
        where("status", "==", "active")
      );
    } else {
      return;
    }

    const unsubPartners = onSnapshot(
      q,
      (snap) => {
        setPartners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => console.error("Partners sub failed:", err)
    );

    return () => unsubPartners();
  }, [service, serviceId]);

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

  if (loading) {
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
          The service category you requested does not exist or has been moved.
        </p>
        <Link href="/" className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl">
          Back to Homepage
        </Link>
      </div>
    );
  }

  const isGated = 
    (service.type === "partner" && !toggles.localPartnerServicesEnabled) ||
    (service.type === "vehicle" && !toggles.vehicleRentalEnabled);

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
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-6 rounded-2xl text-center space-y-3"
            >
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
            </motion.div>
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
                  title="Please enter a valid 10-digit mobile number."
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

  const handleHeroHireClick = (e: React.MouseEvent) => {
    if (service.type === "partner" || service.type === "vehicle") {
      e.preventDefault();
      const el = document.getElementById("partner-selection-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      
      {/* Header Navigation */}
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

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
            {service.imageUrl ? (
              <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
            ) : (
              <ServiceIcon name={service.iconName} className="w-8 h-8" />
            )}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
            Professional {service.name} Services
          </h1>
          <p className="text-muted-foreground text-xl leading-relaxed max-w-2xl">
            {service.description} Book now and get matched with our highest-rated professional in your area.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="bg-card border border-border/80 px-6 py-3 rounded-2xl">
              <span className="text-xs font-semibold text-muted-foreground block">Assurance Booking Fee</span>
              <span className="text-3xl font-black text-foreground">₹{service.assuranceFee}</span>
            </div>
            <Link
              href={`/book/${service.id}`}
              onClick={handleHeroHireClick}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg shadow-xl hover:shadow-primary/30 transition-all duration-300 w-full sm:w-auto cursor-pointer"
            >
              Hire Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 bg-muted/30 border border-border/60 p-8 rounded-3xl space-y-6">
          <h3 className="text-xl font-bold tracking-tight">Services Included:</h3>
          <div className="space-y-4">
            {service.subServices.map((sub: string, idx: number) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span className="font-medium text-muted-foreground text-sm">{sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner/Vehicle Selection Section */}
      {(service.type === "partner" || service.type === "vehicle") && (
        <section id="partner-selection-section" className="py-20 px-6 max-w-7xl mx-auto border-t border-border/50 scroll-mt-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Select Your Preferred {service.type === "partner" ? "Shop" : "Vehicle"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Choose from our verified, top-rated local providers in your area.
            </p>
          </div>

          {partners.length === 0 ? (
            <div className="bg-card border border-border/80 p-12 rounded-3xl text-center max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground text-lg">
                ℹ
              </div>
              <h3 className="font-bold text-lg">No Active Providers Available</h3>
              <p className="text-muted-foreground text-sm">
                We are currently onboarding partners in {service.name} for your sector. Please try booking generally or contact support for help.
              </p>
              <Link
                href={`/book/${service.id}`}
                className="inline-block px-6 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-md hover:bg-primary/95 transition-all cursor-pointer"
              >
                Proceed with General Booking
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="bg-card border border-border/60 hover:border-primary/45 rounded-3xl shadow-md overflow-hidden flex flex-col justify-between hover:scale-[1.01] transition-all duration-300"
                >
                  <div className="p-6 md:p-8 space-y-6">
                    {/* Header: Name and Rating */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
                          {service.type === "partner" ? partner.name : partner.vehicleName}
                        </h3>
                        <p className="text-sm font-semibold text-primary mt-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> {partner.area}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-lg text-xs font-bold shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {partner.rating ? partner.rating.toFixed(1) : "5.0"}
                      </div>
                    </div>

                    {/* Image */}
                    {partner.images && partner.images.length > 0 && (
                      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-muted">
                        <img
                          src={partner.images[0]}
                          alt={service.type === "partner" ? partner.name : partner.vehicleName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Partner Specific Info */}
                    {service.type === "partner" ? (
                      <div className="space-y-2.5 text-sm text-muted-foreground border-t border-border/40 pt-4">
                        <p className="flex justify-between">
                          <span>Hours:</span>
                          <strong className="text-foreground">{partner.openingTime} - {partner.closingTime}</strong>
                        </p>
                        <p className="flex justify-between">
                          <span>Delivery:</span>
                          <strong className="text-foreground">
                            {partner.deliveryAvailable ? `Yes (₹${partner.deliveryCharges || 0})` : "Self Pickup Only"}
                          </strong>
                        </p>
                        {partner.description && (
                          <p className="text-xs italic mt-2 line-clamp-2">"{partner.description}"</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5 text-sm text-muted-foreground border-t border-border/40 pt-4">
                        <p className="flex justify-between">
                          <span>Plate No:</span>
                          <strong className="text-foreground font-mono">{partner.vehicleNumber}</strong>
                        </p>
                        <p className="flex justify-between">
                          <span>Rental Fee:</span>
                          <strong className="text-foreground">₹{partner.price} / Day</strong>
                        </p>
                        <p className="flex justify-between">
                          <span>Availability:</span>
                          <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                            partner.availability === "available" ? "bg-emerald-100 text-emerald-700" : "bg-destructive/10 text-destructive"
                          }`}>
                            {partner.availability === "available" ? "In Stock" : "Booked"}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 md:p-8 border-t border-border/60 bg-muted/15 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Assurance Fee: <strong className="text-foreground font-bold">₹{service.assuranceFee}</strong></span>
                    <Link
                      href={`/book/${service.id}?partnerId=${partner.id}`}
                      className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/95 shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      Book Now <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Benefits Section */}
      <section className="py-20 bg-muted/20 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Benefits of Booking with ServeGo
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We vet every service provider based on real reviews, experience, and promptness to ensure professional quality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {service.benefits.map((benefit: string, idx: number) => (
              <div key={idx} className="bg-background border border-border/60 p-8 rounded-2xl flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">{benefit.split(" - ")[0]}</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    Verified background checks and strict professional standard protocols are enforced for every worker/partner.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">
            Everything you need to know about our {service.name.toLowerCase()} services.
          </p>
        </div>

        <div className="space-y-6">
          {service.faq.map((faq: { question: string; answer: string }, idx: number) => (
            <div key={idx} className="border border-border/60 p-6 rounded-2xl bg-card">
              <h3 className="text-lg font-bold flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                {faq.question}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mt-3 pl-8">
                {faq.answer}
              </p>
            </div>
          ))}
          <div className="border border-border/60 p-6 rounded-2xl bg-card">
            <h3 className="text-lg font-bold flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-primary shrink-0" />
              How do I pay the final charge?
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mt-3 pl-8">
              The assurance fee paid online guarantees booking. The remaining work fee depends on standard rates or pre-agreed quotes and is paid directly to the service provider/partner via cash/UPI upon job completion.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-primary text-primary-foreground py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">Ready to book a professional?</h2>
          <p className="text-primary-foreground/80 text-lg">
            Pay a small assurance fee of just ₹{service.assuranceFee} to submit your booking instantly.
          </p>
          <Link
            href={`/book/${service.id}`}
            onClick={handleHeroHireClick}
            className="inline-flex items-center gap-2 px-8 py-4 bg-background text-foreground hover:bg-background/95 rounded-xl font-bold text-lg shadow-2xl transition-all duration-300 cursor-pointer"
          >
            Book Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
}
