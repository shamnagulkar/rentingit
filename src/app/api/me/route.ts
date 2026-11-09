import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/me — current user with full profile
export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ user: null });
  }
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      kycStatus: true,
      kycDocType: true,
      kycDocNumber: true,
      trustScore: true,
      totalRatings: true,
      walletBalance: true,
      city: true,
      createdAt: true,
    },
  });

  // Counts
  const myListings = await db.item.count({ where: { ownerId: session.id } });
  const myBookings = await db.booking.count({ where: { renterId: session.id } });
  const myEarnings = await db.walletTransaction.aggregate({
    where: { userId: session.id, type: "CREDIT" },
    _sum: { amount: true },
  });

  return NextResponse.json({
    user,
    stats: {
      myListings,
      myBookings,
      totalEarnings: myEarnings._sum.amount || 0,
    },
  });
}
