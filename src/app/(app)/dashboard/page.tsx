import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format, startOfWeek, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatsChart } from "@/components/dashboard/stats-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { NutritionSummary } from "@/components/dashboard/nutrition-summary";
import { formatPoints, getRankEmoji, getActivityEmoji, getStreakEmoji } from "@/lib/utils";
import { PlusCircle, Zap, Footprints, Flame, Trophy } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id!;
  const now = new Date();

  const [user, todayStats, weekStats, recentActivities, myGroups, todayMeals] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, image: true },
    }),
    db.activity.aggregate({
      where: { userId, activityDate: { gte: startOfDay(now) } },
      _sum: { points: true, steps: true, duration: true },
      _count: true,
    }),
    db.activity.aggregate({
      where: { userId, activityDate: { gte: startOfWeek(now, { weekStartsOn: 1 }) } },
      _sum: { points: true, steps: true },
    }),
    db.activity.findMany({
      where: { userId },
      orderBy: { activityDate: "desc" },
      take: 5,
    }),
    db.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: { _count: { select: { members: true } } },
        },
      },
      orderBy: { joinedAt: "desc" },
      take: 3,
    }),
    db.meal.findMany({
      where: { userId, mealDate: { gte: startOfDay(now) } },
      orderBy: { mealDate: "asc" },
    }),
  ]);

  // Calculate streak
  const allActivityDays = await db.activity.findMany({
    where: { userId },
    select: { activityDate: true },
    orderBy: { activityDate: "desc" },
    distinct: ["activityDate"],
  });

  const uniqueDays = Array.from(
    new Set(allActivityDays.map((a) => format(a.activityDate, "yyyy-MM-dd")))
  ).sort((a, b) => b.localeCompare(a));

  let streak = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);
  for (const day of uniqueDays) {
    if (day === format(checkDate, "yyyy-MM-dd")) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }

  const firstName = user?.name?.split(" ")[0] ?? "Champ";
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const statCards = [
    {
      label: "Today's Points",
      value: formatPoints(todayStats._sum.points ?? 0),
      icon: Zap,
      color: "from-violet-500 to-purple-600",
      bg: "from-violet-50 to-purple-50",
    },
    {
      label: "Today's Steps",
      value: (todayStats._sum.steps ?? 0).toLocaleString(),
      icon: Footprints,
      color: "from-blue-500 to-cyan-500",
      bg: "from-blue-50 to-cyan-50",
    },
    {
      label: "Week Points",
      value: formatPoints(weekStats._sum.points ?? 0),
      icon: Trophy,
      color: "from-orange-500 to-amber-500",
      bg: "from-orange-50 to-amber-50",
    },
    {
      label: "Streak",
      value: `${streak}d ${getStreakEmoji(streak)}`,
      icon: Flame,
      color: "from-red-500 to-orange-500",
      bg: "from-red-50 to-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{format(now, "EEEE, MMMM d")}</p>
        </div>
        <Link href="/log">
          <Button size="sm" className="gap-1.5">
            <PlusCircle className="w-4 h-4" />
            Log
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className={`bg-gradient-to-br ${bg} border-0 shadow-sm`}>
            <CardContent className="p-4">
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl font-black text-gray-800">{value}</div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <StatsChart userId={userId} />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <Link href="/log" className="text-xs text-purple-600 font-semibold hover:underline">
                + Log new
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ActivityFeed activities={recentActivities} />
          </CardContent>
        </Card>

        {/* My Groups */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">My Groups</CardTitle>
              <Link href="/groups" className="text-xs text-purple-600 font-semibold hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {myGroups.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-sm text-gray-500 mb-3">No groups yet!</p>
                <Link href="/groups">
                  <Button size="sm" variant="outline">
                    Create or join a group
                  </Button>
                </Link>
              </div>
            ) : (
              myGroups.map(({ group }) => (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {group.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-800 truncate">{group.name}</div>
                      <div className="text-xs text-gray-400">{group._count.members} members</div>
                    </div>
                    <span className="text-gray-300">›</span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Today's Nutrition */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Today&apos;s Nutrition</CardTitle>
              <Link href="/log" className="text-xs text-purple-600 font-semibold hover:underline">
                + Log meal
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            <NutritionSummary meals={todayMeals} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
