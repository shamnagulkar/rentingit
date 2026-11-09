"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { signIn, signOut } from "next-auth/react";
import { toast } from "sonner";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  kycStatus: string;
  kycDocType: string | null;
  kycDocNumber: string | null;
  trustScore: number;
  totalRatings: number;
  walletBalance: number;
  city: string | null;
  createdAt: string;
};

export type MeResponse = {
  user: CurrentUser | null;
  stats: {
    myListings: number;
    myBookings: number;
    totalEarnings: number;
  };
};

export function useMe() {
  return useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: async () => {
      const r = await fetch("/api/me", { cache: "no-store" });
      if (!r.ok) return { user: null, stats: { myListings: 0, myBookings: 0, totalEarnings: 0 } };
      return r.json();
    },
    retry: 1,
    staleTime: 30 * 1000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const r = await signIn("credentials", { email, password, redirect: false });
      if (!r || r.error) throw new Error("Invalid email or password");
      return r;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Logged in!");
    },
    onError: (e: any) => toast.error(e.message || "Login failed"),
  });
}

export function useSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      city?: string;
    }) => {
      const r = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Signup failed");
      return j;
    },
    onSuccess: async (_data, vars) => {
      // Auto-login after signup
      await signIn("credentials", { email: vars.email, password: vars.password, redirect: false });
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Welcome to RENTINGIT!");
    },
    onError: (e: any) => toast.error(e.message || "Signup failed"),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => signOut({ redirect: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.setQueryData(["me"], { user: null, stats: { myListings: 0, myBookings: 0, totalEarnings: 0 } });
      toast.success("Logged out");
    },
  });
}
