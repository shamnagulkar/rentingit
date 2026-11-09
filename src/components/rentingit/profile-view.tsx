"use client";

import { useState } from "react";
import { useApp } from "./app-store";
import { useMe } from "./use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Shield, Star, Calendar, Package, Wallet, ChevronLeft, CheckCircle2, AlertCircle, Loader2, Phone, MapPin, Clock, XCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inr, relativeTime } from "./format";
import { toast } from "sonner";
import { ImageUploader } from "./image-uploader";

export function ProfileView() {
  const { go, openAuth } = useApp();
  const { data: meData } = useMe();
  const user = meData?.user;
  const qc = useQueryClient();
  const [kycOpen, setKycOpen] = useState(false);
  const [docType, setDocType] = useState("AADHAAR");
  const [docNumber, setDocNumber] = useState("");
  const [docImageUrl, setDocImageUrl] = useState<string[]>([]);
  const [selfieImageUrl, setSelfieImageUrl] = useState<string[]>([]);

  // Get user's KYC submission history
  const { data: kycData } = useQuery({
    queryKey: ["kyc", user?.id],
    queryFn: async () => {
      const r = await fetch("/api/kyc", { cache: "no-store" });
      return r.json();
    },
    enabled: !!user,
  });

  const submitKyc = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType,
          docNumber,
          docImageUrl: docImageUrl[0],
          selfieImageUrl: selfieImageUrl[0],
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      return j;
    },
    onSuccess: () => {
      toast.success("KYC submitted! Admin will review within 24h.");
      setKycOpen(false);
      setDocNumber("");
      setDocImageUrl([]);
      setSelfieImageUrl([]);
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["kyc"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center flex-1">
        <h2 className="mt-4 text-xl font-semibold">Please log in</h2>
        <Button className="mt-4 bg-brand-gradient text-white hover:opacity-90" onClick={() => openAuth("login")}>Log in</Button>
      </div>
    );
  }

  const initials = user.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  const stats = meData?.stats;
  const latestKyc = kycData?.docs?.[0];

  return (
    <div className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
      <button onClick={() => go({ name: "home" })} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      {/* Profile header */}
      <Card className="overflow-hidden border-border/60 shadow-soft">
        <div className="h-28 bg-brand-gradient" />
        <CardContent className="p-6 -mt-12">
          <div className="flex items-end gap-4">
            <Avatar className="h-24 w-24 border-4 border-background shadow-soft">
              <AvatarFallback className="bg-brand-gradient text-white text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{user.name}</h1>
                {user.kycStatus === "VERIFIED" && (
                  <Badge className="bg-green-50 text-green-700 border-green-200">
                    <Shield className="h-3 w-3 mr-1" /> KYC Verified
                  </Badge>
                )}
                {user.kycStatus === "SUBMITTED" && (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                    <Clock className="h-3 w-3 mr-1" /> KYC Pending
                  </Badge>
                )}
                {user.kycStatus === "REJECTED" && (
                  <Badge className="bg-red-50 text-red-700 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" /> KYC Rejected
                  </Badge>
                )}
                {user.role === "ADMIN" && (
                  <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                    Admin
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <StatBox icon={Star} label="Trust score" value={user.trustScore.toFixed(1)} sub={`${user.totalRatings} reviews`} color="text-amber-500" />
            <StatBox icon={Package} label="Listings" value={String(stats?.myListings || 0)} color="text-primary" />
            <StatBox icon={Calendar} label="Bookings" value={String(stats?.myBookings || 0)} color="text-indigo-500" />
            <StatBox icon={Wallet} label="Total earned" value={inr(stats?.totalEarnings || 0)} color="text-green-600" />
          </div>

          <Separator className="my-4" />

          {/* Profile fields */}
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Field icon={Phone} label="Phone" value={user.phone || "Not set"} />
            <Field icon={MapPin} label="City" value={user.city || "Not set"} />
            <Field icon={Calendar} label="Member since" value={new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
            <Field
              icon={Shield}
              label="KYC status"
              value={
                user.kycStatus === "VERIFIED" ? `Verified · ${user.kycDocType}` :
                user.kycStatus === "SUBMITTED" ? "Under review" :
                user.kycStatus === "REJECTED" ? "Rejected — resubmit" :
                "Not submitted"
              }
              accent={
                user.kycStatus === "VERIFIED" ? "text-green-600" :
                user.kycStatus === "REJECTED" ? "text-red-600" :
                user.kycStatus === "SUBMITTED" ? "text-amber-600" :
                "text-muted-foreground"
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* KYC card */}
      {user.kycStatus !== "VERIFIED" && (
        <Card className="mt-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {user.kycStatus === "REJECTED" ? "Resubmit your KYC" : "Verify your identity (KYC)"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  KYC verification is required to list items on RENTINGIT. Upload a photo of your ID and a selfie
                  holding it — our admin team verifies within 24 hours. This builds trust and prevents fraud.
                </p>
                {latestKyc?.rejectionReason && (
                  <div className="mt-2 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-2 text-xs text-red-700 dark:text-red-300">
                    <strong>Rejection reason:</strong> {latestKyc.rejectionReason}
                  </div>
                )}
                <Button className="mt-3 bg-brand-gradient text-white hover:opacity-90" onClick={() => setKycOpen(true)}>
                  {user.kycStatus === "REJECTED" ? "Resubmit KYC" : "Complete KYC now"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KYC verified banner */}
      {user.kycStatus === "VERIFIED" && user.kycDocType && (
        <Card className="mt-4 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">KYC Verified</div>
              <div className="text-xs text-muted-foreground">
                {user.kycDocType} · {user.kycDocNumber}
                {latestKyc?.reviewedAt && ` · Verified ${relativeTime(latestKyc.reviewedAt)}`}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KYC pending banner */}
      {user.kycStatus === "SUBMITTED" && latestKyc && (
        <Card className="mt-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-amber-600 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">KYC under review</div>
              <div className="text-xs text-muted-foreground">
                Submitted {relativeTime(latestKyc.createdAt)} · Our team will review within 24h
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        <Button variant="outline" className="justify-start" onClick={() => go({ name: "my-listings" })}>
          <Package className="h-4 w-4 mr-2" /> My Listings
        </Button>
        <Button variant="outline" className="justify-start" onClick={() => go({ name: "my-bookings" })}>
          <Calendar className="h-4 w-4 mr-2" /> My Bookings
        </Button>
        <Button variant="outline" className="justify-start" onClick={() => go({ name: "wallet" })}>
          <Wallet className="h-4 w-4 mr-2" /> Wallet
        </Button>
      </div>

      {/* KYC Modal */}
      <Dialog open={kycOpen} onOpenChange={setKycOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verify your identity</DialogTitle>
            <DialogDescription>
              Upload a clear photo of your ID and a selfie holding it. Admin verifies within 24h.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="doctype">Document type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AADHAAR">Aadhaar</SelectItem>
                  <SelectItem value="PAN">PAN Card</SelectItem>
                  <SelectItem value="DRIVING_LICENSE">Driving License</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="docnum">Document number</Label>
              <Input
                id="docnum"
                placeholder={docType === "AADHAAR" ? "1234 5678 9012" : docType === "PAN" ? "ABCDE1234F" : "DL-XXXXXXXXX"}
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">ID photo (front)</Label>
              <p className="text-xs text-muted-foreground mb-2">Clear, well-lit photo of the front of your {docType === "AADHAAR" ? "Aadhaar" : docType === "PAN" ? "PAN card" : "license"}</p>
              <ImageUploader images={docImageUrl} onChange={setDocImageUrl} max={1} aspect="video" />
            </div>

            <div>
              <Label className="text-sm font-medium">Selfie holding the ID</Label>
              <p className="text-xs text-muted-foreground mb-2">A selfie where your face and the ID are both visible</p>
              <ImageUploader images={selfieImageUrl} onChange={setSelfieImageUrl} max={1} aspect="video" />
            </div>

            <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <strong>Privacy:</strong> Your documents are stored securely on Cloudinary and only visible to RENTINGIT admins
                for verification. Document numbers are masked before display. We never share them with third parties.
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKycOpen(false)}>Cancel</Button>
            <Button
              className="bg-brand-gradient text-white hover:opacity-90"
              disabled={submitKyc.isPending || !docNumber || docImageUrl.length === 0 || selfieImageUrl.length === 0}
              onClick={() => submitKyc.mutate()}
            >
              {submitKyc.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</> : "Submit for review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-soft">
      <Icon className={`h-4 w-4 mb-1.5 ${color || "text-muted-foreground"}`} />
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-bold text-lg leading-tight">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Field({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`font-medium truncate ${accent || ""}`}>{value}</div>
      </div>
    </div>
  );
}
