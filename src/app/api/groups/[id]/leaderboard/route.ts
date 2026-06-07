import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfWeek, startOfMonth, startOfDay } from "date-fns";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "weekly"; // daily | weekly | monthly | alltime

  const membership = await db.groupMember.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: id } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const now = new Date();
  let since: Date | undefined;
  if (period === "daily") since = startOfDay(now);
  else if (period === "weekly") since = startOfWeek(now, { weekStartsOn: 1 });
  else if (period === "monthly") since = startOfMonth(now);

  const members = await db.groupMember.findMany({
    where: { groupId: id },
    select: {
      role: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          activities: {
            where: since ? { activityDate: { gte: since } } : {},
            select: { points: true, steps: true, activityDate: true, type: true },
          },
        },
      },
    },
  });

  const leaderboard = members.map((m) => {
    const activities = m.user.activities;
    const totalPoints = activities.reduce((sum, a) => sum + a.points, 0);
    const totalSteps = activities.reduce((sum, a) => sum + (a.steps ?? 0), 0);
    const activityDays = new Set(
      activities.map((a) => a.activityDate.toISOString().split("T")[0])
    ).size;

    // Calculate streak (consecutive days with activity)
    const allDays = Array.from(
      new Set(activities.map((a) => a.activityDate.toISOString().split("T")[0]))
    ).sort((a, b) => b.localeCompare(a));

    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    for (const day of allDays) {
      const d = checkDate.toISOString().split("T")[0];
      if (day === d) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      userId: m.user.id,
      name: m.user.name,
      image: m.user.image,
      role: m.role,
      totalPoints,
      totalSteps,
      activityDays,
      streak,
    };
  });

  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

  return NextResponse.json(leaderboard);
}
