import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { rm } from "fs/promises";
import path from "path";

export async function POST(req) {
  try {
    const { albumId } = await req.json();

    if (!albumId) {
      return NextResponse.json({ error: "Missing albumId" }, { status: 400 });
    }

    // ตรวจสอบว่า album มีอยู่
    const album = await prisma.albums.findUnique({
      where: { id: albumId },
      include: { photos: true }, // ดึง photos เพื่อเอาไปลบไฟล์
    });

    if (!album) {
      return NextResponse.json({ error: "Album ไม่พบ" }, { status: 404 });
    }

    // ลบไฟล์รูปทั้งหมดในโฟลเดอร์ public/uploads/[albumId]
    const uploadDir = path.join(process.cwd(), "public", "uploads", albumId);
    await rm(uploadDir, { recursive: true, force: true });

    // ลบ photos ใน MongoDB
    await prisma.photos.deleteMany({ where: { albumId } });

    // ลบ Album
    await prisma.albums.delete({ where: { id: albumId } });

    return NextResponse.json({ message: "ลบอัลบั้มสำเร็จ" });
  } catch (err) {
    console.error("Delete album error:", err);
    return NextResponse.json(
      { error: err.message || "ลบอัลบั้มไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
