"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SERVICES_LIST } from "@/lib/services";
import ServiceIcon from "@/components/ServiceIcon";
import { Check, HelpCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

  useEffect(() => {
    if (!serviceId) return;

    const unsub = onSnapshot(
      doc(db, "services", serviceId),
      (docSnap) => {
        if (docSnap.exists()) {
          setService(docSnap.data());
        } else {
          const staticS = SERVICES_LIST.find((s) => s.id === serviceId);
          if (staticS) setService(staticS);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firestore service details subscription failed:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [serviceId]);

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
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg shadow-xl hover:shadow-primary/30 transition-all duration-300 w-full sm:w-auto"
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
                    Verified background checks and strict professional standard protocols are enforced for every worker.
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
              The assurance fee paid online guarantees booking. The remaining work fee depends on standard rates or pre-agreed quotes and is paid directly to the service provider via cash/UPI upon job completion.
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
            className="inline-flex items-center gap-2 px-8 py-4 bg-background text-foreground hover:bg-background/95 rounded-xl font-bold text-lg shadow-2xl transition-all duration-300"
          >
            Book Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
}
