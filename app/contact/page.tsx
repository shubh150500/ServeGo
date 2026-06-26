

import Link from "next/link";

export const metadata = {
  title: "Contact Us | ServeGo",
  description: "Get in touch with ServeGo – email, phone, and address information for customer support and partnership inquiries.",
};

export default function Contact() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-black tracking-tight mb-8">Contact Us</h1>
        <p className="text-muted-foreground mb-4">
          Effective Date: {new Date().toLocaleDateString()}
        </p>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">Customer Support</h2>
          <p className="text-muted-foreground">
            For any questions, issues, or feedback regarding our services, please email us at
            <a href="mailto:servegoofficial@gmail.com" className="text-primary hover:underline ml-1">servegoofficial@gmail.com</a>.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">Phone</h2>
          <p className="text-muted-foreground">
            You can reach our support line at <strong>+91 80000 12345</strong> (Monday – Sunday, 7:00 AM – 9:00 PM IST).
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">Office Address</h2>
          <p className="text-muted-foreground">
            ServeGo Pvt. Ltd.<br />
            4th Floor, B-22, Tech Park,
            <br />
            Aurangabad, Bihar, India – 824101
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">Social & Partners</h2>
          <p className="text-muted-foreground">
            Follow us on social media for updates, promotions, and service announcements.
          </p>
          {/* Placeholder icons – replace with actual SVGs or components as needed */}
          <div className="flex space-x-4 mt-2">
            <a href="#" className="text-primary hover:text-foreground transition-colors" aria-label="LinkedIn">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8h5V24H0V8zm7.53 0h4.81v2.18h.07c.67-1.26 2.3-2.59 4.73-2.59 5.07 0 6 3.34 6 7.68V24h-5v-7.9c0-1.88-.03-4.3-2.62-4.3-2.62 0-3.03 2.05-3.03 4.16V24h-5V8z"/></svg>
            </a>
            <a href="#" className="text-primary hover:text-foreground transition-colors" aria-label="Twitter">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 4.557a9.83 9.83 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.916 4.916 0 0 0-8.38 4.482c-4.083-.205-7.7-2.162-10.124-5.138a4.822 4.822 0 0 0-.666 2.475c0 1.708.869 3.213 2.188 4.096a4.904 4.904 0 0 1-2.228-.616c-.054 2.385 1.68 4.614 4.15 5.102a4.936 4.936 0 0 1-2.224.084c.626 1.956 2.444 3.376 4.6 3.416A9.867 9.867 0 0 1 0 19.54a13.936 13.936 0 0 0 7.548 2.212c9.055 0 14.009-7.496 14.009-13.986 0-.21-.005-.423-.014-.634A10.025 10.025 0 0 0 24 4.557z"/></svg>
            </a>
          </div>
        </section>
        <div className="mt-12">
          <Link href="/" className="text-primary hover:underline">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
