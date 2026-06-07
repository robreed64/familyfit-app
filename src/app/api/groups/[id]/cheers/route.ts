import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;

  const membership = await db.groupMember.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  // Get cheers between group members
  const memberIds = (
    await db.groupMember.findMany({ where: { groupId }, select: { userId: true } })
  ).map((m) => m.userId);

  const cheers = await db.cheer.findMany({
    where: {
      senderId: { in: memberIds },
      receiverId: { in: memberIds },
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json(cheers);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;
  const { receiverId, message, emoji } = await req.json();

  if (!receiverId || !message) {
    return NextResponse.json({ error: "receiverId and message required" }, { status: 400 });
  }

  const membership = await db.groupMember.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const receiverMembership = await db.groupMember.findUnique({
    where: { userId_groupId: { userId: receiverId, groupId } },
  });
  if (!receiverMembership) return NextResponse.json({ error: "Recipient not in group" }, { status: 400 });

  const cheer = await db.cheer.create({
    data: {
      senderId: session.user.id,
      receiverId,
      message,
      emoji: emoji || null,
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(cheer, { status: 201 });
}
