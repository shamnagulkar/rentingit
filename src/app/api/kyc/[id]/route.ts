import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { notifyKycApproved } from "@/lib/email";

export const dynamic = "force-dynamic";

// PATCH /api/kyc/[id] — admin approves or rejects
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const { action, rejectionReason } = body; // action: "approve" | "reject"

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const kyc = await db.kycDocument.findUnique({ where: { id }, include: { user: true } });
  if (!kyc) return NextResponse.json({ error: "KYC submission not found" }, { status: 404 });
  if (kyc.status !== "PENDING") {
    return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
  }

  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  // Use the actual admin user (from session in real usage)
  const sessionUser = await getSessionUserForAdmin();

  const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

  const [updated] = await db.$transaction([
    db.kycDocument.update({
      where: { id },
      data: {
        status: newStatus,
        rejectionReason: action === "reject" ? rejectionReason : null,
        reviewedBy: sessionUser?.id || admin?.id,
        reviewedAt: new Date(),
      },
    }),
    db.user.update({
      where: { id: kyc.userId },
      data: {
        kycStatus: action === "approve" ? "VERIFIED" : "REJECTED",
      },
    }),
  ]);

  if (action === "approve") {
    await notifyKycApproved(kyc.user.email, kyc.user.name);
  }

  return NextResponse.json({ kyc: updated });
}

async function getSessionUserForAdmin() {
  const { getSessionUser } = await import("@/lib/session");
  return getSessionUser();
}
