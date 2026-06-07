import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculatePoints } from "@/lib/utils";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const activities = await db.activity.findMany({
    where: { userId: session.user.id },
    orderBy: { activityDate: "desc" },
    take: limit,
    skip: offset,
  });

  return NextResponse.json(activities);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, steps, distance, duration, calories, notes, activityDate } = body;

  if (!type) return NextResponse.json({ error: "Activity type required" }, { status: 400 });

  const points = calculatePoints({ type, steps, duration, distance });

  const activity = await db.activity.create({
    data: {
      userId: session.user.id,
      type,
      steps: steps ? parseInt(steps) : null,
      distance: distance ? parseFloat(distance) : null,
      duration: duration ? parseInt(duration) : null,
      calories: calories ? parseInt(calories) : null,
      notes: notes || null,
      activityDate: activityDate ? new Date(activityDate) : new Date(),
      points,
    },
  });

  return NextResponse.json(activity, { status: 201 });
}
