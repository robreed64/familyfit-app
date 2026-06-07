import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      createdAt: true,
      badges: {
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      },
      _count: {
        select: { activities: true, groupMembers: true },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const totalPoints = await db.activity.aggregate({
    where: { userId: session.user.id },
    _sum: { points: true },
  });

  const totalSteps = await db.activity.aggregate({
    where: { userId: session.user.id },
    _sum: { steps: true },
  });

  return NextResponse.json({
    ...user,
    totalPoints: totalPoints._sum.points ?? 0,
    totalSteps: totalSteps._sum.steps ?? 0,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, bio } = await req.json();

  const user = await db.user.update({
    where: { id: session.user.id },
    data: {
      name: name || undefined,
      bio: bio !== undefined ? bio : undefined,
    },
    select: { id: true, name: true, email: true, bio: true, image: true },
  });

  return NextResponse.json(user);
}
