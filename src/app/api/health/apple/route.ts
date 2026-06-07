import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculatePoints } from "@/lib/utils";

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/health/apple",
    description: "Receives Apple Health data from your iOS Shortcut.",
    auth: "Authorization: Bearer <your-personal-token>",
    setup: "Go to /profile/connections in the app to generate your token and get setup instructions.",
  });
}

/*
  POST /api/health/apple
  Called by the iOS Shortcut with Bearer <personal_token>.

  Body (JSON):
  {
    "date": "2026-06-07",          // YYYY-MM-DD
    "steps": 8432,                 // optional
    "workouts": [                  // optional array
      {
        "type": "Running",
        "duration": 35,            // minutes
        "distance": 5.2,           // km (optional)
        "calories": 310,           // optional
        "startDate": "2026-06-07"  // YYYY-MM-DD
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
  let body: AppleHealthPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const date = body.date ?? new Date().toISOString().split("T")[0];
  let imported = 0;

  // Upsert daily steps
  if (body.steps && body.steps > 0) {
    const externalId = `apple-steps-${date}`;
    const points = calculatePoints({ type: "steps", steps: body.steps });

    await db.activity.upsert({
      where: { userId_externalId: { userId, externalId } },
      create: {
        userId,
        type: "steps",
        steps: body.steps,
        activityDate: new Date(date),
        points,
        source: "apple_health",
        externalId,
      },
      update: { steps: body.steps, points },
    });
    imported++;
  }

  // Upsert individual workouts
  for (const w of body.workouts ?? []) {
    const type = mapAppleWorkoutType(w.type);
    const workoutDate = w.startDate ?? date;
    // Use a hash of type+date+duration as external ID since Apple doesn't give us IDs via Shortcuts
    const externalId = `apple-workout-${workoutDate}-${type}-${w.duration ?? 0}`;
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
        source: "apple_health",
        externalId,
      },
      update: { duration: w.duration ?? null, distance: w.distance ?? null, points },
    });
    imported++;
  }

  return NextResponse.json({ imported, date });
}

function mapAppleWorkoutType(name: string): string {
  const n = (name ?? "").toLowerCase();
  if (n.includes("run") || n.includes("jog")) return "run";
  if (n.includes("cycl") || n.includes("bike") || n.includes("indoor cycling")) return "bike";
  if (n.includes("swim")) return "swim";
  if (n.includes("yoga") || n.includes("mindful")) return "yoga";
  if (n.includes("strength") || n.includes("functional") || n.includes("core") || n.includes("hiit")) return "strength";
  if (n.includes("walk") || n.includes("hik")) return "steps";
  return "other";
}

interface AppleHealthPayload {
  date?: string;
  steps?: number;
  workouts?: {
    type: string;
    duration?: number;
    distance?: number;
    calories?: number;
    startDate?: string;
  }[];
}
