import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { albumId } = params;

    // ดึงรูปทั้งหมดของ albumId
    const photos = await prisma.photos.findMany({
      where: { albumId },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ photos });
  } catch (err) {
    console.error("Fetch photos error:", err);
    return NextResponse.json({ error: "ไม่สามารถดึงรูปได้" }, { status: 500 });
  }
}
