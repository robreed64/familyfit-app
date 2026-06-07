import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfWeek, startOfMonth, subDays, format } from "date-fns";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [today, weekly, monthly, allTime, recent7Days] = await Promise.all([
    db.activity.aggregate({
      where: { userId, activityDate: { gte: todayStart } },
      _sum: { points: true, steps: true, duration: true },
      _count: true,
    }),
    db.activity.aggregate({
      where: { userId, activityDate: { gte: weekStart } },
      _sum: { points: true, steps: true, duration: true },
      _count: true,
    }),
    db.activity.aggregate({
      where: { userId, activityDate: { gte: monthStart } },
      _sum: { points: true, steps: true, duration: true },
      _count: true,
    }),
    db.activity.aggregate({
      where: { userId },
      _sum: { points: true, steps: true },
    }),
    // Last 7 days for chart
    db.activity.findMany({
      where: { userId, activityDate: { gte: subDays(now, 6) } },
      select: { activityDate: true, points: true, steps: true, type: true },
      orderBy: { activityDate: "asc" },
    }),
  ]);

  // Build day-by-day chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(now, 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayActivities = recent7Days.filter(
      (a) => format(a.activityDate, "yyyy-MM-dd") === dateStr
    );
    return {
      date: format(date, "EEE"),
      points: dayActivities.reduce((s, a) => s + a.points, 0),
      steps: dayActivities.reduce((s, a) => s + (a.steps ?? 0), 0),
    };
  });

  return NextResponse.json({
    today: {
      points: today._sum.points ?? 0,
      steps: today._sum.steps ?? 0,
      duration: today._sum.duration ?? 0,
      activities: today._count,
    },
    weekly: {
      points: weekly._sum.points ?? 0,
      steps: weekly._sum.steps ?? 0,
      duration: weekly._sum.duration ?? 0,
      activities: weekly._count,
    },
    monthly: {
      points: monthly._sum.points ?? 0,
      steps: monthly._sum.steps ?? 0,
    },
    allTime: {
      points: allTime._sum.points ?? 0,
      steps: allTime._sum.steps ?? 0,
    },
    chartData,
  });
}
