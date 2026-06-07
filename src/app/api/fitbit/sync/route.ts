import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncFitbitActivities } from "@/lib/fitbit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const daysBack = Math.min(parseInt(body.daysBack ?? "7"), 30);

  try {
    const count = await syncFitbitActivities(session.user.id, daysBack);
    return NextResponse.json({ imported: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    // Token expired / revoked — clear the connection so UI shows disconnected
    if (message.includes("401") || message.includes("token")) {
      const { db } = await import("@/lib/db");
      await db.wearableConnection
        .delete({ where: { userId_provider: { userId: session.user.id, provider: "fitbit" } } })
        .catch(() => null);
      return NextResponse.json({ error: "Fitbit session expired — please reconnect" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
