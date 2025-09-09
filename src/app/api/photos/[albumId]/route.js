// src/app/api/photos/[albumId]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req, ctx) {
  const { albumId } = await ctx.params; // ⬅ ต้อง await
  if (!albumId) {
    return NextResponse.json({ error: "Missing albumId" }, { status: 400 });
  }

  try {
    const items = await prisma.photos.findMany({
      where: { albumId },
      orderBy: { id: "desc" }, // เอาออกได้ถ้า schema ไม่รองรับ
    });
    return NextResponse.json(items);
  } catch (e) {
    console.error("GET photos error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
