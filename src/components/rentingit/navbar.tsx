"use client";

import { useState, useRef, useEffect } from "react";
import { useApp } from "./app-store";
import { useMe, useLogout } from "./use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button as UiButton } from "@/components/ui/button";
import {
  Home, Search, Plus, Calendar, Wallet, User as UserIcon,
  Shield, Menu, LogOut, Sun, Moon, Package, HelpCircle, Star,
} from "lucide-react";
import { useTheme } from "next-themes";

export function Navbar() {
  const { view, go, openAuth } = useApp();
  const { data } = useMe();
  const logout = useLogout();
  const { theme, setTheme } = useTheme();
  const mountedRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
    }
  }, []);

  const user = data?.user;
  const initials = user?.name?.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "U";

  const navItems = [
    { icon: Home, label: "Home", view: { name: "home" } as const },
    { icon: Search, label: "Browse", view: { name: "browse" } as const },
    { icon: Plus, label: "List Item", view: { name: "list-item" } as const, auth: true },
    { icon: Calendar, label: "Bookings", view: { name: "my-bookings" } as const, auth: true },
    { icon: Package, label: "My Listings", view: { name: "my-listings" } as const, auth: true },
    { icon: Wallet, label: "Wallet", view: { name: "wallet" } as const, auth: true },
  ];

  const isActive = (name: string) => view.name === name;

  const handleNav = (item: typeof navItems[number]) => {
    if (item.auth && !user) {
      openAuth("login");
    } else {
      go(item.view);
    }
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <button
          onClick={() => go({ name: "home" })}
          className="flex items-center gap-2 transition-opacity hover:opacity-85"
          aria-label="RENTINGIT home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white font-bold shadow-sm">
            R
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-lg font-bold leading-none tracking-tight">
              RENTING<span className="text-brand-gradient">IT</span>
            </div>
            <div className="text-[10px] text-muted-foreground leading-none mt-0.5">
              P2P rentals · India
            </div>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.view.name)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.label === "Wallet" && user && user.walletBalance > 0 && (
                <span className="ml-1 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                  {user.walletBalance.toLocaleString("en-IN")}
                </span>
              )}
            </button>
          ))}
          {user?.role === "ADMIN" && (
            <button
              onClick={() => go({ name: "admin" })}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive("admin")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </button>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border bg-background pl-1 pr-3 py-1 hover:bg-muted transition-colors">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-brand-gradient text-white text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                    {user.name.split(" ")[0]}
                  </span>
                  {user.kycStatus === "VERIFIED" && (
                    <Badge variant="outline" className="hidden md:flex bg-green-50 text-green-700 border-green-200 text-[10px] gap-0.5">
                      <Shield className="h-2.5 w-2.5" /> KYC
                    </Badge>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <div className="text-sm font-semibold truncate">{user.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{user.trustScore.toFixed(1)}</span>
                    <span className="text-muted-foreground">· {user.totalRatings} reviews</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go({ name: "profile" })}>
                  <UserIcon className="mr-2 h-4 w-4" /> Profile & KYC
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go({ name: "my-bookings" })}>
                  <Calendar className="mr-2 h-4 w-4" /> My Bookings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go({ name: "my-listings" })}>
                  <Package className="mr-2 h-4 w-4" /> My Listings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go({ name: "wallet" })}>
                  <Wallet className="mr-2 h-4 w-4" /> Wallet
                </DropdownMenuItem>
                {user.role === "ADMIN" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => go({ name: "admin" })}>
                      <Shield className="mr-2 h-4 w-4" /> Admin Dashboard
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go({ name: "how-it-works" })}>
                  <HelpCircle className="mr-2 h-4 w-4" /> How RENTINGIT Works
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout.mutate()} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => openAuth("login")}>
                Log in
              </Button>
              <Button size="sm" onClick={() => openAuth("signup")} className="bg-brand-gradient text-white hover:opacity-90">
                Sign up
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <UiButton variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </UiButton>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-white font-bold">
                    R
                  </div>
                  RENTINGIT
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleNav(item)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                      isActive(item.view.name)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
                {user?.role === "ADMIN" && (
                  <button
                    onClick={() => { go({ name: "admin" }); setMobileOpen(false); }}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                      isActive("admin") ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    }`}
                  >
                    <Shield className="h-4 w-4" /> Admin
                  </button>
                )}
                {!user && (
                  <div className="mt-3 flex flex-col gap-2 px-3">
                    <Button onClick={() => { openAuth("login"); setMobileOpen(false); }} variant="outline">
                      Log in
                    </Button>
                    <Button onClick={() => { openAuth("signup"); setMobileOpen(false); }} className="bg-brand-gradient text-white">
                      Sign up
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
