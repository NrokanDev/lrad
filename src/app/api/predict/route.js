import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // 🔹 save ไฟล์ชั่วคราว
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const tempPath = path.join(process.cwd(), "temp_" + file.name);
  fs.writeFileSync(tempPath, buffer);

  // ✅ path ไปยัง predict.py
  const pythonScript = path.join("C:\\Users\\nroka\\Desktop\\Project\\Backend\\prediction.py");
  // const pythonScript = path.join("C:\\Users\\nroka\\Desktop\\Project\\Backend\\prediction.py"); //PC

  return new Promise((resolve) => {
    const python = spawn("python", [pythonScript, tempPath]);

    let output = "";
    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
    });

    python.on("close", () => {
      // ลบไฟล์ temp ถ้ายังมีอยู่
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      // ดึง exposure จากข้อความที่ predict.py print ออกมา
      const match = output.match(/([Ee]xposure).*?:\s*([\d.-]+)/);
      const exposure = match ? parseFloat(match[2]) : null;

      resolve(NextResponse.json({ exposure }));
    });
  });
}
