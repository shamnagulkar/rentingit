"use client";

import { useState } from "react";
import { useApp } from "./app-store";
import { useMe } from "./use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Calendar, Package, Star, MapPin, Shield, AlertCircle, CheckCircle2,
  Clock, ArrowRight, ChevronRight, Loader2, Phone, X, MessageCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inr, dateRange, daysBetween, statusColor, statusLabel, relativeTime } from "./format";
import { toast } from "sonner";
import { ChatPanel } from "./chat-panel";

export function MyBookingsView() {
  const [role, setRole] = useState<"renter" | "owner">("renter");
  const { data: meData } = useMe();
  const user = meData?.user;

  const { data, isLoading } = useQuery({
    queryKey: ["bookings", role],
    queryFn: async () => {
      const r = await fetch(`/api/bookings?role=${role}`, { cache: "no-store" });
      const j = await r.json();
      return j.bookings as any[];
    },
    enabled: !!user,
  });

  if (!user) return <NotLoggedIn />;

  return (
    <div className="container mx-auto px-4 py-8 flex-1">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">Track everything you&apos;re renting and renting out.</p>
      </div>

      <Tabs value={role} onValueChange={(v) => setRole(v as "renter" | "owner")}>
        <TabsList>
          <TabsTrigger value="renter">As Renter</TabsTrigger>
          <TabsTrigger value="owner">As Owner</TabsTrigger>
        </TabsList>

        <TabsContent value="renter" className="mt-4">
          <BookingsList
            bookings={data || []}
            loading={isLoading}
            perspective="renter"
          />
        </TabsContent>
        <TabsContent value="owner" className="mt-4">
          <BookingsList
            bookings={data || []}
            loading={isLoading}
            perspective="owner"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingsList({ bookings, loading, perspective }: { bookings: any[]; loading: boolean; perspective: "renter" | "owner" }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
            <Package className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">No bookings yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {perspective === "renter"
              ? "Book something from the marketplace to see it here."
              : "List an item and accept bookings to see them here."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <BookingCard key={b.id} booking={b} perspective={perspective} />
      ))}
    </div>
  );
}

