import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { photoId } = await req.json();

    if (!photoId) {
      return NextResponse.json({ error: "Missing photoId" }, { status: 400 });
    }

    // ลบ record ใน MongoDB
    await prisma.photos.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ message: "ลบรูปสำเร็จ" });
  } catch (err) {
    console.error("Delete photo error:", err);
    return NextResponse.json({ error: err.message || "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
