// Seeds ONLY the badge definitions (idempotent, no sample users) —
// safe to run against production. Usage: npx tsx prisma/seed-badges.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

const db = new PrismaClient();

const badgeData = [
  { name: "First Steps", description: "Log your first activity", icon: "👟", condition: '{"type":"activity_count","threshold":1}' },
  { name: "Week Warrior", description: "7-day activity streak", icon: "🔥", condition: '{"type":"streak","threshold":7}' },
  { name: "Step King", description: "Log 100,000 total steps", icon: "👑", condition: '{"type":"total_steps","threshold":100000}' },
  { name: "Point Hoarder", description: "Earn 1,000 total points", icon: "⚡", condition: '{"type":"total_points","threshold":1000}' },
  { name: "Social Butterfly", description: "Join 3 groups", icon: "🦋", condition: '{"type":"group_count","threshold":3}' },
  { name: "Marathon", description: "Log 42km total distance", icon: "🏅", condition: '{"type":"total_distance","threshold":42}' },
];

async function main() {
  for (const badge of badgeData) {
    await db.badge.upsert({ where: { name: badge.name }, create: badge, update: badge });
  }
  const count = await db.badge.count();
  console.log(`✅ Badges seeded (${count} in database)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
