import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { albumId } = params; // รับ albumId จาก URL

    // ดึง Album จาก MongoDB
    const album = await prisma.albums.findUnique({
      where: { id: albumId },
      select: { id: true, title: true }, // เราต้องการแค่ชื่อ
    });

    if (!album) {
      return NextResponse.json(
        { error: "ไม่พบอัลบั้ม" },
        { status: 404 }
      );
    }

    return NextResponse.json({ album });
  } catch (err) {
    console.error("Fetch album error:", err);
    return NextResponse.json(
      { error: "ไม่สามารถดึงชื่ออัลบั้มได้" },
      { status: 500 }
    );
  }
}
