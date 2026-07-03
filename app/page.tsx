"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import DotGlobeHeroDemo from "@/components/ui/demo";
import { SERVICES_LIST } from "@/lib/services";
import ServiceIcon from "@/components/ServiceIcon";
import ThemeToggle from "@/components/ThemeToggle";
import { collection, addDoc, serverTimestamp, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  Users, 
  HelpCircle, 
  Star,
  Check,
  UserCheck,
  Search,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Amit Kumar",
    rating: 5,
    text: "AC repair work was done professionally. The worker was prompt, negotiated a fair price, and fixed the gas leakage in no time.",
    service: "AC Repair & Service",
    area: "Aurangabad"
  },
  {
    name: "Pooja Singh",
    rating: 5,
    text: "Excellent plumbing service! The plumber was polite, cleaned the area after finishing, and charging was very reasonable.",
    service: "Plumbing Services",
    area: "Sector 4"
  },
  {
    name: "Ramesh Prasad",
    rating: 4,
    text: "Booked a carpenter for bed repairs. The quality of work is very high. Direct negotiation made pricing clear and transparent.",
    service: "Carpentry Services",
    area: "Aurangabad Town"
  },
  {
    name: "Vikram Sen",
    rating: 5,
    text: "Saves a lot of time! Within minutes of scheduling, I got a call back from a verified electrician. Highly recommended for Aurangabad residents.",
    service: "Electrical Services",
    area: "Maharajganj"
  }
];

