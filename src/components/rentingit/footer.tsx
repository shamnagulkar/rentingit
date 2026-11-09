"use client";

import { useApp } from "./app-store";
import { Sparkles, Shield, Wallet, Star } from "lucide-react";

export function Footer() {
  const { go } = useApp();
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-white font-bold">R</div>
              <div className="font-bold">
                RENTING<span className="text-brand-gradient">IT</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              India&apos;s first true peer-to-peer rental marketplace. Why buy when you can RENTINGIT?
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => go({ name: "browse" })} className="hover:text-foreground">Browse rentals</button></li>
              <li><button onClick={() => go({ name: "list-item" })} className="hover:text-foreground">List your stuff</button></li>
              <li><button onClick={() => go({ name: "how-it-works" })} className="hover:text-foreground">How it works</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Why RENTINGIT</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-accent" /> KYC-verified owners</li>
              <li className="flex items-center gap-2"><Wallet className="h-3.5 w-3.5 text-accent" /> Escrow security deposits</li>
              <li className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-accent" /> Mutual review system</li>
              <li className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-accent" /> UPI payments via Razorpay</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Built with</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Next.js 16 + TypeScript</li>
              <li>Prisma + SQLite</li>
              <li>NextAuth + JWT</li>
              <li>Tailwind + shadcn/ui</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© 2026 RENTINGIT · P2P Rental Marketplace · Made in India 🇮🇳</div>
          <div className="flex gap-4">
            <span>Internship Project</span>
            <span>·</span>
            <span>Demo mode — no real payments</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
