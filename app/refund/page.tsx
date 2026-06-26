

import Link from "next/link";

export const metadata = {
  title: "Refund & Cancellation Policy | ServeGo",
  description: "ServeGo policy outlining refunds, cancellations, and the Service Assurance Fee handling.",
};

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-black tracking-tight mb-8">Refund &amp; Cancellation Policy</h1>
        <p className="text-muted-foreground mb-4">
          Effective Date: {new Date().toLocaleDateString()}
        </p>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">1. Service Assurance Fee</h2>
          <p className="text-muted-foreground">
            A non‑refundable Service Assurance Fee is required at the time of booking to secure the appointment and cover administrative costs. The fee is collected via Razorpay before the booking is confirmed.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">2. User‑Initiated Cancellation
          </h2>
          <p className="text-muted-foreground">
            You may cancel a booking within the cancellation window specified for each service (usually 24‑hours before the scheduled time). If you cancel within this window, you are eligible for a refund of the Service Assurance Fee according to the following:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>Cancellation more than 24 hours before the scheduled service – 100% refund of the Assurance Fee.</li>
            <li>Cancellation between 24 hours and 2 hours before the service – 50% refund of the Assurance Fee.</li>
            <li>Cancellation less than 2 hours before the service – No refund.</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">3. ServeGo‑Initiated Cancellation</h2>
          <p className="text-muted-foreground">
            If ServeGo cancels a booking for any reason (e.g., unavailability of qualified workers, safety concerns), you will receive a full refund of the Service Assurance Fee and may be offered an alternative slot.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">4. Refund Process</h2>
          <p className="text-muted-foreground">
            Refunds are processed automatically to the original payment method within 5‑7 business days after approval. You will receive an email confirmation once the refund is issued.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">5. Contact for Refund Queries</h2>
          <p className="text-muted-foreground">
            For any questions regarding refunds, please contact us at{' '}
            <a href="mailto:servegoofficial@gmail.com" className="text-primary hover:underline">servegoofficial@gmail.com</a>.
          </p>
        </section>
        <div className="mt-12">
          <Link href="/" className="text-primary hover:underline">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
