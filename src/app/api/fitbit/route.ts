import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFitbitAuthUrl } from "@/lib/fitbit";

// GET /api/fitbit — redirect user to Fitbit OAuth consent screen
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.FITBIT_CLIENT_ID) {
    return NextResponse.json(
      { error: "Fitbit credentials not configured. Add FITBIT_CLIENT_ID and FITBIT_CLIENT_SECRET to .env" },
      { status: 503 }
    );
  }

  return NextResponse.redirect(getFitbitAuthUrl());
}
