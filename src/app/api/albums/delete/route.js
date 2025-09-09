import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { rm } from "fs/promises";
import path from "path";

export async function POST(req) {
  try {
    const { albumId } = await req.json();
    if (!albumId || typeof albumId !== "string") {
      return NextResponse.json({ error: "Missing or invalid albumId" }, { status: 400 });
    }

    // 1) ตรวจว่าอัลบั้มมีอยู่ (ไม่ต้อง include photos)
    const album = await prisma.albums.findUnique({
      where: { id: albumId },
      select: { id: true },
    });
    if (!album) {
      return NextResponse.json({ error: "Album ไม่พบ" }, { status: 404 });
    }

    // 2) ลบไฟล์จริงในโฟลเดอร์ public/uploads/[albumId]
    const uploadDir = path.join(process.cwd(), "public", "uploads", albumId);
    await rm(uploadDir, { recursive: true, force: true }); // force=true เงียบถ้าโฟลเดอร์ไม่มี

    // 3) ลบข้อมูลใน DB (ลูปทีเดียวด้วย transaction)
    await prisma.$transaction([
      prisma.photos.deleteMany({ where: { albumId } }),
      prisma.albums.delete({ where: { id: albumId } }),
    ]);

    return NextResponse.json({ message: "ลบอัลบั้มสำเร็จ" });
  } catch (err) {
    console.error("Delete album error:", err);
    return NextResponse.json(
      { error: err.message || "ลบอัลบั้มไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
