"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getActivityEmoji, calculatePoints } from "@/lib/utils";
import { Loader2, Zap } from "lucide-react";

const ACTIVITY_TYPES = [
  { value: "steps", label: "Steps" },
  { value: "run", label: "Run" },
  { value: "bike", label: "Bike" },
  { value: "swim", label: "Swim" },
  { value: "yoga", label: "Yoga" },
  { value: "strength", label: "Strength Training" },
  { value: "other", label: "Other" },
];

export default function LogPage() {
  const router = useRouter();
  const [type, setType] = useState("steps");
  const [steps, setSteps] = useState("");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const previewPoints = calculatePoints({
    type,
    steps: steps ? parseInt(steps) : undefined,
    duration: duration ? parseInt(duration) : undefined,
    distance: distance ? parseFloat(distance) : undefined,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, steps, duration, distance, calories, notes, activityDate }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error || "Failed to log activity");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-7xl mb-4">🎉</div>
        <h2 className="text-3xl font-black text-purple-700 mb-2">Nice work!</h2>
        <p className="text-gray-500 text-lg">
          You earned <span className="font-bold text-purple-600">{previewPoints} points</span>
        </p>
        <p className="text-gray-400 text-sm mt-2">Heading back to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-800">Log Activity</h1>
        <p className="text-gray-500 mt-1">Every move counts — keep crushing it! 💪</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>{getActivityEmoji(type)}</span>
            <span>What did you do?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Activity Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {getActivityEmoji(t.value)} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Date</label>
              <Input
                type="date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {type === "steps" && (
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Steps</label>
                <Input
                  type="number"
                  placeholder="e.g. 8000"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  min="1"
                />
              </div>
            )}

            {type !== "steps" && (
              <>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                    Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 30"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                  />
                </div>
                {(type === "run" || type === "bike" || type === "swim") && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                      Distance (km)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 5.2"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      min="0"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                Calories (optional)
              </label>
              <Input
                type="number"
                placeholder="e.g. 250"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                min="0"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                Notes (optional)
              </label>
              <Textarea
                placeholder="How did it feel? Any PRs?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Points preview */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-purple-100">
              <Zap className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold text-purple-700">
                Estimated points: <span className="text-lg font-black">{previewPoints}</span>
              </span>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Logging..." : "Log Activity 🚀"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
