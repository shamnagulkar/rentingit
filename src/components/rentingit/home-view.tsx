"use client";

import { useState } from "react";
import { useApp } from "./app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera, Gamepad2, Wrench, Tent, Shirt, Music, BookOpen,
  HeartPulse, Microwave, Dumbbell, PartyPopper, Search,
  Shield, Wallet, Star, ArrowRight, Smartphone, MapPin, Sparkles,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { inr } from "./format";

const CATEGORIES = [
  { name: "Camera & Media", icon: Camera, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
  { name: "Gaming", icon: Gamepad2, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
  { name: "Tools & Hardware", icon: Wrench, color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30" },
  { name: "Outdoor & Camping", icon: Tent, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
  { name: "Fashion", icon: Shirt, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30" },
  { name: "Music", icon: Music, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" },
  { name: "Books & Stationery", icon: BookOpen, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30" },
  { name: "Health & Medical", icon: HeartPulse, color: "text-red-600 bg-red-50 dark:bg-red-950/30" },
  { name: "Electronics", icon: Smartphone, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
  { name: "Appliances", icon: Microwave, color: "text-teal-600 bg-teal-50 dark:bg-teal-950/30" },
  { name: "Sports & Fitness", icon: Dumbbell, color: "text-lime-600 bg-lime-50 dark:bg-lime-950/30" },
  { name: "Events & Party", icon: PartyPopper, color: "text-pink-600 bg-pink-50 dark:bg-pink-950/30" },
];

export function HomeView() {
  const { go } = useApp();
  const [searchQ, setSearchQ] = useState("");

  const { data: featured } = useQuery({
    queryKey: ["items", "featured"],
    queryFn: async () => {
      const r = await fetch("/api/items?limit=8");
      const j = await r.json();
      return j.items as any[];
    },
  });

  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const r = await fetch("/api/categories");
      return r.json();
    },
  });
  const catCountMap = new Map<string, number>(
    (catData?.categories || []).map((c: any) => [c.name, c.count])
  );

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    go({ name: "browse", q: searchQ || undefined });
  };

  return (
    <div className="flex-1">
      {/* HERO */}
      <section className="hero-pattern border-b border-border/60">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 bg-coral-soft text-coral border-0 hover:bg-coral-soft">
              <Sparkles className="h-3 w-3 mr-1" /> India&apos;s first true P2P rental marketplace
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight leading-tight">
              Why buy when you can{" "}
              <span className="text-brand-gradient">rent it?</span>
            </h1>
            <p className="mt-5 text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
              Rent cameras, drills, PlayStations, camping gear, designer wear — anything — from
              verified neighbours near you. UPI payments, KYC-verified owners, escrow deposits.
              Save <strong className="text-foreground">90%+</strong> vs buying.
            </p>

            {/* Search bar */}
            <form onSubmit={submitSearch} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Try 'camera', 'PS5', 'drill'…"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  className="pl-10 h-12 bg-background shadow-sm"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 bg-brand-gradient text-white hover:opacity-90 px-6">
                Search
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-accent" /> KYC-verified owners
              </span>
              <span className="flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-accent" /> Escrow security deposits
              </span>
              <span className="flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-accent" /> UPI payments
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Browse by category</h2>
            <p className="text-sm text-muted-foreground mt-1">12 categories of stuff lying unused in someone&apos;s house.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => go({ name: "browse" })} className="hidden sm:flex">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((cat) => {
            const count = catCountMap.get(cat.name) || 0;
            return (
              <button
                key={cat.name}
                onClick={() => go({ name: "browse", category: cat.name })}
                className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${cat.color} group-hover:scale-110 transition-transform`}>
                  <cat.icon className="h-6 w-6" />
                </div>
                <div className="text-sm font-medium leading-tight">{cat.name}</div>
                <div className="text-[11px] text-muted-foreground">{count} {count === 1 ? "item" : "items"}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* FEATURED ITEMS */}
      {featured && featured.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Fresh on RENTINGIT</h2>
              <p className="text-sm text-muted-foreground mt-1">Newest listings across India.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => go({ name: "browse" })}>
              See all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((it) => (
              <ItemCard key={it.id} item={it} onClick={() => go({ name: "item", id: it.id })} />
            ))}
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">How RENTINGIT works</h2>
          <p className="mt-2 text-muted-foreground">Three steps. No middlemen. No surprises.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <HowStep
            n={1}
            title="Find it"
            description="Search for anything near you — filter by category, location, dates, price."
            icon={Search}
          />
          <HowStep
            n={2}
            title="Book & pay"
            description="Pick dates, pay rent + refundable deposit via UPI. Deposit is held in escrow."
            icon={Smartphone}
          />
          <HowStep
            n={3}
            title="Pick up & return"
            description="Meet the owner, use the item, return it. Deposit auto-refunded. Both sides review."
            icon={Shield}
          />
        </div>
      </section>

      {/* EARN CTA */}
      <section className="border-t border-border/60 bg-brand-soft dark:bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="mb-3 bg-accent/15 text-accent border-0">
                <Wallet className="h-3 w-3 mr-1" /> Earn from idle stuff
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
                Your drill earned ₹0 last year.
              </h2>
              <p className="mt-2 text-3xl lg:text-4xl font-bold text-brand-gradient">
                Make it earn ₹2,400.
              </p>
              <p className="mt-4 text-muted-foreground">
                List it in 2 minutes. Average Indian household has ₹50,000+ of unused stuff —
                cameras used 5 days a year, drills used 2 hours, gaming consoles gathering dust.
                Turn that idle shelf into monthly income.
              </p>
              <Button
                size="lg"
                className="mt-6 bg-brand-gradient text-white hover:opacity-90"
                onClick={() => go({ name: "list-item" })}
              >
                List your stuff <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Average earnings by item type</h3>
                <div className="space-y-3">
                  {[
                    { item: "DSLR Camera", per: 1500, monthly: 6 },
                    { item: "PlayStation 5", per: 800, monthly: 4 },
                    { item: "Drill Machine", per: 150, monthly: 8 },
                    { item: "Designer Saree", per: 1200, monthly: 2 },
                    { item: "Party Speaker", per: 900, monthly: 3 },
                  ].map((e) => (
                    <div key={e.item} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{e.item}</span>
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-foreground">{inr(e.per * e.monthly)}</span>/mo
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">Estimates based on platform averages. Platform keeps 10% commission.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* TRUST STATS */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { stat: "₹50,000+", label: "Avg value of unused stuff per household" },
            { stat: "90%", label: "Saving vs buying new for one-time use" },
            { stat: "10%", label: "Platform commission (industry-low)" },
            { stat: "24h", label: "Dispute resolution SLA" },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl lg:text-4xl font-bold text-brand-gradient">{s.stat}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function HowStep({ n, title, description, icon: Icon }: { n: number; title: string; description: string; icon: any }) {
  return (
    <Card className="border-border/60 relative overflow-hidden">
      <CardContent className="p-6">
        <div className="absolute -top-2 -right-2 text-7xl font-bold text-primary/5 select-none">
          {n}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white mb-4">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function ItemCard({ item, onClick }: { item: any; onClick: () => void }) {
  const images: string[] = typeof item.images === "string" ? JSON.parse(item.images) : item.images;
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl bg-card overflow-hidden card-lift border border-border/60"
    >
      <div className="aspect-[5/4] bg-muted overflow-hidden relative">
        {images?.[0] ? (
          <img
            src={images[0]}
            alt={item.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <Camera className="h-8 w-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {item.condition === "New" && (
          <Badge className="absolute top-3 left-3 bg-white/95 text-foreground border-0 shadow-sm">New</Badge>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <Badge variant="secondary" className="bg-foreground text-background">Currently booked</Badge>
          </div>
        )}
      </div>
      <div className="p-3.5">
        <div className="font-semibold text-sm line-clamp-1 leading-tight">{item.title}</div>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" /> {item.area}, {item.city}
        </div>
        <div className="mt-2.5 flex items-end justify-between">
          <div>
            <span className="text-base font-bold text-foreground">{inr(item.dailyRent)}</span>
            <span className="text-xs text-muted-foreground"> /day</span>
          </div>
          {item.owner && (
            <div className="flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-medium">{item.owner.trustScore?.toFixed?.(1) || "5.0"}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
