import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const activity = await db.activity.findUnique({ where: { id } });

  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (activity.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.activity.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
