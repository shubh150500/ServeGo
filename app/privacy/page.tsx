import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { ArrowLeft, Shield, Eye, Database, Lock, Globe } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | ServeGo",
  description: "ServeGo privacy policy explaining how we collect, use, and protect your personal data in compliance with Indian laws.",
};

export default function PrivacyPolicyPage() {
  const sections = [
    {
      icon: <Eye className="w-6 h-6 text-primary" />,
      title: "1. Information We Collect",
      content: "To provide a secure and efficient local services marketplace, ServeGo collects specific personal and technical data: \n\n• Mobile Numbers: Collected during registration for user verification, OTP-based authentication, and direct booking communication.\n• Aadhaar & Identity Documents: Collected from service providers to perform strict background checks and maintain platform security.\n• Selfies / Profile Pictures: Collected from workers to verify identity, match against official government documents, and build customer trust.\n• Booking History: Recorded to manage active requests, coordinate schedule adjustments, maintain history records, and process any cancellation refunds.\n• Device Info: Technical indicators like IP address, browser type, device identifiers, and OS version are tracked to detect malicious activities and deliver push notifications.",
    },
    {
      icon: <Database className="w-6 h-6 text-primary" />,
      title: "2. Data Storage & Firebase Integration",
      content: "All uploaded documents, including Aadhaar scans, verification selfies, and service-related images, are stored securely using Firebase Storage and Firestore. These cloud systems operate under standard encryption-at-rest protocols, ensuring your documents cannot be accessed by unauthorized third parties.",
    },
    {
      icon: <Lock className="w-6 h-6 text-primary" />,
      title: "3. Payment Security & Razorpay",
      content: "All payments and Service Assurance Fee transactions are processed through Razorpay. ServeGo does not directly store, access, or log your bank accounts, credit card numbers, or UPI credentials. All transactions are securely handled by Razorpay in compliance with industry-leading PCI-DSS standards.",
    },
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: "4. Data Sharing & Disclosure",
      content: "We only share your information when necessary: (a) Sharing customer contact details and booking addresses with assigned workers to facilitate jobs; (b) Sharing verification records with third-party background checkers; and (c) Cooperating with law enforcement under legal warrants or standard Indian government rules.",
    },
    {
      icon: <Globe className="w-6 h-6 text-primary" />,
      title: "5. Your Privacy Rights",
      content: "Under the Digital Personal Data Protection (DPDP) Act of India, you retain the right to review, update, or request deletion of your personal data. To delete your account or withdraw consent for data processing, please email our grievance officer.",
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
            Privacy Assurance
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Understand how we handle, store, and safeguard your data.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Policy Sections */}
          <div className="lg:col-span-2 space-y-6">
            {sections.map((section, idx) => (
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

          {/* Quick Navigation / Summary Sidebar */}
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
                <h4 className="text-sm font-bold text-foreground mb-2">Privacy Questions?</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Please reach out to our support or privacy compliance team directly.
                </p>
                <a 
                  href="mailto:servegoofficial@gmail.com" 
                  className="inline-flex w-full items-center justify-center py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-95 transition-all text-center shadow-md shadow-primary/10"
                >
                  Email Privacy Officer
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
