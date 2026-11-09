import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/wallet — wallet balance + transactions
export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { walletBalance: true },
  });
  const transactions = await db.walletTransaction.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    balance: user?.walletBalance || 0,
    transactions,
  });
}

// POST /api/wallet — withdraw to UPI (mock)
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { amount, upiId } = body;
  const amt = parseFloat(amount);
  if (!amt || amt < 100) {
    return NextResponse.json({ error: "Minimum withdrawal ₹100" }, { status: 400 });
  }
  const user = await db.user.findUnique({ where: { id: session.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (amt > user.walletBalance) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }
  if (!upiId || !upiId.includes("@")) {
    return NextResponse.json({ error: "Valid UPI ID required" }, { status: 400 });
  }

  const newBalance = user.walletBalance - amt;
  const [txn] = await db.$transaction([
    db.walletTransaction.create({
      data: {
        userId: session.id,
        type: "DEBIT",
        amount: amt,
        reference: "withdrawal_" + Date.now(),
        description: `Withdrawal to ${upiId}`,
        balanceAfter: newBalance,
      },
    }),
    db.user.update({
      where: { id: session.id },
      data: { walletBalance: newBalance },
    }),
  ]);

  return NextResponse.json({ transaction: txn, newBalance });
}
