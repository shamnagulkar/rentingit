import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const city = searchParams.get("city");
  const search = searchParams.get("q");
  const maxRent = searchParams.get("maxRent");
  const ownerId = searchParams.get("ownerId");
  const limit = parseInt(searchParams.get("limit") || "0");

  const where: any = {};
  if (category && category !== "All") where.category = category;
  if (city && city !== "All") where.city = city;
  if (ownerId) where.ownerId = ownerId;
  if (maxRent) where.dailyRent = { lte: parseFloat(maxRent) };
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const session = await getSessionUser();
  // Only show other users' items in browse feed (but allow owner viewing own)
  // We'll still return all items; UI filters appropriately

  const items = await db.item.findMany({
    where,
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: limit } : {}),
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          trustScore: true,
          kycStatus: true,
          city: true,
        },
      },
    },
  });

  const result = items.map((it) => ({
    ...it,
    images: JSON.parse(it.images),
    isOwn: session?.id === it.ownerId,
  }));

  return NextResponse.json({ items: result });
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Please login to list an item" }, { status: 401 });
    }
    const body = await req.json();
    const { title, category, description, images, dailyRent, securityDeposit, city, area, condition } = body;

    if (!title || !category || !description || !dailyRent || !securityDeposit || !city || !area) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "Add at least one photo" }, { status: 400 });
    }

    const item = await db.item.create({
      data: {
        title,
        category,
        description,
        images: JSON.stringify(images),
        dailyRent: parseFloat(dailyRent),
        securityDeposit: parseFloat(securityDeposit),
        city,
        area,
        condition: condition || "Good",
        ownerId: session.id,
      },
    });

    return NextResponse.json({ item: { ...item, images: JSON.parse(item.images) } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
