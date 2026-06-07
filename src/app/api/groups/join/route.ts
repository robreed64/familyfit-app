import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { joinCode } = await req.json();
  if (!joinCode) return NextResponse.json({ error: "Join code required" }, { status: 400 });

  const group = await db.group.findUnique({ where: { joinCode: joinCode.toUpperCase() } });
  if (!group) return NextResponse.json({ error: "Invalid join code" }, { status: 404 });

  const existing = await db.groupMember.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: group.id } },
  });

  if (existing) return NextResponse.json({ error: "Already a member" }, { status: 409 });

  await db.groupMember.create({
    data: { userId: session.user.id, groupId: group.id, role: "member" },
  });

  return NextResponse.json({ groupId: group.id, groupName: group.name });
}
