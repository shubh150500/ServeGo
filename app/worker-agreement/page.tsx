import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { ArrowLeft, Users, ShieldAlert, Award, Ban, HardHat } from "lucide-react";

export const metadata = {
  title: "Worker Agreement | ServeGo",
  description: "ServeGo agreement outlining the code of conduct, responsibilities, and guidelines for service professionals.",
};

export default function WorkerAgreementPage() {
  const responsibilities = [
    {
      icon: <ShieldAlert className="w-6 h-6 text-primary" />,
      title: "1. Code of Conduct & Harassment Policy",
      content: "ServeGo enforces a zero-tolerance policy against any form of harassment, discrimination, or abusive behavior. Workers must treat all customers and their properties with absolute respect. Physical, verbal, or sexual harassment will result in immediate, permanent termination of platform access and referral to local authorities.",
    },
    {
      icon: <Ban className="w-6 h-6 text-primary" />,
      title: "2. Alcohol, Intoxication & Illegal Substances",
      content: "Workers must never report to a job under the influence of alcohol, drugs, or any intoxicating substances. Possession or consumption of alcohol/drugs on customer premises is strictly prohibited and constitutes grounds for an immediate, non-negotiable lifetime ban.",
    },
    {
      icon: <Award className="w-6 h-6 text-primary" />,
      title: "3. Fraud, Overcharging & Integrity",
      content: "Workers must operate with complete transparency. This includes: (a) charging fair, negotiated labor fees; (b) never inflating material receipts or costs; (c) never requesting clients to cancel bookings to bypass platform tracking; and (d) providing genuine, verified skill details. Falsifying ratings or requesting friends/family to post fake reviews is strictly forbidden.",
    },
    {
      icon: <HardHat className="w-6 h-6 text-primary" />,
      title: "4. Criminal Record & Legal Compliance",
      content: "By listing services on ServeGo, workers warrant that they have no criminal records, active cases, or pending prosecutions under Indian law. Workers are solely responsible for ensuring compliance with all local craft licensing, building regulations, and safety rules.",
    },
    {
      icon: <ShieldAlert className="w-6 h-6 text-primary" />,
      title: "5. ServeGo's Right to Suspend & Ban",
      content: "ServeGo reserves the absolute right to suspend, lock, or permanently ban any worker account at our sole discretion. Reasons for account suspension or banning include, but are not limited to: customer complaints, low average ratings (under 4.0 stars), unsafe work practices, direct fee circumvention, or any breach of this Worker Agreement. Suspended workers forfeit access to pending payouts or leads.",
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
            Partner Standards
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
            Worker Agreement
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Professional terms and codes of conduct required from all listed service providers.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agreement Sections */}
          <div className="lg:col-span-2 space-y-6">
            {responsibilities.map((section, idx) => (
              <div 
                key={idx} 
                className="bg-card border border-border/80 rounded-3xl shadow-xl p-6 md:p-8 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-primary/10">
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    {section.title}
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base whitespace-pre-line">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Quick Links Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border border-border/85 rounded-3xl p-6 shadow-xl sticky top-24">
              <h3 className="text-lg font-bold text-foreground mb-4">Related Documents</h3>
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
                  <Link href="/community-guidelines" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Community Guidelines
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Contact Support
                  </Link>
                </li>
              </ul>

              <div className="mt-8 pt-6 border-t border-border/40">
                <h4 className="text-sm font-bold text-foreground mb-2">Worker Support</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  For disputes regarding account suspension or technical assistance, contact the ServeGo partner helpline.
                </p>
                <a 
                  href="mailto:servegoofficial@gmail.com" 
                  className="inline-flex w-full items-center justify-center py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-95 transition-all text-center shadow-md shadow-primary/10"
                >
                  Contact Partner Care
                </a>
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
