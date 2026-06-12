import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateJoinCode(): string {
  return nanoid(8).toUpperCase();
}

export const EXERCISE_TYPES = [
  { value: "steps", label: "Steps" },
  { value: "run", label: "Run" },
  { value: "bike", label: "Bike" },
  { value: "swim", label: "Swim" },
  { value: "yoga", label: "Yoga" },
  { value: "pilates", label: "Pilates" },
  { value: "strength", label: "Strength Training" },
  { value: "bjj", label: "BJJ" },
  { value: "other", label: "Other" },
];

// NEAT = Non-Exercise Activity Thermogenesis: everyday movement
export const NEAT_TYPES = [
  { value: "laundry", label: "Laundry" },
  { value: "vacuuming", label: "Vacuum / Sweep / Mop" },
  { value: "cleaning", label: "Cleaning" },
  { value: "gardening", label: "Gardening" },
  { value: "yardwork", label: "Yard Work (mow / rake / shovel)" },
  { value: "dogwalk", label: "Dog Walk" },
  { value: "play", label: "Play with Kids" },
  { value: "cooking", label: "Cooking" },
  { value: "errands", label: "Errands / Groceries" },
  { value: "diy", label: "DIY / Home Repair" },
];

export function getActivityLabel(type: string): string {
  const match = [...EXERCISE_TYPES, ...NEAT_TYPES].find((t) => t.value === type);
  if (match) return match.label;
  return type.charAt(0).toUpperCase() + type.slice(1);
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
      pilates: 2,
      strength: 3,
      bjj: 3,
      other: 1,
      steps: 0,
      laundry: 1,
      vacuuming: 1,
      cleaning: 1,
      gardening: 1,
      yardwork: 1,
      dogwalk: 1,
      play: 1,
      cooking: 1,
      errands: 1,
      diy: 1,
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
    pilates: "🤸",
    strength: "💪",
    bjj: "🥋",
    other: "🏅",
    laundry: "🧺",
    vacuuming: "🧹",
    cleaning: "🧽",
    gardening: "🌱",
    yardwork: "🍂",
    dogwalk: "🐕",
    play: "⚽",
    cooking: "🍳",
    errands: "🛒",
    diy: "🔧",
  };
  return map[type] ?? "🏅";
}

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export function getMealEmoji(type: string): string {
  const map: Record<string, string> = {
    breakfast: "🍳",
    lunch: "🥪",
    dinner: "🍽️",
    snack: "🍎",
  };
  return map[type] ?? "🍴";
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
