import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/messages?conversationId=... — list messages
export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

  // Verify access
  const conv = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conv.ownerId !== session.id && conv.renterId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await db.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true } } },
    take: 200,
  });

  return NextResponse.json({ messages });
}

// POST /api/messages — send a message
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { conversationId, message } = body;
  if (!conversationId || !message?.trim()) {
    return NextResponse.json({ error: "conversationId and message required" }, { status: 400 });
  }

  const conv = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  if (conv.ownerId !== session.id && conv.renterId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const msg = await db.chatMessage.create({
    data: {
      conversationId,
      senderId: session.id,
      message: message.trim().slice(0, 2000),
    },
    include: { sender: { select: { id: true, name: true } } },
  });

  // Broadcast via internal HTTP ping to chat service (best-effort)
  try {
    await fetch(`http://localhost:3003/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        message: msg,
      }),
    });
  } catch (e) {
    // Chat service might be down — message is still saved, just not pushed live
  }

  return NextResponse.json({ message: msg });
}
