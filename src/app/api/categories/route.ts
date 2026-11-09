import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/categories — list all categories with item counts
export async function GET() {
  const items = await db.item.findMany({
    select: { category: true },
  });
  const map: Record<string, number> = {};
  for (const it of items) {
    map[it.category] = (map[it.category] || 0) + 1;
  }
  const categories = Object.entries(map).map(([name, count]) => ({ name, count }));
  return NextResponse.json({ categories });
}
