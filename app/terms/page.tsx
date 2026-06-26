

import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions | ServeGo",
  description: "ServeGo terms and conditions governing the use of our home‑services marketplace platform.",
};

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-black tracking-tight mb-8">Terms & Conditions</h1>
        <p className="text-muted-foreground mb-4">
          Effective Date: {new Date().toLocaleDateString()}
        </p>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing or using the ServeGo platform ("Site"), you agree to be bound by these Terms & Conditions and all applicable laws. If you do not agree, you must not use the Site.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">2. Services</h2>
          <p className="text-muted-foreground">
            ServeGo connects customers with independent service professionals. We do not employ the workers; we merely facilitate introductions and bookings.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">3. Booking and Payments</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>Customers must provide accurate information and pay the Service Assurance Fee via Razorpay before a booking is confirmed.</li>
            <li>The Assurance Fee is non‑refundable unless the booking is cancelled by ServeGo for reasons other than user‑initiated cancellation.</li>
            <li>Final labor fees are paid directly to the service professional after job completion.
            </li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">4. Cancellation and Refunds</h2>
          <p className="text-muted-foreground">
            Users may cancel a booking within the cancellation window defined in the Refund & Cancellation Policy. Refunds of the Assurance Fee, if any, are processed according to that policy.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">5. User Conduct</h2>
          <p className="text-muted-foreground">
            You agree not to:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>Upload illegal, defamatory, or infringing content.</li>
            <li>Harass or discriminate against service professionals.</li>
            <li>Attempt to reverse‑engineer or misuse the platform.
            </li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">6. Liability</h2>
          <p className="text-muted-foreground">
            ServeGo acts only as an intermediary. We are not liable for the quality, safety, or timeliness of the services performed by third‑party professionals.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">7. Intellectual Property</h2>
          <p className="text-muted-foreground">
            All content, trademarks, and logos on the Site are the property of ServeGo unless otherwise indicated. Unauthorized use is prohibited.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">8. Governing Law</h2>
          <p className="text-muted-foreground">
            These Terms are governed by the laws of India, and any disputes shall be subject to the exclusive jurisdiction of courts in Bihar.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">9. Changes to Terms</h2>
          <p className="text-muted-foreground">
            We may revise these Terms at any time. The latest version will be posted on this page with an updated effective date.
          </p>
        </section>
        <div className="mt-12">
          <Link href="/" className="text-primary hover:underline">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
