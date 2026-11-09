"use client";

import { useState } from "react";
import { useApp } from "./app-store";
import { useLogin, useSignup } from "./use-auth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Sparkles, ShoppingBag, Wrench, Camera } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";

const DEMO_ACCOUNTS = [
  { email: "rohan@gmail.com", password: "demo123", label: "Rohan — Owner (Bengaluru, KYC verified)", icon: ShoppingBag, color: "text-amber-600 bg-amber-50" },
  { email: "priya@gmail.com", password: "demo123", label: "Priya — Owner (Bengaluru, KYC verified)", icon: Camera, color: "text-purple-600 bg-purple-50" },
  { email: "vikram@gmail.com", password: "demo123", label: "Vikram — Renter + Owner (Delhi)", icon: Sparkles, color: "text-green-600 bg-green-50" },
  { email: "sneha@gmail.com", password: "demo123", label: "Sneha — KYC pending review", icon: Wrench, color: "text-rose-600 bg-rose-50" },
  { email: "kabir@gmail.com", password: "demo123", label: "Kabir — New user, KYC pending", icon: Sparkles, color: "text-cyan-600 bg-cyan-50" },
  { email: "admin@rentingit.in", password: "admin123", label: "Ananya — Admin (review KYC queue)", icon: Shield, color: "text-indigo-600 bg-indigo-50" },
];

export function AuthModal() {
  const { authOpen, authMode, closeAuth, openAuth } = useApp();
  const login = useLogin();
  const signup = useSignup();
  const qc = useQueryClient();

  // login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  // signup form
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suCity, setSuCity] = useState("");

  const quickLogin = async (email: string, password: string) => {
    const r = await signIn("credentials", { email, password, redirect: false });
    if (!r || r.error) {
      toast.error("Demo login failed");
      return;
    }
    qc.invalidateQueries({ queryKey: ["me"] });
    toast.success("Logged in via demo account");
    closeAuth();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email: loginEmail, password: loginPassword }, { onSuccess: () => closeAuth() });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    signup.mutate(
      { name: suName, email: suEmail, password: suPassword, phone: suPhone, city: suCity },
      { onSuccess: () => closeAuth() }
    );
  };

  return (
    <Dialog open={authOpen} onOpenChange={(o) => (o ? null : closeAuth())}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-white text-sm font-bold">
              R
            </div>
            {authMode === "login" ? "Welcome back" : "Join RENTINGIT"}
          </DialogTitle>
          <DialogDescription>
            {authMode === "login"
              ? "Log in to book, list and earn."
              : "Sign up free — start renting or earning from your unused stuff."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={authMode} onValueChange={(v) => openAuth(v as "login" | "signup")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Log in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          {/* LOGIN */}
          <TabsContent value="login" className="space-y-3 mt-4">
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="li-email">Email</Label>
                <Input
                  id="li-email" type="email" required placeholder="you@example.com"
                  value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="li-pass">Password</Label>
                <Input
                  id="li-pass" type="password" required placeholder="••••••••"
                  value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit" className="w-full bg-brand-gradient text-white hover:opacity-90"
                disabled={login.isPending}
              >
                {login.isPending ? "Logging in…" : "Log in"}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Quick demo login</span>
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto fancy-scroll pr-1">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => quickLogin(acc.email, acc.password)}
                  className="w-full flex items-center gap-3 rounded-lg border border-border bg-background p-2.5 text-left transition-colors hover:border-primary/50 hover:bg-muted/50"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md ${acc.color}`}>
                    <acc.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{acc.label}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{acc.email} · {acc.password}</div>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* SIGNUP */}
          <TabsContent value="signup" className="space-y-3 mt-4">
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="su-name">Full name</Label>
                <Input
                  id="su-name" required placeholder="Riya Kapoor"
                  value={suName} onChange={(e) => setSuName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-email">Email</Label>
                <Input
                  id="su-email" type="email" required placeholder="you@example.com"
                  value={suEmail} onChange={(e) => setSuEmail(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="su-pass">Password</Label>
                  <Input
                    id="su-pass" type="password" required minLength={6} placeholder="min 6 chars"
                    value={suPassword} onChange={(e) => setSuPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-phone">Phone</Label>
                  <Input
                    id="su-phone" type="tel" placeholder="+91 ..."
                    value={suPhone} onChange={(e) => setSuPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-city">City</Label>
                <Input
                  id="su-city" placeholder="Bengaluru"
                  value={suCity} onChange={(e) => setSuCity(e.target.value)}
                />
              </div>
              <Button
                type="submit" className="w-full bg-brand-gradient text-white hover:opacity-90"
                disabled={signup.isPending}
              >
                {signup.isPending ? "Creating account…" : "Create account"}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                By signing up you agree to RENTINGIT&apos;s Terms & Rental Safety Policy.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
