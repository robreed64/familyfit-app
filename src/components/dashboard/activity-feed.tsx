import { format } from "date-fns";
import { getActivityEmoji, formatDuration } from "@/lib/utils";

interface Activity {
  id: string;
  type: string;
  steps: number | null;
  duration: number | null;
  distance: number | null;
  points: number;
  activityDate: Date | string;
  notes: string | null;
  source?: string;
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  fitbit:         { label: "Fitbit",         color: "bg-[#00B0B9]/10 text-[#00838a]" },
  apple_health:   { label: "Apple Health",   color: "bg-red-50 text-red-500" },
  android_health: { label: "Health Connect", color: "bg-green-50 text-green-600" },
  garmin:         { label: "Garmin",         color: "bg-blue-50 text-blue-600" },
  samsung:        { label: "Samsung Health", color: "bg-indigo-50 text-indigo-600" },
  manual:         { label: "",               color: "" },
};

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 px-6">
        <div className="text-4xl mb-2">🏃</div>
        <p className="text-sm text-gray-500">No activities yet — log your first one!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-purple-50">
      {activities.map((a) => {
        const src = SOURCE_LABELS[a.source ?? "manual"];
        return (
          <div key={a.id} className="flex items-center gap-3 px-6 py-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-lg flex-shrink-0">
              {getActivityEmoji(a.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-gray-700 capitalize">
                  {a.type === "bjj" ? "BJJ" : a.type}
                </span>
                {src?.label && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${src.color}`}>
                    {src.label}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 flex gap-2 flex-wrap">
                {a.steps && <span>👟 {a.steps.toLocaleString()} steps</span>}
                {a.duration && <span>⏱ {formatDuration(a.duration)}</span>}
                {a.distance && <span>📍 {a.distance}km</span>}
                <span>· {format(new Date(a.activityDate), "MMM d")}</span>
              </div>
            </div>
            <div className="text-sm font-bold text-purple-600 flex-shrink-0">+{a.points}pts</div>
          </div>
        );
      })}
    </div>
  );
}
