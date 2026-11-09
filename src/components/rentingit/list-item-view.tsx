"use client";

import { useState } from "react";
import { useApp } from "./app-store";
import { useMe } from "./use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Camera, ChevronLeft, ImagePlus, Loader2, Plus, Trash2, Sparkles, Shield } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { inr } from "./format";
import { ImageUploader } from "./image-uploader";

const CATEGORIES = [
  "Camera & Media", "Gaming", "Tools & Hardware", "Outdoor & Camping",
  "Fashion", "Music", "Books & Stationery", "Health & Medical", "Electronics",
  "Appliances", "Sports & Fitness", "Events & Party",
];

const CITIES = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad"];

// Curated Unsplash images by category for quick image picker
const SUGGESTED_IMAGES: Record<string, string[]> = {
  "Camera & Media": [
    "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80",
    "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&q=80",
    "https://images.unsplash.com/photo-1507459378473-c43371a295aa?w=800&q=80",
  ],
  "Gaming": [
    "https://images.unsplash.com/photo-1606140562935-376d1f47c1e8?w=800&q=80",
    "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&q=80",
  ],
  "Tools & Hardware": [
    "https://images.unsplash.com/photo-1504148455-e3d3946dd83a?w=800&q=80",
    "https://images.unsplash.com/photo-1572981779307-09b8d0a3eb76?w=800&q=80",
  ],
  "Outdoor & Camping": [
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f5?w=800&q=80",
    "https://images.unsplash.com/photo-1487730116645-74489c95b41b?w=800&q=80",
  ],
  "Fashion": [
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80",
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
  ],
  "Music": [
    "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
  ],
  "Books & Stationery": [
    "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80",
  ],
  "Health & Medical": [
    "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&q=80",
    "https://images.unsplash.com/photo-1583912267550-d6c2ac3196ce?w=800&q=80",
  ],
  "Electronics": [
    "https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=800&q=80",
    "https://images.unsplash.com/photo-1608043152269-f4da2442077a?w=800&q=80",
  ],
  "Appliances": [
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    "https://images.unsplash.com/photo-1559172802-f5de4d03802c?w=800&q=80",
  ],
  "Sports & Fitness": [
    "https://images.unsplash.com/photo-1532298199142-7c1e3b4f4f0a?w=800&q=80",
  ],
  "Events & Party": [
    "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80",
  ],
};

export function ListItemView() {
  const { go } = useApp();
  const { data: meData } = useMe();
  const qc = useQueryClient();
  const user = meData?.user;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [dailyRent, setDailyRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [city, setCity] = useState(user?.city || "Bengaluru");
  const [area, setArea] = useState("");
  const [condition, setCondition] = useState("Good");
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");

  const suggestions = category ? SUGGESTED_IMAGES[category] || [] : [];

  const addImage = (url: string) => {
    if (!url) return;
    if (images.length >= 5) {
      toast.error("Max 5 images");
      return;
    }
    if (images.includes(url)) return;
    setImages([...images, url]);
    setImageUrl("");
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const createItem = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, category, description,
          dailyRent: parseFloat(dailyRent),
          securityDeposit: parseFloat(securityDeposit),
          city, area, condition, images,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to list item");
      return j.item;
    },
    onSuccess: (item) => {
      toast.success("Item listed!");
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      go({ name: "item", id: item.id });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !description || !dailyRent || !securityDeposit || !city || !area) {
      toast.error("Fill all required fields");
      return;
    }
    if (images.length === 0) {
      toast.error("Add at least one photo");
      return;
    }
    createItem.mutate();
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center flex-1">
        <h2 className="mt-4 text-xl font-semibold">Please log in to list an item</h2>
        <Button className="mt-4 bg-brand-gradient text-white hover:opacity-90" onClick={() => useApp.getState().openAuth("login")}>
          Log in
        </Button>
      </div>
    );
  }

  if (user.kycStatus !== "VERIFIED") {
    return (
      <div className="container mx-auto px-4 py-12 flex-1 max-w-2xl">
        <button onClick={() => go({ name: "home" })} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="p-8 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <Shield className="h-7 w-7 text-amber-600" />
            </div>
            <h2 className="mt-4 text-xl font-bold">KYC required to list items</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              RENTINGIT requires KYC verification before you can list items. This builds trust on the
              platform — renters can see you&apos;re a real, verified person. It takes 30 seconds.
            </p>
            <Button
              className="mt-6 bg-brand-gradient text-white hover:opacity-90"
              onClick={() => go({ name: "profile" })}
            >
              Complete KYC
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex-1 max-w-3xl">
      <button onClick={() => go({ name: "home" })} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6">
        <Badge className="mb-2 bg-coral-soft text-coral border-0">
          <Sparkles className="h-3 w-3 mr-1" /> List in 2 minutes
        </Badge>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">List a new item</h1>
        <p className="text-sm text-muted-foreground mt-1">Add photos, set your rent + deposit, and start earning.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader images={images} onChange={setImages} max={5} />

            {suggestions.length > 0 && (
              <div className="mt-4">
                <Label className="text-xs text-muted-foreground">Or pick a sample image (for demo without Cloudinary)</Label>
                <div className="flex gap-2 mt-1.5 overflow-x-auto no-scrollbar">
                  {suggestions.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => addImage(url)}
                      className="h-16 w-20 shrink-0 rounded-md overflow-hidden border border-border hover:border-primary"
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Basic info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Basic info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" placeholder="e.g., Canon EOS R6 with 24-105mm lens" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the item, what's included, condition notes, pickup timings, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader><CardTitle className="text-base">Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rent">Daily rent (₹) *</Label>
                <Input id="rent" type="number" min={10} placeholder="500" value={dailyRent} onChange={(e) => setDailyRent(e.target.value)} required />
                <p className="text-xs text-muted-foreground mt-1">You earn {dailyRent ? inr(parseFloat(dailyRent) * 0.9) : "—"}/day after 10% platform fee</p>
              </div>
              <div>
                <Label htmlFor="deposit">Security deposit (₹) *</Label>
                <Input id="deposit" type="number" min={0} placeholder="5000" value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} required />
                <p className="text-xs text-muted-foreground mt-1">Held in escrow, refunded to renter after return</p>
              </div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-sm">
              <div className="font-medium mb-1">Pricing tip</div>
              <div className="text-xs text-muted-foreground">
                Set deposit ≈ 8–10× daily rent for high-value items. For fashion, deposit = item value.
                Competitive pricing = more bookings = higher trust score.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader><CardTitle className="text-base">Pickup location</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Select value={city} onValueChange={setCity} required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="area">Area / Locality *</Label>
                <Input id="area" placeholder="e.g., Koramangala" value={area} onChange={(e) => setArea(e.target.value)} required />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => go({ name: "home" })}>Cancel</Button>
          <Button
            type="submit"
            className="bg-brand-gradient text-white hover:opacity-90"
            disabled={createItem.isPending}
          >
            {createItem.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Listing…</>
            ) : (
              <>Publish listing</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