export default function Home() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  
  // Custom states for Testimonials and FAQ
  const [currentReviewIdx, setCurrentReviewIdx] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [toggles, setToggles] = useState<any>({
    localPartnerServicesEnabled: false,
    vehicleRentalEnabled: false
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Coming Soon Modal State
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
  const [selectedComingSoonService, setSelectedComingSoonService] = useState<any | null>(null);
  const [interestName, setInterestName] = useState("");
  const [interestMobile, setInterestMobile] = useState("");
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestSuccess, setInterestSuccess] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "services"),
      (snap) => {
        if (!snap.empty) {
          setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
        setLoadingServices(false);
      },
      (err) => {
        console.error("Firestore services subscription failed:", err);
        setLoadingServices(false);
      }
    );

    const unsubToggles = onSnapshot(
      doc(db, "system_config", "toggles"),
      (docSnap) => {
        if (docSnap.exists()) {
          setToggles(docSnap.data());
        }
      },
      (err) => {
        console.error("Firestore toggles subscription failed:", err);
      }
    );

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      unsub();
      unsubToggles();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleComingSoonClick = (service: any) => {
    setSelectedComingSoonService(service);
    setIsComingSoonModalOpen(true);
    setInterestName("");
    setInterestMobile("");
    setInterestSuccess(false);
  };

  const handleInterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interestName.trim() || !interestMobile.trim() || !selectedComingSoonService) return;

    setInterestLoading(true);
    try {
      await addDoc(collection(db, "launch_interests"), {
        name: interestName.trim(),
        mobile: interestMobile.trim(),
        serviceId: selectedComingSoonService.id,
        serviceName: selectedComingSoonService.name,
        createdAt: serverTimestamp()
      });
      setInterestSuccess(true);
    } catch (err) {
      console.error("Failed to submit launch interest:", err);
    } finally {
      setInterestLoading(false);
    }
  };

  // Become a Worker Form State
  const [workerName, setWorkerName] = useState("");
  const [workerMobile, setWorkerMobile] = useState("");
  const [workerService, setWorkerService] = useState("");
  const [workerArea, setWorkerArea] = useState("");
  const [workerExp, setWorkerExp] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Tracking State
  const [trackId, setTrackId] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState("");

  const handleTrackBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackId.trim()) return;

    setTrackLoading(true);
    setTrackError("");

    try {
      const docRef = doc(db, "bookings", trackId.trim());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        router.push(`/track/${trackId.trim()}`);
      } else {
        setTrackError("Booking ID not found. Please verify the ID and try again.");
      }
    } catch (err: any) {
      console.error(err);
      setTrackError("Failed to verify Booking ID. Please check your connection.");
    } finally {
      setTrackLoading(false);
    }
  };

  const handleRegisterWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!workerName || !workerMobile || !workerService || !workerArea || !workerExp) {
      setError("Please fill in all the fields.");
      setLoading(false);
      return;
    }

    try {
      // Create new worker document in Firestore
      const newWorker = {
        name: workerName,
        mobile: workerMobile,
        serviceType: workerService,
        area: workerArea.toLowerCase().trim(),
        experience: parseInt(workerExp, 10) || 1,
        rating: 5.0, // starting rating
        totalReviews: 0,
        totalAssignedJobs: 0,
        totalAcceptedJobs: 0,
        totalRejectedJobs: 0,
        totalCompletedJobs: 0,
        lastActivity: serverTimestamp(),
        status: "pending",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "workers"), newWorker);
      setSuccess(true);
      setWorkerName("");
      setWorkerMobile("");
      setWorkerService("");
      setWorkerArea("");
      setWorkerExp("");
    } catch (err: any) {
      console.error(err);
      setError("Failed to register. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "ServeGo",
              "url": "https://servego.co.in",
              "logo": "https://servego.co.in/logo.png",
              "sameAs": [
                "https://servego.co.in"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "servegoofficial@gmail.com",
                "contactType": "customer service",
                "areaServed": "IN",
                "availableLanguage": ["English", "Hindi"]
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "HomeAndConstructionBusiness",
              "name": "ServeGo Local Services",
              "image": "https://servego.co.in/logo.png",
              "@id": "https://servego.co.in/#localbusiness",
              "url": "https://servego.co.in",
              "email": "servegoofficial@gmail.com",
              "priceRange": "₹₹",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Aurangabad",
                "addressLocality": "Aurangabad",
                "addressRegion": "Bihar",
                "postalCode": "824101",
                "addressCountry": "IN"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 24.7539,
                "longitude": 84.3739
              },
              "areaServed": [
                {
                  "@type": "AdministrativeArea",
                  "name": "Aurangabad, Bihar"
                }
              ]
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "ServeGo",
              "url": "https://servego.co.in",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://servego.co.in/?search={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://servego.co.in"
                }
              ]
            },
            ...SERVICES_LIST.map((s) => ({
              "@context": "https://schema.org",
              "@type": "Service",
              "name": s.name,
              "description": s.shortDescription,
              "provider": {
                "@type": "LocalBusiness",
                "name": "ServeGo",
                "image": "https://servego.co.in/logo.png"
              },
              "areaServed": {
                "@type": "AdministrativeArea",
                "name": "Aurangabad, Bihar"
              },
              "offers": {
                "@type": "Offer",
                "price": s.assuranceFee,
                "priceCurrency": "INR",
                "description": "Assurance Fee"
              }
            }))
          ])
        }}
      />
      
      {/* Sticky Header Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-30 w-full transition-all duration-300 ${isScrolled ? "glass-nav py-4 px-6 shadow-md" : "absolute bg-transparent py-6 px-6"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <img src="/logo.png" alt="ServeGo Logo" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-xl md:text-2xl font-black tracking-tighter text-foreground">
              ServeGo
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 bg-card/85 hover:bg-card backdrop-blur-xl rounded-full shadow-lg border border-border/40 transition-all cursor-pointer text-foreground hover:scale-105 btn-press"
              aria-label="Search Services"
            >
              <Search className="w-5 h-5 text-foreground font-bold" />
            </button>
          </div>
        </div>
      </header>

      {/* 3D Globe Hero Demo */}
      <DotGlobeHeroDemo />

      {/* Search Modal Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/45 backdrop-blur-md transition-opacity duration-300">
          <div 
            className="fixed inset-0 bg-transparent" 
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery("");
            }}
          />
          <div className="relative bg-card border border-border/80 w-full max-w-lg rounded-3xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <h3 className="text-lg font-black tracking-tight">Search Services</h3>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="p-1.5 hover:bg-muted rounded-full transition-colors cursor-pointer"
                aria-label="Close search modal"
              >
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            
            {/* Search Input */}
            <div className="mt-4 relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="Type to search (e.g. Plumber, AC)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-muted/40 border border-border/85 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm focus:bg-background transition-all"
                aria-label="Search services input"
              />
            </div>
            
            {/* Search Results */}
            <div className="mt-6 max-h-[280px] overflow-y-auto space-y-2 pr-1">
              {searchQuery.trim() === "" ? (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Popular Services</p>
                  <div className="flex flex-wrap gap-2">
                    {["Plumber", "Electrician", "AC Repair", "Cleaning", "Movers & Packers"].map((term) => (
                      <button
                        key={term}
                        onClick={() => setSearchQuery(term)}
                        className="px-4 py-2 bg-muted hover:bg-primary/10 hover:text-primary border border-border/50 text-xs font-bold rounded-xl transition-all cursor-pointer text-muted-foreground hover:text-foreground"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {(() => {
                    const filtered = (services.length > 0 ? services : SERVICES_LIST).filter((s) =>
                      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (s.subServices && s.subServices.some((sub: string) => sub.toLowerCase().includes(searchQuery.toLowerCase())))
                    );
                    
                    if (filtered.length === 0) {
                      return (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                          No services found matching "{searchQuery}"
                        </div>
                      );
                    }
                    
                    return filtered.map((service) => (
                      <div
                        key={service.id}
                        className="p-3 bg-muted/20 border border-border/40 hover:border-primary/40 rounded-2xl flex items-center justify-between gap-4 hover:bg-accent/5 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 overflow-hidden">
                            {service.imageUrl ? (
                              <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                            ) : (
                              <ServiceIcon name={service.iconName} className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-foreground">{service.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">{service.shortDescription}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link
                            href={`/services/${service.id}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="px-2.5 py-1.5 border border-border/80 hover:bg-muted text-[10px] font-bold rounded-lg transition-all cursor-pointer text-muted-foreground hover:text-foreground"
                          >
                            Details
                          </Link>
                          <Link
                            href={`/book/${service.id}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="px-3 py-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-lg shadow-md hover:bg-primary/95 transition-all cursor-pointer"
                          >
                            Book
                          </Link>
                        </div>
                      </div>
                    ));
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Track Booking Section */}
      <section className="relative -mt-16 z-20 max-w-4xl mx-auto px-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="bg-card/75 backdrop-blur-xl border border-border/80 p-5 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-center">
            <div className="md:col-span-5 space-y-2">
              <span className="text-primary font-bold text-xs tracking-wider uppercase bg-primary/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Real-time tracking
              </span>
              <h3 className="text-2xl font-black tracking-tight">Track Your Service</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Check worker assignment status, contact details, and progress in real-time.
              </p>
            </div>
            
            <div className="md:col-span-7">
              <form onSubmit={handleTrackBooking} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={trackId}
                      onChange={(e) => setTrackId(e.target.value)}
                      placeholder="Paste your Booking ID (e.g. j7X8b...)"
                      className="w-full pl-4 pr-4 py-4 bg-muted/40 border border-border/85 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm font-mono focus:bg-background transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={trackLoading || !trackId.trim()}
                    className="px-6 py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0 animate-in fade-in"
                  >
                    {trackLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        <span>Locating...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Track Order</span>
                      </>
                    )}
                  </button>
                </div>
                {trackError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-destructive font-semibold flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {trackError}
                  </motion.p>
                )}
              </form>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-6 max-w-7xl mx-auto scroll-mt-6">
        <div className="text-center space-y-4 mb-16">
          <span className="text-primary font-bold text-sm tracking-wider uppercase bg-primary/10 px-4 py-1.5 rounded-full">
            Our Services
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
            Book Trusted Local Services
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get background-checked, highly-rated professionals for all your home and commercial service needs.
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {loadingServices ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div 
                key={idx} 
                className="aspect-square bg-card border border-border/40 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent -translate-x-full animate-shimmer" style={{ width: "200%" }} />
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-muted/60 animate-pulse" />
                <div className="h-4 w-16 bg-muted/70 rounded-md animate-pulse" />
              </div>
            ))
          ) : (
            (services.length > 0 ? services : SERVICES_LIST)
              .filter((s) => s.type === "home" || !s.type)
              .map((service, idx) => (
                <Link key={service.id} href={`/services/${service.id}`} className="block group">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.03, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square flex flex-col items-center justify-center p-3 md:p-6 bg-card border border-border/60 rounded-2xl shadow-sm group-hover:border-primary/50 group-hover:shadow-md transition-all duration-300 relative overflow-hidden will-change-[transform,opacity] active:bg-primary/5 active:scale-95"
                  >
                    <div className="w-12 h-12 md:w-16 md:h-16 min-w-[48px] min-h-[48px] md:min-w-[64px] md:min-h-[64px] rounded-2xl bg-primary/10 flex items-center justify-center text-primary overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1 will-change-transform shrink-0 flex-shrink-0 aspect-square">
                      {service.imageUrl ? (
                        <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                      ) : (
                        <ServiceIcon name={service.iconName} className="w-6 h-6 md:w-8 md:h-8 animate-float-slow" />
                      )}
                    </div>
                    <h3 className="text-xs md:text-sm font-bold text-foreground tracking-tight group-hover:text-primary transition-colors duration-200 mt-3 text-center">
                      {service.name}
                    </h3>
                  </motion.div>
                </Link>
              ))
          )}
        </div>
      </section>
      {/* Local Quick Delivery Section */}
      <section id="local-delivery" className="py-12 px-6 max-w-7xl mx-auto scroll-mt-6 border-t border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground uppercase">LOCAL QUICK DELIVERY</h2>
          <span className="px-2 py-0.5 bg-[#F4EBE1] text-[#A67C52] text-[10px] font-bold rounded-full uppercase tracking-wider">NEW</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {SERVICES_LIST
            .filter((s) => s.type === "partner")
            .map((fallback) => {
              const firebaseMatch = services.find((fs) => fs.id === fallback.id);
              return firebaseMatch ? { ...fallback, ...firebaseMatch } : fallback;
            })
            .map((service) => {
              const isLive = toggles.localPartnerServicesEnabled;
              return (
                <div
                  key={service.id}
                  className="bg-[#FAF6F0] border border-[#EFE8DC] p-5 rounded-2xl flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#F5ECE2] flex items-center justify-center text-[#9c6d48] overflow-hidden">
                      <ServiceIcon name={service.iconName} className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground leading-snug">{service.name}</h3>
                      <p className="text-muted-foreground text-[11px] leading-normal mt-1 line-clamp-2">{service.shortDescription}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col gap-2">
                    {isLive ? (
                      <Link
                        href={`/services/${service.id}`}
                        className="w-full text-center py-2.5 bg-[#E06D3E] text-white text-[11px] font-bold rounded-full shadow-sm hover:opacity-90 transition-all cursor-pointer"
                      >
                        Book Now
                      </Link>
                    ) : (
                      <>
                        <button
                          onClick={() => handleComingSoonClick(service)}
                          className="w-full text-center py-2 bg-[#E06D3E] text-white text-[11px] font-bold rounded-full shadow-sm hover:opacity-90 transition-all cursor-pointer"
                        >
                          Coming Soon
                        </button>
                        <button
                          onClick={() => handleComingSoonClick(service)}
                          className="w-full py-2 bg-[#FAF6F0] hover:bg-[#F5ECE2] text-muted-foreground border border-[#E1D7C5] text-[11px] font-bold rounded-full transition-all cursor-pointer text-center"
                        >
                          Register for Launch
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Vehicle Rental Section */}
      <section id="vehicle-rental" className="py-12 px-6 max-w-7xl mx-auto scroll-mt-6 border-t border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground uppercase">VEHICLE RENTALS</h2>
          <span className="px-2 py-0.5 bg-[#F4EBE1] text-[#A67C52] text-[10px] font-bold rounded-full uppercase tracking-wider">NEW</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {SERVICES_LIST
            .filter((s) => s.type === "vehicle")
            .map((fallback) => {
              const firebaseMatch = services.find((fs) => fs.id === fallback.id);
              return firebaseMatch ? { ...fallback, ...firebaseMatch } : fallback;
            })
            .map((service) => {
              const isLive = toggles.vehicleRentalEnabled;
              return (
                <div
                  key={service.id}
                  className="bg-[#FAF6F0] border border-[#EFE8DC] p-5 rounded-2xl flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#F5ECE2] flex items-center justify-center text-[#9c6d48] overflow-hidden">
                      <ServiceIcon name={service.iconName} className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground leading-snug">{service.name}</h3>
                      <p className="text-muted-foreground text-[11px] leading-normal mt-1 line-clamp-2">{service.shortDescription}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col gap-2">
                    {isLive ? (
                      <Link
                        href={`/services/${service.id}`}
                        className="w-full text-center py-2.5 bg-[#E06D3E] text-white text-[11px] font-bold rounded-full shadow-sm hover:opacity-90 transition-all cursor-pointer"
                      >
                        Book Now
                      </Link>
                    ) : (
                      <>
                        <button
                          onClick={() => handleComingSoonClick(service)}
                          className="w-full text-center py-2 bg-[#E06D3E] text-white text-[11px] font-bold rounded-full shadow-sm hover:opacity-90 transition-all cursor-pointer"
                        >
                          Coming Soon
                        </button>
                        <button
                          onClick={() => handleComingSoonClick(service)}
                          className="w-full py-2 bg-[#FAF6F0] hover:bg-[#F5ECE2] text-muted-foreground border border-[#E1D7C5] text-[11px] font-bold rounded-full transition-all cursor-pointer text-center"
                        >
                          Register for Launch
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-muted/30 border-y border-border/50 scroll-mt-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <span className="text-primary font-bold text-sm tracking-wider uppercase bg-primary/10 px-4 py-1.5 rounded-full">
              Seamless Flow
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              How the Platform Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From online booking to job completion, we ensure zero friction and complete reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/30 to-transparent -translate-y-1/2 z-0" />
            
            {[
              {
                step: "01",
                title: "Choose & Pay Fee",
                desc: "Select a service, fill in details, and pay the Service Assurance Fee securely."
              },
              {
                step: "02",
                title: "Worker Assignment",
                desc: "Our admin assigns the top-ranked available worker in your area."
              },
              {
                step: "03",
                title: "Direct WhatsApp link",
                desc: "Worker receives job info on WhatsApp, accepts, and coordinates with you."
              },
              {
                step: "04",
                title: "Complete & Review",
                desc: "Worker uploads proof, completes job, and you submit rating and reviews."
              }
            ].map((step, idx) => (
              <div key={idx} className="step-box relative z-10 bg-background border border-border/60 p-8 rounded-2xl space-y-4 shadow-sm">
                <span className="step-number text-5xl font-black text-primary/20 block leading-none">{step.step}</span>
                <h3 className="text-xl font-bold tracking-tight">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5 space-y-8">
            <span className="text-primary font-bold text-sm tracking-wider uppercase bg-primary/10 px-4 py-1.5 rounded-full">
              Platform Benefits
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Why Homeowners Trust Our Platform
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We skip complex agencies and unverified local catalogs. All our providers are monitored and ranked by real-world completion performance.
            </p>
            <div className="space-y-4">
              {[
                "100% verified identities and skills credentials",
                "Assurance fee ensures reliable scheduling and turn-up",
                "Integrated secure link updates (no app install needed)",
                "Performance-based automatic worker matching priority"
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <span className="font-medium text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="benefit-card bg-card border border-border/60 p-8 rounded-2xl space-y-4">
              <ShieldCheck className="w-12 h-12 text-primary" />
              <h3 className="text-xl font-bold">Service Quality Assurance</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We hold our providers to the highest standards. We actively monitor feedback and service quality to ensure a reliable and safe experience.
              </p>
            </div>
            <div className="benefit-card bg-card border border-border/60 p-8 rounded-2xl space-y-4">
              <Clock className="w-12 h-12 text-primary" />
              <h3 className="text-xl font-bold">60-Min Urgent Assign</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Standard tasks get assigned to a worker and dispatched within 60 minutes of booking.
              </p>
            </div>
            <div className="benefit-card bg-card border border-border/60 p-8 rounded-2xl space-y-4">
              <Star className="w-12 h-12 text-primary" />
              <h3 className="text-xl font-bold">Top-Tier Ranking</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our dynamic algorithm ranks workers. Higher rated and active workers get priority.
              </p>
            </div>
            <div className="benefit-card bg-card border border-border/60 p-8 rounded-2xl space-y-4">
              <Users className="w-12 h-12 text-primary" />
              <h3 className="text-xl font-bold">Zero Brokerage</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                No middleman commissions. You pay the worker directly for manual labor after completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Become a Worker Section */}
      <section id="become-worker" className="py-24 bg-muted/30 border-y border-border/50 scroll-mt-6">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <span className="text-primary font-bold text-sm tracking-wider uppercase bg-primary/10 px-4 py-1.5 rounded-full">
              Join Our Network
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Register as a Service Provider
            </h2>
            <p className="text-muted-foreground text-lg">
              Receive job bookings directly on your WhatsApp with no lead purchasing fees. Show your best skills and get ranked.
            </p>
          </div>

          <div className="bg-background border border-border/80 p-5 md:p-12 rounded-3xl shadow-xl">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-12"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <UserCheck className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black">Registration Successful!</h3>
                <p className="text-muted-foreground text-lg">
                  Thank you for joining. Our platform administrators will review your profile and activate your account. You will start receiving assignments shortly.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="mt-6 px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-xl"
                >
                  Register Another Profile
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleRegisterWorker} className="space-y-6">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/80">Full Name</label>
                    <input
                      type="text"
                      value={workerName}
                      onChange={(e) => setWorkerName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-4 py-3 bg-muted/50 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/80">Mobile Number (WhatsApp Enabled)</label>
                    <input
                      type="tel"
                      value={workerMobile}
                      onChange={(e) => setWorkerMobile(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="w-full px-4 py-3 bg-muted/50 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/80">Skill Category</label>
                    <select
                      value={workerService}
                      onChange={(e) => setWorkerService(e.target.value)}
                      className="w-full px-4 py-3 bg-muted/50 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45"
                    >
                      <option value="">Select Category</option>
                      {(services.length > 0 ? services : SERVICES_LIST).map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/80">Service Area / City Sector</label>
                    <input
                      type="text"
                      value={workerArea}
                      onChange={(e) => setWorkerArea(e.target.value)}
                      placeholder="e.g. Sector 62, Indirapuram"
                      className="w-full px-4 py-3 bg-muted/50 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/80">Experience (Years)</label>
                    <input
                      type="number"
                      value={workerExp}
                      onChange={(e) => setWorkerExp(e.target.value)}
                      placeholder="e.g. 5"
                      min="1"
                      className="w-full px-4 py-3 bg-muted/50 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:bg-primary/95 shadow-lg transition-all duration-300 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Registering Profile..." : "Submit Application"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Carousel Section */}
      <section className="py-24 px-6 max-w-5xl mx-auto scroll-mt-6 border-t border-border/40" id="reviews">
        <div className="text-center space-y-4 mb-16">
          <span className="text-primary font-bold text-sm tracking-wider uppercase bg-primary/10 px-4 py-1.5 rounded-full flex items-center gap-1.5 justify-center w-fit mx-auto">
            <MessageSquare className="w-4 h-4" /> Customer Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
            Loved by Aurangabad Residents
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See how customers and local professionals coordinate successfully on ServeGo.
          </p>
        </div>

        <div className="relative bg-card border border-border/60 p-8 md:p-12 rounded-3xl shadow-xl overflow-hidden max-w-3xl mx-auto flex flex-col items-center">
          <div className="flex items-center gap-1 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-6 h-6 ${
                  i < TESTIMONIALS[currentReviewIdx].rating
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <motion.div
            key={currentReviewIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-6"
          >
            <p className="text-lg md:text-xl font-medium leading-relaxed italic text-foreground px-4">
              "{TESTIMONIALS[currentReviewIdx].text}"
            </p>

            <div className="space-y-1">
              <h4 className="font-black text-base text-foreground flex items-center justify-center gap-1.5">
                {TESTIMONIALS[currentReviewIdx].name}
                <span className="text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Verified User
                </span>
              </h4>
              <p className="text-xs text-muted-foreground">
                {TESTIMONIALS[currentReviewIdx].service} • {TESTIMONIALS[currentReviewIdx].area}
              </p>
            </div>
          </motion.div>

          <div className="flex items-center gap-4 mt-8 pt-4 border-t border-border/40 w-full justify-center">
            <button
              onClick={() =>
                setCurrentReviewIdx(
                  (prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length
                )
              }
              className="p-3 bg-secondary text-foreground hover:bg-secondary/80 rounded-full border border-border/40 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              aria-label="Previous Review"
            >
              <ChevronLeft className="w-5 h-5 text-primary" />
            </button>
            
            <div className="flex gap-1.5">
              {TESTIMONIALS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentReviewIdx(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    idx === currentReviewIdx ? "bg-primary w-6" : "bg-muted-foreground/30"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() =>
                setCurrentReviewIdx((prev) => (prev + 1) % TESTIMONIALS.length)
              }
              className="p-3 bg-secondary text-foreground hover:bg-secondary/80 rounded-full border border-border/40 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              aria-label="Next Review"
            >
              <ChevronRight className="w-5 h-5 text-primary" />
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 max-w-3xl mx-auto scroll-mt-6" id="faq">
        <div className="text-center space-y-4 mb-16">
          <span className="text-primary font-bold text-sm tracking-wider uppercase bg-primary/10 px-4 py-1.5 rounded-full">
            Common Inquiries
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "What is the Service Assurance Fee?",
              a: "It is a small deposit paid online when scheduling. It covers scheduling verification, background support, and guarantees that a worker turns up for your requested slot. The remaining labor fee is negotiated and paid directly to the worker."
            },
            {
              q: "How does price negotiation work?",
              a: "ServeGo does not charge commissions or set fixed prices. Once a worker accepts your request, they will contact you directly on WhatsApp or mobile. You can discuss the details of the job and agree on a fair price directly with them."
            },
            {
              q: "Are the workers verified and safe?",
              a: "Absolutely. We conduct strict background verifications and check local references for all registered professionals before allowing them to accept bookings. Your safety is our highest priority."
            },
            {
              q: "Is my online assurance fee refundable?",
              a: "Yes. If no provider is available or if you cancel the service request before a worker starts traveling to your location, the assurance fee is fully refunded to your source payment method."
            }
          ].map((item, idx) => (
            <div key={idx} className="border border-border/60 rounded-2xl bg-card overflow-hidden transition-all duration-300">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                type="button"
                className="w-full text-left p-6 flex items-center justify-between gap-4 font-bold text-foreground text-base md:text-lg hover:text-primary transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                  {item.q}
                </span>
                {activeFaq === idx ? (
                  <ChevronUp className="w-5 h-5 text-primary shrink-0 transition-transform duration-300" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300" />
                )}
              </button>
              
              <motion.div
                initial={false}
                animate={{ height: activeFaq === idx ? "auto" : 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-6 pt-0 pl-14 text-muted-foreground text-sm leading-relaxed border-t border-border/30">
                  {item.a}
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-muted/20 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <img src="/logo.png" alt="ServeGo Logo" className="w-8 h-8 rounded-lg object-contain" />
              <span className="text-2xl font-black tracking-tighter text-black">
                ServeGo
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} ServeGo. All rights reserved.
            </p>
            <p className="text-muted-foreground text-sm flex items-center gap-1.5 justify-center md:justify-start mt-1">
              <span className="font-bold text-foreground">Email:</span>
              <a href="mailto:servegoofficial@gmail.com" className="text-primary hover:underline font-bold transition-colors">
                servegoofficial@gmail.com
              </a>
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#services" className="hover:text-foreground transition-colors">Services</a>
            <a href="#become-worker" className="hover:text-foreground transition-colors">Become a Partner</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQs</a>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms & Conditions</Link>
            <Link href="/refund" className="hover:text-foreground transition-colors">Refund & Cancellation</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link>
            <Link href="/admin/login" className="text-primary hover:underline font-bold transition-colors">
              Admin Login
            </Link>
          </div>
        </div>
      </footer>

      {/* Coming Soon / Launch Registration Modal */}
      {isComingSoonModalOpen && selectedComingSoonService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md">
          <div 
            className="fixed inset-0 bg-transparent" 
            onClick={() => setIsComingSoonModalOpen(false)}
          />
          <div className="relative bg-card border border-border/80 w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setIsComingSoonModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-muted rounded-full transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button>

            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-2 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
                  <ServiceIcon name={selectedComingSoonService.iconName} className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black tracking-tight">{selectedComingSoonService.name}</h3>
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400 text-xs font-bold rounded-full uppercase tracking-wider">
                  Coming Soon
                </span>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We are launching {selectedComingSoonService.name} services in your area very soon! Register your interest to get notified and receive an early-bird launch discount.
                </p>
              </div>

              {/* Success State */}
              {interestSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-6 rounded-2xl text-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300">Registration Complete!</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    Thank you, {interestName}! We have saved your interest. You will be the first to know when we launch in your area.
                  </p>
                  <button
                    onClick={() => setIsComingSoonModalOpen(false)}
                    className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </motion.div>
              ) : (
                /* Registration Form */
                <form onSubmit={handleInterestSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/80">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={interestName}
                      onChange={(e) => setInterestName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
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
                    className="w-full py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/95 shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {interestLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <span>Register for Launch</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
