"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MEAL_TYPES, getMealEmoji } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function MealForm() {
  const router = useRouter();
  const [mealType, setMealType] = useState("breakfast");
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [notes, setNotes] = useState("");
  const [mealDate, setMealDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealType, description, calories, protein, carbs, fat, notes, mealDate }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error || "Failed to log meal");
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="text-7xl mb-4">🍽️</div>
        <h2 className="text-3xl font-black text-purple-700 mb-2">Meal logged!</h2>
        <p className="text-gray-500 text-lg">Keep fueling those workouts</p>
        <p className="text-gray-400 text-sm mt-2">Heading back to dashboard...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>{getMealEmoji(mealType)}</span>
          <span>What did you eat?</span>
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
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Meal Type</label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {getMealEmoji(t)} {t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Date</label>
            <Input
              type="date"
              value={mealDate}
              onChange={(e) => setMealDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              What did you have?
            </label>
            <Input
              placeholder="e.g. Chicken salad with avocado"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              Calories (optional)
            </label>
            <Input
              type="number"
              placeholder="e.g. 550"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              min="0"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Protein (g)</label>
              <Input
                type="number"
                placeholder="—"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                min="0"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Carbs (g)</label>
              <Input
                type="number"
                placeholder="—"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                min="0"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Fat (g)</label>
              <Input
                type="number"
                placeholder="—"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              Notes (optional)
            </label>
            <Textarea
              placeholder="Homemade? Eating out? How did it taste?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? "Logging..." : "Log Meal 🍽️"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
