import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateJoinCode } from "@/lib/utils";
import { checkAndAwardBadges } from "@/lib/badges";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groups = await db.group.findMany({
    where: {
      members: { some: { userId: session.user.id } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(groups);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, startDate, endDate } = await req.json();
  if (!name) return NextResponse.json({ error: "Group name required" }, { status: 400 });

  const joinCode = generateJoinCode();

  const group = await db.group.create({
    data: {
      name,
      description: description || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      joinCode,
      members: {
        create: { userId: session.user.id, role: "admin" },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  await checkAndAwardBadges(session.user.id);

  return NextResponse.json(group, { status: 201 });
}
