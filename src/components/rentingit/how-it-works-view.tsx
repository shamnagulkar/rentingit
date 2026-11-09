"use client";

import { useApp } from "./app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Smartphone, Shield, CheckCircle2, Wallet, Star, AlertCircle, ChevronLeft, ArrowRight, Users,
} from "lucide-react";

export function HowItWorksView() {
  const { go } = useApp();
  return (
    <div className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
      <button onClick={() => go({ name: "home" })} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <Badge className="mb-3 bg-coral-soft text-coral border-0">For renters & owners</Badge>
      <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">How RENTINGIT works</h1>
      <p className="mt-2 text-muted-foreground max-w-2xl">
        RENTINGIT is a peer-to-peer rental marketplace. Owners earn from idle stuff; renters save 90%+ vs buying.
        Here&apos;s the full flow — end to end.
      </p>

      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <Step n={1} title="Find what you need" icon={Search} color="text-amber-600 bg-amber-50 dark:bg-amber-950/30">
          Search by category, location, dates and price. Every owner is KYC-verified with a public trust score.
        </Step>
        <Step n={2} title="Send a booking request" icon={Smartphone} color="text-purple-600 bg-purple-50 dark:bg-purple-950/30">
          Pick your rental dates, opt into damage protection, and send a request. The owner gets 24h to approve.
        </Step>
        <Step n={3} title="Pay via UPI" icon={Wallet} color="text-green-600 bg-green-50 dark:bg-green-950/30">
          Once approved, pay rent + refundable deposit + platform fee via UPI (Razorpay). The deposit is held in escrow.
        </Step>
        <Step n={4} title="Pick up the item" icon={CheckCircle2} color="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30">
          Coordinate pickup with the owner. Mark the booking as &quot;picked up&quot; in the app to start the rental clock.
        </Step>
        <Step n={5} title="Return & confirm" icon={Shield} color="text-rose-600 bg-rose-50 dark:bg-rose-950/30">
          Bring the item back. The owner confirms it&apos;s returned OK, which triggers your deposit refund automatically.
        </Step>
        <Step n={6} title="Review each other" icon={Star} color="text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30">
          Both sides leave a star rating + comment. Your trust score updates — high-trust users get more bookings.
        </Step>
      </div>

      <Card className="mt-10">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" /> What if something goes wrong?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            If the item is damaged, lost, or not returned, either side can raise a dispute from the booking page.
            Both parties submit evidence. An admin reviews within 24h and decides how the deposit is split
            (0% / 50% / 100% to owner). All decisions are logged and visible to both parties.
          </p>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">Damage protection</div>
              <div className="font-medium text-sm">Optional ₹50 cover pays owner for accidental damage</div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">Escrow deposit</div>
              <div className="font-medium text-sm">Held safely, refunded only when both sides confirm</div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">Trust score</div>
              <div className="font-medium text-sm">Bad actors get filtered out — low score = no bookings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 bg-brand-soft dark:bg-muted/30 border-0">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg">Ready to RENTINGIT?</h3>
            <p className="text-sm text-muted-foreground">Browse 19+ items across India, or list your own in 2 minutes.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => go({ name: "browse" })} className="inline-flex items-center gap-1.5 rounded-lg bg-background border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
              Browse items <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => go({ name: "list-item" })} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient text-white px-4 py-2 text-sm font-medium hover:opacity-90">
              <Users className="h-4 w-4" /> List your stuff
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Step({ n, title, icon: Icon, color, children }: { n: number; title: string; icon: any; color: string; children: React.ReactNode }) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="absolute -top-3 -right-3 text-7xl font-bold text-primary/5 select-none">{n}</div>
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${color} mb-3`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{children}</p>
      </CardContent>
    </Card>
  );
}
