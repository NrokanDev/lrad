import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ใช้เช็คว่า route โลดแล้ว
export async function GET() {
  return NextResponse.json({ ok: true, route: "photos/upload" });
}

// กัน preflight
export async function OPTIONS() {
  return NextResponse.json({}, { status: 204 });
}

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const albumId = form.get("albumId");

    if (!file || !albumId) {
      return NextResponse.json({ error: "Missing file or albumId" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
    const id = randomUUID();

    const dir = path.join(process.cwd(), "public", "uploads", albumId);
    await fs.mkdir(dir, { recursive: true });

    const filename = `${id}.${ext}`;
    const filepath = path.join(dir, filename);
    await fs.writeFile(filepath, buffer);

    const url = `/uploads/${albumId}/${filename}`;

    const photo = await prisma.photos.create({
      data: {
        albumId,
        url,
        caption: "",
        contrast: null,
        exposure: null,
        highlight: null,
        shadow: null,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (e) {
    console.error("upload error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
