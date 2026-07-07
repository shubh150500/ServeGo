import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { ArrowLeft, RefreshCw, XCircle, Clock, CreditCard, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Refund Policy | ServeGo",
  description: "ServeGo refund and cancellation policy explaining how the Service Assurance Fee is handled during changes or cancellations.",
};

export default function RefundPolicyPage() {
  const rules = [
    {
      icon: <Clock className="w-6 h-6 text-primary" />,
      title: "1. Service Assurance Fee Overview",
      content: "To maintain qualified partners, perform background checks, and prevent slot hoarding, ServeGo charges a Service Assurance Fee at the time of placing a service request. This fee is collected securely via Razorpay and holds the booking slot for your selected professional.",
    },
    {
      icon: <XCircle className="w-6 h-6 text-primary" />,
      title: "2. Customer-Initiated Cancellation",
      content: "If you cancel a booking, the eligibility and percentage of the refund for the Service Assurance Fee is determined by the time window of cancellation:\n\n• Cancelled 24 Hours or More Before Scheduled Time: Eligible for a 100% refund of the Service Assurance Fee.\n• Cancelled Between 2 Hours and 24 Hours Before Scheduled Time: Eligible for a 50% refund of the Service Assurance Fee.\n• Cancelled Less Than 2 Hours Before Scheduled Time: No refund is issued (this covers administrative booking costs and potential loss of opportunity for the assigned partner).",
    },
    {
      icon: <RefreshCw className="w-6 h-6 text-primary" />,
      title: "3. ServeGo or Worker-Initiated Cancellation",
      content: "If a scheduled service is cancelled by ServeGo or the assigned worker due to unforeseen circumstances, emergency, or unavailability of resources, you will be issued a 100% refund of the Service Assurance Fee automatically. Our support desk will also assist you in booking an alternative slot if requested.",
    },
    {
      icon: <CreditCard className="w-6 h-6 text-primary" />,
      title: "4. Processing Timelines",
      content: "All eligible refunds are auto-credited back to the original payment source (UPI, Credit/Debit Card, or Net Banking) via Razorpay. Once initiated, refunds take 5 to 7 business days to reflect in your account statement, depending on your bank's processing cycles.",
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
            Billing & Cancellations
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
            Refund & Cancellation Policy
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Understand standard cancellations, fee refunds, and transaction processing windows.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rules list */}
          <div className="lg:col-span-2 space-y-6">
            {rules.map((rule, idx) => (
              <div 
                key={idx} 
                className="bg-card border border-border/80 rounded-3xl shadow-xl p-6 md:p-8 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-primary/10">
                    {rule.icon}
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    {rule.title}
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base whitespace-pre-line">
                  {rule.content}
                </p>
              </div>
            ))}
          </div>

          {/* Quick Links Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border border-border/85 rounded-3xl p-6 shadow-xl sticky top-24">
              <h3 className="text-lg font-bold text-foreground mb-4">Quick Links</h3>
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
                  <Link href="/worker-agreement" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Worker Agreement
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
                <h4 className="text-sm font-bold text-foreground mb-2">Refund Issue?</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Did you cancel a booking but haven't received your credit note or transaction update? Get in touch.
                </p>
                <a 
                  href="mailto:servegoofficial@gmail.com" 
                  className="inline-flex w-full items-center justify-center py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-95 transition-all text-center shadow-md shadow-primary/10"
                >
                  Write to Support
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
