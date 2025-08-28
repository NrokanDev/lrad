"use client";
import { useState } from "react";
import Image from "next/image";

const HomePage = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [tone, setTone] = useState("");
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    setPreview(URL.createObjectURL(uploadedFile));
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("กรุณาอัพโหลดรูปและเลือกโทนก่อน");
      return;
    }

    setResult(null);
    setLoading(true);
    setProgress(0);

    let percent = 0;
    const interval = setInterval(() => {
      percent += 10;
      setProgress(percent);
      if (percent >= 100) {
        clearInterval(interval);
      }
    }, 300);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tone", tone);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      console.log(err);
      alert("Backend Something Wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <div className="flex justify-center mt-[50px]">
        <center className="bg-gray-50 border border-gray-300 rounded-2xl shadow-2xl w-[1000px] h-[700px] p-8">
          {/* Upload + Result side by side */}
          <div className="flex gap-6 justify-center">
            {/* Upload Box */}
            <div className="h-[400px] bg-gray-100 w-[450px] flex flex-col justify-center items-center rounded-2xl shadow-2xl p-6">
              <input
                type="file"
                id="fileInput"
                onChange={handleFileChange}
                className="hidden"
                accept=".jpg,.jpeg,image/jpeg"
              />

              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="mt-4 rounded-lg shadow-md max-h-[300px]"
                />
              )}

              <label
                htmlFor="fileInput"
                className="cursor-pointer bg-gray-800 px-3 pt-2 mt-2 rounded-xl text-white hover:scale-110 duration-300 flex flex-col items-center"
              >
                <Image
                  className="ms-1"
                  src="/upload-icon.png"
                  alt="upload icon"
                  width={30}
                  height={10}
                />
                <p>Upload</p>
              </label>
              {!preview && (
                <p className="mt-3 text-gray-500">
                  Only JPG or JPEG file formats are supported.
                </p>
              )}
            </div>

            {/* Result / Progress Box */}
            <div className=" h-min w-[450px] flex flex-col justify-center items-center border border-gray-300 rounded-2xl shadow-md p-6 bg-white">
              {loading && (
                <div className="w-full">
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-xl overflow-hidden h-6">
                    <div
                      className="h-6 bg-purple-500 transition-all duration-300 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm mt-2 text-center">{progress}%</p>
                </div>
              )}

              {!result && (
                <p className="text-gray-500 mt-4">Waiting for result...</p>
              )}

              {result && (
                <p className="text-gray-800 text-lg mt-4">
                  Exposure: {result.exposure}
                </p>
              )}
            </div>
          </div>

          {/* File Name */}
          <div className="mt-5 p-1 bg-gray-50 border border-gray-300 rounded-xl w-[450px]">
            <label>File Name: </label>
            <input
              type="text"
              value={file?.name || ""}
              readOnly
              className="w-[350px]"
            />
          </div>

          {/* Tone Selection */}
          <div className="mt-5 p-1 bg-gray-50 border border-gray-300 rounded-xl w-[450px]">
            <p className="bg-gray-100 p-2 rounded-xl">Select Tone</p>

            <button
              onClick={() => setTone("งานแต่ง")}
              className={
                "m-1 border p-1 rounded-xl border-gray-300" +
                (tone === "งานแต่ง" ? " bg-gray-800 text-white" : " bg-white")
              }
            >
              งานแต่ง
            </button>

            <button
              onClick={() => setTone("งานบวช")}
              className={
                "m-1 border p-1 rounded-xl border-gray-300" +
                (tone === "งานบวช" ? " bg-gray-800 text-white" : " bg-white")
              }
            >
              งานบวช
            </button>

            <button
              onClick={() => setTone("พอร์ต-รับปริญญา")}
              className={
                "m-1 border p-1 rounded-xl border-gray-300" +
                (tone === "พอร์ต-รับปริญญา"
                  ? " bg-gray-800 text-white"
                  : " bg-white")
              }
            >
              พอร์ต-รับปริญญา
            </button>
          </div>

          {/* Submit Button */}
          <div className="mt-5 w-[250px] p-1 text-white py-2 rounded-xl 
             bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600
             hover:from-purple-500 hover:via-purple-600 hover:to-purple-700
             transition-colors">
            <button className="text-white" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </center>
      </div>
    </div>
  );
};

export default HomePage;
