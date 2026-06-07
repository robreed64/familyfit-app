import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const membership = await db.groupMember.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: id } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const group = await db.group.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
      challenges: { orderBy: { startDate: "desc" }, take: 5 },
    },
  });

  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  return NextResponse.json({ ...group, myRole: membership.role });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const membership = await db.groupMember.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: id } },
  });

  if (!membership || membership.role !== "admin") {
    return NextResponse.json({ error: "Only admins can delete groups" }, { status: 403 });
  }

  await db.group.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
