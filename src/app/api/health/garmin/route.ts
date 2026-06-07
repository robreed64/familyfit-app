import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculatePoints } from "@/lib/utils";
import { parseFitFile, mapGarminSport } from "@/lib/fit-parser";
import { format } from "date-fns";

/*
  POST /api/health/garmin
  Multipart form-data with one or more .fit files.
  Auth: session cookie (user must be logged in).

  How to export from Garmin Connect:
  1. Open garmin.com/modern/activities
  2. Click any activity → gear icon → Export Original
  3. Upload the downloaded .fit file here.
*/
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  let formData: FormData;

  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const files = formData.getAll("file") as File[];
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided. Field name must be 'file'." }, { status: 400 });
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const file of files) {
    if (!file.name.toLowerCase().endsWith(".fit")) {
      errors.push(`${file.name}: only .fit files are supported`);
      continue;
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const activities = await parseFitFile(buffer);

      if (activities.length === 0) {
        errors.push(`${file.name}: no activity sessions found`);
        continue;
      }

      for (const act of activities) {
        const type = mapGarminSport(act.sport);
        const activityDate = act.startDate;
        const duration = act.durationSeconds > 0 ? Math.round(act.durationSeconds / 60) : null;
        const points = calculatePoints({ type, duration, distance: act.distanceKm, steps: act.steps });

        // Use a fingerprint of sport+startDate as external ID (FIT files don't carry a web ID)
        const externalId = `garmin-fit-${act.sport}-${format(activityDate, "yyyy-MM-dd-HHmm")}`;

        await db.activity.upsert({
          where: { userId_externalId: { userId, externalId } },
          create: {
            userId,
            type,
            steps: act.steps,
            distance: act.distanceKm,
            duration,
            calories: act.calories,
            notes: act.sport !== type ? act.sport : null,
            activityDate,
            points,
            source: "garmin",
            externalId,
          },
          update: { duration, distance: act.distanceKm, calories: act.calories, points },
        });
        imported++;
      }
    } catch (err) {
      errors.push(`${file.name}: ${err instanceof Error ? err.message : "parse error"}`);
    }
  }

  skipped = files.length - imported - errors.length;

  return NextResponse.json({ imported, skipped, errors }, { status: errors.length && !imported ? 400 : 200 });
}