function BookingCard({ booking, perspective }: { booking: any; perspective: "renter" | "owner" }) {
  const qc = useQueryClient();
  const { go } = useApp();
  const { data: meData } = useMe();
  const sessionUserId = meData?.user?.id;
  const images: string[] = typeof booking.item.images === "string" ? JSON.parse(booking.item.images) : booking.item.images;
  const days = daysBetween(booking.startDate, booking.endDate);
  const otherParty = perspective === "renter" ? booking.item.owner : booking.renter;

  const [reviewOpen, setReviewOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDesc, setDisputeDesc] = useState("");

  const action = useMutation({
    mutationFn: async (action: string, extra?: any) => {
      const r = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Action failed");
      return j;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      const type = perspective === "renter" ? "RENTER_TO_OWNER" : "OWNER_TO_RENTER";
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          rating,
          comment: reviewComment,
          type,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Review failed");
      return j;
    },
    onSuccess: () => {
      toast.success("Review submitted");
      setReviewOpen(false);
      setReviewComment("");
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["item", booking.itemId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const submitDispute = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "raise-dispute",
          reason: disputeReason,
          description: disputeDesc,
          evidencePhotos: [],
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to raise dispute");
      return j;
    },
    onSuccess: () => {
      toast.success("Dispute raised. Admin will review within 24h.");
      setDisputeOpen(false);
      setDisputeReason("");
      setDisputeDesc("");
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const otherPartyName = perspective === "renter" ? booking.item?.owner?.name || "Owner" : booking.renter?.name || "Renter";
  const alreadyReviewed = booking.reviews?.some(
    (r: any) =>
      r.type === (perspective === "renter" ? "RENTER_TO_OWNER" : "OWNER_TO_RENTER") &&
      r.reviewerId !== (perspective === "renter" ? booking.renterId : booking.item.ownerId)
  );

  // Show the correct other party member — owner comes from item, renter is direct
  const showOther = () => {
    if (perspective === "renter") {
      return (
        <>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-brand-gradient text-white text-xs font-semibold">
              {(booking.item?.owner?.name || "O").split(" ").map((s: string) => s[0]).slice(0, 2).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="text-xs">
            <div className="font-medium">{booking.item?.owner?.name}</div>
            <div className="text-muted-foreground flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {booking.item?.owner?.trustScore?.toFixed?.(1) || "5.0"}
              {booking.item?.owner?.kycStatus === "VERIFIED" && <Shield className="h-3 w-3 text-green-600" />}
            </div>
          </div>
        </>
      );
    } else {
      return (
        <>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-brand-gradient text-white text-xs font-semibold">
              {(booking.renter?.name || "R").split(" ").map((s: string) => s[0]).slice(0, 2).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="text-xs">
            <div className="font-medium">{booking.renter?.name}</div>
            <div className="text-muted-foreground flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {booking.renter?.trustScore?.toFixed?.(1) || "5.0"}
              {booking.renter?.kycStatus === "VERIFIED" && <Shield className="h-3 w-3 text-green-600" />}
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image */}
          <button
            onClick={() => go({ name: "item", id: booking.item.id })}
            className="h-24 w-24 sm:h-28 sm:w-28 rounded-lg overflow-hidden bg-muted shrink-0"
          >
            {images?.[0] && (
              <img src={images[0]} alt={booking.item.title} className="h-full w-full object-cover" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <button
                  onClick={() => go({ name: "item", id: booking.item.id })}
                  className="font-semibold text-sm line-clamp-1 text-left hover:underline"
                >
                  {booking.item.title}
                </button>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" /> {booking.item.area}, {booking.item.city}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3" /> {dateRange(booking.startDate, booking.endDate)} · {days} {days === 1 ? "day" : "days"}
                </div>
              </div>
              <Badge className={`shrink-0 ${statusColor(booking.status)}`}>
                {booking.status}
              </Badge>
            </div>

            <div className="mt-2 flex items-center gap-2">
              {showOther()}
              <Separator orientation="vertical" className="h-6" />
              <div className="text-xs">
                <div className="text-muted-foreground">Total paid</div>
                <div className="font-semibold">{inr(booking.grandTotal)}</div>
              </div>
            </div>

            {/* Action buttons based on status + perspective */}
            <div className="mt-3 flex flex-wrap gap-2">
              {perspective === "owner" && booking.status === "REQUESTED" && (
                <>
                  <Button
                    size="sm" className="bg-brand-gradient text-white hover:opacity-90"
                    disabled={action.isPending}
                    onClick={() => action.mutate("approve", { action: "approve" })}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    disabled={action.isPending}
                    onClick={() => action.mutate("reject", { action: "reject" })}
                  >
                    Decline
                  </Button>
                </>
              )}

              {perspective === "renter" && booking.status === "APPROVED" && (
                <Button
                  size="sm" className="bg-brand-gradient text-white hover:opacity-90"
                  disabled={action.isPending}
                  onClick={() => action.mutate("pay", { action: "pay" })}
                >
                  <Clock className="h-4 w-4 mr-1" /> Pay {inr(booking.grandTotal)} now
                </Button>
              )}

              {perspective === "renter" && booking.status === "PAID" && (
                <Button
                  size="sm" className="bg-brand-gradient text-white hover:opacity-90"
                  disabled={action.isPending}
                  onClick={() => {
                    action.mutate("pickup", { action: "pickup" });
                    toast.success("Marked as picked up. Enjoy your rental!");
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Mark picked up
                </Button>
              )}

              {perspective === "renter" && booking.status === "PICKED_UP" && (
                <Button
                  size="sm" className="bg-brand-gradient text-white hover:opacity-90"
                  disabled={action.isPending}
                  onClick={() => action.mutate("return", { action: "return" })}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Mark returned
                </Button>
              )}

              {perspective === "owner" && booking.status === "RETURNED" && (
                <>
                  <Button
                    size="sm" className="bg-brand-gradient text-white hover:opacity-90"
                    disabled={action.isPending}
                    onClick={() => action.mutate("complete", { action: "complete" })}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Confirm return OK
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    onClick={() => setDisputeOpen(true)}
                  >
                    <AlertCircle className="h-4 w-4 mr-1" /> Raise dispute
                  </Button>
                </>
              )}

              {booking.status === "COMPLETED" && !alreadyReviewed && (
                <Button
                  size="sm" variant="outline"
                  onClick={() => setReviewOpen(true)}
                >
                  <Star className="h-4 w-4 mr-1" /> Review {otherPartyName.split(" ")[0]}
                </Button>
              )}
              {booking.status === "COMPLETED" && alreadyReviewed && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Reviewed
                </Badge>
              )}

              {["REQUESTED", "APPROVED"].includes(booking.status) && (
                <Button
                  size="sm" variant="ghost"
                  disabled={action.isPending}
                  onClick={() => {
                    if (confirm("Cancel this booking?")) {
                      action.mutate("cancel", { action: "cancel" });
                      toast.success("Booking cancelled");
                    }
                  }}
                >
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
              )}

              {["PAID", "PICKED_UP", "RETURNED"].includes(booking.status) && perspective === "renter" && (
                <Button size="sm" variant="ghost" onClick={() => setDisputeOpen(true)}>
                  <AlertCircle className="h-4 w-4 mr-1" /> Raise issue
                </Button>
              )}

              {/* Chat button — visible once booking is approved */}
              {["APPROVED", "PAID", "PICKED_UP", "RETURNED", "COMPLETED"].includes(booking.status) && (
                <Button
                  size="sm"
                  variant={chatOpen ? "default" : "outline"}
                  onClick={() => setChatOpen((v) => !v)}
                  className={chatOpen ? "bg-brand-gradient text-white hover:opacity-90" : ""}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {chatOpen ? "Hide chat" : `Chat with ${otherPartyName.split(" ")[0]}`}
                </Button>
              )}
            </div>

            {/* Chat panel — expandable */}
            {chatOpen && ["APPROVED", "PAID", "PICKED_UP", "RETURNED", "COMPLETED"].includes(booking.status) && (
              <div className="mt-4 fade-in-up">
                <ChatPanel bookingId={booking.id} currentUserId={sessionUserId!} />
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Review modal */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review {otherPartyName}</DialogTitle>
            <DialogDescription>Your review affects their trust score. Be honest & kind.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    className="p-1"
                  >
                    <Star className={`h-7 w-7 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                placeholder="How was your experience? Was the item as described?"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button
              className="bg-brand-gradient text-white hover:opacity-90"
              disabled={submitReview.isPending || !reviewComment.trim()}
              onClick={() => submitReview.mutate()}
            >
              {submitReview.isPending ? "Submitting…" : "Submit review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute modal */}
      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Raise a dispute</DialogTitle>
            <DialogDescription>
              An admin will review and decide how the deposit is split. Both parties will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Item damaged / not returned / missing parts"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="desc">What happened?</Label>
              <Textarea
                id="desc"
                placeholder="Describe in detail…"
                value={disputeDesc}
                onChange={(e) => setDisputeDesc(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={submitDispute.isPending || !disputeReason.trim() || !disputeDesc.trim()}
              onClick={() => submitDispute.mutate()}
            >
              {submitDispute.isPending ? "Raising…" : "Raise dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function NotLoggedIn() {
  const { openAuth } = useApp();
  return (
    <div className="container mx-auto px-4 py-20 text-center flex-1">
      <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
      <h2 className="mt-4 text-xl font-semibold">Please log in</h2>
      <p className="text-sm text-muted-foreground mt-1">You need to be logged in to view your bookings.</p>
      <Button className="mt-4 bg-brand-gradient text-white hover:opacity-90" onClick={() => openAuth("login")}>
        Log in
      </Button>
    </div>
  );
}
