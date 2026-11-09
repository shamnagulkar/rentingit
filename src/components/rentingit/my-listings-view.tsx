"use client";

import { useApp } from "./app-store";
import { useMe } from "./use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MapPin, Eye, Trash2, Package, Edit, ChevronLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inr } from "./format";
import { toast } from "sonner";

export function MyListingsView() {
  const { go, openAuth } = useApp();
  const { data: meData } = useMe();
  const user = meData?.user;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["items", "mine"],
    queryFn: async () => {
      const r = await fetch(`/api/items?ownerId=${user!.id}`, { cache: "no-store" });
      const j = await r.json();
      return j.items as any[];
    },
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const j = await r.json();
        throw new Error(j.error);
      }
    },
    onSuccess: () => {
      toast.success("Listing deleted");
      qc.invalidateQueries({ queryKey: ["items"] });
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

  return (
    <div className="container mx-auto px-4 py-8 flex-1">
      <button onClick={() => go({ name: "home" })} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">My listings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.length || 0} {data?.length === 1 ? "item" : "items"} live on RENTINGIT
          </p>
        </div>
        <Button className="bg-brand-gradient text-white hover:opacity-90" onClick={() => go({ name: "list-item" })}>
          <Plus className="h-4 w-4 mr-1" /> New listing
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
              <Package className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">No listings yet</h3>
            <p className="text-sm text-muted-foreground mt-1">List your first item and start earning.</p>
            <Button className="mt-4 bg-brand-gradient text-white hover:opacity-90" onClick={() => go({ name: "list-item" })}>
              <Plus className="h-4 w-4 mr-1" /> List your first item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item) => {
            const images: string[] = typeof item.images === "string" ? JSON.parse(item.images) : item.images;
            return (
              <Card key={item.id} className="overflow-hidden">
                <button
                  onClick={() => go({ name: "item", id: item.id })}
                  className="block w-full aspect-[4/3] bg-muted relative"
                >
                  {images?.[0] && (
                    <img src={images[0]} alt={item.title} className="h-full w-full object-cover" />
                  )}
                  <Badge className={`absolute top-2 right-2 ${item.isAvailable ? "bg-green-500 text-white" : "bg-amber-500 text-white"}`}>
                    {item.isAvailable ? "Available" : "Booked"}
                  </Badge>
                </button>
                <CardContent className="p-3">
                  <button onClick={() => go({ name: "item", id: item.id })} className="font-semibold text-sm line-clamp-1 text-left hover:underline w-full">
                    {item.title}
                  </button>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.area}</span>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {item.viewCount}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-primary">{inr(item.dailyRent)}</span>
                      <span className="text-xs text-muted-foreground">/day</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => go({ name: "item", id: item.id })} title="View">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete "${item.title}"? This cannot be undone.`)) del.mutate(item.id);
                        }}
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
