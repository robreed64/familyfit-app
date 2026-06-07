import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateJoinCode(): string {
  return nanoid(8).toUpperCase();
}

export function calculatePoints(activity: {
  type: string;
  steps?: number | null;
  duration?: number | null;
  distance?: number | null;
}): number {
  let points = 0;

  if (activity.steps) {
    points += Math.floor(activity.steps / 100);
  }

  if (activity.duration) {
    const activityMultipliers: Record<string, number> = {
      run: 3,
      bike: 2,
      swim: 4,
      yoga: 2,
      strength: 3,
      other: 1,
      steps: 0,
    };
    const multiplier = activityMultipliers[activity.type] ?? 1;
    points += activity.duration * multiplier;
  }

  if (activity.distance) {
    points += Math.floor(activity.distance * 5);
  }

  return Math.max(points, activity.type === "steps" ? 0 : 10);
}

export function formatPoints(points: number): string {
  if (points >= 1000) return `${(points / 1000).toFixed(1)}k`;
  return points.toString();
}

export function getRankEmoji(rank: number): string {
  const emojis: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
  return emojis[rank] ?? `#${rank}`;
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return "🔥🔥🔥";
  if (streak >= 14) return "🔥🔥";
  if (streak >= 7) return "🔥";
  if (streak >= 3) return "⚡";
  return "";
}

export function getActivityEmoji(type: string): string {
  const map: Record<string, string> = {
    steps: "👟",
    run: "🏃",
    bike: "🚴",
    swim: "🏊",
    yoga: "🧘",
    strength: "💪",
    other: "🏅",
  };
  return map[type] ?? "🏅";
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
