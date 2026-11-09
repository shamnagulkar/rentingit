import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST /api/reviews — submit a review (both sides)
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { bookingId, rating, comment, type } = body;

  if (!bookingId || !rating || !comment || !type) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { item: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status !== "COMPLETED") {
    return NextResponse.json({ error: "Can only review completed bookings" }, { status: 400 });
  }

  // Determine reviewer/reviewee from type
  let reviewerId = session.id;
  let revieweeId: string;
  if (type === "RENTER_TO_OWNER") {
    // Renter reviews owner — must be the renter
    if (booking.renterId !== session.id) {
      return NextResponse.json({ error: "Only the renter can leave this review" }, { status: 403 });
    }
    revieweeId = booking.item.ownerId;
  } else if (type === "OWNER_TO_RENTER") {
    if (booking.item.ownerId !== session.id) {
      return NextResponse.json({ error: "Only the owner can leave this review" }, { status: 403 });
    }
    revieweeId = booking.renterId;
  } else {
    return NextResponse.json({ error: "Invalid review type" }, { status: 400 });
  }

  // Check no existing review of this type
  const existing = await db.review.findFirst({
    where: { bookingId, reviewerId, type },
  });
  if (existing) {
    return NextResponse.json({ error: "You already left this review" }, { status: 400 });
  }

  // Create review + update reviewee's trust score
  const reviewee = await db.user.findUnique({ where: { id: revieweeId } });
  if (!reviewee) return NextResponse.json({ error: "Reviewee not found" }, { status: 404 });

  const newTotalRatings = reviewee.totalRatings + 1;
  const newTrustScore =
    (reviewee.trustScore * reviewee.totalRatings + rating) / newTotalRatings;

  const [review] = await db.$transaction([
    db.review.create({
      data: { bookingId, reviewerId, revieweeId, rating, comment, type },
    }),
    db.user.update({
      where: { id: revieweeId },
      data: {
        trustScore: Math.round(newTrustScore * 10) / 10,
        totalRatings: newTotalRatings,
      },
    }),
  ]);

  return NextResponse.json({ review });
}
