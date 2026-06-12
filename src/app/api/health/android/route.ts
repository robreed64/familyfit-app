import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculatePoints } from "@/lib/utils";

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/health/android",
    description: "Receives Android Health Connect data from Tasker or Automate.",
    auth: "Authorization: Bearer <your-personal-token>",
    setup: "Go to /profile/connections in the app to generate your token and get setup instructions.",
  });
}

/*
  POST /api/health/android
  Called by Tasker / Automate / MacroDroid with Bearer <personal_token>.

  Body (JSON):
  {
    "date": "2026-06-07",          // YYYY-MM-DD (defaults to today)
    "steps": 9241,                 // optional — from Health Connect StepsRecord
    "distance": 6.8,               // optional — km, from DistanceRecord
    "calories": 420,               // optional — from TotalCaloriesBurnedRecord
    "workouts": [                  // optional — from ExerciseSessionRecord
      {
        "type": "RUNNING",         // Health Connect exercise type name
        "duration": 42,            // minutes
        "distance": 6.8,           // km (optional)
        "calories": 380,           // optional
        "startDate": "2026-06-07"
      }
    ]
  }
*/
export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
  }

  const record = await db.personalToken.findUnique({ where: { token } });
  if (!record) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const userId = record.userId;
  let body: AndroidHealthPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const date = body.date ?? new Date().toISOString().split("T")[0];
  let imported = 0;

  // Upsert daily step aggregate
  if (body.steps && body.steps > 0) {
    const externalId = `android-steps-${date}`;
    const points = calculatePoints({ type: "steps", steps: body.steps });

    await db.activity.upsert({
      where: { userId_externalId: { userId, externalId } },
      create: {
        userId,
        type: "steps",
        steps: body.steps,
        distance: body.distance ?? null,
        calories: body.calories ?? null,
        activityDate: new Date(date),
        points,
        source: "android_health",
        externalId,
      },
      update: {
        steps: body.steps,
        distance: body.distance ?? null,
        calories: body.calories ?? null,
        points,
      },
    });
    imported++;
  }

  // Upsert individual workout sessions
  for (const w of body.workouts ?? []) {
    const type = mapHealthConnectType(w.type);
    const workoutDate = w.startDate ?? date;
    const externalId = `android-workout-${workoutDate}-${type}-${w.duration ?? 0}`;
    const points = calculatePoints({ type, duration: w.duration, distance: w.distance });

    await db.activity.upsert({
      where: { userId_externalId: { userId, externalId } },
      create: {
        userId,
        type,
        duration: w.duration ?? null,
        distance: w.distance ?? null,
        calories: w.calories ?? null,
        notes: w.type,
        activityDate: new Date(workoutDate),
        points,
        source: "android_health",
        externalId,
      },
      update: {
        duration: w.duration ?? null,
        distance: w.distance ?? null,
        calories: w.calories ?? null,
        points,
      },
    });
    imported++;
  }

  return NextResponse.json({ imported, date });
}

// Maps Health Connect ExerciseSessionRecord types to our internal types
// Full list: https://developer.android.com/reference/kotlin/androidx/health/connect/client/records/ExerciseSessionRecord
function mapHealthConnectType(name: string): string {
  const n = (name ?? "").toUpperCase();
  if (n.includes("RUNNING") || n.includes("RUN") || n.includes("JOGGING")) return "run";
  if (n.includes("BIKING") || n.includes("CYCLING") || n.includes("BIKE")) return "bike";
  if (n.includes("SWIMMING") || n.includes("SWIM")) return "swim";
  if (n.includes("YOGA")) return "yoga";
  if (n.includes("MARTIAL") || n.includes("JIU") || n.includes("BJJ") || n.includes("GRAPPL") || n.includes("JUDO") || n.includes("WRESTL")) return "bjj";
  if (
    n.includes("STRENGTH") || n.includes("WEIGHT") || n.includes("RESISTANCE") ||
    n.includes("CALISTHENICS") || n.includes("HIIT") || n.includes("CROSSFIT")
  ) return "strength";
  if (n.includes("WALKING") || n.includes("HIKING")) return "steps";
  return "other";
}

interface AndroidHealthPayload {
  date?: string;
  steps?: number;
  distance?: number;
  calories?: number;
  workouts?: {
    type: string;
    duration?: number;
    distance?: number;
    calories?: number;
    startDate?: string;
  }[];
}
