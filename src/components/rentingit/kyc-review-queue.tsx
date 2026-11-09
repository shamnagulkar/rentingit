"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Shield, CheckCircle2, XCircle, Clock, MapPin, Star, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { relativeTime } from "./format";

type KycDoc = {
  id: string;
  docType: string;
  docNumber: string;
  docImageUrl: string;
  selfieImageUrl: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    city: string | null;
    trustScore: number;
    totalRatings: number;
  };
};

export function KycReviewQueue({ docs }: { docs: KycDoc[] }) {
  const [reviewDoc, setReviewDoc] = useState<KycDoc | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  if (docs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            KYC verification queue
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          🎉 No pending KYC submissions. All caught up!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-600" />
          KYC verification queue
          <Badge className="bg-amber-100 text-amber-700 border-0">{docs.length} pending</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border max-h-96 overflow-y-auto fancy-scroll">
          {docs.map((doc) => (
            <div key={doc.id} className="p-3 hover:bg-muted/30">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-brand-gradient text-white text-xs font-semibold">
                    {doc.user.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm truncate">{doc.user.name}</div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px]">
                      <Clock className="h-2.5 w-2.5 mr-0.5" /> {relativeTime(doc.createdAt)}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{doc.user.email}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{doc.docType}</span>
                    <span>{doc.docNumber}</span>
                    {doc.user.phone && <span>· {doc.user.phone}</span>}
                    {doc.user.city && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{doc.user.city}</span>}
                    <span className="flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      {doc.user.trustScore.toFixed(1)} ({doc.user.totalRatings})
                    </span>
                  </div>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => setReviewDoc(doc)}>
                    Review documents
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <KycReviewDialog
        doc={reviewDoc}
        onClose={() => { setReviewDoc(null); setRejectReason(""); }}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
      />
    </Card>
  );
}

function KycReviewDialog({
  doc, onClose, rejectReason, setRejectReason,
}: {
  doc: KycDoc | null;
  onClose: () => void;
  rejectReason: string;
  setRejectReason: (s: string) => void;
}) {
  const qc = useQueryClient();

  const review = useMutation({
    mutationFn: async (action: "approve" | "reject") => {
      const r = await fetch(`/api/kyc/${doc!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason: action === "reject" ? rejectReason : undefined }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      return j;
    },
    onSuccess: (_data, action) => {
      toast.success(action === "approve" ? "KYC approved — user notified" : "KYC rejected — user notified");
      qc.invalidateQueries({ queryKey: ["admin"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!doc) return null;

  return (
    <Dialog open={!!doc} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Review KYC — {doc.user.name}
          </DialogTitle>
          <DialogDescription>
            Submitted {relativeTime(doc.createdAt)}. Verify the document is legitimate and matches the selfie.
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">{doc.docType} — front</Label>
            <div className="mt-1 rounded-lg overflow-hidden border border-border bg-muted aspect-video">
              <img src={doc.docImageUrl} alt="ID document" className="h-full w-full object-cover" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Selfie holding ID</Label>
            <div className="mt-1 rounded-lg overflow-hidden border border-border bg-muted aspect-video">
              <img src={doc.selfieImageUrl} alt="Selfie with ID" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Name</div>
            <div className="font-medium">{doc.user.name}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="font-medium truncate">{doc.user.email}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Document</div>
            <div className="font-medium">{doc.docType} · {doc.docNumber}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Phone</div>
            <div className="font-medium">{doc.user.phone || "—"}</div>
          </div>
        </div>

        <Separator />

        <div>
          <Label htmlFor="reject-reason">Rejection reason (only if rejecting)</Label>
          <Textarea
            id="reject-reason"
            placeholder="e.g., Selfie is too blurry to read, ID expired, name doesn't match..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={2}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => review.mutate("reject")}
            disabled={review.isPending || !rejectReason.trim()}
            className="text-destructive hover:text-destructive"
          >
            <XCircle className="h-4 w-4 mr-1" /> Reject
          </Button>
          <Button
            onClick={() => review.mutate("approve")}
            disabled={review.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {review.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
            Approve & verify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
