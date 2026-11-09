"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X, Upload, ImagePlus, AlertCircle } from "lucide-react";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { toast } from "sonner";

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
  label?: string;
  aspect?: "square" | "video";
};

export function ImageUploader({ images, onChange, max = 5, label = "Photos", aspect = "square" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const configured = isCloudinaryConfigured();

  const aspectClass = aspect === "square" ? "aspect-square" : "aspect-video";

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (images.length + files.length > max) {
      toast.error(`Max ${max} images`);
      return;
    }
    if (!configured) {
      toast.error("Cloudinary not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to .env");
      return;
    }
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }
        const result = await uploadToCloudinary(file);
        if ("error" in result) {
          toast.error(result.error);
          continue;
        }
        newUrls.push(result.url);
      }
      if (newUrls.length > 0) {
        onChange([...images, ...newUrls]);
        toast.success(`${newUrls.length} image${newUrls.length === 1 ? "" : "s"} uploaded`);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {images.map((img, i) => (
          <div key={i} className={`relative ${aspectClass} rounded-xl overflow-hidden border border-border group bg-muted`}>
            <img src={img} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium bg-black/70 text-white px-1.5 py-0.5 rounded">
                Cover
              </span>
            )}
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={`${aspectClass} rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50`}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6 mb-1" />
                <span className="text-[10px] font-medium">Upload</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {images.length}/{max} photos · drag-and-drop supported
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || images.length >= max}
        >
          <Upload className="h-3.5 w-3.5 mr-1" />
          {uploading ? "Uploading…" : "Add photos"}
        </Button>
      </div>

      {!configured && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <strong>Cloudinary not configured.</strong> Add <code className="font-mono">NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> and{" "}
            <code className="font-mono">NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code> to your <code className="font-mono">.env</code> file.
            Until then, you can paste image URLs manually below.
          </div>
        </div>
      )}
    </div>
  );
}
