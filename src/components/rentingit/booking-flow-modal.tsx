"use client";

import { useState } from "react";
import { useApp } from "./app-store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield, CheckCircle2, Smartphone, Loader2, ChevronRight, AlertCircle,
  Calendar, MapPin, ArrowLeft,
} from "lucide-react";
import { inr, dateRange } from "./format";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type PriceCalc = {
  totalRent: number;
  platformFee: number;
  insuranceAmount: number;
  grandTotal: number;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: any;
  startDate: Date;
  endDate: Date;
  priceCalc: PriceCalc;
  insurance: boolean;
};

export function BookingFlowModal({ open, onOpenChange, item, startDate, endDate, priceCalc, insurance }: Props) {
  const { go } = useApp();
  const qc = useQueryClient();
  const [step, setStep] = useState<"review" | "payment" | "processing" | "success">("review");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [upiId, setUpiId] = useState("renter@okhdfcbank");

  const createBooking = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          insurancePurchased: insurance,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to create booking");
      return j.booking;
    },
    onSuccess: (b) => {
      setBookingId(b.id);
      setStep("payment");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const payAndConfirm = useMutation({
    mutationFn: async () => {
      // Mock Razorpay: simulate payment success
      const r = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay" }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Payment failed");
      return j.booking;
    },
    onSuccess: () => {
      setStep("processing");
      setTimeout(() => {
        setStep("success");
        qc.invalidateQueries({ queryKey: ["me"] });
        qc.invalidateQueries({ queryKey: ["bookings"] });
      }, 1500);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reset = () => {
    setStep("review");
    setBookingId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : reset())}>
      <DialogContent className="sm:max-w-lg">
        {step === "review" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Calendar className="h-5 w-5 text-primary" /> Review & request
              </DialogTitle>
              <DialogDescription>
                Owner gets 24h to approve. You pay only after approval.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {/* Item summary */}
              <div className="flex gap-3 rounded-lg border border-border p-3">
                <div className="h-16 w-20 rounded-md overflow-hidden bg-muted shrink-0">
                  <img
                    src={(typeof item.images === "string" ? JSON.parse(item.images) : item.images)[0]}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm line-clamp-1">{item.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {item.area}, {item.city}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {dateRange(startDate, endDate)} · {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                  </div>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rental ({Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days)</span>
                  <span>{inr(priceCalc.totalRent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Security deposit</span>
                  <span>{inr(item.securityDeposit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee (10%)</span>
                  <span>{inr(priceCalc.platformFee)}</span>
                </div>
                {insurance && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3 text-accent" /> Damage protection
                    </span>
                    <span>{inr(priceCalc.insuranceAmount)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-base">
                  <span>Total payable</span>
                  <span className="text-primary">{inr(priceCalc.grandTotal)}</span>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {inr(item.securityDeposit)} refunded after return
                </div>
              </div>

              <Button
                className="w-full bg-brand-gradient text-white hover:opacity-90"
                onClick={() => createBooking.mutate()}
                disabled={createBooking.isPending}
              >
                {createBooking.isPending ? "Creating request…" : "Send booking request"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                You won&apos;t pay until the owner approves. Cancel anytime before approval.
              </p>
            </div>
          </>
        )}

        {step === "payment" && (
          <>
            <DialogHeader>
              <button
                onClick={() => setStep("review")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Smartphone className="h-5 w-5 text-primary" /> UPI Payment
              </DialogTitle>
              <DialogDescription>
                Owner approved your request. Pay now to confirm the booking.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Mock Razorpay-style payment screen */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">Razorpay · Test Mode</div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">DEMO</Badge>
                  </div>
                  <div className="text-2xl font-bold mt-2">{inr(priceCalc.grandTotal)}</div>
                  <div className="text-xs opacity-90 mt-0.5">to {item.owner?.name}</div>
                </div>
                <div className="p-4 space-y-3 bg-card">
                  <div className="space-y-1.5">
                    <Label htmlFor="upi" className="text-xs">PAY VIA UPI ID</Label>
                    <Input
                      id="upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@okhdfcbank"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {["GPay", "PhonePe", "Paytm"].map((m) => (
                      <div key={m} className="rounded-lg border border-border p-2 text-center text-xs font-medium hover:border-primary cursor-pointer">
                        {m}
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-90 text-white"
                    onClick={() => payAndConfirm.mutate()}
                    disabled={payAndConfirm.isPending}
                  >
                    Pay {inr(priceCalc.grandTotal)}
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Demo payment:</strong> No real money is moved. This simulates the Razorpay
                  UPI flow for showcase. In production this would call Razorpay&apos;s checkout SDK
                  with real API keys.
                </div>
              </div>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h3 className="mt-4 font-semibold">Processing payment…</h3>
            <p className="text-sm text-muted-foreground mt-1">Confirming with your bank</p>
          </div>
        )}

        {step === "success" && (
          <div className="py-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-green-600" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Booking confirmed!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {inr(priceCalc.grandTotal)} paid. Owner has been notified.
            </p>
            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-left text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booking ID</span>
                <span className="font-mono text-xs">#{bookingId?.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className="bg-indigo-100 text-indigo-800">PAID — ready for pickup</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pickup window</span>
                <span className="font-medium">{dateRange(startDate, endDate)}</span>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button
                variant="outline" className="flex-1"
                onClick={() => { reset(); go({ name: "browse" }); }}
              >
                Continue browsing
              </Button>
              <Button
                className="flex-1 bg-brand-gradient text-white hover:opacity-90"
                onClick={() => { reset(); go({ name: "my-bookings" }); }}
              >
                View my bookings
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
