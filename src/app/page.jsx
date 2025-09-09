// lrad/src/app/page.jsx
"use client";
import { useState } from "react";
import Image from "next/image";

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [tone, setTone] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const toneMap = {
    "งานแต่ง": "wedding",
    "งานบวช": "buat",
    "พอร์ต-รับปริญญา": "portfolio",
  };

  const IMAGE_BOX_CLASS = "h-[320px] w-full flex items-center justify-center";
  const IMG_CLASS = "max-h-full max-w-full object-contain rounded-lg shadow-md";

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    setPreview(uploadedFile ? URL.createObjectURL(uploadedFile) : null);
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!file || !tone) {
      alert("กรุณาอัพโหลดรูปและเลือกโทนก่อน");
      return;
    }
    setResult(null);
    setLoading(true);
    setProgress(0);

    let percent = 0;
    const interval = setInterval(() => {
      percent += 12;
      setProgress(Math.min(percent, 95));
    }, 250);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tone", toneMap[tone]);
      formData.append("return_image", "1"); // ✅ ขอรูป After

      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Predict failed");
      setResult(data);
      setProgress(100);
    } catch (err) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center mt-12">
      <div className="bg-gray-50 border rounded-2xl shadow-2xl w-[1000px] min-h-[700px] p-8 flex flex-col items-center">
        {/* Upload + Result */}
        <div className="flex gap-6 justify-center">
          {/* Upload */}
          <div className="h-[450px] w-[450px] flex flex-col justify-start items-center border rounded-2xl shadow-2xl p-6">
            <div className={IMAGE_BOX_CLASS}>
              {preview ? (
                <img src={preview} alt="Preview" className={IMG_CLASS} />
              ) : (
                <p className="text-gray-400">ยังไม่มีรูป</p>
              )}
            </div>

            <input
              type="file"
              id="fileInput"
              onChange={handleFileChange}
              className="hidden"
              accept=".jpg,.jpeg,image/jpeg"
            />

            <label
              htmlFor="fileInput"
              className="cursor-pointer bg-purple-500 px-3 pt-2 mt-3 rounded-xl text-white hover:scale-110 duration-300 flex flex-col items-center"
            >
              <Image src="/upload-icon.png" alt="upload" width={30} height={10} />
              <p>Upload</p>
            </label>

            {!preview && (
              <p className="mt-3 text-gray-500 text-sm">
                Only JPG or JPEG file formats are supported.
              </p>
            )}
          </div>

          {/* Result */}
          <div className="min-h-[450px] w-[450px] flex flex-col border rounded-2xl shadow-md p-6 bg-white">
            {loading && (
              <div className="w-full">
                <div className="w-full bg-gray-200 rounded-xl overflow-hidden h-6">
                  <div
                    className="h-6 bg-purple-500 transition-all duration-300 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm mt-2 text-center">{progress}%</p>
              </div>
            )}

            {!loading && (
              <>
                <div className={IMAGE_BOX_CLASS}>
                  {result?.afterImage ? (
                    <img
                      src={result.afterImage}
                      alt="After"
                      className={IMG_CLASS}
                    />
                  ) : (
                    <p className="text-gray-500 text-center">Waiting for result...</p>
                  )}
                </div>

                {result && (
                  <div className="mt-4 grid grid-cols-2 gap-x-4 text-sm">
                    <p>Exposure: {result.Exposure2012}</p>
                    <p>Contrast: {result.Contrast2012}</p>
                    <p>Highlights: {result.Highlights2012}</p>
                    <p>Shadows: {result.Shadows2012}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* File Name */}
        <div className="mt-5 p-1 bg-gray-50 border rounded-xl w-[450px]">
          <label>File Name: </label>
          <input
            type="text"
            value={file?.name || ""}
            readOnly
            className="w-[350px] bg-transparent"
          />
        </div>

        {/* Tone */}
        <div className="mt-5 p-1 bg-gray-50 border rounded-xl w-[450px]">
          <p className="bg-gray-100 p-2 rounded-xl">Select Tone</p>
          {["งานแต่ง", "งานบวช", "พอร์ต-รับปริญญา"].map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`m-1 border p-1 rounded-xl border-gray-300 ${
                tone === t ? "bg-gray-800 text-white" : "bg-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Submit */}
        <button
          className="mt-5 w-[250px] py-2 rounded-xl text-white
                     bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600
                     hover:from-purple-500 hover:via-purple-600 hover:to-purple-700"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
