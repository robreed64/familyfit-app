import { db } from "@/lib/db";
import { calculatePoints } from "@/lib/utils";
import { checkAndAwardBadges } from "@/lib/badges";
import { format, subDays } from "date-fns";

const FITBIT_TOKEN_URL = "https://api.fitbit.com/oauth2/token";
const FITBIT_API = "https://api.fitbit.com/1/user/-";

export function getFitbitAuthUrl(): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.FITBIT_CLIENT_ID!,
    redirect_uri: process.env.FITBIT_REDIRECT_URI!,
    scope: "activity profile heartrate",
    expires_in: "604800",
  });
  return `https://www.fitbit.com/oauth2/authorize?${params}`;
}

export async function exchangeFitbitCode(code: string): Promise<FitbitTokens> {
  const credentials = Buffer.from(
    `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(FITBIT_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.FITBIT_REDIRECT_URI!,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Fitbit token exchange failed: ${err}`);
  }

  return res.json();
}

export async function refreshFitbitToken(refreshToken: string): Promise<FitbitTokens> {
  const credentials = Buffer.from(
    `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(FITBIT_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) throw new Error("Fitbit token refresh failed");
  return res.json();
}

async function fitbitGet(url: string, accessToken: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Fitbit API error: ${res.status}`);
  return res.json();
}

// Ensure token is fresh, refresh if needed, return valid access token
async function getValidToken(userId: string): Promise<string> {
  const conn = await db.wearableConnection.findUnique({
    where: { userId_provider: { userId, provider: "fitbit" } },
  });
  if (!conn) throw new Error("No Fitbit connection");

  // Refresh if expired or expiring within 5 minutes
  const expiresAt = conn.tokenExpiry?.getTime() ?? 0;
  if (Date.now() + 5 * 60 * 1000 >= expiresAt && conn.refreshToken) {
    const tokens = await refreshFitbitToken(conn.refreshToken);
    await db.wearableConnection.update({
      where: { userId_provider: { userId, provider: "fitbit" } },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? conn.refreshToken,
        tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });
    return tokens.access_token;
  }

  return conn.accessToken;
}

export async function syncFitbitActivities(userId: string, daysBack = 7): Promise<number> {
  const accessToken = await getValidToken(userId);
  let imported = 0;

  for (let i = 0; i < daysBack; i++) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");

    const data = await fitbitGet(
      `${FITBIT_API}/activities/date/${date}.json`,
      accessToken
    );

    const summary = data.summary;
    const steps = summary?.steps ?? 0;

    // Import daily steps aggregate
    if (steps > 0) {
      const externalId = `fitbit-steps-${date}`;
      const points = calculatePoints({ type: "steps", steps });

      await db.activity.upsert({
        where: { userId_externalId: { userId, externalId } },
        create: {
          userId,
          type: "steps",
          steps,
          calories: summary?.caloriesOut ?? null,
          activityDate: new Date(date),
          points,
          source: "fitbit",
          externalId,
        },
        update: { steps, points, calories: summary?.caloriesOut ?? null },
      });
      imported++;
    }

    // Import individual logged activities (runs, bike rides, etc.)
    for (const act of data.activities ?? []) {
      const externalId = `fitbit-act-${act.logId}`;
      const type = mapFitbitActivityType(act.activityName);
      const duration = Math.round((act.duration ?? 0) / 60000); // ms → minutes
      const distance = act.distance ?? null;
      const points = calculatePoints({ type, duration, distance });

      await db.activity.upsert({
        where: { userId_externalId: { userId, externalId } },
        create: {
          userId,
          type,
          steps: act.steps ?? null,
          distance,
          duration,
          calories: act.calories ?? null,
          notes: act.activityName,
          activityDate: new Date(date),
          points,
          source: "fitbit",
          externalId,
        },
        update: { duration, distance, points },
      });
      imported++;
    }
  }

  await db.wearableConnection.update({
    where: { userId_provider: { userId, provider: "fitbit" } },
    data: { lastSynced: new Date() },
  });

  if (imported > 0) await checkAndAwardBadges(userId);

  return imported;
}

function mapFitbitActivityType(name: string): string {
  const n = (name ?? "").toLowerCase();
  if (n.includes("run") || n.includes("jog")) return "run";
  if (n.includes("bike") || n.includes("cycl") || n.includes("ride")) return "bike";
  if (n.includes("swim")) return "swim";
  if (n.includes("pilates")) return "pilates";
  if (n.includes("yoga")) return "yoga";
  if (n.includes("martial") || n.includes("jiu") || n.includes("bjj") || n.includes("grappl") || n.includes("judo") || n.includes("wrestl")) return "bjj";
  if (n.includes("weight") || n.includes("strength") || n.includes("lift")) return "strength";
  if (n.includes("walk")) return "steps";
  return "other";
}

interface FitbitTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
  scope: string;
}
