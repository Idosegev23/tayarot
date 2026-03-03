import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { Analytics } from '@vercel/analytics/react';
import "@/lib/env"; // Validate environment variables at startup

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  title: {
    default: "Agent Mary - Your Holy Land Journey Companion",
    template: "%s | Agent Mary",
  },
  description: "Share your Holy Land journey with AI-powered post creation, biblical verses, and beautiful photo layouts. Connect with your tour guide and preserve your spiritual experiences.",
  keywords: ["Holy Land", "Israel tourism", "biblical tours", "travel AI", "tour guide", "Jerusalem", "spiritual journey"],
  authors: [{ name: "Agent Mary Team" }],
  creator: "Agent Mary",
  publisher: "Agent Mary",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Agent Mary - Your Holy Land Journey Companion",
    description: "Share your Holy Land journey with AI-powered post creation and biblical verses",
    siteName: "Agent Mary",
    images: [
      {
        url: "/Logo.png",
        width: 1200,
        height: 630,
        alt: "Agent Mary Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Mary - Your Holy Land Journey Companion",
    description: "Share your Holy Land journey with AI-powered post creation and biblical verses",
    images: ["/Logo.png"],
    creator: "@agentmary",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/Logo.png",
    apple: "/Logo.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ToastProvider />
        <Analytics />
      </body>
    </html>
  );
}
