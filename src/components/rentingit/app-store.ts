"use client";

import { create } from "zustand";

export type View =
  | { name: "home" }
  | { name: "browse"; category?: string; q?: string; city?: string }
  | { name: "item"; id: string }
  | { name: "list-item" }
  | { name: "my-bookings" }
  | { name: "my-listings" }
  | { name: "wallet" }
  | { name: "profile" }
  | { name: "admin" }
  | { name: "how-it-works" };

type AppState = {
  view: View;
  go: (v: View) => void;
  authOpen: boolean;
  authMode: "login" | "signup";
  openAuth: (mode?: "login" | "signup") => void;
  closeAuth: () => void;
};

export const useApp = create<AppState>((set) => ({
  view: { name: "home" },
  go: (v) => {
    set({ view: v });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  },
  authOpen: false,
  authMode: "login",
  openAuth: (mode = "login") => set({ authOpen: true, authMode: mode }),
  closeAuth: () => set({ authOpen: false }),
}));
