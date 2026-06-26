"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Lock, Mail, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";

export default function AdminRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!email || !password) {
      setError("Please fill out both email and password.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    const emailLower = email.toLowerCase().trim();
    const isAllowed = 
      emailLower === "shubhamrajput7667@gmail.com" || 
      emailLower === "ayush00ansh@gmail.com";

    if (!isAllowed) {
      setError("This email address is not authorized for administrator registration.");
      setLoading(false);
      return;
    }

    try {
      // Create admin account in Firebase Authentication
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess(true);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to create account. Make sure Firebase Email/Password Auth is enabled.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-primary/20">
      
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-3xl" />

      <div className="absolute top-6 left-6">
        <Link href="/admin/login" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <img src="/logo.png" alt="ServeGo Logo" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-2xl font-black tracking-tighter text-black">
              ServeGo
            </span>
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">
            Create Admin Account
          </h2>
          <p className="text-muted-foreground text-sm">
            Register your administrative credentials locally.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-card py-8 px-4 border border-border/80 shadow-2xl rounded-3xl sm:px-10">
          {success ? (
            <div className="text-center space-y-6 py-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary animate-bounce">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black">Account Created!</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your admin profile has been registered in your Firebase database. You can now use these credentials to log in.
              </p>
              <div className="pt-4">
                <Link
                  href="/admin/login"
                  className="w-full inline-flex items-center justify-center py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/30 transition-all duration-300"
                >
                  Go to Login Screen
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleRegister}>
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-bold text-foreground/80">
                  New Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@localservices.com"
                    className="w-full pl-10 pr-4 py-3 bg-muted/40 border border-border/85 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-bold text-foreground/80">
                  Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-4 py-3 bg-muted/40 border border-border/85 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/45 text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/95 shadow-lg transition-all duration-300 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Registering..." : "Register Credentials"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
            <p>Once you register your account, you can use it to log in and start testing the Admin Portal.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
