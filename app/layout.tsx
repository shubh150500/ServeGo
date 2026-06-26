import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import SplashScreen from "@/components/SplashScreen";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ServeGo - Reliable Local Services Marketplace Platform",
  description: "Book certified plumbers, electricians, carpenters, AC repairs, cleaners, and other home services. Verified ratings, assurance guarantees, and zero middleman commissions.",
  manifest: "/manifest.json",
  openGraph: {
    title: "ServeGo - Reliable Local Services Marketplace Platform",
    description: "Book verified plumbers, electricians, carpenters, and other home services. Quick assignment and direct coordination.",
    url: "https://servego.shop",
    siteName: "ServeGo",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preload" href="/logo.png" as="image" type="image/png" />
      </head>
      <body className="min-h-full flex flex-col">
        <SplashScreen />
        {children}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
