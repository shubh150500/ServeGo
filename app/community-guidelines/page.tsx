import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { ArrowLeft, Heart, ShieldAlert, Sparkles, Smile, Handshake } from "lucide-react";

export const metadata = {
  title: "Community Guidelines | ServeGo",
  description: "ServeGo community guidelines outlining behavioral standards, safety expectations, and codes of conduct for both customers and workers.",
};

export default function CommunityGuidelinesPage() {
  const customerExpectations = [
    {
      title: "1. Respect & Courtesy",
      content: "Treat service partners with the dignity they deserve. Shouting, offensive remarks, or any form of discrimination based on caste, religion, gender, or age is strictly banned.",
    },
    {
      title: "2. Safe & Sanitary Environment",
      content: "Ensure the workspace is safe, clean, and properly ventilated. Restrain pets and keep active children away from high-risk work zones (like electrical boards or AC mounts).",
    },
    {
      title: "3. Honest Descriptions & Scope",
      content: "Be truthful about the repair work needed when placing a booking. Understating job complexity to force lower rates puts workers in difficult situations and leads to disputes.",
    },
    {
      title: "4. Direct Settlement of Labor Fees",
      content: "Examine the completed task and coordinate payment of agreed labor charges promptly. Do not hold back legitimate labor earnings without reasonable, safety-related issues.",
    },
  ];

  const workerExpectations = [
    {
      title: "1. Professionalism & Punctuality",
      content: "Show up on time or communicate proactively if running late. Wear identification and maintain professional dress standards while representing ServeGo.",
    },
    {
      title: "2. Transparent Material & Labor Costs",
      content: "Ensure material buying is supported by genuine merchant invoices. Negotiate labor pricing clearly prior to picking up tools to prevent post-job arguments.",
    },
    {
      title: "3. Neatness & Workspace Care",
      content: "Respect customer homes. Tidy up all garbage, wire clippings, dust, and excess materials generated during execution of the work.",
    },
    {
      title: "4. Maintaining Strict Professional Boundaries",
      content: "Avoid asking personal questions or holding unsolicited personal chats with clients. Never use contact details obtained via ServeGo for any communication after job completion.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      {/* Premium Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src="/logo.png" alt="ServeGo Logo" className="w-8 h-8 rounded-lg object-contain" />
              <span className="text-xl font-black tracking-tighter text-foreground">
                ServeGo
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4 border border-primary/20">
            Harmonious Community
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
            Community Guidelines
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Our rules for maintaining a safe, respectful, and highly reliable environment for everyone.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Expectations Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Customer Expectations Section */}
            <div className="bg-card border border-border/80 rounded-3xl shadow-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Smile className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Guidelines for Customers
                </h2>
              </div>
              <div className="space-y-6">
                {customerExpectations.map((item, idx) => (
                  <div key={idx} className="border-l-2 border-primary/30 pl-4">
                    <h3 className="font-bold text-lg text-foreground mb-1">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Worker Expectations Section */}
            <div className="bg-card border border-border/80 rounded-3xl shadow-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Handshake className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Guidelines for Service Partners
                </h2>
              </div>
              <div className="space-y-6">
                {workerExpectations.map((item, idx) => (
                  <div key={idx} className="border-l-2 border-primary/30 pl-4">
                    <h3 className="font-bold text-lg text-foreground mb-1">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Quick Links / Community Mission Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border border-border/85 rounded-3xl p-6 shadow-xl sticky top-24">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Our Core Belief</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                ServeGo thrives on trust, integrity, and mutual respect. We hold both customer safety and worker welfare in high regard. By choosing our platform, you join a network built on fair wages, top work standards, and security.
              </p>

              <div className="border-t border-border/40 pt-6">
                <h4 className="text-sm font-bold text-foreground mb-3">Quick Navigation</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Terms & Conditions
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/refund-policy" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Refund Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/worker-agreement" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Worker Agreement
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Contact Support
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Link */}
        <div className="text-center mt-12 pt-6 border-t border-border/40">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Homepage
          </Link>
        </div>
      </main>
    </div>
  );
}
