import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/conversations/[bookingId] — get or create conversation for a booking
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { item: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Only owner or renter can access this conversation
  if (booking.renterId !== session.id && booking.item.ownerId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get or create conversation
  let conversation = await db.conversation.findUnique({
    where: { bookingId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 200,
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        bookingId,
        ownerId: booking.item.ownerId,
        renterId: booking.renterId,
        itemId: booking.itemId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  const otherParty = session.id === conversation.ownerId
    ? await db.user.findUnique({ where: { id: conversation.renterId }, select: { id: true, name: true } })
    : await db.user.findUnique({ where: { id: conversation.ownerId }, select: { id: true, name: true } });

  return NextResponse.json({
    conversation,
    otherParty,
    currentUserId: session.id,
  });
}
