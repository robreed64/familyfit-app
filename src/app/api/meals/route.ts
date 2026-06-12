import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MEAL_TYPES } from "@/lib/utils";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const date = searchParams.get("date");

  let dateFilter = {};
  if (date) {
    const dayStart = new Date(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    dateFilter = { mealDate: { gte: dayStart, lt: dayEnd } };
  }

  const meals = await db.meal.findMany({
    where: { userId: session.user.id, ...dateFilter },
    orderBy: { mealDate: "desc" },
    take: limit,
    skip: offset,
  });

  return NextResponse.json(meals);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { mealType, description, calories, protein, carbs, fat, notes, mealDate } = body;

  if (!mealType || !(MEAL_TYPES as readonly string[]).includes(mealType)) {
    return NextResponse.json({ error: "Valid meal type required" }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json({ error: "Description required" }, { status: 400 });
  }

  const meal = await db.meal.create({
    data: {
      userId: session.user.id,
      mealType,
      description,
      calories: calories ? parseInt(calories) : null,
      protein: protein ? parseInt(protein) : null,
      carbs: carbs ? parseInt(carbs) : null,
      fat: fat ? parseInt(fat) : null,
      notes: notes || null,
      mealDate: mealDate ? new Date(mealDate) : new Date(),
    },
  });

  return NextResponse.json(meal, { status: 201 });
}
