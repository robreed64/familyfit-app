import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { calculatePoints } from "../src/lib/utils";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Seed badges
  const badgeData = [
    { name: "First Steps", description: "Log your first activity", icon: "👟", condition: '{"type":"activity_count","threshold":1}' },
    { name: "Week Warrior", description: "7-day activity streak", icon: "🔥", condition: '{"type":"streak","threshold":7}' },
    { name: "Step King", description: "Log 100,000 total steps", icon: "👑", condition: '{"type":"total_steps","threshold":100000}' },
    { name: "Point Hoarder", description: "Earn 1,000 total points", icon: "⚡", condition: '{"type":"total_points","threshold":1000}' },
    { name: "Social Butterfly", description: "Join 3 groups", icon: "🦋", condition: '{"type":"group_count","threshold":3}' },
    { name: "Marathon", description: "Log 42km total distance", icon: "🏅", condition: '{"type":"total_distance","threshold":42}' },
  ];

  for (const badge of badgeData) {
    await db.badge.upsert({ where: { name: badge.name }, create: badge, update: badge });
  }

  // Seed sample users
  const users = [
    { name: "Alex Smith", email: "alex@family.com" },
    { name: "Jordan Smith", email: "jordan@family.com" },
    { name: "Sam Smith", email: "sam@family.com" },
    { name: "Casey Jones", email: "casey@friends.com" },
  ];

  const password = await bcrypt.hash("password123", 12);
  const createdUsers = [];

  for (const u of users) {
    const user = await db.user.upsert({
      where: { email: u.email },
      create: { ...u, password },
      update: {},
    });
    createdUsers.push(user);
  }

  // Seed groups
  const familyGroup = await db.group.upsert({
    where: { joinCode: "FAMILY01" },
    create: {
      name: "Smith Family Challenge 2026",
      description: "Let's get fit together! Monthly step competition.",
      joinCode: "FAMILY01",
      members: {
        create: [
          { userId: createdUsers[0].id, role: "admin" },
          { userId: createdUsers[1].id, role: "member" },
          { userId: createdUsers[2].id, role: "member" },
        ],
      },
    },
    update: {},
  });

  const friendsGroup = await db.group.upsert({
    where: { joinCode: "WORKOUT2" },
    create: {
      name: "Work Buddies Step War",
      description: "Who can hit 10k steps every day?",
      joinCode: "WORKOUT2",
      members: {
        create: [
          { userId: createdUsers[0].id, role: "admin" },
          { userId: createdUsers[3].id, role: "member" },
        ],
      },
    },
    update: {},
  });

  // Seed activities for the past 2 weeks
  const activityTypes = ["steps", "run", "bike", "yoga", "strength"];
  const now = new Date();

  for (const user of createdUsers) {
    for (let day = 0; day < 14; day++) {
      if (Math.random() > 0.3) {
        const actDate = new Date(now);
        actDate.setDate(actDate.getDate() - day);
        const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        const steps = type === "steps" ? Math.floor(Math.random() * 12000) + 2000 : null;
        const duration = type !== "steps" ? Math.floor(Math.random() * 60) + 15 : null;
        const distance = ["run", "bike"].includes(type) ? parseFloat((Math.random() * 15 + 1).toFixed(1)) : null;
        const points = calculatePoints({ type, steps, duration, distance });

        await db.activity.create({
          data: {
            userId: user.id,
            type,
            steps,
            duration,
            distance,
            calories: duration ? Math.floor(duration * (Math.random() * 8 + 5)) : null,
            activityDate: actDate,
            points,
          },
        });
      }
    }
  }

  // Seed some cheers
  for (const cheer of [
    { senderId: createdUsers[1].id, receiverId: createdUsers[0].id, message: "Amazing run today, keep it up!", emoji: "🔥" },
    { senderId: createdUsers[0].id, receiverId: createdUsers[2].id, message: "Crushing those steps! You're unstoppable!", emoji: "💪" },
    { senderId: createdUsers[2].id, receiverId: createdUsers[1].id, message: "Great week! You're almost catching me 😄", emoji: "🎉" },
  ]) {
    await db.cheer.create({ data: cheer });
  }

  console.log("✅ Seed complete!");
  console.log("\n📧 Sample accounts:");
  users.forEach((u) => console.log(`  ${u.email} / password123`));
  console.log(`\n🔑 Group codes:`);
  console.log("  FAMILY01 — Smith Family Challenge");
  console.log("  WORKOUT2 — Work Buddies Step War");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
