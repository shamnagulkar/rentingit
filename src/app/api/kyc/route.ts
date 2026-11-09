import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST /api/kyc — submit KYC docs (uploads already done via Cloudinary, just save URLs)
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { docType, docNumber, docImageUrl, selfieImageUrl } = body;

  if (!docType || !docNumber || !docImageUrl || !selfieImageUrl) {
    return NextResponse.json({ error: "Missing fields — need docType, docNumber, docImageUrl, selfieImageUrl" }, { status: 400 });
  }
  if (!["AADHAAR", "PAN", "DRIVING_LICENSE"].includes(docType)) {
    return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
  }
  if (docNumber.length < 6) {
    return NextResponse.json({ error: "Document number looks too short" }, { status: 400 });
  }

  // Check for existing pending/verified KYC
  const existing = await db.kycDocument.findFirst({
    where: { userId: session.id, status: { in: ["PENDING", "APPROVED"] } },
  });
  if (existing) {
    return NextResponse.json({ error: "You already have a pending or approved KYC submission" }, { status: 400 });
  }

  // Create KYC submission
  const kyc = await db.kycDocument.create({
    data: {
      userId: session.id,
      docType,
      docNumber,
      docImageUrl,
      selfieImageUrl,
      status: "PENDING",
    },
  });

  // Update user's KYC status to SUBMITTED
  await db.user.update({
    where: { id: session.id },
    data: {
      kycStatus: "SUBMITTED",
      kycDocType: docType,
      kycDocNumber: docNumber.slice(0, 4) + "XXXX" + docNumber.slice(-2),
    },
  });

  return NextResponse.json({ kyc });
}

// GET /api/kyc — get current user's KYC submission history
export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const docs = await db.kycDocument.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ docs });
}
