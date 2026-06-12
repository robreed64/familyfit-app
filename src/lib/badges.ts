import { db } from "@/lib/db";
import { format } from "date-fns";

// Consecutive days (ending today) with at least one activity
export async function calculateStreak(userId: string): Promise<number> {
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
  return streak;
}

interface BadgeCondition {
  type: string;
  threshold: number;
}

// Evaluate all unearned badge conditions for a user and award any that pass.
// Never throws — badge awarding must not break the action that triggered it.
export async function checkAndAwardBadges(userId: string) {
  try {
    const [badges, earned] = await Promise.all([
      db.badge.findMany(),
      db.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
    ]);

    const earnedIds = new Set(earned.map((e) => e.badgeId));
    const unearned = badges.filter((b) => !earnedIds.has(b.id));
    if (unearned.length === 0) return [];

    const conditions = new Map<string, BadgeCondition>();
    for (const b of unearned) {
      try {
        conditions.set(b.id, JSON.parse(b.condition));
      } catch {
        // skip badges with malformed conditions
      }
    }

    const types = new Set([...conditions.values()].map((c) => c.type));
    const needsActivityTotals =
      types.has("activity_count") || types.has("total_steps") ||
      types.has("total_points") || types.has("total_distance");

    const [totals, groupCount, streak] = await Promise.all([
      needsActivityTotals
        ? db.activity.aggregate({
            where: { userId },
            _count: true,
            _sum: { steps: true, points: true, distance: true },
          })
        : null,
      types.has("group_count") ? db.groupMember.count({ where: { userId } }) : 0,
      types.has("streak") ? calculateStreak(userId) : 0,
    ]);

    const newlyEarned: typeof badges = [];
    for (const badge of unearned) {
      const cond = conditions.get(badge.id);
      if (!cond) continue;

      let value: number;
      switch (cond.type) {
        case "activity_count": value = totals?._count ?? 0; break;
        case "total_steps": value = totals?._sum.steps ?? 0; break;
        case "total_points": value = totals?._sum.points ?? 0; break;
        case "total_distance": value = totals?._sum.distance ?? 0; break;
        case "group_count": value = groupCount; break;
        case "streak": value = streak; break;
        default: continue;
      }

      if (value >= cond.threshold) {
        // @@unique([userId, badgeId]) makes concurrent double-awards a no-op
        await db.userBadge
          .create({ data: { userId, badgeId: badge.id } })
          .then(() => newlyEarned.push(badge))
          .catch(() => {});
      }
    }
    return newlyEarned;
  } catch (e) {
    console.error("Badge check failed:", e);
    return [];
  }
}
