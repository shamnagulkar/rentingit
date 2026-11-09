"use client";

import { useState } from "react";
import { useApp } from "./app-store";
import { useMe } from "./use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Wallet, ArrowUpRight, ArrowDownLeft, ChevronLeft, Smartphone, TrendingUp, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inr, relativeTime } from "./format";
import { toast } from "sonner";

export function WalletView() {
  const { go, openAuth } = useApp();
  const { data: meData } = useMe();
  const user = meData?.user;
  const qc = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const r = await fetch("/api/wallet", { cache: "no-store" });
      return r.json();
    },
    enabled: !!user,
  });

  const withdraw = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, upiId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      return j;
    },
    onSuccess: () => {
      toast.success("Withdrawal initiated! Money will hit your account in 1-2 hrs.");
      setWithdrawOpen(false);
      setAmount("");
      setUpiId("");
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["me"] });
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

  const balance = data?.balance || 0;
  const txns = data?.transactions || [];
  const credits = txns.filter((t: any) => t.type === "CREDIT");
  const totalEarned = credits.reduce((s: number, t: any) => s + t.amount, 0);

  return (
    <div className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
      <button onClick={() => go({ name: "home" })} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-6">Wallet</h1>

      {/* Balance card */}
      <Card className="border-0 bg-brand-gradient text-white overflow-hidden">
        <CardContent className="p-6 relative">
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/10 -mr-12 -mt-12" />
          <div className="absolute bottom-0 left-0 h-20 w-20 rounded-full bg-white/10 -ml-8 -mb-8" />
          <div className="relative">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Wallet className="h-4 w-4" /> Available balance
            </div>
            <div className="text-4xl lg:text-5xl font-bold mt-2">{inr(balance)}</div>
            <div className="mt-1 text-white/80 text-sm">
              Lifetime earnings: {inr(totalEarned)} · {credits.length} payouts
            </div>
            <Button
              variant="secondary"
              className="mt-4 bg-white text-primary hover:bg-white/90"
              onClick={() => setWithdrawOpen(true)}
              disabled={balance < 100}
            >
              <Smartphone className="h-4 w-4 mr-1" /> Withdraw to UPI
            </Button>
            {balance < 100 && (
              <p className="mt-1 text-xs text-white/70">Minimum ₹100 to withdraw</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <Card>
          <CardContent className="p-4">
            <TrendingUp className="h-5 w-5 text-accent mb-2" />
            <div className="text-xs text-muted-foreground">Total earned</div>
            <div className="text-lg font-bold">{inr(totalEarned)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <ArrowDownLeft className="h-5 w-5 text-green-600 mb-2" />
            <div className="text-xs text-muted-foreground">Payouts</div>
            <div className="text-lg font-bold">{credits.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <ArrowUpRight className="h-5 w-5 text-orange-600 mb-2" />
            <div className="text-xs text-muted-foreground">Withdrawals</div>
            <div className="text-lg font-bold">{txns.filter((t: any) => t.type === "DEBIT").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Transaction history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : txns.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No transactions yet. Earn money by listing items!
            </div>
          ) : (
            <div className="divide-y divide-border max-h-96 overflow-y-auto fancy-scroll">
              {txns.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 hover:bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                      t.type === "CREDIT" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                    }`}>
                      {t.type === "CREDIT" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{t.description}</div>
                      <div className="text-xs text-muted-foreground">{relativeTime(t.createdAt)}</div>
                    </div>
                  </div>
                  <div className={`font-semibold text-sm ${t.type === "CREDIT" ? "text-green-600" : "text-orange-600"}`}>
                    {t.type === "CREDIT" ? "+" : "−"} {inr(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdraw modal */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw to UPI</DialogTitle>
            <DialogDescription>Money typically arrives in 1-2 hours.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/30 p-3 text-sm">
              Available: <span className="font-bold text-primary">{inr(balance)}</span>
            </div>
            <div>
              <Label htmlFor="amt">Amount (₹)</Label>
              <Input id="amt" type="number" min={100} max={balance} placeholder="1000" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="upi">UPI ID</Label>
              <Input id="upi" placeholder="yourname@okhdfcbank" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
            <Button
              className="bg-brand-gradient text-white hover:opacity-90"
              disabled={withdraw.isPending || !amount || !upiId}
              onClick={() => withdraw.mutate()}
            >
              {withdraw.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing…</> : "Withdraw"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
