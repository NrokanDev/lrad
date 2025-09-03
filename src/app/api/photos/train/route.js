import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { photoId, exposure, contrast, highlight, shadow } = body;

    if (!photoId) {
      return NextResponse.json({ error: "Missing photoId" }, { status: 400 });
    }

    // ✅ Prisma MongoDB ใช้ string ObjectId ได้เลย
    const updated = await prisma.photos.update({
      where: { id: photoId.toString() },
      data: {
        exposure,
        contrast,
        highlight,
        shadow,
      },
    });

    return NextResponse.json({ success: true, photo: updated });
  } catch (err) {
    console.error("Error training photo:", err);
    return NextResponse.json(
      { error: "Failed to train photo" },
      { status: 500 }
    );
  }
}
