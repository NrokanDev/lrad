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

  // save temp
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const tempPath = path.join(process.cwd(), "temp_" + file.name);
  fs.writeFileSync(tempPath, buffer);

  // relative path ไปยัง python script
  const pythonScript = path.join(process.cwd(), "Backend", "prediction.py");

  try {
    const result = await new Promise((resolve, reject) => {
      const python = spawn("python", [pythonScript, tempPath]);

      let output = "";
      let errorOutput = "";

      python.stdout.on("data", (data) => (output += data.toString()));
      python.stderr.on("data", (data) => (errorOutput += data.toString()));

      python.on("close", (code) => {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); // ลบไฟล์ temp

        if (code !== 0) {
          console.error("Python stderr:", errorOutput);
          return reject(new Error("Python script failed"));
        }

        // parse exposure
        const match = output.match(/([Ee]xposure).*?:\s*([\d.-]+)/);
        let exposure = match ? parseFloat(match[2]) : null;

        if (exposure === null || isNaN(exposure)) {
          return reject(new Error("Could not parse exposure"));
        }

        resolve({ exposure });
      });
    });

    return NextResponse.json(result);
  } catch (err) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    console.error("Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
