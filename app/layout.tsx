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

export const viewport = {
  themeColor: "#C46A4A",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "ServeGo - Reliable Local Services Marketplace Platform",
  description: "Book certified plumbers, electricians, carpenters, AC repairs, cleaners, and other home services. Verified ratings, assurance guarantees, and zero middleman commissions.",
  manifest: "/site.webmanifest",
  metadataBase: new URL("https://servego.co.in"),
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "mask-icon",
        url: "/logo.png",
        color: "#C46A4A"
      }
    ]
  },
  openGraph: {
    title: "ServeGo - Reliable Local Services Marketplace Platform",
    description: "Book verified plumbers, electricians, carpenters, and other home services. Quick assignment and direct coordination.",
    url: "https://servego.co.in",
    siteName: "ServeGo",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "ServeGo Logo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "ServeGo - Reliable Local Services Marketplace Platform",
    description: "Book verified plumbers, electricians, carpenters, and other home services.",
    images: ["/logo.png"]
  }
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
