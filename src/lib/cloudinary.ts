// Cloudinary upload helper — uses unsigned upload preset for browser uploads
// To enable: create a Cloudinary account, get cloud_name + upload_preset, add to .env

export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "rentingit_unsigned",
  apiKey: process.env.CLOUDINARY_API_KEY || "",
  apiSecret: process.env.CLOUDINARY_API_SECRET || "",
};

export function isCloudinaryConfigured(): boolean {
  return !!cloudinaryConfig.cloudName;
}

// Browser-side: upload file directly to Cloudinary (unsigned)
export async function uploadToCloudinary(file: File): Promise<{ url: string; publicId: string } | { error: string }> {
  if (!isCloudinaryConfigured()) {
    return { error: "Cloudinary not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to .env" };
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", cloudinaryConfig.uploadPreset);
  formData.append("folder", "rentingit");

  try {
    const r = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`,
      { method: "POST", body: formData }
    );
    const j = await r.json();
    if (!r.ok) return { error: j.error?.message || "Upload failed" };
    return { url: j.secure_url, publicId: j.public_id };
  } catch (e: any) {
    return { error: e.message || "Network error" };
  }
}
