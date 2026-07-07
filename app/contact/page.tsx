import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import ContactForm from "@/components/ContactForm";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Contact Us | ServeGo",
  description: "Get in touch with ServeGo – support helpline, email contact, and messaging form.",
};

export default function ContactPage() {
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4 border border-primary/20">
            Customer Support
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
            Get in Touch
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Have queries, feedback, or need help? Fill out the contact form below or reach out to us directly.
          </p>
        </div>

        {/* Contact Form Component */}
        <ContactForm />

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
