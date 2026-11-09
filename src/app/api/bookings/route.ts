import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { notifyBookingRequested } from "@/lib/email";

export const dynamic = "force-dynamic";

// GET /api/bookings?role=renter|owner
export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || "renter";

  const where = role === "owner"
    ? { item: { ownerId: session.id } }
    : { renterId: session.id };

  const bookings = await db.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      item: {
        select: {
          id: true,
          title: true,
          images: true,
          dailyRent: true,
          securityDeposit: true,
          city: true,
          area: true,
          ownerId: true,
        },
      },
      renter: { select: { id: true, name: true, trustScore: true, phone: true, kycStatus: true } },
      payments: true,
      reviews: true,
    },
  });

  const result = bookings.map((b) => ({
    ...b,
    item: { ...b.item, images: JSON.parse(b.item.images) },
  }));

  return NextResponse.json({ bookings: result });
}

// POST /api/bookings — create a new booking request
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please login to book" }, { status: 401 });
  }
  const body = await req.json();
  const { itemId, startDate, endDate, insurancePurchased } = body;

  if (!itemId || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing booking data" }, { status: 400 });
  }

  const item = await db.item.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  if (item.ownerId === session.id) {
    return NextResponse.json({ error: "You can't book your own item" }, { status: 400 });
  }
  if (!item.isAvailable) {
    return NextResponse.json({ error: "Item not available" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start >= end) {
    return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
  }
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  // Check for date conflicts
  const conflicts = await db.booking.findFirst({
    where: {
      itemId,
      status: { in: ["APPROVED", "PAID", "PICKED_UP"] },
      OR: [
        { startDate: { lte: end }, endDate: { gte: start } },
      ],
    },
  });
  if (conflicts) {
    return NextResponse.json({ error: "Item is already booked for those dates" }, { status: 400 });
  }

  const totalRent = item.dailyRent * days;
  const platformFee = totalRent * 0.1;
  const insuranceAmount = insurancePurchased ? Math.max(50, totalRent * 0.05) : 0;
  const grandTotal = totalRent + item.securityDeposit + platformFee + insuranceAmount;

  const booking = await db.booking.create({
    data: {
      itemId,
      renterId: session.id,
      startDate: start,
      endDate: end,
      totalRent,
      securityDeposit: item.securityDeposit,
      platformFee,
      insurancePurchased: !!insurancePurchased,
      insuranceAmount,
      grandTotal,
      status: "REQUESTED",
    },
  });

  // Email the owner
  const [owner, renter] = await Promise.all([
    db.user.findUnique({ where: { id: item.ownerId } }),
    db.user.findUnique({ where: { id: session.id } }),
  ]);
  if (owner && renter) await notifyBookingRequested(owner, renter, item, booking);

  return NextResponse.json({ booking });
}
