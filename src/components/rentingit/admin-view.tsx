"use client";

import { useApp } from "./app-store";
import { useMe } from "./use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users, Package, Calendar, IndianRupee, AlertTriangle, ShieldCheck, TrendingUp, ChevronLeft, Eye,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { inr, relativeTime, statusColor } from "./format";
import { KycReviewQueue } from "./kyc-review-queue";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

const PIE_COLORS = ["oklch(0.65 0.18 50)", "oklch(0.55 0.13 145)", "oklch(0.50 0.20 300)", "oklch(0.78 0.16 85)", "oklch(0.62 0.21 12)"];

export function AdminView() {
  const { go } = useApp();
  const { data: meData } = useMe();
  const user = meData?.user;

  const { data, isLoading } = useQuery({
    queryKey: ["admin"],
    queryFn: async () => {
      const r = await fetch("/api/admin", { cache: "no-store" });
      if (!r.ok) throw new Error("Forbidden");
      return r.json();
    },
    enabled: !!user && user.role === "ADMIN",
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center flex-1">
        <h2 className="mt-4 text-xl font-semibold">Please log in</h2>
        <Button className="mt-4 bg-brand-gradient text-white hover:opacity-90" onClick={() => useApp.getState().openAuth("login")}>Log in</Button>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-20 text-center flex-1">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Admins only</h2>
        <p className="text-sm text-muted-foreground mt-1">You need an admin account to access this page.</p>
        <p className="text-xs text-muted-foreground mt-2">Demo: log in as admin@rentingit.in / admin123</p>
        <Button className="mt-4 bg-brand-gradient text-white hover:opacity-90" onClick={() => useApp.getState().openAuth("login")}>
          Switch to admin
        </Button>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="container mx-auto px-4 py-8 flex-1">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const s = data.stats;
  const categoryData = data.byCategory.slice(0, 6);
  const statusData = data.byStatus.map((b: any) => ({ name: b.status, value: b.count }));

  return (
    <div className="container mx-auto px-4 py-8 flex-1">
      <button onClick={() => go({ name: "home" })} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6">
        <Badge className="mb-2 bg-purple-50 text-purple-700 border-purple-200">
          <ShieldCheck className="h-3 w-3 mr-1" /> Admin Dashboard
        </Badge>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Platform overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time view of RENTINGIT&apos;s marketplace health.</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi icon={Users} label="Total users" value={s.totalUsers} sub={`${s.pendingKyc} KYC pending`} color="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" />
        <Kpi icon={Package} label="Active listings" value={s.totalItems} color="text-amber-600 bg-amber-50 dark:bg-amber-950/30" />
        <Kpi icon={Calendar} label="Total bookings" value={s.totalBookings} sub={`${s.activeBookings} active · ${s.completedBookings} done`} color="text-purple-600 bg-purple-50 dark:bg-purple-950/30" />
        <Kpi icon={IndianRupee} label="Total GMV" value={inr(s.totalRevenue)} sub={`${inr(s.platformRevenue)} platform revenue`} color="text-green-600 bg-green-50 dark:bg-green-950/30" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Bookings by category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Bookings by category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">No bookings yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={categoryData} margin={{ top: 5, right: 5, bottom: 30, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="oklch(0.65 0.18 50)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bookings by status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Booking status distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">No bookings yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={90}
                    dataKey="value"
                    label={(e: any) => `${e.name} (${e.value})`}
                    labelLine={false}
                  >
                    {statusData.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top items */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Top items by views</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {data.topItems.map((it: any, i: number) => {
              const images: string[] = typeof it.images === "string" ? JSON.parse(it.images) : it.images;
              return (
                <div key={it.id} className="flex items-center gap-3 p-3 hover:bg-muted/30">
                  <div className="text-sm font-bold text-muted-foreground w-5">{i + 1}</div>
                  <div className="h-10 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                    {images?.[0] && (
                      <img src={images[0]} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => go({ name: "item", id: it.id })} className="text-sm font-medium hover:underline line-clamp-1 text-left">
                      {it.title}
                    </button>
                    <div className="text-xs text-muted-foreground">
                      {it.category} · {it.city} · by {it.owner.name}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-bold">{it.viewCount} views</div>
                    <div className="text-xs text-muted-foreground">{it.bookingCount} bookings</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => go({ name: "item", id: it.id })}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent bookings */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Recent bookings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border max-h-80 overflow-y-auto fancy-scroll">
            {data.recentBookings.map((b: any) => {
              const images: string[] = typeof b.item.images === "string" ? JSON.parse(b.item.images) : b.item.images;
              return (
                <div key={b.id} className="flex items-center gap-3 p-3">
                  <div className="h-10 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                    {images?.[0] && (
                      <img src={images[0]} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-1">{b.item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      by {b.renter.name} · {inr(b.grandTotal)} · {relativeTime(b.createdAt)}
                    </div>
                  </div>
                  <Badge className={statusColor(b.status)}>{b.status}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* KYC review queue */}
      <KycReviewQueue docs={data.pendingKycDocs || []} />

      {/* Open disputes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Disputes queue
            {data.disputes.length > 0 && (
              <Badge className="bg-red-100 text-red-700 border-0">{data.disputes.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.disputes.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              🎉 No open disputes. Platform is healthy.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.disputes.map((d: any) => (
                <div key={d.id} className="p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-sm font-medium">{d.booking.item.title}</div>
                    <Badge className={statusColor(d.status)}>{d.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Raised by {d.raisedBy.name} · {relativeTime(d.createdAt)}
                  </div>
                  <div className="text-sm mt-1 font-medium">{d.reason}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{d.description}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: any; sub?: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${color} mb-2`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl lg:text-2xl font-bold">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}
