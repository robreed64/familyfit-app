import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { exchangeFitbitCode, syncFitbitActivities } from "@/lib/fitbit";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/profile/connections?error=fitbit_denied", req.url)
    );
  }

  try {
    const tokens = await exchangeFitbitCode(code);

    await db.wearableConnection.upsert({
      where: { userId_provider: { userId: session.user.id, provider: "fitbit" } },
      create: {
        userId: session.user.id,
        provider: "fitbit",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        providerUserId: tokens.user_id,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        providerUserId: tokens.user_id,
      },
    });

    // Kick off an initial sync for the past 7 days
    await syncFitbitActivities(session.user.id, 7);

    return NextResponse.redirect(
      new URL("/profile/connections?success=fitbit", req.url)
    );
  } catch (err) {
    console.error("Fitbit callback error:", err);
    return NextResponse.redirect(
      new URL("/profile/connections?error=fitbit_failed", req.url)
    );
  }
}
