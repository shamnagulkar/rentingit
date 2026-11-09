"use client";

import { useState, useMemo } from "react";
import { useApp } from "./app-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal, X, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ItemCard } from "./home-view";
import { inr } from "./format";

const CITIES = ["All", "Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai"];
const CATEGORIES = [
  "All", "Camera & Media", "Gaming", "Tools & Hardware", "Outdoor & Camping",
  "Fashion", "Music", "Books & Stationery", "Health & Medical", "Electronics",
  "Appliances", "Sports & Fitness", "Events & Party",
];

export function BrowseView() {
  const { view, go } = useApp();
  const initial = view.name === "browse" ? view : { name: "browse" as const };

  const [q, setQ] = useState(initial.q || "");
  const [category, setCategory] = useState(initial.category || "All");
  const [city, setCity] = useState(initial.city || "All");
  const [maxRent, setMaxRent] = useState<number>(5000);
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["items", "browse", q, category, city, maxRent],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (category !== "All") params.set("category", category);
      if (city !== "All") params.set("city", city);
      params.set("maxRent", String(maxRent));
      const r = await fetch(`/api/items?${params}`);
      const j = await r.json();
      return j.items as any[];
    },
  });

  const items = useMemo(() => {
    const arr = data || [];
    const sorted = [...arr];
    if (sort === "newest") sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sort === "price-low") sorted.sort((a, b) => a.dailyRent - b.dailyRent);
    if (sort === "price-high") sorted.sort((a, b) => b.dailyRent - a.dailyRent);
    if (sort === "rating") sorted.sort((a, b) => (b.owner?.trustScore || 0) - (a.owner?.trustScore || 0));
    return sorted;
  }, [data, sort]);

  const activeFilters =
    (category !== "All" ? 1 : 0) + (city !== "All" ? 1 : 0) + (maxRent < 5000 ? 1 : 0);

  return (
    <div className="container mx-auto px-4 py-8 flex-1">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Browse rentals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {items.length} {items.length === 1 ? "item" : "items"} available across India
        </p>
      </div>

      {/* Search & sort row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or description…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="price-low">Price: low to high</SelectItem>
            <SelectItem value="price-high">Price: high to low</SelectItem>
            <SelectItem value="rating">Top rated owners</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters((v) => !v)}
          className="sm:w-auto"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {activeFilters > 0 && (
            <span className="ml-2 rounded-full bg-primary-foreground/30 px-1.5 text-xs">
              {activeFilters}
            </span>
          )}
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">City</label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Max rent / day</label>
                <span className="text-sm font-semibold text-primary">{inr(maxRent)}</span>
              </div>
              <Slider
                value={[maxRent]}
                onValueChange={(v) => setMaxRent(v[0])}
                min={50}
                max={5000}
                step={50}
                className="py-2"
              />
            </div>
          </div>
          {activeFilters > 0 && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="ghost" size="sm"
                onClick={() => { setCategory("All"); setCity("All"); setMaxRent(5000); }}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Clear filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Items grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Search className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">No items found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try clearing filters or searching for something else.
          </p>
          <Button
            variant="outline" className="mt-4"
            onClick={() => { setQ(""); setCategory("All"); setCity("All"); setMaxRent(5000); }}
          >
            Reset search
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((it) => (
            <ItemCard key={it.id} item={it} onClick={() => go({ name: "item", id: it.id })} />
          ))}
        </div>
      )}
    </div>
  );
}
