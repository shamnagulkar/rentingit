import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import {
  notifyBookingApproved,
  notifyPaymentReceived,
  notifyBookingCompleted,
  notifyDisputeRaised,
} from "@/lib/email";

export const dynamic = "force-dynamic";

// PATCH /api/bookings/[id] — advance booking state
// Actions: approve, pay, pickup, return, complete, cancel, raise-dispute
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  const booking = await db.booking.findUnique({
    where: { id },
    include: { item: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const isOwner = booking.item.ownerId === session.id;
  const isRenter = booking.renterId === session.id;
  const isAdmin = (await db.user.findUnique({ where: { id: session.id } }))?.role === "ADMIN";

  if (!isOwner && !isRenter && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  // Transactional state machine
  try {
    if (action === "approve" && isOwner && booking.status === "REQUESTED") {
      const updated = await db.booking.update({
        where: { id },
        data: { status: "APPROVED", ownerApprovedAt: now },
      });
      // Email renter
      const renter = await db.user.findUnique({ where: { id: booking.renterId } });
      if (renter) await notifyBookingApproved(renter.email, booking.item, booking);
      return NextResponse.json({ booking: updated });
    }

    if (action === "reject" && isOwner && booking.status === "REQUESTED") {
      const updated = await db.booking.update({
        where: { id },
        data: { status: "CANCELLED", cancelledAt: now },
      });
      return NextResponse.json({ booking: updated });
    }

    if (action === "pay" && isRenter && (booking.status === "APPROVED" || booking.status === "REQUESTED")) {
      // Mock Razorpay success
      const [updatedBooking] = await db.$transaction([
        db.booking.update({
          where: { id },
          data: { status: "PAID", paidAt: now },
        }),
        db.payment.create({
          data: {
            bookingId: id,
            userId: session.id,
            amount: booking.grandTotal,
            type: "RENT",
            method: "UPI",
            razorpayId: "pay_demo_" + id.slice(0, 8),
            status: "SUCCESS",
          },
        }),
      ]);
      // Email owner
      const owner = await db.user.findUnique({ where: { id: booking.item.ownerId } });
      const renter = await db.user.findUnique({ where: { id: booking.renterId } });
      if (owner && renter) await notifyPaymentReceived(owner.email, renter.name, booking.item, booking);
      return NextResponse.json({ booking: updatedBooking });
    }

    if (action === "pickup" && isRenter && booking.status === "PAID") {
      const updated = await db.booking.update({
        where: { id },
        data: { status: "PICKED_UP", pickedUpAt: now },
      });
      return NextResponse.json({ booking: updated });
    }

    if (action === "return" && isRenter && booking.status === "PICKED_UP") {
      const updated = await db.booking.update({
        where: { id },
        data: { status: "RETURNED", returnedAt: now },
      });
      return NextResponse.json({ booking: updated });
    }

    if (action === "complete" && isOwner && booking.status === "RETURNED") {
      // Owner confirms return is OK → release deposit, payout rent
      const ownerPayout = booking.totalRent - booking.platformFee;
      const owner = await db.user.findUnique({ where: { id: booking.item.ownerId } });
      const renter = await db.user.findUnique({ where: { id: booking.renterId } });

      const [updatedBooking] = await db.$transaction([
        db.booking.update({
          where: { id },
          data: { status: "COMPLETED", completedAt: now },
        }),
        db.payment.create({
          data: {
            bookingId: id,
            userId: booking.renterId,
            amount: booking.securityDeposit,
            type: "REFUND",
            method: "UPI",
            status: "SUCCESS",
          },
        }),
        db.walletTransaction.create({
          data: {
            userId: booking.item.ownerId,
            type: "CREDIT",
            amount: ownerPayout,
            reference: id,
            description: `Payout — ${booking.item.title}`,
            balanceAfter: (owner?.walletBalance || 0) + ownerPayout,
          },
        }),
        db.user.update({
          where: { id: booking.item.ownerId },
          data: { walletBalance: { increment: ownerPayout } },
        }),
      ]);
      // Email owner
      if (owner && renter) await notifyBookingCompleted(owner.email, renter.name, booking.item, ownerPayout);
      return NextResponse.json({ booking: updatedBooking });
    }

    if (action === "cancel" && (isRenter || isOwner) && ["REQUESTED", "APPROVED"].includes(booking.status)) {
      const updated = await db.booking.update({
        where: { id },
        data: { status: "CANCELLED", cancelledAt: now },
      });
      return NextResponse.json({ booking: updated });
    }

    if (action === "raise-dispute" && (isRenter || isOwner) && ["PICKED_UP", "RETURNED", "PAID"].includes(booking.status)) {
      const { reason, description, evidencePhotos } = body;
      if (!reason || !description) {
        return NextResponse.json({ error: "Reason and description required" }, { status: 400 });
      }
      const dispute = await db.dispute.create({
        data: {
          bookingId: id,
          raisedById: session.id,
          reason,
          description,
          evidencePhotos: JSON.stringify(evidencePhotos || []),
          status: "OPEN",
        },
      });
      const updated = await db.booking.update({
        where: { id },
        data: { status: "DISPUTED" },
      });
      // Email the other party
      const otherPartyId = session.id === booking.renterId ? booking.item.ownerId : booking.renterId;
      const otherParty = await db.user.findUnique({ where: { id: otherPartyId } });
      const raiser = await db.user.findUnique({ where: { id: session.id } });
      if (otherParty && raiser) await notifyDisputeRaised(otherParty.email, raiser.name, booking.item, reason);
      return NextResponse.json({ booking: updated, dispute });
    }

    if (action === "resolve-dispute" && isAdmin && booking.status === "DISPUTED") {
      const { resolution, notes, depositToOwnerPct } = body;
      const pct = parseFloat(depositToOwnerPct || "0");
      const ownerShare = booking.securityDeposit * (pct / 100);
      const renterShare = booking.securityDeposit - ownerShare;
      const owner = await db.user.findUnique({ where: { id: booking.item.ownerId } });
      const renter = await db.user.findUnique({ where: { id: booking.renterId } });

      const txns = [];
      if (ownerShare > 0) {
        txns.push(
          db.walletTransaction.create({
            data: {
              userId: booking.item.ownerId,
              type: "CREDIT",
              amount: ownerShare,
              reference: id,
              description: `Dispute settlement — owner share (${pct}%)`,
              balanceAfter: (owner?.walletBalance || 0) + ownerShare,
            },
          }),
          db.user.update({
            where: { id: booking.item.ownerId },
            data: { walletBalance: { increment: ownerShare } },
          })
        );
      }
      if (renterShare > 0) {
        txns.push(
          db.walletTransaction.create({
            data: {
              userId: booking.renterId,
              type: "CREDIT",
              amount: renterShare,
              reference: id,
              description: `Dispute refund — renter share (${100 - pct}%)`,
              balanceAfter: (renter?.walletBalance || 0) + renterShare,
            },
          }),
          db.user.update({
            where: { id: booking.renterId },
            data: { walletBalance: { increment: renterShare } },
          })
        );
      }

      const [updatedBooking] = await db.$transaction([
        db.dispute.update({
          where: { bookingId: id },
          data: {
            status: resolution || "RESOLVED_SPLIT",
            resolutionNotes: notes,
            decidedBy: session.id,
            resolvedAt: now,
          },
        }),
        db.booking.update({
          where: { id },
          data: { status: "COMPLETED", completedAt: now },
        }),
        ...txns,
      ]);
      return NextResponse.json({ booking: updatedBooking });
    }

    return NextResponse.json({ error: `Invalid action '${action}' for state ${booking.status}` }, { status: 400 });
  } catch (e: any) {
    console.error("Booking action error:", e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
