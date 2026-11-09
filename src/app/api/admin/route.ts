import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const [
    totalUsers,
    totalItems,
    totalBookings,
    completedBookings,
    activeBookings,
    disputedBookings,
    pendingKyc,
    pendingKycDocs,
    totalRevenueAgg,
    platformFeeAgg,
    items,
    recentBookings,
    disputes,
  ] = await Promise.all([
    db.user.count(),
    db.item.count(),
    db.booking.count(),
    db.booking.count({ where: { status: "COMPLETED" } }),
    db.booking.count({ where: { status: { in: ["PAID", "PICKED_UP", "APPROVED"] } } }),
    db.booking.count({ where: { status: "DISPUTED" } }),
    db.user.count({ where: { kycStatus: "SUBMITTED" } }),
    db.kycDocument.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, city: true, trustScore: true, totalRatings: true },
        },
      },
    }),
    db.payment.aggregate({ where: { type: "RENT", status: "SUCCESS" }, _sum: { amount: true } }),
    db.payment.aggregate({ where: { type: "RENT", status: "SUCCESS" }, _sum: { amount: true } }),
    db.item.findMany({
      take: 5,
      orderBy: { viewCount: "desc" },
      include: {
        owner: { select: { name: true } },
        _count: { select: { bookings: true } },
      },
    }),
    db.booking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        item: { select: { title: true, images: true } },
        renter: { select: { name: true } },
      },
    }),
    db.dispute.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          include: {
            item: { select: { title: true } },
            renter: { select: { name: true } },
          },
        },
        raisedBy: { select: { name: true } },
      },
    }),
  ]);

  // Bookings by category
  const bookingsByCategoryRaw = await db.booking.groupBy({
    by: ["itemId"],
    _count: true,
  });
  const itemIds = bookingsByCategoryRaw.map((b) => b.itemId);
  const itemsForCat = await db.item.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, category: true },
  });
  const catMap = new Map(itemsForCat.map((i) => [i.id, i.category]));
  const catCounts: Record<string, number> = {};
  for (const b of bookingsByCategoryRaw) {
    const c = catMap.get(b.itemId) || "Other";
    catCounts[c] = (catCounts[c] || 0) + b._count;
  }
  const byCategory = Object.entries(catCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Bookings by status
  const byStatusRaw = await db.booking.groupBy({ by: ["status"], _count: true });
  const byStatus = byStatusRaw.map((s) => ({ status: s.status, count: s._count }));

  // Top cities by item count
  const byCityRaw = await db.item.groupBy({ by: ["city"], _count: true });
  const byCity = byCityRaw
    .map((c) => ({ city: c.city, count: c._count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    stats: {
      totalUsers,
      totalItems,
      totalBookings,
      completedBookings,
      activeBookings,
      disputedBookings,
      pendingKyc,
      totalRevenue: totalRevenueAgg._sum.amount || 0,
      platformRevenue: ((platformFeeAgg._sum.amount || 0) * 0.1), // ~10% of all rent
    },
    topItems: items.map((i) => ({
      ...i,
      images: JSON.parse(i.images),
      bookingCount: i._count.bookings,
    })),
    recentBookings: recentBookings.map((b) => ({
      ...b,
      item: { ...b.item, images: JSON.parse(b.item.images) },
    })),
    disputes: disputes.map((d) => ({
      ...d,
      evidencePhotos: JSON.parse(d.evidencePhotos || "[]"),
    })),
    pendingKycDocs,
    byCategory,
    byStatus,
    byCity,
  });
}
