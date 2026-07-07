"use client";

import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle, AlertCircle, Phone, Mail, MapPin } from "lucide-react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !mobile || !subject || !message) {
      setError("Please fill out all the fields.");
      return;
    }
    
    setError("");
    setLoading(true);

    try {
      await addDoc(collection(db, "contacts"), {
        name,
        email,
        mobile,
        subject,
        message,
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setName("");
      setEmail("");
      setMobile("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      console.error("Error submitting contact form: ", err);
      setError("Failed to send message. Please try again later or contact us directly via email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Contact Details Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-card border border-border/80 rounded-3xl p-6 md:p-8 shadow-xl space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">
              Reach Out Directly
            </h2>
            <p className="text-sm text-muted-foreground">
              We usually respond within 12-24 hours. Contact our team for booking changes, partner onboarding, or customer support issues.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Grievances & Support</h4>
                <a href="mailto:servegoofficial@gmail.com" className="text-primary hover:underline text-sm font-semibold break-all">
                  servegoofficial@gmail.com
                </a>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Call Center Helpline</h4>
                <p className="text-muted-foreground text-sm font-medium">
                  +91 80000 12345
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Monday – Sunday, 7:00 AM – 9:00 PM IST
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Corporate Office</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  ServeGo Pvt. Ltd.<br />
                  4th Floor, B-22, Tech Park,<br />
                  Aurangabad, Bihar, India – 824101
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Submission Column */}
      <div className="lg:col-span-3">
        <div className="bg-card border border-border/80 rounded-3xl p-6 md:p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-foreground tracking-tight mb-6">
            Send an Enquiry
          </h2>

          {success ? (
            <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-6 rounded-2xl flex flex-col items-center text-center gap-3">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <div>
                <h3 className="font-bold text-lg">Thank you!</h3>
                <p className="text-sm mt-1">
                  Your message has been sent successfully. Our support desk will reach out shortly.
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => setSuccess(false)}
                className="mt-2"
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-sm font-bold text-foreground">
                    Your Name
                  </label>
                  <Input 
                    type="text" 
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="h-10 border-border/80 focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="mobile" className="text-sm font-bold text-foreground">
                    Mobile Number
                  </label>
                  <Input 
                    type="tel" 
                    id="mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="h-10 border-border/80 focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-bold text-foreground">
                  Email Address
                </label>
                <Input 
                  type="email" 
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  className="h-10 border-border/80 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="subject" className="text-sm font-bold text-foreground">
                  Subject
                </label>
                <Input 
                  type="text" 
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Booking delay or Partner Registration Query"
                  className="h-10 border-border/80 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-sm font-bold text-foreground">
                  Message Description
                </label>
                <Textarea 
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you need help with..."
                  rows={4}
                  className="border-border/80 focus:border-primary min-h-[120px]"
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-primary text-primary-foreground font-semibold hover:opacity-95 active:scale-98 transition-all shadow-md shadow-primary/20 flex justify-center items-center gap-2 cursor-pointer mt-4"
              >
                {loading ? "Sending..." : (
                  <>
                    <span>Send Message</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
