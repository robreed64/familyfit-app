import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const record = await db.personalToken.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ token: record?.token ?? null });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = nanoid(32);

  await db.personalToken.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, token },
    update: { token },
  });

  return NextResponse.json({ token });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.personalToken.delete({ where: { userId: session.user.id } }).catch(() => null);
  return NextResponse.json({ success: true });
}
