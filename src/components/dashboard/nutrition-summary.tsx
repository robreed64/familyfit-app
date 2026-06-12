import Link from "next/link";
import { getMealEmoji } from "@/lib/utils";

interface Meal {
  id: string;
  mealType: string;
  description: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export function NutritionSummary({ meals }: { meals: Meal[] }) {
  if (meals.length === 0) {
    return (
      <div className="text-center py-8 px-6">
        <div className="text-4xl mb-2">🍎</div>
        <p className="text-sm text-gray-500 mb-1">No meals logged today</p>
        <Link href="/log" className="text-xs text-purple-600 font-semibold hover:underline">
          + Log a meal
        </Link>
      </div>
    );
  }

  const totalCalories = meals.reduce((sum, m) => sum + (m.calories ?? 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein ?? 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs ?? 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + (m.fat ?? 0), 0);
  const hasMacros = totalProtein > 0 || totalCarbs > 0 || totalFat > 0;

  return (
    <div>
      <div className="px-6 pb-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-gray-800">{totalCalories.toLocaleString()}</span>
          <span className="text-xs text-gray-500 font-medium">kcal today</span>
        </div>
        {hasMacros && (
          <div className="text-xs text-gray-400 mt-0.5 flex gap-2">
            {totalProtein > 0 && <span>🍗 {totalProtein}g protein</span>}
            {totalCarbs > 0 && <span>🍞 {totalCarbs}g carbs</span>}
            {totalFat > 0 && <span>🧈 {totalFat}g fat</span>}
          </div>
        )}
      </div>
      <div className="divide-y divide-purple-50">
        {meals.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-6 py-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-lg flex-shrink-0">
              {getMealEmoji(m.mealType)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-700 capitalize">{m.mealType}</div>
              <div className="text-xs text-gray-400 truncate">{m.description}</div>
            </div>
            {m.calories != null && (
              <div className="text-sm font-bold text-emerald-600 flex-shrink-0">{m.calories} kcal</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
