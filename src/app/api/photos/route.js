import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import prisma from "@/lib/prisma"

export async function POST(req) {
  try {
    const formData = await req.formData()
    const albumId = formData.get("albumId")?.toString()
    const file = formData.get("photo")

    if (!albumId || !file) {
      return NextResponse.json(
        { error: "Missing albumId or file" },
        { status: 400 }
      )
    }

    console.log("[Upload] albumId:", albumId)
    console.log("[Upload] file name:", file.name)

    // ตรวจสอบว่า albumId มีอยู่จริงใน DB (Albums collection)
    const albumExists = await prisma.albums.findUnique({
      where: { id: albumId },
    })

    if (!albumExists) {
      return NextResponse.json(
        { error: "Album ไม่ถูกต้อง / ไม่พบใน DB" },
        { status: 400 }
      )
    }

    // แปลงไฟล์เป็น buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // สร้าง folder ถ้ายังไม่มี
    const uploadDir = path.join(process.cwd(), "public", "uploads", albumId)
    await mkdir(uploadDir, { recursive: true })
    const filePath = path.join(uploadDir, file.name)

    // เขียนไฟล์ลง folder
    await writeFile(filePath, buffer)
    const fileUrl = `/uploads/${albumId}/${file.name}`

    // ตรวจสอบก่อนว่ารูปนี้ยังไม่อยู่ใน DB (Photos collection)
    const exists = await prisma.photos.findFirst({
      where: { url: fileUrl, albumId: albumId },
    })

    if (exists) {
      return NextResponse.json(
        { message: "รูปนี้มีอยู่แล้วใน DB", photo: exists },
        { status: 200 }
      )
    }

    // บันทึกลง MongoDB (Photos collection)
    const photo = await prisma.photos.create({
      data: {
        url: fileUrl,
        albumId: albumId,
        caption: "",
        exposure: 0,
        contrast: 0,
        highlight: 0,
        shadow: 0,
      },
    })

    console.log("[Upload] Photo saved:", photo)

    return NextResponse.json({ message: "อัปโหลดสำเร็จ", photo })
  } catch (err) {
    console.error("[Upload] error:", err)
    return NextResponse.json(
      { error: err.message || "อัปโหลดไม่สำเร็จ" },
      { status: 500 }
    )
  }
}
