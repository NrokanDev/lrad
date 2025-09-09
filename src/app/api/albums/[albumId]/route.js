import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic"; // กัน cache

export async function GET(_req, ctx) {
  // ⬇️ ต้อง await params ใน Next.js 15
  const { albumId } = await ctx.params;
  if (!albumId) {
    return NextResponse.json({ error: "Missing albumId" }, { status: 400 });
  }

  const items = await prisma.photos.findMany({
    where: { albumId },
    orderBy: { id: "desc" },
  });

  return NextResponse.json(items);
}
