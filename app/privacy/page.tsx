

import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | ServeGo",
  description: "ServeGo privacy policy explaining how we collect, use, and protect your personal data in compliance with Indian laws.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-black tracking-tight mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-4">
          Effective Date: {new Date().toLocaleDateString()}
        </p>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">1. Introduction</h2>
          <p className="text-muted-foreground">
            ServeGo ("we", "us", "our") operates the website https://servego.shop ("Site"). This Privacy Policy explains how we collect, use, store, and disclose your personal information when you use our services. We are committed to protecting your privacy in accordance with the applicable Indian laws, including the Information Technology Act, 2000 and related rules.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">2. Information We Collect</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>Personal details you provide during registration or booking (name, email, phone number, address).</li>
            <li>Payment information processed by Razorpay (we do not store card details).</li>
            <li>Technical data such as IP address, device type, browser, and usage logs.</li>
            <li>Communications with us via email, phone, or chat.</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>To provide and manage the home‑service bookings you request.</li>
            <li>To communicate with you about the status of your booking, support requests, and promotional offers (you may opt‑out anytime).</li>
            <li>To process payments securely via Razorpay.</li>
            <li>To improve the Site, analyze usage patterns, and prevent fraud.</li>
            <li>To comply with legal obligations and protect our rights.</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">4. Data Sharing and Disclosure</h2>
          <p className="text-muted-foreground">
            We may share your information with:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>Service professionals (workers) to facilitate the job.</li>
            <li>Payment processors such as Razorpay for transaction handling.</li>
            <li>Legal authorities if required by law or to protect our legal rights.</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">5. Data Retention</h2>
          <p className="text-muted-foreground">
            We retain your personal data only for as long as necessary to fulfil the purposes described herein, or as required by law. Typically, booking records are kept for a minimum of 24 months.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">6. Your Rights</h2>
          <p className="text-muted-foreground">
            You have the right to:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>Access, correct, or delete your personal data.</li>
            <li>Withdraw consent for marketing communications.</li>
            <li>Object to processing where lawful.</li>
            <li>Complaints to the appropriate supervisory authority.</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">7. Security</h2>
          <p className="text-muted-foreground">
            We implement appropriate technical and organisational measures to protect your data against unauthorised access, loss, or alteration.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">8. International Data Transfers</h2>
          <p className="text-muted-foreground">
            All data processing occurs within India. We do not transfer personal data outside of India without your explicit consent.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">9. Changes to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. The revised version will be posted on this page with an updated "Effective Date". Continued use of the Site after changes constitutes acceptance of the updated policy.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">10. Contact Us</h2>
          <p className="text-muted-foreground">
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:servegoofficial@gmail.com" className="text-primary hover:underline">servegoofficial@gmail.com</a>.
          </p>
        </section>
        <div className="mt-12">
          <Link href="/" className="text-primary hover:underline">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
