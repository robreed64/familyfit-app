// Wrapper that promisifies fit-file-parser and extracts the fields we care about
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FitParser = require("fit-file-parser").default ?? require("fit-file-parser");

export interface ParsedActivity {
  sport: string;
  startDate: Date;
  durationSeconds: number;
  distanceKm: number | null;
  calories: number | null;
  steps: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFit(buffer: Buffer): Promise<any> {
  return new Promise((resolve, reject) => {
    const parser = new FitParser({
      force: true,
      speedUnit: "km/h",
      lengthUnit: "km",
      temperatureUnit: "celsius",
      mode: "list",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parser.parse(buffer, (err: Error | null, data: any) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

export async function parseFitFile(buffer: Buffer): Promise<ParsedActivity[]> {
  const data = await parseFit(buffer);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions: any[] = data?.sessions ?? data?.activity?.sessions ?? [];
  if (sessions.length === 0) {
    // Some FIT files only have a single activity record without sessions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activity: any = data?.activity;
    if (activity?.sport) {
      sessions.push(activity);
    }
  }

  return sessions
    .filter((s) => s?.sport)
    .map((s) => ({
      sport: String(s.sport ?? "generic"),
      startDate: s.start_time instanceof Date ? s.start_time : new Date(s.start_time ?? Date.now()),
      durationSeconds: Number(s.total_elapsed_time ?? s.total_timer_time ?? 0),
      distanceKm: s.total_distance != null ? Number(s.total_distance) : null,
      calories: s.total_calories != null ? Number(s.total_calories) : null,
      steps: s.total_steps != null ? Number(s.total_steps) : null,
    }));
}

// Map Garmin sport names to our activity types
export function mapGarminSport(sport: string): string {
  const s = sport.toLowerCase().replace(/_/g, " ");
  if (s.includes("run") || s.includes("trail")) return "run";
  if (s.includes("cycl") || s.includes("bike") || s.includes("indoor cycling") || s.includes("virtual")) return "bike";
  if (s.includes("swim")) return "swim";
  if (s.includes("pilates")) return "pilates";
  if (s.includes("yoga") || s.includes("flexibility")) return "yoga";
  if (s.includes("martial") || s.includes("jiu") || s.includes("bjj") || s.includes("grappl") || s.includes("judo") || s.includes("wrestl")) return "bjj";
  if (
    s.includes("strength") || s.includes("weight") || s.includes("cardio") ||
    s.includes("hiit") || s.includes("training") || s.includes("fitness")
  ) return "strength";
  if (s.includes("walk") || s.includes("hik") || s.includes("steps")) return "steps";
  return "other";
}
