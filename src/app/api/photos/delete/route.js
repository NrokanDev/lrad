import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { photoId, albumId } = await req.json();
    if (!photoId || !albumId) {
      return NextResponse.json({ error: "Missing photoId or albumId" }, { status: 400 });
    }

    // หา photo
    const photo = await prisma.photos.findUnique({ where: { id: photoId } });
    if (!photo) return NextResponse.json({ error: "ไม่พบรูป" }, { status: 404 });

    // helper: แปลง URL เป็นพาธไฟล์จริงใน public
    const toAbs = (u) => path.join(process.cwd(), "public", (u || "").replace(/^\//, ""));

    // ลบไฟล์ต้นฉบับและ after (ถ้ามี)
    try { await fs.rm(toAbs(photo.url), { force: true }); } catch {}
    if (photo.afterUrl) {
      try { await fs.rm(toAbs(photo.afterUrl), { force: true }); } catch {}
    }

    // ลบแถว DB
    await prisma.photos.delete({ where: { id: photoId } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("delete-photo error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
