import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const item = await db.item.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          trustScore: true,
          kycStatus: true,
          city: true,
          totalRatings: true,
        },
      },
      bookings: {
        select: { startDate: true, endDate: true, status: true },
        where: { status: { in: ["PAID", "APPROVED", "PICKED_UP"] } },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  // Bump view count
  await db.item.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  // Get reviews about this owner
  const ownerReviews = await db.review.findMany({
    where: { revieweeId: item.ownerId, type: "RENTER_TO_OWNER" },
    include: {
      reviewer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const session = await getSessionUser();

  return NextResponse.json({
    item: {
      ...item,
      images: JSON.parse(item.images),
      isOwn: session?.id === item.ownerId,
    },
    ownerReviews,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const item = await db.item.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.ownerId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const allowed = ["title", "category", "description", "dailyRent", "securityDeposit", "city", "area", "condition", "isAvailable"];
  const data: any = {};
  for (const k of allowed) {
    if (k in body) {
      if (k === "dailyRent" || k === "securityDeposit") data[k] = parseFloat(body[k]);
      else data[k] = body[k];
    }
  }
  if (body.images) data.images = JSON.stringify(body.images);

  const updated = await db.item.update({ where: { id }, data });
  return NextResponse.json({ item: { ...updated, images: JSON.parse(updated.images) } });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const item = await db.item.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.ownerId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db.item.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
