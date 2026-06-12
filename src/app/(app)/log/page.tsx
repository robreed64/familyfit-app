"use client";

import { useState } from "react";
import { ActivityForm } from "@/components/log/activity-form";
import { MealForm } from "@/components/log/meal-form";

export default function LogPage() {
  const [tab, setTab] = useState<"activity" | "meal">("activity");

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-800">
          {tab === "activity" ? "Log Activity" : "Log Meal"}
        </h1>
        <p className="text-gray-500 mt-1">
          {tab === "activity"
            ? "Every move counts — keep crushing it! 💪"
            : "Fuel matters too — track what you eat! 🥗"}
        </p>
      </div>

      <div className="flex gap-1 bg-purple-50 rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab("activity")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "activity" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-purple-600"}`}
        >
          🏋️ Activity
        </button>
        <button
          onClick={() => setTab("meal")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "meal" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-purple-600"}`}
        >
          🍽️ Meal
        </button>
      </div>

      {tab === "activity" ? <ActivityForm /> : <MealForm />}
    </div>
  );
}
