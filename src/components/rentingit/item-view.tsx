"use client";

import { useState, useMemo } from "react";
import { useApp } from "./app-store";
import { useMe } from "./use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Star, MapPin, Shield, Heart, Share2, ChevronLeft, Camera, CheckCircle2,
  AlertCircle, Eye, Package,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inr, daysBetween, dateRange, relativeTime } from "./format";
import { BookingFlowModal } from "./booking-flow-modal";
import { toast } from "sonner";
import { format } from "date-fns";

export function ItemView({ id }: { id: string }) {
  const { go, openAuth } = useApp();
  const { data: meData } = useMe();
  const [activeImage, setActiveImage] = useState(0);
  const [dateRangeVal, setDateRangeVal] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [insurance, setInsurance] = useState(true);
  const [bookingFlowOpen, setBookingFlowOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["item", id],
    queryFn: async () => {
      const r = await fetch(`/api/items/${id}`);
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
  });

  const item = data?.item;
  const ownerReviews = data?.ownerReviews || [];

  const days = useMemo(() => {
    if (!dateRangeVal.from || !dateRangeVal.to) return 0;
    return daysBetween(dateRangeVal.from, dateRangeVal.to);
  }, [dateRangeVal]);

  const priceCalc = useMemo(() => {
    if (!item || days === 0) return null;
    const totalRent = item.dailyRent * days;
    const platformFee = totalRent * 0.1;
    const insuranceAmount = insurance ? Math.max(50, totalRent * 0.05) : 0;
    const grandTotal = totalRent + item.securityDeposit + platformFee + insuranceAmount;
    return { totalRent, platformFee, insuranceAmount, grandTotal };
  }, [item, days, insurance]);

  // Disabled dates (from existing bookings)
  const disabledDays = useMemo(() => {
    if (!item?.bookings?.length) return [];
    const ranges: { from: Date; to: Date }[] = [];
    for (const b of item.bookings) {
      const from = new Date(b.startDate);
      const to = new Date(b.endDate);
      ranges.push({ from, to });
    }
    return ranges;
  }, [item]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-20 text-center flex-1">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Item not found</h2>
        <Button className="mt-4" onClick={() => go({ name: "browse" })}>Browse other items</Button>
      </div>
    );
  }

  const images: string[] = typeof item.images === "string" ? JSON.parse(item.images) : item.images;
  const isOwn = item.isOwn;
  const isAvailable = item.isAvailable;
  const user = meData?.user;

  const handleBookClick = () => {
    if (!user) {
      openAuth("login");
      return;
    }
    if (isOwn) {
      toast.error("You can't book your own item");
      return;
    }
    if (!dateRangeVal.from || !dateRangeVal.to) {
      toast.error("Pick your rental dates first");
      return;
    }
    setBookingFlowOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-6 flex-1">
      <button
        onClick={() => go({ name: "browse" })}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-4 w-4" /> Back to browse
      </button>

      <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
        {/* LEFT: images + details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Image gallery */}
          <div className="space-y-2">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted relative">
              {images[activeImage] ? (
                <img src={images[activeImage]} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                  <Camera className="h-12 w-12" />
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => toast.info("Share link copied")}
                  className="h-9 w-9 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:bg-background"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toast.info("Saved to wishlist")}
                  className="h-9 w-9 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:bg-background"
                >
                  <Heart className="h-4 w-4" />
                </button>
              </div>
              <Badge className="absolute bottom-3 left-3 bg-background/90 backdrop-blur text-foreground">
                <Eye className="h-3 w-3 mr-1" /> {item.viewCount} views
              </Badge>
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative h-20 w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === activeImage ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title + meta */}
          <div>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1">
                <Badge variant="outline" className="mb-2">{item.category}</Badge>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{item.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {item.area}, {item.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-4 w-4" /> {item.condition}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{inr(item.dailyRent)}</div>
                <div className="text-xs text-muted-foreground">per day</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About this item</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">
                {item.description}
              </p>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Security deposit</div>
                  <div className="font-semibold">{inr(item.securityDeposit)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Condition</div>
                  <div className="font-semibold">{item.condition}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Listed on</div>
                  <div className="font-semibold">{format(new Date(item.createdAt), "d MMM yyyy")}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Availability</div>
                  <div className="font-semibold">
                    {isAvailable ? (
                      <span className="text-green-600">Available now</span>
                    ) : (
                      <span className="text-amber-600">Currently booked</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Owner card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Listed by</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-brand-gradient text-white text-lg font-semibold">
                    {item.owner.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold text-lg">{item.owner.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-foreground">{item.owner.trustScore?.toFixed(1)}</span>
                      <span>({item.owner.totalRatings})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {item.owner.city}
                    </span>
                  </div>
                  {item.owner.kycStatus === "VERIFIED" && (
                    <Badge className="mt-2 bg-green-50 text-green-700 border-green-200">
                      <Shield className="h-3 w-3 mr-1" /> KYC Verified
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Owner reviews */}
          {ownerReviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reviews of this owner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ownerReviews.map((r: any) => (
                  <div key={r.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-sm">{r.reviewer.name}</div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-foreground/90">{r.comment}</p>
                    <div className="text-xs text-muted-foreground mt-1">{relativeTime(r.createdAt)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT: booking widget (sticky) */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20 space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-primary">{inr(item.dailyRent)}</span>
                    <span className="text-sm text-muted-foreground">/day</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    + {inr(item.securityDeposit)} refundable deposit
                  </div>
                </div>

                {/* Date picker */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">SELECT DATES</Label>
                  <div className="rounded-lg border border-border">
                    <Calendar
                      mode="range"
                      selected={dateRangeVal}
                      onSelect={(range: any) => setDateRangeVal(range || { from: undefined, to: undefined })}
                      numberOfMonths={1}
                      disabled={[{ before: new Date() }, ...disabledDays]}
                      className="[&_button[aria-label]]:h-8 [&_button[aria-label]]:w-8"
                    />
                  </div>
                  {dateRangeVal.from && dateRangeVal.to && (
                    <div className="text-xs text-muted-foreground">
                      {dateRange(dateRangeVal.from, dateRangeVal.to)} · {days} {days === 1 ? "day" : "days"}
                    </div>
                  )}
                </div>

                {/* Insurance */}
                <label className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <Checkbox
                    checked={insurance}
                    onCheckedChange={(v) => setInsurance(v === true)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 text-sm">
                    <div className="font-medium flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-accent" /> Damage protection
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {priceCalc ? (
                        <>+ {inr(priceCalc.insuranceAmount)} — covers accidental damage, theft, loss</>
                      ) : (
                        <>Covers accidental damage, theft and loss during your rental</>
                      )}
                    </div>
                  </div>
                </label>

                {/* Price breakdown */}
                {priceCalc ? (
                  <div className="space-y-1.5 text-sm rounded-lg bg-muted/40 p-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {inr(item.dailyRent)} × {days} {days === 1 ? "day" : "days"}
                      </span>
                      <span>{inr(priceCalc.totalRent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Security deposit (refundable)</span>
                      <span>{inr(item.securityDeposit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform fee (10%)</span>
                      <span>{inr(priceCalc.platformFee)}</span>
                    </div>
                    {insurance && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Damage protection</span>
                        <span>{inr(priceCalc.insuranceAmount)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span className="text-primary">{inr(priceCalc.grandTotal)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      You&apos;ll get {inr(item.securityDeposit)} back after return
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground text-center">
                    Pick dates to see total price
                  </div>
                )}

                {/* CTA */}
                {isOwn ? (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    This is your own listing. Edit it from My Listings.
                  </div>
                ) : (
                  <Button
                    size="lg"
                    className="w-full bg-brand-gradient text-white hover:opacity-90"
                    onClick={handleBookClick}
                    disabled={!isAvailable}
                  >
                    {!isAvailable ? "Currently booked" : user ? "Request to book" : "Log in to book"}
                  </Button>
                )}

                <div className="text-xs text-center text-muted-foreground">
                  You won&apos;t be charged yet — owner must approve first
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center">
                  <div className="text-xs">
                    <Shield className="h-4 w-4 mx-auto text-accent mb-1" />
                    Escrow deposit
                  </div>
                  <div className="text-xs">
                    <CheckCircle2 className="h-4 w-4 mx-auto text-accent mb-1" />
                    KYC-verified
                  </div>
                  <div className="text-xs">
                    <Star className="h-4 w-4 mx-auto text-accent mb-1" />
                    Mutual reviews
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {priceCalc && dateRangeVal.from && dateRangeVal.to && (
        <BookingFlowModal
          open={bookingFlowOpen}
          onOpenChange={setBookingFlowOpen}
          item={item}
          startDate={dateRangeVal.from}
          endDate={dateRangeVal.to}
          priceCalc={priceCalc}
          insurance={insurance}
        />
      )}
    </div>
  );
}
