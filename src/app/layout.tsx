import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/rentingit/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RENTINGIT — Peer-to-Peer Rental Marketplace for India",
  description:
    "Rent anything from neighbours in your city. Cameras, drills, gaming consoles, camping gear, designer wear — at 1/10th the price. UPI payments, KYC-verified owners, escrow deposits.",
  keywords: [
    "RENTINGIT", "rent", "P2P rental", "India rentals", "rent camera", "rent PlayStation",
    "rent drill", "peer to peer marketplace", "Fat Llama India",
  ],
  authors: [{ name: "RENTINGIT" }],
  openGraph: {
    title: "RENTINGIT — Rent Anything from Neighbours",
    description: "India's P2P rental marketplace. UPI + KYC + escrow deposits.",
    siteName: "RENTINGIT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RENTINGIT — P2P Rental Marketplace",
    description: "India's P2P rental marketplace. UPI + KYC + escrow deposits.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
          <SonnerToaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
