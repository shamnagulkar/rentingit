"use client";

import { useApp } from "@/components/rentingit/app-store";
import { Navbar } from "@/components/rentingit/navbar";
import { Footer } from "@/components/rentingit/footer";
import { AuthModal } from "@/components/rentingit/auth-modal";
import { HomeView } from "@/components/rentingit/home-view";
import { BrowseView } from "@/components/rentingit/browse-view";
import { ItemView } from "@/components/rentingit/item-view";
import { MyBookingsView } from "@/components/rentingit/my-bookings-view";
import { MyListingsView } from "@/components/rentingit/my-listings-view";
import { ListItemView } from "@/components/rentingit/list-item-view";
import { WalletView } from "@/components/rentingit/wallet-view";
import { ProfileView } from "@/components/rentingit/profile-view";
import { AdminView } from "@/components/rentingit/admin-view";
import { HowItWorksView } from "@/components/rentingit/how-it-works-view";

export default function Page() {
  const { view } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {view.name === "home" && <HomeView />}
        {view.name === "browse" && <BrowseView />}
        {view.name === "item" && <ItemView id={view.id} />}
        {view.name === "list-item" && <ListItemView />}
        {view.name === "my-bookings" && <MyBookingsView />}
        {view.name === "my-listings" && <MyListingsView />}
        {view.name === "wallet" && <WalletView />}
        {view.name === "profile" && <ProfileView />}
        {view.name === "admin" && <AdminView />}
        {view.name === "how-it-works" && <HowItWorksView />}
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
}
